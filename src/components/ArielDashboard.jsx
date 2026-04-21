import { useMemo } from 'react';
import { INDUSTRY_GROUPS } from '../data/stockUniverse';

// ── Market verdict ──────────────────────────────────────────────────────────
function marketVerdict(s2pct, pctUp) {
  if (s2pct >= 50 && pctUp >= 55) return { label: 'BULLISH',  color: '#22c55e', bg: '#22c55e18' };
  if (s2pct >= 35 && pctUp >= 45) return { label: 'NEUTRAL',  color: '#f59e0b', bg: '#f59e0b18' };
  return                                  { label: 'BEARISH',  color: '#f87171', bg: '#f8717118' };
}

// ── RS badge ────────────────────────────────────────────────────────────────
function RSBadge({ rs }) {
  const color = rs >= 90 ? '#22c55e' : rs >= 80 ? '#86efac' : rs >= 70 ? '#3b82f6' : '#94a3b8';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 28, height: 20, borderRadius: 4, padding: '0 4px',
      background: color + '18', color, fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
    }}>{rs}</span>
  );
}

// ── Stage badge ─────────────────────────────────────────────────────────────
function StageBadge({ stage }) {
  const colors = { S1: '#94a3b8', S2: '#3b82f6', S3: '#f59e0b', S4: '#f87171' };
  const c = colors[stage] || '#94a3b8';
  return (
    <span style={{
      fontSize: 10, padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', fontWeight: 700,
      background: c + '22', border: `1px solid ${c}44`, color: c,
    }}>{stage}</span>
  );
}

// ── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ step, title, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
        background: '#3b82f620', border: '1px solid #3b82f644',
        color: '#3b82f6', fontSize: 11, fontWeight: 700, fontFamily: 'monospace',
      }}>{step}</span>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{title}</div>
        {sub && <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function ArielDashboard({ breadth, stageDist, industryGroupData, stocksByTicker, onGroupClick, onStockClick }) {

  // ── Flat Base candidates ────────────────────────────────────────────────
  const flatBaseCandidates = useMemo(() => {
    if (!stocksByTicker || !industryGroupData) return [];

    // Tickers in top 20 groups
    const top20Names = new Set(industryGroupData.slice(0, 20).map(g => g.name));
    const top20Tickers = new Set(
      INDUSTRY_GROUPS
        .filter(g => top20Names.has(g.name))
        .flatMap(g => g.tickers)
    );

    // Group name lookup per ticker
    const tickerToGroup = {};
    INDUSTRY_GROUPS.forEach(g => {
      if (top20Names.has(g.name)) {
        g.tickers.forEach(t => { if (!tickerToGroup[t]) tickerToGroup[t] = g.name; });
      }
    });

    return Object.values(stocksByTicker)
      .filter(s => {
        if (s.stage !== 'S2') return false;
        if (s.rs < 80) return false;
        if (!s.high52 || s.price <= 0) return false;
        const distFromHigh = ((s.high52 - s.price) / s.high52) * 100;
        if (distFromHigh > 10) return false;
        if (!top20Tickers.has(s.ticker)) return false;
        return true;
      })
      .map(s => ({
        ...s,
        distFromHigh: Math.round(((s.high52 - s.price) / s.high52) * 100 * 10) / 10,
        groupName: tickerToGroup[s.ticker] || '—',
      }))
      .sort((a, b) => b.rs - a.rs)
      .slice(0, 20);
  }, [stocksByTicker, industryGroupData]);

  if (!breadth || !stageDist || !industryGroupData) {
    return (
      <div className="panel" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>
        Loading Ariel's Dashboard…
      </div>
    );
  }

  const verdict = marketVerdict(stageDist.S2, breadth.pctUp);
  const top5Groups = industryGroupData.slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── Header ── */}
      <div style={{
        background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12,
        padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
      }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-faint)', marginBottom: 4 }}>
            Ariel's Daily Routine
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Market → Groups → Flat Base Breakouts
          </div>
        </div>
        <div style={{
          padding: '6px 16px', borderRadius: 8,
          background: verdict.bg, border: `1px solid ${verdict.color}44`,
          color: verdict.color, fontSize: 13, fontWeight: 700, letterSpacing: '0.05em',
        }}>
          {verdict.label}
        </div>
      </div>

      {/* ── Step 1: Market Health ── */}
      <div className="panel">
        <SectionHeader step="1" title="Market Health" sub="האם השוק מאפשר Long היום?" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
          {[
            { label: 'Stage 2',      value: `${stageDist.S2}%`,         color: stageDist.S2 >= 50 ? '#22c55e' : stageDist.S2 >= 35 ? '#f59e0b' : '#f87171', note: stageDist.S2 >= 50 ? 'Strong' : stageDist.S2 >= 35 ? 'Neutral' : 'Weak' },
            { label: 'Advancing',    value: `${breadth.pctUp}%`,         color: breadth.pctUp >= 55 ? '#22c55e' : breadth.pctUp >= 45 ? '#f59e0b' : '#f87171', note: `${breadth.advancing} stocks` },
            { label: 'New Highs',    value: breadth.newHighs,             color: breadth.newHighs > breadth.newLows ? '#22c55e' : '#f87171', note: `vs ${breadth.newLows} lows` },
            { label: 'Up +4%',       value: breadth.up4,                  color: breadth.up4 > breadth.down4 ? '#22c55e' : '#f87171', note: `vs ${breadth.down4} down` },
          ].map(item => (
            <div key={item.label} style={{
              background: 'var(--bg)', borderRadius: 8, padding: '12px 14px',
              border: `1px solid ${item.color}33`,
            }}>
              <div style={{ fontSize: 9, color: 'var(--text-faint)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{item.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'monospace', color: item.color, lineHeight: 1 }}>{item.value}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{item.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Step 2: Leading Groups ── */}
      <div className="panel">
        <SectionHeader step="2" title="Leading Groups" sub="כסף מוסדי — איפה הוא זורם?" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {top5Groups.map((g, i) => {
            const changeColor = g.change > 0 ? '#22c55e' : g.change < 0 ? '#f87171' : 'var(--text-muted)';
            return (
              <div
                key={g.name}
                onClick={() => onGroupClick(g)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                  background: i === 0 ? '#3b82f608' : 'transparent',
                  border: i === 0 ? '1px solid #3b82f622' : '1px solid transparent',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = i === 0 ? '#3b82f608' : 'transparent'}
              >
                <span style={{ fontSize: 10, color: '#3b82f6', fontFamily: 'monospace', fontWeight: 700, width: 16 }}>#{g.rank}</span>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{g.name}</span>
                <RSBadge rs={g.avgRS} />
                <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: changeColor, width: 52, textAlign: 'right' }}>
                  {g.change > 0 ? '+' : ''}{g.change.toFixed(1)}%
                </span>
                <span style={{ fontSize: 9, color: 'var(--text-faint)' }}>→</span>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 10, fontSize: 10, color: 'var(--text-faint)', fontStyle: 'italic' }}>
          לחץ על גרופ לראות Top 10 לידרים
        </div>
      </div>

      {/* ── Step 3: Flat Base Scanner ── */}
      <div className="panel">
        <SectionHeader
          step="3"
          title="Flat Base Scanner"
          sub={`Stage 2 · RS ≥ 80 · Within 10% of 52w High · In Top 20 Groups — ${flatBaseCandidates.length} candidates`}
        />

        {flatBaseCandidates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-faint)', fontSize: 12 }}>
            אין מניות שעומדות בכל הקריטריונים כרגע
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {[
                    { t: 'Ticker',     a: 'left'   },
                    { t: 'RS',         a: 'center' },
                    { t: 'Stage',      a: 'center' },
                    { t: '% from High',a: 'right'  },
                    { t: 'Vol',        a: 'center' },
                    { t: 'Today',      a: 'right'  },
                    { t: 'Group',      a: 'left', cls: 'hidden sm:table-cell'  },
                  ].map(col => (
                    <th key={col.t} className={col.cls || ''} style={{
                      paddingBottom: 8, paddingLeft: 6, paddingRight: 6,
                      textAlign: col.a, fontSize: 9, color: 'var(--text-faint)',
                      fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                    }}>{col.t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {flatBaseCandidates.map(s => {
                  const changeColor = s.change > 0 ? '#22c55e' : s.change < 0 ? '#f87171' : 'var(--text-muted)';
                  const volColor    = s.volBuzz >= 2 ? '#3b82f6' : s.volBuzz >= 1.5 ? '#38bdf8' : 'var(--text-muted)';
                  return (
                    <tr
                      key={s.ticker}
                      onClick={() => onStockClick && onStockClick(s)}
                      style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.12s', cursor: 'default' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '9px 6px' }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text)', fontSize: 12 }}>{s.ticker}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 1 }}>${s.price.toFixed(2)}</div>
                      </td>
                      <td style={{ padding: '9px 6px', textAlign: 'center' }}><RSBadge rs={s.rs} /></td>
                      <td style={{ padding: '9px 6px', textAlign: 'center' }}><StageBadge stage={s.stage} /></td>
                      <td style={{ padding: '9px 6px', textAlign: 'right', fontFamily: 'monospace', fontSize: 11 }}>
                        <span style={{ color: s.distFromHigh <= 3 ? '#22c55e' : s.distFromHigh <= 7 ? '#f59e0b' : 'var(--text-muted)' }}>
                          -{s.distFromHigh}%
                        </span>
                      </td>
                      <td style={{ padding: '9px 6px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, color: volColor, fontSize: 11 }}>
                        {s.volBuzz.toFixed(1)}x
                      </td>
                      <td style={{ padding: '9px 6px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: changeColor, fontSize: 11 }}>
                        {s.change > 0 ? '+' : ''}{s.change.toFixed(2)}%
                      </td>
                      <td className="hidden sm:table-cell" style={{ padding: '9px 6px', color: 'var(--text-faint)', fontSize: 10, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.groupName}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend */}
        <div style={{ marginTop: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            { color: '#22c55e', label: '0-3% from high — Breakout zone' },
            { color: '#f59e0b', label: '3-7% — Consolidation' },
            { color: '#94a3b8', label: '7-10% — Extended but valid' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color, flexShrink: 0 }} />
              <span style={{ fontSize: 9, color: 'var(--text-faint)' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
