import { useState, useMemo, useCallback } from 'react';

// "Which ETFs hold this stock?" — search a ticker (e.g. NBIS) and see every
// scanned ETF that has it among its top-10 holdings, plus the other names in
// those ETFs (its "ETF peers", e.g. WGMI → IREN, CIFR, APLD…).

function Change({ value }) {
  if (value == null) return <span style={{ color: 'var(--text-faint)' }}>—</span>;
  return (
    <span style={{ color: value >= 0 ? '#34d399' : '#f87171', fontWeight: 700 }}>
      {value >= 0 ? '+' : ''}{value.toFixed(2)}%
    </span>
  );
}

function HoldingChip({ h, quote, highlight, onClick }) {
  return (
    <button
      onClick={onClick}
      title={h.name}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2,
        padding: '6px 10px', borderRadius: 8, cursor: 'pointer', minWidth: 78,
        fontFamily: 'monospace', fontSize: 11, textAlign: 'left',
        background: highlight ? 'rgba(59,130,246,0.18)' : 'var(--bg-panel)',
        border: `1px solid ${highlight ? '#3b82f6' : 'var(--border)'}`,
        color: 'var(--text)',
      }}
    >
      <span style={{ fontWeight: 700, fontSize: 13, color: highlight ? '#60a5fa' : 'var(--text)' }}>
        {highlight && '★ '}{h.symbol}
      </span>
      <span style={{ color: 'var(--text-muted)' }}>
        {h.weight != null ? `${h.weight.toFixed(1)}%` : '—'} · <Change value={quote?.regularMarketChangePercent} />
      </span>
    </button>
  );
}

function EtfCard({ etf, name, weight, holdings, ticker, quotes, onPick }) {
  return (
    <div style={{
      background: 'var(--bg-panel)', border: '1px solid var(--border)',
      borderRadius: 12, padding: 14, marginBottom: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
        <button onClick={() => onPick(etf)} style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          fontFamily: 'monospace', fontWeight: 800, fontSize: 16, color: '#60a5fa',
        }}>{etf}</button>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1, minWidth: 0 }}>{name}</span>
        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
          <Change value={quotes[etf]?.regularMarketChangePercent} />
        </span>
        {weight != null && (
          <span style={{
            fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
            background: 'rgba(59,130,246,0.15)', color: '#93c5fd',
            padding: '2px 8px', borderRadius: 20,
          }}>{ticker} {weight.toFixed(2)}%</span>
        )}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {holdings.map(h => (
          <HoldingChip key={h.symbol} h={h} quote={quotes[h.symbol]}
            highlight={h.symbol === ticker} onClick={() => onPick(h.symbol)} />
        ))}
      </div>
    </div>
  );
}

export default function EtfHolders() {
  const [input, setInput] = useState('');
  const [data, setData] = useState(null);
  const [quotes, setQuotes] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runSearch = useCallback(async (raw) => {
    const t = raw.trim().toUpperCase();
    if (!t) return;
    setInput(t);
    setLoading(true);
    setError(null);
    setData(null);
    setQuotes({});
    try {
      const r = await fetch(`/api/etf-holders?ticker=${encodeURIComponent(t)}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
      setData(d);

      const cards = [...d.holders, ...(d.self ? [d.self] : [])];
      const syms = [...new Set(cards.flatMap(c => [c.etf, ...c.holdings.map(h => h.symbol)]))];
      if (syms.length) {
        const qr = await fetch(`/api/quotes?symbols=${syms.map(encodeURIComponent).join(',')}`);
        if (qr.ok) {
          const qd = await qr.json();
          setQuotes(Object.fromEntries((qd?.quoteResponse?.result || []).map(q => [q.symbol, q])));
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Stocks that share the most ETFs with the searched ticker.
  const peers = useMemo(() => {
    if (!data?.holders.length) return [];
    const map = new Map();
    for (const { etf, holdings } of data.holders) {
      for (const h of holdings) {
        if (h.symbol === data.ticker) continue;
        if (!map.has(h.symbol)) map.set(h.symbol, { symbol: h.symbol, name: h.name, etfs: [] });
        map.get(h.symbol).etfs.push(etf);
      }
    }
    return [...map.values()].sort((a, b) => b.etfs.length - a.etfs.length || a.symbol.localeCompare(b.symbol));
  }, [data]);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <form onSubmit={e => { e.preventDefault(); runSearch(input); }} style={{ marginBottom: 20 }}>
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center',
          background: 'var(--bg-panel)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '10px 14px',
        }}>
          <span style={{ fontSize: 16 }}>🧺</span>
          <input
            value={input}
            onChange={e => setInput(e.target.value.toUpperCase())}
            placeholder="Which ETFs hold… (e.g. NBIS, IREN, OKLO) — or an ETF (WGMI)"
            style={{
              flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text)', fontFamily: 'monospace', fontSize: 14, fontWeight: 600,
            }}
            autoFocus autoComplete="off" spellCheck={false}
          />
          <button type="submit" disabled={loading} style={{
            background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8,
            padding: '6px 16px', fontWeight: 700, fontSize: 12, cursor: 'pointer', opacity: loading ? 0.6 : 1,
          }}>Search</button>
        </div>
      </form>

      {loading && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          Scanning ETF holdings… (first search can take ~20s, then it's cached)
        </p>
      )}
      {error && <p style={{ textAlign: 'center', color: '#f87171', fontSize: 13 }}>Error: {error}</p>}

      {!data && !loading && !error && (
        <p style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>
          Enter a stock ticker to see which sector &amp; thematic ETFs hold it, and the other stocks inside those ETFs.
        </p>
      )}

      {data && (
        <>
          {data.self && (
            <>
              <h3 style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 8px' }}>{data.ticker} top holdings</h3>
              <EtfCard {...data.self} weight={null} ticker={data.ticker} quotes={quotes} onPick={runSearch} />
            </>
          )}

          {data.holders.length > 0 ? (
            <>
              {peers.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 8px' }}>
                    ETF peers of {data.ticker} <span style={{ color: 'var(--text-faint)' }}>(× = shared ETFs)</span>
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {peers.map(p => (
                      <button key={p.symbol} onClick={() => runSearch(p.symbol)}
                        title={`${p.name}\nIn: ${p.etfs.join(', ')}`}
                        style={{
                          fontFamily: 'monospace', fontSize: 12, padding: '4px 10px', borderRadius: 20,
                          background: 'var(--bg-panel)', border: '1px solid var(--border)',
                          color: 'var(--text)', cursor: 'pointer',
                        }}>
                        <strong>{p.symbol}</strong>
                        {p.etfs.length > 1 && <span style={{ color: '#93c5fd' }}> ×{p.etfs.length}</span>}
                        {' '}<Change value={quotes[p.symbol]?.regularMarketChangePercent} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <h3 style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 8px' }}>
                {data.holders.length} ETF{data.holders.length > 1 ? 's' : ''} holding {data.ticker}
              </h3>
              {data.holders.map(h => (
                <EtfCard key={h.etf} {...h} ticker={data.ticker} quotes={quotes} onPick={runSearch} />
              ))}
            </>
          ) : !data.self && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              {data.ticker} isn't a top-10 holding in any of the {data.scanned} ETFs scanned.
            </p>
          )}

          <p style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: 11, marginTop: 12 }}>
            Based on each ETF's top-10 holdings (Yahoo Finance) across {data.scanned} sector &amp; thematic ETFs ·
            click any ticker to search it
          </p>
        </>
      )}
    </div>
  );
}
