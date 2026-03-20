const TIMEFRAMES = [
  { key: 'w1', label: '1W', color: '#38bdf8' },
  { key: 'm1', label: '1M', color: '#818cf8' },
  { key: 'ytd', label: 'YTD', color: '#a78bfa' },
];

export default function ThemeTracker({ themes, onThemeClick }) {
  const maxAbs = Math.max(...themes.flatMap(t => [Math.abs(t.w1), Math.abs(t.m1), Math.abs(t.ytd)]), 1);

  return (
    <div className="panel h-full">
      <div className="panel-title flex items-center justify-between">
        <span>Theme Performance</span>
        <div className="flex gap-3 normal-case tracking-normal font-normal text-xs" style={{ letterSpacing: 'normal' }}>
          {TIMEFRAMES.map(tf => (
            <span key={tf.key} className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-sm" style={{ background: tf.color }} />
              <span className="text-slate-500">{tf.label}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {themes.map(t => {
          const best = Math.max(t.w1, t.m1, t.ytd);
          const worst = Math.min(t.w1, t.m1, t.ytd);
          return (
            <div key={t.theme} className="group">
              {/* Theme name + best/worst */}
              <div className="flex items-center justify-between mb-1.5">
                <button
                  onClick={() => onThemeClick(t.theme)}
                  className="text-xs font-semibold text-slate-300 hover:text-white group-hover:text-sky-400 transition-colors text-left"
                >
                  {t.theme}
                </button>
                <span className="text-xs font-mono" style={{ color: best >= 0 ? '#38bdf8' : '#f472b6' }}>
                  {best >= 0 ? '+' : ''}{best.toFixed(1)}%
                </span>
              </div>

              {/* 3 bars stacked */}
              <div className="space-y-1">
                {TIMEFRAMES.map(tf => {
                  const val = t[tf.key];
                  const isPos = val >= 0;
                  const w = Math.round((Math.abs(val) / maxAbs) * 100);
                  return (
                    <div key={tf.key} className="flex items-center gap-2">
                      <span className="text-xs font-mono w-6 text-right" style={{ color: '#3a4a60', fontSize: '10px' }}>
                        {tf.label}
                      </span>
                      {/* Neg side */}
                      <div className="w-20 flex justify-end">
                        {!isPos && (
                          <div
                            style={{ width: `${w}%`, background: 'linear-gradient(90deg, #be185d, #f472b6)' }}
                            className="h-2 rounded-l-full"
                          />
                        )}
                      </div>
                      {/* Center */}
                      <div className="w-px h-3" style={{ background: '#1a2540' }} />
                      {/* Pos side */}
                      <div className="w-20">
                        {isPos && (
                          <div
                            style={{ width: `${w}%`, background: `linear-gradient(90deg, ${tf.color}, ${tf.color}99)` }}
                            className="h-2 rounded-r-full"
                          />
                        )}
                      </div>
                      <span
                        className="text-xs font-mono w-10"
                        style={{ color: isPos ? tf.color : '#f472b6', fontSize: '10px' }}
                      >
                        {isPos ? '+' : ''}{val.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
