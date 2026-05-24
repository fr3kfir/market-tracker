import { useState, useMemo } from 'react';
import TickerInfoPopup from './TickerInfoPopup';

const STAGE_COLORS = { S1: '#94a3b8', S2: '#60a5fa', S3: '#f59e0b', S4: '#f472b6' };
const RS_COLOR = rs => rs >= 80 ? '#10b981' : rs >= 60 ? '#3b82f6' : rs >= 40 ? '#f59e0b' : '#e879f9';

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toDateStr(date) {
  return date.toISOString().slice(0, 10);
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z');
  const today = toDateStr(new Date());
  const tomorrow = toDateStr(addDays(new Date(), 1));
  if (dateStr === today) return 'Today';
  if (dateStr === tomorrow) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function EarningsCalendar({ stocksByTicker, onClip }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [popupStock, setPopupStock] = useState(null);

  const today = new Date();
  const startDate = addDays(today, weekOffset * 7);
  const endDate = addDays(startDate, 27); // 4-week window

  const startStr = toDateStr(startDate);
  const endStr = toDateStr(endDate);

  const grouped = useMemo(() => {
    const allStocks = Object.values(stocksByTicker);
    const withEarnings = allStocks.filter(s => {
      if (!s.earningsDate) return false;
      return s.earningsDate >= startStr && s.earningsDate <= endStr;
    });

    const map = {};
    withEarnings.forEach(s => {
      const d = s.earningsDate;
      if (!map[d]) map[d] = [];
      map[d].push(s);
    });

    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stocks]) => ({
        date,
        stocks: [...stocks].sort((a, b) => (b.rs || 0) - (a.rs || 0)),
      }));
  }, [stocksByTicker, startStr, endStr]);

  const allEarningsStocks = useMemo(() => grouped.flatMap(g => g.stocks), [grouped]);
  const totalCount = allEarningsStocks.length;

  const windowLabel = weekOffset === 0
    ? 'Next 4 weeks'
    : weekOffset > 0
    ? `+${weekOffset * 7}d — +${weekOffset * 7 + 27}d`
    : `${weekOffset * 7}d — ${weekOffset * 7 + 27}d`;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={() => setWeekOffset(w => w - 1)} style={{ padding: '5px 12px', fontSize: 13, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-panel)', color: 'var(--text-muted)', cursor: 'pointer' }}>←</button>
          <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text)', fontWeight: 600, minWidth: 130, textAlign: 'center' }}>{windowLabel}</span>
          <button onClick={() => setWeekOffset(w => w + 1)} style={{ padding: '5px 12px', fontSize: 13, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-panel)', color: 'var(--text-muted)', cursor: 'pointer' }}>→</button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} style={{ padding: '4px 10px', fontSize: 11, fontFamily: 'monospace', fontWeight: 600, borderRadius: 20, border: '1px solid #3b82f6', background: 'rgba(59,130,246,0.12)', color: '#60a5fa', cursor: 'pointer' }}>Today</button>
          )}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 11, fontFamily: 'monospace', color: 'var(--text-faint)' }}>
          {totalCount} report{totalCount !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* No data state */}
      {grouped.length === 0 && (
        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12, padding: '48px 32px', textAlign: 'center', color: 'var(--text-faint)', fontFamily: 'monospace', fontSize: 12 }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>📭</div>
          <div style={{ fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>No earnings found in this window</div>
          <div style={{ fontSize: 11, lineHeight: 1.7, maxWidth: 440, margin: '0 auto' }}>
            This may be an <strong>off-season</strong> period between earnings seasons.<br />
            Q1 reports: <span style={{ color: '#60a5fa' }}>Apr–May</span> · Q2: <span style={{ color: '#60a5fa' }}>Jul–Aug</span> · Q3: <span style={{ color: '#60a5fa' }}>Oct–Nov</span> · Q4: <span style={{ color: '#60a5fa' }}>Jan–Feb</span>
          </div>
          <div style={{ marginTop: 14, display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button onClick={() => setWeekOffset(w => w + 1)} style={{ padding: '6px 16px', fontSize: 11, fontFamily: 'monospace', fontWeight: 600, borderRadius: 8, border: '1px solid #3b82f6', background: 'rgba(59,130,246,0.12)', color: '#60a5fa', cursor: 'pointer' }}>
              Check next month →
            </button>
            <button onClick={() => setWeekOffset(w => w - 1)} style={{ padding: '6px 16px', fontSize: 11, fontFamily: 'monospace', fontWeight: 600, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
              ← Check last month
            </button>
          </div>
        </div>
      )}

      {/* Date groups */}
      {grouped.map(({ date, stocks }) => (
        <div key={date} style={{ marginBottom: 20 }}>
          {/* Date header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', fontFamily: 'monospace' }}>{formatDateLabel(date)}</span>
            <span style={{ fontSize: 10, color: 'var(--text-faint)', fontFamily: 'monospace' }}>{date}</span>
            <span style={{ fontSize: 10, color: '#3b82f6', fontFamily: 'monospace', background: 'rgba(59,130,246,0.12)', padding: '1px 7px', borderRadius: 20 }}>{stocks.length} cos.</span>
          </div>

          {/* Stocks table */}
          <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            {stocks.map((s, i) => (
              <div
                key={s.ticker}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: i < stocks.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer', transition: 'background 0.1s' }}
                onClick={() => setPopupStock(s)}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Ticker */}
                <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 800, color: '#60a5fa', minWidth: 60 }}>{s.ticker}</span>

                {/* Company name */}
                <span style={{ fontSize: 11, color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>

                {/* RS badge */}
                {s.rs != null && (
                  <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: RS_COLOR(s.rs), background: `${RS_COLOR(s.rs)}18`, padding: '2px 7px', borderRadius: 4, flexShrink: 0 }}>RS {s.rs}</span>
                )}

                {/* Stage badge */}
                {s.stage && (
                  <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: STAGE_COLORS[s.stage], background: `${STAGE_COLORS[s.stage]}22`, padding: '2px 7px', borderRadius: 4, flexShrink: 0 }}>{s.stage}</span>
                )}

                {/* Price + change */}
                <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 80 }}>
                  {s.price != null && <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>${s.price.toFixed(2)}</div>}
                  {s.change != null && (
                    <div style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: s.change >= 0 ? '#34d399' : '#f87171' }}>
                      {s.change >= 0 ? '+' : ''}{s.change.toFixed(2)}%
                    </div>
                  )}
                </div>

                {/* EPS Forward */}
                {s.epsF != null && (
                  <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 60 }}>
                    <div style={{ fontSize: 9, color: 'var(--text-faint)', fontFamily: 'monospace' }}>Est. EPS</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: s.epsF >= 0 ? '#34d399' : '#f87171' }}>${s.epsF.toFixed(2)}</div>
                  </div>
                )}

                <span style={{ fontSize: 11, color: 'var(--text-faint)', marginLeft: 4 }}>›</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <p style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-faint)', marginTop: 10, fontFamily: 'monospace' }}>
        Earnings dates from Yahoo Finance · Click any stock to open chart + details
      </p>

      {popupStock && (
        <TickerInfoPopup
          ticker={popupStock.ticker}
          stock={popupStock}
          onClose={() => setPopupStock(null)}
          allStocks={allEarningsStocks}
          onClip={onClip}
        />
      )}
    </div>
  );
}
