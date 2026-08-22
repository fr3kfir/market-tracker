import { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchPrePostData } from '../services/prePost';

const REFRESH_MS = 60_000;

const STATE_INFO = {
  PRE:        { label: 'Pre-Market',       color: '#fbbf24' },
  PREPRE:     { label: 'Pre-Market',       color: '#fbbf24' },
  REGULAR:    { label: 'Regular Session',  color: '#4ade80' },
  POST:       { label: 'After-Hours',      color: '#60a5fa' },
  POSTPOST:   { label: 'After-Hours',      color: '#60a5fa' },
  CLOSED:     { label: 'Market Closed',    color: 'var(--text-faint)' },
};

function fmtTime(ts) {
  if (!ts) return '';
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function MoverRow({ ticker, price, changePct }) {
  const up = changePct >= 0;
  const color = up ? '#4ade80' : '#f87171';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
      borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color: 'var(--text)', flex: '0 0 64px' }}>{ticker}</span>
      <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)', flex: 1 }}>
        {price != null ? `$${price.toFixed(2)}` : '—'}
      </span>
      <span style={{
        fontFamily: 'monospace', fontWeight: 700, fontSize: 11, color,
        background: `${color}1a`, borderRadius: 6, padding: '2px 7px', minWidth: 60, textAlign: 'right',
      }}>
        {up ? '+' : ''}{changePct.toFixed(2)}%
      </span>
    </div>
  );
}

function MoverColumn({ title, icon, rows, emptyMsg }) {
  const gainers = rows.filter(r => r.changePct > 0).sort((a, b) => b.changePct - a.changePct).slice(0, 15);
  const losers  = rows.filter(r => r.changePct < 0).sort((a, b) => a.changePct - b.changePct).slice(0, 15);

  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden', flex: 1, minWidth: 0 }}>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
        {icon} {title}
      </div>
      {rows.length === 0 ? (
        <div style={{ padding: '30px 10px', textAlign: 'center', fontSize: 11, color: 'var(--text-faint)' }}>{emptyMsg}</div>
      ) : (
        <div style={{ display: 'flex' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4ade80', padding: '6px 10px', borderBottom: '1px solid var(--border)' }}>
              Gainers ({gainers.length})
            </div>
            {gainers.length === 0
              ? <div style={{ padding: '16px 10px', fontSize: 10, color: 'var(--text-faint)', textAlign: 'center' }}>None</div>
              : gainers.map(r => <MoverRow key={r.ticker} ticker={r.ticker} price={r.price} changePct={r.changePct} />)}
          </div>
          <div style={{ width: 1, background: 'var(--border)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#f87171', padding: '6px 10px', borderBottom: '1px solid var(--border)' }}>
              Losers ({losers.length})
            </div>
            {losers.length === 0
              ? <div style={{ padding: '16px 10px', fontSize: 10, color: 'var(--text-faint)', textAlign: 'center' }}>None</div>
              : losers.map(r => <MoverRow key={r.ticker} ticker={r.ticker} price={r.price} changePct={r.changePct} />)}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PrePostScanner({ symbols }) {
  const [quotes, setQuotes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchPrePostData(symbols);
      setQuotes(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [symbols]);

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  const preRows = useMemo(() => (quotes || [])
    .filter(q => q.preMarketPrice != null && q.preMarketChangePercent != null)
    .map(q => ({ ticker: q.ticker, price: q.preMarketPrice, changePct: q.preMarketChangePercent })),
  [quotes]);

  const postRows = useMemo(() => (quotes || [])
    .filter(q => q.postMarketPrice != null && q.postMarketChangePercent != null)
    .map(q => ({ ticker: q.ticker, price: q.postMarketPrice, changePct: q.postMarketChangePercent })),
  [quotes]);

  const sessionState = useMemo(() => {
    if (!quotes?.length) return null;
    const counts = {};
    quotes.forEach(q => { if (q.marketState) counts[q.marketState] = (counts[q.marketState] || 0) + 1; });
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || null;
  }, [quotes]);

  const latestTime = useMemo(() => {
    const times = (quotes || []).map(q => q.preMarketTime || q.postMarketTime).filter(Boolean);
    return times.length ? Math.max(...times) : null;
  }, [quotes]);

  const info = STATE_INFO[sessionState] || { label: sessionState || 'Unknown', color: 'var(--text-faint)' };

  if (loading && !quotes) {
    return (
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 260, gap: 10 }}>
        <svg className="animate-spin" width="26" height="26" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="var(--border)" strokeWidth="3" />
          <path d="M4 12a8 8 0 018-8v8z" fill="#3b82f6" />
        </svg>
        <div style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'monospace' }}>Scanning pre/post-market quotes…</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px',
        border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg-panel)', flexWrap: 'wrap',
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: info.color, boxShadow: `0 0 6px ${info.color}` }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: info.color }}>{info.label}</span>
        {latestTime && (
          <span style={{ fontSize: 10, color: 'var(--text-faint)', fontFamily: 'monospace' }}>· last tick {fmtTime(latestTime)}</span>
        )}
        <div style={{ flex: 1 }} />
        <button className="theme-btn" onClick={load}>↻ Refresh</button>
      </div>

      {error && (
        <div style={{ fontSize: 11, color: 'var(--red)', padding: '6px 2px' }}>⚠ {error} — showing last known data</div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <MoverColumn
          title="Pre-Market Movers"
          icon="🌅"
          rows={preRows}
          emptyMsg="No pre-market data right now — check back before the open (4:00–9:30am ET)."
        />
        <MoverColumn
          title="After-Hours Movers"
          icon="🌙"
          rows={postRows}
          emptyMsg="No after-hours data right now — check back after the close (4:00–8:00pm ET)."
        />
      </div>

      <p style={{ textAlign: 'center', fontSize: 10, fontFamily: 'monospace', color: 'var(--text-faint)', margin: '4px 0' }}>
        Extended-hours prices from Yahoo Finance · Thinly-traded, can gap sharply on low volume · Refreshes every 60s
      </p>
    </div>
  );
}
