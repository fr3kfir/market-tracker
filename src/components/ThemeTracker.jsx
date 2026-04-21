import { useState } from 'react';

const TIMEFRAMES = [
  { key: 'd1',  label: 'Today', color: '#22d3ee' },
  { key: 'w1',  label: '1W',    color: '#38bdf8' },
  { key: 'm1',  label: '1M',    color: '#818cf8' },
  { key: 'm3',  label: '3M',    color: '#a78bfa' },
  { key: 'ytd', label: 'YTD',   color: '#f472b6' },
];

const NEG_COLOR = '#f87171';

function PerfBar({ val, maxAbs, color }) {
  const isPos = val >= 0;
  const barW = maxAbs > 0 ? Math.round((Math.abs(val) / maxAbs) * 100) : 0;
  const barColor = isPos ? color : NEG_COLOR;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--bg)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${barW}%`,
          borderRadius: 99,
          background: barColor,
          opacity: 0.9,
          transition: 'width 0.4s ease',
        }} />
      </div>
      <span style={{
        width: 48,
        textAlign: 'right',
        fontSize: 11,
        fontFamily: 'monospace',
        fontWeight: 700,
        color: barColor,
        flexShrink: 0,
      }}>
        {isPos ? '+' : ''}{val.toFixed(1)}%
      </span>
    </div>
  );
}

export default function ThemeTracker({ themes, onThemeClick }) {
  const [sortTf, setSortTf] = useState('d1');

  const sorted = [...themes].sort((a, b) => (b[sortTf] || 0) - (a[sortTf] || 0));

  // Max absolute value for the selected timeframe only
  const maxAbs = Math.max(...themes.map(t => Math.abs(t[sortTf] || 0)), 0.1);

  return (
    <div className="panel h-full">
      {/* Header */}
      <div className="panel-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span>Theme Performance</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, color: 'var(--text-faint)', marginRight: 2 }}>SORT:</span>
          {TIMEFRAMES.map(tf => (
            <button
              key={tf.key}
              onClick={() => setSortTf(tf.key)}
              style={{
                fontSize: 9,
                padding: '2px 6px',
                borderRadius: 20,
                border: `1px solid ${sortTf === tf.key ? tf.color : 'var(--border)'}`,
                background: sortTf === tf.key ? tf.color + '22' : 'transparent',
                color: sortTf === tf.key ? tf.color : 'var(--text-faint)',
                cursor: 'pointer',
                fontWeight: sortTf === tf.key ? 700 : 400,
                transition: 'all 0.15s',
              }}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Theme rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {sorted.map((t, idx) => {
          const val = t[sortTf] || 0;
          const activeTf = TIMEFRAMES.find(tf => tf.key === sortTf);
          return (
            <div
              key={t.theme}
              className="clickable-row"
              onClick={() => onThemeClick(t.theme)}
              style={{ padding: '7px 10px', margin: '0 -8px', borderRadius: 8 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 9, color: 'var(--text-faint)', fontFamily: 'monospace', width: 14, flexShrink: 0 }}>{idx + 1}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', width: 130, flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.theme}</span>
                <PerfBar val={val} maxAbs={maxAbs} color={activeTf.color} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
