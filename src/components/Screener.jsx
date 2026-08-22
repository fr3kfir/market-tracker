import { useState, useEffect, useMemo, useCallback } from 'react';
import { SECTOR_STOCKS, INDUSTRY_GROUPS, ALL_SYMBOLS, ALL_INDUSTRY_SYMBOLS } from '../data/stockUniverse';
import { fetchRelativeStrengthData } from '../services/relativeStrength';
import TickerInfoPopup from './TickerInfoPopup';
import Sparkline from './Sparkline';
import TVChart from './TVChart';
import { CLIP_COLORS, CLIP_BG } from './ClipboardPanel';

const RS_COLOR = rs => rs >= 80 ? '#10b981' : rs >= 60 ? '#3b82f6' : rs >= 40 ? '#f59e0b' : '#e879f9';
const STAGE_COLORS = { S1: '#94a3b8', S2: '#60a5fa', S3: '#f59e0b', S4: '#f472b6' };
const SECTORS = Object.keys(SECTOR_STOCKS);
const FILTER_TABS = ['Descriptive', 'Fundamental', 'Technical', 'Performance'];

// ── Timeframe buttons — control the CANDLE INTERVAL (like Ariel's tool) ──
// Each key maps to a TradingView interval in MiniChart.jsx
const CHART_RANGES = [
  { key: '1h', label: '1H', title: '1-Hour candles · 5 days of history' },
  { key: '4h', label: '4H', title: '4-Hour candles · 1 month of history' },
  { key: '1D', label: '1D', title: 'Daily candles · 3 months of history' },
  { key: '1W', label: '1W', title: 'Weekly candles · 2 years of history' },
  { key: '1M', label: '1M', title: 'Monthly candles · 5 years of history' },
];

const CHARTS_PER_PAGE = 50; // Pagination

const UNIVERSE_SYMBOLS = [...new Set([...ALL_SYMBOLS, ...ALL_INDUSTRY_SYMBOLS])];

// ADR% color: Ariel only trades names that move — ≥3.5% is tradeable
const ADR_COLOR = adr => adr >= 5 ? '#a78bfa' : adr >= 3.5 ? '#34d399' : adr >= 2 ? '#f59e0b' : '#f87171';

// ── Group Rank filter options ───────────────────────────────────────────
const GROUP_RANK_OPTIONS = [
  { label: 'All',    value: null },
  { label: 'Top 10', value: 10  },
  { label: 'Top 20', value: 20  },
  { label: 'Top 40', value: 40  },
];

// ── Presets ─────────────────────────────────────────────────────────────
const PRESETS = [
  {
    label: '⚡ Ariel Setup',
    desc:  'S2 · RS ≥ 80 · ADR ≥ 3.5% · Top 40 Groups · Within 10% of 52w High',
    filters: { stages: ['S2'], rsMin: 80, distHighMin: -10, distHighMax: 0, adrMin: 3.5 },
    groupRankMax: 40,
  },
  {
    label: '🚀 Accelerating Sales',
    desc:  'Sales growth accelerating for 2-3 straight quarters (YoY) · S2 · RS ≥ 70 — Ariel-style fundamentals + momentum',
    filters: { accelGrowthOnly: true, stages: ['S2'], rsMin: 70 },
    groupRankMax: null,
  },
  {
    label: '🏦 Institutional Buying',
    desc:  'S2 · Up today on ≥ 1.5× volume · Top 40 Groups — accumulation footprint, Ariel-style',
    filters: { stages: ['S2'], changeMin: 1, volBuzzMin: 1.5 },
    groupRankMax: 40,
  },
  {
    label: '↩️ Pullback in Uptrend',
    desc:  'S2 · RS ≥ 70 · Within 3% of the 50-day SMA — buy-the-dip entries in established leaders',
    filters: { stages: ['S2'], rsMin: 70, distSma50Min: -3, distSma50Max: 3 },
    groupRankMax: null,
  },
  {
    label: '🎯 Qullamaggie Breakout',
    desc:  'RS ≥ 90 · ADR ≥ 5% · +25% in 1M · Within 10% of 52w High — his public momentum-breakout screen',
    filters: { rsMin: 90, adrMin: 5, m1Min: 25, distHighMin: -10, distHighMax: 0 },
    groupRankMax: null,
  },
  {
    label: '💥 Episodic Pivot',
    desc:  'Up ≥ 10% today on ≥ 5× volume — earnings/news gap setup (Kullamägi\'s "EP")',
    filters: { changeMin: 10, volBuzzMin: 5 },
    groupRankMax: null,
  },
  {
    label: '🤏 Tight Flag',
    desc:  '+20% in 1M, now quiet (±1.5% today) 1-12% off the 52w high — consolidating after a big run before a possible re-breakout',
    filters: { m1Min: 20, distHighMin: -12, distHighMax: -1, changeMin: -1.5, changeMax: 1.5 },
    groupRankMax: null,
  },
  {
    label: '🛡️ Relative Strength',
    desc:  'Beating the market (SPY) by ≥ 2% today — stocks showing real strength vs the index',
    filters: { relVsMktMin: 2 },
    groupRankMax: null,
  },
  {
    label: '🚀 Today\'s Rockets',
    desc:  'Up ≥ 4% today with volume surge ≥ 1.5× — breakout movers regardless of RS/Stage',
    filters: { changeMin: 4, volBuzzMin: 1.5 },
    groupRankMax: null,
  },
  {
    label: '💎 Holding Up',
    desc:  'Outperforming SPY by ≥ 3% — holds up or rises while the market falls',
    filters: { relVsMktMin: 3 },
    groupRankMax: null,
  },
  {
    label: '📈 1-Week Movers',
    desc:  '1-week return ≥ 5% — strong momentum names',
    filters: { w1Min: 5 },
    groupRankMax: null,
  },
  {
    label: '🏆 CAN SLIM',
    desc:  'RS ≥ 80 · S2 · Forward EPS > 0 · Near 52w High',
    filters: { stages: ['S2'], rsMin: 80, epsFMin: 0.01, distHighMin: -15, distHighMax: 0 },
    groupRankMax: null,
  },
  {
    label: '🌟 Top Group Leaders',
    desc:  'Top 20 Groups · S2 · RS ≥ 75',
    filters: { stages: ['S2'], rsMin: 75 },
    groupRankMax: 20,
  },
  {
    label: '💪 High RS (80+)',
    desc:  'RS Rating ≥ 80',
    filters: { rsMin: 80 },
    groupRankMax: null,
  },
  {
    label: '🔥 Volume Surge',
    desc:  'Relative Volume ≥ 2×',
    filters: { volBuzzMin: 2 },
    groupRankMax: null,
  },
  {
    label: '🎯 Near 52w High',
    desc:  'Within 5% of 52-week high',
    filters: { distHighMin: -5, distHighMax: 0 },
    groupRankMax: null,
  },
  {
    label: '💰 Value (PE < 15)',
    desc:  'P/E Ratio below 15',
    filters: { peMax: 15 },
    groupRankMax: null,
  },
  {
    label: '🌱 Small-Cap Growth',
    desc:  'Market cap $300M+ · Price > $7 · Above 50 & 200-day SMA · 60%+ above 52w low · EPS & Sales growth qtr/qtr ≥25% · Avg volume 100K+',
    filters: {
      marketCapMin: 0.3, priceMin: 7, distSma50Min: 0, distSma200Min: 0,
      distLowMin: 60, epsGrowthQoQMin: 25, salesGrowthQoQMin: 25, avgVolMin: 100000,
    },
    groupRankMax: null,
  },
  {
    label: '💥 Mid-Cap New-High Breakout',
    desc:  'Market cap $2B+ · Above 50-day SMA · Up today & from open · At a fresh 20-day high',
    filters: {
      marketCapMin: 2, distSma50Min: 0, changeMin: 0.01, changeFromOpenMin: 0.01, dist20dHighMin: 0,
    },
    groupRankMax: null,
  },
  {
    label: '🌪️ Mid-Cap Volatility Breakout',
    desc:  'Market cap $2B+ · Weekly ADR ≥4% · Above 50-day SMA · Up today & from open · Fresh 20-day high · 5%+ above 50-day low · Avg vol 2M+ · Volume 1M+',
    filters: {
      marketCapMin: 2, adrWeekMin: 4, distSma50Min: 0, changeMin: 0.01, changeFromOpenMin: 0.01,
      dist20dHighMin: 0, dist50dLowMin: 5, avgVolMin: 2000000, volumeMin: 1000000,
    },
    groupRankMax: null,
  },
  {
    label: '🏆 Growth Momentum Leader',
    desc:  'Price >$10 · Small-Mid cap $300M–$10B · Avg vol >750K · Sales growth ≥25% · EPS growth ≥30% (or loss→profit) · Beat last earnings · Within 15% of 52w high · RS ≥85 · Above rising 50d & 200d SMA',
    filters: {
      priceMin: 10, marketCapMin: 0.3, marketCapMax: 10, avgVolMin: 750000,
      salesGrowthMin: 25, epsGrowthYoYMin: 30, earningsSurpriseMin: 0.01,
      distHighMin: -15, distHighMax: 0, rsMin: 85,
      distSma50Min: 0, distSma200Min: 0, smaTrendUpOnly: true,
    },
    groupRankMax: null,
  },
];

const DEFAULT_FILTERS = {
  sectors: [], stages: [],
  marketCapMin: '', marketCapMax: '',
  peMin: '', peMax: '', fpeMin: '', fpeMax: '',
  pegMin: '', pegMax: '', psMin: '', psMax: '', pbMin: '', pbMax: '',
  epsMin: '', epsMax: '', epsFMin: '', epsFMax: '',
  divYieldMin: '', divYieldMax: '',
  sharesOutMin: '', sharesOutMax: '', floatMin: '', floatMax: '',
  rsMin: '', rsMax: '',
  distSma50Min: '', distSma50Max: '', distSma200Min: '', distSma200Max: '',
  changeMin: '', changeMax: '', changeFromOpenMin: '', changeFromOpenMax: '',
  relVsMktMin: '', relVsMktMax: '',
  distHighMin: '', distHighMax: '', distLowMin: '', distLowMax: '',
  betaMin: '', betaMax: '', volBuzzMin: '', volBuzzMax: '',
  adrMin: '', adrMax: '', adrWeekMin: '', adrWeekMax: '',
  avgVolMin: '', avgVolMax: '', volumeMin: '', volumeMax: '',
  priceMin: '', priceMax: '', targetUpsideMin: '', targetUpsideMax: '',
  w1Min: '', w1Max: '', m1Min: '', m1Max: '', m3Min: '', m3Max: '',
  accelGrowthOnly: false, salesGrowthMin: '', salesGrowthMax: '',
  salesGrowthQoQMin: '', salesGrowthQoQMax: '', epsGrowthQoQMin: '', epsGrowthQoQMax: '',
  dist20dHighMin: '', dist20dHighMax: '', dist20dLowMin: '', dist20dLowMax: '',
  dist50dHighMin: '', dist50dHighMax: '', dist50dLowMin: '', dist50dLowMax: '',
  epsGrowthYoYMin: '', epsGrowthYoYMax: '', earningsSurpriseMin: '', earningsSurpriseMax: '',
  smaTrendUpOnly: false,
};

// Build static sector lookup
const TICKER_SECTOR = {};
Object.entries(SECTOR_STOCKS).forEach(([sector, tickers]) => {
  tickers.forEach(t => { if (!TICKER_SECTOR[t]) TICKER_SECTOR[t] = sector; });
});

const n = v => v === '' ? null : Number(v);
function pass(val, minKey, maxKey, f) {
  if (n(f[minKey]) != null && (val == null || val < n(f[minKey]))) return false;
  if (n(f[maxKey]) != null && (val == null || val > n(f[maxKey]))) return false;
  return true;
}

function applyFilters(stocks, f, groupRankMax, tickerGroupRank) {
  return stocks.filter(s => {
    if (f.sectors.length && !f.sectors.includes(TICKER_SECTOR[s.ticker])) return false;
    if (f.stages.length  && !f.stages.includes(s.stage))  return false;
    if (f.accelGrowthOnly && !s.accelGrowth) return false;
    if (!pass(s.salesGrowthYoY, 'salesGrowthMin', 'salesGrowthMax', f)) return false;
    if (!pass(s.salesGrowthQoQ, 'salesGrowthQoQMin', 'salesGrowthQoQMax', f)) return false;
    if (!pass(s.epsGrowthQoQ,   'epsGrowthQoQMin',   'epsGrowthQoQMax',   f)) return false;
    if (groupRankMax != null) {
      const rank = tickerGroupRank[s.ticker];
      if (rank == null || rank > groupRankMax) return false;
    }
    if (!pass(s.marketCapB,  'marketCapMin',  'marketCapMax',  f)) return false;
    if (!pass(s.pe,          'peMin',         'peMax',         f)) return false;
    if (!pass(s.fpe,         'fpeMin',        'fpeMax',        f)) return false;
    if (!pass(s.peg,         'pegMin',        'pegMax',        f)) return false;
    if (!pass(s.ps,          'psMin',         'psMax',         f)) return false;
    if (!pass(s.pb,          'pbMin',         'pbMax',         f)) return false;
    if (!pass(s.eps,         'epsMin',        'epsMax',        f)) return false;
    if (!pass(s.epsF,        'epsFMin',       'epsFMax',       f)) return false;
    if (!pass(s.divYield,    'divYieldMin',   'divYieldMax',   f)) return false;
    if (!pass(s.sharesOutB,  'sharesOutMin',  'sharesOutMax',  f)) return false;
    if (!pass(s.floatB,      'floatMin',      'floatMax',      f)) return false;
    if (!pass(s.rs,              'rsMin',             'rsMax',             f)) return false;
    if (!pass(s.distSma50,       'distSma50Min',      'distSma50Max',      f)) return false;
    if (!pass(s.distSma200,      'distSma200Min',     'distSma200Max',     f)) return false;
    if (!pass(s.change,          'changeMin',         'changeMax',         f)) return false;
    if (!pass(s.changeFromOpen,  'changeFromOpenMin', 'changeFromOpenMax', f)) return false;
    if (!pass(s.relVsMarket,     'relVsMktMin',       'relVsMktMax',       f)) return false;
    if (!pass(s.distSma52wHigh,  'distHighMin',       'distHighMax',       f)) return false;
    if (!pass(s.distSma52wLow,   'distLowMin',        'distLowMax',        f)) return false;
    if (!pass(s.beta,            'betaMin',           'betaMax',           f)) return false;
    if (!pass(s.adrPct,          'adrMin',            'adrMax',            f)) return false;
    if (!pass(s.adrPctWeek,      'adrWeekMin',        'adrWeekMax',        f)) return false;
    if (!pass(s.dist20dHigh,     'dist20dHighMin',    'dist20dHighMax',    f)) return false;
    if (!pass(s.dist20dLow,      'dist20dLowMin',     'dist20dLowMax',     f)) return false;
    if (!pass(s.dist50dHigh,     'dist50dHighMin',    'dist50dHighMax',    f)) return false;
    if (!pass(s.dist50dLow,      'dist50dLowMin',     'dist50dLowMax',     f)) return false;
    // EPS YoY growth OR turned-profitable (loss -> profit) — a plain min/max
    // pair can't express "OR", so this one gets its own check.
    const epsGrowthMin = n(f.epsGrowthYoYMin);
    if (epsGrowthMin != null) {
      const meetsGrowth = (s.epsGrowthYoY != null && s.epsGrowthYoY >= epsGrowthMin) || s.epsTurnedProfitable;
      if (!meetsGrowth) return false;
    }
    if (n(f.epsGrowthYoYMax) != null && (s.epsGrowthYoY == null || s.epsGrowthYoY > n(f.epsGrowthYoYMax))) return false;
    if (!pass(s.epsSurprisePercent, 'earningsSurpriseMin', 'earningsSurpriseMax', f)) return false;
    if (f.smaTrendUpOnly && !(s.sma50Rising && s.sma200Rising)) return false;
    if (!pass(s.volBuzz,         'volBuzzMin',        'volBuzzMax',        f)) return false;
    if (!pass(s.avgVolume,       'avgVolMin',         'avgVolMax',         f)) return false;
    if (!pass(s.volume,          'volumeMin',         'volumeMax',         f)) return false;
    if (!pass(s.price,           'priceMin',          'priceMax',          f)) return false;
    if (!pass(s.targetUpside,    'targetUpsideMin',   'targetUpsideMax',   f)) return false;
    if (!pass(s.w1, 'w1Min', 'w1Max', f)) return false;
    if (!pass(s.m1, 'm1Min', 'm1Max', f)) return false;
    if (!pass(s.m3, 'm3Min', 'm3Max', f)) return false;
    return true;
  });
}

// ── UI primitives ───────────────────────────────────────────────────────

function PerfCell({ value }) {
  if (value == null) return <span style={{ color: 'var(--text-faint)', fontFamily: 'monospace', fontSize: 11 }}>—</span>;
  const color = value >= 0 ? '#34d399' : '#f87171';
  return <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color }}>{value >= 0 ? '+' : ''}{value.toFixed(2)}%</span>;
}

// Relative-Strength-vs-SPY cell — uses shield icon to signal market outperformance
function VsSpyCell({ value }) {
  if (value == null) return <span style={{ color: 'var(--text-faint)', fontFamily: 'monospace', fontSize: 11 }}>—</span>;
  // Color scale: strong outperform (≥3) → bright green, mild (0–3) → dim green,
  // mild under (0 to -3) → dim red, strong under (≤-3) → bright red
  const abs = Math.abs(value);
  let color;
  if (value >= 3)        color = '#10b981';
  else if (value >= 0)   color = '#6ee7b7';
  else if (value >= -3)  color = '#fca5a5';
  else                   color = '#f87171';
  return (
    <span title={`vs SPY: ${value >= 0 ? '+' : ''}${value.toFixed(1)}%`}
      style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color,
               display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {value >= 0 ? '▲' : '▼'} {abs.toFixed(1)}%
    </span>
  );
}

function GroupRankBadge({ rank, name }) {
  if (!rank) return null;
  const color = rank <= 10 ? '#f59e0b' : rank <= 20 ? '#34d399' : rank <= 40 ? '#3b82f6' : '#94a3b8';
  return (
    <span title={name} style={{
      fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color,
      background: color + '18', padding: '1px 5px', borderRadius: 4, whiteSpace: 'nowrap',
    }}>#{rank}</span>
  );
}

function RangeRow({ label, minKey, maxKey, filters, setFilters, step, note }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)', minWidth: 200, flexShrink: 0 }}>
        {label}
        {note && <span style={{ fontSize: 9, color: 'var(--text-faint)', marginLeft: 4 }}>{note}</span>}
      </span>
      <input type="number" step={step || 'any'} placeholder="Min" value={filters[minKey]}
        onChange={e => setFilters(f => ({ ...f, [minKey]: e.target.value }))}
        style={{ width: 70, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 5, color: 'var(--text)', fontFamily: 'monospace', fontSize: 12, padding: '4px 6px', outline: 'none' }} />
      <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>–</span>
      <input type="number" step={step || 'any'} placeholder="Max" value={filters[maxKey]}
        onChange={e => setFilters(f => ({ ...f, [maxKey]: e.target.value }))}
        style={{ width: 70, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 5, color: 'var(--text)', fontFamily: 'monospace', fontSize: 12, padding: '4px 6px', outline: 'none' }} />
    </div>
  );
}

function FilterGroup({ title, children }) {
  return (
    <div style={{ flex: '1 1 260px', minWidth: 260 }}>
      <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-faint)', marginBottom: 6 }}>{title}</div>
      {children}
    </div>
  );
}

function StageToggle({ stages, onChange }) {
  const toggle = s => onChange(stages.includes(s) ? stages.filter(x => x !== s) : [...stages, s]);
  const labels = { S1: 'Basing', S2: 'Advancing', S3: 'Topping', S4: 'Declining' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Weinstein Stage</span>
      <div style={{ display: 'flex', gap: 5 }}>
        {['S1','S2','S3','S4'].map(s => (
          <button key={s} onClick={() => toggle(s)} title={labels[s]} style={{
            padding: '5px 12px', fontFamily: 'monospace', fontSize: 12, fontWeight: 700, borderRadius: 6,
            border: `1px solid ${stages.includes(s) ? STAGE_COLORS[s] : 'var(--border)'}`,
            background: stages.includes(s) ? `${STAGE_COLORS[s]}22` : 'transparent',
            color: stages.includes(s) ? STAGE_COLORS[s] : 'var(--text-muted)', cursor: 'pointer',
          }}>{s} <span style={{ fontWeight: 400, fontSize: 9 }}>{labels[s]}</span></button>
        ))}
      </div>
    </div>
  );
}

function SectorToggle({ sectors, onChange }) {
  const toggle = s => onChange(sectors.includes(s) ? sectors.filter(x => x !== s) : [...sectors, s]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sector</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {SECTORS.map(s => (
          <button key={s} onClick={() => toggle(s)} style={{
            padding: '3px 9px', fontFamily: 'monospace', fontSize: 11, fontWeight: 600, borderRadius: 20,
            border: '1px solid', borderColor: sectors.includes(s) ? '#3b82f6' : 'var(--border)',
            background: sectors.includes(s) ? 'rgba(59,130,246,0.15)' : 'transparent',
            color: sectors.includes(s) ? '#60a5fa' : 'var(--text-muted)', cursor: 'pointer',
          }}>{s}</button>
        ))}
      </div>
    </div>
  );
}

function SortTh({ label, col, sortKey, sortDir, onSort, align = 'right', title }) {
  return (
    <th onClick={() => onSort(col)} title={title} style={{
      padding: '6px 10px', fontSize: 10, fontWeight: 600, cursor: 'pointer',
      color: sortKey === col ? '#3b82f6' : 'var(--text-faint)',
      fontFamily: 'monospace', textAlign: align,
      textTransform: 'uppercase', letterSpacing: '0.05em',
      userSelect: 'none', whiteSpace: 'nowrap',
    }}>
      {label}{sortKey === col ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}
    </th>
  );
}

function StockRow({ stock, i, onTickerClick, cs, onClip, groupRank, groupName, showMiniCharts, chartRange }) {
  const [hover, setHover] = useState(false);
  return (
    <tr
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onClip && onClip(stock.ticker, stock.name)}
      style={{
        borderBottom: '1px solid var(--border)',
        background: cs ? CLIP_BG[cs] : hover ? 'rgba(59,130,246,0.06)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
        borderLeft: cs ? `3px solid ${CLIP_COLORS[cs]}` : '3px solid transparent',
        transition: 'background 0.1s', cursor: onClip ? 'pointer' : 'default',
      }}
    >
      <td onClick={e => { e.stopPropagation(); onTickerClick(stock); }}
        style={{ padding: '7px 10px', fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: cs ? CLIP_COLORS[cs] : '#60a5fa', whiteSpace: 'nowrap', cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {cs && <span style={{ width: 6, height: 6, borderRadius: '50%', background: CLIP_COLORS[cs], display: 'inline-block', flexShrink: 0 }} />}
          {stock.ticker}
        </span>
      </td>
      {/* Inline mini sparkline — SVG, no iframe, renders at any height */}
      {showMiniCharts && (
        <td style={{ padding: '4px 6px', width: 196 }} onClick={e => e.stopPropagation()}>
          <Sparkline ticker={stock.ticker} range={chartRange} width={184} height={56} />
        </td>
      )}
      <td style={{ padding: '7px 10px', fontSize: 11, color: 'var(--text-muted)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stock.name || '—'}</td>
      <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>
        {groupRank ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <GroupRankBadge rank={groupRank} name={groupName} />
            <span style={{ fontSize: 10, color: 'var(--text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>{groupName}</span>
          </div>
        ) : <span style={{ color: 'var(--text-faint)', fontSize: 10 }}>—</span>}
      </td>
      <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text)', textAlign: 'right' }}>{stock.price != null ? `$${stock.price.toFixed(2)}` : '—'}</td>
      <td style={{ padding: '7px 10px', textAlign: 'right' }}><PerfCell value={stock.change} /></td>
      <td style={{ padding: '7px 10px', textAlign: 'right' }}>
        <VsSpyCell value={stock.relVsMarket} />
      </td>
      <td style={{ padding: '7px 10px', textAlign: 'right' }}><PerfCell value={stock.w1} /></td>
      <td style={{ padding: '7px 10px', textAlign: 'right' }}><PerfCell value={stock.m1} /></td>
      <td style={{ padding: '7px 10px', textAlign: 'right' }}><PerfCell value={stock.m3} /></td>
      <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: stock.rs != null ? RS_COLOR(stock.rs) : 'var(--text-faint)' }}>
        {stock.rs != null ? stock.rs : '—'}
      </td>
      <td title={stock.salesGrowthSeries ? `YoY by quarter: ${stock.salesGrowthSeries.map(g => `${g >= 0 ? '+' : ''}${g}%`).join(' → ')}` : undefined}
        style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: stock.salesGrowthYoY != null ? (stock.salesGrowthYoY >= 0 ? '#34d399' : '#f87171') : 'var(--text-faint)' }}>
        {stock.salesGrowthYoY != null ? `${stock.accelGrowth ? '⚡' : ''}${stock.salesGrowthYoY >= 0 ? '+' : ''}${stock.salesGrowthYoY.toFixed(1)}%` : '—'}
      </td>
      <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: stock.adrPct != null ? ADR_COLOR(stock.adrPct) : 'var(--text-faint)' }}>
        {stock.adrPct != null ? `${stock.adrPct.toFixed(1)}%` : '—'}
      </td>
      <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'monospace', fontSize: 11, color: stock.volBuzz != null ? (stock.volBuzz >= 1.5 ? '#f59e0b' : 'var(--text-muted)') : 'var(--text-faint)' }}>
        {stock.volBuzz != null ? `${stock.volBuzz.toFixed(1)}x` : '—'}
      </td>
      <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'monospace', fontSize: 11,
        color: stock.distSma52wHigh != null ? (stock.distSma52wHigh >= -5 ? '#34d399' : stock.distSma52wHigh >= -15 ? '#f59e0b' : '#f87171') : 'var(--text-faint)' }}>
        {stock.distSma52wHigh != null ? `${stock.distSma52wHigh >= 0 ? '+' : ''}${stock.distSma52wHigh.toFixed(1)}%` : '—'}
      </td>
      <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>
        {stock.marketCapB != null ? `$${stock.marketCapB >= 1000 ? (stock.marketCapB / 1000).toFixed(1) + 'T' : stock.marketCapB.toFixed(0) + 'B'}` : '—'}
      </td>
      <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>
        {stock.pe != null ? stock.pe.toFixed(1) : '—'}
      </td>
      <td style={{ padding: '7px 10px', textAlign: 'center' }}>
        {stock.stage ? <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: STAGE_COLORS[stock.stage] || 'var(--text-faint)' }}>{stock.stage}</span> : '—'}
      </td>
    </tr>
  );
}

// ── Chart Card (Finviz-style) ────────────────────────────────────────────
// Compact header row: ticker, change%, RS, stage, group rank, EXPAND button.
// Then a full TradingView advanced chart (candlesticks + MA50 + MA200 + Volume).
function ChartCard({ stock, range, cs, onClip, onTickerClick, groupRank, groupName }) {
  const change = stock.change ?? 0;
  const changeColor = change >= 0 ? '#34d399' : '#f87171';

  const openTradingView = (e) => {
    e.stopPropagation();
    window.open(`https://www.tradingview.com/chart/?symbol=${stock.ticker}`, '_blank', 'noopener');
  };

  return (
    <div
      onClick={() => onClip && onClip(stock.ticker, stock.name)}
      style={{
        background: cs ? CLIP_BG[cs] : 'var(--bg-panel)',
        border: `2px solid ${cs ? CLIP_COLORS[cs] : 'var(--border)'}`,
        borderRadius: 8, overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        cursor: onClip ? 'pointer' : 'default',
        transition: 'border-color 0.12s',
        userSelect: 'none',
      }}
      onMouseEnter={e => { if (!cs) e.currentTarget.style.borderColor = '#3b82f6'; }}
      onMouseLeave={e => { if (!cs) e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      {/* One-line compact header */}
      <div style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.2)' }}>
        {/* Clip dot */}
        {cs && <span style={{ width: 6, height: 6, borderRadius: '50%', background: CLIP_COLORS[cs], flexShrink: 0 }} />}
        {/* Ticker */}
        <span
          onClick={e => { e.stopPropagation(); onTickerClick(stock); }}
          style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 800, color: cs ? CLIP_COLORS[cs] : '#e2e8f0', cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}
        >{stock.ticker}</span>
        {/* Stage */}
        {stock.stage && (
          <span style={{ fontSize: 9, fontFamily: 'monospace', fontWeight: 700, color: STAGE_COLORS[stock.stage], background: `${STAGE_COLORS[stock.stage]}22`, padding: '1px 4px', borderRadius: 3, flexShrink: 0 }}>
            {stock.stage}
          </span>
        )}
        {/* RS */}
        {stock.rs != null && (
          <span style={{ fontSize: 9, fontFamily: 'monospace', fontWeight: 700, color: RS_COLOR(stock.rs), background: RS_COLOR(stock.rs) + '18', padding: '1px 4px', borderRadius: 3, flexShrink: 0 }}>
            RS {stock.rs}
          </span>
        )}
        {/* ADR% */}
        {stock.adrPct != null && (
          <span title="Average Daily Range % (20 days)" style={{ fontSize: 9, fontFamily: 'monospace', fontWeight: 700, color: ADR_COLOR(stock.adrPct), background: ADR_COLOR(stock.adrPct) + '18', padding: '1px 4px', borderRadius: 3, flexShrink: 0 }}>
            ADR {stock.adrPct.toFixed(1)}%
          </span>
        )}
        {/* Accelerating sales growth */}
        {stock.accelGrowth && (
          <span title={`Sales growth accelerating — latest YoY +${stock.salesGrowthYoY}%`} style={{ fontSize: 9, fontFamily: 'monospace', fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.15)', padding: '1px 4px', borderRadius: 3, flexShrink: 0 }}>
            ⚡ +{stock.salesGrowthYoY}%
          </span>
        )}
        {/* Group rank */}
        {groupRank && (
          <span style={{ fontSize: 9, fontFamily: 'monospace', fontWeight: 700,
            color: groupRank <= 10 ? '#f59e0b' : groupRank <= 20 ? '#34d399' : '#3b82f6',
            background: (groupRank <= 10 ? '#f59e0b' : groupRank <= 20 ? '#34d399' : '#3b82f6') + '18',
            padding: '1px 4px', borderRadius: 3, flexShrink: 0,
          }} title={groupName}>#{groupRank}</span>
        )}
        {/* Spacer */}
        <div style={{ flex: 1 }} />
        {/* vs SPY badge */}
        {stock.relVsMarket != null && (
          <span
            title={`vs SPY: ${stock.relVsMarket >= 0 ? '+' : ''}${stock.relVsMarket.toFixed(1)}%`}
            style={{
              fontSize: 9, fontFamily: 'monospace', fontWeight: 700, flexShrink: 0,
              color: stock.relVsMarket >= 2 ? '#10b981' : stock.relVsMarket >= 0 ? '#6ee7b7' : stock.relVsMarket >= -2 ? '#fca5a5' : '#f87171',
              background: stock.relVsMarket >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(248,113,113,0.12)',
              padding: '1px 5px', borderRadius: 4,
            }}>
            {stock.relVsMarket >= 0 ? '▲' : '▼'} {Math.abs(stock.relVsMarket).toFixed(1)}% SPY
          </span>
        )}
        {/* Change % */}
        <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: changeColor, flexShrink: 0 }}>
          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
        </span>
        {/* EXPAND → open TradingView */}
        <button
          onClick={openTradingView}
          title="Open full chart on TradingView"
          style={{
            padding: '2px 6px', fontSize: 9, fontFamily: 'monospace', fontWeight: 600,
            borderRadius: 4, border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.06)', color: '#94a3b8', cursor: 'pointer',
            flexShrink: 0, lineHeight: 1.4,
          }}
        >EXPAND ↗</button>
      </div>

      {/* Chart area — stop propagation so mouse drag/scroll stays inside the chart
          and doesn't trigger the card's clip-on-click behaviour               */}
      <div
        onClick={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
        onWheel={e => e.stopPropagation()}
        style={{ userSelect: 'text' }}
      >
        <TVChart ticker={stock.ticker} range={range} height={320} />
      </div>
    </div>
  );
}

// ── Save-scan modal ─────────────────────────────────────────────────────
function SaveScanModal({ onSave, onClose }) {
  const [name, setName] = useState('');
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', width: 320 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Save Current Scan</div>
        <input
          autoFocus
          placeholder="Scan name (e.g. My Breakouts)"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && name.trim()) onSave(name.trim()); if (e.key === 'Escape') onClose(); }}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'monospace', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '6px 16px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
          <button onClick={() => name.trim() && onSave(name.trim())} style={{ padding: '6px 16px', borderRadius: 7, border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Screener ───────────────────────────────────────────────────────
export default function Screener({ stocksByTicker, clipboard, onClip, industryGroupData = [] }) {
  const [activeTab, setActiveTab]       = useState('Descriptive');
  const [filters, setFilters]           = useState({ ...DEFAULT_FILTERS });
  const [groupRankMax, setGroupRankMax] = useState(null);
  const [sortKey, setSortKey]           = useState('rs');
  const [sortDir, setSortDir]           = useState('desc');
  const [activePreset, setActivePreset] = useState(null);
  const [popupStock, setPopupStock]     = useState(null);
  const [viewMode, setViewMode]         = useState('list');
  const [chartRange, setChartRange]     = useState('1D');
  const [showMiniCharts, setShowMiniCharts] = useState(false); // inline sparklines in list view
  const [page, setPage]                 = useState(0); // pagination for charts
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savedScans, setSavedScans]     = useState(() => {
    try { return JSON.parse(localStorage.getItem('mp-saved-scans') || '[]'); } catch { return []; }
  });
  const [copyTick, setCopyTick]         = useState(false);

  // Build ticker→group lookup
  const tickerToGroupInfo = useMemo(() => {
    const map = {};
    industryGroupData.forEach(g => {
      const def = INDUSTRY_GROUPS.find(ig => ig.name === g.name);
      if (def) def.tickers.forEach(t => { if (!map[t]) map[t] = { rank: g.rank, name: g.name }; });
    });
    return map;
  }, [industryGroupData]);

  const tickerGroupRank = useMemo(
    () => Object.fromEntries(Object.entries(tickerToGroupInfo).map(([t, g]) => [t, g.rank])),
    [tickerToGroupInfo]
  );

  // Enrich with history-derived metrics (ADR%, 1W/1M/3M returns) — shared
  // 10-minute cache with the Leaders/Laggards tab, so this is one fetch app-wide.
  const [histData, setHistData] = useState(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await fetchRelativeStrengthData(UNIVERSE_SYMBOLS);
        if (!cancelled) setHistData(d.byTicker);
      } catch (e) {
        console.error('Screener history enrichment error:', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Multi-quarter sales-growth acceleration — precomputed daily (Yahoo has
  // no batch endpoint for quarterly revenue), served as a static JSON.
  const [salesGrowthData, setSalesGrowthData] = useState(null);
  useEffect(() => {
    let cancelled = false;
    fetch('/data/sales-growth.json')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (!cancelled) setSalesGrowthData(d?.tickers || {}); })
      .catch(() => { if (!cancelled) setSalesGrowthData({}); });
    return () => { cancelled = true; };
  }, []);

  const allStocks = useMemo(() => Object.values(stocksByTicker).map(s => {
    const h = histData?.[s.ticker];
    const sg = salesGrowthData?.[s.ticker];
    if (!h && !sg) return s;
    return {
      ...s,
      adrPct: h?.adrPct ?? null,
      adrPctWeek: h?.adrPctWeek ?? null,
      dist20dHigh: h?.dist20dHigh ?? null,
      dist20dLow: h?.dist20dLow ?? null,
      dist50dHigh: h?.dist50dHigh ?? null,
      dist50dLow: h?.dist50dLow ?? null,
      sma50Rising: h?.sma50Rising ?? null,
      sma200Rising: h?.sma200Rising ?? null,
      w1: s.w1 ?? h?.r1w ?? null,
      m1: s.m1 ?? h?.r1m ?? null,
      m3: s.m3 ?? h?.r3m ?? null,
      accelGrowth: sg?.accelerating ?? null,
      salesGrowthYoY: sg?.latestGrowth ?? null,
      salesGrowthQoQ: sg?.salesGrowthQoQ ?? null,
      epsGrowthQoQ: sg?.epsGrowthQoQ ?? null,
      epsGrowthYoY: sg?.epsGrowthYoY ?? null,
      epsTurnedProfitable: sg?.epsTurnedProfitable ?? false,
      epsSurprisePercent: sg?.epsSurprisePercent ?? null,
      salesGrowthSeries: sg?.revenueGrowthYoY ?? null,
    };
  }), [stocksByTicker, histData, salesGrowthData]);
  const filtered  = useMemo(
    () => applyFilters(allStocks, filters, groupRankMax, tickerGroupRank),
    [allStocks, filters, groupRankMax, tickerGroupRank]
  );

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    if (sortKey === 'groupRank') {
      const ar = tickerToGroupInfo[a.ticker]?.rank ?? 9999;
      const br = tickerToGroupInfo[b.ticker]?.rank ?? 9999;
      return sortDir === 'asc' ? ar - br : br - ar;
    }
    const av = a[sortKey] ?? (sortDir === 'desc' ? -Infinity : Infinity);
    const bv = b[sortKey] ?? (sortDir === 'desc' ? -Infinity : Infinity);
    if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortDir === 'desc' ? bv - av : av - bv;
  }), [filtered, sortKey, sortDir, tickerToGroupInfo]);

  // Paginated stocks for chart view
  const totalPages = Math.ceil(sorted.length / CHARTS_PER_PAGE);
  const chartStocks = useMemo(
    () => sorted.slice(page * CHARTS_PER_PAGE, (page + 1) * CHARTS_PER_PAGE),
    [sorted, page]
  );

  const handleSort = key => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir(key === 'groupRank' ? 'asc' : 'desc'); }
  };

  const applyPreset = (preset, idx) => {
    if (activePreset === idx) {
      setFilters({ ...DEFAULT_FILTERS }); setGroupRankMax(null); setActivePreset(null);
    } else {
      setFilters({ ...DEFAULT_FILTERS, ...preset.filters });
      setGroupRankMax(preset.groupRankMax ?? null);
      setActivePreset(idx);
    }
    setPage(0);
  };

  const resetFilters = () => { setFilters({ ...DEFAULT_FILTERS }); setGroupRankMax(null); setActivePreset(null); setPage(0); };

  // Save current scan
  const handleSaveScan = (name) => {
    const scan = { name, filters: { ...filters }, groupRankMax, label: `💾 ${name}` };
    const next = [...savedScans, scan];
    setSavedScans(next);
    localStorage.setItem('mp-saved-scans', JSON.stringify(next));
    setShowSaveModal(false);
  };

  const deleteSavedScan = (i) => {
    const next = savedScans.filter((_, idx) => idx !== i);
    setSavedScans(next);
    localStorage.setItem('mp-saved-scans', JSON.stringify(next));
  };

  const applySavedScan = (scan) => {
    setFilters({ ...DEFAULT_FILTERS, ...scan.filters });
    setGroupRankMax(scan.groupRankMax ?? null);
    setActivePreset(null);
    setPage(0);
  };

  // Copy all current tickers
  const copyAllTickers = () => {
    const text = sorted.map(s => s.ticker).join(',');
    navigator.clipboard.writeText(text).then(() => {
      setCopyTick(true);
      setTimeout(() => setCopyTick(false), 2000);
    });
  };

  const hasActiveFilters = groupRankMax != null || Object.entries(filters).some(([, v]) =>
    Array.isArray(v) ? v.length > 0 : typeof v === 'boolean' ? v : v !== ''
  );

  const clipState = (ticker) => {
    if ((clipboard?.long     ?? []).some(t => t.ticker === ticker)) return 'long';
    if ((clipboard?.short    ?? []).some(t => t.ticker === ticker)) return 'short';
    if ((clipboard?.universe ?? []).some(t => t.ticker === ticker)) return 'universe';
    return null;
  };

  const sf = { filters, setFilters };
  const thProps = { sortKey, sortDir, onSort: handleSort };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>

      {/* ── Presets row ── */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
          <span style={{ fontSize: 10, color: 'var(--text-faint)', fontFamily: 'monospace', flexShrink: 0 }}>PRESET:</span>
          {PRESETS.map((p, i) => (
            <button key={p.label} onClick={() => applyPreset(p, i)} title={p.desc} style={{
              padding: '4px 12px', fontSize: 11, fontFamily: 'monospace', fontWeight: 600,
              borderRadius: 20, border: '1px solid', cursor: 'pointer', transition: 'all 0.12s',
              borderColor: activePreset === i ? '#3b82f6' : 'var(--border)',
              background:  activePreset === i ? 'rgba(59,130,246,0.15)' : 'transparent',
              color:       activePreset === i ? '#60a5fa' : 'var(--text-muted)',
            }}>{p.label}</button>
          ))}
          {hasActiveFilters && (
            <button onClick={resetFilters} style={{
              padding: '4px 12px', fontSize: 11, fontFamily: 'monospace', fontWeight: 600,
              borderRadius: 20, border: '1px solid #f87171', background: 'rgba(248,113,113,0.1)', color: '#f87171', cursor: 'pointer',
            }}>✕ Reset</button>
          )}
        </div>

        {/* Saved scans row */}
        {savedScans.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, color: 'var(--text-faint)', fontFamily: 'monospace', flexShrink: 0 }}>SAVED:</span>
            {savedScans.map((scan, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                <button onClick={() => applySavedScan(scan)} style={{
                  padding: '4px 10px', fontSize: 11, fontFamily: 'monospace', fontWeight: 600,
                  borderRadius: '20px 0 0 20px', border: '1px solid var(--border)', borderRight: 'none',
                  background: 'transparent', color: '#a78bfa', cursor: 'pointer',
                }}>💾 {scan.name}</button>
                <button onClick={() => deleteSavedScan(i)} style={{
                  padding: '4px 7px', fontSize: 11, fontFamily: 'monospace',
                  borderRadius: '0 20px 20px 0', border: '1px solid var(--border)',
                  background: 'transparent', color: 'var(--text-faint)', cursor: 'pointer', lineHeight: 1,
                }}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Group Rank filter ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 10, color: 'var(--text-faint)', fontFamily: 'monospace' }}>GROUP RANK:</span>
        {GROUP_RANK_OPTIONS.map(opt => (
          <button key={String(opt.value)} onClick={() => { setGroupRankMax(opt.value); setPage(0); }} style={{
            padding: '3px 10px', fontSize: 11, fontFamily: 'monospace', fontWeight: 600,
            borderRadius: 20, border: '1px solid', cursor: 'pointer', transition: 'all 0.12s',
            borderColor: groupRankMax === opt.value ? '#f59e0b' : 'var(--border)',
            background:  groupRankMax === opt.value ? 'rgba(245,158,11,0.15)' : 'transparent',
            color:       groupRankMax === opt.value ? '#f59e0b' : 'var(--text-muted)',
          }}>{opt.label}</button>
        ))}
      </div>

      {/* ── Filter Panel ── */}
      <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 14, overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          {FILTER_TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '9px 18px', fontSize: 12, fontWeight: activeTab === tab ? 700 : 500,
              fontFamily: 'monospace', cursor: 'pointer', background: 'transparent',
              color: activeTab === tab ? '#3b82f6' : 'var(--text-muted)',
              borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
              transition: 'all 0.15s',
            }}>{tab}</button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', paddingRight: 12, gap: 10 }}>
            <button onClick={() => setShowSaveModal(true)} title="Save current filter as a named scan" style={{
              padding: '4px 10px', fontSize: 11, fontFamily: 'monospace', fontWeight: 600,
              borderRadius: 6, border: '1px solid var(--border)', background: 'transparent',
              color: '#a78bfa', cursor: 'pointer',
            }}>💾 Save scan</button>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: filtered.length >= allStocks.length ? 'var(--text-faint)' : '#3b82f6', fontWeight: 600 }}>
              {filtered.length} / {allStocks.length}
            </span>
          </div>
        </div>

        <div style={{ padding: '14px 18px' }}>
          {activeTab === 'Descriptive' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <SectorToggle sectors={filters.sectors} onChange={v => setFilters(f => ({ ...f, sectors: v }))} />
              <StageToggle  stages={filters.stages}   onChange={v => setFilters(f => ({ ...f, stages: v }))} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fundamentals</span>
                <button
                  onClick={() => setFilters(f => ({ ...f, accelGrowthOnly: !f.accelGrowthOnly }))}
                  title="Sales growth YoY has accelerated for the last 2-3 quarters — the Ariel Hernandez / CANSLIM 'accelerating sales growth' criterion"
                  style={{
                    alignSelf: 'flex-start', padding: '5px 12px', fontFamily: 'monospace', fontSize: 12, fontWeight: 700, borderRadius: 6,
                    border: `1px solid ${filters.accelGrowthOnly ? '#f59e0b' : 'var(--border)'}`,
                    background: filters.accelGrowthOnly ? 'rgba(245,158,11,0.15)' : 'transparent',
                    color: filters.accelGrowthOnly ? '#f59e0b' : 'var(--text-muted)', cursor: 'pointer',
                  }}>⚡ Accelerating Sales Growth (Ariel)</button>
              </div>
            </div>
          )}
          {activeTab === 'Fundamental' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
              <FilterGroup title="Valuation">
                <RangeRow label="Market Cap ($B)"      minKey="marketCapMin" maxKey="marketCapMax" {...sf} />
                <RangeRow label="P/E Ratio (TTM)"      minKey="peMin"        maxKey="peMax"        {...sf} />
                <RangeRow label="Forward P/E"          minKey="fpeMin"       maxKey="fpeMax"       {...sf} />
                <RangeRow label="PEG Ratio"            minKey="pegMin"       maxKey="pegMax"       {...sf} step="0.1" />
                <RangeRow label="Price / Sales (TTM)"  minKey="psMin"        maxKey="psMax"        {...sf} step="0.1" />
                <RangeRow label="Price / Book"         minKey="pbMin"        maxKey="pbMax"        {...sf} step="0.1" />
              </FilterGroup>
              <FilterGroup title="Earnings & Income">
                <RangeRow label="EPS (TTM)"            minKey="epsMin"       maxKey="epsMax"       {...sf} step="0.01" />
                <RangeRow label="EPS Forward"          minKey="epsFMin"      maxKey="epsFMax"      {...sf} step="0.01" />
                <RangeRow label="Dividend Yield (%)"   minKey="divYieldMin"  maxKey="divYieldMax"  {...sf} step="0.1" />
                <RangeRow label="Sales Growth YoY (%)" minKey="salesGrowthMin" maxKey="salesGrowthMax" {...sf} note="latest quarter · daily-cached" />
                <RangeRow label="Sales Growth QoQ (%)" minKey="salesGrowthQoQMin" maxKey="salesGrowthQoQMax" {...sf} note="qtr vs prior qtr" />
                <RangeRow label="EPS Growth QoQ (%)"   minKey="epsGrowthQoQMin"  maxKey="epsGrowthQoQMax"  {...sf} note="qtr vs prior qtr" />
                <RangeRow label="EPS Growth YoY (%)"   minKey="epsGrowthYoYMin"  maxKey="epsGrowthYoYMax"  {...sf} note="or loss→profit turn" />
                <RangeRow label="Earnings Surprise (%)" minKey="earningsSurpriseMin" maxKey="earningsSurpriseMax" {...sf} note="last qtr vs estimate" />
              </FilterGroup>
              <FilterGroup title="Share Structure">
                <RangeRow label="Shares Outstanding (B)" minKey="sharesOutMin" maxKey="sharesOutMax" {...sf} step="0.1" />
                <RangeRow label="Float (B)"              minKey="floatMin"     maxKey="floatMax"     {...sf} step="0.1" />
              </FilterGroup>
            </div>
          )}
          {activeTab === 'Technical' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
              <FilterGroup title="Moving Averages">
                <RangeRow label="% from 50-Day SMA"    minKey="distSma50Min"  maxKey="distSma50Max"  {...sf} />
                <RangeRow label="% from 200-Day SMA"   minKey="distSma200Min" maxKey="distSma200Max" {...sf} />
                <button
                  onClick={() => setFilters(f => ({ ...f, smaTrendUpOnly: !f.smaTrendUpOnly }))}
                  title="Both the 50-day and 200-day SMA are themselves sloping up (not just price above them)"
                  style={{
                    marginTop: 6, padding: '5px 12px', fontFamily: 'monospace', fontSize: 11, fontWeight: 700, borderRadius: 6,
                    border: `1px solid ${filters.smaTrendUpOnly ? '#3b82f6' : 'var(--border)'}`,
                    background: filters.smaTrendUpOnly ? 'rgba(59,130,246,0.15)' : 'transparent',
                    color: filters.smaTrendUpOnly ? '#60a5fa' : 'var(--text-muted)', cursor: 'pointer',
                  }}>📈 50d & 200d SMA Trending Up</button>
              </FilterGroup>
              <FilterGroup title="Price Action">
                <RangeRow label="Price ($)"            minKey="priceMin"          maxKey="priceMax"          {...sf} step="0.01" />
                <RangeRow label="Change Today (%)"     minKey="changeMin"         maxKey="changeMax"         {...sf} />
                <RangeRow label="Change from Open (%)" minKey="changeFromOpenMin" maxKey="changeFromOpenMax" {...sf} />
                <RangeRow label="vs SPY Today (%)"     minKey="relVsMktMin"       maxKey="relVsMktMax"       {...sf} note="stock% − SPY%" />
                <RangeRow label="Target Price Upside (%)" minKey="targetUpsideMin" maxKey="targetUpsideMax"  {...sf} />
              </FilterGroup>
              <FilterGroup title="52-Week Range">
                <RangeRow label="% from 52-Week High"  minKey="distHighMin"  maxKey="distHighMax"  {...sf} />
                <RangeRow label="% from 52-Week Low"   minKey="distLowMin"   maxKey="distLowMax"   {...sf} />
              </FilterGroup>
              <FilterGroup title="20/50-Day High/Low">
                <RangeRow label="% from 20d High"   minKey="dist20dHighMin" maxKey="dist20dHighMax" {...sf} note="0 = new high" />
                <RangeRow label="% from 20d Low"    minKey="dist20dLowMin"  maxKey="dist20dLowMax"  {...sf} note="0 = new low" />
                <RangeRow label="% from 50d High"   minKey="dist50dHighMin" maxKey="dist50dHighMax" {...sf} note="0 = new high" />
                <RangeRow label="% from 50d Low"    minKey="dist50dLowMin"  maxKey="dist50dLowMax"  {...sf} note="0 = new low" />
              </FilterGroup>
              <FilterGroup title="Strength & Volatility">
                <RangeRow label="RS Rating"            minKey="rsMin"     maxKey="rsMax"     {...sf} />
                <RangeRow label="ADR % (20-day)"       minKey="adrMin"    maxKey="adrMax"    {...sf} step="0.5" note="avg daily range · Ariel: ≥ 3.5" />
                <RangeRow label="ADR % (Weekly, 5-day)" minKey="adrWeekMin" maxKey="adrWeekMax" {...sf} step="0.5" note="Finviz-style weekly volatility" />
                <RangeRow label="Beta"                 minKey="betaMin"   maxKey="betaMax"   {...sf} step="0.1" />
              </FilterGroup>
              <FilterGroup title="Volume">
                <RangeRow label="Relative Volume (×)"  minKey="volBuzzMin" maxKey="volBuzzMax" {...sf} step="0.1" />
                <RangeRow label="Avg Volume (shares)"  minKey="avgVolMin"  maxKey="avgVolMax"  {...sf} note="e.g. 1000000" />
                <RangeRow label="Current Volume"       minKey="volumeMin"  maxKey="volumeMax"  {...sf} note="e.g. 500000" />
              </FilterGroup>
            </div>
          )}
          {activeTab === 'Performance' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
              <FilterGroup title="Returns">
                <RangeRow label="1 Week (%)"   minKey="w1Min" maxKey="w1Max" {...sf} />
                <RangeRow label="1 Month (%)"  minKey="m1Min" maxKey="m1Max" {...sf} />
                <RangeRow label="3 Month (%)"  minKey="m3Min" maxKey="m3Max" {...sf} />
              </FilterGroup>
            </div>
          )}
        </div>
      </div>

      {/* ── Results header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        {/* View toggle */}
        <div style={{ display: 'flex', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 8, padding: 3, gap: 2 }}>
          {[{ key: 'list', icon: '≡', label: 'List' }, { key: 'charts', icon: '⊞', label: 'Charts' }].map(v => (
            <button key={v.key} onClick={() => { setViewMode(v.key); setPage(0); }} style={{
              padding: '5px 14px', fontSize: 12, fontFamily: 'monospace', fontWeight: 600,
              borderRadius: 6, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              background: viewMode === v.key ? '#3b82f6' : 'transparent',
              color: viewMode === v.key ? '#fff' : 'var(--text-muted)',
            }}>{v.icon} {v.label}</button>
          ))}
        </div>

        {/* Mini chart toggle (list view only) + timeframe */}
        {viewMode === 'list' && (
          <>
            <button
              onClick={() => setShowMiniCharts(v => !v)}
              title="Show inline sparkline charts in each row"
              style={{
                padding: '5px 13px', fontSize: 11, fontFamily: 'monospace', fontWeight: 600,
                borderRadius: 6, border: '1px solid', cursor: 'pointer', transition: 'all 0.12s',
                borderColor: showMiniCharts ? '#a78bfa' : 'var(--border)',
                background:  showMiniCharts ? 'rgba(167,139,250,0.15)' : 'transparent',
                color:       showMiniCharts ? '#a78bfa' : 'var(--text-muted)',
              }}>
              📈 {showMiniCharts ? 'Hide charts' : 'Show charts'}
            </button>
            {showMiniCharts && (
              <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                {CHART_RANGES.map(r => (
                  <button key={r.key} onClick={() => setChartRange(r.key)} title={r.title} style={{
                    padding: '3px 9px', fontSize: 10, fontFamily: 'monospace', fontWeight: 700,
                    borderRadius: 5, border: '1px solid', cursor: 'pointer', transition: 'all 0.12s',
                    borderColor: chartRange === r.key ? '#a78bfa' : 'var(--border)',
                    background:  chartRange === r.key ? 'rgba(167,139,250,0.2)' : 'transparent',
                    color:       chartRange === r.key ? '#a78bfa' : 'var(--text-muted)',
                  }}>{r.label}</button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Range pills — charts view only */}
        {viewMode === 'charts' && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {CHART_RANGES.map(r => (
              <button key={r.key} onClick={() => setChartRange(r.key)} title={r.title} style={{
                padding: '4px 11px', fontSize: 11, fontFamily: 'monospace', fontWeight: 700,
                borderRadius: 6, border: '1px solid', cursor: 'pointer', transition: 'all 0.12s',
                borderColor: chartRange === r.key ? '#a78bfa' : 'var(--border)',
                background:  chartRange === r.key ? 'rgba(167,139,250,0.2)' : 'transparent',
                color:       chartRange === r.key ? '#a78bfa' : 'var(--text-muted)',
              }}>{r.label}</button>
            ))}
          </div>
        )}

        {/* Copy all tickers */}
        <button onClick={copyAllTickers} disabled={sorted.length === 0} style={{
          padding: '5px 13px', fontSize: 11, fontFamily: 'monospace', fontWeight: 600,
          borderRadius: 8, border: '1px solid var(--border)', cursor: sorted.length === 0 ? 'not-allowed' : 'pointer',
          background: copyTick ? 'rgba(52,211,153,0.15)' : 'transparent',
          color: copyTick ? '#34d399' : 'var(--text-muted)', transition: 'all 0.15s',
          opacity: sorted.length === 0 ? 0.4 : 1,
        }}>
          {copyTick ? '✓ Copied!' : '📋 Copy tickers'}
        </button>

        <span style={{ marginLeft: 'auto', fontSize: 11, fontFamily: 'monospace', color: 'var(--text-faint)' }}>
          {sorted.length} result{sorted.length !== 1 ? 's' : ''}
          {viewMode === 'charts' && totalPages > 1 && ` · page ${page + 1} / ${totalPages}`}
        </span>
      </div>

      {/* ── List View ── */}
      {viewMode === 'list' && (
        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: showMiniCharts ? 1340 : 1140 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <SortTh label="Ticker"    col="ticker"         align="left" {...thProps} />
                  {showMiniCharts && (
                    <th style={{ padding: '6px 10px', fontSize: 10, fontWeight: 600, color: '#a78bfa', fontFamily: 'monospace', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em', width: 200 }}>
                      Chart ({chartRange})
                    </th>
                  )}
                  <th style={{ padding: '6px 10px', fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', fontFamily: 'monospace', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</th>
                  <SortTh label="Group"     col="groupRank"      align="left" title="Industry Group Rank" {...thProps} />
                  <SortTh label="Price"     col="price"          {...thProps} />
                  <SortTh label="Today"     col="change"         {...thProps} />
                  <SortTh label="vs SPY"    col="relVsMarket"    title="Today's change minus SPY's change — positive = outperforming the market" {...thProps} />
                  <SortTh label="1W"        col="w1"             {...thProps} />
                  <SortTh label="1M"        col="m1"             {...thProps} />
                  <SortTh label="3M"        col="m3"             {...thProps} />
                  <SortTh label="RS"        col="rs"             {...thProps} />
                  <SortTh label="Sales Gr"  col="salesGrowthYoY" title="Latest quarter revenue growth YoY (%) · ⚡ = accelerating 2-3 straight quarters" {...thProps} />
                  <SortTh label="ADR"       col="adrPct"         title="Average Daily Range % over 20 days — Ariel trades names with ADR ≥ 3.5%" {...thProps} />
                  <SortTh label="Vol Buzz"  col="volBuzz"        {...thProps} />
                  <SortTh label="52w High"  col="distSma52wHigh" {...thProps} />
                  <SortTh label="Mkt Cap"   col="marketCapB"     {...thProps} />
                  <SortTh label="P/E"       col="pe"             {...thProps} />
                  <SortTh label="Stage"     col="stage"          align="center" {...thProps} />
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr><td colSpan={showMiniCharts ? 18 : 17} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-faint)', fontFamily: 'monospace', fontSize: 13 }}>No stocks match the current filters</td></tr>
                ) : sorted.map((stock, i) => {
                  const gi = tickerToGroupInfo[stock.ticker];
                  return (
                    <StockRow key={stock.ticker} stock={stock} i={i}
                      onTickerClick={setPopupStock} cs={clipState(stock.ticker)} onClip={onClip}
                      groupRank={gi?.rank} groupName={gi?.name}
                      showMiniCharts={showMiniCharts} chartRange={chartRange} />
                  );
                })}
              </tbody>
            </table>
          </div>
          {sorted.length > 0 && (
            <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)', fontSize: 10, fontFamily: 'monospace', color: 'var(--text-faint)' }}>
              {sorted.length} result{sorted.length !== 1 ? 's' : ''} · Click row → Long 🟢 → Short 🔴 → Universe 🔵 → Remove · Click ticker for details
            </div>
          )}
        </div>
      )}

      {/* ── Charts View ── */}
      {viewMode === 'charts' && (
        <div>
          {sorted.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-faint)', fontFamily: 'monospace', fontSize: 13, background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12 }}>
              No stocks match the current filters
            </div>
          ) : (
            <>
              {/* Grid — 3 cards per row (matching Ariel's layout) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                gap: 10,
              }}>
                {chartStocks.map(stock => {
                  const gi = tickerToGroupInfo[stock.ticker];
                  return (
                    <ChartCard key={stock.ticker} stock={stock} range={chartRange}
                      cs={clipState(stock.ticker)} onClip={onClip} onTickerClick={setPopupStock}
                      groupRank={gi?.rank} groupName={gi?.name} />
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 16 }}>
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    style={{
                      padding: '6px 18px', fontFamily: 'monospace', fontSize: 12, fontWeight: 600,
                      borderRadius: 8, border: '1px solid var(--border)', cursor: page === 0 ? 'not-allowed' : 'pointer',
                      background: 'transparent', color: page === 0 ? 'var(--text-faint)' : 'var(--text)',
                      opacity: page === 0 ? 0.4 : 1,
                    }}
                  >← Prev</button>

                  <div style={{ display: 'flex', gap: 4 }}>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setPage(i)}
                        style={{
                          width: 32, height: 32, fontFamily: 'monospace', fontSize: 12, fontWeight: 600,
                          borderRadius: 6, border: '1px solid', cursor: 'pointer',
                          borderColor: page === i ? '#3b82f6' : 'var(--border)',
                          background:  page === i ? 'rgba(59,130,246,0.15)' : 'transparent',
                          color:       page === i ? '#60a5fa' : 'var(--text-muted)',
                        }}
                      >{i + 1}</button>
                    ))}
                  </div>

                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page === totalPages - 1}
                    style={{
                      padding: '6px 18px', fontFamily: 'monospace', fontSize: 12, fontWeight: 600,
                      borderRadius: 8, border: '1px solid var(--border)', cursor: page === totalPages - 1 ? 'not-allowed' : 'pointer',
                      background: 'transparent', color: page === totalPages - 1 ? 'var(--text-faint)' : 'var(--text)',
                      opacity: page === totalPages - 1 ? 0.4 : 1,
                    }}
                  >Next →</button>
                </div>
              )}

              <p style={{ textAlign: 'center', fontSize: 10, fontFamily: 'monospace', color: 'var(--text-faint)', marginTop: 10 }}>
                Click card → Long 🟢 → Short 🔴 → Universe 🔵 · Click ticker for details · {CHARTS_PER_PAGE} per page
              </p>
            </>
          )}
        </div>
      )}

      {/* ── Save scan modal ── */}
      {showSaveModal && (
        <SaveScanModal onSave={handleSaveScan} onClose={() => setShowSaveModal(false)} />
      )}

      {/* ── Ticker popup ── */}
      {popupStock && (
        <TickerInfoPopup
          ticker={popupStock.ticker}
          stock={popupStock}
          onClose={() => setPopupStock(null)}
          allStocks={sorted}
          onClip={onClip}
        />
      )}
    </div>
  );
}
