import { useState } from 'react';

const TIMEFRAMES = [
  { key: 'd1',  label: 'Today', color: '#22d3ee' },
  { key: 'w1',  label: '1W',    color: '#38bdf8' },
  { key: 'm1',  label: '1M',    color: '#818cf8' },
  { key: 'm3',  label: '3M',    color: '#a78bfa' },
  { key: 'ytd', label: 'YTD',   color: '#f472b6' },
];

const NEG_COLOR = '#f87171';

function PerfBar({ val, maxAbs, color, label }) {
  const isPos = val >= 0;
  const barW = maxAbs > 0 ? Math.round((Math.abs(val) / maxAbs) * 100) : 0;
  const barColor = isPos ? color : NEG_COLOR;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ width: 30, fontSize: 9, fontFamily: 'monospace', color: 'var(--text-faint)', flexShrink: 0, textAlign: 'right' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 5, background: 'var(--bg)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${barW}%`,
          borderRadius: 99,
          background: barColor,
          opacity: 0.85,
          transition: 'width 0.4s ease',
        }} />
      </div>
      <span style={{
        width: 44,
        textAlign: 'right',
        fontSize: 10,
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
  const [sortTf, setSortTf] = useState('m1');

  const sorted = [...themes].sort((a, b) => (b[sortTf] || 0) - (a[sortTf] || 0));

  // Max absolute value across ALL timeframes for proportional bars
  const maxAbs = Math.max(
    ...themes.flatMap(t => TIMEFRAMES.map(tf => Math.abs(t[tf.key] || 0))),
    0.1
  );

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

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
        {TIMEFRAMES.map(tf => (
          <span key={tf.key} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: 'var(--text-faint)' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: tf.color, display: 'inline-block' }} />
            {tf.label}
          </span>
        ))}
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: 'var(--text-faint)' }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: NEG_COLOR, display: 'inline-block' }} />
          Negative
        </span>
      </div>

      {/* Theme rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sorted.map((t, idx) => (
          <div
            key={t.theme}
            className="clickable-row"
            onClick={() => onThemeClick(t.theme)}
            style={{ padding: '8px 10px', margin: '0 -8px', borderRadius: 8 }}
          >
            {/* Theme name row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 9, color: 'var(--text-faint)', fontFamily: 'monospace', width: 12 }}>{idx + 1}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{t.theme}</span>
              </div>
              <span style={{
                fontSize: 11,
                fontFamily: 'monospace',
                fontWeight: 700,
                color: (t[sortTf] || 0) >= 0 ? '#38bdf8' : NEG_COLOR,
              }}>
                {(t[sortTf] || 0) >= 0 ? '+' : ''}{(t[sortTf] || 0).toFixed(1)}%
              </span>
            </div>
            {/* All timeframe bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingLeft: 18 }}>
              {TIMEFRAMES.map(tf => (
                <PerfBar
                  key={tf.key}
                  val={t[tf.key] || 0}
                  maxAbs={maxAbs}
                  color={tf.color}
                  label={tf.label}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
