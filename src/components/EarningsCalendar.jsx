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
  const today    = toDateStr(new Date());
  const tomorrow = toDateStr(addDays(new Date(), 1));
  const yesterday = toDateStr(addDays(new Date(), -1));
  if (dateStr === today)     return '📅 Today';
  if (dateStr === tomorrow)  return 'Tomorrow';
  if (dateStr === yesterday) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function isPast(dateStr) {
  return dateStr < toDateStr(new Date());
}

export default function EarningsCalendar({ stocksByTicker, onClip }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [popupStock, setPopupStock] = useState(null);

  const today = new Date();
  // Default window: 7 days ago → today + 20 days (so we catch recently-reported + upcoming)
  // With weekOffset: shift the window by 7 days
  const windowStart = weekOffset === 0
    ? addDays(today, -7)           // week 0: show past week + next 20 days
    : addDays(today, weekOffset * 7);  // other weeks: future windows
  const windowEnd = weekOffset === 0
    ? addDays(today, 20)           // week 0: 27-day window centered on now
    : addDays(windowStart, 27);    // other weeks: strict 4-week future

  const startStr = toDateStr(windowStart);
  const endStr   = toDateStr(windowEnd);

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
        isReported: isPast(date),
      }));
  }, [stocksByTicker, startStr, endStr]);

  const allEarningsStocks = useMemo(() => grouped.flatMap(g => g.stocks), [grouped]);
  const totalCount        = allEarningsStocks.length;
  const upcomingCount     = grouped.filter(g => !g.isReported).reduce((s, g) => s + g.stocks.length, 0);
  const recentCount       = grouped.filter(g => g.isReported).reduce((s, g)  => s + g.stocks.length, 0);

  const windowLabel = weekOffset === 0
    ? 'Current window'
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
            <button onClick={() => setWeekOffset(0)} style={{ padding: '4px 10px', fontSize: 11, fontFamily: 'monospace', fontWeight: 600, borderRadius: 20, border: '1px solid #3b82f6', background: 'rgba(59,130,246,0.12)', color: '#60a5fa', cursor: 'pointer' }}>Now</button>
          )}
        </div>
        {/* Summary badges */}
        <div style={{ display: 'flex', gap: 6 }}>
          {upcomingCount > 0 && (
            <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#60a5fa', background: 'rgba(59,130,246,0.12)', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
              🔔 {upcomingCount} upcoming
            </span>
          )}
          {recentCount > 0 && (
            <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#94a3b8', background: 'rgba(148,163,184,0.1)', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
              ✓ {recentCount} reported
            </span>
          )}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 11, fontFamily: 'monospace', color: 'var(--text-faint)' }}>
          {totalCount} total
        </span>
      </div>

      {/* No data state */}
      {grouped.length === 0 && (
        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12, padding: '48px 32px', textAlign: 'center', color: 'var(--text-faint)', fontFamily: 'monospace', fontSize: 12 }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>📭</div>
          <div style={{ fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>No earnings found in this window</div>
          <div style={{ fontSize: 11, lineHeight: 1.7, maxWidth: 480, margin: '0 auto' }}>
            Earnings data is loading from Yahoo Finance — it may take 30–60 seconds on first load.<br/>
            <span style={{ color: '#94a3b8' }}>Earnings seasons: </span>
            <span style={{ color: '#60a5fa' }}>Q1: Apr–May</span> · <span style={{ color: '#60a5fa' }}>Q2: Jul–Aug</span> · <span style={{ color: '#60a5fa' }}>Q3: Oct–Nov</span> · <span style={{ color: '#60a5fa' }}>Q4: Jan–Feb</span><br/>
            Try the <strong>→</strong> button to browse future weeks.
          </div>
          <div style={{ marginTop: 14, display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button onClick={() => setWeekOffset(w => w + 1)} style={{ padding: '6px 16px', fontSize: 11, fontFamily: 'monospace', fontWeight: 600, borderRadius: 8, border: '1px solid #3b82f6', background: 'rgba(59,130,246,0.12)', color: '#60a5fa', cursor: 'pointer' }}>
              Check next month →
            </button>
            {weekOffset !== 0 && (
              <button onClick={() => setWeekOffset(0)} style={{ padding: '6px 16px', fontSize: 11, fontFamily: 'monospace', fontWeight: 600, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
                ← Back to now
              </button>
            )}
          </div>
        </div>
      )}

      {/* Date groups */}
      {grouped.map(({ date, stocks, isReported }) => (
        <div key={date} style={{ marginBottom: 20, opacity: isReported ? 0.65 : 1 }}>
          {/* Date header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: isReported ? 'var(--text-muted)' : 'var(--text)', fontFamily: 'monospace' }}>{formatDateLabel(date)}</span>
            <span style={{ fontSize: 10, color: 'var(--text-faint)', fontFamily: 'monospace' }}>{date}</span>
            <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, padding: '1px 7px', borderRadius: 20,
              color: isReported ? '#94a3b8' : '#3b82f6',
              background: isReported ? 'rgba(148,163,184,0.12)' : 'rgba(59,130,246,0.12)',
            }}>
              {isReported ? `✓ ${stocks.length} reported` : `${stocks.length} cos.`}
            </span>
          </div>

          {/* Stocks table */}
          <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            {stocks.map((s, i) => (
              <div
                key={s.ticker}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                  borderBottom: i < stocks.length - 1 ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer', transition: 'background 0.1s',
                }}
                onClick={() => setPopupStock(s)}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Ticker */}
                <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 800, color: isReported ? '#94a3b8' : '#60a5fa', minWidth: 60 }}>{s.ticker}</span>

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
        Earnings dates from Yahoo Finance calendarEvents · Refreshed every 30 min · Click any stock to open chart
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
