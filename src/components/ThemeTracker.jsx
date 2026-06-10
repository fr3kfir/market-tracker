import { useState } from 'react';

const TIMEFRAMES = [
  { key: 'd1',  label: 'Today' },
  { key: 'w1',  label: '1W' },
  { key: 'm1',  label: '1M' },
  { key: 'm3',  label: '3M' },
  { key: 'ytd', label: 'YTD' },
];

const POS_COLOR = '#4f8ef7';
const NEG_COLOR = '#f4617f';

function ThemeColumn({ themes, defaultTf, onThemeClick }) {
  const [tf, setTf] = useState(defaultTf);

  const sorted = [...themes].sort((a, b) => (b[tf] || 0) - (a[tf] || 0));
  const maxAbs = Math.max(...themes.map(t => Math.abs(t[tf] || 0)), 0.1);

  return (
    <div style={{
      flex: 1,
      minWidth: 0,
      background: 'var(--panel)',
      borderRadius: 10,
      border: '1px solid var(--border)',
      padding: '10px 0 6px',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Timeframe tabs */}
      <div style={{ display: 'flex', gap: 2, padding: '0 10px 8px', borderBottom: '1px solid var(--border)' }}>
        {TIMEFRAMES.map(t => {
          const active = t.key === tf;
          return (
            <button
              key={t.key}
              onClick={() => setTf(t.key)}
              style={{
                flex: 1,
                fontSize: 10,
                padding: '3px 0',
                borderRadius: 4,
                border: 'none',
                background: active ? POS_COLOR : 'transparent',
                color: active ? '#fff' : 'var(--text-faint)',
                cursor: 'pointer',
                fontWeight: active ? 700 : 400,
                transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Rows */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {sorted.map(t => {
          const val = t[tf] || 0;
          const isPos = val >= 0;
          const barColor = isPos ? POS_COLOR : NEG_COLOR;
          const barW = maxAbs > 0 ? Math.round((Math.abs(val) / maxAbs) * 68) : 0;

          return (
            <div
              key={t.theme}
              onClick={() => onThemeClick(t.theme)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                cursor: 'pointer',
                borderRadius: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Name */}
              <span style={{
                flex: '0 0 110px',
                fontSize: 11,
                fontWeight: 500,
                color: 'var(--text)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {t.theme}
              </span>

              {/* Bar */}
              <div style={{
                flex: 1,
                minWidth: 24,
                height: 5,
                background: 'var(--bg)',
                borderRadius: 99,
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${barW}%`,
                  borderRadius: 99,
                  background: barColor,
                }} />
              </div>

              {/* Pct */}
              <span style={{
                width: 44,
                textAlign: 'right',
                fontSize: 11,
                fontFamily: 'monospace',
                fontWeight: 700,
                color: barColor,
                flexShrink: 0,
              }}>
                {isPos ? '+' : ''}{val.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ThemeTracker({ themes, onThemeClick }) {
  if (!themes || themes.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: 10, height: '100%', width: '100%' }}>
      <ThemeColumn themes={themes} defaultTf="d1"  onThemeClick={onThemeClick} />
      <ThemeColumn themes={themes} defaultTf="w1"  onThemeClick={onThemeClick} />
      <ThemeColumn themes={themes} defaultTf="m1"  onThemeClick={onThemeClick} />
    </div>
  );
}
