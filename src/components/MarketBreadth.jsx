export default function MarketBreadth({ data, onFilterClick }) {
  const nhTotal = (data.newHighs || 0) + (data.newLows || 0);
  const nhPct = nhTotal > 0 ? Math.round((data.newHighs / nhTotal) * 100) : 50;

  const metrics = [
    {
      label: 'New Highs vs New Lows',
      pct: nhPct,
      left: `${data.newHighs} Highs`, right: `${data.newLows} Lows`,
      filterKey: 'newHighs', filterLabel: 'Near 52-Week Highs',
    },
    {
      label: 'Advance vs Decline',
      pct: Math.round((data.advancing / (data.advancing + data.declining)) * 100),
      left: `${data.advancing.toLocaleString()} Advance`, right: `${data.declining.toLocaleString()} Decline`,
      filterKey: 'advancing', filterLabel: 'Advancing Stocks',
    },
    {
      label: 'Up from Open vs Down',
      pct: data.pctVolUp,
      left: `${data.upFromOpen.toLocaleString()} Up`, right: `${data.downFromOpen.toLocaleString()} Down`,
      filterKey: 'upFromOpen', filterLabel: 'Up from Open',
    },
    {
      label: 'Up on Volume vs Down',
      pct: data.pctVolUp,
      left: `${data.upOnVol.toLocaleString()} Up`, right: `${data.downOnVol.toLocaleString()} Down`,
      filterKey: 'upOnVol', filterLabel: 'Up on Volume',
    },
    {
      label: 'Strong Movers (+4%) vs Weak (-4%)',
      pct: data.pctUp4,
      left: `${data.up4} Up 4%+`, right: `${data.down4} Down 4%+`,
      filterKey: 'up4', filterLabel: 'Stocks Up 4%+',
    },
  ];

  return (
    <div className="panel h-full">
      <div className="panel-title">Market Breadth</div>
      <div className="space-y-3">
        {metrics.map((m, idx) => (
          <div
            key={m.label}
            className="clickable-row group"
            onClick={() => onFilterClick?.(m.filterKey, m.filterLabel)}
            title={`Click to see ${m.filterLabel}`}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  fontSize: '11px', fontFamily: 'monospace', fontWeight: 700,
                  padding: '1px 7px', borderRadius: '20px',
                  background: m.pct >= 50 ? 'rgba(59,130,246,0.15)' : 'rgba(244,114,182,0.15)',
                  color: m.pct >= 50 ? '#38bdf8' : '#f472b6',
                }}>{m.pct}%</span>
                <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>→</span>
              </div>
            </div>
            <div style={{ height: '7px', background: 'var(--bg)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${m.pct}%`, borderRadius: '99px',
                background: m.pct >= 50 ? 'linear-gradient(90deg,#1d6fe8,#38bdf8)' : 'linear-gradient(90deg,#be185d,#f472b6)',
                transition: 'width 0.6s ease',
                boxShadow: m.pct >= 50 ? '0 0 8px rgba(56,189,248,0.3)' : '0 0 8px rgba(244,114,182,0.3)',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#3b82f6', opacity: 0.9 }}>{m.left}</span>
              <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#f472b6', opacity: 0.9 }}>{m.right}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
