import { useState } from 'react';
import { STAGE_COLORS } from './StageOverview';

const STAGE_TEXT = {
  S1: 'text-gray-400',
  S2: 'text-blue-400',
  S3: 'text-amber-400',
  S4: 'text-pink-400',
};

const RS_COLOR = (rs) => {
  if (rs >= 80) return '#10b981';
  if (rs >= 60) return '#3b82f6';
  if (rs >= 40) return '#f59e0b';
  return '#e879f9';
};

export default function LeadersView({ name, stocks, onBack }) {
  const [sortKey, setSortKey] = useState('rs');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sorted = [...stocks].sort((a, b) => {
    const m = sortDir === 'desc' ? -1 : 1;
    return m * (a[sortKey] > b[sortKey] ? 1 : -1);
  });

  const Th = ({ label, field, align = 'left' }) => (
    <th
      className={`pb-3 px-2 text-gray-600 text-xs font-medium uppercase tracking-wider cursor-pointer hover:text-gray-300 transition-colors select-none text-${align}`}
      onClick={() => handleSort(field)}
    >
      {label}{sortKey === field && <span className="ml-1 text-blue-400">{sortDir === 'desc' ? '▼' : '▲'}</span>}
    </th>
  );

  return (
    <div className="min-h-screen" style={{ background: '#070b14' }}>
      {/* Header */}
      <div className="border-b border-[#1a2540] sticky top-0 z-10" style={{ background: '#070b14' }}>
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white border border-[#2a2d3a] hover:border-[#3a3d4a] rounded px-3 py-1.5 transition-all bg-[#161920]"
          >
            ← Dashboard
          </button>
          <div>
            <div className="text-white font-semibold">{name}</div>
            <div className="text-xs text-gray-500">Leaders · sorted by RS Rating</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            <span className="text-xs text-gray-500 font-mono">LIVE</span>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 py-4">
        <div className="panel overflow-x-auto">
          <table className="w-full text-xs min-w-[640px]">
            <thead className="border-b border-[#1a2540]">
              <tr>
                <th className="pb-3 px-2 text-gray-600 text-xs font-medium w-8">#</th>
                <Th label="Ticker" field="ticker" />
                <th className="pb-3 px-2 text-gray-600 text-xs font-medium uppercase tracking-wider text-left">Company</th>
                <Th label="Price" field="price" align="right" />
                <Th label="Chg%" field="change" align="right" />
                <Th label="RS" field="rs" align="center" />
                <Th label="Vol" field="volBuzz" align="center" />
                <Th label="vs 50d" field="distSma50" align="right" />
                <Th label="Stage" field="stage" align="center" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a2540]">
              {sorted.map((s, i) => (
                <tr key={s.ticker} className="hover:bg-[#111e35] transition-colors">
                  <td className="py-2.5 px-2 text-gray-700 font-mono">{i + 1}</td>
                  <td className="py-2.5 px-2">
                    <span className="font-mono font-bold text-white">{s.ticker}</span>
                  </td>
                  <td className="py-2.5 px-2 text-gray-400 max-w-[160px] truncate">{s.name}</td>
                  <td className="py-2.5 px-2 font-mono text-gray-200 text-right">${s.price.toFixed(2)}</td>
                  <td className="py-2.5 px-2 font-mono font-semibold text-right">
                    <span className={s.change >= 0 ? 'text-blue-400' : 'text-pink-400'}>
                      {s.change >= 0 ? '+' : ''}{s.change.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <div className="flex items-center gap-1.5 justify-center">
                      <div className="w-12 h-1.5 rounded bg-[#1e2130] overflow-hidden">
                        <div
                          className="h-full rounded transition-all"
                          style={{ width: `${s.rs}%`, backgroundColor: RS_COLOR(s.rs) }}
                        />
                      </div>
                      <span className="font-mono font-bold w-6 text-right" style={{ color: RS_COLOR(s.rs) }}>
                        {s.rs}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono">
                    <span className={s.volBuzz > 1.5 ? 'text-blue-400 font-bold' : 'text-gray-500'}>
                      {s.volBuzz.toFixed(1)}x
                    </span>
                  </td>
                  <td className="py-2.5 px-2 font-mono text-right">
                    <span className={s.distSma50 >= 0 ? 'text-blue-400' : 'text-pink-400'}>
                      {s.distSma50 >= 0 ? '+' : ''}{s.distSma50.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span
                      className={`font-bold font-mono text-xs px-1.5 py-0.5 rounded ${STAGE_TEXT[s.stage]}`}
                      style={{ background: STAGE_COLORS[s.stage] + '22', border: `1px solid ${STAGE_COLORS[s.stage]}44` }}
                    >
                      {s.stage}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
