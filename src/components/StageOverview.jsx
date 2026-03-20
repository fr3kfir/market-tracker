import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const STAGE_COLORS = { S1: '#4a6080', S2: '#3b82f6', S3: '#f59e0b', S4: '#e879f9' };

const STAGE_LABELS = { S1: 'Stage 1', S2: 'Stage 2', S3: 'Stage 3', S4: 'Stage 4' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded p-2 text-xs font-mono shadow-lg" style={{ background: '#0c1220', border: '1px solid #1a2540' }}>
      <div className="text-gray-400 mb-1">{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: STAGE_COLORS[p.name] }}>
          {STAGE_LABELS[p.name]}: {p.value}%
        </div>
      ))}
    </div>
  );
};

export default function StageOverview({ distribution, history, totalStocks = 5600 }) {
  const counts = {
    S1: Math.round(totalStocks * distribution.S1 / 100),
    S2: Math.round(totalStocks * distribution.S2 / 100),
    S3: Math.round(totalStocks * distribution.S3 / 100),
    S4: Math.round(totalStocks * distribution.S4 / 100),
  };

  return (
    <div className="panel h-full">
      <div className="panel-title">Stage Analysis</div>

      {/* Market Overview header */}
      <div className="text-xs text-gray-500 mb-2">Market Overview</div>

      {/* Segmented bar */}
      <div className="h-2.5 flex rounded-full overflow-hidden mb-3">
        {Object.entries(distribution).map(([stage, pct]) => (
          <div
            key={stage}
            style={{ width: `${pct}%`, backgroundColor: STAGE_COLORS[stage] }}
            className="transition-all duration-700"
          />
        ))}
      </div>

      {/* Stage stats grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {Object.entries(distribution).map(([stage, pct]) => (
          <div key={stage} className="text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: STAGE_COLORS[stage] }}
              />
              <span className="text-xs text-gray-400">{STAGE_LABELS[stage]}</span>
            </div>
            <div className="font-mono text-xs text-gray-300">
              {counts[stage].toLocaleString()} · <span style={{ color: STAGE_COLORS[stage] }}>{pct}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Mini legend */}
      <div className="flex gap-3 text-xs mb-2">
        {Object.entries(STAGE_COLORS).map(([s, c]) => (
          <span key={s} className="flex items-center gap-1 text-gray-500">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: c }} />
            {s}
          </span>
        ))}
      </div>

      {/* Line chart */}
      <ResponsiveContainer width="100%" height={110}>
        <LineChart data={history} margin={{ top: 2, right: 4, left: -28, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: '#3a4a60' }}
            tickLine={false}
            axisLine={false}
            interval={4}
          />
          <YAxis
            tick={{ fontSize: 9, fill: '#3a4a60' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          {Object.keys(STAGE_COLORS).map(stage => (
            <Line
              key={stage}
              type="monotone"
              dataKey={stage}
              stroke={STAGE_COLORS[stage]}
              dot={false}
              strokeWidth={1.5}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
