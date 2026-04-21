import { STAGE_COLORS } from './StageOverview';

const HEALTH = {
  Strong: { text: 'text-blue-400', label: 'Strong' },
  Healthy: { text: 'text-gray-400', label: 'Healthy' },
  Weak: { text: 'text-pink-400', label: 'Weak' },
};

const SECTOR_ETFS = {
  'Technology':               'XLK',
  'Energy':                   'XLE',
  'Healthcare':               'XLV',
  'Financials':               'XLF',
  'Consumer Discretionary':   'XLY',
  'Industrials':              'XLI',
  'Materials':                'XLB',
  'Utilities':                'XLU',
  'Real Estate':              'XLRE',
  'Communication Services':   'XLC',
  'Consumer Staples':         'XLP',
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
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th className="text-left pb-2 pr-3 font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Sector</th>
              <th className="text-left pb-2 pr-3 font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Distribution</th>
              <th className="text-center pb-2 px-1 font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>S1</th>
              <th className="text-center pb-2 px-1 font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>S2</th>
              <th className="text-center pb-2 px-1 font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>S3</th>
              <th className="text-center pb-2 px-1 font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>S4</th>
              <th className="text-left pb-2 pl-2 font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Health</th>
            </tr>
          </thead>
          <tbody style={{ borderTop: 'none' }}>
            {sectors.map((row) => {
              const count = SECTOR_COUNTS[row.sector] || '—';
              return (
                <tr
                  key={row.sector}
                  className="transition-colors group"
                  style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td className="py-2.5 pr-3">
                    <button
                      onClick={() => onSectorClick(row.sector)}
                      className="text-left hover:text-sky-400 group-hover:text-sky-400 transition-colors font-medium"
                      style={{ color: 'var(--text)' }}
                    >
                      {row.sector}
                      {SECTOR_ETFS[row.sector] && (
                        <span className="font-mono ml-2" style={{ fontSize: 10, color: '#60a5fa', background: 'rgba(59,130,246,0.12)', padding: '1px 5px', borderRadius: 4 }}>
                          {SECTOR_ETFS[row.sector]}
                        </span>
                      )}
                      <span className="font-normal ml-1" style={{ color: 'var(--text-faint)' }}>({count})</span>
                    </button>
                  </td>
                  <td className="py-2.5 pr-3">
                    <MiniBar s1={row.s1} s2={row.s2} s3={row.s3} s4={row.s4} />
                  </td>
                  <td className="py-2.5 px-1 text-center font-mono" style={{ color: 'var(--text-muted)' }}>{row.s1}%</td>
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
