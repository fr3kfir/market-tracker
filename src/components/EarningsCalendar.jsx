import { useState, useMemo, useEffect } from 'react';
import TickerInfoPopup from './TickerInfoPopup';
import { useIsMobile } from '../hooks/useIsMobile';

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
  if (!em)      return '#94a3b8';
  if (em < 5)   return '#22d3ee';
  if (em < 8)   return '#60a5fa';
  if (em < 12)  return '#f59e0b';
  if (em < 18)  return '#f97316';
  return '#ef4444';
}

function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function toDateStr(d)     { return d.toISOString().slice(0, 10); }

function daysFromNow(dateStr) {
  const today = toDateStr(new Date());
  if (dateStr === today) return 0;
  return Math.round((new Date(dateStr + 'T12:00:00Z') - new Date(today + 'T12:00:00Z')) / 864e5);
}

function formatDateLabel(dateStr) {
  const n    = daysFromNow(dateStr);
  const d    = new Date(dateStr + 'T12:00:00Z');
  const base = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  if (n === 0)  return { label: 'Today',     sub: base,           accent: '#3b82f6' };
  if (n === 1)  return { label: 'Tomorrow',  sub: base,           accent: '#22d3ee' };
  if (n === -1) return { label: 'Yesterday', sub: base,           accent: '#64748b' };
  if (n > 0)    return { label: base,        sub: `in ${n} days`, accent: n <= 3 ? '#a78bfa' : '#475569' };
  return         { label: base,              sub: `${-n}d ago`,   accent: '#374151' };
}

// ── Shared badges ────────────────────────────────────────────────────────

function EmBadge({ em, loading, compact }) {
  const style = {
    fontSize: compact ? 11 : 12,
    fontFamily: 'monospace', fontWeight: 800,
    padding: compact ? '1px 6px' : '1px 7px', borderRadius: 5,
    letterSpacing: '-0.5px',
  };
  if (loading) return (
    <span style={{ ...style, color: '#334155', background: 'rgba(255,255,255,0.04)', border: '1px solid #1e293b', animation: 'pulse-load 1.5s ease-in-out infinite' }}>···</span>
  );
  if (!em) return null;
  const c = emColor(em);
  return (
    <span title="Options ATM straddle ÷ price (implied expected move)" style={{ ...style, color: c, background: `${c}15`, border: `1px solid ${c}28`, cursor: 'help' }}>
      ±{em}%
    </span>
  );
}

function RsRing({ rs }) {
  if (rs == null) return null;
  const c = rsColor(rs), r = 10, circ = 2 * Math.PI * r;
  return (
    <div title={`RS Rating: ${rs}`} style={{ position: 'relative', width: 28, height: 28, flexShrink: 0, cursor: 'help' }}>
      <svg width="28" height="28" style={{ transform: 'rotate(-90deg)' }} viewBox="0 0 28 28">
        <circle cx="14" cy="14" r={r} fill="none" stroke="#1e293b" strokeWidth="3" />
        <circle cx="14" cy="14" r={r} fill="none" stroke={c} strokeWidth="3"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - rs / 100)} strokeLinecap="round" />
      </svg>
      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: 7, fontWeight: 800, color: c }}>{rs}</span>
    </div>
  );
}

// ── Desktop row (8-column grid) ──────────────────────────────────────────
function EarningsRowDesktop({ stock, isReported, em, emLoading, onClick }) {
  const [hover, setHover] = useState(false);
  const change = stock.change ?? 0;
  const stageC = STAGE_COLORS[stock.stage] || '#64748b';
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      display: 'grid',
      gridTemplateColumns: '8px 62px 1fr 32px 76px 58px 80px 24px',
      alignItems: 'center', gap: 10, padding: '11px 16px',
      cursor: 'pointer',
      background: hover ? 'rgba(59,130,246,0.04)' : 'transparent',
      transition: 'background 0.12s',
      opacity: isReported ? 0.5 : 1,
    }}>
      <div style={{ width: 3, height: 28, borderRadius: 2, background: isReported ? '#1e293b' : stageC }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 800, color: rsColor(stock.rs), letterSpacing: '-0.5px' }}>{stock.ticker}</span>
        {stock.stage && <span style={{ fontFamily: 'monospace', fontSize: 8, fontWeight: 700, color: stageC, background: STAGE_BG[stock.stage], padding: '1px 4px', borderRadius: 3, width: 'fit-content' }}>{stock.stage}</span>}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stock.name}</div>
        {stock.epsF != null && <div style={{ fontSize: 9, color: '#475569', fontFamily: 'monospace' }}>EPS est: <span style={{ color: stock.epsF >= 0 ? '#34d399' : '#f87171', fontWeight: 700 }}>${stock.epsF.toFixed(2)}</span></div>}
      </div>
      <RsRing rs={stock.rs} />
      <div style={{ textAlign: 'right' }}>
        {stock.price != null && <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>${stock.price.toFixed(2)}</div>}
        {stock.change != null && <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: change >= 0 ? '#34d399' : '#f87171' }}>{change >= 0 ? '+' : ''}{change.toFixed(2)}%</div>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        {!isReported && <EmBadge em={em} loading={emLoading} />}
        {!isReported && !emLoading && em == null && <span style={{ fontSize: 9, color: '#334155', fontFamily: 'monospace' }}>EM</span>}
        {!isReported && emLoading && <span style={{ fontSize: 9, color: '#334155', fontFamily: 'monospace' }}>EM</span>}
      </div>
      <div style={{ textAlign: 'right' }}>
        {stock.marketCapB != null && <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#475569' }}>{stock.marketCapB >= 1000 ? `$${(stock.marketCapB/1000).toFixed(1)}T` : `$${stock.marketCapB.toFixed(0)}B`}</div>}
        {stock.volBuzz >= 1.5 && <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#f59e0b', fontWeight: 700 }}>{stock.volBuzz.toFixed(1)}×</div>}
      </div>
      <div style={{ color: '#334155', textAlign: 'right' }}>›</div>
    </div>
  );
}

// ── Mobile card row ──────────────────────────────────────────────────────
function EarningsRowMobile({ stock, isReported, em, emLoading, onClick }) {
  const [hover, setHover] = useState(false);
  const change   = stock.change ?? 0;
  const stageC   = STAGE_COLORS[stock.stage] || '#64748b';
  const changeOk = change >= 0;
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      display: 'flex', alignItems: 'stretch', gap: 0,
      padding: '12px 14px', cursor: 'pointer',
      background: hover ? 'rgba(59,130,246,0.05)' : 'transparent',
      transition: 'background 0.12s',
      opacity: isReported ? 0.55 : 1,
    }}>
      {/* Left accent strip */}
      <div style={{ width: 3, borderRadius: 2, background: isReported ? '#1e293b' : stageC, marginRight: 12, flexShrink: 0, alignSelf: 'stretch' }} />

      {/* Main info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Line 1: Ticker + Stage + RS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 800, color: rsColor(stock.rs), letterSpacing: '-0.5px' }}>{stock.ticker}</span>
          {stock.stage && <span style={{ fontFamily: 'monospace', fontSize: 9, fontWeight: 700, color: stageC, background: STAGE_BG[stock.stage], padding: '1px 5px', borderRadius: 3 }}>{stock.stage}</span>}
          {stock.rs != null && <span style={{ fontFamily: 'monospace', fontSize: 9, fontWeight: 700, color: rsColor(stock.rs), opacity: 0.8 }}>RS{stock.rs}</span>}
        </div>
        {/* Line 2: Company name */}
        <div style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{stock.name}</div>
        {/* Line 3: EM + EPS est */}
        {!isReported && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EmBadge em={em} loading={emLoading} compact />
            {stock.epsF != null && (
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#475569' }}>
                Est.EPS <span style={{ color: stock.epsF >= 0 ? '#34d399' : '#f87171', fontWeight: 700 }}>${stock.epsF.toFixed(2)}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right: price block */}
      <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: 10 }}>
        {stock.price != null && <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 800, color: '#e2e8f0' }}>${stock.price.toFixed(2)}</div>}
        {stock.change != null && (
          <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: changeOk ? '#34d399' : '#f87171' }}>
            {changeOk ? '+' : ''}{change.toFixed(2)}%
          </div>
        )}
        {stock.marketCapB != null && <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#334155', marginTop: 2 }}>{stock.marketCapB >= 1000 ? `$${(stock.marketCapB/1000).toFixed(1)}T` : `$${stock.marketCapB.toFixed(0)}B`}</div>}
      </div>
    </div>
  );
}

// ── Small helpers ────────────────────────────────────────────────────────
function Pill({ color, label }) {
  return <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, padding: '3px 10px', borderRadius: 20, color, background: `${color}15`, border: `1px solid ${color}30` }}>{label}</span>;
}
function ActionBtn({ onClick, children, accent }) {
  return (
    <button onClick={onClick} style={{ padding: '7px 18px', fontSize: 12, fontFamily: 'monospace', fontWeight: 700, borderRadius: 8, border: `1px solid ${accent}`, background: `${accent}20`, color: accent, cursor: 'pointer' }}>
      {children}
    </button>
  );
}

const colH = { fontSize: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#334155', fontFamily: 'monospace' };

// ── Main component ───────────────────────────────────────────────────────
export default function EarningsCalendar({ stocksByTicker, onClip }) {
  const isMobile = useIsMobile();
  const [weekOffset, setWeekOffset] = useState(0);
  const [popupStock, setPopupStock] = useState(null);
  const [emData, setEmData]         = useState({});
  const [emLoading, setEmLoading]   = useState(false);

  const today       = new Date();
  const windowStart = weekOffset === 0 ? addDays(today, -7)              : addDays(today, weekOffset * 7);
  const windowEnd   = weekOffset === 0 ? addDays(today, 20)              : addDays(windowStart, 27);
  const startStr    = toDateStr(windowStart);
  const endStr      = toDateStr(windowEnd);

  const grouped = useMemo(() => {
    const stocks = Object.values(stocksByTicker).filter(s =>
      s.earningsDate && s.earningsDate >= startStr && s.earningsDate <= endStr
    );
    const map = {};
    stocks.forEach(s => { if (!map[s.earningsDate]) map[s.earningsDate] = []; map[s.earningsDate].push(s); });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stocks]) => ({
        date, isReported: daysFromNow(date) < 0,
        stocks: [...stocks].sort((a, b) => (b.rs || 0) - (a.rs || 0)),
      }));
  }, [stocksByTicker, startStr, endStr]);

  const allStocks     = useMemo(() => grouped.flatMap(g => g.stocks), [grouped]);
  const upcomingStocks = useMemo(() => grouped.filter(g => !g.isReported).flatMap(g => g.stocks), [grouped]);
  const upcomingCount = upcomingStocks.length;
  const recentCount   = grouped.filter(g => g.isReported).reduce((s, g) => s + g.stocks.length, 0);

  // Fetch Expected Move for all upcoming stocks
  const upcomingKey = upcomingStocks.map(s => s.ticker).join(',');
  useEffect(() => {
    if (!upcomingStocks.length) return;
    setEmLoading(true);
    const prices = upcomingStocks.map(s => `${s.ticker}:${s.price}`).join(',');
    fetch(`/api/expected-move?symbols=${upcomingKey}&prices=${prices}`)
      .then(r => r.ok ? r.json() : {})
      .then(d => setEmData(d))
      .catch(() => {})
      .finally(() => setEmLoading(false));
  }, [upcomingKey]);

  // ── Toolbar ──────────────────────────────────────────────────────────
  const toolbar = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 4 }}>
        <button onClick={() => setWeekOffset(w => w - 1)} style={{ padding: '5px 12px', border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: 16, borderRadius: 6 }}>‹</button>
        <span style={{ fontSize: isMobile ? 11 : 12, fontFamily: 'monospace', color: '#94a3b8', fontWeight: 600, minWidth: isMobile ? 90 : 120, textAlign: 'center' }}>
          {weekOffset === 0 ? (isMobile ? 'Current' : 'Current window') : weekOffset > 0 ? `+${weekOffset * 7}d` : `${weekOffset * 7}d`}
        </span>
        <button onClick={() => setWeekOffset(w => w + 1)} style={{ padding: '5px 12px', border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: 16, borderRadius: 6 }}>›</button>
      </div>

      {weekOffset !== 0 && (
        <button onClick={() => setWeekOffset(0)} style={{ padding: '5px 14px', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, borderRadius: 8, border: '1px solid #1d4ed8', background: 'rgba(29,78,216,0.15)', color: '#60a5fa', cursor: 'pointer' }}>↩ Now</button>
      )}

      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {upcomingCount > 0 && <Pill color="#3b82f6" label={`🔔 ${upcomingCount} upcoming`} />}
        {recentCount   > 0 && <Pill color="#475569" label={`✓ ${recentCount} reported`} />}
      </div>

      {!isMobile && upcomingCount > 0 && (
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: 9, fontFamily: 'monospace', color: '#475569' }}>
          <span>EXP MOVE:</span>
          {[['<5%','#22d3ee'],['5–8%','#60a5fa'],['8–12%','#f59e0b'],['>12%','#ef4444']].map(([l,c]) => (
            <span key={l} style={{ color: c }}>{l}</span>
          ))}
        </div>
      )}
    </div>
  );

  // ── Empty state ───────────────────────────────────────────────────────
  if (grouped.length === 0) return (
    <div style={{ maxWidth: isMobile ? '100%' : 960, margin: '0 auto', padding: isMobile ? '0 4px' : 0 }}>
      {toolbar}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: isMobile ? '40px 20px' : '56px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>📭</div>
        <div style={{ fontWeight: 800, fontSize: 14, color: '#94a3b8', marginBottom: 10 }}>No earnings in this window</div>
        <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.8, maxWidth: 420, margin: '0 auto' }}>
          Data loads on open (~30s). Seasons: Q1 <span style={{ color: '#60a5fa' }}>Apr–May</span> · Q2 <span style={{ color: '#60a5fa' }}>Jul–Aug</span> · Q3 <span style={{ color: '#60a5fa' }}>Oct–Nov</span> · Q4 <span style={{ color: '#60a5fa' }}>Jan–Feb</span>
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <ActionBtn onClick={() => setWeekOffset(w => w + 1)} accent="#1d4ed8">Next window →</ActionBtn>
          {weekOffset !== 0 && <ActionBtn onClick={() => setWeekOffset(0)} accent="#1e293b">← Back to now</ActionBtn>}
        </div>
      </div>
    </div>
  );

  // ── Calendar ──────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: isMobile ? '100%' : 960, margin: '0 auto', padding: isMobile ? '0 4px' : 0 }}>
      {toolbar}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {grouped.map(({ date, stocks, isReported }) => {
          const fmt = formatDateLabel(date);
          return (
            <div key={date}>
              {/* Date header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, padding: '0 4px' }}>
                <div style={{ width: 3, height: isMobile ? 28 : 32, borderRadius: 2, background: isReported ? '#1e293b' : fmt.accent, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 800, color: isReported ? '#475569' : '#e2e8f0', letterSpacing: '-0.3px' }}>{fmt.label}</div>
                  <div style={{ fontSize: 10, color: '#475569', fontFamily: 'monospace' }}>{fmt.sub}</div>
                </div>
                <div style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, padding: '3px 9px', borderRadius: 20, marginLeft: 2,
                  color: isReported ? '#475569' : '#60a5fa',
                  background: isReported ? '#0f172a' : 'rgba(59,130,246,0.1)',
                  border: `1px solid ${isReported ? '#1e293b' : 'rgba(59,130,246,0.25)'}`,
                }}>
                  {isReported ? `✓ ${stocks.length}` : `${stocks.length} cos`}
                </div>
              </div>

              {/* Card */}
              <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                {/* Desktop-only column headers */}
                {!isMobile && (
                  <div style={{ display: 'grid', gridTemplateColumns: '8px 62px 1fr 32px 76px 58px 80px 24px', alignItems: 'center', gap: 10, padding: '6px 16px', borderBottom: '1px solid #1e293b', opacity: 0.5 }}>
                    <div /><div />
                    <span style={colH}>Company</span>
                    <span style={{ ...colH, textAlign: 'center' }}>RS</span>
                    <span style={{ ...colH, textAlign: 'right' }}>Price</span>
                    <span style={{ ...colH, textAlign: 'center' }}>Exp Move</span>
                    <span style={{ ...colH, textAlign: 'right' }}>Mkt Cap</span>
                    <div />
                  </div>
                )}

                {/* Rows */}
                {stocks.map((s, i) => {
                  const sep = { borderBottom: i < stocks.length - 1 ? '1px solid #0d1627' : 'none' };
                  const em = !isReported ? emData[s.ticker] : undefined;
                  const loading = !isReported && emLoading && em == null;
                  const row = isMobile
                    ? <EarningsRowMobile key={s.ticker} stock={s} isReported={isReported} em={em} emLoading={loading} onClick={() => setPopupStock(s)} />
                    : <EarningsRowDesktop key={s.ticker} stock={s} isReported={isReported} em={em} emLoading={loading} onClick={() => setPopupStock(s)} />;
                  return <div key={s.ticker} style={sep}>{row}</div>;
                })}
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ textAlign: 'center', fontSize: 10, color: '#334155', marginTop: 16, fontFamily: 'monospace', padding: '0 8px' }}>
        Dates: Yahoo Finance · Exp Move: ATM straddle ÷ price · Tap row for chart
      </p>

      {popupStock && (
        <TickerInfoPopup ticker={popupStock.ticker} stock={popupStock}
          onClose={() => setPopupStock(null)} allStocks={allStocks} onClip={onClip} />
      )}
    </div>
  );
}
