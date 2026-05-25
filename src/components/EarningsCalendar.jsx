import { useState, useMemo, useEffect } from 'react';
import TickerInfoPopup from './TickerInfoPopup';

const STAGE_COLORS  = { S1: '#64748b', S2: '#3b82f6', S3: '#f59e0b', S4: '#ec4899' };
const STAGE_BG      = { S1: '#1e293b', S2: '#1e3a5f', S3: '#431407', S4: '#500724' };

function rsColor(rs) {
  if (rs >= 90) return '#10b981';
  if (rs >= 80) return '#34d399';
  if (rs >= 65) return '#60a5fa';
  if (rs >= 50) return '#f59e0b';
  return '#94a3b8';
}

// Expected Move color gradient: low → high → extreme
function emColor(em) {
  if (!em) return '#94a3b8';
  if (em < 5)  return '#22d3ee';   // cyan — calm
  if (em < 8)  return '#60a5fa';   // blue — moderate
  if (em < 12) return '#f59e0b';   // amber — elevated
  if (em < 18) return '#f97316';   // orange — high
  return '#ef4444';                 // red — extreme
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toDateStr(d) { return d.toISOString().slice(0, 10); }

function daysFromNow(dateStr) {
  const today = toDateStr(new Date());
  if (dateStr === today) return 0;
  const ms = new Date(dateStr + 'T12:00:00Z') - new Date(today + 'T12:00:00Z');
  return Math.round(ms / 864e5);
}

function formatDateLabel(dateStr) {
  const n = daysFromNow(dateStr);
  const d = new Date(dateStr + 'T12:00:00Z');
  const base = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  if (n === 0)  return { label: 'Today',     sub: base,             accent: '#3b82f6' };
  if (n === 1)  return { label: 'Tomorrow',  sub: base,             accent: '#22d3ee' };
  if (n === -1) return { label: 'Yesterday', sub: base,             accent: '#64748b' };
  if (n > 0)    return { label: base,        sub: `in ${n} days`,   accent: n <= 3 ? '#a78bfa' : '#475569' };
  return         { label: base,              sub: `${-n}d ago`,     accent: '#374151' };
}

// ── Expected Move Badge ─────────────────────────────────────────────────
function EmBadge({ em, loading }) {
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 54 }}>
      <div style={{ width: 36, height: 12, borderRadius: 4, background: 'rgba(255,255,255,0.05)', animation: 'pulse-load 1.5s ease-in-out infinite' }} />
      <span style={{ fontSize: 8, color: '#475569', fontFamily: 'monospace', marginTop: 2 }}>EM</span>
    </div>
  );
  if (!em) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 54 }}>
      <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#374151', fontWeight: 600 }}>—</span>
      <span style={{ fontSize: 8, color: '#374151', fontFamily: 'monospace' }}>EM</span>
    </div>
  );
  const c = emColor(em);
  return (
    <div title={`Options-implied expected move: ±${em}%`}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 54, cursor: 'help' }}>
      <span style={{
        fontSize: 12, fontFamily: 'monospace', fontWeight: 800, color: c,
        background: `${c}18`, padding: '1px 7px', borderRadius: 5,
        border: `1px solid ${c}30`, letterSpacing: '-0.5px',
      }}>±{em}%</span>
      <span style={{ fontSize: 8, color: '#64748b', fontFamily: 'monospace', marginTop: 1, letterSpacing: '0.05em' }}>EXP MOVE</span>
    </div>
  );
}

// ── RS Ring ─────────────────────────────────────────────────────────────
function RsRing({ rs }) {
  if (rs == null) return null;
  const c = rsColor(rs);
  const pct = rs / 100;
  const r = 10, circ = 2 * Math.PI * r;
  return (
    <div title={`RS Rating: ${rs}`} style={{ position: 'relative', width: 28, height: 28, flexShrink: 0, cursor: 'help' }}>
      <svg width="28" height="28" style={{ transform: 'rotate(-90deg)' }} viewBox="0 0 28 28">
        <circle cx="14" cy="14" r={r} fill="none" stroke="#1e293b" strokeWidth="3" />
        <circle cx="14" cy="14" r={r} fill="none" stroke={c} strokeWidth="3"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round" />
      </svg>
      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: 7, fontWeight: 800, color: c }}>
        {rs}
      </span>
    </div>
  );
}

// ── Stock Row ────────────────────────────────────────────────────────────
function EarningsRow({ stock, isReported, em, emLoading, onClick }) {
  const [hover, setHover] = useState(false);
  const change = stock.change ?? 0;
  const changePos = change >= 0;
  const stageC = STAGE_COLORS[stock.stage] || '#64748b';

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '8px 60px 1fr 28px 70px 54px 90px 28px',
        alignItems: 'center',
        gap: 10,
        padding: '11px 16px',
        cursor: 'pointer',
        background: hover ? 'rgba(59,130,246,0.04)' : 'transparent',
        transition: 'background 0.12s',
        opacity: isReported ? 0.5 : 1,
      }}
    >
      {/* Stage color strip */}
      <div style={{ width: 3, height: 28, borderRadius: 2, background: isReported ? '#1e293b' : stageC, alignSelf: 'center' }} />

      {/* Ticker + stage badge */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 800, color: isReported ? '#475569' : rsColor(stock.rs), letterSpacing: '-0.5px', lineHeight: 1 }}>
          {stock.ticker}
        </span>
        {stock.stage && (
          <span style={{ fontFamily: 'monospace', fontSize: 9, fontWeight: 700, color: stageC, background: STAGE_BG[stock.stage] || '#1e293b', padding: '1px 5px', borderRadius: 3, width: 'fit-content' }}>
            {stock.stage}
          </span>
        )}
      </div>

      {/* Company name + sector */}
      <div style={{ minWidth: 0, overflow: 'hidden' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {stock.name}
        </div>
        {stock.epsF != null && (
          <div style={{ fontSize: 10, color: '#475569', fontFamily: 'monospace', marginTop: 1 }}>
            Est. EPS: <span style={{ color: stock.epsF >= 0 ? '#34d399' : '#f87171', fontWeight: 700 }}>${stock.epsF.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* RS ring */}
      <RsRing rs={stock.rs} />

      {/* Price + change */}
      <div style={{ textAlign: 'right' }}>
        {stock.price != null && (
          <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>
            ${stock.price.toFixed(2)}
          </div>
        )}
        {stock.change != null && (
          <div style={{
            fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
            color: changePos ? '#34d399' : '#f87171',
          }}>
            {changePos ? '+' : ''}{change.toFixed(2)}%
          </div>
        )}
      </div>

      {/* Expected Move */}
      <EmBadge em={em} loading={emLoading} />

      {/* Market Cap */}
      <div style={{ textAlign: 'right' }}>
        {stock.marketCapB != null ? (
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#475569' }}>
            {stock.marketCapB >= 1000
              ? `$${(stock.marketCapB / 1000).toFixed(1)}T`
              : `$${stock.marketCapB.toFixed(0)}B`}
          </div>
        ) : null}
        {stock.volBuzz != null && stock.volBuzz >= 1.5 && (
          <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#f59e0b', fontWeight: 700 }}>
            {stock.volBuzz.toFixed(1)}× vol
          </div>
        )}
      </div>

      {/* Chevron */}
      <div style={{ color: '#334155', fontSize: 14, textAlign: 'right' }}>›</div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────
export default function EarningsCalendar({ stocksByTicker, onClip }) {
  const [weekOffset, setWeekOffset]   = useState(0);
  const [popupStock, setPopupStock]   = useState(null);
  const [emData, setEmData]           = useState({});   // { ticker: em% }
  const [emLoading, setEmLoading]     = useState(false);

  const today     = new Date();
  const windowStart = weekOffset === 0 ? addDays(today, -7) : addDays(today, weekOffset * 7);
  const windowEnd   = weekOffset === 0 ? addDays(today, 20) : addDays(windowStart, 27);
  const startStr  = toDateStr(windowStart);
  const endStr    = toDateStr(windowEnd);

  const grouped = useMemo(() => {
    const stocks = Object.values(stocksByTicker).filter(s =>
      s.earningsDate && s.earningsDate >= startStr && s.earningsDate <= endStr
    );
    const map = {};
    stocks.forEach(s => {
      if (!map[s.earningsDate]) map[s.earningsDate] = [];
      map[s.earningsDate].push(s);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stocks]) => ({
        date,
        stocks: [...stocks].sort((a, b) => (b.rs || 0) - (a.rs || 0)),
        isReported: daysFromNow(date) < 0,
      }));
  }, [stocksByTicker, startStr, endStr]);

  const allEarningsStocks = useMemo(() => grouped.flatMap(g => g.stocks), [grouped]);
  const upcomingStocks    = useMemo(() => grouped.filter(g => !g.isReported).flatMap(g => g.stocks), [grouped]);
  const recentCount  = grouped.filter(g => g.isReported).reduce((s, g) => s + g.stocks.length, 0);
  const upcomingCount = upcomingStocks.length;

  // Fetch Expected Move for all UPCOMING stocks
  useEffect(() => {
    if (!upcomingStocks.length) return;
    setEmLoading(true);
    const symbols = upcomingStocks.map(s => s.ticker).join(',');
    const prices  = upcomingStocks.map(s => `${s.ticker}:${s.price}`).join(',');
    fetch(`/api/expected-move?symbols=${symbols}&prices=${prices}`)
      .then(r => r.ok ? r.json() : {})
      .then(d => setEmData(d))
      .catch(() => {})
      .finally(() => setEmLoading(false));
  }, [upcomingStocks.map(s => s.ticker).join(',')]); // only re-fetch when stock list changes

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>

      {/* ── Toolbar ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {/* Navigation */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 4 }}>
          <button onClick={() => setWeekOffset(w => w - 1)} style={navBtn}>‹</button>
          <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#94a3b8', fontWeight: 600, minWidth: 120, textAlign: 'center' }}>
            {weekOffset === 0 ? 'Current window' : weekOffset > 0 ? `+${weekOffset * 7}d window` : `${weekOffset * 7}d window`}
          </span>
          <button onClick={() => setWeekOffset(w => w + 1)} style={navBtn}>›</button>
        </div>
        {weekOffset !== 0 && (
          <button onClick={() => setWeekOffset(0)} style={{ padding: '5px 14px', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, borderRadius: 8, border: '1px solid #1d4ed8', background: 'rgba(29,78,216,0.15)', color: '#60a5fa', cursor: 'pointer' }}>
            ↩ Now
          </button>
        )}

        {/* Count pills */}
        <div style={{ display: 'flex', gap: 6, marginLeft: 6 }}>
          {upcomingCount > 0 && (
            <Pill color="#3b82f6" label={`🔔 ${upcomingCount} upcoming`} />
          )}
          {recentCount > 0 && (
            <Pill color="#475569" label={`✓ ${recentCount} reported`} />
          )}
        </div>

        {/* EM legend */}
        {upcomingCount > 0 && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: 9, fontFamily: 'monospace', color: '#475569' }}>
            <span style={{ color: '#64748b' }}>EXP MOVE:</span>
            {[['<5%','#22d3ee'],['5–8%','#60a5fa'],['8–12%','#f59e0b'],['>12%','#ef4444']].map(([l, c]) => (
              <span key={l} style={{ color: c }}>{l}</span>
            ))}
          </div>
        )}
      </div>

      {/* ── Empty state ─────────────────────────────────────────── */}
      {grouped.length === 0 && (
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: '56px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 14, opacity: 0.4 }}>📭</div>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#94a3b8', marginBottom: 10 }}>No earnings in this window</div>
          <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.8, maxWidth: 480, margin: '0 auto' }}>
            Earnings data loads from Yahoo Finance on page open (~30 sec).<br />
            <span style={{ color: '#64748b' }}>Seasons: </span>
            Q1 <span style={{ color: '#60a5fa' }}>Apr–May</span> · Q2 <span style={{ color: '#60a5fa' }}>Jul–Aug</span> · Q3 <span style={{ color: '#60a5fa' }}>Oct–Nov</span> · Q4 <span style={{ color: '#60a5fa' }}>Jan–Feb</span>
          </div>
          <div style={{ marginTop: 18, display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button onClick={() => setWeekOffset(w => w + 1)} style={actionBtn('#1d4ed8', '#60a5fa')}>Next window →</button>
            {weekOffset !== 0 && <button onClick={() => setWeekOffset(0)} style={actionBtn('#1e293b', '#94a3b8')}>← Back to now</button>}
          </div>
        </div>
      )}

      {/* ── Date groups ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {grouped.map(({ date, stocks, isReported }) => {
          const fmt = formatDateLabel(date);
          return (
            <div key={date}>
              {/* Date header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, padding: '0 4px' }}>
                <div style={{ width: 3, height: 32, borderRadius: 2, background: isReported ? '#1e293b' : fmt.accent, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: isReported ? '#475569' : '#e2e8f0', letterSpacing: '-0.3px' }}>
                    {fmt.label}
                  </div>
                  <div style={{ fontSize: 11, color: '#475569', fontFamily: 'monospace' }}>{fmt.sub}</div>
                </div>
                <div style={{
                  fontSize: 10, fontFamily: 'monospace', fontWeight: 700,
                  padding: '3px 10px', borderRadius: 20,
                  color: isReported ? '#475569' : '#60a5fa',
                  background: isReported ? '#0f172a' : 'rgba(59,130,246,0.1)',
                  border: `1px solid ${isReported ? '#1e293b' : 'rgba(59,130,246,0.25)'}`,
                }}>
                  {isReported ? `✓ ${stocks.length}` : `${stocks.length} co.`}
                </div>
              </div>

              {/* Cards container */}
              <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
                {/* Column headers */}
                <div style={{ display: 'grid', gridTemplateColumns: '8px 60px 1fr 28px 70px 54px 90px 28px', alignItems: 'center', gap: 10, padding: '6px 16px 6px', borderBottom: '1px solid #1e293b', opacity: 0.5 }}>
                  <div /><div />
                  <span style={colHeader}>Company</span>
                  <span style={{...colHeader, textAlign:'center'}}>RS</span>
                  <span style={{...colHeader, textAlign:'right'}}>Price</span>
                  <span style={{...colHeader, textAlign:'center'}}>Exp Move</span>
                  <span style={{...colHeader, textAlign:'right'}}>Mkt Cap</span>
                  <div />
                </div>

                {/* Stock rows */}
                {stocks.map((s, i) => (
                  <div key={s.ticker} style={{ borderBottom: i < stocks.length - 1 ? '1px solid #0d1627' : 'none' }}>
                    <EarningsRow
                      stock={s}
                      isReported={isReported}
                      em={!isReported ? emData[s.ticker] : undefined}
                      emLoading={!isReported && emLoading && emData[s.ticker] == null}
                      onClick={() => setPopupStock(s)}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {grouped.length > 0 && (
        <p style={{ textAlign: 'center', fontSize: 10, color: '#334155', marginTop: 18, fontFamily: 'monospace' }}>
          Dates: Yahoo Finance calendarEvents · Expected Move: options ATM straddle / price · Click row for chart
        </p>
      )}

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

// ── Shared micro-styles ──────────────────────────────────────────────────
const navBtn = {
  padding: '5px 12px', fontSize: 15, border: 'none',
  background: 'transparent', color: '#64748b', cursor: 'pointer',
  borderRadius: 7, transition: 'color 0.12s, background 0.12s',
};
const colHeader = {
  fontSize: 8, fontWeight: 800, textTransform: 'uppercase',
  letterSpacing: '0.12em', color: '#334155', fontFamily: 'monospace',
};
function Pill({ color, label }) {
  return (
    <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, padding: '3px 10px', borderRadius: 20, color, background: `${color}15`, border: `1px solid ${color}30` }}>
      {label}
    </span>
  );
}
function actionBtn(bg, color) {
  return { padding: '7px 18px', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, borderRadius: 8, border: `1px solid ${bg}`, background: `${bg}60`, color, cursor: 'pointer' };
}
