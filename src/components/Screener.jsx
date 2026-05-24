import { useState, useMemo } from 'react';
import { SECTOR_STOCKS, INDUSTRY_GROUPS } from '../data/stockUniverse';
import TickerInfoPopup from './TickerInfoPopup';
import MiniChart from './MiniChart';
import { CLIP_COLORS, CLIP_BG } from './ClipboardPanel';

const RS_COLOR = rs => rs >= 80 ? '#10b981' : rs >= 60 ? '#3b82f6' : rs >= 40 ? '#f59e0b' : '#e879f9';
const STAGE_COLORS = { S1: '#94a3b8', S2: '#60a5fa', S3: '#f59e0b', S4: '#f472b6' };
const SECTORS = Object.keys(SECTOR_STOCKS);
const FILTER_TABS = ['Descriptive', 'Fundamental', 'Technical', 'Performance'];
const CHART_RANGES = ['1W', '1M', '3M'];
const CHART_MAX = 48;

// ── Group Rank presets ──────────────────────────────────────────────────
const GROUP_RANK_OPTIONS = [
  { label: 'All Groups', value: null },
  { label: 'Top 10',     value: 10  },
  { label: 'Top 20',     value: 20  },
  { label: 'Top 40',     value: 40  },
];

const PRESETS = [
  {
    label: '⚡ Ariel Setup',
    desc:  'S2 · RS ≥ 80 · Top 40 Groups · Within 10% of 52w High',
    filters: { stages: ['S2'], rsMin: 80, distHighMin: -10, distHighMax: 0 },
    groupRankMax: 40,
  },
  {
    label: '🏆 Stage 2 Leaders',
    desc:  'S2 · RS ≥ 70',
    filters: { stages: ['S2'], rsMin: 70 },
    groupRankMax: null,
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
    label: '📈 Big Movers',
    desc:  'Up ≥ 4% today',
    filters: { changeMin: 4 },
    groupRankMax: null,
  },
  {
    label: '🌟 Top Group Leaders',
    desc:  'Top 20 Groups · S2 · RS ≥ 75',
    filters: { stages: ['S2'], rsMin: 75 },
    groupRankMax: 20,
  },
  {
    label: '💰 Value (PE < 15)',
    desc:  'P/E Ratio below 15',
    filters: { peMax: 15 },
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
  distHighMin: '', distHighMax: '', distLowMin: '', distLowMax: '',
  betaMin: '', betaMax: '', volBuzzMin: '', volBuzzMax: '',
  avgVolMin: '', avgVolMax: '', volumeMin: '', volumeMax: '',
  priceMin: '', priceMax: '', targetUpsideMin: '', targetUpsideMax: '',
  w1Min: '', w1Max: '', m1Min: '', m1Max: '', m3Min: '', m3Max: '',
};

const TICKER_SECTOR = {};
Object.entries(SECTOR_STOCKS).forEach(([sector, tickers]) => {
  tickers.forEach(t => { if (!TICKER_SECTOR[t]) TICKER_SECTOR[t] = sector; });
});

// Build ticker → group name lookup (first group wins)
const TICKER_TO_GROUP_NAME = {};
INDUSTRY_GROUPS.forEach(g => {
  g.tickers.forEach(t => { if (!TICKER_TO_GROUP_NAME[t]) TICKER_TO_GROUP_NAME[t] = g.name; });
});

const n = v => v === '' ? null : Number(v);

function pass(val, minKey, maxKey, f) {
  if (n(f[minKey]) != null && (val == null || val < n(f[minKey]))) return false;
  if (n(f[maxKey]) != null && (val == null || val > n(f[maxKey]))) return false;
  return true;
}

function applyFilters(stocks, f, groupRankMax, tickerToGroupRank) {
  return stocks.filter(s => {
    if (f.sectors.length && !f.sectors.includes(TICKER_SECTOR[s.ticker])) return false;
    if (f.stages.length  && !f.stages.includes(s.stage))  return false;
    // Group rank filter
    if (groupRankMax != null) {
      const rank = tickerToGroupRank[s.ticker];
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
    if (!pass(s.distSma52wHigh,  'distHighMin',       'distHighMax',       f)) return false;
    if (!pass(s.distSma52wLow,   'distLowMin',        'distLowMax',        f)) return false;
    if (!pass(s.beta,            'betaMin',           'betaMax',           f)) return false;
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

function GroupRankBadge({ rank, onClick, name }) {
  if (!rank) return null;
  const color = rank <= 10 ? '#f59e0b' : rank <= 20 ? '#34d399' : rank <= 40 ? '#3b82f6' : '#94a3b8';
  const bg    = rank <= 10 ? '#f59e0b18' : rank <= 20 ? '#34d39918' : rank <= 40 ? '#3b82f618' : '#94a3b818';
  return (
    <span
      title={name ? `Group: ${name}` : undefined}
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 3,
        fontSize: 10, fontFamily: 'monospace', fontWeight: 700,
        color, background: bg, padding: '1px 6px', borderRadius: 4,
        cursor: onClick ? 'pointer' : 'default',
        whiteSpace: 'nowrap',
      }}
    >
      #{rank}
    </span>
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
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Stage (Weinstein)</span>
      <div style={{ display: 'flex', gap: 5 }}>
        {['S1','S2','S3','S4'].map(s => {
          const descs = { S1: 'Basing', S2: 'Advancing ✓', S3: 'Topping', S4: 'Declining' };
          return (
            <button key={s} onClick={() => toggle(s)} title={descs[s]} style={{
              padding: '4px 12px', fontFamily: 'monospace', fontSize: 12, fontWeight: 700, borderRadius: 6,
              border: `1px solid ${stages.includes(s) ? STAGE_COLORS[s] : 'var(--border)'}`,
              background: stages.includes(s) ? `${STAGE_COLORS[s]}22` : 'transparent',
              color: stages.includes(s) ? STAGE_COLORS[s] : 'var(--text-muted)', cursor: 'pointer',
            }}>
              {s}
              <span style={{ fontSize: 9, fontWeight: 400, marginLeft: 3, opacity: 0.7 }}>{descs[s]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SectorToggle({ sectors, onChange }) {
  const toggle = s => onChange(sectors.includes(s) ? sectors.filter(x => x !== s) : [...sectors, s]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
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

function fmtVol(v) {
  if (v == null) return '—';
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return String(v);
}

function StockRow({ stock, i, onTickerClick, cs, onClip, groupRank, groupName }) {
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
        transition: 'background 0.1s',
        cursor: onClip ? 'pointer' : 'default',
      }}
    >
      <td
        onClick={e => { e.stopPropagation(); onTickerClick(stock); }}
        style={{ padding: '7px 10px', fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: cs ? CLIP_COLORS[cs] : '#60a5fa', whiteSpace: 'nowrap', cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {cs && <span style={{ width: 6, height: 6, borderRadius: '50%', background: CLIP_COLORS[cs], display: 'inline-block', flexShrink: 0 }} />}
          {stock.ticker}
        </span>
      </td>
      <td style={{ padding: '7px 10px', fontSize: 11, color: 'var(--text-muted)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stock.name || '—'}</td>
      {/* Group rank + name */}
      <td style={{ padding: '7px 10px', whiteSpace: 'nowrap', maxWidth: 160, overflow: 'hidden' }}>
        {groupRank ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <GroupRankBadge rank={groupRank} />
            <span style={{ fontSize: 10, color: 'var(--text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{groupName}</span>
          </div>
        ) : (
          <span style={{ color: 'var(--text-faint)', fontSize: 10 }}>—</span>
        )}
      </td>
      <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text)', textAlign: 'right' }}>{stock.price != null ? `$${stock.price.toFixed(2)}` : '—'}</td>
      <td style={{ padding: '7px 10px', textAlign: 'right' }}><PerfCell value={stock.change} /></td>
      <td style={{ padding: '7px 10px', textAlign: 'right' }}><PerfCell value={stock.w1} /></td>
      <td style={{ padding: '7px 10px', textAlign: 'right' }}><PerfCell value={stock.m1} /></td>
      <td style={{ padding: '7px 10px', textAlign: 'right' }}><PerfCell value={stock.m3} /></td>
      <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: stock.rs != null ? RS_COLOR(stock.rs) : 'var(--text-faint)' }}>
        {stock.rs != null ? stock.rs : '—'}
      </td>
      <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'monospace', fontSize: 11, color: stock.volBuzz != null ? (stock.volBuzz >= 1.5 ? '#f59e0b' : 'var(--text-muted)') : 'var(--text-faint)' }}>
        {stock.volBuzz != null ? `${stock.volBuzz.toFixed(1)}x` : '—'}
      </td>
      <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'monospace', fontSize: 11, color: stock.distSma52wHigh != null ? (stock.distSma52wHigh >= -5 ? '#34d399' : stock.distSma52wHigh >= -15 ? '#f59e0b' : '#f87171') : 'var(--text-faint)' }}>
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

// ── Chart Card ───────────────────────────────────────────────────────────

function ChartCard({ stock, range, cs, onClip, onTickerClick, groupRank, groupName }) {
  const change = stock.change ?? 0;
  const changeColor = change >= 0 ? '#34d399' : '#f87171';

  return (
    <div
      style={{
        background: cs ? CLIP_BG[cs] : 'var(--bg-panel)',
        border: `1px solid ${cs ? CLIP_COLORS[cs] : 'var(--border)'}`,
        borderRadius: 10, overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => { if (!cs) e.currentTarget.style.borderColor = '#3b82f6'; }}
      onMouseLeave={e => { if (!cs) e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      {/* Card header */}
      <div
        onClick={() => onClip && onClip(stock.ticker, stock.name)}
        style={{ padding: '10px 12px 6px', cursor: onClip ? 'pointer' : 'default', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {cs && <span style={{ width: 7, height: 7, borderRadius: '50%', background: CLIP_COLORS[cs], flexShrink: 0, display: 'inline-block' }} />}
            <span
              onClick={e => { e.stopPropagation(); onTickerClick(stock); }}
              style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 800, color: cs ? CLIP_COLORS[cs] : '#60a5fa', cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted' }}
            >{stock.ticker}</span>
            {stock.stage && (
              <span style={{ fontSize: 9, fontFamily: 'monospace', fontWeight: 700, color: STAGE_COLORS[stock.stage], background: `${STAGE_COLORS[stock.stage]}22`, padding: '1px 5px', borderRadius: 4 }}>
                {stock.stage}
              </span>
            )}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>{stock.name}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {stock.price != null && <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>${stock.price.toFixed(2)}</div>}
          <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: changeColor }}>
            {change >= 0 ? '+' : ''}{change.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* RS badge + Group rank */}
      <div style={{ paddingLeft: 12, paddingBottom: 6, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {stock.rs != null && (
          <span style={{ fontSize: 9, fontFamily: 'monospace', fontWeight: 700, color: RS_COLOR(stock.rs), background: `${RS_COLOR(stock.rs)}18`, padding: '1px 6px', borderRadius: 4 }}>
            RS {stock.rs}
          </span>
        )}
        {groupRank && (
          <span style={{ fontSize: 9, fontFamily: 'monospace', fontWeight: 700,
            color: groupRank <= 10 ? '#f59e0b' : groupRank <= 20 ? '#34d399' : '#3b82f6',
            background: groupRank <= 10 ? '#f59e0b18' : groupRank <= 20 ? '#34d39918' : '#3b82f618',
            padding: '1px 6px', borderRadius: 4 }}
            title={groupName}
          >
            Grp #{groupRank}
          </span>
        )}
        {groupName && (
          <span style={{ fontSize: 9, color: 'var(--text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>{groupName}</span>
        )}
      </div>

      {/* TradingView chart */}
      <MiniChart ticker={stock.ticker} range={range} height={180} />
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────────

export default function Screener({ stocksByTicker, clipboard, onClip, industryGroupData = [] }) {
  const [activeTab, setActiveTab] = useState('Descriptive');
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });
  const [groupRankMax, setGroupRankMax] = useState(null);
  const [sortKey, setSortKey] = useState('rs');
  const [sortDir, setSortDir] = useState('desc');
  const [activePreset, setActivePreset] = useState(null);
  const [popupStock, setPopupStock] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [chartRange, setChartRange] = useState('3M');

  // Build ticker → {rank, name, avgRS} from live industryGroupData
  const tickerToGroupInfo = useMemo(() => {
    const map = {};
    // industryGroupData is sorted by rank (rank=1 is best)
    industryGroupData.forEach(g => {
      const groupName = g.name;
      const groupRank = g.rank;
      // Find all tickers in this group from INDUSTRY_GROUPS
      const groupDef = INDUSTRY_GROUPS.find(ig => ig.name === groupName);
      if (groupDef) {
        groupDef.tickers.forEach(t => {
          if (!map[t]) map[t] = { rank: groupRank, name: groupName, avgRS: g.avgRS };
        });
      }
    });
    return map;
  }, [industryGroupData]);

  const allStocks = useMemo(() => Object.values(stocksByTicker), [stocksByTicker]);
  const filtered  = useMemo(
    () => applyFilters(allStocks, filters, groupRankMax, Object.fromEntries(Object.entries(tickerToGroupInfo).map(([t, g]) => [t, g.rank]))),
    [allStocks, filters, groupRankMax, tickerToGroupInfo]
  );

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    // Support sorting by group rank
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

  const chartStocks = useMemo(() => sorted.slice(0, CHART_MAX), [sorted]);

  const handleSort = key => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir(key === 'groupRank' ? 'asc' : 'desc'); }
  };

  const applyPreset = (preset, idx) => {
    if (activePreset === idx) {
      setFilters({ ...DEFAULT_FILTERS });
      setGroupRankMax(null);
      setActivePreset(null);
    } else {
      setFilters({ ...DEFAULT_FILTERS, ...preset.filters });
      setGroupRankMax(preset.groupRankMax ?? null);
      setActivePreset(idx);
    }
  };

  const resetFilters = () => {
    setFilters({ ...DEFAULT_FILTERS });
    setGroupRankMax(null);
    setActivePreset(null);
  };

  const hasActiveFilters = groupRankMax != null || Object.entries(filters).some(([, v]) =>
    Array.isArray(v) ? v.length > 0 : v !== ''
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

      {/* ── Presets ── */}
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 12, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'monospace', paddingTop: 5 }}>Preset:</span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PRESETS.map((p, i) => (
            <button key={p.label} onClick={() => applyPreset(p, i)} title={p.desc} style={{
              padding: '5px 13px', fontSize: 11, fontFamily: 'monospace', fontWeight: 600,
              borderRadius: 20, border: '1px solid', cursor: 'pointer', transition: 'all 0.15s',
              borderColor: activePreset === i ? '#3b82f6' : 'var(--border)',
              background:  activePreset === i ? 'rgba(59,130,246,0.15)' : 'transparent',
              color:       activePreset === i ? '#60a5fa' : 'var(--text-muted)',
            }}>{p.label}</button>
          ))}
          {hasActiveFilters && (
            <button onClick={resetFilters} style={{
              padding: '5px 13px', fontSize: 11, fontFamily: 'monospace', fontWeight: 600,
              borderRadius: 20, border: '1px solid #f87171', background: 'rgba(248,113,113,0.1)', color: '#f87171', cursor: 'pointer',
            }}>✕ Reset</button>
          )}
        </div>
      </div>

      {/* ── Group Rank Filter ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'monospace' }}>Industry Group Rank:</span>
        <div style={{ display: 'flex', gap: 5 }}>
          {GROUP_RANK_OPTIONS.map(opt => (
            <button key={String(opt.value)} onClick={() => setGroupRankMax(opt.value)} style={{
              padding: '4px 12px', fontSize: 11, fontFamily: 'monospace', fontWeight: 600,
              borderRadius: 20, border: '1px solid', cursor: 'pointer', transition: 'all 0.15s',
              borderColor: groupRankMax === opt.value ? '#f59e0b' : 'var(--border)',
              background:  groupRankMax === opt.value ? 'rgba(245,158,11,0.15)' : 'transparent',
              color:       groupRankMax === opt.value ? '#f59e0b' : 'var(--text-muted)',
            }}>{opt.label}</button>
          ))}
        </div>
        {industryGroupData.length === 0 && (
          <span style={{ fontSize: 10, color: '#f59e0b', fontFamily: 'monospace' }}>⚠ Group data loading…</span>
        )}
      </div>

      {/* ── Filter Panel ── */}
      <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 16, overflow: 'hidden' }}>
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
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', paddingRight: 16, gap: 8 }}>
            {groupRankMax && (
              <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#f59e0b', fontWeight: 700 }}>
                Top {groupRankMax} Groups
              </span>
            )}
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: filtered.length >= allStocks.length ? 'var(--text-faint)' : '#3b82f6', fontWeight: 600 }}>
              {filtered.length} / {allStocks.length}
            </span>
          </div>
        </div>

        <div style={{ padding: '16px 18px' }}>
          {activeTab === 'Descriptive' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <SectorToggle sectors={filters.sectors} onChange={v => setFilters(f => ({ ...f, sectors: v }))} />
              <StageToggle  stages={filters.stages}   onChange={v => setFilters(f => ({ ...f, stages: v }))} />
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
              </FilterGroup>
              <FilterGroup title="Price Action">
                <RangeRow label="Price ($)"            minKey="priceMin"          maxKey="priceMax"          {...sf} step="0.01" />
                <RangeRow label="Change Today (%)"     minKey="changeMin"         maxKey="changeMax"         {...sf} />
                <RangeRow label="Change from Open (%)" minKey="changeFromOpenMin" maxKey="changeFromOpenMax" {...sf} />
                <RangeRow label="Target Price Upside (%)" minKey="targetUpsideMin" maxKey="targetUpsideMax"  {...sf} />
              </FilterGroup>
              <FilterGroup title="52-Week Range">
                <RangeRow label="% from 52-Week High"  minKey="distHighMin"  maxKey="distHighMax"  {...sf} />
                <RangeRow label="% from 52-Week Low"   minKey="distLowMin"   maxKey="distLowMax"   {...sf} />
              </FilterGroup>
              <FilterGroup title="Volatility & Strength">
                <RangeRow label="RS Rating"            minKey="rsMin"     maxKey="rsMax"     {...sf} />
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
            <button
              key={v.key}
              onClick={() => setViewMode(v.key)}
              style={{
                padding: '5px 14px', fontSize: 12, fontFamily: 'monospace', fontWeight: 600,
                borderRadius: 6, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: viewMode === v.key ? '#3b82f6' : 'transparent',
                color: viewMode === v.key ? '#fff' : 'var(--text-muted)',
              }}
            >{v.icon} {v.label}</button>
          ))}
        </div>

        {/* Range pills (charts mode only) */}
        {viewMode === 'charts' && (
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--text-faint)', fontFamily: 'monospace' }}>Range:</span>
            {CHART_RANGES.map(r => (
              <button key={r} onClick={() => setChartRange(r)} style={{
                padding: '4px 10px', fontSize: 11, fontFamily: 'monospace', fontWeight: 600,
                borderRadius: 20, border: '1px solid', cursor: 'pointer', transition: 'all 0.15s',
                borderColor: chartRange === r ? '#a78bfa' : 'var(--border)',
                background:  chartRange === r ? 'rgba(167,139,250,0.15)' : 'transparent',
                color:       chartRange === r ? '#a78bfa' : 'var(--text-muted)',
              }}>{r}</button>
            ))}
          </div>
        )}

        <span style={{ marginLeft: 'auto', fontSize: 11, fontFamily: 'monospace', color: 'var(--text-faint)' }}>
          {sorted.length} result{sorted.length !== 1 ? 's' : ''}
          {viewMode === 'charts' && sorted.length > CHART_MAX && ` · showing top ${CHART_MAX}`}
        </span>
      </div>

      {/* ── List View ── */}
      {viewMode === 'list' && (
        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <SortTh label="Ticker"    col="ticker"         align="left" {...thProps} />
                  <th style={{ padding: '6px 10px', fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', fontFamily: 'monospace', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</th>
                  <SortTh label="Group"     col="groupRank"      align="left" title="Industry Group Rank" {...thProps} />
                  <SortTh label="Price"     col="price"          {...thProps} />
                  <SortTh label="Today"     col="change"         {...thProps} />
                  <SortTh label="1W"        col="w1"             {...thProps} />
                  <SortTh label="1M"        col="m1"             {...thProps} />
                  <SortTh label="3M"        col="m3"             {...thProps} />
                  <SortTh label="RS"        col="rs"             {...thProps} />
                  <SortTh label="Vol Buzz"  col="volBuzz"        {...thProps} />
                  <SortTh label="52w High"  col="distSma52wHigh" {...thProps} />
                  <SortTh label="Mkt Cap"   col="marketCapB"     {...thProps} />
                  <SortTh label="P/E"       col="pe"             {...thProps} />
                  <SortTh label="Stage"     col="stage"          align="center" {...thProps} />
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={14} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-faint)', fontFamily: 'monospace', fontSize: 13 }}>
                      No stocks match the current filters
                    </td>
                  </tr>
                ) : (
                  sorted.map((stock, i) => {
                    const gi = tickerToGroupInfo[stock.ticker];
                    return (
                      <StockRow
                        key={stock.ticker} stock={stock} i={i}
                        onTickerClick={setPopupStock}
                        cs={clipState(stock.ticker)}
                        onClip={onClip}
                        groupRank={gi?.rank}
                        groupName={gi?.name}
                      />
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {sorted.length > 0 && (
            <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)', fontSize: 10, fontFamily: 'monospace', color: 'var(--text-faint)' }}>
              {sorted.length} result{sorted.length !== 1 ? 's' : ''} · Click row to add to Clipboard (1=Long 🟢, 2=Short 🔴, 3=Universe 🔵) · Click ticker for details · Group # = Industry Group Rank
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
          ) : sorted.length > CHART_MAX ? (
            <div style={{ padding: '16px 20px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, marginBottom: 12, fontSize: 12, color: '#f59e0b', fontFamily: 'monospace' }}>
              ⚠ {sorted.length} results — showing top {CHART_MAX}. Apply more filters to see fewer stocks.
            </div>
          ) : null}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
            gap: 10,
          }}>
            {chartStocks.map(stock => {
              const gi = tickerToGroupInfo[stock.ticker];
              return (
                <ChartCard
                  key={stock.ticker}
                  stock={stock}
                  range={chartRange}
                  cs={clipState(stock.ticker)}
                  onClip={onClip}
                  onTickerClick={setPopupStock}
                  groupRank={gi?.rank}
                  groupName={gi?.name}
                />
              );
            })}
          </div>
        </div>
      )}

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
