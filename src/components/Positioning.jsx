import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ComposedChart, Bar, XAxis, YAxis, Tooltip, Legend, ReferenceLine,
  ResponsiveContainer, BarChart,
} from 'recharts';

const CONTRACTS = [
  { key: 'ES',  label: 'S&P 500 E-Mini (ES)' },
  { key: 'NQ',  label: 'Nasdaq-100 E-Mini (NQ)' },
  { key: 'YM',  label: 'Dow E-Mini (YM)' },
  { key: 'RTY', label: 'Russell 2000 E-Mini (RTY)' },
  { key: 'VIX', label: 'VIX Futures' },
  { key: 'GC',  label: 'Gold (GC)' },
  { key: 'SI',  label: 'Silver (SI)' },
  { key: 'CL',  label: 'Crude Oil WTI (CL)' },
  { key: 'NG',  label: 'Natural Gas (NG)' },
  { key: 'DX',  label: 'US Dollar Index (DX)' },
  { key: 'ZN',  label: '10-Yr T-Note (ZN)' },
  { key: 'ZB',  label: '30-Yr T-Bond (ZB)' },
  { key: 'BTC', label: 'Bitcoin (BTC)' },
];

const RANGES = [
  { key: '1y', label: '1Y', weeks: 52 },
  { key: '2y', label: '2Y', weeks: 104 },
  { key: '3y', label: '3Y', weeks: 156 },
  { key: '5y', label: '5Y', weeks: 260 },
];

const LARGE_COLOR = '#fbbf24'; // Large Specs — yellow
const COMM_COLOR  = '#f472b6'; // Commercials — pink
const SMALL_COLOR = '#60a5fa'; // Small Specs — blue
const OI_COLOR     = '#22c55e'; // Open Interest — green

function fmt(n) {
  return n.toLocaleString('en-US');
}

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

function CotTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border-hi)',
      borderRadius: 8, padding: '8px 10px', fontSize: 11, fontFamily: 'monospace',
    }}>
      <div style={{ color: 'var(--text-faint)', marginBottom: 4 }}>{fmtDate(label)}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color, fontWeight: 700 }}>
          {p.name}: {p.value >= 0 ? '+' : ''}{fmt(p.value)}
        </div>
      ))}
    </div>
  );
}

function OiTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border-hi)',
      borderRadius: 8, padding: '8px 10px', fontSize: 11, fontFamily: 'monospace',
    }}>
      <div style={{ color: 'var(--text-faint)', marginBottom: 4 }}>{fmtDate(label)}</div>
      <div style={{ color: OI_COLOR, fontWeight: 700 }}>Open Interest: {fmt(payload[0].value)}</div>
    </div>
  );
}

function LegendRow({ label, color, net }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color }}>
        {net >= 0 ? '+' : ''}{fmt(net)}
      </span>
    </div>
  );
}

export default function Positioning() {
  const [contract, setContract] = useState('ES');
  const [range, setRange] = useState('1y');
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (key) => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/cot?contract=${key}`);
      if (!r.ok) throw new Error(`API ${r.status}`);
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      setRows(data.rows || []);
    } catch (e) {
      setError(e.message);
      setRows(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(contract); }, [contract, load]);

  const weeks = RANGES.find(r => r.key === range)?.weeks ?? 52;
  const data = useMemo(() => (rows || []).slice(-weeks), [rows, weeks]);
  const latest = data.length ? data[data.length - 1] : null;
  const contractLabel = CONTRACTS.find(c => c.key === contract)?.label || contract;

  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '12px 14px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-faint)' }}>
            Commitment of Traders
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>
            {contractLabel} · Net Positioning
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select
            value={contract}
            onChange={e => setContract(e.target.value)}
            style={{
              fontSize: 11, fontWeight: 600, padding: '5px 8px', borderRadius: 7,
              border: '1px solid var(--border)', background: 'var(--bg-elevated)',
              color: 'var(--text)', cursor: 'pointer',
            }}
          >
            {CONTRACTS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 4 }}>
            {RANGES.map(r => (
              <button
                key={r.key}
                className={`theme-btn${range === r.key ? ' active' : ''}`}
                onClick={() => setRange(r.key)}
                style={{ padding: '4px 10px' }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 14px' }}>
        {loading && !rows && (
          <div style={{ padding: '40px 0', textAlign: 'center', fontSize: 11, color: 'var(--text-faint)' }}>
            Loading CFTC data…
          </div>
        )}
        {error && (
          <div style={{ padding: '12px 0', fontSize: 11, color: 'var(--red)' }}>
            ⚠ {error} — CFTC's public API can be slow to respond, try again in a moment.
          </div>
        )}
        {!loading && !error && data.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center', fontSize: 11, color: 'var(--text-faint)' }}>
            No positioning data available for this contract.
          </div>
        )}

        {data.length > 0 && (
          <>
            {/* Latest net positioning legend */}
            {latest && (
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 10 }}>
                <LegendRow label="Large Specs" color={LARGE_COLOR} net={latest.largeSpecsNet} />
                <LegendRow label="Commercials" color={COMM_COLOR} net={latest.commercialsNet} />
                <LegendRow label="Small Specs" color={SMALL_COLOR} net={latest.smallSpecsNet} />
                <span style={{ fontSize: 10, color: 'var(--text-faint)', fontFamily: 'monospace' }}>
                  as of {fmtDate(latest.date)}
                </span>
              </div>
            )}

            {/* Net positioning grouped bars */}
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  tickFormatter={fmtDate}
                  tick={{ fontSize: 9, fill: 'var(--text-faint)' }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--border)' }}
                  interval={Math.max(0, Math.floor(data.length / 8))}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: 'var(--text-faint)' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                />
                <ReferenceLine y={0} stroke="var(--border-hi)" />
                <Tooltip content={<CotTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 10 }}
                  formatter={(value) => <span style={{ color: 'var(--text-muted)' }}>{value}</span>}
                />
                <Bar dataKey="largeSpecsNet" name="Large Specs" fill={LARGE_COLOR} radius={[1, 1, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="commercialsNet" name="Commercials" fill={COMM_COLOR} radius={[1, 1, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="smallSpecsNet" name="Small Specs" fill={SMALL_COLOR} radius={[1, 1, 0, 0]} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>

            {/* Open interest */}
            <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-faint)', margin: '10px 0 4px' }}>
              Open Interest
            </div>
            <ResponsiveContainer width="100%" height={90}>
              <BarChart data={data} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
                <XAxis dataKey="date" hide />
                <YAxis
                  tick={{ fontSize: 9, fill: 'var(--text-faint)' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                />
                <Tooltip content={<OiTooltip />} />
                <Bar dataKey="openInterest" fill={OI_COLOR} radius={[1, 1, 0, 0]} fillOpacity={0.75} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}

        <p style={{ fontSize: 9, color: 'var(--text-faint)', marginTop: 10, fontFamily: 'monospace' }}>
          Source: CFTC Commitment of Traders · Legacy Report (Futures Only) · Published weekly, Fridays 3:30pm ET
        </p>
      </div>
    </div>
  );
}
