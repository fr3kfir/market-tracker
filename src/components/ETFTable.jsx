import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchQuotesForSymbols, enrichWithHistory } from '../services/marketData';

const REFRESH_MS = 30000;

const COLUMNS = [
  { key: 'changeFromOpen', label: 'Change\nfrom Open' },
  { key: 'change',         label: 'Perf\nDay' },
  { key: 'w1',             label: 'Perf\nWeek' },
  { key: 'm1',             label: 'Perf\nMonth' },
  { key: 'm3',             label: 'Perf\n3M' },
  { key: 'm6',             label: 'Perf\n6M' },
];

function Pct({ val }) {
  if (val === null || val === undefined || Number.isNaN(val)) {
    return <span style={{ color: 'var(--text-faint)' }}>—</span>;
  }
  const isPos = val >= 0;
  return (
    <span style={{ color: isPos ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
      {isPos ? '+' : ''}{val.toFixed(2)}%
    </span>
  );
}

function GainersBanner({ rows }) {
  const gainers = [...rows]
    .filter(r => typeof r.change === 'number')
    .sort((a, b) => b.change - a.change)
    .slice(0, 10);

  if (!gainers.length) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      overflowX: 'auto', padding: '8px 2px 12px',
      borderBottom: '1px solid var(--border)', marginBottom: 12,
    }}>
      <span style={{
        fontSize: 9, fontWeight: 800, letterSpacing: '0.14em',
        color: 'var(--green)', flexShrink: 0, textTransform: 'uppercase',
      }}>
        Gainers
      </span>
      {gainers.map(r => (
        <span key={r.ticker} style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', fontFamily: 'monospace' }}>{r.ticker}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', fontFamily: 'monospace' }}>
            {r.change >= 0 ? '+' : ''}{r.change.toFixed(2)}%
          </span>
        </span>
      ))}
    </div>
  );
}

export default function ETFTable({ etfs }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState('changeFromOpen');
  const [sortDir, setSortDir] = useState('desc');
  const symbolsRef = useRef([]);

  const load = useCallback(async (symbols, nameBySym) => {
    setLoading(true);
    const quotesByTicker = await fetchQuotesForSymbols(symbols);
    const baseRows = Object.values(quotesByTicker).map(q => ({
      ...q,
      name: nameBySym[q.ticker] || q.name,
    }));
    const enriched = await enrichWithHistory(baseRows);
    setRows(enriched);
    setLoading(false);
  }, []);

  useEffect(() => {
    const symbols = etfs.map(e => e.sym);
    const nameBySym = Object.fromEntries(etfs.map(e => [e.sym, e.name]));
    symbolsRef.current = symbols;
    load(symbols, nameBySym);
    const id = setInterval(() => load(symbols, nameBySym), REFRESH_MS);
    return () => clearInterval(id);
  }, [etfs, load]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = [...rows].sort((a, b) => {
    const av = a[sortKey] ?? -Infinity;
    const bv = b[sortKey] ?? -Infinity;
    return sortDir === 'desc' ? bv - av : av - bv;
  });

  if (loading && !rows.length) {
    return (
      <div className="panel" style={{ textAlign: 'center', padding: 30, color: 'var(--text-faint)', fontSize: 11 }}>
        Loading ETF data…
      </div>
    );
  }

  return (
    <div className="panel">
      <GainersBanner rows={rows} />
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[700px]">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th className="text-left pb-2 pr-3 font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Ticker</th>
              <th className="text-left pb-2 pr-3 font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Company</th>
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="text-right pb-2 px-2 font-medium uppercase tracking-wider whitespace-pre-line"
                  style={{ color: sortKey === col.key ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}
                >
                  {col.label} {sortKey === col.key && (sortDir === 'desc' ? '▾' : '▴')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(row => (
              <tr
                key={row.ticker}
                className="data-row"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <td className="py-2.5 pr-3 font-mono font-bold" style={{ color: 'var(--text)' }}>{row.ticker}</td>
                <td className="py-2.5 pr-3 whitespace-nowrap overflow-hidden text-ellipsis max-w-[240px]" style={{ color: 'var(--text-muted)' }}>{row.name}</td>
                <td className="py-2.5 px-2 text-right font-mono"><Pct val={row.changeFromOpen} /></td>
                <td className="py-2.5 px-2 text-right font-mono"><Pct val={row.change} /></td>
                <td className="py-2.5 px-2 text-right font-mono"><Pct val={row.w1} /></td>
                <td className="py-2.5 px-2 text-right font-mono"><Pct val={row.m1} /></td>
                <td className="py-2.5 px-2 text-right font-mono"><Pct val={row.m3} /></td>
                <td className="py-2.5 px-2 text-right font-mono"><Pct val={row.m6} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
