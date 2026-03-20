const metrics = (data) => [
  {
    label: 'New Highs vs New Lows',
    pct: Math.round((data.newHighs / (data.newHighs + data.newLows)) * 100),
    leftLabel: `${data.newHighs} Highs`,
    rightLabel: `${data.newLows} Lows`,
  },
  {
    label: 'Advance vs Decline',
    pct: Math.round((data.advancing / (data.advancing + data.declining)) * 100),
    leftLabel: `${data.advancing.toLocaleString()} Advance`,
    rightLabel: `${data.declining.toLocaleString()} Decline`,
  },
  {
    label: 'Up from Open vs Down from Open',
    pct: data.pctUp,
    leftLabel: `${data.upFromOpen.toLocaleString()} Up`,
    rightLabel: `${data.downFromOpen.toLocaleString()} Down`,
  },
  {
    label: 'Up on Volume vs Down on Volume',
    pct: data.pctVolUp,
    leftLabel: `${data.upOnVol.toLocaleString()} Up`,
    rightLabel: `${data.downOnVol.toLocaleString()} Down`,
  },
  {
    label: 'Up 4% vs Down 4%',
    pct: data.pctUp4,
    leftLabel: `${data.up4.toLocaleString()} Up`,
    rightLabel: `${data.down4.toLocaleString()} Down`,
  },
];

export default function MarketBreadth({ data }) {
  const rows = metrics(data);

  return (
    <div className="panel h-full">
      <div className="panel-title">Market Breadth</div>
      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.label}>
            {/* Label + percentage */}
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-xs text-gray-400">{row.label}</span>
              <span className="text-sm font-bold text-pink-400 font-mono">{row.pct}%</span>
            </div>
            {/* Bar */}
            <div className="bar-track">
              <div
                className="bar-fill-pink"
                style={{ width: `${row.pct}%` }}
              />
            </div>
            {/* Counts */}
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500 font-mono">{row.leftLabel}</span>
              <span className="text-xs text-gray-500 font-mono">{row.rightLabel}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
