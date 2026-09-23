import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

const HIGH = 'var(--green)';
const LOW  = 'var(--red)';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// First trading day of each month → x-axis tick
function monthTicks(rows) {
  const ticks = [];
  rows.forEach((r, i) => {
    if (i === 0 || r.date.slice(0, 7) !== rows[i - 1].date.slice(0, 7)) ticks.push(r.date);
  });
  return ticks;
}
const fmtMonth = d => MONTHS[Number(d.slice(5, 7)) - 1];

function ChartTooltip({ active, payload, label, name, color }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-hi)', borderRadius: 8, padding: '8px 12px', fontFamily: 'monospace' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
        {name}: <b style={{ color: 'var(--text)' }}>{payload[0].value}</b>
      </div>
    </div>
  );
}

function Panel({ title, color, dataKey, rows, ticks, selected, onSelect, diverging }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 12px 4px' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        {!diverging && <span style={{ width: 10, height: 10, borderRadius: 2, background: color }} />}
        {title}
      </div>
      <ResponsiveContainer width="100%" height={diverging ? 160 : 220}>
        <BarChart data={rows} syncId="nhnl" barCategoryGap={1}
          onClick={e => { if (e?.activeLabel) onSelect(e.activeLabel); }}
          style={{ cursor: 'pointer' }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" ticks={ticks} tickFormatter={fmtMonth} interval={0}
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
          <YAxis width={36} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip cursor={{ fill: 'var(--hover)' }}
            content={<ChartTooltip name={title} color={diverging ? 'var(--text-muted)' : color} />} />
          {diverging && <ReferenceLine y={0} stroke="var(--text-faint)" />}
          <Bar dataKey={dataKey} radius={diverging ? 0 : [2, 2, 0, 0]} isAnimationActive={false}>
            {rows.map(r => {
              const c = diverging ? (r.net >= 0 ? HIGH : LOW) : color;
              const dim = selected && r.date !== selected;
              return <Cell key={r.date} fill={c} fillOpacity={dim ? 0.45 : 0.9} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TickerList({ title, color, tickers }) {
  return (
    <div style={{ flex: '1 1 280px', minWidth: 0 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
        {title} <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>({tickers.length})</span>
      </div>
      {tickers.length === 0 ? (
        <div style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'monospace' }}>None</div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, maxHeight: 260, overflowY: 'auto' }}>
          {tickers.map(t => (
            <a key={t} href={`https://www.tradingview.com/chart/?symbol=${t}`} target="_blank" rel="noreferrer"
              style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: 'var(--text)', textDecoration: 'none',
                padding: '3px 7px', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--bg)' }}>
              {t}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HighLowChart({ rows, loading }) {
  const [selected, setSelected] = useState(null);
  const ticks = useMemo(() => (rows ? monthTicks(rows) : []), [rows]);

  if (loading || !rows) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 12 }}>
        Loading 2 years of price history…
      </div>
    );
  }
  if (!rows.length) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No history available.</div>;
  }

  const latest = rows[rows.length - 1];
  const sel = rows.find(r => r.date === selected) || latest;

  return (
    <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '4px 14px' }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0 }}>New 52-Week Highs vs Lows</h2>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
          {latest.date} — Highs: <b style={{ color: 'var(--text)' }}>{latest.highs}</b>
          {' · '}Lows: <b style={{ color: 'var(--text)' }}>{latest.lows}</b>
          {' · '}Net: <b style={{ color: latest.net >= 0 ? HIGH : LOW }}>{latest.net > 0 ? '+' : ''}{latest.net}</b>
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>
          {latest.total} stocks tracked · click any bar to view constituents
        </span>
      </div>

      <Panel title="New 52-Week Highs" color={HIGH} dataKey="highs" rows={rows} ticks={ticks} selected={selected} onSelect={setSelected} />
      <Panel title="New 52-Week Lows"  color={LOW}  dataKey="lows"  rows={rows} ticks={ticks} selected={selected} onSelect={setSelected} />
      <Panel title="Net (Highs − Lows)" dataKey="net" rows={rows} ticks={ticks} selected={selected} onSelect={setSelected} diverging />

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', fontFamily: 'monospace' }}>Constituents — {sel.date}</span>
          {selected && selected !== latest.date && (
            <button onClick={() => setSelected(null)}
              style={{ fontSize: 10, color: 'var(--accent)', background: 'transparent', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 8px', cursor: 'pointer' }}>
              Back to latest
            </button>
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
          <TickerList title="New Highs" color={HIGH} tickers={sel.highTickers} />
          <TickerList title="New Lows"  color={LOW}  tickers={sel.lowTickers} />
        </div>
      </div>
    </div>
  );
}
