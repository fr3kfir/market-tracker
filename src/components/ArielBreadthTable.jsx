import { useState, useMemo } from 'react';

const PRIMARY_COLS = [
  { key: 'up4',     label: 'Stocks\nUp 4%+\nToday',   bull: true  },
  { key: 'dn4',     label: 'Stocks\nDown 4%+\nToday', bull: false },
  { key: 'ratio5',  label: '5 Day\nRatio',             bull: true,  isRatio: true },
  { key: 'ratio10', label: '10 Day\nRatio',            bull: true,  isRatio: true },
];

const SECONDARY_COLS = [
  { key: 'up25q',   label: 'Up 25%+\nQuarter',   bull: true  },
  { key: 'dn25q',   label: 'Down 25%+\nQuarter', bull: false },
  { key: 'up25m',   label: 'Up 25%+\nMonth',     bull: true  },
  { key: 'dn25m',   label: 'Down 25%+\nMonth',   bull: false },
  { key: 'up50m',   label: 'Up 50%+\nMonth',     bull: true  },
  { key: 'dn50m',   label: 'Down 50%+\nMonth',   bull: false },
  { key: 'up13_34', label: 'Up 13%+\n34 Days',   bull: true  },
  { key: 'dn13_34', label: 'Down 13%+\n34 Days', bull: false },
];

const EXTRA_COL = { key: 'above50dma', label: '>50dma', bull: true, isPct: true };

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

// ── Contrast-safe text color ──────────────────────────────────────────────
// The cell background is a semi-transparent tint over the (near-black) panel
// background, so a fixed dark-green/dark-red text color goes invisible at low
// alpha (the tint barely lightens the dark panel underneath it). Instead we
// blend the tint over the panel color and pick text by the *actual* resulting
// luminance, so every bucket stays readable regardless of alpha.
const PANEL_RGB = [13, 20, 36]; // var(--bg-panel) in the dark theme
const GREEN_RGB = [34, 197, 94];
const RED_RGB   = [220, 38, 38];

const GREEN_DARK = [5, 46, 22];     // #052e16
const GREEN_LIGHT = [187, 247, 208]; // #bbf7d0
const RED_DARK = [69, 10, 10];       // #450a0a
const RED_LIGHT = [254, 202, 202];   // #fecaca

function blend(base, tint, alpha) {
  return base.map((b, i) => b * (1 - alpha) + tint[i] * alpha);
}
function relLuminance([r, g, b]) {
  const lin = c => { const cs = c / 255; return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4); };
  const [rl, gl, bl] = [r, g, b].map(lin);
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}
function contrastRatio(rgbA, rgbB) {
  const L1 = relLuminance(rgbA), L2 = relLuminance(rgbB);
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}
// Picks whichever candidate (dark vs light) has the higher actual contrast
// ratio against this specific blended background — no guessed thresholds.
function fgForTint(alpha, green) {
  const bg = blend(PANEL_RGB, green ? GREEN_RGB : RED_RGB, alpha);
  const dark = green ? GREEN_DARK : RED_DARK;
  const light = green ? GREEN_LIGHT : RED_LIGHT;
  const better = contrastRatio(bg, dark) >= contrastRatio(bg, light) ? dark : light;
  return `rgb(${better[0]},${better[1]},${better[2]})`;
}

// Returns [background, textColor]
function cellStyle(val, min, max, bull, isRatio, isPct) {
  if (val == null) return ['transparent', 'var(--text-muted)'];

  if (isRatio) {
    if (val >= 3.5) return ['rgba(21,128,61,0.85)',  fgForTint(0.85, true)];
    if (val >= 2.5) return ['rgba(22,163,74,0.65)',  fgForTint(0.65, true)];
    if (val >= 2.0) return ['rgba(34,197,94,0.38)',  fgForTint(0.38, true)];
    if (val >= 1.5) return ['rgba(74,222,128,0.20)', fgForTint(0.20, true)];
    if (val >= 1.1) return ['rgba(34,197,94,0.12)',  fgForTint(0.12, true)];
    if (val >= 0.9) return ['rgba(100,116,139,0.08)','var(--text-muted)'];
    if (val >= 0.7) return ['rgba(220,38,38,0.20)',  fgForTint(0.20, false)];
    if (val >= 0.5) return ['rgba(220,38,38,0.45)',  fgForTint(0.45, false)];
    return                 ['rgba(185,28,28,0.80)',  fgForTint(0.80, false)];
  }

  if (isPct) {
    if (val >= 68) return ['rgba(21,128,61,0.82)',  fgForTint(0.82, true)];
    if (val >= 60) return ['rgba(34,197,94,0.48)',  fgForTint(0.48, true)];
    if (val >= 52) return ['rgba(74,222,128,0.22)', fgForTint(0.22, true)];
    if (val >= 46) return ['rgba(100,116,139,0.08)','var(--text-muted)'];
    if (val >= 38) return ['rgba(220,38,38,0.22)',  fgForTint(0.22, false)];
    if (val >= 30) return ['rgba(220,38,38,0.50)',  fgForTint(0.50, false)];
    return                 ['rgba(185,28,28,0.82)',  fgForTint(0.82, false)];
  }

  const range = max - min;
  if (range === 0) return ['rgba(100,116,139,0.08)', 'var(--text-muted)'];
  const t = (val - min) / range;
  if (t < 0.08) return ['rgba(100,116,139,0.08)', 'var(--text-muted)'];
  const alpha = Math.round((0.12 + t * 0.78) * 100) / 100;
  const rgb = bull ? '34,197,94' : '220,38,38';
  return [`rgba(${rgb},${alpha})`, fgForTint(alpha, bull)];
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

// ── Drill-down modal: shows which tickers make up a cell's count ─────────
function TickerDrilldown({ date, col, tickers, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-panel)', border: '1px solid var(--border-hi)', borderRadius: 12,
          maxWidth: 560, width: '100%', maxHeight: '75vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-faint)' }}>{fmtDate(date)}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>{col.label.replace(/\n/g, ' ')} · {tickers.length} {tickers.length === 1 ? 'stock' : 'stocks'}</div>
          </div>
          <button onClick={onClose} style={{
            border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)',
            borderRadius: 7, cursor: 'pointer', fontSize: 12, padding: '4px 10px',
          }}>✕ Close</button>
        </div>
        <div style={{ padding: 14, overflowY: 'auto' }}>
          {tickers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 12, color: 'var(--text-faint)' }}>No stocks matched this on this day.</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {tickers.map(t => (
                <a
                  key={t}
                  href={`https://www.tradingview.com/chart/?symbol=${t}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--text)',
                    border: '1px solid var(--border)', borderRadius: 6, padding: '4px 9px',
                    textDecoration: 'none', background: 'var(--bg)',
                  }}
                >{t}</a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ArielBreadthTable({ rows, breadth, loading }) {
  const pct = usePercentiles(rows);
  const [drilldown, setDrilldown] = useState(null); // { date, col, tickers } | null

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
                    const cellTickers = row.tickers?.[col.key];
                    const clickable = !col.isRatio && cellTickers !== undefined;
                    return (
                      <td
                        key={col.key}
                        onClick={clickable ? () => setDrilldown({ date: row.date, col, tickers: cellTickers }) : undefined}
                        style={{ ...TD_BASE, background: bg, color: fg, cursor: clickable ? 'pointer' : 'default' }}
                        title={clickable ? 'Click to see which stocks' : undefined}
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

      {drilldown && (
        <TickerDrilldown
          date={drilldown.date}
          col={drilldown.col}
          tickers={drilldown.tickers}
          onClose={() => setDrilldown(null)}
        />
      )}
    </div>
  );
}
