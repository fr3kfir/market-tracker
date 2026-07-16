import { useState, useMemo } from 'react';
import TickerInfoPopup from './TickerInfoPopup';
import { useIsMobile } from '../hooks/useIsMobile';

// ── Palette (earnings-whispers style: tan headers, cream cells on dark bg) ───
const C = {
  headerBg:   '#d3a76e',
  headerBgPast: '#b99a6d',
  weekBandBg: '#c8ab72',
  headerText: '#3a2c15',
  cellBg:     '#f3ecdb',
  cellBgPast: '#eae0c9',
  cellText:   '#2b2416',
  cellFaint:  '#b3a488',
  todayRing:  '#8a5a1e',
};

// ── Date helpers ─────────────────────────────────────────────────────────────
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// Mon–Fri for a given week offset (0 = this week)
function getWeekDays(offset) {
  const today  = new Date();
  const dow    = today.getDay();                          // 0=Sun
  const monday = addDays(today, -((dow + 6) % 7) + offset * 7);
  const todayStr      = toDateStr(new Date());
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Array.from({ length: 5 }, (_, i) => {
    const d       = addDays(monday, i);
    const dateStr = toDateStr(d);
    return {
      dateStr,
      label:   d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
      isToday: dateStr === todayStr,
      isPast:  d < todayMidnight,
    };
  });
  return {
    days,
    title: `Week of ${monday.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`,
  };
}

// ── Company logo with fallback chain ─────────────────────────────────────────
const LOGO_SOURCES = [
  t => `https://assets.parqet.com/logos/symbol/${t}?format=png&size=64`,
  t => `https://financialmodelingprep.com/image-stock/${t}.png`,
];

function CompanyLogo({ ticker, size }) {
  const [srcIdx, setSrcIdx] = useState(0);
  if (srcIdx >= LOGO_SOURCES.length) {
    // No logo available anywhere — dark monogram square, like a brand mark
    return (
      <span style={{
        width: size, height: size, flexShrink: 0, borderRadius: 4,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: C.headerText, color: C.cellBg,
        fontSize: size * 0.42, fontWeight: 800, fontFamily: 'monospace',
      }}>
        {ticker.slice(0, 2)}
      </span>
    );
  }
  return (
    <img
      src={LOGO_SOURCES[srcIdx](ticker)}
      alt={ticker}
      loading="lazy"
      onError={() => setSrcIdx(i => i + 1)}
      style={{ width: size, height: size, flexShrink: 0, objectFit: 'contain', borderRadius: 4 }}
    />
  );
}

// ── One company entry inside a day cell ──────────────────────────────────────
function LogoEntry({ stock, isReported, onClick, isMobile }) {
  const [hover, setHover] = useState(false);
  const size = isMobile ? 16 : 22;
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={`${stock.ticker} — ${stock.name}${stock.price != null ? ` · $${stock.price.toFixed(2)}` : ''}${stock.rs != null ? ` · RS ${stock.rs}` : ''}`}
      style={{
        display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 6,
        padding: isMobile ? '3px 4px' : '4px 6px',
        borderRadius: 6, cursor: 'pointer',
        background: hover ? 'rgba(255,255,255,0.75)' : 'transparent',
        opacity: isReported ? 0.55 : 1,
        transition: 'background 0.1s',
        minWidth: 0,
      }}
    >
      <CompanyLogo ticker={stock.ticker} size={size} />
      <span style={{
        fontSize: isMobile ? 9 : 11, fontWeight: 800, fontFamily: 'monospace',
        color: C.cellText, letterSpacing: '-0.3px',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {stock.ticker}
      </span>
    </div>
  );
}

// ── One stacked week band ────────────────────────────────────────────────────
function WeekBand({ week, byDate, onPick, isMobile }) {
  const headerH = isMobile ? 46 : 64;
  return (
    <div style={{ marginBottom: isMobile ? 14 : 22 }}>

      {/* Mobile: week title as its own slim band (no room inside the middle header) */}
      {isMobile && (
        <div style={{
          background: C.weekBandBg, color: C.headerText, textAlign: 'center',
          fontSize: 13, fontWeight: 800, padding: '5px 8px', marginBottom: 3, borderRadius: 3,
        }}>
          {week.title}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(5, ${isMobile ? 'minmax(104px, 1fr)' : '1fr'})`,
        columnGap: isMobile ? 3 : 5,
        overflowX: isMobile ? 'auto' : 'visible',
        paddingBottom: isMobile ? 4 : 0,
      }}>
        {week.days.map((day, di) => {
          const stocks = byDate[day.dateStr] || [];
          const headerBg = day.isPast ? C.headerBgPast : C.headerBg;
          return (
            <div key={day.dateStr} style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>

              {/* Tan day header — middle column carries the week title on desktop */}
              <div style={{
                background: headerBg,
                height: headerH,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'flex-end',
                padding: isMobile ? '4px 4px 5px' : '6px 6px 8px',
                borderRadius: '3px 3px 0 0',
                boxShadow: day.isToday ? `inset 0 0 0 2px ${C.todayRing}` : 'none',
              }}>
                {!isMobile && di === 2 && (
                  <div style={{
                    fontSize: 17, fontWeight: 800, color: C.headerText,
                    marginBottom: 'auto', whiteSpace: 'nowrap',
                  }}>
                    {week.title}
                  </div>
                )}
                <div style={{
                  fontSize: isMobile ? 10 : 12.5,
                  fontWeight: day.isToday ? 800 : 600,
                  color: C.headerText, whiteSpace: 'nowrap',
                  overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%',
                }}>
                  {day.label}
                </div>
              </div>

              {/* Pointer arrow from header into the cell */}
              <div style={{ display: 'flex', justifyContent: 'center', height: 7 }}>
                <div style={{
                  width: 0, height: 0,
                  borderLeft: '7px solid transparent',
                  borderRight: '7px solid transparent',
                  borderTop: `7px solid ${headerBg}`,
                }} />
              </div>

              {/* Cream cell with logo grid */}
              <div style={{
                flex: 1,
                background: day.isPast ? C.cellBgPast : C.cellBg,
                borderRadius: '0 0 3px 3px',
                padding: isMobile ? '4px 3px' : '6px 5px',
                minHeight: isMobile ? 60 : 90,
              }}>
                {stocks.length === 0 ? (
                  <div style={{ textAlign: 'center', paddingTop: isMobile ? 18 : 32, color: C.cellFaint, fontSize: 11 }}>—</div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile || stocks.length <= 3 ? '1fr' : '1fr 1fr',
                    gap: isMobile ? 1 : 2,
                  }}>
                    {stocks.map(s => (
                      <LogoEntry key={s.ticker} stock={s} isReported={day.isPast} onClick={() => onPick(s)} isMobile={isMobile} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const WEEKS_SHOWN = 3;

export default function EarningsCalendar({ stocksByTicker, onClip }) {
  const isMobile = useIsMobile();

  const [weekOffset, setWeekOffset] = useState(0);
  const [popupStock, setPopupStock] = useState(null);

  // Date → stocks index, biggest/most recognizable companies first (market cap, then RS)
  const byDate = useMemo(() => {
    const map = {};
    Object.values(stocksByTicker).forEach(s => {
      if (!s.earningsDate) return;
      (map[s.earningsDate] ||= []).push(s);
    });
    Object.values(map).forEach(arr =>
      arr.sort((a, b) => (b.marketCapB || 0) - (a.marketCapB || 0) || (b.rs || 0) - (a.rs || 0))
    );
    return map;
  }, [stocksByTicker]);

  const weeks = useMemo(
    () => Array.from({ length: WEEKS_SHOWN }, (_, i) => getWeekDays(weekOffset + i)),
    [weekOffset]
  );
  const allStocks = useMemo(() => Object.values(stocksByTicker).filter(s => s.earningsDate), [stocksByTicker]);

  const navBtn = {
    padding: isMobile ? '5px 12px' : '6px 16px', border: 'none', background: 'transparent',
    color: C.headerText, cursor: 'pointer', fontSize: 18, borderRadius: 6, lineHeight: 1, fontWeight: 800,
  };

  return (
    <div style={{ maxWidth: isMobile ? '100%' : 1050, margin: '0 auto', padding: isMobile ? '0 4px' : 0 }}>

      {/* Week navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: C.headerBg, borderRadius: 8, padding: 2 }}>
          <button onClick={() => setWeekOffset(w => w - 1)} style={navBtn}>‹</button>
          <span style={{
            fontSize: isMobile ? 12 : 13, color: C.headerText, fontWeight: 800,
            minWidth: isMobile ? 130 : 180, textAlign: 'center',
          }}>
            {weeks[0].title}{weekOffset === 0 ? ' · Today' : ''}
          </span>
          <button onClick={() => setWeekOffset(w => w + 1)} style={navBtn}>›</button>
        </div>

        {weekOffset !== 0 && (
          <button
            onClick={() => setWeekOffset(0)}
            style={{
              padding: '5px 14px', fontSize: 11, fontWeight: 800, borderRadius: 8,
              border: `1px solid ${C.headerBg}`, background: 'transparent', color: C.headerBg, cursor: 'pointer',
            }}
          >
            ↩ This Week
          </button>
        )}
      </div>

      {/* Stacked week bands */}
      {weeks.map(week => (
        <WeekBand key={week.days[0].dateStr} week={week} byDate={byDate} onPick={setPopupStock} isMobile={isMobile} />
      ))}

      <p style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-faint)', marginTop: 8, fontFamily: 'monospace', padding: '0 8px' }}>
        Dates: Yahoo Finance · לחץ על חברה לצפייה בגרף
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
