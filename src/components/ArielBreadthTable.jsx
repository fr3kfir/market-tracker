import { useMemo, useState } from 'react';

const PRIMARY_COLS = [
  { key: 'up4',     label: 'Stocks\nUp 4%+\nToday',   full: 'Stocks Up 4%+ Today',      bull: true,  tickersKey: 'up4' },
  { key: 'dn4',     label: 'Stocks\nDown 4%+\nToday', full: 'Stocks Down 4%+ Today',    bull: false, tickersKey: 'dn4' },
  { key: 'ratio5',  label: '5 Day\nRatio',             full: '5 Day Ratio',              bull: true,  isRatio: true, upKey: 'pos5',  downKey: 'neg5'  },
  { key: 'ratio10', label: '10 Day\nRatio',            full: '10 Day Ratio',             bull: true,  isRatio: true, upKey: 'pos10', downKey: 'neg10' },
];

const SECONDARY_COLS = [
  { key: 'up25q',   label: 'Up 25%+\nQuarter',   full: 'Up 25%+ Quarter',   bull: true,  tickersKey: 'up25q'   },
  { key: 'dn25q',   label: 'Down 25%+\nQuarter', full: 'Down 25%+ Quarter', bull: false, tickersKey: 'dn25q'   },
  { key: 'up25m',   label: 'Up 25%+\nMonth',     full: 'Up 25%+ Month',     bull: true,  tickersKey: 'up25m'   },
  { key: 'dn25m',   label: 'Down 25%+\nMonth',   full: 'Down 25%+ Month',   bull: false, tickersKey: 'dn25m'   },
  { key: 'up50m',   label: 'Up 50%+\nMonth',     full: 'Up 50%+ Month',     bull: true,  tickersKey: 'up50m'   },
  { key: 'dn50m',   label: 'Down 50%+\nMonth',   full: 'Down 50%+ Month',   bull: false, tickersKey: 'dn50m'   },
  { key: 'up13_34', label: 'Up 13%+\n34 Days',   full: 'Up 13%+ 34 Days',   bull: true,  tickersKey: 'up13_34' },
  { key: 'dn13_34', label: 'Down 13%+\n34 Days', full: 'Down 13%+ 34 Days', bull: false, tickersKey: 'dn13_34' },
];

const EXTRA_COL = { key: 'above50dma', label: '>50dma', full: 'Stocks Above 50dma', bull: true, isPct: true, tickersKey: 'above50dma' };

const ALL_DATA_COLS = [...PRIMARY_COLS, ...SECONDARY_COLS, EXTRA_COL];

// Compute min/max per column for heatmap normalization
function usePercentiles(rows) {
  return useMemo(() => {
    if (!rows?.length) return {};
    const out = {};
    ALL_DATA_COLS.forEach(col => {
      const vals = rows.map(r => r[col.key]).filter(v => v != null);
      out[col.key] = { min: Math.min(...vals), max: Math.max(...vals) };
    });
    return out;
  }, [rows]);
}

// Returns [background, textColor]
// Rule: bright/saturated bg → dark text; dim bg → light text; none → muted
function cellStyle(val, min, max, bull, isRatio, isPct) {
  if (val == null) return ['transparent', 'var(--text-muted)'];

  if (isRatio) {
    if (val >= 3.5) return ['rgba(21,128,61,0.85)',  '#052e16'];
    if (val >= 2.5) return ['rgba(22,163,74,0.65)',  '#052e16'];
    if (val >= 2.0) return ['rgba(34,197,94,0.38)',  '#14532d'];
    if (val >= 1.5) return ['rgba(74,222,128,0.20)', '#166534'];
    if (val >= 1.1) return ['rgba(163,230,53,0.12)', '#3f6212'];
    if (val >= 0.9) return ['rgba(100,116,139,0.08)','var(--text-muted)'];
    if (val >= 0.7) return ['rgba(220,38,38,0.20)',  '#fca5a5'];
    if (val >= 0.5) return ['rgba(220,38,38,0.45)',  '#fee2e2'];
    return                 ['rgba(185,28,28,0.80)',  '#fff1f2'];
  }

  if (isPct) {
    if (val >= 68) return ['rgba(21,128,61,0.82)',  '#052e16'];
    if (val >= 60) return ['rgba(34,197,94,0.48)',  '#14532d'];
    if (val >= 52) return ['rgba(74,222,128,0.22)', '#166534'];
    if (val >= 46) return ['rgba(100,116,139,0.08)','var(--text-muted)'];
    if (val >= 38) return ['rgba(220,38,38,0.22)',  '#fca5a5'];
    if (val >= 30) return ['rgba(220,38,38,0.50)',  '#fee2e2'];
    return                 ['rgba(185,28,28,0.82)',  '#fff1f2'];
  }

  const range = max - min;
  if (range === 0) return ['rgba(100,116,139,0.08)', 'var(--text-muted)'];
  const t = (val - min) / range;
  if (t < 0.08) return ['rgba(100,116,139,0.08)', 'var(--text-muted)'];
  const alpha = Math.round((0.12 + t * 0.78) * 100) / 100;
  if (bull) {
    // bright green bg → dark green text; dim → lighter
    const fg = t > 0.55 ? '#052e16' : t > 0.30 ? '#14532d' : '#166534';
    return [`rgba(34,197,94,${alpha})`, fg];
  } else {
    // bright red bg → near-white text; dim red → light red text
    const fg = t > 0.55 ? '#fff1f2' : t > 0.30 ? '#fee2e2' : '#fca5a5';
    return [`rgba(220,38,38,${alpha})`, fg];
  }
}

function fmtDate(d) {
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

function fmtVal(val, col) {
  if (val == null) return '—';
  if (col.isRatio) return val.toFixed(2);
  if (col.isPct)   return val.toFixed(1) + '%';
  return val;
}

const CW = 58;   // column width px
const DW = 86;   // date column width px

const TH_BASE = {
  padding: '4px 2px',
  fontSize: 9,
  fontWeight: 600,
  textAlign: 'center',
  whiteSpace: 'pre-line',
  lineHeight: 1.25,
  color: 'var(--text-muted)',
  border: '1px solid rgba(255,255,255,0.06)',
  width: CW,
  minWidth: CW,
  verticalAlign: 'bottom',
};

const TD_BASE = {
  padding: '3px 4px',
  fontSize: 11,
  fontFamily: 'monospace',
  fontWeight: 600,
  textAlign: 'center',
  border: '1px solid rgba(255,255,255,0.035)',
  width: CW,
  minWidth: CW,
  transition: 'background 0.2s',
};

// ── Ticker list modal — shown when a data cell is clicked ─────────────────
function TickerChip({ ticker }) {
  return (
    <span style={{
      fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--text)',
      background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6,
      padding: '4px 8px',
    }}>{ticker}</span>
  );
}

function TickerListSection({ title, color, tickers }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</span>
        <span style={{ fontSize: 10, color: 'var(--text-faint)', fontFamily: 'monospace' }}>({tickers.length})</span>
      </div>
      {tickers.length === 0 ? (
        <div style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'monospace' }}>No stocks</div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {tickers.map(t => <TickerChip key={t} ticker={t} />)}
        </div>
      )}
    </div>
  );
}

function TickerListModal({ info, onClose }) {
  const { col, row } = info;
  const isRatio = !!col.isRatio;
  const up   = isRatio ? (row.tickers?.[col.upKey]   ?? []) : (row.tickers?.[col.tickersKey] ?? []);
  const down = isRatio ? (row.tickers?.[col.downKey] ?? []) : null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12,
          maxWidth: 640, width: '100%', maxHeight: '80vh', overflowY: 'auto',
          boxShadow: '0 12px 48px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{
          padding: '14px 18px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          position: 'sticky', top: 0, background: 'var(--bg-panel)',
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{col.full}</div>
            <div style={{ fontSize: 10, color: 'var(--text-faint)', fontFamily: 'monospace', marginTop: 2 }}>{fmtDate(row.date)}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', fontSize: 18, lineHeight: 1, padding: 4 }}>×</button>
        </div>
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {isRatio ? (
            <>
              <TickerListSection title="Up" color="#22c55e" tickers={up} />
              <TickerListSection title="Down" color="#ef4444" tickers={down} />
            </>
          ) : (
            <TickerListSection title="Matching" color={col.bull ? '#22c55e' : '#ef4444'} tickers={up} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function ArielBreadthTable({ rows, breadth, loading }) {
  const pct = usePercentiles(rows);
  const [modalInfo, setModalInfo] = useState(null);

  if (loading) {
    return (
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320, gap: 12 }}>
        <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="var(--border)" strokeWidth="3" />
          <path d="M4 12a8 8 0 018-8v8z" fill="#3b82f6" />
        </svg>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Computing Ariel Breadth…</div>
          <div style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'monospace' }}>Fetching history for all stocks · ~5–10 sec</div>
        </div>
      </div>
    );
  }

  if (!rows?.length) return null;

  const latest = rows[0];
  const adv = breadth?.advancing ?? 0;
  const dec = breadth?.declining ?? 0;
  const unch = breadth?.unchanged ?? 0;
  const tot = adv + dec + unch || 1;

  const statBar = [
    { label: 'Advancing', val: `${((adv / tot) * 100).toFixed(1)}%`, count: adv, color: '#22c55e' },
    { label: 'Declining',  val: `${((dec / tot) * 100).toFixed(1)}%`, count: dec, color: '#ef4444' },
    { label: 'Up 25%+ Qtr', val: `${latest?.up25q ?? 0}`, count: null, color: '#38bdf8' },
    { label: 'Dn 25%+ Qtr', val: `${latest?.dn25q ?? 0}`, count: null, color: '#f97316' },
    { label: '>50dma', val: `${latest?.above50dma?.toFixed(1) ?? '—'}%`, count: null, color: '#a78bfa' },
  ];

  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* ── Stats header bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '8px 14px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', background: 'var(--bg-panel)' }}>
        <span style={{ fontSize: 10, fontWeight: 800, fontFamily: 'monospace', letterSpacing: '0.08em', color: '#94a3b8', marginRight: 4 }}>
          ARIEL BREADTH
        </span>
        <span style={{ fontSize: 9, color: 'var(--text-faint)', fontFamily: 'monospace', marginRight: 4 }}>
          Click any cell to see its tickers
        </span>
        {statBar.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ display: 'inline-block', width: 24, height: 5, background: s.color, borderRadius: 2, opacity: 0.85 }} />
            <span style={{ fontSize: 10, fontFamily: 'monospace', color: s.color, fontWeight: 700 }}>
              {s.label} {s.val}{s.count != null ? ` (${s.count})` : ''}
            </span>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
        <table style={{ borderCollapse: 'collapse', width: 'max-content' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            {/* Section label row */}
            <tr style={{ background: 'var(--bg)' }}>
              <th style={{ width: DW, minWidth: DW, background: 'var(--bg)', border: '1px solid rgba(255,255,255,0.06)' }} />
              <th colSpan={4} style={{ padding: '4px 8px', fontSize: 9, fontWeight: 800, letterSpacing: '0.06em', textAlign: 'center', background: 'rgba(161,138,0,0.22)', color: '#fbbf24', border: '1px solid rgba(255,255,255,0.08)' }}>
                Primary Breadth Indicators
              </th>
              <th colSpan={8} style={{ padding: '4px 8px', fontSize: 9, fontWeight: 800, letterSpacing: '0.06em', textAlign: 'center', background: 'rgba(21,128,61,0.20)', color: '#4ade80', border: '1px solid rgba(255,255,255,0.08)' }}>
                Secondary Breadth Indicators
              </th>
              <th style={{ padding: '4px 4px', fontSize: 9, fontWeight: 800, textAlign: 'center', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(255,255,255,0.08)', width: CW, minWidth: CW }}>
                Above
              </th>
            </tr>
            {/* Column name row */}
            <tr style={{ background: 'var(--bg)' }}>
              <th style={{ ...TH_BASE, width: DW, minWidth: DW, fontSize: 10, color: 'var(--text-faint)', textAlign: 'left', paddingLeft: 10 }}>Date</th>
              {ALL_DATA_COLS.map(col => (
                <th key={col.key} style={TH_BASE}>{col.label}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, idx) => {
              const isLatest = idx === 0;
              const rowBg = isLatest
                ? 'rgba(59,130,246,0.07)'
                : idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)';

              return (
                <tr key={row.ts} style={{ background: rowBg }}>
                  {/* Date cell */}
                  <td style={{
                    padding: '3px 10px',
                    fontSize: 11,
                    fontFamily: 'monospace',
                    fontWeight: isLatest ? 700 : 400,
                    color: isLatest ? '#60a5fa' : 'var(--text)',
                    whiteSpace: 'nowrap',
                    borderRight: '1px solid var(--border)',
                    width: DW,
                    minWidth: DW,
                  }}>
                    {fmtDate(row.date)}
                  </td>

                  {/* Data cells */}
                  {ALL_DATA_COLS.map(col => {
                    const val = row[col.key];
                    const { min = 0, max = 1 } = pct[col.key] || {};
                    const [bg, fg] = cellStyle(val, min, max, col.bull, col.isRatio, col.isPct);
                    return (
                      <td
                        key={col.key}
                        onClick={() => val != null && setModalInfo({ col, row })}
                        style={{ ...TD_BASE, background: bg, color: fg, cursor: val != null ? 'pointer' : 'default' }}
                        onMouseEnter={e => { if (val != null) e.currentTarget.style.outline = '1px solid rgba(255,255,255,0.3)'; }}
                        onMouseLeave={e => { e.currentTarget.style.outline = 'none'; }}
                      >
                        {fmtVal(val, col)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modalInfo && <TickerListModal info={modalInfo} onClose={() => setModalInfo(null)} />}
    </div>
  );
}
