import { useState, useMemo } from 'react';

const POS_COLOR = '#3b82f6';
const NEG_COLOR = '#ec4899';

const TIMEFRAME_LABELS = {
  d1:  'Today',
  w1:  '1 Week',
  m1:  '1 Month',
  m3:  '3 Months',
  ytd: 'YTD',
};

function ThemePanel({ theme, stocksByTicker, sortTf, onStockClick }) {
  const stocks = useMemo(() => {
    const base = theme.tickers
      .map(t => stocksByTicker[t])
      .filter(Boolean);

    let getValue;
    if (sortTf === 'd1') {
      getValue = s => s.change ?? 0;
    } else {
      getValue = s => s[sortTf] ?? null;
    }

    return base
      .filter(s => getValue(s) !== null)
      .sort((a, b) => getValue(b) - getValue(a));
  }, [theme.tickers, stocksByTicker, sortTf]);

  if (stocks.length === 0) return null;

  const getValue = sortTf === 'd1' ? s => s.change ?? 0 : s => s[sortTf] ?? 0;
  const maxAbs = Math.max(...stocks.map(s => Math.abs(getValue(s))), 0.01);

  return (
    <div style={{
      background: 'var(--bg-panel)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '10px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
    }}>
      {/* Panel header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--text)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '70%',
        }}>
          {theme.name}
        </span>
        <span style={{
          fontSize: 9,
          color: 'var(--text-faint)',
          fontFamily: 'monospace',
          fontWeight: 600,
          flexShrink: 0,
        }}>
          {TIMEFRAME_LABELS[sortTf]}
        </span>
      </div>

      {/* Stock rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {stocks.map(stock => {
          const val = getValue(stock);
          const isPos = val >= 0;
          const barW = maxAbs > 0 ? Math.min(100, Math.round((Math.abs(val) / maxAbs) * 100)) : 0;
          const barColor = isPos ? POS_COLOR : NEG_COLOR;

          return (
            <div
              key={stock.ticker}
              onClick={() => onStockClick?.(stock)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 4px',
                borderRadius: 4,
                cursor: 'pointer',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{
                fontFamily: 'monospace',
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--text)',
                width: 44,
                flexShrink: 0,
                letterSpacing: '-0.02em',
              }}>
                {stock.ticker}
              </span>

              <div style={{
                flex: 1,
                height: 12,
                background: 'var(--bg)',
                borderRadius: 2,
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${barW}%`,
                  background: barColor,
                  opacity: 0.82,
                  borderRadius: 2,
                  transition: 'width 0.35s ease',
                }} />
              </div>

              <span style={{
                width: 50,
                textAlign: 'right',
                fontSize: 10,
                fontFamily: 'monospace',
                fontWeight: 700,
                color: barColor,
                flexShrink: 0,
              }}>
                {isPos ? '+' : ''}{val.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{
        fontSize: 9,
        color: 'var(--text-faint)',
        fontFamily: 'monospace',
        marginTop: 6,
        borderTop: '1px solid var(--border)',
        paddingTop: 5,
      }}>
        {stocks.length} results
      </div>
    </div>
  );
}

const TIMEFRAMES = [
  { key: 'd1',  label: 'Today' },
  { key: 'w1',  label: '1W' },
  { key: 'm1',  label: '1M' },
  { key: 'm3',  label: '3M' },
  { key: 'ytd', label: 'YTD' },
];

export default function ThemeGrid({ themes, stocksByTicker, onStockClick }) {
  const [sortTf, setSortTf] = useState('d1');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return themes;
    const q = search.toLowerCase();
    return themes.filter(t => t.name.toLowerCase().includes(q));
  }, [themes, search]);

  return (
    <div>
      {/* Controls bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 14,
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 9, color: 'var(--text-faint)', fontFamily: 'monospace', fontWeight: 600 }}>SORT BY:</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {TIMEFRAMES.map(tf => (
            <button
              key={tf.key}
              onClick={() => setSortTf(tf.key)}
              style={{
                fontSize: 10,
                padding: '3px 9px',
                borderRadius: 20,
                border: `1px solid ${sortTf === tf.key ? POS_COLOR : 'var(--border)'}`,
                background: sortTf === tf.key ? POS_COLOR + '22' : 'transparent',
                color: sortTf === tf.key ? POS_COLOR : 'var(--text-faint)',
                cursor: 'pointer',
                fontWeight: sortTf === tf.key ? 700 : 400,
                transition: 'all 0.15s',
              }}
            >
              {tf.label}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter themes…"
          style={{
            marginLeft: 'auto',
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 11,
            color: 'var(--text)',
            outline: 'none',
            width: 160,
          }}
        />
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 10,
        alignItems: 'start',
      }}>
        {filtered.map(theme => (
          <ThemePanel
            key={theme.name}
            theme={theme}
            stocksByTicker={stocksByTicker}
            sortTf={sortTf}
            onStockClick={onStockClick}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: 12, padding: '40px 0' }}>
          No themes match "{search}"
        </div>
      )}
    </div>
  );
}
