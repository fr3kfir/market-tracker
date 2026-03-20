import { useState, useEffect, useCallback, useRef } from 'react';
import MarketBreadth from './components/MarketBreadth';
import MarketTicker from './components/MarketTicker';
import StageOverview from './components/StageOverview';
import SectorTable from './components/SectorTable';
import ThemeTracker from './components/ThemeTracker';
import LeadersView from './components/LeadersView';
import { SECTOR_STOCKS, THEME_STOCKS, THEME_ETFS } from './data/stockUniverse';
import { fetchAllMarketData, getLeaders } from './services/marketData';
import './index.css';

const REFRESH_SECS = 90;

function formatTime(d) {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function RefreshBadge({ countdown, lastUpdated, justRefreshed, loading }) {
  const pct = ((REFRESH_SECS - countdown) / REFRESH_SECS) * 100;
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-6 h-6 flex-shrink-0">
        <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" fill="none" stroke="#1a2540" strokeWidth="2.5" />
          <circle
            cx="12" cy="12" r="9" fill="none"
            stroke={loading ? '#f59e0b' : justRefreshed ? '#34d399' : '#3b82f6'}
            strokeWidth="2.5" strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 9}`}
            strokeDashoffset={`${2 * Math.PI * 9 * (1 - pct / 100)}`}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-gray-500 font-mono" style={{ fontSize: '7px' }}>
          {loading ? '…' : `${countdown}s`}
        </span>
      </div>
      <div className="hidden sm:flex flex-col items-end leading-tight">
        <span className={`text-xs font-mono transition-colors ${loading ? 'text-amber-400' : justRefreshed ? 'text-emerald-400' : 'text-gray-500'}`}>
          {loading ? 'Fetching…' : justRefreshed ? '✓ Updated' : formatTime(lastUpdated)}
        </span>
        <span className="text-gray-700 font-mono" style={{ fontSize: '10px' }}>last update</span>
      </div>
    </div>
  );
}

const TABS = [
  { key: 'breadth', label: 'Breadth' },
  { key: 'stage', label: 'Stages' },
  { key: 'sectors', label: 'Sectors' },
  { key: 'themes', label: 'Themes' },
];

// Filter stocks from stocksByTicker map by breadth criterion
function filterStocksByBreadth(filterKey, stocksByTicker) {
  const allStocks = Object.values(stocksByTicker);
  switch (filterKey) {
    case 'newHighs':
      return allStocks.filter(s => s.distSma52wHigh !== undefined ? s.distSma52wHigh >= -5 : false);
    case 'advancing':
      return allStocks.filter(s => s.change > 0);
    case 'upFromOpen':
      return allStocks.filter(s => s.change > 0);
    case 'upOnVol':
      return allStocks.filter(s => s.change > 0 && s.volBuzz > 1.0);
    case 'up4':
      return allStocks.filter(s => s.change >= 4);
    default:
      return allStocks.filter(s => s.change > 0);
  }
}

export default function App() {
  const [view, setView] = useState('dashboard');
  const [selectedName, setSelectedName] = useState('');
  const [leaders, setLeaders] = useState([]);
  const [mobileTab, setMobileTab] = useState('breadth');

  // Live market data
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [countdown, setCountdown] = useState(REFRESH_SECS);
  const [justRefreshed, setJustRefreshed] = useState(false);
  const stocksByTickerRef = useRef({});

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllMarketData(SECTOR_STOCKS, THEME_STOCKS, THEME_ETFS);
      stocksByTickerRef.current = data.stocksByTicker;
      setMarketData(data);
      setLastUpdated(new Date());
      setJustRefreshed(true);
      setTimeout(() => setJustRefreshed(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { loadData(); }, [loadData]);

  // Countdown tick + auto-refresh
  useEffect(() => {
    const id = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          loadData();
          return REFRESH_SECS;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [loadData]);

  const handleDrillDown = useCallback((name) => {
    const stocks = getLeaders(name, SECTOR_STOCKS, THEME_STOCKS, stocksByTickerRef.current);
    setLeaders(stocks);
    setSelectedName(name);
    setView('leaders');
  }, []);

  const handleBreadthFilter = useCallback((filterKey, filterLabel) => {
    const filtered = filterStocksByBreadth(filterKey, stocksByTickerRef.current);
    setLeaders(filtered);
    setSelectedName(filterLabel);
    setView('leaders');
  }, []);

  if (view === 'leaders') {
    return <LeadersView name={selectedName} stocks={leaders} onBack={() => setView('dashboard')} />;
  }

  // Loading skeleton
  if (loading && !marketData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#070b14' }}>
        <div className="text-center">
          <div className="text-2xl font-bold font-mono mb-3">
            <span className="text-blue-500">▲ MARKET</span>
            <span className="text-pink-500">PULSE</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <svg className="animate-spin w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Fetching live market data…
          </div>
          {error && (
            <div className="mt-4 text-red-400 text-xs max-w-xs">
              ⚠ {error}
              <br />
              <button onClick={loadData} className="mt-2 text-blue-400 underline">Retry</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const { breadth, sectorData, stageDist, stageHistory, themeData } = marketData || {};

  return (
    <div className="min-h-screen" style={{ background: '#070b14' }}>
      {/* ── Header ── */}
      <header className="border-b sticky top-0 z-20" style={{ background: '#070b14', borderColor: '#1a2540' }}>
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-5 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="text-base sm:text-lg font-bold tracking-tight font-mono whitespace-nowrap">
              <span className="text-blue-500">▲ MARKET</span>
              <span className="text-pink-500">PULSE</span>
            </span>
            <span className="hidden sm:block text-xs text-gray-600 border-l border-[#1a2540] pl-3 font-mono">
              US EQUITY · LIVE DATA
            </span>
          </div>
          <RefreshBadge
            countdown={countdown}
            lastUpdated={lastUpdated}
            justRefreshed={justRefreshed}
            loading={loading}
          />
        </div>
        {/* Mobile tabs */}
        <div className="flex sm:hidden border-t" style={{ borderColor: '#1a2540' }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setMobileTab(tab.key)}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                mobileTab === tab.key ? 'text-blue-400 border-b-2 border-blue-500' : 'text-gray-500'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── Market Ticker ── */}
      <MarketTicker />

      {/* Error banner */}
      {error && (
        <div className="bg-red-950 border-b border-red-900 text-red-400 text-xs px-4 py-2 flex items-center justify-between">
          <span>⚠ API error: {error} — showing last known data</span>
          <button onClick={loadData} className="text-blue-400 hover:underline ml-3">Retry now</button>
        </div>
      )}

      {/* ── Desktop layout ── */}
      <main className="hidden sm:block max-w-screen-2xl mx-auto px-3 sm:px-5 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 mb-3">
          <div className="lg:col-span-2">
            {breadth && <MarketBreadth data={breadth} onFilterClick={handleBreadthFilter} />}
          </div>
          <div className="lg:col-span-3">
            {stageDist && stageHistory && (
              <StageOverview distribution={stageDist} history={stageHistory} />
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-3">
          <div className="xl:col-span-3">
            {sectorData && <SectorTable sectors={sectorData} onSectorClick={handleDrillDown} />}
          </div>
          <div className="xl:col-span-2">
            {themeData && <ThemeTracker themes={themeData} onThemeClick={handleDrillDown} />}
          </div>
        </div>
        <p className="text-center text-xs text-gray-800 font-mono mt-4 pb-4">
          Live data via Yahoo Finance · Weinstein Stage Method · S2: Price &gt; 50SMA &gt; 200SMA · S4: Price &lt; 50SMA &lt; 200SMA
        </p>
      </main>

      {/* ── Mobile layout ── */}
      <div className="sm:hidden px-3 py-3">
        {mobileTab === 'breadth' && breadth && <MarketBreadth data={breadth} onFilterClick={handleBreadthFilter} />}
        {mobileTab === 'stage' && stageDist && stageHistory && (
          <StageOverview distribution={stageDist} history={stageHistory} />
        )}
        {mobileTab === 'sectors' && sectorData && <SectorTable sectors={sectorData} onSectorClick={handleDrillDown} />}
        {mobileTab === 'themes' && themeData && <ThemeTracker themes={themeData} onThemeClick={handleDrillDown} />}
      </div>
    </div>
  );
}
