import { useState, useMemo } from 'react';
import { INDUSTRY_GROUPS } from '../data/stockUniverse';
import { CLIP_COLORS } from './ClipboardPanel';

const RS_COLOR = rs => rs >= 80 ? '#10b981' : rs >= 60 ? '#3b82f6' : rs >= 40 ? '#f59e0b' : '#e879f9';

// ── Build ticker→group lookup from live industryGroupData ─────────────────
function buildGroupMap(industryGroupData) {
  const map = {};
  industryGroupData.forEach(g => {
    const groupDef = INDUSTRY_GROUPS.find(ig => ig.name === g.name);
    if (groupDef) {
      groupDef.tickers.forEach(t => {
        if (!map[t]) map[t] = { rank: g.rank, name: g.name, sector: groupDef.sector };
      });
    }
  });
  return map;
}

function clipStateOf(clipboard, ticker) {
  if ((clipboard?.long     ?? []).some(t => t.ticker === ticker)) return 'long';
  if ((clipboard?.short    ?? []).some(t => t.ticker === ticker)) return 'short';
  if ((clipboard?.universe ?? []).some(t => t.ticker === ticker)) return 'universe';
  return null;
}

// ── One ticker pill ─────────────────────────────────────────────────────
function TickerPill({ s, color, selected, clipState, onSelect }) {
  return (
    <button
      onClick={() => onSelect(s.ticker)}
      title={`${s.ticker} — RS ${s.rs ?? '—'}`}
      style={{
        display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', borderRadius: 6,
        border: `1px solid ${selected ? color : clipState ? CLIP_COLORS[clipState] : 'var(--border)'}`,
        background: selected ? `${color}1f` : 'var(--bg)', cursor: 'pointer', lineHeight: 1,
      }}
    >
      {clipState && !selected && <span style={{ width: 5, height: 5, borderRadius: '50%', background: CLIP_COLORS[clipState], flexShrink: 0 }} />}
      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color }}>{s.ticker}</span>
      <span style={{ fontFamily: 'monospace', fontSize: 10, color: RS_COLOR(s.rs ?? 0) }}>{s.rs ?? '—'}</span>
    </button>
  );
}

// ── One column (Highs or Lows) ───────────────────────────────────────────
function HighLowColumn({ title, icon, color, stocks, groupMap, clipboard, selected, onSelect }) {
  const groups = useMemo(() => {
    const byGroup = {};
    stocks.forEach(s => {
      const gi = groupMap[s.ticker];
      const key = gi?.name || 'Other / Ungrouped';
      if (!byGroup[key]) byGroup[key] = { name: key, sector: gi?.sector, tickers: [] };
      byGroup[key].tickers.push(s);
    });
    return Object.values(byGroup)
      .map(g => ({ ...g, tickers: [...g.tickers].sort((a, b) => (b.rs ?? 0) - (a.rs ?? 0)) }))
      .sort((a, b) => b.tickers.length - a.tickers.length);
  }, [stocks, groupMap]);

  return (
    <div style={{ flex: '1 1 0', minWidth: 0 }}>
      <div style={{
        textAlign: 'center', padding: '10px 0 12px', color, fontWeight: 700, fontFamily: 'monospace', fontSize: 13,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}>
        <span>{icon}</span> {title} <span style={{ opacity: 0.65 }}>({stocks.length})</span>
      </div>

      {groups.length === 0 ? (
        <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 12, fontFamily: 'monospace' }}>
          No stocks match right now
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 640, overflowY: 'auto', padding: '0 10px' }}>
          {groups.map(g => (
            <div key={g.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, gap: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {g.name}
                  <span title={g.sector || g.name} style={{ fontSize: 9, color: 'var(--text-faint)', cursor: 'default', flexShrink: 0 }}>ⓘ</span>
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{g.tickers.length} hits</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {g.tickers.map(s => (
                  <TickerPill key={s.ticker} s={s} color={color}
                    selected={selected === s.ticker}
                    clipState={clipStateOf(clipboard, s.ticker)}
                    onSelect={onSelect} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Selected-ticker detail footer ────────────────────────────────────────
function DetailBar({ stock, clipState, onClip }) {
  const changeColor = stock.change > 0 ? '#22c55e' : stock.change < 0 ? '#f87171' : 'var(--text-muted)';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '10px 16px',
      borderTop: '1px solid var(--border)', background: 'var(--bg-panel)',
      borderRadius: '0 0 12px 12px', flexWrap: 'wrap',
    }}>
      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{stock.ticker}</span>
      <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>${stock.price?.toFixed(2)}</span>
      <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: changeColor }}>
        {stock.change > 0 ? '+' : ''}{stock.change?.toFixed(2)}%
      </span>
      <span style={{ fontFamily: 'monospace', fontSize: 11, color: RS_COLOR(stock.rs ?? 0) }}>RS {stock.rs ?? '—'}</span>
      <button
        onClick={() => onClip(stock.ticker, stock.name)}
        style={{
          fontSize: 11, fontFamily: 'monospace', fontWeight: 600, padding: '2px 9px', borderRadius: 6, cursor: 'pointer',
          border: `1px solid ${clipState ? CLIP_COLORS[clipState] : 'var(--border)'}`,
          background: clipState ? `${CLIP_COLORS[clipState]}22` : 'transparent',
          color: clipState ? CLIP_COLORS[clipState] : 'var(--text-muted)',
        }}
      >{clipState ? `📌 ${clipState}` : '📌 Clip'}</button>
      <div style={{ flex: 1 }} />
      <a
        onClick={() => window.open(`https://www.tradingview.com/chart/?symbol=${stock.ticker}`, '_blank', 'noopener')}
        style={{ fontSize: 11, fontFamily: 'monospace', color: '#60a5fa', cursor: 'pointer', textDecoration: 'none' }}
      >Open Chart →</a>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function HighLowScanner({ stocksByTicker, industryGroupData = [], clipboard, onClip }) {
  const [selected, setSelected] = useState(null);

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

  const selectedStock = selected ? stocksByTicker[selected] : null;

  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex' }}>
        <HighLowColumn title="Highs" icon="🏔" color="#60a5fa" stocks={highStocks} groupMap={groupMap}
          clipboard={clipboard} selected={selected} onSelect={setSelected} />
        <div style={{ width: 1, background: 'var(--border)', flexShrink: 0 }} />
        <HighLowColumn title="Lows" icon="🕳" color="#f87171" stocks={lowStocks} groupMap={groupMap}
          clipboard={clipboard} selected={selected} onSelect={setSelected} />
      </div>

      {selectedStock && onClip && (
        <DetailBar stock={selectedStock} clipState={clipStateOf(clipboard, selectedStock.ticker)} onClip={onClip} />
      )}

      <p style={{ textAlign: 'center', fontSize: 10, fontFamily: 'monospace', color: 'var(--text-faint)', margin: 0, padding: '10px 0', borderTop: selectedStock ? 'none' : '1px solid var(--border)' }}>
        Within 5% of 52-week high/low · Grouped by industry, sorted by hit count · Click a ticker for details
      </p>
    </div>
  );
}
