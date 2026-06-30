import { useState } from 'react';

const TIMEFRAMES = [
  { key: 'd1',  label: 'Today' },
  { key: 'w1',  label: '1W'   },
  { key: 'm1',  label: '1M'   },
  { key: 'm3',  label: '3M'   },
  { key: 'ytd', label: 'YTD'  },
];

const POS_COLOR = '#3b82f6';
const NEG_COLOR = '#f87171';

function PerfBar({ val, maxAbs }) {
  const isPos = val >= 0;
  const barW = maxAbs > 0 ? Math.round((Math.abs(val) / maxAbs) * 100) : 0;
  const barColor = isPos ? POS_COLOR : NEG_COLOR;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
      <div style={{ flex: 1, height: 5, background: 'var(--bg)', borderRadius: 99, overflow: 'hidden', minWidth: 20 }}>
        <div style={{
          height: '100%',
          width: `${barW}%`,
          borderRadius: 99,
          background: barColor,
          transition: 'width 0.4s ease',
        }} />
      </div>
      <span style={{
        width: 46,
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

function ThemePanel({ themes, onThemeClick, defaultTf }) {
  const [sortTf, setSortTf] = useState(defaultTf);
  const sorted = [...themes].sort((a, b) => (b[sortTf] || 0) - (a[sortTf] || 0));
  const maxAbs = Math.max(...themes.map(t => Math.abs(t[sortTf] || 0)), 0.1);

  return (
    <div className="panel" style={{ minWidth: 0 }}>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
        {TIMEFRAMES.map(tf => (
          <button
            key={tf.key}
            onClick={() => setSortTf(tf.key)}
            style={{
              fontSize: 9,
              padding: '2px 7px',
              borderRadius: 20,
              border: `1px solid ${sortTf === tf.key ? POS_COLOR : 'var(--border)'}`,
              background: sortTf === tf.key ? POS_COLOR + '22' : 'transparent',
              color: sortTf === tf.key ? POS_COLOR : 'var(--text-faint)',
              cursor: 'pointer',
              fontWeight: sortTf === tf.key ? 700 : 400,
              transition: 'all 0.15s',
            }}
          >
            {tf.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {sorted.map((t, idx) => {
          const val = t[sortTf] || 0;
          return (
            <div
              key={t.theme}
              onClick={() => onThemeClick(t.theme)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 8px', margin: '0 -6px', borderRadius: 6,
                cursor: 'pointer', transition: 'background 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.07)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: 9, color: 'var(--text-faint)', fontFamily: 'monospace', width: 14, flexShrink: 0, textAlign: 'right' }}>{idx + 1}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', width: 110, flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.theme}</span>
              <PerfBar val={val} maxAbs={maxAbs} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ThemeTracker({ themes, onThemeClick, compact }) {
  if (compact) {
    return <ThemePanel themes={themes} onThemeClick={onThemeClick} defaultTf="d1" />;
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'start' }}>
      <ThemePanel themes={themes} onThemeClick={onThemeClick} defaultTf="d1" />
      <ThemePanel themes={themes} onThemeClick={onThemeClick} defaultTf="m1" />
    </div>
  );
}
