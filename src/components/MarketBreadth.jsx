export default function MarketBreadth({ data, onFilterClick }) {
  const nhPct = Math.round((data.newHighs / (data.newHighs + data.newLows)) * 100);

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
        {metrics.map((m) => (
          <div
            key={m.label}
            className="clickable-row group"
            onClick={() => onFilterClick?.(m.filterKey, m.filterLabel)}
            title={`Click to see ${m.filterLabel}`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">{m.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold" style={{ color: m.pct >= 50 ? '#38bdf8' : '#f472b6' }}>
                  {m.pct}%
                </span>
                <span className="text-xs text-slate-600 group-hover:text-blue-500 transition-colors">→</span>
              </div>
            </div>
            <div className="bar-track">
              <div
                className={m.pct >= 50 ? 'bar-fill-pos' : 'bar-fill-neg'}
                style={{ width: `${m.pct}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs font-mono" style={{ color: '#38bdf8', opacity: 0.8 }}>{m.left}</span>
              <span className="text-xs font-mono" style={{ color: '#f472b6', opacity: 0.8 }}>{m.right}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
