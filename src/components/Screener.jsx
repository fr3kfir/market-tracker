import { useState, useMemo } from 'react';
import { SECTOR_STOCKS, INDUSTRY_GROUPS } from '../data/stockUniverse';

const RS_COLOR = (rs) => {
  if (rs >= 80) return '#10b981';
  if (rs >= 60) return '#3b82f6';
  if (rs >= 40) return '#f59e0b';
  return '#e879f9';
};

const STAGE_COLORS = { S1: '#94a3b8', S2: '#60a5fa', S3: '#f59e0b', S4: '#f472b6' };

const SECTORS = Object.keys(SECTOR_STOCKS);

const FILTER_TABS = ['Descriptive', 'Technical', 'Performance'];

const PRESETS = [
  { label: 'Stage 2 Leaders', filters: { stages: ['S2'], rsMin: 70, rsMax: 99 } },
  { label: 'High RS (80+)',   filters: { rsMin: 80, rsMax: 99 } },
  { label: 'Volume Surge',    filters: { volBuzzMin: 2 } },
  { label: 'Near 52w High',   filters: { distHighMin: -5, distHighMax: 0 } },
  { label: 'Big Movers Today',filters: { changeMin: 4 } },
];

const DEFAULT_FILTERS = {
  sectors: [],
  stages: [],
  rsMin: '', rsMax: '',
  changeMin: '', changeMax: '',
  volBuzzMin: '', volBuzzMax: '',
  distHighMin: '', distHighMax: '',
  distSma50Min: '', distSma50Max: '',
  w1Min: '', w1Max: '',
  m1Min: '', m1Max: '',
  m3Min: '', m3Max: '',
};

function pct(val) {
  if (val == null) return '—';
  return `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;
}

function PerfCell({ value }) {
  if (value == null) return <span style={{ color: 'var(--text-faint)', fontFamily: 'monospace', fontSize: 11 }}>—</span>;
  const color = value >= 0 ? '#34d399' : '#f87171';
  return (
    <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color }}>
      {value >= 0 ? '+' : ''}{value.toFixed(2)}%
    </span>
  );
}

function FilterSelect({ label, value, onChange, options, placeholder = 'Any' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 130 }}>
      <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6,
          color: 'var(--text)', fontFamily: 'monospace', fontSize: 12,
          padding: '5px 8px', cursor: 'pointer', outline: 'none',
        }}
      >
        <option value="">{placeholder}</option>
        {options.map(o => (
          <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
        ))}
      </select>
    </div>
  );
}

function RangeInputs({ label, minKey, maxKey, filters, setFilters, placeholder = '' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 150 }}>
      <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <input
          type="number"
          placeholder="Min"
          value={filters[minKey]}
          onChange={e => setFilters(f => ({ ...f, [minKey]: e.target.value }))}
          style={{
            width: 60, background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: 6, color: 'var(--text)', fontFamily: 'monospace', fontSize: 12,
            padding: '5px 6px', outline: 'none',
          }}
        />
        <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>–</span>
        <input
          type="number"
          placeholder="Max"
          value={filters[maxKey]}
          onChange={e => setFilters(f => ({ ...f, [maxKey]: e.target.value }))}
          style={{
            width: 60, background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: 6, color: 'var(--text)', fontFamily: 'monospace', fontSize: 12,
            padding: '5px 6px', outline: 'none',
          }}
        />
      </div>
    </div>
  );
}

function StageToggle({ stages, onChange }) {
  const all = ['S1', 'S2', 'S3', 'S4'];
  const toggle = (s) => {
    if (stages.includes(s)) onChange(stages.filter(x => x !== s));
    else onChange([...stages, s]);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Stage</span>
      <div style={{ display: 'flex', gap: 5 }}>
        {all.map(s => (
          <button
            key={s}
            onClick={() => toggle(s)}
            style={{
              padding: '4px 10px', fontFamily: 'monospace', fontSize: 12, fontWeight: 700,
              borderRadius: 6, border: `1px solid ${stages.includes(s) ? STAGE_COLORS[s] : 'var(--border)'}`,
              background: stages.includes(s) ? `${STAGE_COLORS[s]}22` : 'transparent',
              color: stages.includes(s) ? STAGE_COLORS[s] : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >{s}</button>
        ))}
      </div>
    </div>
  );
}

function SectorToggle({ sectors, onChange }) {
  const toggle = (s) => {
    if (sectors.includes(s)) onChange(sectors.filter(x => x !== s));
    else onChange([...sectors, s]);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sector</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {SECTORS.map(s => (
          <button
            key={s}
            onClick={() => toggle(s)}
            style={{
              padding: '3px 9px', fontFamily: 'monospace', fontSize: 11, fontWeight: 600,
              borderRadius: 20, border: '1px solid',
              borderColor: sectors.includes(s) ? '#3b82f6' : 'var(--border)',
              background: sectors.includes(s) ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: sectors.includes(s) ? '#60a5fa' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >{s}</button>
        ))}
      </div>
    </div>
  );
}

// Build ticker → sector map
function buildSectorMap() {
  const map = {};
  Object.entries(SECTOR_STOCKS).forEach(([sector, tickers]) => {
    tickers.forEach(t => { if (!map[t]) map[t] = sector; });
  });
  return map;
}
const TICKER_SECTOR = buildSectorMap();

function applyFilters(stocks, filters) {
  return stocks.filter(s => {
    if (filters.sectors.length && !filters.sectors.includes(TICKER_SECTOR[s.ticker])) return false;
    if (filters.stages.length && !filters.stages.includes(s.stage)) return false;
    if (filters.rsMin !== '' && (s.rs == null || s.rs < Number(filters.rsMin))) return false;
    if (filters.rsMax !== '' && (s.rs == null || s.rs > Number(filters.rsMax))) return false;
    if (filters.changeMin !== '' && (s.change == null || s.change < Number(filters.changeMin))) return false;
    if (filters.changeMax !== '' && (s.change == null || s.change > Number(filters.changeMax))) return false;
    if (filters.volBuzzMin !== '' && (s.volBuzz == null || s.volBuzz < Number(filters.volBuzzMin))) return false;
    if (filters.volBuzzMax !== '' && (s.volBuzz == null || s.volBuzz > Number(filters.volBuzzMax))) return false;
    if (filters.distHighMin !== '' && (s.distSma52wHigh == null || s.distSma52wHigh < Number(filters.distHighMin))) return false;
    if (filters.distHighMax !== '' && (s.distSma52wHigh == null || s.distSma52wHigh > Number(filters.distHighMax))) return false;
    if (filters.distSma50Min !== '' && (s.distSma50 == null || s.distSma50 < Number(filters.distSma50Min))) return false;
    if (filters.distSma50Max !== '' && (s.distSma50 == null || s.distSma50 > Number(filters.distSma50Max))) return false;
    if (filters.w1Min !== '' && (s.w1 == null || s.w1 < Number(filters.w1Min))) return false;
    if (filters.w1Max !== '' && (s.w1 == null || s.w1 > Number(filters.w1Max))) return false;
    if (filters.m1Min !== '' && (s.m1 == null || s.m1 < Number(filters.m1Min))) return false;
    if (filters.m1Max !== '' && (s.m1 == null || s.m1 > Number(filters.m1Max))) return false;
    if (filters.m3Min !== '' && (s.m3 == null || s.m3 < Number(filters.m3Min))) return false;
    if (filters.m3Max !== '' && (s.m3 == null || s.m3 > Number(filters.m3Max))) return false;
    return true;
  });
}

const SORT_KEYS = ['ticker', 'price', 'change', 'rs', 'volBuzz', 'distSma52wHigh', 'distSma50', 'stage'];

export default function Screener({ stocksByTicker }) {
  const [activeTab, setActiveTab] = useState('Descriptive');
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });
  const [sortKey, setSortKey] = useState('rs');
  const [sortDir, setSortDir] = useState('desc');
  const [activePreset, setActivePreset] = useState(null);

  const allStocks = useMemo(() => Object.values(stocksByTicker), [stocksByTicker]);

  const filtered = useMemo(() => applyFilters(allStocks, filters), [allStocks, filters]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? (sortDir === 'desc' ? -Infinity : Infinity);
      const bv = b[sortKey] ?? (sortDir === 'desc' ? -Infinity : Infinity);
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'desc' ? bv - av : av - bv;
    });
  }, [filtered, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const applyPreset = (preset, idx) => {
    if (activePreset === idx) {
      setFilters({ ...DEFAULT_FILTERS });
      setActivePreset(null);
    } else {
      setFilters({ ...DEFAULT_FILTERS, ...preset.filters });
      setActivePreset(idx);
    }
  };

  const resetFilters = () => {
    setFilters({ ...DEFAULT_FILTERS });
    setActivePreset(null);
  };

  const hasActiveFilters = Object.entries(filters).some(([k, v]) =>
    Array.isArray(v) ? v.length > 0 : v !== ''
  );

  const SortTh = ({ label, col, align = 'right' }) => (
    <th
      onClick={() => handleSort(col)}
      style={{
        padding: '6px 10px', fontSize: 10, fontWeight: 600, cursor: 'pointer',
        color: sortKey === col ? '#3b82f6' : 'var(--text-faint)',
        fontFamily: 'monospace', textAlign: align,
        textTransform: 'uppercase', letterSpacing: '0.05em',
        userSelect: 'none', whiteSpace: 'nowrap',
      }}
    >
      {label} {sortKey === col ? (sortDir === 'desc' ? '↓' : '↑') : ''}
    </th>
  );

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* ── Preset Filters ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'monospace', marginRight: 2 }}>Quick:</span>
        {PRESETS.map((p, i) => (
          <button
            key={p.label}
            onClick={() => applyPreset(p, i)}
            style={{
              padding: '4px 12px', fontSize: 11, fontFamily: 'monospace', fontWeight: 600,
              borderRadius: 20, border: '1px solid',
              cursor: 'pointer', transition: 'all 0.15s',
              borderColor: activePreset === i ? '#3b82f6' : 'var(--border)',
              background: activePreset === i ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: activePreset === i ? '#60a5fa' : 'var(--text-muted)',
            }}
          >{p.label}</button>
        ))}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            style={{
              padding: '4px 12px', fontSize: 11, fontFamily: 'monospace', fontWeight: 600,
              borderRadius: 20, border: '1px solid #f87171', background: 'rgba(248,113,113,0.1)',
              color: '#f87171', cursor: 'pointer',
            }}
          >✕ Reset</button>
        )}
      </div>

      {/* ── Filter Panel ── */}
      <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 16, overflow: 'hidden' }}>

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          {FILTER_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '9px 18px', fontSize: 12, fontWeight: activeTab === tab ? 700 : 500,
                fontFamily: 'monospace', cursor: 'pointer', background: 'transparent',
                color: activeTab === tab ? '#3b82f6' : 'var(--text-muted)',
                borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
                transition: 'all 0.15s',
              }}
            >{tab}</button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', paddingRight: 14 }}>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: filtered.length >= allStocks.length ? 'var(--text-faint)' : '#3b82f6' }}>
              {filtered.length} / {allStocks.length} stocks
            </span>
          </div>
        </div>

        {/* Filter body */}
        <div style={{ padding: '14px 16px', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>

          {activeTab === 'Descriptive' && (
            <>
              <SectorToggle
                sectors={filters.sectors}
                onChange={v => setFilters(f => ({ ...f, sectors: v }))}
              />
              <StageToggle
                stages={filters.stages}
                onChange={v => setFilters(f => ({ ...f, stages: v }))}
              />
            </>
          )}

          {activeTab === 'Technical' && (
            <>
              <RangeInputs label="RS Rating" minKey="rsMin" maxKey="rsMax" filters={filters} setFilters={setFilters} />
              <RangeInputs label="Vol Buzz (x avg)" minKey="volBuzzMin" maxKey="volBuzzMax" filters={filters} setFilters={setFilters} />
              <RangeInputs label="% from 52w High" minKey="distHighMin" maxKey="distHighMax" filters={filters} setFilters={setFilters} />
              <RangeInputs label="% from 50 SMA" minKey="distSma50Min" maxKey="distSma50Max" filters={filters} setFilters={setFilters} />
            </>
          )}

          {activeTab === 'Performance' && (
            <>
              <RangeInputs label="Today %" minKey="changeMin" maxKey="changeMax" filters={filters} setFilters={setFilters} />
              <RangeInputs label="1 Week %" minKey="w1Min" maxKey="w1Max" filters={filters} setFilters={setFilters} />
              <RangeInputs label="1 Month %" minKey="m1Min" maxKey="m1Max" filters={filters} setFilters={setFilters} />
              <RangeInputs label="3 Month %" minKey="m3Min" maxKey="m3Max" filters={filters} setFilters={setFilters} />
            </>
          )}

        </div>
      </div>

      {/* ── Results Table ── */}
      <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <SortTh label="Ticker" col="ticker" align="left" />
                <th style={{ padding: '6px 10px', fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', fontFamily: 'monospace', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</th>
                <SortTh label="Price" col="price" />
                <SortTh label="Today" col="change" />
                <SortTh label="1W" col="w1" />
                <SortTh label="1M" col="m1" />
                <SortTh label="3M" col="m3" />
                <SortTh label="RS" col="rs" />
                <SortTh label="Vol Buzz" col="volBuzz" />
                <SortTh label="52w High" col="distSma52wHigh" />
                <SortTh label="Stage" col="stage" />
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-faint)', fontFamily: 'monospace', fontSize: 13 }}>
                    No stocks match the current filters
                  </td>
                </tr>
              ) : (
                sorted.map((stock, i) => (
                  <StockResultRow key={stock.ticker} stock={stock} i={i} />
                ))
              )}
            </tbody>
          </table>
        </div>
        {sorted.length > 0 && (
          <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)', fontSize: 10, fontFamily: 'monospace', color: 'var(--text-faint)' }}>
            {sorted.length} result{sorted.length !== 1 ? 's' : ''} · Click column headers to sort
          </div>
        )}
      </div>
    </div>
  );
}

function StockResultRow({ stock, i }) {
  const [hover, setHover] = useState(false);
  return (
    <tr
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        borderBottom: '1px solid var(--border)',
        background: hover ? 'rgba(59,130,246,0.06)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
        transition: 'background 0.1s',
      }}
    >
      <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#60a5fa', whiteSpace: 'nowrap' }}>
        {stock.ticker}
      </td>
      <td style={{ padding: '7px 10px', fontSize: 11, color: 'var(--text-muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {stock.name || '—'}
      </td>
      <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text)', textAlign: 'right' }}>
        {stock.price != null ? `$${stock.price.toFixed(2)}` : '—'}
      </td>
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
      <td style={{ padding: '7px 10px', textAlign: 'center' }}>
        {stock.stage ? (
          <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: STAGE_COLORS[stock.stage] || 'var(--text-faint)' }}>
            {stock.stage}
          </span>
        ) : '—'}
      </td>
    </tr>
  );
}
