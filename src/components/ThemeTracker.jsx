import { useState } from 'react';

const TIMEFRAMES = [
  { key: 'd1', label: 'Today' },
  { key: 'w1', label: '1W' },
  { key: 'm1', label: '1M' },
  { key: 'm3', label: '3M' },
  { key: 'ytd', label: 'YTD' },
];

export default function ThemeTracker({ themes, onThemeClick }) {
  const [activeTf, setActiveTf] = useState('m1');

  // Sort themes by active timeframe value descending
  const sorted = [...themes].sort((a, b) => (b[activeTf] || 0) - (a[activeTf] || 0));
  const maxAbs = Math.max(...sorted.map(t => Math.abs(t[activeTf] || 0)), 0.1);

  return (
    <div className="panel h-full">
      <div className="panel-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Theme Performance</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {TIMEFRAMES.map(tf => (
            <button
              key={tf.key}
              className={`tf-btn${activeTf === tf.key ? ' active' : ''}`}
              onClick={() => setActiveTf(tf.key)}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {sorted.map((t, idx) => {
          const val = t[activeTf] || 0;
          const isPos = val >= 0;
          const barW = Math.round((Math.abs(val) / maxAbs) * 100);
          return (
            <div
              key={t.theme}
              className="clickable-row"
              onClick={() => onThemeClick(t.theme)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 10px', margin: '0 -8px' }}
            >
              {/* Rank */}
              <span style={{ width: '16px', textAlign: 'right', fontSize: '10px', color: 'var(--text-faint)', fontFamily: 'monospace', flexShrink: 0 }}>
                {idx + 1}
              </span>
              {/* Theme name */}
              <span style={{ width: '130px', fontSize: '12px', color: 'var(--text)', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                {t.theme}
              </span>
              {/* Bar */}
              <div style={{ flex: 1, height: '6px', background: 'var(--bg)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${barW}%`,
                  borderRadius: '99px',
                  background: isPos
                    ? 'linear-gradient(90deg, #1d6fe8, #38bdf8)'
                    : 'linear-gradient(90deg, #be185d, #f472b6)',
                  transition: 'width 0.4s ease',
                }} />
              </div>
              {/* Value */}
              <span style={{
                width: '48px',
                textAlign: 'right',
                fontSize: '11px',
                fontFamily: 'monospace',
                fontWeight: 700,
                color: isPos ? '#38bdf8' : '#f472b6',
                flexShrink: 0,
              }}>
                {isPos ? '+' : ''}{val.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
