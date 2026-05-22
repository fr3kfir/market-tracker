import { useState, useEffect, useCallback } from 'react';
import { SECTOR_STOCKS, INDUSTRY_GROUPS } from '../data/stockUniverse';
import MiniChart from './MiniChart';

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
const TABS = ['Overview', 'Chart', 'Fundamentals', 'News', 'SEC'];
const CHART_RANGES = ['1W', '1M', '3M'];
const STAGE_COLORS = { S1: '#94a3b8', S2: '#60a5fa', S3: '#f59e0b', S4: '#f472b6' };
const RS_COLOR = rs => rs >= 80 ? '#10b981' : rs >= 60 ? '#3b82f6' : rs >= 40 ? '#f59e0b' : '#e879f9';
const FORM_COLORS = { '8-K': '#f59e0b', '10-K': '#60a5fa', '10-Q': '#34d399', 'S-1': '#e879f9' };

function FundRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'monospace' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace', color: color || 'var(--text)' }}>
        {value != null ? value : '—'}
      </span>
    </div>
  );
}

export default function TickerInfoPopup({ ticker: initTicker, stock: initStock, onClose, allStocks = [], onClip }) {
  const [tab, setTab] = useState('Overview');
  const [chartRange, setChartRange] = useState('3M');

  const [navIdx, setNavIdx] = useState(() => {
    const i = allStocks.findIndex(s => s.ticker === initTicker);
    return i >= 0 ? i : -1;
  });

  const currentStock = navIdx >= 0 ? allStocks[navIdx] : initStock;
  const ticker = currentStock?.ticker || initTicker;

  const [news, setNews] = useState(null);
  const [newsLoading, setNewsLoading] = useState(false);
  const [secFilings, setSecFilings] = useState(null);
  const [secLoading, setSecLoading] = useState(false);
  const [secEdgarUrl, setSecEdgarUrl] = useState(null);

  const resetFetched = () => { setNews(null); setSecFilings(null); setSecEdgarUrl(null); };

  const navigate = useCallback((dir) => {
    if (allStocks.length === 0) return;
    setNavIdx(i => {
      const next = (i >= 0 ? i : 0) + dir;
      if (next < 0 || next >= allStocks.length) return i;
      return next;
    });
    resetFetched();
  }, [allStocks.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = e => {
      if (e.key === 'ArrowRight') navigate(1);
      else if (e.key === 'ArrowLeft') navigate(-1);
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, onClose]);

  useEffect(() => {
    if (tab !== 'News' || news !== null) return;
    setNewsLoading(true);
    fetch(`/api/news?ticker=${ticker}`)
      .then(r => r.json())
      .then(d => setNews(d.news || []))
      .catch(() => setNews([]))
      .finally(() => setNewsLoading(false));
  }, [tab, ticker, news]);

  useEffect(() => {
    if (tab !== 'SEC' || secFilings !== null) return;
    setSecLoading(true);
    fetch(`/api/sec-ticker?ticker=${ticker}`)
      .then(r => r.json())
      .then(d => { setSecFilings(d.filings || []); setSecEdgarUrl(d.edgarUrl); })
      .catch(() => setSecFilings([]))
      .finally(() => setSecLoading(false));
  }, [tab, ticker, secFilings]);

  const info = TICKER_LOOKUP[ticker?.toUpperCase()];
  const groups = info ? INDUSTRY_GROUPS.filter(g => info.groups.includes(g.name)) : [];
  const cs = currentStock;
  const canPrev = navIdx > 0;
  const canNext = navIdx >= 0 && navIdx < allStocks.length - 1;

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div style={{ background: 'var(--bg-panel)', borderRadius: 16, width: '92%', maxWidth: 520, maxHeight: '90vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', overflow: 'hidden' }}>

        {/* ── Header ── */}
        <div style={{ padding: '16px 20px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => navigate(-1)} disabled={!canPrev} style={{ background: 'none', border: 'none', cursor: canPrev ? 'pointer' : 'default', color: canPrev ? 'var(--text-muted)' : 'var(--border)', fontSize: 22, padding: '0 4px', lineHeight: 1, flexShrink: 0 }}>‹</button>

            <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 800, color: '#60a5fa' }}>{ticker}</span>
                {cs?.stage && (
                  <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: STAGE_COLORS[cs.stage], background: `${STAGE_COLORS[cs.stage]}22`, padding: '2px 7px', borderRadius: 5 }}>{cs.stage}</span>
                )}
                {onClip && (
                  <button onClick={() => onClip(ticker, cs?.name || ticker)} title="Add to Clipboard" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: '0 2px', color: 'var(--text-faint)' }}>📋</button>
                )}
              </div>
              {cs?.name && cs.name !== ticker && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320, margin: '2px auto 0' }}>{cs.name}</div>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 6, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                {cs?.price != null && (
                  <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>${cs.price.toFixed(2)}</span>
                )}
                {cs?.change != null && (
                  <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: cs.change >= 0 ? '#34d399' : '#f87171', background: cs.change >= 0 ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)', padding: '2px 8px', borderRadius: 20 }}>
                    {cs.change >= 0 ? '+' : ''}{cs.change.toFixed(2)}%
                  </span>
                )}
                {cs?.rs != null && (
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: RS_COLOR(cs.rs), fontWeight: 700 }}>RS {cs.rs}</span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
              <button onClick={() => navigate(1)} disabled={!canNext} style={{ background: 'none', border: 'none', cursor: canNext ? 'pointer' : 'default', color: canNext ? 'var(--text-muted)' : 'var(--border)', fontSize: 22, padding: '0 4px', lineHeight: 1 }}>›</button>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', fontSize: 22, lineHeight: 1, paddingLeft: 6 }}>×</button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', marginTop: 14, borderBottom: '1px solid var(--border)' }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '7px 2px', fontSize: 11, fontWeight: tab === t ? 700 : 500, fontFamily: 'monospace',
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: tab === t ? '#3b82f6' : 'var(--text-muted)',
                borderBottom: tab === t ? '2px solid #3b82f6' : '2px solid transparent',
                transition: 'all 0.12s',
              }}>{t}</button>
            ))}
          </div>
        </div>

        {/* ── Tab content ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

          {/* OVERVIEW */}
          {tab === 'Overview' && (
            !info ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-faint)', fontFamily: 'monospace', fontSize: 12 }}>No sector/group data for {ticker}</div>
            ) : (
              <>
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-faint)', marginBottom: 8 }}>Sector</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {info.sectors.map(s => (
                      <span key={s} style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, background: 'rgba(59,130,246,0.18)', color: '#93c5fd', padding: '5px 14px', borderRadius: 20, border: '1px solid rgba(59,130,246,0.3)' }}>📂 {s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-faint)', marginBottom: 8 }}>Industry Groups ({groups.length})</div>
                  {groups.length === 0 ? (
                    <div style={{ color: 'var(--text-faint)', fontFamily: 'monospace', fontSize: 11 }}>No group data</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {groups.map(g => (
                        <div key={g.name} style={{ background: 'var(--bg)', borderRadius: 10, padding: '9px 14px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{g.name}</span>
                          <span style={{ fontSize: 10, background: 'rgba(99,102,241,0.12)', color: '#818cf8', padding: '2px 8px', borderRadius: 20 }}>{g.tickers.length} stocks</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )
          )}

          {/* CHART */}
          {tab === 'Chart' && (
            <div>
              <div style={{ display: 'flex', gap: 5, marginBottom: 12, justifyContent: 'center' }}>
                {CHART_RANGES.map(r => (
                  <button key={r} onClick={() => setChartRange(r)} style={{
                    padding: '4px 14px', fontSize: 11, fontFamily: 'monospace', fontWeight: 600,
                    borderRadius: 20, border: '1px solid', cursor: 'pointer',
                    borderColor: chartRange === r ? '#a78bfa' : 'var(--border)',
                    background: chartRange === r ? 'rgba(167,139,250,0.15)' : 'transparent',
                    color: chartRange === r ? '#a78bfa' : 'var(--text-muted)',
                  }}>{r}</button>
                ))}
              </div>
              <MiniChart ticker={ticker} range={chartRange} height={280} />
            </div>
          )}

          {/* FUNDAMENTALS */}
          {tab === 'Fundamentals' && (
            cs ? (
              <div>
                <FundRow label="Price" value={cs.price != null ? `$${cs.price.toFixed(2)}` : null} />
                <FundRow label="Change Today" value={cs.change != null ? `${cs.change >= 0 ? '+' : ''}${cs.change.toFixed(2)}%` : null} color={cs.change >= 0 ? '#34d399' : '#f87171'} />
                <FundRow label="RS Rating" value={cs.rs} color={cs.rs != null ? RS_COLOR(cs.rs) : undefined} />
                <FundRow label="Stage" value={cs.stage} color={cs.stage ? STAGE_COLORS[cs.stage] : undefined} />
                <FundRow label="Market Cap" value={cs.marketCapB != null ? `$${cs.marketCapB >= 1000 ? (cs.marketCapB / 1000).toFixed(1) + 'T' : cs.marketCapB.toFixed(0) + 'B'}` : null} />
                <FundRow label="P/E (TTM)" value={cs.pe != null ? cs.pe.toFixed(1) : null} />
                <FundRow label="Forward P/E" value={cs.fpe != null ? cs.fpe.toFixed(1) : null} />
                <FundRow label="EPS (TTM)" value={cs.eps != null ? `$${cs.eps.toFixed(2)}` : null} />
                <FundRow label="EPS Forward" value={cs.epsF != null ? `$${cs.epsF.toFixed(2)}` : null} />
                <FundRow label="P/S" value={cs.ps != null ? cs.ps.toFixed(1) : null} />
                <FundRow label="P/B" value={cs.pb != null ? cs.pb.toFixed(1) : null} />
                <FundRow label="Beta" value={cs.beta != null ? cs.beta.toFixed(2) : null} />
                <FundRow label="52w High" value={cs.high52 != null ? `$${cs.high52.toFixed(2)}` : null} />
                <FundRow label="52w Low" value={cs.low52 != null ? `$${cs.low52.toFixed(2)}` : null} />
                <FundRow label="% from 52w High" value={cs.distSma52wHigh != null ? `${cs.distSma52wHigh >= 0 ? '+' : ''}${cs.distSma52wHigh.toFixed(1)}%` : null} color={cs.distSma52wHigh != null ? (cs.distSma52wHigh >= -5 ? '#34d399' : cs.distSma52wHigh >= -15 ? '#f59e0b' : '#f87171') : undefined} />
                <FundRow label="Vol Buzz" value={cs.volBuzz != null ? `${cs.volBuzz.toFixed(1)}×` : null} color={cs.volBuzz >= 1.5 ? '#f59e0b' : undefined} />
                {cs.earningsDate && <FundRow label="Next Earnings" value={cs.earningsDate} color="#a78bfa" />}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-faint)', fontFamily: 'monospace', fontSize: 12 }}>No fundamental data available</div>
            )
          )}

          {/* NEWS */}
          {tab === 'News' && (
            newsLoading ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-faint)', fontFamily: 'monospace', fontSize: 12 }}>Loading news…</div>
            ) : !news || news.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-faint)', fontFamily: 'monospace', fontSize: 12 }}>No news found for {ticker}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {news.map((n, i) => (
                  <a key={i} href={n.link} target="_blank" rel="noopener noreferrer"
                    style={{ textDecoration: 'none', display: 'block', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 14px', transition: 'border-color 0.12s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', lineHeight: 1.5, marginBottom: 6 }}>{n.title}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: '#3b82f6', fontFamily: 'monospace', fontWeight: 600 }}>{n.publisher}</span>
                      {n.time && <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>· {new Date(n.time * 1000).toLocaleDateString()}</span>}
                    </div>
                  </a>
                ))}
              </div>
            )
          )}

          {/* SEC FILINGS */}
          {tab === 'SEC' && (
            secLoading ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-faint)', fontFamily: 'monospace', fontSize: 12 }}>Loading filings…</div>
            ) : !secFilings || secFilings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-faint)', fontFamily: 'monospace', fontSize: 12 }}>
                No filings found.{' '}
                <a href={`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${ticker}&type=&dateb=&owner=include&count=40`} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa' }}>Search EDGAR ↗</a>
              </div>
            ) : (
              <div>
                {secEdgarUrl && (
                  <div style={{ marginBottom: 12 }}>
                    <a href={secEdgarUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#60a5fa', fontFamily: 'monospace', textDecoration: 'none' }}>All filings on EDGAR ↗</a>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {secFilings.map((f, i) => (
                    <div key={i} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                          <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: FORM_COLORS[f.form] || '#94a3b8', background: `${FORM_COLORS[f.form] || '#94a3b8'}18`, padding: '2px 6px', borderRadius: 4 }}>{f.form}</span>
                          <span style={{ fontSize: 10, color: 'var(--text-faint)', fontFamily: 'monospace' }}>{f.date}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>{f.title || f.accNo}</div>
                      </div>
                      <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ padding: '5px 12px', borderRadius: 7, background: 'rgba(59,130,246,0.15)', color: '#60a5fa', fontSize: 11, fontFamily: 'monospace', fontWeight: 600, textDecoration: 'none', flexShrink: 0, border: '1px solid rgba(59,130,246,0.3)', whiteSpace: 'nowrap' }}>View ↗</a>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

        </div>
      </div>
    </div>
  );
}
