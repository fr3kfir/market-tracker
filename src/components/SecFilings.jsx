import { useState, useEffect, useCallback, useRef } from 'react';

const FORM_FILTERS = ['All', '8-K', '10-K', '10-Q', 'S-1'];
const FORM_COLORS  = { '8-K': '#f59e0b', '10-K': '#60a5fa', '10-Q': '#34d399', 'S-1': '#e879f9' };
const REFRESH_SECS = 60;

function FormBadge({ form }) {
  const color = FORM_COLORS[form] || '#94a3b8';
  return (
    <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color, background: `${color}18`, padding: '2px 7px', borderRadius: 4, flexShrink: 0 }}>
      {form}
    </span>
  );
}

export default function SecFilings() {
  const [filings, setFilings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formFilter, setFormFilter] = useState('All');
  const [countdown, setCountdown] = useState(REFRESH_SECS);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const countdownRef = useRef(REFRESH_SECS);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const param = formFilter !== 'All' ? `?form=${encodeURIComponent(formFilter)}` : '';
      const r = await fetch(`/api/sec${param}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      setFilings(d.filings || []);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [formFilter]);

  // Load on mount and when filter changes
  useEffect(() => { load(); }, [load]);

  // Countdown + auto-refresh
  useEffect(() => {
    countdownRef.current = REFRESH_SECS;
    setCountdown(REFRESH_SECS);
    const id = setInterval(() => {
      countdownRef.current -= 1;
      setCountdown(countdownRef.current);
      if (countdownRef.current <= 0) {
        countdownRef.current = REFRESH_SECS;
        load();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [load]);

  const popOut = () => {
    const w = window.open(window.location.href, '_blank', 'width=980,height=680,menubar=no,toolbar=no,scrollbars=yes');
    if (w) w.focus();
  };

  const displayed = filings.filter(f => formFilter === 'All' || f.form === formFilter);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {FORM_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFormFilter(f)}
              style={{
                padding: '5px 14px', fontSize: 11, fontFamily: 'monospace', fontWeight: 600,
                borderRadius: 20, border: '1px solid', cursor: 'pointer', transition: 'all 0.15s',
                borderColor: formFilter === f ? (FORM_COLORS[f] || '#3b82f6') : 'var(--border)',
                background:  formFilter === f ? `${FORM_COLORS[f] || '#3b82f6'}1A` : 'transparent',
                color:       formFilter === f ? (FORM_COLORS[f] || '#60a5fa') : 'var(--text-muted)',
              }}
            >{f}</button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Countdown badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontFamily: 'monospace', color: 'var(--text-faint)', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 10px' }}>
            <span style={{ color: loading ? '#f59e0b' : '#34d399' }}>{loading ? '⟳' : '✓'}</span>
            <span>{loading ? 'Loading…' : `Next in ${countdown}s`}</span>
            {!loading && <span style={{ color: 'var(--border)' }}>·</span>}
            {!loading && <span>{lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>}
          </div>
          {/* Pop-out */}
          <button
            onClick={popOut}
            title="Open in separate window"
            style={{ padding: '5px 10px', fontSize: 11, fontFamily: 'monospace', fontWeight: 600, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-panel)', color: 'var(--text-muted)', cursor: 'pointer' }}
          >⧉ Pop-out</button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 12, fontSize: 12, color: '#f87171', fontFamily: 'monospace', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>⚠ {error}</span>
          <button onClick={load} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#60a5fa', fontSize: 11, fontFamily: 'monospace' }}>Retry</button>
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {loading && filings.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-faint)', fontFamily: 'monospace', fontSize: 12 }}>Loading SEC filings…</div>
        ) : displayed.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-faint)', fontFamily: 'monospace', fontSize: 12 }}>No filings found</div>
        ) : (
          <div>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 100px 80px', gap: 8, padding: '10px 16px', borderBottom: '1px solid var(--border)', opacity: 0.6 }}>
              {['Form', 'Company', 'Date', ''].map(h => (
                <span key={h} style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-faint)', fontFamily: 'monospace' }}>{h}</span>
              ))}
            </div>

            {displayed.map((f, i) => (
              <div
                key={i}
                style={{ display: 'grid', gridTemplateColumns: '80px 1fr 100px 80px', gap: 8, padding: '11px 16px', borderBottom: '1px solid var(--border)', alignItems: 'center', transition: 'background 0.1s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div><FormBadge form={f.form} /></div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.company}</div>
                <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{f.date}</div>
                <div>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 6, background: 'rgba(59,130,246,0.12)', color: '#60a5fa', fontSize: 11, fontFamily: 'monospace', fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(59,130,246,0.25)' }}
                  >View ↗</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-faint)', marginTop: 10, fontFamily: 'monospace' }}>
        Data from SEC EDGAR · Auto-refreshes every {REFRESH_SECS}s
      </p>
    </div>
  );
}
