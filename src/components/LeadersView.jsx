import { useState } from 'react';
import { STAGE_COLORS } from './StageOverview';

const STAGE_TEXT = {
  S1: 'text-gray-400',
  S2: 'text-blue-400',
  S3: 'text-amber-400',
  S4: 'text-pink-400',
};

const RS_COLOR = (rs) => {
  if (rs >= 80) return '#10b981';
  if (rs >= 60) return '#3b82f6';
  if (rs >= 40) return '#f59e0b';
  return '#e879f9';
};

const TIMEFRAMES = [
  { key: 'change', label: 'Today' },
  { key: 'w1',    label: '1W' },
  { key: 'm1',    label: '1M' },
  { key: 'm3',    label: '3M' },
  { key: 'ytd',   label: 'YTD' },
];

function PerfBadge({ value, isActive }) {
  if (value == null) return <span style={{ color: 'var(--text-faint)', fontFamily: 'monospace', fontSize: 11 }}>—</span>;
  const isPos = value >= 0;
  const color = isPos ? '#34d399' : '#f87171';
  const bg = isPos ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)';
  return (
    <span style={{
      fontFamily: 'monospace',
      fontWeight: 700,
      fontSize: 11,
      color,
      background: isActive ? bg : 'transparent',
      padding: isActive ? '2px 6px' : '0',
      borderRadius: isActive ? '20px' : '0',
      transition: 'background 0.2s',
    }}>
      {isPos ? '+' : ''}{value.toFixed(2)}%
    </span>
  );
}

export default function LeadersView({ name, stocks, onBack, historyLoading }) {
  const [activeTf, setActiveTf] = useState('change');
  const [sortKey, setSortKey] = useState(null); // null = auto-sort by activeTf
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (key) => {
    if (sortKey === key || (sortKey === null && key === activeTf)) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const handleTfChange = (tf) => {
    setActiveTf(tf);
    setSortKey(null); // reset to auto-sort by new timeframe
    setSortDir('desc');
  };

  const effectiveSortKey = sortKey ?? activeTf;

  const sorted = [...stocks].sort((a, b) => {
    const m = sortDir === 'desc' ? -1 : 1;
    const av = a[effectiveSortKey] ?? -999;
    const bv = b[effectiveSortKey] ?? -999;
    return m * (av > bv ? 1 : av < bv ? -1 : 0);
  });

  const Th = ({ label, field, align = 'left' }) => {
    const isActive = effectiveSortKey === field;
    return (
      <th
        onClick={() => handleSort(field)}
        style={{
          paddingBottom: 12, paddingLeft: 8, paddingRight: 8,
          color: isActive ? '#3b82f6' : 'var(--text-faint)',
          fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '0.08em', cursor: 'pointer', textAlign: align,
          userSelect: 'none', whiteSpace: 'nowrap',
          transition: 'color 0.2s',
        }}
      >
        {label}
        {isActive && <span style={{ marginLeft: 4, color: '#3b82f6' }}>{sortDir === 'desc' ? '▼' : '▲'}</span>}
      </th>
    );
  };

  const activeTfLabel = TIMEFRAMES.find(t => t.key === activeTf)?.label || 'Today';
  const hasHistory = stocks.some(s => s.w1 != null);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="border-b sticky top-0 z-10" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm rounded px-3 py-1.5 transition-all"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border)', background: 'var(--bg-panel)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            ← Dashboard
          </button>
          <div>
            <div className="font-semibold" style={{ color: 'var(--text)' }}>{name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              Sorted by <strong style={{ color: '#3b82f6' }}>{activeTfLabel}</strong> performance
              {historyLoading && (
                <span style={{ color: 'var(--text-faint)', fontSize: 10 }}>· loading history…</span>
              )}
            </div>
          </div>

          {/* Timeframe toggle */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
            {TIMEFRAMES.map(tf => {
              const needsHistory = tf.key !== 'change';
              const disabled = needsHistory && historyLoading;
              return (
                <button
                  key={tf.key}
                  disabled={disabled}
                  onClick={() => handleTfChange(tf.key)}
                  className="tf-btn"
                  style={{
                    opacity: disabled ? 0.4 : 1,
                    background: activeTf === tf.key ? '#3b82f6' : 'transparent',
                    color: activeTf === tf.key ? '#fff' : 'var(--text-muted)',
                    borderColor: activeTf === tf.key ? '#3b82f6' : 'var(--border)',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                  }}
                >
                  {tf.label}
                </button>
              );
            })}
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" style={{ marginLeft: 8 }} />
            <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-muted)' }}>LIVE</span>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 py-4">
        <div className="panel overflow-x-auto">
          <table className="w-full text-xs" style={{ minWidth: 680 }}>
            <thead style={{ borderBottom: '1px solid var(--border)' }}>
              <tr>
                <th style={{ paddingBottom: 12, paddingLeft: 8, paddingRight: 8, color: 'var(--text-faint)', fontSize: 10, width: 28 }}>#</th>
                <Th label="Ticker" field="ticker" />
                <th style={{ paddingBottom: 12, paddingLeft: 8, paddingRight: 8, color: 'var(--text-faint)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left' }}>Company</th>
                <Th label="Price" field="price" align="right" />
                <Th label={`Perf (${activeTfLabel})`} field={activeTf} align="right" />
                {hasHistory && activeTf === 'change' && <Th label="1W" field="w1" align="right" />}
                {hasHistory && activeTf === 'change' && <Th label="1M" field="m1" align="right" />}
                <Th label="RS" field="rs" align="center" />
                <Th label="Vol" field="volBuzz" align="center" />
                <Th label="vs 50d" field="distSma50" align="right" />
                <Th label="Stage" field="stage" align="center" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((s, i) => (
                <tr
                  key={s.ticker}
                  style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '10px 8px', fontFamily: 'monospace', color: 'var(--text-faint)' }}>{i + 1}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text)' }}>{s.ticker}</span>
                  </td>
                  <td style={{ padding: '10px 8px', color: 'var(--text-muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</td>
                  <td style={{ padding: '10px 8px', fontFamily: 'monospace', color: 'var(--text)', textAlign: 'right' }}>${s.price.toFixed(2)}</td>
                  {/* Active timeframe performance — highlighted */}
                  <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                    <PerfBadge value={s[activeTf]} isActive={true} />
                  </td>
                  {/* Extra columns when on Today view */}
                  {hasHistory && activeTf === 'change' && (
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                      <PerfBadge value={s.w1} isActive={false} />
                    </td>
                  )}
                  {hasHistory && activeTf === 'change' && (
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                      <PerfBadge value={s.m1} isActive={false} />
                    </td>
                  )}
                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                      <div style={{ width: 44, height: 5, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${s.rs}%`, backgroundColor: RS_COLOR(s.rs), borderRadius: 99 }} />
                      </div>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 11, color: RS_COLOR(s.rs), width: 20, textAlign: 'right' }}>{s.rs}</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', fontFamily: 'monospace' }}>
                    <span style={{ color: s.volBuzz > 1.5 ? '#3b82f6' : 'var(--text-muted)', fontWeight: s.volBuzz > 1.5 ? 700 : 400 }}>
                      {s.volBuzz.toFixed(1)}x
                    </span>
                  </td>
                  <td style={{ padding: '10px 8px', fontFamily: 'monospace', textAlign: 'right' }}>
                    <span style={{ color: s.distSma50 >= 0 ? '#38bdf8' : '#f472b6' }}>
                      {s.distSma50 >= 0 ? '+' : ''}{s.distSma50.toFixed(1)}%
                    </span>
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                    <span
                      className={`font-bold font-mono ${STAGE_TEXT[s.stage]}`}
                      style={{
                        fontSize: 10,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: STAGE_COLORS[s.stage] + '22',
                        border: `1px solid ${STAGE_COLORS[s.stage]}44`,
                      }}
                    >
                      {s.stage}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!hasHistory && !historyLoading && (
          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-faint)', marginTop: 12 }}>
            Historical performance (1W/1M/3M/YTD) will appear after first data load
          </p>
        )}
      </div>
    </div>
  );
}
