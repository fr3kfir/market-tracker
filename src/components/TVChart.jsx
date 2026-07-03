/**
 * TVChart — real candlestick chart using TradingView lightweight-charts v5.
 *
 * Replaces the TradingView iframe embed (which fails to render in production).
 * Fetches OHLCV data from /api/history, computes MA50 + MA200 locally,
 * and renders with lightweight-charts (already installed).
 *
 * Props:
 *   ticker   – symbol string, e.g. "AAPL"
 *   range    – "1h" | "4h" | "1D" | "1W" | "1M"  (Screener timeframe keys)
 *   height   – chart height in px (default 320)
 */

import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  ColorType,
} from 'lightweight-charts';

// ── Range mapping: candle-interval key → API params ───────────────────────
// Each Screener timeframe key controls the CANDLE SIZE. The API is asked for
// the matching Yahoo interval; '4h' is aggregated client-side from 60m bars.
const RANGE_CONFIG = {
  '1h': { api: '5d',  interval: '60m', aggregate: 1, intraday: true },
  '4h': { api: '1mo', interval: '60m', aggregate: 4, intraday: true },
  '1D': { api: '3mo', interval: '1d' },
  '1W': { api: '2y',  interval: '1wk' },
  '1M': { api: '5y',  interval: '1mo' },
};

// Merge n sequential bars into one (open=first, high=max, low=min, close=last).
// Buckets reset at day boundaries so a 4h candle never spans two sessions.
function aggregateBars(bars, n) {
  if (n <= 1) return bars;
  const out = [];
  let bucket = null, count = 0, day = null;
  for (const b of bars) {
    const d = new Date(b.time * 1000).toISOString().slice(0, 10);
    if (!bucket || count >= n || d !== day) {
      if (bucket) out.push(bucket);
      bucket = { ...b };
      count = 1;
      day = d;
    } else {
      bucket.high    = Math.max(bucket.high, b.high);
      bucket.low     = Math.min(bucket.low, b.low);
      bucket.close   = b.close;
      bucket.volume += b.volume;
      count++;
    }
  }
  if (bucket) out.push(bucket);
  return out;
}

// ── Module-level OHLCV cache (per ticker+range key) ───────────────────────
const _cache   = {};
const _pending = {};

async function loadOHLCV(ticker, rangeKey) {
  const cfg = RANGE_CONFIG[rangeKey] || RANGE_CONFIG['1D'];
  const key = `${ticker}:${cfg.api}:${cfg.interval}`;
  if (_cache[key])   return _cache[key];
  if (_pending[key]) return _pending[key];

  _pending[key] = fetch(`/api/history?symbols=${ticker}&range=${cfg.api}&interval=${cfg.interval}`)
    .then(r => r.json())
    .then(data => {
      const raw = (data[ticker]?.ohlcv || []).filter(d => d.close != null && d.open != null);
      const bars = aggregateBars(raw, cfg.aggregate || 1);
      const candles = bars.map(d => ({
        // Intraday bars keep epoch seconds so the axis shows real times;
        // daily+ bars use date strings so the axis shows dates only.
        time:   cfg.intraday ? d.time : new Date(d.time * 1000).toISOString().split('T')[0],
        open:   d.open,
        high:   d.high,
        low:    d.low,
        close:  d.close,
        volume: d.volume || 0,
      }));
      _cache[key] = candles;
      return candles;
    })
    .catch(() => {
      _cache[key] = [];
      return [];
    })
    .finally(() => { delete _pending[key]; });

  return _pending[key];
}

// ── SMA helper ────────────────────────────────────────────────────────────
function calcSMA(candles, period) {
  if (candles.length < period) return [];
  const result = [];
  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += candles[j].close;
    result.push({ time: candles[i].time, value: sum / period });
  }
  return result;
}

// ── Chart appearance ──────────────────────────────────────────────────────
const BG     = '#0d1117';
const GRID   = 'rgba(26,37,64,0.9)';
const TEXT   = '#64748b';
const BORDER = '#1a2540';

export default function TVChart({ ticker, range = '1D', height = 320 }) {
  const containerRef      = useRef(null);
  const chartRef          = useRef(null);
  const [ohlcv, setOhlcv] = useState(null);
  const [error, setError] = useState(false);

  const rangeKey = RANGE_CONFIG[range] ? range : '1D';
  const intraday = !!RANGE_CONFIG[rangeKey].intraday;

  // ── Fetch when ticker or range changes ───────────────────────────────
  useEffect(() => {
    let alive = true;
    setOhlcv(null);
    setError(false);
    loadOHLCV(ticker, rangeKey)
      .then(data => { if (alive) setOhlcv(data); })
      .catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [ticker, rangeKey]);

  // ── Build chart when data is ready ───────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container || ohlcv === null) return;

    // Clean up previous instance
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }
    if (!ohlcv.length) return;

    const w = container.clientWidth || 380;

    const chart = createChart(container, {
      width:  w,
      height,
      layout: {
        background: { type: ColorType.Solid, color: BG },
        textColor: TEXT,
        fontSize: 10,
      },
      // Explicit locale — lightweight-charts falls back to navigator.language,
      // which can be an invalid Intl tag on some systems and break rendering
      localization: { locale: 'en-US' },
      grid: {
        vertLines: { color: GRID },
        horzLines: { color: GRID },
      },
      crosshair: { mode: 1 },
      rightPriceScale: {
        borderColor: BORDER,
        scaleMargins: { top: 0.08, bottom: 0.22 },
      },
      timeScale: {
        borderColor: BORDER,
        timeVisible: intraday, // show HH:MM only for intraday candles
        secondsVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      handleScroll: true,
      handleScale:  true,
    });
    chartRef.current = chart;

    // ── Candlesticks ──────────────────────────────────────────────────
    const cSeries = chart.addSeries(CandlestickSeries, {
      upColor:       '#26a69a',
      downColor:     '#ef5350',
      borderVisible: false,
      wickUpColor:   '#26a69a',
      wickDownColor: '#ef5350',
    });
    cSeries.setData(ohlcv);

    // ── MA 50 (orange) ───────────────────────────────────────────────
    const ma50 = calcSMA(ohlcv, 50);
    if (ma50.length) {
      const ma50s = chart.addSeries(LineSeries, {
        color: '#f97316', lineWidth: 1.5,
        priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
      });
      ma50s.setData(ma50);
    }

    // ── MA 200 (red) ─────────────────────────────────────────────────
    const ma200 = calcSMA(ohlcv, 200);
    if (ma200.length) {
      const ma200s = chart.addSeries(LineSeries, {
        color: '#dc2626', lineWidth: 1.5,
        priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
      });
      ma200s.setData(ma200);
    }

    // ── Volume (overlaid, bottom 20%) ─────────────────────────────────
    const volData = ohlcv.map(d => ({
      time:  d.time,
      value: d.volume,
      color: d.close >= d.open ? 'rgba(38,166,154,0.45)' : 'rgba(239,83,80,0.45)',
    }));
    const volSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });
    volSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    volSeries.setData(volData);

    chart.timeScale().fitContent();

    // ── Resize observer ───────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      if (container.clientWidth > 0 && chartRef.current) {
        chartRef.current.applyOptions({ width: container.clientWidth });
      }
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [ohlcv, height, intraday]);

  return (
    <div style={{ position: 'relative', width: '100%', height, background: BG }}>
      <div ref={containerRef} style={{ width: '100%', height }} />

      {/* Loading state */}
      {ohlcv === null && !error && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#334155', fontSize: 11, fontFamily: 'monospace',
          pointerEvents: 'none',
        }}>
          Loading…
        </div>
      )}

      {/* Error or no data */}
      {(error || (ohlcv !== null && ohlcv.length === 0)) && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#475569', fontSize: 11, fontFamily: 'monospace',
          pointerEvents: 'none',
        }}>
          No data
        </div>
      )}
    </div>
  );
}
