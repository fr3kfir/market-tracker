import { useState, useMemo } from 'react';
import { SECTOR_ETFS, HEAVYWEIGHTS, THEME_ETFS, HOT_THEMES, MONITOR_ETF_SYMBOLS } from '../data/stockUniverse';

// Deepvue-style palette: blue = strength, pink = weakness
const BLUE = '#3b82f6';
const PINK = '#ec4899';
const STAGE_META = [
  { key: 'S1', label: 'Stage 1', color: '#64748b' },
  { key: 'S2', label: 'Stage 2', color: BLUE },
  { key: 'S3', label: 'Stage 3', color: '#eab308' },
  { key: 'S4', label: 'Stage 4', color: PINK },
];

const ETF_SET = new Set([...Object.values(THEME_ETFS), ...HOT_THEMES.map(t => t.etf), ...MONITOR_ETF_SYMBOLS, 'SPY']);

const THEME_TIMEFRAMES = [
  { key: 'd1',  label: 'Today' },
  { key: 'w1',  label: '1W' },
  { key: 'm1',  label: '1M' },
  { key: 'm3',  label: '3M' },
  { key: 'ytd', label: 'YTD' },
];

function Panel({ title, children, right }) {
  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{
        padding: '10px 14px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{title}</span>
        {right}
      </div>
      <div style={{ padding: '12px 14px' }}>{children}</div>
    </div>
  );
}

// ── "New Highs vs New Lows"-style dual bar ──────────────────────────────
function DualBar({ title, left, right, leftLabel, rightLabel }) {
  const total = left + right;
  const pct = total > 0 ? (left / total) * 100 : 50;
  const color = pct >= 50 ? BLUE : PINK;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{title}</span>
        <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'monospace', color }}>{pct.toFixed(1)}%</span>
      </div>
      <div style={{ height: 9, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.4s' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{left.toLocaleString()} {leftLabel}</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{right.toLocaleString()} {rightLabel}</span>
      </div>
    </div>
  );
}

// ── Stage Analysis stacked bar + legend ─────────────────────────────────
function StageAnalysis({ counts }) {
  const total = STAGE_META.reduce((s, m) => s + (counts[m.key] || 0), 0) || 1;
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Stage Analysis</div>
      <div style={{ display: 'flex', height: 9, borderRadius: 99, overflow: 'hidden', background: 'var(--border)' }}>
        {STAGE_META.map(m => (
          <div key={m.key} style={{ width: `${((counts[m.key] || 0) / total) * 100}%`, background: m.color }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 9 }}>
        {STAGE_META.map(m => (
          <div key={m.key}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{m.label}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', marginLeft: 13 }}>
              {(counts[m.key] || 0).toLocaleString()} · {Math.round(((counts[m.key] || 0) / total) * 100)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Left-anchored performance bar row (Sectors / Heavyweights / ETFs) ───
function BarRow({ label, value, max, onClick }) {
  const color = value >= 0 ? BLUE : PINK;
  const width = max > 0 ? Math.max(2, (Math.abs(value) / max) * 100) : 0;
  return (
    <div
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3.5px 0', cursor: onClick ? 'pointer' : 'default' }}
    >
      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 11, color: 'var(--text)', width: 46, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 12, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${width}%`, background: color, borderRadius: 4, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 11, color, width: 58, textAlign: 'right', flexShrink: 0 }}>
        {value >= 0 ? '+' : ''}{value.toFixed(2)}%
      </span>
    </div>
  );
}

// ── Diverging theme bar (Deepvue Theme Tracker) ─────────────────────────
function ThemeRow({ name, value, max, onClick }) {
  const pos = value >= 0;
  const color = pos ? BLUE : PINK;
  const half = max > 0 ? Math.max(1, (Math.abs(value) / max) * 50) : 0;
  return (
    <div
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3.5px 0', cursor: onClick ? 'pointer' : 'default' }}
    >
      <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text)', width: 128, flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {name}
      </span>
      <div style={{ flex: 1, height: 12, borderRadius: 4, background: 'var(--border)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'var(--text-faint)', opacity: 0.35 }} />
        <div style={{
          position: 'absolute', top: 0, bottom: 0,
          left: pos ? '50%' : `${50 - half}%`,
          width: `${half}%`,
          background: color, borderRadius: 4, transition: 'all 0.4s',
        }} />
      </div>
      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 11, color, width: 58, textAlign: 'right', flexShrink: 0 }}>
        {value >= 0 ? '+' : ''}{value.toFixed(2)}%
      </span>
    </div>
  );
}

export default function MarketMonitor({ breadth, stocksByTicker, hotThemeData, onThemeClick }) {
  const [themeTf, setThemeTf] = useState('d1');

  // Stage counts over the live stock universe (ETFs excluded)
  const stageCounts = useMemo(() => {
    const counts = { S1: 0, S2: 0, S3: 0, S4: 0 };
    Object.values(stocksByTicker || {}).forEach(s => {
      if (!ETF_SET.has(s.ticker)) counts[s.stage] = (counts[s.stage] || 0) + 1;
    });
    return counts;
  }, [stocksByTicker]);

  const sectors = useMemo(() => {
    const rows = SECTOR_ETFS
      .map(e => ({ label: e.sym, name: e.name, value: stocksByTicker?.[e.sym]?.change }))
      .filter(r => r.value != null)
      .sort((a, b) => b.value - a.value);
    return { rows, max: Math.max(0.01, ...rows.map(r => Math.abs(r.value))) };
  }, [stocksByTicker]);

  const heavyweights = useMemo(() => {
    const rows = HEAVYWEIGHTS
      .map(t => ({ label: t, value: stocksByTicker?.[t]?.change }))
      .filter(r => r.value != null)
      .sort((a, b) => b.value - a.value);
    return { rows, max: Math.max(0.01, ...rows.map(r => Math.abs(r.value))) };
  }, [stocksByTicker]);

  const thematicEtfs = useMemo(() => {
    const syms = [...new Set([...Object.values(THEME_ETFS), ...HOT_THEMES.map(t => t.etf)])];
    const rows = syms
      .map(t => ({ label: t, value: stocksByTicker?.[t]?.change }))
      .filter(r => r.value != null)
      .sort((a, b) => b.value - a.value);
    return { rows, max: Math.max(0.01, ...rows.map(r => Math.abs(r.value))) };
  }, [stocksByTicker]);

  // Liquid Leaders: biggest % gainers among liquid stocks (≥ $25M avg daily $-vol)
  const liquidLeaders = useMemo(() => {
    const rows = Object.values(stocksByTicker || {})
      .filter(s => !ETF_SET.has(s.ticker) && s.price >= 5 && (s.avgVolume || 0) * s.price >= 25e6)
      .sort((a, b) => b.change - a.change)
      .slice(0, 16)
      .map(s => ({ label: s.ticker, value: s.change }));
    return { rows, max: Math.max(0.01, ...rows.map(r => Math.abs(r.value))) };
  }, [stocksByTicker]);

  const themes = useMemo(() => {
    const rows = (hotThemeData || [])
      .map(t => ({ name: t.theme, value: t[themeTf] }))
      .filter(r => r.value != null)
      .sort((a, b) => b.value - a.value);
    return { rows, max: Math.max(0.01, ...rows.map(r => Math.abs(r.value))) };
  }, [hotThemeData, themeTf]);

  const tfBtn = (active) => ({
    padding: '3px 9px', fontSize: 10, fontWeight: active ? 700 : 500,
    borderRadius: 6, border: 'none',
    background: active ? 'var(--accent-dim)' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--text-faint)',
    cursor: 'pointer', transition: 'all 0.15s',
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3" style={{ alignItems: 'start' }}>
      {/* Col 1 — Breadth */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Panel title="Market Breadth">
          <DualBar title="New Highs vs New Lows" left={breadth.newHighs} right={breadth.newLows} leftLabel="Highs" rightLabel="Lows" />
          <DualBar title="Advance vs Decline" left={breadth.advancing} right={breadth.declining} leftLabel="Advance" rightLabel="Decline" />
          <StageAnalysis counts={stageCounts} />
        </Panel>
        <Panel title="Momentum Breadth">
          <DualBar title="Up from Open vs Down from Open" left={breadth.upFromOpen} right={breadth.downFromOpen} leftLabel="Up" rightLabel="Down" />
          <DualBar title="Up on Volume vs Down on Volume" left={breadth.upOnVol} right={breadth.downOnVol} leftLabel="Up" rightLabel="Down" />
          <div style={{ marginBottom: 0 }}>
            <DualBar title="Up 4% vs Down 4%" left={breadth.up4} right={breadth.down4} leftLabel="Up" rightLabel="Down" />
          </div>
        </Panel>
        <Panel title="Heavyweights">
          {heavyweights.rows.map(r => <BarRow key={r.label} {...r} max={heavyweights.max} />)}
        </Panel>
      </div>

      {/* Col 2 — Theme Tracker */}
      <Panel
        title="Theme Tracker"
        right={
          <div style={{ display: 'flex', gap: 2 }}>
            {THEME_TIMEFRAMES.map(t => (
              <button key={t.key} onClick={() => setThemeTf(t.key)} style={tfBtn(themeTf === t.key)}>{t.label}</button>
            ))}
          </div>
        }
      >
        {themes.rows.map(r => (
          <ThemeRow
            key={r.name}
            name={r.name}
            value={r.value}
            max={themes.max}
            onClick={onThemeClick ? () => onThemeClick(r.name) : undefined}
          />
        ))}
        {themes.rows.length === 0 && (
          <div style={{ fontSize: 11, color: 'var(--text-faint)', textAlign: 'center', padding: '12px 0' }}>Loading themes…</div>
        )}
      </Panel>

      {/* Col 3 — Sectors + Thematic ETFs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Panel title="Sectors">
          {sectors.rows.map(r => <BarRow key={r.label} {...r} max={sectors.max} />)}
        </Panel>
        <Panel title="Thematic ETFs">
          {thematicEtfs.rows.map(r => <BarRow key={r.label} {...r} max={thematicEtfs.max} />)}
        </Panel>
      </div>

      {/* Col 4 — Liquid Leaders */}
      <Panel title="Liquid Leaders">
        <div style={{ fontSize: 9.5, color: 'var(--text-faint)', marginBottom: 6 }}>
          Top movers with ≥ $25M avg daily dollar volume
        </div>
        {liquidLeaders.rows.map(r => <BarRow key={r.label} {...r} max={liquidLeaders.max} />)}
      </Panel>
    </div>
  );
}
