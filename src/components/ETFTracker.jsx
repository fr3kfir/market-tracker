import { useState } from 'react';
import ThemeTracker from './ThemeTracker';
import ETFTable from './ETFTable';
import { GROUP_ETFS, SP_SECTOR_ETFS, EQUAL_WEIGHT_ETFS, COUNTRY_ETFS } from '../data/stockUniverse';

const SUBTABS = [
  { key: 'theme',   label: 'Theme Tracker' },
  { key: 'group',   label: 'Group ETFs' },
  { key: 'sectors', label: 'S&P Sectors' },
  { key: 'eqw',     label: 'Equal Weight' },
  { key: 'country', label: 'Country ETFs' },
];

export default function ETFTracker({ hotThemeData, onThemeClick }) {
  const [subTab, setSubTab] = useState('group');

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, borderBottom: '1px solid var(--border)' }}>
        {SUBTABS.map(tab => {
          const active = subTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setSubTab(tab.key)}
              style={{
                padding: '8px 14px', fontSize: 12, fontWeight: active ? 700 : 600,
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                background: 'transparent', border: 'none',
                borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
                cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {subTab === 'theme'   && hotThemeData && <ThemeTracker themes={hotThemeData} onThemeClick={onThemeClick} />}
      {subTab === 'group'   && <ETFTable etfs={GROUP_ETFS} />}
      {subTab === 'sectors' && <ETFTable etfs={SP_SECTOR_ETFS} />}
      {subTab === 'eqw'     && <ETFTable etfs={EQUAL_WEIGHT_ETFS} />}
      {subTab === 'country' && <ETFTable etfs={COUNTRY_ETFS} />}
    </div>
  );
}
