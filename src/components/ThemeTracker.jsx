const TIMEFRAMES = [
  { key: 'w1', label: '1W' },
  { key: 'm1', label: '1M' },
  { key: 'ytd', label: 'YTD' },
];

export default function ThemeTracker({ themes, onThemeClick }) {
  // Normalize bar widths against the max absolute value across all themes/timeframes
  const maxAbs = Math.max(
    ...themes.flatMap(t => [Math.abs(t.w1), Math.abs(t.m1), Math.abs(t.ytd)]),
    1
  );

  return (
    <div className="panel h-full">
      {/* Header row with timeframe labels aligned to bar area */}
      <div className="flex items-center mb-3 pb-2 border-b border-[#1e2130]">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-600 flex-1">
          Theme Tracker
        </span>
        <div className="flex gap-1 text-xs font-mono text-gray-600">
          {TIMEFRAMES.map(tf => (
            <span key={tf.key} className="w-16 text-center">{tf.label}</span>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        {themes.map(t => (
          <div key={t.theme} className="flex items-center gap-2 group">
            {/* Theme name */}
            <button
              onClick={() => onThemeClick(t.theme)}
              className="w-36 text-left text-xs text-gray-400 hover:text-blue-400 group-hover:text-blue-400 transition-colors truncate font-medium flex-shrink-0"
            >
              {t.theme}
            </button>

            {/* Bars for each timeframe */}
            <div className="flex gap-1 flex-1">
              {TIMEFRAMES.map(tf => {
                const val = t[tf.key];
                const isPos = val >= 0;
                const barWidth = Math.round((Math.abs(val) / maxAbs) * 100);
                return (
                  <div key={tf.key} className="flex-1 flex flex-col gap-0.5">
                    {/* Bar track */}
                    <div className="h-3 rounded overflow-hidden flex items-center" style={{ background: '#1a1d27' }}>
                      <div
                        className="h-full rounded transition-all duration-500"
                        style={{
                          width: `${barWidth}%`,
                          background: isPos ? '#3b82f6' : '#e879f9',
                          minWidth: barWidth > 0 ? 2 : 0,
                        }}
                      />
                    </div>
                    {/* Value */}
                    <span
                      className="text-xs font-mono text-center leading-none"
                      style={{ color: isPos ? '#60a5fa' : '#e879f9', fontSize: '10px' }}
                    >
                      {isPos ? '+' : ''}{val.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
