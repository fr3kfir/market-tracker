import { useState, useMemo } from 'react';

const TIMEFRAMES = [
  { key: 'd1',  label: 'Today' },
  { key: 'w1',  label: '1W'   },
  { key: 'm1',  label: '1M'   },
  { key: 'm3',  label: '3M'   },
  { key: 'ytd', label: 'YTD'  },
];

const POS_COLOR = '#3b82f6';
const NEG_COLOR = '#ec4899';

function StockBar({ ticker, val, maxAbs }) {
  const isPos = val >= 0;
  const barW = maxAbs > 0 ? Math.round((Math.abs(val) / maxAbs) * 100) : 0;
  const barColor = isPos ? POS_COLOR : NEG_COLOR;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '1.5px 0' }}>
      <span style={{
        fontSize: 10, fontFamily: 'monospace', fontWeight: 700,
        color: 'var(--text)', width: 48, flexShrink: 0,
      }}>{ticker}</span>
      <div style={{ flex: 1, height: 4, background: 'var(--bg)', borderRadius: 99, overflow: 'hidden', minWidth: 20 }}>
        <div style={{
          height: '100%', width: `${barW}%`,
          background: barColor, borderRadius: 99,
          transition: 'width 0.35s ease',
        }} />
      </div>
      <span style={{
        fontSize: 10, fontFamily: 'monospace', fontWeight: 700,
        color: barColor, width: 48, textAlign: 'right', flexShrink: 0,
      }}>
        {isPos ? '+' : ''}{val.toFixed(2)}%
      </span>
    </div>
  );
}

function ThemeCard({ theme, stocks, themeAgg, selectedTf, onThemeClick }) {
  const sortedStocks = useMemo(() =>
    [...stocks].sort((a, b) => b.change - a.change),
  [stocks]);

  const maxAbs = Math.max(...sortedStocks.map(s => Math.abs(s.change)), 0.1);
  const aggVal = themeAgg?.[selectedTf] ?? 0;
  const isToday = selectedTf === 'd1';

  return (
    <div
      className="panel"
      style={{ cursor: 'pointer', padding: 10 }}
      onClick={() => onThemeClick(theme.name)}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.04)'}
      onMouseLeave={e => e.currentTarget.style.background = ''}
    >
      {/* Card header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 5, paddingBottom: 5,
        borderBottom: '1px solid var(--border)',
      }}>
        <span style={{
          fontSize: 11, fontWeight: 700, color: 'var(--text)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '72%',
        }}>{theme.name}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          {!isToday && (
            <span style={{
              fontSize: 10, fontFamily: 'monospace', fontWeight: 700,
              color: aggVal >= 0 ? POS_COLOR : NEG_COLOR,
            }}>
              {aggVal >= 0 ? '+' : ''}{aggVal.toFixed(1)}%
            </span>
          )}
          <span style={{ fontSize: 9, color: 'var(--text-faint)', fontFamily: 'monospace' }}>
            {sortedStocks.length}
          </span>
        </div>
      </div>

      {/* Stock bars */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {sortedStocks.map(s => (
          <StockBar key={s.ticker} ticker={s.ticker} val={s.change} maxAbs={maxAbs} />
        ))}
      </div>
    </div>
  );
}

export default function ThemeDashboard({ hotThemes, hotThemeData, stocksByTicker, onThemeClick }) {
  const [selectedTf, setSelectedTf] = useState('d1');

  const aggMap = useMemo(() => {
    const m = {};
    (hotThemeData || []).forEach(t => { m[t.theme] = t; });
    return m;
  }, [hotThemeData]);

  // Sort themes by the selected timeframe's aggregate ETF performance
  const sortedThemes = useMemo(() =>
    [...(hotThemes || [])].sort((a, b) => {
      const av = aggMap[a.name]?.[selectedTf] ?? -Infinity;
      const bv = aggMap[b.name]?.[selectedTf] ?? -Infinity;
      return bv - av;
    }),
  [hotThemes, selectedTf, aggMap]);

  const themeStocks = useMemo(() => {
    const m = {};
    (hotThemes || []).forEach(theme => {
      m[theme.name] = (theme.tickers || [])
        .map(t => stocksByTicker?.[t])
        .filter(Boolean);
    });
    return m;
  }, [hotThemes, stocksByTicker]);

  return (
    <div>
      {/* Timeframe selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
        <span style={{ fontSize: 9, color: 'var(--text-faint)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginRight: 2 }}>
          SORT:
        </span>
        {TIMEFRAMES.map(tf => (
          <button
            key={tf.key}
            onClick={() => setSelectedTf(tf.key)}
            style={{
              fontSize: 9, padding: '2px 8px', borderRadius: 20, cursor: 'pointer',
              border: `1px solid ${selectedTf === tf.key ? POS_COLOR : 'var(--border)'}`,
              background: selectedTf === tf.key ? POS_COLOR + '22' : 'transparent',
              color: selectedTf === tf.key ? POS_COLOR : 'var(--text-faint)',
              fontWeight: selectedTf === tf.key ? 700 : 400,
              transition: 'all 0.15s',
            }}
          >
            {tf.label}
          </button>
        ))}
        <span style={{ marginLeft: 6, fontSize: 9, color: 'var(--text-faint)', fontFamily: 'monospace' }}>
          · click any card to drill in
        </span>
      </div>

      {/* Theme card masonry — CSS columns pack cards tightly with no vertical gaps */}
      <div style={{ columns: '260px', columnGap: 6 }}>
        {sortedThemes.map(theme => (
          <div key={theme.name} style={{ breakInside: 'avoid', marginBottom: 6, display: 'inline-block', width: '100%' }}>
            <ThemeCard
              theme={theme}
              stocks={themeStocks[theme.name] || []}
              themeAgg={aggMap[theme.name]}
              selectedTf={selectedTf}
              onThemeClick={onThemeClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
