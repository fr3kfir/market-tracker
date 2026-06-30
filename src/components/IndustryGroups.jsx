import { useState, useMemo } from 'react';

const SECTOR_COLORS = {
  'Technology':             '#3b82f6',
  'Energy':                 '#f59e0b',
  'Healthcare':             '#10b981',
  'Financials':             '#8b5cf6',
  'Consumer Discretionary': '#f97316',
  'Industrials':            '#64748b',
  'Materials':              '#84cc16',
  'Communication Services': '#06b6d4',
  'Consumer Staples':       '#a78bfa',
  'Real Estate':            '#ec4899',
  'Utilities':              '#6366f1',
};

const SECTOR_SHORT = {
  'Technology':             'Tech',
  'Energy':                 'Energy',
  'Healthcare':             'Health',
  'Financials':             'Finance',
  'Consumer Discretionary': 'Cons. Disc',
  'Industrials':            'Industrial',
  'Materials':              'Materials',
  'Communication Services': 'Comm.',
  'Consumer Staples':       'Staples',
  'Real Estate':            'Real Est.',
  'Utilities':              'Utilities',
};

const TIMEFRAME_COLS = [
  { key: 'change', label: 'Today' },
  { key: 'w1',     label: '1W'    },
  { key: 'm1',     label: '1M'    },
  { key: 'm3',     label: '3M'    },
  { key: 'm6',     label: '6M'    },
  { key: 'ytd',    label: 'YTD'   },
];

const SECTORS_LIST = Object.keys(SECTOR_COLORS);

function RSBadge({ rs }) {
  const color =
    rs >= 80 ? '#22c55e' :
    rs >= 60 ? '#3b82f6' :
    rs >= 40 ? '#94a3b8' :
    rs >= 20 ? '#fb923c' : '#f87171';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 28, height: 20, borderRadius: 4, padding: '0 4px',
      background: color + '15', color,
      fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
    }}>
      {rs}
    </span>
  );
}

function SectorTag({ sector }) {
  const color = SECTOR_COLORS[sector] || '#94a3b8';
  return (
    <span style={{
      fontSize: 9, padding: '1px 5px', borderRadius: 3,
      background: color + '18', color, fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      {SECTOR_SHORT[sector] || sector}
    </span>
  );
}

function PerfCell({ val }) {
  if (val == null) {
    return (
      <td style={{ padding: '9px 8px', textAlign: 'right', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-faint)' }}>
        —
      </td>
    );
  }
  const color = val > 0 ? '#22c55e' : val < 0 ? '#f87171' : 'var(--text-muted)';
  return (
    <td style={{ padding: '9px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color, whiteSpace: 'nowrap' }}>
      {val > 0 ? '+' : ''}{val.toFixed(1)}%
    </td>
  );
}

export default function IndustryGroups({ groups, onGroupClick }) {
  const [sortKey, setSortKey]           = useState('change');
  const [sortDir, setSortDir]           = useState(-1); // -1 desc
  const [filterSector, setFilterSector] = useState('All');

  const total = groups.length;

  function handleColClick(key) {
    if (key === sortKey) setSortDir(d => -d);
    else { setSortKey(key); setSortDir(-1); }
  }

  const sorted = useMemo(() => {
    let list = [...groups];
    if (filterSector !== 'All') list = list.filter(g => g.sector === filterSector);
    list.sort((a, b) => {
      const av = a[sortKey] ?? -Infinity;
      const bv = b[sortKey] ?? -Infinity;
      return sortDir * (bv - av);
    });
    return list;
  }, [groups, sortKey, sortDir, filterSector]);

  const sectorCounts = useMemo(() => {
    const counts = {};
    groups.forEach(g => { counts[g.sector] = (counts[g.sector] || 0) + 1; });
    return counts;
  }, [groups]);

  return (
    <div className="panel">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-faint)' }}>
            Industry Groups
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-faint)', fontFamily: 'monospace' }}>
            {sorted.length}/{total}
          </span>
        </div>
      </div>

      {/* Sector filter pills */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
        {['All', ...SECTORS_LIST.filter(s => sectorCounts[s])].map(s => {
          const active = filterSector === s;
          const color = SECTOR_COLORS[s] || '#3b82f6';
          const count = s === 'All' ? total : sectorCounts[s];
          return (
            <button key={s} onClick={() => setFilterSector(s)} style={{
              fontSize: 9, padding: '2px 7px', borderRadius: 20, cursor: 'pointer',
              border: `1px solid ${active ? color : 'var(--border)'}`,
              background: active ? color + '20' : 'transparent',
              color: active ? color : 'var(--text-faint)',
              fontWeight: active ? 700 : 400, whiteSpace: 'nowrap', transition: 'all 0.15s',
            }}>
              {s === 'All' ? 'All Sectors' : SECTOR_SHORT[s] || s}
              <span style={{ marginLeft: 3, opacity: 0.6 }}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 620 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {/* Group col */}
              <th style={{ textAlign: 'left', paddingBottom: 8, paddingLeft: 0, paddingRight: 8, fontSize: 9, color: 'var(--text-faint)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', userSelect: 'none' }}>
                Group
              </th>
              {/* RS */}
              <th style={{ textAlign: 'center', padding: '0 8px 8px', fontSize: 9, color: 'var(--text-faint)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', userSelect: 'none', whiteSpace: 'nowrap' }}>
                RS
              </th>
              {/* Timeframe columns */}
              {TIMEFRAME_COLS.map(col => {
                const active = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => handleColClick(col.key)}
                    style={{
                      textAlign: 'right',
                      padding: '0 8px 8px',
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
              {/* Leaders col (desktop) */}
              <th className="hidden sm:table-cell" style={{ textAlign: 'left', padding: '0 0 8px 8px', fontSize: 9, color: 'var(--text-faint)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Leaders
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(group => {
              return (
                <tr
                  key={group.name}
                  onClick={() => onGroupClick(group)}
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Name + Sector tag */}
                  <td style={{ padding: '9px 8px 9px 0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: 12, whiteSpace: 'nowrap' }}>
                        {group.name}
                      </span>
                      <SectorTag sector={group.sector} />
                    </div>
                  </td>

                  {/* RS */}
                  <td style={{ padding: '9px 8px', textAlign: 'center' }}>
                    <RSBadge rs={group.avgRS} />
                  </td>

                  {/* Timeframe cells */}
                  {TIMEFRAME_COLS.map(col => (
                    <PerfCell key={col.key} val={group[col.key] ?? null} />
                  ))}

                  {/* Leaders (desktop only) */}
                  <td className="hidden sm:table-cell" style={{ padding: '9px 0 9px 8px' }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {group.leaders.slice(0, 4).map(s => (
                        <span key={s.ticker} style={{
                          fontSize: 9, padding: '2px 5px', borderRadius: 3,
                          background: 'var(--bg)', border: '1px solid var(--border)',
                          color: 'var(--text-muted)', fontFamily: 'monospace', fontWeight: 600,
                        }}>
                          {s.ticker}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p style={{ textAlign: 'center', fontSize: 9, color: 'var(--text-faint)', marginTop: 12, fontFamily: 'monospace' }}>
        Click column to sort · 1W/1M/3M/6M/YTD via proxy ETF · click row to see leaders
      </p>
    </div>
  );
}
