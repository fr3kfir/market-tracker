import { useState, useEffect, useMemo } from 'react';
import { INDUSTRY_GROUPS, THEME_ETFS, HOT_THEMES, ALL_SYMBOLS, ALL_INDUSTRY_SYMBOLS, MONITOR_ETF_SYMBOLS } from '../data/stockUniverse';
import { fetchRelativeStrengthData } from '../services/relativeStrength';
import { STAGE_COLORS } from './StageOverview';
import TickerInfoPopup from './TickerInfoPopup';

const RS_COLOR = rs => rs >= 80 ? '#10b981' : rs >= 60 ? '#3b82f6' : rs >= 40 ? '#f59e0b' : '#e879f9';

// Symbols that are ETFs / benchmark — never rank them as stocks
const ETF_SET = new Set([...Object.values(THEME_ETFS), ...HOT_THEMES.map(t => t.etf), ...MONITOR_ETF_SYMBOLS, 'SPY']);

const TIMEFRAMES = [
  { key: 'today',    label: 'Today',    needsHistory: false },
  { key: 'rel1w',    label: '1W',       needsHistory: true },
  { key: 'rel1m',    label: '1M',       needsHistory: true },
  { key: 'rel3m',    label: '3M',       needsHistory: true },
  { key: 'rel6m',    label: '6M',       needsHistory: true },
  { key: 'weighted', label: 'Weighted', needsHistory: true },
];

const LIQUIDITY_OPTIONS = [
  { label: 'All',    value: 0 },
  { label: '≥$10M',  value: 10e6 },
  { label: '≥$50M',  value: 50e6 },
];

function RelBadge({ value }) {
  if (value == null) return <span style={{ color: 'var(--text-faint)', fontFamily: 'monospace', fontSize: 11 }}>—</span>;
  const pos = value >= 0;
  return (
    <span style={{
      fontFamily: 'monospace', fontWeight: 700, fontSize: 11,
      color: pos ? '#34d399' : '#f87171',
      background: pos ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
      padding: '2px 6px', borderRadius: 20,
    }}>
      {pos ? '+' : ''}{value.toFixed(1)}%
    </span>
  );
}

function PctCell({ value, posColor = '#38bdf8', negColor = '#f472b6' }) {
  if (value == null) return <span style={{ color: 'var(--text-faint)', fontFamily: 'monospace', fontSize: 11 }}>—</span>;
  return (
    <span style={{ fontFamily: 'monospace', fontSize: 11, color: value >= 0 ? posColor : negColor }}>
      {value >= 0 ? '+' : ''}{value.toFixed(1)}%
    </span>
  );
}

function RankTable({ title, subtitle, accent, rows, tfLabel, hasHistory, onTickerClick, onClip }) {
  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: accent }}>{title}</span>
        <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>{subtitle}</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="w-full text-xs" style={{ minWidth: 560 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['#', 'Ticker', 'Price', 'Day', `vs SPY (${tfLabel})`, 'RS', 'Hold', 'vs 50d', '52wH', 'Stage', ''].map((h, i) => (
                <th key={i} style={{
                  padding: '8px 8px', color: 'var(--text-faint)', fontSize: 9, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap',
                  textAlign: i === 0 || i === 1 ? 'left' : i >= 9 ? 'center' : 'right',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((s, i) => (
              <tr
                key={s.ticker}
                style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '7px 8px', fontFamily: 'monospace', color: 'var(--text-faint)' }}>{i + 1}</td>
                <td style={{ padding: '7px 8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span
                      onClick={() => onTickerClick(s)}
                      title={s.name}
                      style={{ fontFamily: 'monospace', fontWeight: 700, color: '#60a5fa', cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted' }}
                    >
                      {s.ticker}
                    </span>
                    {s.rsLineDist != null && s.rsLineDist >= -0.25 && (
                      <span title="RS line at 3-month new high — leadership tell" style={{ fontSize: 9, color: '#fbbf24' }}>★</span>
                    )}
                  </div>
                  {s.groupName && (
                    <div style={{ fontSize: 8.5, color: 'var(--text-faint)', whiteSpace: 'nowrap', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {s.groupName}{s.groupRank ? ` · #${s.groupRank}` : ''}
                    </div>
                  )}
                </td>
                <td style={{ padding: '7px 8px', fontFamily: 'monospace', color: 'var(--text)', textAlign: 'right' }}>${s.price.toFixed(2)}</td>
                <td style={{ padding: '7px 8px', textAlign: 'right' }}>
                  <PctCell value={s.change} posColor="#34d399" negColor="#f87171" />
                </td>
                <td style={{ padding: '7px 8px', textAlign: 'right' }}>
                  <RelBadge value={s.metric} />
                </td>
                <td style={{ padding: '7px 8px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
                    <div style={{ width: 34, height: 4, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${s.rsDisplay}%`, backgroundColor: RS_COLOR(s.rsDisplay), borderRadius: 99 }} />
                    </div>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 11, color: RS_COLOR(s.rsDisplay), width: 18, textAlign: 'right' }}>{s.rsDisplay}</span>
                  </div>
                </td>
                <td style={{ padding: '7px 8px', textAlign: 'right' }} title="Avg outperformance vs SPY on market DOWN days (last month). Positive = holds up in pullbacks.">
                  <PctCell value={s.pullbackHold} posColor="#34d399" negColor="#f87171" />
                </td>
                <td style={{ padding: '7px 8px', textAlign: 'right' }}>
                  <PctCell value={s.distSma50} />
                </td>
                <td style={{ padding: '7px 8px', textAlign: 'right' }} title="Distance from 52-week high">
                  <PctCell value={s.distSma52wHigh} posColor="#38bdf8" negColor="var(--text-muted)" />
                </td>
                <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                  <span style={{
                    fontFamily: 'monospace', fontWeight: 700, fontSize: 10, padding: '1px 5px', borderRadius: 4,
                    color: STAGE_COLORS[s.stage],
                    background: STAGE_COLORS[s.stage] + '22',
                    border: `1px solid ${STAGE_COLORS[s.stage]}44`,
                  }}>
                    {s.stage}
                  </span>
                </td>
                <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                  {onClip && (
                    <button
                      onClick={() => onClip(s.ticker, s.name)}
                      title="Add to watchlist (click again to cycle Long → Short → Universe)"
                      style={{
                        width: 18, height: 18, borderRadius: 5, border: '1px solid var(--border)',
                        background: 'var(--bg-elevated)', color: 'var(--text-muted)',
                        fontSize: 11, lineHeight: 1, cursor: 'pointer',
                      }}
                    >+</button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={11} style={{ padding: '18px 12px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 11 }}>
                  {hasHistory ? 'No stocks match the current filters' : 'Computing relative strength…'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GroupChips({ label, groups, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>{label}</span>
      {groups.map(g => (
        <span key={g.name} style={{
          fontSize: 10, fontFamily: 'monospace', fontWeight: 600,
          padding: '2px 8px', borderRadius: 20,
          color, background: color + '18', border: `1px solid ${color}33`,
          whiteSpace: 'nowrap',
        }}>
          {g.name} <span style={{ opacity: 0.7 }}>RS {g.avgRS}</span>
        </span>
      ))}
    </div>
  );
}

const UNIVERSE_SYMBOLS = [...new Set([...ALL_SYMBOLS, ...ALL_INDUSTRY_SYMBOLS])];

export default function LeadersLaggards({ stocksByTicker, industryGroupData, onClip }) {
  const [rsData, setRsData] = useState(null);
  const [rsLoading, setRsLoading] = useState(true);
  const [tf, setTf] = useState('weighted');
  const [strict, setStrict] = useState(false);
  const [top40Only, setTop40Only] = useState(false);
  const [minDollarVol, setMinDollarVol] = useState(10e6);
  const [count, setCount] = useState(25);
  const [popupStock, setPopupStock] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchRelativeStrengthData(UNIVERSE_SYMBOLS);
        if (!cancelled) setRsData(data);
      } catch (e) {
        console.error('Relative strength error:', e);
      } finally {
        if (!cancelled) setRsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ticker → best-ranked industry group
  const groupByTicker = useMemo(() => {
    const rankByName = Object.fromEntries((industryGroupData || []).map(g => [g.name, g.rank]));
    const map = {};
    INDUSTRY_GROUPS.forEach(g => {
      const rank = rankByName[g.name];
      g.tickers.forEach(t => {
        if (!map[t] || (rank && (!map[t].rank || rank < map[t].rank))) {
          map[t] = { name: g.name, rank };
        }
      });
    });
    return map;
  }, [industryGroupData]);

  const activeTf = TIMEFRAMES.find(t => t.key === tf) || TIMEFRAMES[0];
  const hasHistory = !!rsData && Object.keys(rsData.byTicker || {}).length > 0;

  const { leaders, laggards } = useMemo(() => {
    const rows = [];
    Object.values(stocksByTicker || {}).forEach(s => {
      if (ETF_SET.has(s.ticker)) return;
      const hist = rsData?.byTicker?.[s.ticker];
      const group = groupByTicker[s.ticker];

      const metric = tf === 'today'
        ? s.relVsMarket
        : (hist ? hist[tf] : null);
      if (metric == null) return;

      // Liquidity: average daily dollar volume
      const dollarVol = (s.avgVolume || 0) * s.price;
      if (minDollarVol && dollarVol < minDollarVol) return;

      if (top40Only && (!group?.rank || group.rank > 40)) return;

      rows.push({
        ...s,
        metric,
        rsDisplay: hist?.rsScore ?? s.rs,
        rsLineDist: hist?.rsLineDist ?? null,
        pullbackHold: hist?.pullbackHold ?? null,
        groupName: group?.name,
        groupRank: group?.rank,
      });
    });

    let leadPool = rows, lagPool = rows;
    if (strict) {
      // Ariel long setup: uptrend (S2), high RS, above 50dma, within striking distance of highs
      leadPool = rows.filter(s =>
        s.stage === 'S2' && s.rsDisplay >= 70 &&
        (s.distSma50 == null || s.distSma50 >= 0) &&
        (s.distSma52wHigh == null || s.distSma52wHigh >= -25)
      );
      // Ariel short/avoid: downtrend, weak RS, below 50dma
      lagPool = rows.filter(s =>
        (s.stage === 'S4' || (s.distSma50 != null && s.distSma50 < 0)) &&
        s.rsDisplay <= 40
      );
    }

    const byMetricDesc = (a, b) => b.metric - a.metric;
    return {
      leaders: [...leadPool].sort(byMetricDesc).slice(0, count),
      laggards: [...lagPool].sort(byMetricDesc).reverse().slice(0, count),
    };
  }, [stocksByTicker, rsData, groupByTicker, tf, strict, top40Only, minDollarVol, count]);

  const { strongGroups, weakGroups } = useMemo(() => {
    const g = industryGroupData || [];
    return { strongGroups: g.slice(0, 6), weakGroups: g.slice(-6).reverse() };
  }, [industryGroupData]);

  const btn = (active) => ({
    padding: '4px 10px', fontSize: 10, fontWeight: active ? 700 : 500,
    borderRadius: 6, border: `1px solid ${active ? '#3b82f6' : 'var(--border)'}`,
    background: active ? '#3b82f6' : 'transparent',
    color: active ? '#fff' : 'var(--text-muted)',
    cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header + controls */}
      <div className="panel" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>Leaders / Laggards — Relative Strength vs SPY</span>
          <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>
            Ariel's playbook: buy the strongest names in the strongest groups, avoid or short the weakest.
            {rsLoading && ' · computing multi-timeframe RS…'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          {/* Timeframe */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-faint)' }}>Rank by</span>
            {TIMEFRAMES.map(t => {
              const disabled = t.needsHistory && !hasHistory;
              return (
                <button
                  key={t.key} disabled={disabled}
                  onClick={() => setTf(t.key)}
                  style={{ ...btn(tf === t.key), opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
                  title={t.key === 'weighted' ? 'Weighted momentum vs SPY: 40% 3M · 30% 1M · 20% 6M · 10% 1W' : undefined}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Liquidity */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-faint)' }}>$ Vol/day</span>
            {LIQUIDITY_OPTIONS.map(o => (
              <button key={o.label} onClick={() => setMinDollarVol(o.value)} style={btn(minDollarVol === o.value)}>{o.label}</button>
            ))}
          </div>

          {/* Toggles */}
          <button onClick={() => setStrict(v => !v)} style={btn(strict)} title="Leaders: S2 · RS ≥ 70 · above 50dma · within 25% of 52w high. Laggards: S4 or below 50dma · RS ≤ 40.">
            ⚡ Strict Ariel
          </button>
          <button onClick={() => setTop40Only(v => !v)} style={btn(top40Only)} title="Only stocks in the Top-40 ranked industry groups">
            Top 40 Groups
          </button>

          {/* Count */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginLeft: 'auto' }}>
            {[25, 50].map(n => (
              <button key={n} onClick={() => setCount(n)} style={btn(count === n)}>Top {n}</button>
            ))}
          </div>
        </div>

        {/* Group strength strip */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <GroupChips label="Strongest groups" groups={strongGroups} color="#34d399" />
          <GroupChips label="Weakest groups" groups={weakGroups} color="#f87171" />
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3" style={{ alignItems: 'start' }}>
        <RankTable
          title="🚀 Leaders"
          subtitle={`outperforming SPY · ${activeTf.label}${strict ? ' · strict setup' : ''}`}
          accent="#34d399"
          rows={leaders}
          tfLabel={activeTf.label}
          hasHistory={hasHistory || tf === 'today'}
          onTickerClick={setPopupStock}
          onClip={onClip}
        />
        <RankTable
          title="🐌 Laggards"
          subtitle={`lagging SPY · ${activeTf.label}${strict ? ' · strict setup' : ''}`}
          accent="#f87171"
          rows={laggards}
          tfLabel={activeTf.label}
          hasHistory={hasHistory || tf === 'today'}
          onTickerClick={setPopupStock}
          onClip={onClip}
        />
      </div>

      <p style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-faint)', fontFamily: 'monospace', margin: 0 }}>
        vs SPY = stock return minus SPY return over the window · ★ = RS line at 3-month high ·
        Hold = avg outperformance on SPY down days (institutional support tell)
      </p>

      {popupStock && (
        <TickerInfoPopup
          ticker={popupStock.ticker}
          stock={popupStock}
          onClose={() => setPopupStock(null)}
          allStocks={leaders}
          onClip={onClip}
        />
      )}
    </div>
  );
}
