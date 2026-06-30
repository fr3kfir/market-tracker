import { useState, useMemo } from 'react';

const COLS = [
  { key: 'd1',  label: 'Today' },
  { key: 'w1',  label: '1W'    },
  { key: 'm1',  label: '1M'    },
  { key: 'm3',  label: '3M'    },
  { key: 'm6',  label: '6M'    },
  { key: 'ytd', label: 'YTD'   },
];

function PerfCell({ val }) {
  if (val == null) {
    return (
      <td style={{ padding: '9px 10px', textAlign: 'right', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-faint)' }}>
        —
      </td>
    );
  }
  const color = val > 0 ? '#22c55e' : val < 0 ? '#f87171' : 'var(--text-muted)';
  return (
    <td style={{ padding: '9px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color, whiteSpace: 'nowrap' }}>
      {val > 0 ? '+' : ''}{val.toFixed(2)}%
    </td>
  );
}

export default function ThemeTracker({ themes, onThemeClick }) {
  const [sortKey, setSortKey] = useState('d1');
  const [sortDir, setSortDir] = useState(-1); // -1 desc, 1 asc

  function handleColClick(key) {
    if (key === sortKey) {
      setSortDir(d => -d);
    } else {
      setSortKey(key);
      setSortDir(-1);
    }
  }

  const sorted = useMemo(() => {
    return [...themes].sort((a, b) => {
      const av = a[sortKey] ?? -Infinity;
      const bv = b[sortKey] ?? -Infinity;
      return sortDir * (bv - av);
    });
  }, [themes, sortKey, sortDir]);

  return (
    <div className="panel" style={{ overflowX: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-faint)' }}>
          Theme Tracker
        </span>
        <span style={{ fontSize: 9, color: 'var(--text-faint)', fontFamily: 'monospace' }}>
          {sorted.length} themes
        </span>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 560 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th style={{ textAlign: 'left', padding: '0 10px 8px 0', fontSize: 9, color: 'var(--text-faint)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', userSelect: 'none' }}>
              Theme
            </th>
            {COLS.map(col => {
              const active = sortKey === col.key;
              return (
                <th
                  key={col.key}
                  onClick={() => handleColClick(col.key)}
                  style={{
                    textAlign: 'right',
                    padding: '0 10px 8px',
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    cursor: 'pointer',
                    color: active ? 'var(--accent)' : 'var(--text-faint)',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    transition: 'color 0.15s',
                  }}
                >
                  {col.label}
                  {active && (
                    <span style={{ marginLeft: 3, fontSize: 8 }}>
                      {sortDir < 0 ? '▼' : '▲'}
                    </span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((t, idx) => (
            <tr
              key={t.theme}
              onClick={() => onThemeClick(t.theme)}
              style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <td style={{ padding: '9px 10px 9px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 9, color: 'var(--text-faint)', fontFamily: 'monospace', width: 16, flexShrink: 0 }}>
                    {idx + 1}
                  </span>
                  <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>
                    {t.theme}
                  </span>
                </div>
              </td>
              {COLS.map(col => (
                <PerfCell key={col.key} val={t[col.key] ?? null} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ textAlign: 'center', fontSize: 9, color: 'var(--text-faint)', marginTop: 12, fontFamily: 'monospace' }}>
        Click column header to sort · click row to see leaders
      </p>
    </div>
  );
}
