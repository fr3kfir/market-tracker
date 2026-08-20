import { useState, useMemo } from 'react';
import { INDUSTRY_GROUPS } from '../data/stockUniverse';
import TickerInfoPopup from './TickerInfoPopup';

const HIGH_COLOR = '#3b82f6';
const LOW_COLOR  = '#ef4444';

// ── Build ticker→group lookup from live industryGroupData ─────────────────
function buildGroupMap(industryGroupData) {
  const map = {};
  industryGroupData.forEach(g => {
    const groupDef = INDUSTRY_GROUPS.find(ig => ig.name === g.name);
    if (groupDef) {
      groupDef.tickers.forEach(t => {
        if (!map[t]) map[t] = { rank: g.rank, name: g.name };
      });
    }
  });
  return map;
}

// ── Group stocks by industry group name, sorted by hit count desc ─────────
function groupStocks(stocks, groupMap) {
  const byGroup = {};
  stocks.forEach(s => {
    const name = groupMap[s.ticker]?.name || 'Other';
    if (!byGroup[name]) byGroup[name] = [];
    byGroup[name].push(s);
  });
  return Object.entries(byGroup)
    .map(([name, tickers]) => ({
      name,
      tickers: tickers.sort((a, b) => (b.rs ?? 0) - (a.rs ?? 0)),
    }))
    .sort((a, b) => b.tickers.length - a.tickers.length);
}

// ── Ticker pill ─────────────────────────────────────────────────────────
const CLIP_RING = { long: '#34d399', short: '#f87171', universe: '#60a5fa' };

function TickerPill({ s, color, selected, clipState, onSelect }) {
  const ring = clipState ? CLIP_RING[clipState] : null;
  return (
    <button
      onClick={() => onSelect(s)}
      style={{
        display: 'inline-flex', alignItems: 'baseline', gap: 5,
        padding: '4px 8px', borderRadius: 6, cursor: 'pointer',
        border: `1px solid ${selected ? color : (ring || color + '33')}`,
        background: selected ? color + '2c' : (ring ? ring + '14' : color + '10'),
        fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
        color: selected ? color : 'var(--text)',
        transition: 'all 0.12s',
      }}
    >
      <span>{s.ticker}</span>
      <span style={{ fontSize: 9, fontWeight: 600, color: selected ? color : 'var(--text-faint)' }}>{s.rs ?? '—'}</span>
    </button>
  );
}

// ── Group row ───────────────────────────────────────────────────────────
function GroupRow({ group, color, selected, clipStateOf, onSelect }) {
  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, padding: '0 2px' }}>
        <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>▸</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', flex: 1 }}>{group.name}</span>
        <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color }}>
          {group.tickers.length} hit{group.tickers.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {group.tickers.map(s => (
          <TickerPill
            key={s.ticker}
            s={s}
            color={color}
            selected={selected === s.ticker}
            clipState={clipStateOf(s.ticker)}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

// ── Column (Highs or Lows) ─────────────────────────────────────────────
function Column({ title, color, groups, selected, clipStateOf, onSelect, onClipAll }) {
  const totalCount = groups.reduce((n, g) => n + g.tickers.length, 0);
  return (
    <div style={{
      background: 'var(--bg-panel)', border: `1px solid ${color}33`,
      borderRadius: 12, overflow: 'hidden', flex: '1 1 0', minWidth: 0,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        padding: '10px 14px', borderBottom: `1px solid ${color}22`, background: `${color}0a`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'monospace' }}>{title}</span>
          <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>{totalCount} stocks</span>
        </div>
        <button
          onClick={onClipAll}
          disabled={totalCount === 0}
          style={{
            fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6, cursor: totalCount === 0 ? 'not-allowed' : 'pointer',
            border: `1px solid ${color}55`, background: 'transparent', color, opacity: totalCount === 0 ? 0.4 : 1,
          }}
        >Clip {title}</button>
      </div>
      <div style={{ padding: '4px 14px', overflowY: 'auto', maxHeight: 620 }}>
        {groups.length === 0 ? (
          <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-faint)', fontSize: 12 }}>No stocks match</div>
        ) : (
          groups.map(g => (
            <GroupRow key={g.name} group={g} color={color} selected={selected} clipStateOf={clipStateOf} onSelect={onSelect} />
          ))
        )}
      </div>
    </div>
  );
}

// ── Footer bar — selected ticker preview ───────────────────────────────
function SelectedBar({ s, onOpenChart, onClip, clipState }) {
  const changeColor = s.change > 0 ? '#22c55e' : s.change < 0 ? '#f87171' : 'var(--text-muted)';
  const ring = clipState ? CLIP_RING[clipState] : null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
      background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 16px',
    }}>
      <div>
        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: '#60a5fa' }}>{s.ticker}</span>
        <span style={{ fontSize: 11, color: 'var(--text-faint)', marginLeft: 8 }}>{s.name}</span>
      </div>
      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>${s.price?.toFixed(2)}</span>
      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: changeColor }}>
        {s.change > 0 ? '↑' : s.change < 0 ? '↓' : ''} {s.change > 0 ? '+' : ''}{s.change?.toFixed(2)}%
      </span>
      <span style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'monospace' }}>{s.rs ?? '—'} hits</span>
      <div style={{ flex: 1 }} />
      <button
        onClick={onClip}
        style={{
          fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 7, cursor: 'pointer',
          border: `1px solid ${ring || 'var(--border)'}`, background: ring ? ring + '18' : 'transparent',
          color: ring || 'var(--text-muted)',
        }}
      >{clipState ? clipState[0].toUpperCase() + clipState.slice(1) : 'Clip'}</button>
      <button
        onClick={onOpenChart}
        style={{
          fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 7, cursor: 'pointer',
          border: '1px solid #3b82f655', background: 'rgba(59,130,246,0.12)', color: '#60a5fa',
        }}
      >Open Chart →</button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function HighLowScanner({ stocksByTicker, industryGroupData = [], clipboard, onClip }) {
  const [selectedTicker, setSelectedTicker] = useState(null);
  const [popupStock, setPopupStock] = useState(null);

  const groupMap = useMemo(() => buildGroupMap(industryGroupData), [industryGroupData]);
  const allStocks = useMemo(() => Object.values(stocksByTicker), [stocksByTicker]);

  const highStocks = useMemo(
    () => allStocks.filter(s => s.distSma52wHigh !== undefined && s.distSma52wHigh >= -5 && s.distSma52wHigh <= 0.5),
    [allStocks]
  );
  const lowStocks = useMemo(
    () => allStocks.filter(s => s.distSma52wLow !== undefined && s.distSma52wLow >= 0 && s.distSma52wLow <= 5),
    [allStocks]
  );

  const highGroups = useMemo(() => groupStocks(highStocks, groupMap), [highStocks, groupMap]);
  const lowGroups  = useMemo(() => groupStocks(lowStocks, groupMap), [lowStocks, groupMap]);

  const clipStateOf = (ticker) => {
    if ((clipboard?.long     ?? []).some(t => t.ticker === ticker)) return 'long';
    if ((clipboard?.short    ?? []).some(t => t.ticker === ticker)) return 'short';
    if ((clipboard?.universe ?? []).some(t => t.ticker === ticker)) return 'universe';
    return null;
  };

  const selected = selectedTicker ? stocksByTicker[selectedTicker] : null;

  const clipAll = (stocks) => {
    stocks.forEach(s => { if (!clipStateOf(s.ticker)) onClip && onClip(s.ticker, s.name); });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Highs / Lows</span>
        </div>
        <span style={{ fontSize: 10, color: 'var(--text-faint)', fontFamily: 'monospace' }}>Grouped by Industry Group · click a ticker for details</span>
      </div>

      {selected && (
        <SelectedBar
          s={selected}
          clipState={clipStateOf(selected.ticker)}
          onClip={() => onClip && onClip(selected.ticker, selected.name)}
          onOpenChart={() => setPopupStock(selected)}
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'start' }}>
        <Column
          title="Highs" color={HIGH_COLOR} groups={highGroups}
          selected={selectedTicker} clipStateOf={clipStateOf}
          onSelect={s => setSelectedTicker(s.ticker)}
          onClipAll={() => clipAll(highStocks)}
        />
        <Column
          title="Lows" color={LOW_COLOR} groups={lowGroups}
          selected={selectedTicker} clipStateOf={clipStateOf}
          onSelect={s => setSelectedTicker(s.ticker)}
          onClipAll={() => clipAll(lowStocks)}
        />
      </div>

      <p style={{ textAlign: 'center', fontSize: 10, fontFamily: 'monospace', color: 'var(--text-faint)', margin: 0 }}>
        Within 5% of 52-week High/Low · Number next to ticker = RS Score · "hits" = stocks in group matching the criterion
      </p>

      {popupStock && (
        <TickerInfoPopup
          ticker={popupStock.ticker}
          stock={popupStock}
          onClose={() => setPopupStock(null)}
          allStocks={allStocks}
          onClip={onClip}
        />
      )}
    </div>
  );
}
