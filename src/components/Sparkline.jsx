/**
 * Sparkline — lightweight SVG price-line for list-view rows.
 *
 * Fetches 1-month of daily closes from /api/history and renders an SVG
 * area+line chart. Uses a module-level cache so the same ticker is only
 * fetched once per page session.
 *
 * Props:
 *   ticker  – symbol string
 *   width   – SVG width  (default 180)
 *   height  – SVG height (default 60)
 */

import { useState, useEffect } from 'react';

// ── Module-level cache (survives re-renders, cleared on page reload) ────
const _cache   = {};   // ticker → closes[]
const _pending = {};   // ticker → Promise

async function loadCloses(ticker) {
  if (_cache[ticker])   return _cache[ticker];
  if (_pending[ticker]) return _pending[ticker];

  _pending[ticker] = fetch(`/api/history?symbols=${ticker}&range=1mo`)
    .then(r => r.json())
    .then(data => {
      const closes = (data[ticker]?.closes || []).filter(v => v != null && isFinite(v));
      _cache[ticker] = closes;
      return closes;
    })
    .catch(() => {
      _cache[ticker] = [];
      return [];
    })
    .finally(() => { delete _pending[ticker]; });

  return _pending[ticker];
}

export default function Sparkline({ ticker, width = 180, height = 60 }) {
  const [closes, setCloses] = useState(_cache[ticker] || null);

  useEffect(() => {
    let alive = true;
    if (!_cache[ticker]) {
      loadCloses(ticker).then(c => { if (alive) setCloses(c); });
    }
    return () => { alive = false; };
  }, [ticker]);

  // ── Loading placeholder ───────────────────────────────────────────────
  if (!closes) {
    return (
      <div style={{
        width, height,
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 4,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)', fontFamily: 'monospace' }}>…</span>
      </div>
    );
  }

  // ── Empty / insufficient data ─────────────────────────────────────────
  if (closes.length < 3) {
    return (
      <div style={{
        width, height,
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 4,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.12)', fontFamily: 'monospace' }}>N/A</span>
      </div>
    );
  }

  // ── Build SVG paths ───────────────────────────────────────────────────
  const padX = 2, padY = 4;
  const innerW = width  - padX * 2;
  const innerH = height - padY * 2;

  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;

  const pts = closes.map((c, i) => {
    const x = padX + (i / (closes.length - 1)) * innerW;
    const y = padY + innerH - ((c - min) / range) * innerH;
    return [x, y];
  });

  const polyline = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

  // Closed area polygon (add bottom-left → bottom-right corners)
  const area = [
    `${pts[0][0].toFixed(1)},${(padY + innerH).toFixed(1)}`,
    ...pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`),
    `${pts[pts.length - 1][0].toFixed(1)},${(padY + innerH).toFixed(1)}`,
  ].join(' ');

  const isUp = closes[closes.length - 1] >= closes[0];
  const stroke = isUp ? '#34d399' : '#f87171';
  const fill   = isUp ? 'rgba(52,211,153,0.10)' : 'rgba(248,113,113,0.10)';

  return (
    <svg
      width={width}
      height={height}
      style={{ display: 'block', borderRadius: 4, overflow: 'hidden' }}
      viewBox={`0 0 ${width} ${height}`}
    >
      {/* Area fill */}
      <polygon points={area} fill={fill} />
      {/* Price line */}
      <polyline
        points={polyline}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
