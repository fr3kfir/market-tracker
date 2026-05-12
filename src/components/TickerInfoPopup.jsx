import { SECTOR_STOCKS, INDUSTRY_GROUPS } from '../data/stockUniverse';

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

export default function TickerInfoPopup({ ticker, stock, onClose }) {
  if (!ticker) return null;
  const t = ticker.toUpperCase();
  const info = TICKER_LOOKUP[t];
  const groups = info ? INDUSTRY_GROUPS.filter(g => info.groups.includes(g.name)) : [];

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{
        background: 'var(--bg-panel)', borderRadius: 16, padding: 24,
        maxWidth: 460, width: '92%', border: '1px solid var(--border)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <span style={{ fontFamily: 'monospace', fontSize: 26, fontWeight: 800, color: '#60a5fa' }}>{t}</span>
            {stock?.name && stock.name !== t && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{stock.name}</div>
            )}
            <div style={{ display: 'flex', gap: 12, marginTop: 6, alignItems: 'center' }}>
              {stock?.price != null && (
                <span style={{ fontFamily: 'monospace', fontSize: 15, color: 'var(--text)', fontWeight: 600 }}>
                  ${stock.price.toFixed(2)}
                </span>
              )}
              {stock?.change != null && (
                <span style={{
                  fontFamily: 'monospace', fontSize: 12, fontWeight: 700,
                  color: stock.change >= 0 ? '#34d399' : '#f87171',
                  background: stock.change >= 0 ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
                  padding: '2px 8px', borderRadius: 20,
                }}>
                  {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                </span>
              )}
              {stock?.rs != null && (
                <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#f59e0b', fontWeight: 700 }}>
                  RS {stock.rs}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--text-faint)',
            cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: 4,
          }}>×</button>
        </div>

        {!info ? (
          <div style={{ color: 'var(--text-faint)', fontFamily: 'monospace', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>
            No sector / group data for this ticker
          </div>
        ) : (
          <>
            {/* Sector */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-faint)', marginBottom: 8 }}>
                Sector
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {info.sectors.map(s => (
                  <span key={s} style={{
                    fontFamily: 'monospace', fontSize: 12, fontWeight: 600,
                    background: 'rgba(59,130,246,0.18)', color: '#93c5fd',
                    padding: '5px 14px', borderRadius: 20,
                    border: '1px solid rgba(59,130,246,0.3)',
                  }}>
                    📂 {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Industry Groups */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-faint)', marginBottom: 8 }}>
                Industry Groups ({groups.length})
              </div>
              {groups.length === 0 ? (
                <div style={{ color: 'var(--text-faint)', fontFamily: 'monospace', fontSize: 11 }}>No group data</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {groups.map(g => (
                    <div key={g.name} style={{
                      background: 'var(--bg)', borderRadius: 10, padding: '9px 14px',
                      border: '1px solid var(--border)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                        {g.name}
                      </span>
                      <span style={{
                        fontSize: 10, color: 'var(--text-faint)', fontFamily: 'monospace',
                        background: 'rgba(99,102,241,0.12)', color: '#818cf8',
                        padding: '2px 8px', borderRadius: 20,
                      }}>
                        {g.tickers.length} stocks
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
