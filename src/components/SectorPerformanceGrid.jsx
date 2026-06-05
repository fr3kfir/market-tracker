import { useState } from 'react';

const TIMEFRAMES = [
  { key: 'd1',  label: 'Today' },
  { key: 'w1',  label: '1W' },
  { key: 'm1',  label: '1M' },
  { key: 'm3',  label: '3M' },
  { key: 'ytd', label: 'YTD' },
];

function PerfPanel({ themes, defaultTf, onThemeClick }) {
  const [activeTf, setActiveTf] = useState(defaultTf);
  const sorted = [...themes].sort((a, b) => (b[activeTf] || 0) - (a[activeTf] || 0));

  return (
    <div style={{
      background: 'var(--bg-panel)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      overflow: 'hidden',
      flex: 1,
      minWidth: 0,
    }}>
      {/* Timeframe tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        padding: '0 2px',
      }}>
        {TIMEFRAMES.map(tf => (
          <button
            key={tf.key}
            onClick={() => setActiveTf(tf.key)}
            style={{
              flex: 1,
              padding: '7px 0',
              fontSize: 11,
              fontWeight: activeTf === tf.key ? 700 : 500,
              color: activeTf === tf.key ? '#3b82f6' : 'var(--text-faint)',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTf === tf.key ? '2px solid #3b82f6' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s',
              fontFamily: 'inherit',
            }}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* Rows */}
      <div style={{ overflowY: 'auto', maxHeight: 600 }}>
        {sorted.map(t => {
          const val = t[activeTf] ?? 0;
          const isPos = val >= 0;
          const color = isPos ? '#3b82f6' : '#ec4899';
          return (
            <div
              key={t.theme}
              onClick={() => onThemeClick(t.theme)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '5px 10px',
                cursor: 'pointer',
                borderBottom: '1px solid var(--border)',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.07)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{
                fontSize: 11.5,
                color: 'var(--text)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginRight: 8,
                flex: 1,
                minWidth: 0,
              }}>
                {t.theme}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                <div style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: color,
                  flexShrink: 0,
                }} />
                <span style={{
                  fontSize: 11.5,
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color: color,
                  minWidth: 52,
                  textAlign: 'right',
                }}>
                  {isPos ? '+' : ''}{val.toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SectorPerformanceGrid({ themes, onThemeClick }) {
  if (!themes || themes.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <PerfPanel themes={themes} defaultTf="d1"  onThemeClick={onThemeClick} />
      <PerfPanel themes={themes} defaultTf="w1"  onThemeClick={onThemeClick} />
      <PerfPanel themes={themes} defaultTf="m1"  onThemeClick={onThemeClick} />
    </div>
  );
}
