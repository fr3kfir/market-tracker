import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

const STORAGE_KEY = 'mp-portfolio';
const REFRESH_MS = 30_000;

function loadHoldings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveHoldings(holdings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings)); } catch { /* storage full/blocked */ }
}

function fmtMoney(n) {
  if (n == null || Number.isNaN(n)) return '—';
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtPct(n) {
  if (n == null || Number.isNaN(n)) return '—';
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

async function fetchQuotesFor(tickers) {
  try {
    const r = await fetch(`/api/quotes?symbols=${tickers.join(',')}`);
    const d = await r.json();
    const result = d?.quoteResponse?.result || [];
    return Object.fromEntries(result.filter(q => q?.symbol).map(q => [q.symbol, q]));
  } catch { return {}; }
}

function AddHoldingForm({ onAdd }) {
  const [ticker, setTicker] = useState('');
  const [shares, setShares] = useState('');
  const [cost, setCost] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const t = ticker.trim().toUpperCase();
    const sh = parseFloat(shares);
    const cb = parseFloat(cost);
    if (!t || !(sh > 0) || !(cb >= 0)) return;
    onAdd({ ticker: t, shares: sh, cost: cb });
    setTicker(''); setShares(''); setCost('');
  };

  const inputStyle = {
    fontSize: 12, padding: '6px 9px', borderRadius: 7,
    border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text)',
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
      <input placeholder="Ticker" value={ticker} onChange={e => setTicker(e.target.value)} style={{ ...inputStyle, width: 90, fontFamily: 'monospace', textTransform: 'uppercase' }} />
      <input placeholder="Shares" type="number" step="any" min="0" value={shares} onChange={e => setShares(e.target.value)} style={{ ...inputStyle, width: 90 }} />
      <input placeholder="Avg cost/share" type="number" step="any" min="0" value={cost} onChange={e => setCost(e.target.value)} style={{ ...inputStyle, width: 130 }} />
      <button type="submit" className="theme-btn" style={{ fontWeight: 700 }}>+ Add Position</button>
    </form>
  );
}

function HoldingRow({ h, quote, onRemove }) {
  const price = quote?.regularMarketPrice;
  const changePct = quote?.regularMarketChangePercent ?? 0;
  const marketValue = price != null ? price * h.shares : null;
  const costValue = h.cost * h.shares;
  const pnl = marketValue != null ? marketValue - costValue : null;
  const pnlPct = costValue > 0 && pnl != null ? (pnl / costValue) * 100 : null;
  const dayChange = marketValue != null ? marketValue * (changePct / 100) : null;
  const pnlColor = pnl == null ? 'var(--text-faint)' : pnl >= 0 ? '#4ade80' : '#f87171';
  const dayColor = dayChange == null ? 'var(--text-faint)' : dayChange >= 0 ? '#4ade80' : '#f87171';

  return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
      <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color: 'var(--text)' }}>{h.ticker}</td>
      <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>{h.shares}</td>
      <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>{fmtMoney(h.cost)}</td>
      <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text)', textAlign: 'right' }}>{price != null ? fmtMoney(price) : '—'}</td>
      <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text)', textAlign: 'right' }}>{fmtMoney(marketValue)}</td>
      <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: pnlColor, textAlign: 'right' }}>
        {fmtMoney(pnl)} <span style={{ fontWeight: 400, fontSize: 10 }}>({fmtPct(pnlPct)})</span>
      </td>
      <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: dayColor, textAlign: 'right' }}>
        {fmtMoney(dayChange)} <span style={{ fontWeight: 400, fontSize: 10 }}>({fmtPct(changePct)})</span>
      </td>
      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
        <button onClick={() => onRemove(h.id)} title="Remove position" style={{
          border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-faint)',
          borderRadius: 6, cursor: 'pointer', fontSize: 11, padding: '2px 8px',
        }}>✕</button>
      </td>
    </tr>
  );
}

function SummaryStat({ label, val, color }) {
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-faint)' }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'monospace', color: color || 'var(--text)' }}>{val}</div>
    </div>
  );
}

export default function Portfolio() {
  const [holdings, setHoldings] = useState(loadHoldings);
  const [quotesByTicker, setQuotesByTicker] = useState({});
  const [loading, setLoading] = useState(true);
  const idCounter = useRef(0);

  useEffect(() => { saveHoldings(holdings); }, [holdings]);

  const tickers = useMemo(() => [...new Set(holdings.map(h => h.ticker))], [holdings]);

  const load = useCallback(async () => {
    try {
      const map = await fetchQuotesFor(tickers);
      setQuotesByTicker(map);
    } finally {
      setLoading(false);
    }
  }, [tickers]);

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  const addHolding = useCallback(({ ticker, shares, cost }) => {
    setHoldings(prev => [...prev, { id: ++idCounter.current, ticker, shares, cost }]);
  }, []);

  const removeHolding = useCallback((id) => {
    setHoldings(prev => prev.filter(h => h.id !== id));
  }, []);

  const totals = useMemo(() => {
    let value = 0, cost = 0, day = 0;
    holdings.forEach(h => {
      const q = quotesByTicker[h.ticker];
      const price = q?.regularMarketPrice;
      const changePct = q?.regularMarketChangePercent ?? 0;
      const mv = price != null ? price * h.shares : h.cost * h.shares;
      value += mv;
      cost += h.cost * h.shares;
      if (price != null) day += mv * (changePct / 100);
    });
    const pnl = value - cost;
    const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
    return { value, cost, pnl, pnlPct, day };
  }, [holdings, quotesByTicker]);

  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
        <SummaryStat label="Portfolio Value" val={fmtMoney(totals.value)} />
        <SummaryStat label="Total Cost" val={fmtMoney(totals.cost)} />
        <SummaryStat label="Total P/L" val={`${fmtMoney(totals.pnl)} (${fmtPct(totals.pnlPct)})`} color={totals.pnl >= 0 ? '#4ade80' : '#f87171'} />
        <SummaryStat label="Today's Change" val={fmtMoney(totals.day)} color={totals.day >= 0 ? '#4ade80' : '#f87171'} />
      </div>

      <AddHoldingForm onAdd={addHolding} />

      {holdings.length === 0 ? (
        <div style={{ padding: '40px 16px', textAlign: 'center', fontSize: 12, color: 'var(--text-faint)' }}>
          No positions yet — add a ticker, share count, and average cost above to start tracking P/L.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Ticker', 'Shares', 'Avg Cost', 'Price', 'Value', 'P/L', "Today's $", ''].map((h, i) => (
                  <th key={h + i} style={{
                    padding: '8px 10px', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
                    color: 'var(--text-faint)', textAlign: i === 0 ? 'left' : i === 7 ? 'center' : 'right',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {holdings.map(h => (
                <HoldingRow key={h.id} h={h} quote={quotesByTicker[h.ticker]} onRemove={removeHolding} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ textAlign: 'center', fontSize: 10, fontFamily: 'monospace', color: 'var(--text-faint)', margin: 0, padding: '10px 0', borderTop: '1px solid var(--border)' }}>
        {loading && tickers.length > 0 ? 'Loading live prices…' : 'Live prices refresh every 30s · Positions saved locally in this browser'}
      </p>
    </div>
  );
}
