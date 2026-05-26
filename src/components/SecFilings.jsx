import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';

const FORM_FILTERS = ['All', '8-K', '10-K', '10-Q', 'S-1'];
const FORM_COLORS  = { '8-K': '#f59e0b', '10-K': '#60a5fa', '10-Q': '#34d399', 'S-1': '#e879f9' };
const REFRESH_SECS = 60;

const ITEM_LABELS = {
  '1.01': 'Material Agreement',
  '1.02': 'Agreement Terminated',
  '1.03': 'Bankruptcy / Receivership',
  '2.01': 'Asset Acquisition/Disposal',
  '2.02': '📈 Earnings Results',
  '2.03': 'Off-Balance Sheet',
  '2.04': 'Triggering Events',
  '2.05': 'Costs — Exit/Disposal',
  '3.01': 'Delisting Notice',
  '3.02': 'Unregistered Sales',
  '4.01': 'Auditor Change',
  '4.02': 'Accounting Disagreement',
  '5.01': 'Change in Control',
  '5.02': '👤 Officer/Director Change',
  '5.03': 'Amendment to Articles',
  '5.07': 'Shareholder Vote',
  '5.08': 'Fiscal Year Change',
  '7.01': 'Reg FD Disclosure',
  '8.01': 'Other Events',
  '9.01': 'Financial Statements',
};

const FORM_INFO = {
  '8-K': {
    icon: '📢',
    title: 'Material Event',
    short: 'Major company news filed within 4 days',
    detail: 'Filed when something big happens: earnings release, CEO change, acquisition, bankruptcy, stock split, or any event shareholders must know about immediately.',
  },
  '10-K': {
    icon: '📋',
    title: 'Annual Report',
    short: 'Full-year financial statements & outlook',
    detail: 'The most comprehensive company filing. Includes 12-month income statement, balance sheet, cash flows, risk factors, and management discussion. Filed once per year.',
  },
  '10-Q': {
    icon: '📊',
    title: 'Quarterly Report',
    short: 'Q1/Q2/Q3 financial snapshot',
    detail: 'A lighter version of the 10-K filed for each of the first 3 fiscal quarters. Shows revenue, earnings, and any material changes since the last annual report. Q4 is covered by the 10-K.',
  },
  'S-1': {
    icon: '🚀',
    title: 'IPO Registration',
    short: 'Company going public for the first time',
    detail: "Filed before a company's IPO. Contains the business model, financials, risk factors, and proposed share price range. Reading the S-1 is essential before buying any newly public company.",
  },
};

function FormBadge({ form }) {
  const color = FORM_COLORS[form] || '#94a3b8';
  const info  = FORM_INFO[form];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color, background: `${color}18`, padding: '2px 7px', borderRadius: 4, width: 'fit-content' }}>
        {form}
      </span>
      {info && (
        <span style={{ fontSize: 9, color, opacity: 0.7, fontFamily: 'monospace', paddingLeft: 2 }}>
          {info.icon} {info.title}
        </span>
      )}
    </div>
  );
}

function FilingLegend({ activeFilter }) {
  const [expanded, setExpanded] = useState(false);
  const forms = activeFilter === 'All' ? Object.keys(FORM_INFO) : [activeFilter].filter(f => FORM_INFO[f]);

  return (
    <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, marginBottom: 14, overflow: 'hidden' }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
      >
        <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#475569' }}>
          📖 What are these filings?
        </span>
        <span style={{ fontSize: 14, transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>⌄</span>
      </button>
      {expanded && (
        <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid #1e293b' }}>
          <div style={{ height: 10 }} />
          {forms.map(f => {
            const info  = FORM_INFO[f];
            const color = FORM_COLORS[f] || '#94a3b8';
            return (
              <div key={f} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ flexShrink: 0, marginTop: 2 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color, background: `${color}18`, padding: '2px 8px', borderRadius: 4 }}>{f}</span>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 2 }}>
                    {info.icon} {info.title} <span style={{ fontSize: 10, fontWeight: 400, color: '#64748b' }}>— {info.short}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{info.detail}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function filingContext(f) {
  if (f.form === '8-K' && f.items?.length) {
    return f.items.map(i => ITEM_LABELS[i] || `Item ${i}`).join(' · ');
  }
  if ((f.form === '10-K' || f.form === '10-Q') && f.period) {
    const d   = new Date(f.period + 'T12:00:00Z');
    const mon = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    return `Period ending ${mon}`;
  }
  if (f.form === 'S-1') return 'Initial public offering prospectus';
  return null;
}

// ── Inline summary strip shown below each filing row ─────────────────────────
function InlineSummary({ preview, color, docUrl }) {
  if (!preview) return null;

  if (preview.loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 10, color: '#475569', fontFamily: 'monospace' }}>
        <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
        טוען תקציר מ-SEC EDGAR…
      </div>
    );
  }

  if (!preview.text) return null;   // silent fail — no clutter

  return (
    <div style={{ marginTop: 7 }}>
      {/* Summary text — clamp to 4 lines */}
      <div style={{
        fontSize: 11, color: '#94a3b8', lineHeight: 1.65,
        display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {preview.text}
      </div>
      {/* Link straight to the primary doc */}
      {(preview.docUrl || docUrl) && (
        <a
          href={preview.docUrl || docUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'inline-block', marginTop: 4, fontSize: 9, fontFamily: 'monospace', color, opacity: 0.7, textDecoration: 'none', borderBottom: `1px solid ${color}40` }}
        >
          פתח מסמך מלא ↗
        </a>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SecFilings() {
  const isMobile = useIsMobile();

  const [filings,     setFilings]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [formFilter,  setFormFilter]  = useState('All');
  const [countdown,   setCountdown]   = useState(REFRESH_SECS);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const countdownRef = useRef(REFRESH_SECS);

  // previews: accNo → { loading, text, docUrl, error }
  const [previews, setPreviews] = useState({});
  const queuedRef  = useRef(new Set()); // accNos already enqueued

  // ── Load filings ────────────────────────────────────────────────────────────
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

  useEffect(() => { load(); }, [load]);

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

  const displayed = useMemo(
    () => filings.filter(f => formFilter === 'All' || f.form === formFilter),
    [filings, formFilter]
  );

  // ── Fetch a single preview (stable reference — no deps on `previews`) ────────
  const fetchOne = useCallback(async (filing) => {
    const key = filing.accNo || `${filing.company}|${filing.date}`;
    setPreviews(p => p[key] ? p : { ...p, [key]: { loading: true } });
    try {
      const qs = new URLSearchParams({ url: filing.url, form: filing.form });
      const r  = await fetch(`/api/sec-preview?${qs}`);
      const d  = await r.json();
      setPreviews(p => ({ ...p, [key]: { loading: false, text: d.summary, docUrl: d.docUrl, error: d.error } }));
    } catch (e) {
      setPreviews(p => ({ ...p, [key]: { loading: false, error: e.message } }));
    }
  }, []);

  // ── Auto-load summaries for every displayed filing (5 concurrent workers) ────
  useEffect(() => {
    if (displayed.length === 0) return;

    // Only enqueue filings we haven't seen yet
    const toFetch = displayed.filter(f => {
      const key = f.accNo || `${f.company}|${f.date}`;
      if (queuedRef.current.has(key)) return false;
      queuedRef.current.add(key);
      return true;
    });
    if (toFetch.length === 0) return;

    // Worker-pool: 5 concurrent chains
    const CONCURRENCY = 5;
    let idx = 0;
    const next = async () => {
      const i = idx++;
      if (i >= toFetch.length) return;
      await fetchOne(toFetch[i]);
      await next();
    };
    for (let w = 0; w < Math.min(CONCURRENCY, toFetch.length); w++) next();
  }, [displayed, fetchOne]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? '0 4px' : 0 }}>

      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {FORM_FILTERS.map(f => {
            const color  = FORM_COLORS[f] || '#3b82f6';
            const active = formFilter === f;
            return (
              <button
                key={f}
                onClick={() => setFormFilter(f)}
                style={{
                  padding: isMobile ? '5px 10px' : '5px 14px',
                  fontSize: 11, fontFamily: 'monospace', fontWeight: 600,
                  borderRadius: 20, border: '1px solid', cursor: 'pointer', transition: 'all 0.15s',
                  borderColor: active ? color : 'var(--border)',
                  background:  active ? `${color}1A` : 'transparent',
                  color:       active ? color : 'var(--text-muted)',
                }}
              >
                {f !== 'All' && FORM_INFO[f] ? `${FORM_INFO[f].icon} ${f}` : f}
              </button>
            );
          })}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontFamily: 'monospace', color: 'var(--text-faint)', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 10px' }}>
            <span style={{ color: loading ? '#f59e0b' : '#34d399' }}>{loading ? '⟳' : '✓'}</span>
            <span>{loading ? 'Loading…' : `${countdown}s`}</span>
            {!loading && <span style={{ color: 'var(--border)' }}>·</span>}
            {!loading && <span>{lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>}
          </div>
          {!isMobile && (
            <button
              onClick={() => { const w = window.open(window.location.href, '_blank', 'width=980,height=680,menubar=no,toolbar=no,scrollbars=yes'); if (w) w.focus(); }}
              title="Open in separate window"
              style={{ padding: '5px 10px', fontSize: 11, fontFamily: 'monospace', fontWeight: 600, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-panel)', color: 'var(--text-muted)', cursor: 'pointer' }}
            >⧉</button>
          )}
        </div>
      </div>

      <FilingLegend activeFilter={formFilter} />

      {error && (
        <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 12, fontSize: 12, color: '#f87171', fontFamily: 'monospace', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>⚠ {error}</span>
          <button onClick={load} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#60a5fa', fontSize: 11, fontFamily: 'monospace' }}>Retry</button>
        </div>
      )}

      {/* Filing list */}
      <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {loading && filings.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-faint)', fontFamily: 'monospace', fontSize: 12 }}>Loading SEC filings…</div>
        ) : displayed.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-faint)', fontFamily: 'monospace', fontSize: 12 }}>No filings found</div>
        ) : (
          <div>
            {/* Desktop header */}
            {!isMobile && (
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 90px 70px', gap: 8, padding: '10px 16px', borderBottom: '1px solid var(--border)', opacity: 0.5 }}>
                {['Form', 'Company / Summary', 'Date', ''].map(h => (
                  <span key={h} style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-faint)', fontFamily: 'monospace' }}>{h}</span>
                ))}
              </div>
            )}

            {displayed.map((f, i) => {
              const info    = FORM_INFO[f.form];
              const color   = FORM_COLORS[f.form] || '#94a3b8';
              const ctx     = filingContext(f);
              const coName  = f.company || (f.cik ? `CIK ${f.cik}` : 'Unknown filer');
              const isAnon  = !f.company;
              const key     = f.accNo || `${f.company}|${f.date}`;
              const preview = previews[key];
              const sep     = { borderBottom: i < displayed.length - 1 ? '1px solid var(--border)' : 'none' };

              return isMobile ? (
                // ── Mobile ──
                <div key={i} style={{ padding: '12px 14px', ...sep }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color, background: `${color}18`, padding: '2px 7px', borderRadius: 4 }}>{f.form}</span>
                      {info && <span style={{ fontSize: 10, color, opacity: 0.85 }}>{info.icon} {info.title}</span>}
                    </div>
                    <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{f.date}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isAnon ? '#475569' : 'var(--text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: isAnon ? 'italic' : 'normal' }}>
                    {coName}
                  </div>
                  {ctx && (
                    <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>{ctx}</div>
                  )}
                  {/* Inline summary */}
                  <InlineSummary preview={preview} color={color} docUrl={f.url} />
                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                    <a href={f.url} target="_blank" rel="noopener noreferrer"
                      style={{ padding: '4px 12px', borderRadius: 6, background: `${color}15`, color, fontSize: 11, fontFamily: 'monospace', fontWeight: 700, textDecoration: 'none', border: `1px solid ${color}25` }}>
                      View ↗
                    </a>
                  </div>
                </div>
              ) : (
                // ── Desktop ──
                <div
                  key={i}
                  style={{ display: 'grid', gridTemplateColumns: '110px 1fr 90px 70px', gap: 8, padding: '12px 16px', ...sep, alignItems: 'flex-start', transition: 'background 0.1s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.04)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {/* Col 1: Form badge */}
                  <div style={{ paddingTop: 2 }}>
                    <FormBadge form={f.form} />
                  </div>

                  {/* Col 2: Company + context + AUTO summary */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: isAnon ? '#475569' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: isAnon ? 'italic' : 'normal' }}>
                      {coName}
                    </div>
                    {ctx && (
                      <div style={{ fontSize: 10, color: '#64748b', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ctx}
                      </div>
                    )}
                    <InlineSummary preview={preview} color={color} docUrl={f.url} />
                  </div>

                  {/* Col 3: Date */}
                  <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)', paddingTop: 2 }}>{f.date}</div>

                  {/* Col 4: View link */}
                  <div style={{ paddingTop: 2 }}>
                    <a href={f.url} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 6, background: `${color}15`, color, fontSize: 11, fontFamily: 'monospace', fontWeight: 600, textDecoration: 'none', border: `1px solid ${color}25` }}>
                      View ↗
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-faint)', marginTop: 10, fontFamily: 'monospace' }}>
        Data from SEC EDGAR · Auto-refreshes every {REFRESH_SECS}s
      </p>
    </div>
  );
}
