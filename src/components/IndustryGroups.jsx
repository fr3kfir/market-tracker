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

function RankBadge({ rank, total }) {
  const pct = rank / total;
  const color =
    pct <= 0.15 ? '#22c55e' :
    pct <= 0.35 ? '#86efac' :
    pct <= 0.65 ? '#94a3b8' :
    pct <= 0.85 ? '#fb923c' : '#f87171';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 26, height: 20, borderRadius: 4, padding: '0 4px',
      background: color + '18', border: `1px solid ${color}44`,
      color, fontSize: 10, fontWeight: 700, fontFamily: 'monospace', flexShrink: 0,
    }}>
      {rank}
    </span>
  );
}

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

const SORT_OPTIONS = [
  { key: 'rank',   label: 'RS Rank' },
  { key: 'change', label: 'Today' },
];

const SECTORS_LIST = Object.keys(SECTOR_COLORS);

export default function IndustryGroups({ groups, onGroupClick }) {
  const [sortKey, setSortKey]         = useState('rank');
  const [filterSector, setFilterSector] = useState('All');

  const total = groups.length;

  const sorted = useMemo(() => {
    let list = [...groups];
    if (filterSector !== 'All') list = list.filter(g => g.sector === filterSector);
    if (sortKey === 'change') list.sort((a, b) => b.change - a.change);
    // 'rank' keeps the RS-ranked order from the data
    return list;
  }, [groups, sortKey, filterSector]);

  // Count by sector for the filter pills
  const sectorCounts = useMemo(() => {
    const counts = {};
    groups.forEach(g => { counts[g.sector] = (counts[g.sector] || 0) + 1; });
    return counts;
  }, [groups]);

  return (
    <div className="panel">
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-faint)' }}>
            Industry Groups
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-faint)', fontFamily: 'monospace' }}>
            {sorted.length}/{total}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <span style={{ fontSize: 9, color: 'var(--text-faint)', marginRight: 2 }}>SORT:</span>
          {SORT_OPTIONS.map(opt => (
            <button key={opt.key} onClick={() => setSortKey(opt.key)} style={{
              fontSize: 9, padding: '2px 8px', borderRadius: 20, cursor: 'pointer',
              border: `1px solid ${sortKey === opt.key ? '#3b82f6' : 'var(--border)'}`,
              background: sortKey === opt.key ? '#3b82f620' : 'transparent',
              color: sortKey === opt.key ? '#3b82f6' : 'var(--text-faint)',
              fontWeight: sortKey === opt.key ? 700 : 400, transition: 'all 0.15s',
            }}>{opt.label}</button>
          ))}
        </div>
      </div>

      {/* ── Sector filter pills ── */}
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

      {/* ── Table ── */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {[
                { label: '#',       w: 32,  align: 'left'   },
                { label: 'Group',   w: null, align: 'left'  },
                { label: 'RS',      w: 44,  align: 'center' },
                { label: 'Today',   w: 60,  align: 'right'  },
                { label: 'Leaders', w: null, align: 'left', cls: 'hidden sm:table-cell' },
              ].map(col => (
                <th key={col.label} className={col.cls || ''} style={{
                  textAlign: col.align, paddingBottom: 8, paddingLeft: 6, paddingRight: 6,
                  fontSize: 9, color: 'var(--text-faint)', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  width: col.w || undefined,
                }}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((group) => {
              const changeColor = group.change > 0 ? '#22c55e' : group.change < 0 ? '#f87171' : 'var(--text-muted)';
              return (
                <tr
                  key={group.name}
                  onClick={() => onGroupClick(group)}
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Rank */}
                  <td style={{ padding: '9px 6px' }}>
                    <RankBadge rank={group.rank} total={total} />
                  </td>

                  {/* Name + Sector tag */}
                  <td style={{ padding: '9px 6px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: 12, whiteSpace: 'nowrap' }}>
                        {group.name}
                      </span>
                      <SectorTag sector={group.sector} />
                    </div>
                  </td>

                  {/* RS avg */}
                  <td style={{ padding: '9px 6px', textAlign: 'center' }}>
                    <RSBadge rs={group.avgRS} />
                  </td>

                  {/* Today % */}
                  <td style={{ padding: '9px 6px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: changeColor, fontSize: 12, whiteSpace: 'nowrap' }}>
                    {group.change > 0 ? '+' : ''}{group.change.toFixed(1)}%
                  </td>

                  {/* Top tickers (desktop only) */}
                  <td className="hidden sm:table-cell" style={{ padding: '9px 6px' }}>
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
        Ranked by avg RS rating · click any group to see leaders
      </p>
    </div>
  );
}
