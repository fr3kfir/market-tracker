import { useState, useMemo, useCallback } from 'react';
import { SECTOR_STOCKS, INDUSTRY_GROUPS } from '../data/stockUniverse';
import { enrichWithHistory } from '../services/marketData';

const RS_COLOR = (rs) => {
  if (rs >= 80) return '#10b981';
  if (rs >= 60) return '#3b82f6';
  if (rs >= 40) return '#f59e0b';
  return '#e879f9';
};

const STAGE_COLORS = { S1: '#94a3b8', S2: '#60a5fa', S3: '#f59e0b', S4: '#f472b6' };

const TIMEFRAMES = [
  { key: 'change', label: 'Today' },
  { key: 'w1',    label: '1W' },
  { key: 'm1',    label: '1M' },
  { key: 'm3',    label: '3M' },
  { key: 'ytd',   label: 'YTD' },
];

function PerfBadge({ value, highlight }) {
  if (value == null) return <span style={{ color: 'var(--text-faint)', fontFamily: 'monospace', fontSize: 11 }}>—</span>;
  const color = value >= 0 ? '#34d399' : '#f87171';
  const bg = value >= 0 ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)';
  return (
    <span style={{
      fontFamily: 'monospace', fontWeight: 700, fontSize: 11, color,
      background: highlight ? bg : 'transparent',
      padding: highlight ? '2px 6px' : '0',
      borderRadius: highlight ? 20 : 0,
    }}>
      {value >= 0 ? '+' : ''}{value.toFixed(2)}%
    </span>
  );
}

function StockRow({ stock, highlight, activeTf }) {
  return (
    <tr style={{
      background: highlight ? 'rgba(59,130,246,0.1)' : 'transparent',
      borderBottom: '1px solid var(--border)',
    }}>
      <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: highlight ? '#60a5fa' : 'var(--text)', whiteSpace: 'nowrap' }}>
        {highlight && <span style={{ marginRight: 4 }}>★</span>}{stock.ticker}
      </td>
      <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>
        {stock.price != null ? `$${stock.price.toFixed(2)}` : '—'}
      </td>
      {TIMEFRAMES.map(tf => (
        <td key={tf.key} style={{ padding: '7px 10px', textAlign: 'right' }}>
          <PerfBadge value={stock[tf.key]} highlight={tf.key === activeTf} />
        </td>
      ))}
      <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: 11, color: stock.rs != null ? RS_COLOR(stock.rs) : 'var(--text-faint)', textAlign: 'right', fontWeight: 700 }}>
        {stock.rs != null ? stock.rs : '—'}
      </td>
      <td style={{ padding: '7px 10px', textAlign: 'center' }}>
        {stock.stage && (
          <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: STAGE_COLORS[stock.stage] || 'var(--text-faint)' }}>
            {stock.stage}
          </span>
        )}
      </td>
    </tr>
  );
}

function GroupTable({ group, searchTicker, stocksMap, historyLoading, activeTf }) {
  const stocks = group.tickers
    .map(t => stocksMap[t] || { ticker: t })
    .sort((a, b) => (b[activeTf] ?? -999) - (a[activeTf] ?? -999));

  const advancing = stocks.filter(s => (s.change ?? 0) > 0).length;
  const declining = stocks.filter(s => (s.change ?? 0) < 0).length;
  const avgChange = stocks.filter(s => s.change != null).reduce((sum, s) => sum + s.change, 0) / (stocks.filter(s => s.change != null).length || 1);

  return (
    <div style={{
      background: 'var(--bg-panel)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      overflow: 'hidden',
      marginBottom: 16,
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
      }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{group.name}</span>
          <span style={{ marginLeft: 8, fontSize: 10, fontFamily: 'monospace', background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '2px 7px', borderRadius: 20 }}>
            {group.sector}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, fontFamily: 'monospace', alignItems: 'center' }}>
          <span style={{ color: '#34d399' }}>▲ {advancing}</span>
          <span style={{ color: '#f87171' }}>▼ {declining}</span>
          <span style={{ color: avgChange >= 0 ? '#34d399' : '#f87171', fontWeight: 700 }}>
            avg {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)}%
          </span>
          {historyLoading && (
            <span style={{ color: 'var(--text-faint)', fontSize: 10 }}>· loading history…</span>
          )}
        </div>
      </div>
      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 580 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Ticker', 'Price', ...TIMEFRAMES.map(t => t.label), 'RS', 'Stage'].map((h, i) => (
                <th key={h} style={{
                  padding: '5px 10px', fontSize: 10, fontWeight: 600,
                  color: TIMEFRAMES.find(t => t.label === h)?.key === activeTf ? '#3b82f6' : 'var(--text-faint)',
                  fontFamily: 'monospace',
                  textAlign: i <= 1 ? 'left' : 'right',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  ...(h === 'Stage' ? { textAlign: 'center' } : {}),
                  ...(h === 'Ticker' ? {} : {}),
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stocks.map(stock => (
              <StockRow
                key={stock.ticker}
                stock={stock}
                highlight={stock.ticker === searchTicker}
                activeTf={activeTf}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Build lookup: ticker → { sectors: [], groups: [] }
function buildLookup() {
  const map = {};
  Object.entries(SECTOR_STOCKS).forEach(([sector, tickers]) => {
    tickers.forEach(t => {
      if (!map[t]) map[t] = { sectors: [], groups: [] };
      if (!map[t].sectors.includes(sector)) map[t].sectors.push(sector);
    });
  });
  INDUSTRY_GROUPS.forEach(group => {
    group.tickers.forEach(t => {
      if (!map[t]) map[t] = { sectors: [], groups: [] };
      map[t].groups.push(group.name);
    });
  });
  return map;
}

const TICKER_LOOKUP = buildLookup();

export default function StockSearch({ stocksByTicker }) {
  const [input, setInput] = useState('');
  const [searched, setSearched] = useState('');
  const [activeTf, setActiveTf] = useState('change');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [enrichedMap, setEnrichedMap] = useState({});
  const [unknownStock, setUnknownStock] = useState(null); // for tickers not in universe
  const [unknownLoading, setUnknownLoading] = useState(false);
  const [unknownNotFound, setUnknownNotFound] = useState(false);

  const ticker = searched.toUpperCase().trim();

  const info = useMemo(() => ticker ? TICKER_LOOKUP[ticker] : null, [ticker]);
  const matchedGroups = useMemo(() => {
    if (!info) return [];
    return INDUSTRY_GROUPS.filter(g => info.groups.includes(g.name));
  }, [info]);

  // Merged map: enriched takes priority over base
  const stocksMap = useMemo(() => ({ ...stocksByTicker, ...enrichedMap }), [stocksByTicker, enrichedMap]);

  const loadHistory = useCallback(async (groups) => {
    const allTickers = [...new Set(groups.flatMap(g => g.tickers))];
    const baseStocks = allTickers.map(t => stocksByTicker[t] || { ticker: t }).filter(s => s.price);
    if (!baseStocks.length) return;
    setHistoryLoading(true);
    try {
      const enriched = await enrichWithHistory(baseStocks);
      const newMap = {};
      enriched.forEach(s => { newMap[s.ticker] = s; });
      setEnrichedMap(newMap);
    } finally {
      setHistoryLoading(false);
    }
  }, [stocksByTicker]);

  const loadUnknownStock = useCallback(async (t) => {
    setUnknownLoading(true);
    setUnknownStock(null);
    setUnknownNotFound(false);
    try {
      const r = await fetch(`/api/quotes?symbols=${encodeURIComponent(t)}`);
      const d = await r.json();
      const result = d?.quoteResponse?.result?.[0];
      if (!result || !result.regularMarketPrice) { setUnknownNotFound(true); return; }
      // Build a minimal stock object
      const price = result.regularMarketPrice;
      const sma50 = result.fiftyDayAverage;
      const sma200 = result.twoHundredDayAverage;
      const high52 = result.fiftyTwoWeekHigh;
      const low52 = result.fiftyTwoWeekLow;
      const distSma52wHigh = high52 ? Math.round(((price - high52) / high52) * 1000) / 10 : undefined;
      const stock = {
        ticker: result.symbol,
        name: result.shortName || result.symbol,
        price: Math.round(price * 100) / 100,
        change: Math.round((result.regularMarketChangePercent || 0) * 100) / 100,
        high52, low52, distSma52wHigh,
        sma50, sma200,
      };
      // Also fetch history for w1/m1/m3/ytd
      try {
        const enriched = await enrichWithHistory([stock]);
        setUnknownStock(enriched[0] || stock);
      } catch {
        setUnknownStock(stock);
      }
    } catch {
      setUnknownNotFound(true);
    } finally {
      setUnknownLoading(false);
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const t = input.toUpperCase().trim();
    if (!t) return;
    setSearched(t);
    setEnrichedMap({});
    setActiveTf('change');
    setUnknownStock(null);
    setUnknownNotFound(false);

    const inf = TICKER_LOOKUP[t];
    if (!inf) {
      // Not in universe — try fetching directly from Yahoo Finance
      if (!stocksByTicker[t]) loadUnknownStock(t);
      return;
    }
    const groups = INDUSTRY_GROUPS.filter(g => inf.groups.includes(g.name));
    if (groups.length) loadHistory(groups);
  };

  const stockData = stocksMap[ticker] || (unknownStock?.ticker === ticker ? unknownStock : null);
  const notFound = ticker && !info && !unknownLoading && unknownNotFound;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Search bar */}
      <form onSubmit={handleSearch} style={{ marginBottom: 24 }}>
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center',
          background: 'var(--bg-panel)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '10px 14px',
        }}>
          <span style={{ fontSize: 16 }}>🔍</span>
          <input
            value={input}
            onChange={e => setInput(e.target.value.toUpperCase())}
            placeholder="Enter ticker symbol (e.g. NVDA, AAPL, CRWD)..."
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text)', fontFamily: 'monospace', fontSize: 14, fontWeight: 600,
            }}
            autoFocus autoComplete="off" spellCheck={false}
          />
          <button type="submit" style={{
            background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8,
            padding: '6px 16px', fontWeight: 700, fontSize: 12, cursor: 'pointer',
          }}>
            Search
          </button>
        </div>
      </form>

      {/* Empty state */}
      {!ticker && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-faint)', fontFamily: 'monospace', fontSize: 13 }}>
          Search for any stock to see its sector, industry group, and peer performance
        </div>
      )}

      {/* Loading unknown stock */}
      {ticker && !info && unknownLoading && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-faint)', fontFamily: 'monospace', fontSize: 13 }}>
          Loading {ticker}…
        </div>
      )}

      {/* Not found */}
      {notFound && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#f87171', fontFamily: 'monospace', fontSize: 13 }}>
          ⚠ "{ticker}" not found — check the ticker symbol
        </div>
      )}

      {/* Unknown stock (not in universe but fetched from Yahoo) */}
      {ticker && !info && !unknownLoading && unknownStock && (
        <div>
          <div style={{
            background: 'var(--bg-panel)', border: '2px solid #3b82f6',
            borderRadius: 12, padding: '14px 18px', marginBottom: 20,
            display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center',
          }}>
            <div>
              <span style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 800, color: '#60a5fa' }}>{unknownStock.ticker}</span>
              <span style={{ marginLeft: 12, fontFamily: 'monospace', fontSize: 16, color: 'var(--text)' }}>${unknownStock.price?.toFixed(2)}</span>
              {unknownStock.name && unknownStock.name !== unknownStock.ticker && (
                <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--text-muted)' }}>{unknownStock.name}</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {TIMEFRAMES.map(tf => (
                <div key={tf.key} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-faint)', fontFamily: 'monospace', marginBottom: 2 }}>{tf.label}</div>
                  <PerfBadge value={unknownStock[tf.key]} highlight />
                </div>
              ))}
            </div>
          </div>
          <div style={{ color: 'var(--text-faint)', fontFamily: 'monospace', fontSize: 12, textAlign: 'center' }}>
            No industry group data for this ticker
          </div>
        </div>
      )}

      {/* Results */}
      {info && (
        <>
          {/* Stock card */}
          <div style={{
            background: 'var(--bg-panel)', border: '2px solid #3b82f6',
            borderRadius: 12, padding: '14px 18px', marginBottom: 20,
            display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center',
          }}>
            <div>
              <span style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 800, color: '#60a5fa' }}>{ticker}</span>
              {stockData?.price != null && (
                <span style={{ marginLeft: 12, fontFamily: 'monospace', fontSize: 16, color: 'var(--text)' }}>
                  ${stockData.price.toFixed(2)}
                </span>
              )}
              {stockData?.name && stockData.name !== ticker && (
                <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--text-muted)' }}>{stockData.name}</span>
              )}
            </div>

            {/* Timeframe performance pills */}
            {stockData && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {TIMEFRAMES.map(tf => (
                  <div key={tf.key} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-faint)', fontFamily: 'monospace', marginBottom: 2 }}>{tf.label}</div>
                    {tf.key !== 'change' && historyLoading && stockData[tf.key] == null
                      ? <span style={{ color: 'var(--text-faint)', fontFamily: 'monospace', fontSize: 11 }}>…</span>
                      : <PerfBadge value={stockData[tf.key]} highlight />
                    }
                  </div>
                ))}
                {stockData.rs != null && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-faint)', fontFamily: 'monospace', marginBottom: 2 }}>RS</div>
                    <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: RS_COLOR(stockData.rs) }}>{stockData.rs}</span>
                  </div>
                )}
                {stockData.stage && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-faint)', fontFamily: 'monospace', marginBottom: 2 }}>STAGE</div>
                    <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: STAGE_COLORS[stockData.stage] }}>{stockData.stage}</span>
                  </div>
                )}
              </div>
            )}

            {/* Sectors */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginLeft: 'auto' }}>
              {info.sectors.map(s => (
                <span key={s} style={{
                  fontSize: 11, fontFamily: 'monospace',
                  background: 'rgba(59,130,246,0.15)', color: '#93c5fd',
                  padding: '3px 10px', borderRadius: 20, fontWeight: 600,
                }}>📂 {s}</span>
              ))}
            </div>
          </div>

          {/* Timeframe toggle */}
          {matchedGroups.length > 0 && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'monospace', marginRight: 4 }}>Sort by:</span>
              {TIMEFRAMES.map(tf => {
                const needsHistory = tf.key !== 'change';
                const disabled = needsHistory && historyLoading;
                return (
                  <button
                    key={tf.key}
                    disabled={disabled}
                    onClick={() => setActiveTf(tf.key)}
                    style={{
                      padding: '4px 12px', fontSize: 11, fontFamily: 'monospace', fontWeight: 600,
                      borderRadius: 20, border: '1px solid',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled ? 0.4 : 1,
                      background: activeTf === tf.key ? '#3b82f6' : 'transparent',
                      color: activeTf === tf.key ? '#fff' : 'var(--text-muted)',
                      borderColor: activeTf === tf.key ? '#3b82f6' : 'var(--border)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {tf.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Industry group tables */}
          {matchedGroups.length > 0 ? (
            <>
              <div style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'monospace', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Industry Groups ({matchedGroups.length})
              </div>
              {matchedGroups.map(group => (
                <GroupTable
                  key={group.name}
                  group={group}
                  searchTicker={ticker}
                  stocksMap={stocksMap}
                  historyLoading={historyLoading}
                  activeTf={activeTf}
                />
              ))}
            </>
          ) : (
            <div style={{ color: 'var(--text-faint)', fontFamily: 'monospace', fontSize: 12 }}>
              No industry group data for this ticker
            </div>
          )}
        </>
      )}
    </div>
  );
}
