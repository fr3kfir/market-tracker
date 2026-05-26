import { useState, useMemo, useEffect } from 'react';
import TickerInfoPopup from './TickerInfoPopup';
import { useIsMobile } from '../hooks/useIsMobile';

// ── Constants ────────────────────────────────────────────────────────────────
const STAGE_COLORS = { S1: '#64748b', S2: '#3b82f6', S3: '#f59e0b', S4: '#ec4899' };
const STAGE_BG     = { S1: '#1e293b', S2: '#1e3a5f', S3: '#431407', S4: '#500724' };

function rsColor(rs) {
  if (rs >= 90) return '#10b981';
  if (rs >= 80) return '#34d399';
  if (rs >= 65) return '#60a5fa';
  if (rs >= 50) return '#f59e0b';
  return '#94a3b8';
}
function emColor(em) {
  if (!em)     return '#94a3b8';
  if (em < 5)  return '#22d3ee';
  if (em < 8)  return '#60a5fa';
  if (em < 12) return '#f59e0b';
  if (em < 18) return '#f97316';
  return '#ef4444';
}

// ── Date helpers ─────────────────────────────────────────────────────────────
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function toDateStr(d)     { return d.toISOString().slice(0, 10); }

// Mon–Fri for a given week offset (0 = this week)
function getWeekDays(offset) {
  const today  = new Date();
  const dow    = today.getDay();                          // 0=Sun
  const monday = addDays(today, -((dow + 6) % 7) + offset * 7);
  const todayStr      = toDateStr(new Date());
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Array.from({ length: 5 }, (_, i) => {
    const d       = addDays(monday, i);
    const dateStr = toDateStr(d);
    return {
      dateStr,
      dayName:   d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      dayNum:    d.getDate(),
      monthAbbr: d.toLocaleDateString('en-US', { month: 'short' }),
      isToday:   dateStr === todayStr,
      isPast:    d < todayMidnight,
    };
  });
}

// 6-week grid for a given month offset (0 = this month)
function getMonthGrid(offset) {
  const now    = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0);
  const startDow = (target.getDay() + 6) % 7;            // 0=Mon
  const todayStr = toDateStr(now);
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const weeks = [];
  let cur = addDays(target, -startDow);
  for (let w = 0; w < 6; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = toDateStr(cur);
      week.push({
        dateStr,
        dayNum:         cur.getDate(),
        isCurrentMonth: cur.getMonth() === target.getMonth(),
        isToday:        dateStr === todayStr,
        isPast:         cur < todayMidnight,
        isWeekend:      d >= 5,
      });
      cur = addDays(cur, 1);
    }
    weeks.push(week);
    if (w >= 3 && new Date(week[6].dateStr) >= lastDay) break;
  }
  return {
    weeks,
    label: target.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  };
}

// ── Shared badges ─────────────────────────────────────────────────────────────
function EmBadge({ em, loading, compact }) {
  const s = { fontSize: compact ? 10 : 11, fontFamily: 'monospace', fontWeight: 800, padding: compact ? '1px 5px' : '1px 6px', borderRadius: 4 };
  if (loading) return <span style={{ ...s, color: '#334155', background: 'rgba(255,255,255,0.04)', border: '1px solid #1e293b', animation: 'pulse-load 1.5s ease-in-out infinite' }}>···</span>;
  if (!em) return null;
  const c = emColor(em);
  return <span style={{ ...s, color: c, background: `${c}15`, border: `1px solid ${c}28` }} title="Expected Move (ATM straddle ÷ price)">±{em}%</span>;
}

function RsRing({ rs }) {
  if (rs == null) return null;
  const c = rsColor(rs), r = 10, circ = 2 * Math.PI * r;
  return (
    <div title={`RS Rating: ${rs}`} style={{ position: 'relative', width: 26, height: 26, flexShrink: 0, cursor: 'help' }}>
      <svg width="26" height="26" style={{ transform: 'rotate(-90deg)' }} viewBox="0 0 26 26">
        <circle cx="13" cy="13" r={r} fill="none" stroke="#1e293b" strokeWidth="2.5" />
        <circle cx="13" cy="13" r={r} fill="none" stroke={c} strokeWidth="2.5" strokeDasharray={circ} strokeDashoffset={circ * (1 - rs / 100)} strokeLinecap="round" />
      </svg>
      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: 7, fontWeight: 800, color: c }}>{rs}</span>
    </div>
  );
}

// ── WeekStockCard: detailed card inside a day column ─────────────────────────
function WeekStockCard({ stock, isReported, em, emLoading, onClick }) {
  const [hover, setHover] = useState(false);
  const stageC = STAGE_COLORS[stock.stage] || '#475569';
  const change = stock.change ?? 0;
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '7px 9px', margin: '3px 5px', borderRadius: 8, cursor: 'pointer',
        background: hover ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hover ? 'rgba(59,130,246,0.25)' : '#1e293b'}`,
        opacity: isReported ? 0.5 : 1,
        transition: 'all 0.12s',
      }}
    >
      {/* Row 1: Ticker + Stage badge + ✓ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 800, color: rsColor(stock.rs), letterSpacing: '-0.5px' }}>{stock.ticker}</span>
        {stock.stage && (
          <span style={{ fontFamily: 'monospace', fontSize: 7, fontWeight: 700, color: stageC, background: STAGE_BG[stock.stage] || '#1e293b', padding: '1px 3px', borderRadius: 2 }}>{stock.stage}</span>
        )}
        {isReported && <span style={{ fontSize: 8, color: '#22c55e', marginLeft: 'auto' }}>✓</span>}
      </div>
      {/* Row 2: Company name */}
      <div style={{ fontSize: 9, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 5 }}>{stock.name}</div>
      {/* Row 3: EM + RS ring + Price */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {!isReported
          ? <EmBadge em={em} loading={emLoading} compact />
          : stock.change != null && <span style={{ fontSize: 9, fontFamily: 'monospace', fontWeight: 700, color: change >= 0 ? '#34d399' : '#f87171' }}>{change >= 0 ? '+' : ''}{change.toFixed(1)}%</span>
        }
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
          <RsRing rs={stock.rs} />
          {stock.price != null && <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#475569' }}>${stock.price.toFixed(0)}</span>}
        </div>
      </div>
    </div>
  );
}

// ── MonthChip: tiny ticker chip in a calendar cell ───────────────────────────
function MonthChip({ stock, isReported, em, onClick }) {
  const [hover, setHover] = useState(false);
  const c = rsColor(stock.rs);
  return (
    <div
      onClick={e => { e.stopPropagation(); onClick(stock); }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={`${stock.ticker} — ${stock.name}${em ? ` · EM ±${em}%` : ''}${stock.rs ? ` · RS ${stock.rs}` : ''}`}
      style={{
        display: 'flex', alignItems: 'center', gap: 3,
        padding: '2px 5px', borderRadius: 3, marginBottom: 2,
        cursor: 'pointer',
        fontSize: 9, fontFamily: 'monospace', fontWeight: 800,
        letterSpacing: '-0.3px',
        background: hover ? `${c}22` : `${c}0e`,
        border: `1px solid ${hover ? `${c}60` : `${c}28`}`,
        color: isReported ? '#475569' : c,
        opacity: isReported ? 0.55 : 1,
        transition: 'all 0.1s',
        overflow: 'hidden', whiteSpace: 'nowrap',
      }}
    >
      {stock.ticker}
      {em && !isReported && <span style={{ fontSize: 8, color: emColor(em), fontWeight: 700 }}>±{em}%</span>}
      {isReported && <span style={{ color: '#22c55e', fontSize: 8 }}>✓</span>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function EarningsCalendar({ stocksByTicker, onClip }) {
  const isMobile = useIsMobile();

  const [weekOffset,  setWeekOffset]  = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [popupStock,  setPopupStock]  = useState(null);
  const [emData,      setEmData]      = useState({});
  const [emLoading,   setEmLoading]   = useState(false);

  // ── Global date→stocks index ──────────────────────────────────────────────
  const byDate = useMemo(() => {
    const map = {};
    Object.values(stocksByTicker).forEach(s => {
      if (!s.earningsDate) return;
      (map[s.earningsDate] ||= []).push(s);
    });
    Object.values(map).forEach(arr => arr.sort((a, b) => (b.rs || 0) - (a.rs || 0)));
    return map;
  }, [stocksByTicker]);

  const weekDays  = useMemo(() => getWeekDays(weekOffset),   [weekOffset]);
  const monthGrid = useMemo(() => getMonthGrid(monthOffset), [monthOffset]);
  const allStocks = useMemo(() => Object.values(stocksByTicker).filter(s => s.earningsDate), [stocksByTicker]);

  // ── Fetch Expected Move for upcoming stocks in current week ───────────────
  const weeklyUpcoming = useMemo(
    () => weekDays.filter(d => !d.isPast).flatMap(d => byDate[d.dateStr] || []),
    [weekDays, byDate]
  );
  const upcomingKey = weeklyUpcoming.map(s => s.ticker).join(',');

  useEffect(() => {
    if (!weeklyUpcoming.length) { setEmData({}); return; }
    setEmLoading(true);
    const prices = weeklyUpcoming.map(s => `${s.ticker}:${s.price}`).join(',');
    fetch(`/api/expected-move?symbols=${upcomingKey}&prices=${prices}`)
      .then(r => r.ok ? r.json() : {})
      .then(d => setEmData(d))
      .catch(() => {})
      .finally(() => setEmLoading(false));
  }, [upcomingKey]);

  // ── Week label ────────────────────────────────────────────────────────────
  const weekLabel = useMemo(() => {
    if (!weekDays.length) return '';
    const s = new Date(weekDays[0].dateStr + 'T12:00:00Z');
    const e = new Date(weekDays[4].dateStr + 'T12:00:00Z');
    const sFmt = s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const eFmt = s.getMonth() === e.getMonth()
      ? String(e.getDate())
      : e.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${sFmt} – ${eFmt}, ${e.getFullYear()}`;
  }, [weekDays]);

  // ── Month earnings count ──────────────────────────────────────────────────
  const monthCount = useMemo(() => {
    const keys = new Set(monthGrid.weeks.flatMap(w => w.flatMap(d => (byDate[d.dateStr] || []).map(s => s.ticker))));
    return keys.size;
  }, [monthGrid, byDate]);

  // ── Shared nav button style ───────────────────────────────────────────────
  const navBtn = { padding: isMobile ? '5px 12px' : '6px 16px', border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: 18, borderRadius: 6, lineHeight: 1 };
  const pillBtn = (active = false) => ({
    padding: '5px 14px', fontSize: 11, fontFamily: 'monospace', fontWeight: 700,
    borderRadius: 8, border: '1px solid #1d4ed8', background: 'rgba(29,78,216,0.15)', color: '#60a5fa', cursor: 'pointer',
  });

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: isMobile ? '100%' : 980, margin: '0 auto', padding: isMobile ? '0 4px' : 0 }}>

      {/* ══════════════════════════════════════════════════
          SECTION 1 — WEEKLY CALENDAR
      ══════════════════════════════════════════════════ */}
      <div style={{ marginBottom: 32 }}>

        {/* Week nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 3 }}>
            <button onClick={() => setWeekOffset(w => w - 1)} style={navBtn}>‹</button>
            <span style={{ fontSize: isMobile ? 11 : 12, fontFamily: 'monospace', color: '#94a3b8', fontWeight: 700, minWidth: isMobile ? 130 : 195, textAlign: 'center' }}>
              {weekOffset === 0 ? `📅 ${weekLabel}` : weekLabel}
            </span>
            <button onClick={() => setWeekOffset(w => w + 1)} style={navBtn}>›</button>
          </div>

          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} style={pillBtn()}>↩ This Week</button>
          )}

          {/* EM legend — desktop only */}
          {!isMobile && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: 9, fontFamily: 'monospace', color: '#475569' }}>
              <span style={{ marginRight: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Exp Move</span>
              {[['<5%', '#22d3ee'], ['5–8%', '#60a5fa'], ['8–12%', '#f59e0b'], ['>12%', '#ef4444']].map(([l, c]) => (
                <span key={l} style={{ color: c, fontWeight: 700 }}>{l}</span>
              ))}
            </div>
          )}
        </div>

        {/* 5-column Mon–Fri grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(5, ${isMobile ? 'minmax(62px, 1fr)' : '1fr'})`,
          gap: isMobile ? 4 : 8,
          overflowX: isMobile ? 'auto' : 'visible',
          paddingBottom: isMobile ? 4 : 0,
        }}>
          {weekDays.map(day => {
            const stocks = byDate[day.dateStr] || [];
            return (
              <div key={day.dateStr} style={{
                background: '#0f172a',
                border: day.isToday ? '1px solid #3b82f6' : `1px solid ${stocks.length ? '#253147' : '#1e293b'}`,
                borderRadius: isMobile ? 8 : 12,
                overflow: 'hidden',
                boxShadow: day.isToday ? '0 0 0 2px rgba(59,130,246,0.2)' : 'none',
                minHeight: isMobile ? 70 : 100,
              }}>
                {/* Day header */}
                <div style={{
                  padding: isMobile ? '6px 6px 4px' : '10px 10px 6px',
                  borderBottom: `1px solid ${day.isToday ? 'rgba(59,130,246,0.3)' : '#1e293b'}`,
                  background: day.isToday ? 'rgba(59,130,246,0.1)' : 'transparent',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: isMobile ? 7 : 8, fontFamily: 'monospace', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: day.isToday ? '#60a5fa' : '#334155' }}>
                    {day.dayName}
                  </div>
                  <div style={{ fontSize: isMobile ? 15 : 22, fontWeight: 800, lineHeight: 1.1, marginTop: 2, color: day.isToday ? '#e2e8f0' : day.isPast ? '#2d3748' : '#64748b' }}>
                    {day.dayNum}
                  </div>
                  {!isMobile && (
                    <div style={{ fontSize: 8, color: '#334155', fontFamily: 'monospace', marginTop: 1 }}>{day.monthAbbr}</div>
                  )}
                  {stocks.length > 0 && (
                    <div style={{ marginTop: 4, fontSize: 8, fontFamily: 'monospace', fontWeight: 700, color: day.isPast ? '#334155' : '#3b82f6' }}>
                      {stocks.length} co{stocks.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                {/* Stocks */}
                <div style={{ padding: '3px 0', overflowY: 'auto', maxHeight: isMobile ? 140 : 280 }}>
                  {stocks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: isMobile ? '10px 4px' : '18px 8px', color: '#1e293b', fontSize: 10 }}>—</div>
                  ) : isMobile ? (
                    // Mobile: tiny chips
                    stocks.map(s => (
                      <div key={s.ticker}
                        onClick={() => setPopupStock(s)}
                        style={{ margin: '2px 3px', padding: '3px 4px', borderRadius: 4, cursor: 'pointer', background: `${rsColor(s.rs)}10`, border: `1px solid ${rsColor(s.rs)}25` }}
                      >
                        <div style={{ fontSize: 9, fontFamily: 'monospace', fontWeight: 800, color: rsColor(s.rs), letterSpacing: '-0.3px' }}>{s.ticker}</div>
                        {emData[s.ticker] && <div style={{ fontSize: 7, fontFamily: 'monospace', fontWeight: 700, color: emColor(emData[s.ticker]) }}>±{emData[s.ticker]}%</div>}
                      </div>
                    ))
                  ) : (
                    // Desktop: detailed cards
                    stocks.map(s => (
                      <WeekStockCard
                        key={s.ticker}
                        stock={s}
                        isReported={day.isPast}
                        em={emData[s.ticker]}
                        emLoading={emLoading && !day.isPast && emData[s.ticker] == null}
                        onClick={() => setPopupStock(s)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ flex: 1, height: 1, background: '#1e293b' }} />
        <span style={{ fontSize: 9, fontFamily: 'monospace', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#334155' }}>Monthly View</span>
        <div style={{ flex: 1, height: 1, background: '#1e293b' }} />
      </div>

      {/* ══════════════════════════════════════════════════
          SECTION 2 — MONTHLY CALENDAR
      ══════════════════════════════════════════════════ */}
      <div>

        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 3 }}>
            <button onClick={() => setMonthOffset(m => m - 1)} style={navBtn}>‹</button>
            <span style={{ fontSize: isMobile ? 12 : 14, fontFamily: 'monospace', color: '#94a3b8', fontWeight: 700, minWidth: isMobile ? 120 : 170, textAlign: 'center' }}>
              🗓 {monthGrid.label}
            </span>
            <button onClick={() => setMonthOffset(m => m + 1)} style={navBtn}>›</button>
          </div>

          {monthOffset !== 0 && (
            <button onClick={() => setMonthOffset(0)} style={pillBtn()}>↩ This Month</button>
          )}

          {monthCount > 0 && (
            <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, padding: '3px 10px', borderRadius: 20, color: '#60a5fa', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)' }}>
              {monthCount} earning{monthCount !== 1 ? 's' : ''} this month
            </span>
          )}
        </div>

        {/* Calendar grid */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 14, overflow: 'hidden' }}>

          {/* Day-of-week headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #1e293b' }}>
            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((d, di) => (
              <div key={d} style={{
                padding: isMobile ? '6px 0' : '9px 10px',
                fontSize: isMobile ? 7 : 8,
                fontFamily: 'monospace', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
                color: di >= 5 ? '#1e3a5f' : '#475569',
                textAlign: 'center',
                borderRight: di < 6 ? '1px solid #1e293b' : 'none',
                background: di >= 5 ? 'rgba(0,0,0,0.2)' : 'transparent',
              }}>{d}</div>
            ))}
          </div>

          {/* Weeks */}
          {monthGrid.weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: wi < monthGrid.weeks.length - 1 ? '1px solid #1e293b' : 'none' }}>
              {week.map((day, di) => {
                const stocks = byDate[day.dateStr] || [];
                return (
                  <div
                    key={day.dateStr}
                    style={{
                      minHeight: isMobile ? 52 : 90,
                      padding: isMobile ? '4px 3px' : '7px 8px',
                      borderRight: di < 6 ? '1px solid #1e293b' : 'none',
                      background: day.isToday
                        ? 'rgba(59,130,246,0.07)'
                        : day.isWeekend ? 'rgba(0,0,0,0.15)' : 'transparent',
                      opacity: day.isCurrentMonth ? 1 : 0.2,
                      transition: 'background 0.1s',
                    }}
                  >
                    {/* Day number */}
                    <div style={{ marginBottom: stocks.length ? (isMobile ? 2 : 5) : 0 }}>
                      {day.isToday ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: isMobile ? 16 : 22, height: isMobile ? 16 : 22,
                          background: '#3b82f6', color: 'white', borderRadius: '50%',
                          fontSize: isMobile ? 8 : 11, fontFamily: 'monospace', fontWeight: 800,
                        }}>{day.dayNum}</span>
                      ) : (
                        <span style={{
                          fontSize: isMobile ? 9 : 11,
                          fontFamily: 'monospace', fontWeight: 600,
                          color: day.isPast ? '#2d3748' : '#475569',
                        }}>{day.dayNum}</span>
                      )}
                    </div>

                    {/* Stock chips */}
                    {stocks.map(s => (
                      <MonthChip
                        key={s.ticker}
                        stock={s}
                        isReported={day.isPast}
                        em={emData[s.ticker]}
                        onClick={setPopupStock}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: 10, color: '#334155', marginTop: 16, fontFamily: 'monospace', padding: '0 8px' }}>
        Dates: Yahoo Finance · Exp Move: ATM straddle ÷ price · לחץ על טיקר לצפייה בגרף
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
