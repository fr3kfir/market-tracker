import { useState, useMemo, useCallback } from 'react';

// "Which ETFs hold this stock?" — search a ticker (e.g. NBIS) and see every
// scanned ETF that holds it, plus the other names in those ETFs (its
// "ETF peers", e.g. WGMI → IREN, CIFR, APLD…).
//
// Two sources, merged per ETF:
//  • /data/etf-holdings.json — FULL holdings from SEC N-PORT filings
//    (refreshed daily by a GitHub Action; weights can be a quarter old)
//  • /api/etf-holders       — live Yahoo top-10 (fresh weights, new positions)

const CHIPS_SHOWN = 20;      // holdings shown per ETF card before "show all"
const PEER_MAX_HOLDINGS = 100; // broad ETFs (SPY, IWM…) would flood the peer list
const PEERS_SHOWN = 40;

let _fullHoldings = null;
function loadFullHoldings() {
  if (!_fullHoldings) {
    _fullHoldings = fetch('/data/etf-holdings.json')
      .then(r => (r.ok ? r.json() : null))
      .catch(() => null)
      .then(d => {
        if (!d) _fullHoldings = null; // retry on next search
        return d;
      });
  }
  return _fullHoldings;
}

// ETF → { etf, name, asOf, holdings: [{ symbol, name, weight }] } from both sources
function mergeSources(full, live) {
  const etfs = {};
  for (const [etf, e] of Object.entries(full?.etfs || {})) {
    etfs[etf] = { etf, name: e.name, asOf: e.asOf, holdings: e.holdings.map(([symbol, name, weight]) => ({ symbol, name, weight })) };
  }
  for (const y of [...(live?.holders || []), ...(live?.self ? [live.self] : [])]) {
    const cur = etfs[y.etf] || (etfs[y.etf] = { etf: y.etf, name: y.name, asOf: null, holdings: [] });
    cur.name = y.name || cur.name;
    const bySym = new Map(cur.holdings.map(h => [h.symbol, h]));
    for (const h of y.holdings) {
      if (bySym.has(h.symbol)) { if (h.weight != null) bySym.get(h.symbol).weight = h.weight; }
      else cur.holdings.push({ ...h });
    }
    cur.holdings.sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0));
    cur.live = true;
  }
  return etfs;
}

function visibleHoldings(holdings, ticker, all) {
  if (all) return holdings;
  const top = holdings.slice(0, CHIPS_SHOWN);
  const self = holdings.find(h => h.symbol === ticker);
  return self && !top.includes(self) ? [...top, self] : top;
}

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
  const [showAll, setShowAll] = useState(false);
  const shown = visibleHoldings(holdings, ticker, showAll);
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
        {shown.map(h => (
          <HoldingChip key={h.symbol} h={h} quote={quotes[h.symbol]}
            highlight={h.symbol === ticker} onClick={() => onPick(h.symbol)} />
        ))}
        {holdings.length > CHIPS_SHOWN && (
          <button onClick={() => setShowAll(v => !v)} style={{
            padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 11,
            background: 'transparent', border: '1px dashed var(--border)', color: 'var(--text-muted)',
          }}>{showAll ? 'Show less' : `Show all ${holdings.length}`}</button>
        )}
      </div>
    </div>
  );
}

// Stocks that share the most (focused) ETFs with the searched ticker.
function computePeers(data) {
  const map = new Map();
  for (const { etf, holdings } of data.holders) {
    if (holdings.length > PEER_MAX_HOLDINGS) continue;
    for (const h of holdings) {
      if (h.symbol === data.ticker) continue;
      if (!map.has(h.symbol)) map.set(h.symbol, { symbol: h.symbol, name: h.name, etfs: [], weight: 0 });
      const p = map.get(h.symbol);
      p.etfs.push(etf);
      p.weight += h.weight ?? 0;
    }
  }
  return [...map.values()].sort((a, b) => b.etfs.length - a.etfs.length || b.weight - a.weight);
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
      // Either source alone is enough — only fail if both do.
      const [full, live] = await Promise.all([
        loadFullHoldings(),
        fetch(`/api/etf-holders?ticker=${encodeURIComponent(t)}`)
          .then(async r => (r.ok ? r.json() : null))
          .catch(() => null),
      ]);
      if (!full && !live) throw new Error('ETF holdings data is unavailable right now');

      const etfs = mergeSources(full, live);
      const holders = Object.values(etfs)
        .map(e => ({ ...e, weight: e.holdings.find(h => h.symbol === t)?.weight ?? null }))
        .filter(e => e.holdings.some(h => h.symbol === t))
        .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0));
      const d = {
        ticker: t, holders, self: etfs[t] || null,
        scanned: Object.keys(etfs).length,
        fullAsOf: full?.updatedAt || null,
        liveOk: !!live,
      };
      setData(d);

      const cards = [...holders, ...(d.self ? [d.self] : [])];
      const syms = [...new Set([
        ...cards.flatMap(c => [c.etf, ...visibleHoldings(c.holdings, t, false).map(h => h.symbol)]),
        ...computePeers(d).slice(0, PEERS_SHOWN).map(p => p.symbol),
      ])];
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

  const peers = useMemo(() => (data ? computePeers(data).slice(0, PEERS_SHOWN) : []), [data]);

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
              <h3 style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 8px' }}>{data.ticker} holdings</h3>
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
              {data.ticker} isn't held by any of the {data.scanned} ETFs scanned.
            </p>
          )}

          <p style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: 11, marginTop: 12 }}>
            {data.scanned} sector &amp; thematic ETFs ·{' '}
            {data.fullAsOf
              ? `full holdings from SEC N-PORT filings (updated ${new Date(data.fullAsOf).toLocaleDateString()})`
              : 'full holdings unavailable — top-10 only'}
            {data.liveOk ? ' + live Yahoo top-10' : ' · live Yahoo top-10 unavailable'} ·
            click any ticker to search it
          </p>
        </>
      )}
    </div>
  );
}
