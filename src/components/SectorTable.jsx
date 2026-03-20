import { STAGE_COLORS } from './StageOverview';

const HEALTH = {
  Strong: { text: 'text-blue-400', label: 'Strong' },
  Healthy: { text: 'text-gray-400', label: 'Healthy' },
  Weak: { text: 'text-pink-400', label: 'Weak' },
};

// Approximate stock counts per sector
const SECTOR_COUNTS = {
  'Technology': 736,
  'Energy': 265,
  'Healthcare': 1162,
  'Financials': 1074,
  'Consumer Discretionary': 512,
  'Industrials': 747,
  'Materials': 281,
  'Utilities': 111,
  'Real Estate': 219,
  'Communication Services': 300,
  'Consumer Staples': 223,
};

const MiniBar = ({ s1, s2, s3, s4 }) => (
  <div className="h-2 flex rounded-full overflow-hidden w-28 sm:w-36">
    {[['S1', s1], ['S2', s2], ['S3', s3], ['S4', s4]].map(([stage, pct]) => (
      <div
        key={stage}
        style={{ width: `${pct}%`, backgroundColor: STAGE_COLORS[stage] }}
        title={`${stage}: ${pct}%`}
      />
    ))}
  </div>
);

export default function SectorTable({ sectors, onSectorClick }) {
  return (
    <div className="panel">
      <div className="panel-title">Sector Stage Analysis</div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[480px]">
          <thead>
            <tr className="border-b border-[#1e2130]">
              <th className="text-left pb-2 pr-3 text-gray-600 font-medium uppercase tracking-wider">Sector</th>
              <th className="text-left pb-2 pr-3 text-gray-600 font-medium uppercase tracking-wider">Distribution</th>
              <th className="text-center pb-2 px-1 text-gray-600 font-medium uppercase tracking-wider">S1</th>
              <th className="text-center pb-2 px-1 text-gray-600 font-medium uppercase tracking-wider">S2</th>
              <th className="text-center pb-2 px-1 text-gray-600 font-medium uppercase tracking-wider">S3</th>
              <th className="text-center pb-2 px-1 text-gray-600 font-medium uppercase tracking-wider">S4</th>
              <th className="text-left pb-2 pl-2 text-gray-600 font-medium uppercase tracking-wider">Health</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#141720]">
            {sectors.map((row) => {
              const count = SECTOR_COUNTS[row.sector] || '—';
              return (
                <tr key={row.sector} className="hover:bg-[#161a24] transition-colors group">
                  <td className="py-2.5 pr-3">
                    <button
                      onClick={() => onSectorClick(row.sector)}
                      className="text-left text-gray-300 hover:text-white group-hover:text-blue-400 transition-colors font-medium"
                    >
                      {row.sector}
                      <span className="text-gray-600 font-normal ml-1">({count})</span>
                    </button>
                  </td>
                  <td className="py-2.5 pr-3">
                    <MiniBar s1={row.s1} s2={row.s2} s3={row.s3} s4={row.s4} />
                  </td>
                  <td className="py-2.5 px-1 text-center font-mono text-gray-500">{row.s1}%</td>
                  <td className="py-2.5 px-1 text-center font-mono text-blue-400">{row.s2}%</td>
                  <td className="py-2.5 px-1 text-center font-mono text-amber-400">{row.s3}%</td>
                  <td className="py-2.5 px-1 text-center font-mono text-pink-400">{row.s4}%</td>
                  <td className="py-2.5 pl-2">
                    <span className={`font-semibold ${HEALTH[row.health].text}`}>
                      {HEALTH[row.health].label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
