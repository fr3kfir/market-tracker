import { useState, useEffect, useCallback, useRef } from 'react';
import MarketBreadth from './components/MarketBreadth';
import MarketTicker from './components/MarketTicker';
import StageOverview from './components/StageOverview';
import SectorTable from './components/SectorTable';
import ThemeTracker from './components/ThemeTracker';
import LeadersView from './components/LeadersView';
import IndustryGroups from './components/IndustryGroups';
import ArielDashboard from './components/ArielDashboard';
import StockSearch from './components/StockSearch';
import Screener from './components/Screener';
import ArielBreadthTable from './components/ArielBreadthTable';
import { SECTOR_STOCKS, THEME_STOCKS, THEME_ETFS, INDUSTRY_GROUPS, HOT_THEMES, ALL_SYMBOLS, ALL_INDUSTRY_SYMBOLS } from './data/stockUniverse';
import { fetchArielBreadthData } from './services/arielBreadth';
import { fetchAllMarketData, getLeaders, enrichWithHistory } from './services/marketData';
import './index.css';

const REFRESH_SECS = 5;

function formatTime(d) {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function RefreshBadge({ countdown, lastUpdated, justRefreshed, loading }) {
  const pct = ((REFRESH_SECS - countdown) / REFRESH_SECS) * 100;
  const accent = loading ? '#f59e0b' : justRefreshed ? '#34d399' : '#3b82f6';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'var(--bg-panel)',
      border: `1px solid var(--border)`,
      borderRadius: 10, padding: '5px 10px',
    }}>
      {/* Circular progress ring */}
      <div style={{ position: 'relative', width: 32, height: 32, flexShrink: 0 }}>
        <svg width="32" height="32" style={{ transform: 'rotate(-90deg)' }} viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="13" fill="none" stroke="var(--border)" strokeWidth="3" />
          <circle
            cx="16" cy="16" r="13" fill="none"
            stroke={accent}
            strokeWidth="3" strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 13}`}
            strokeDashoffset={`${2 * Math.PI * 13 * (1 - pct / 100)}`}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
          />
        </svg>
        <span style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'monospace', fontSize: 9, color: accent, fontWeight: 700,
        }}>
          {loading ? '…' : `${countdown}`}
        </span>
      </div>
      {/* Text info */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.3 }}>
        <span style={{
          fontSize: 11, fontFamily: 'monospace', fontWeight: 700,
          color: loading ? '#f59e0b' : justRefreshed ? '#34d399' : 'var(--text)',
          transition: 'color 0.3s',
        }}>
          {loading ? 'Fetching…' : justRefreshed ? '✓ Updated' : formatTime(lastUpdated)}
        </span>
        <span style={{ fontSize: 9, color: 'var(--text-faint)', fontFamily: 'monospace' }}>
          {loading ? 'loading data' : `next in ${countdown}s`}
        </span>
      </div>
    </div>
  );
}

function ArielGuide() {
  const s = { panel: { background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 } };

  const Section = ({ title, children }) => (
    <div>
      <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-faint)', marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );

  const Row = ({ label, desc, color }) => (
    <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
      <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: color || '#3b82f6', whiteSpace: 'nowrap', paddingTop: 1, minWidth: 90 }}>{label}</span>
      <span style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</span>
    </div>
  );

  const ColorDot = ({ bg, label }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      <div style={{ width: 28, height: 14, borderRadius: 3, background: bg, flexShrink: 0 }} />
      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{label}</span>
    </div>
  );

  return (
    <div style={s.panel}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>How to Read Ariel Breadth</div>
        <p style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
          Each row is one trading day (newest on top). The numbers tell you how many stocks in the universe are doing specific things that day — giving you a pulse on market health.
        </p>
      </div>

      <Section title="Primary Indicators (Yellow)">
        <Row label="Up 4%+ Today" color="#fbbf24" desc="# of stocks up ≥4% on the day. High number = strong buying pressure." />
        <Row label="Down 4%+ Today" color="#fbbf24" desc="# of stocks down ≥4%. High = heavy selling / distribution." />
        <Row label="5-Day Ratio" color="#fbbf24" desc="(Up 4% days) ÷ (Down 4% days) over 5 days. Above 2 = bulls in control." />
        <Row label="10-Day Ratio" color="#fbbf24" desc="Same ratio over 10 days. Slower but more reliable trend signal." />
      </Section>

      <Section title="Secondary Indicators (Green)">
        <Row label="Up/Dn 25% Qtr" color="#4ade80" desc="Stocks up or down ≥25% in the last quarter. Many ups = strong market." />
        <Row label="Up/Dn 25% Mo" color="#4ade80" desc="Same but last month — more sensitive, faster signal." />
        <Row label="Up/Dn 50% Mo" color="#4ade80" desc="Extremes only. Huge monthly winners vs. crashes." />
        <Row label="Up/Dn 13% 34d" color="#4ade80" desc="Ariel's 34-day window: moderate moves over ~5 weeks." />
      </Section>

      <Section title=">50dma (Blue)">
        <Row label=">50dma %" color="#60a5fa" desc="Percent of stocks trading above their 50-day moving average. Above 60% = healthy market. Below 40% = caution." />
      </Section>

      <Section title="Color Scale">
        <ColorDot bg="rgba(21,128,61,0.85)" label="Dark green — very strong / bullish" />
        <ColorDot bg="rgba(34,197,94,0.38)" label="Light green — mild bullish" />
        <ColorDot bg="rgba(100,116,139,0.15)" label="Gray — neutral / no signal" />
        <ColorDot bg="rgba(220,38,38,0.45)" label="Light red — mild bearish" />
        <ColorDot bg="rgba(185,28,28,0.85)" label="Dark red — very bearish / danger" />
      </Section>

      <Section title="Quick Rule of Thumb">
        <div style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            <span style={{ color: '#22c55e', fontWeight: 700 }}>Bullish:</span> Ratio &gt; 2, many Up cols green, &gt;50dma above 60%<br />
            <span style={{ color: '#f59e0b', fontWeight: 700 }}>Neutral:</span> Ratio ~1, mixed colors<br />
            <span style={{ color: '#f87171', fontWeight: 700 }}>Bearish:</span> Ratio &lt; 1, many Dn cols red, &gt;50dma below 40%
          </div>
        </div>
      </Section>
    </div>
  );
}

const TABS = [
  { key: 'routine', label: '⚡ Routine' },
  { key: 'breadth', label: 'Breadth' },
  { key: 'ariel',   label: '📊 Ariel' },
  { key: 'stage',   label: 'Stages' },
  { key: 'groups',  label: 'Groups' },
  { key: 'sectors', label: 'Sectors' },
  { key: 'themes',  label: 'Themes' },
  { key: 'screener', label: '🔎 Screener' },
  { key: 'search',  label: '🔍 Search' },
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
  const [historyLoading, setHistoryLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState('routine');
  const [desktopTab, setDesktopTab] = useState('routine');
  const [theme, setTheme] = useState(() => localStorage.getItem('mp-theme') || 'dark');

  // Ariel Breadth (loaded on demand)
  const [arielRows, setArielRows] = useState(null);
  const [arielLoading, setArielLoading] = useState(false);

  // Live market data
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [countdown, setCountdown] = useState(REFRESH_SECS);
  const [justRefreshed, setJustRefreshed] = useState(false);
  const stocksByTickerRef = useRef({});

  // Apply theme class to body and persist to localStorage
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
    localStorage.setItem('mp-theme', theme);
  }, [theme]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllMarketData(SECTOR_STOCKS, THEME_STOCKS, THEME_ETFS, INDUSTRY_GROUPS, HOT_THEMES);
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

  const loadArielBreadth = useCallback(async () => {
    if (arielRows || arielLoading) return;
    setArielLoading(true);
    try {
      const allSyms = [...new Set([...ALL_SYMBOLS, ...ALL_INDUSTRY_SYMBOLS])];
      const rows = await fetchArielBreadthData(allSyms);
      setArielRows(rows);
    } catch (e) {
      console.error('Ariel Breadth error:', e);
    } finally {
      setArielLoading(false);
    }
  }, [arielRows, arielLoading]);

  const handleTabChange = useCallback((key, setter) => {
    setter(key);
    if (key === 'ariel') loadArielBreadth();
  }, [loadArielBreadth]);

  const handleGroupClick = useCallback(async (group) => {
    const tickers = INDUSTRY_GROUPS.find(g => g.name === group.name)?.tickers || [];
    const baseStocks = tickers.map(t => stocksByTickerRef.current[t]).filter(Boolean).sort((a, b) => b.rs - a.rs);
    setLeaders(baseStocks);
    setSelectedName(group.name);
    setView('leaders');
    setHistoryLoading(true);
    try {
      const enriched = await enrichWithHistory(baseStocks);
      setLeaders(enriched);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const handleDrillDown = useCallback(async (name) => {
    const baseStocks = getLeaders(name, SECTOR_STOCKS, THEME_STOCKS, stocksByTickerRef.current);
    setLeaders(baseStocks);
    setSelectedName(name);
    setView('leaders');
    // Enrich with history in background
    setHistoryLoading(true);
    try {
      const enriched = await enrichWithHistory(baseStocks);
      setLeaders(enriched);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const handleHotThemeClick = useCallback(async (themeName) => {
    const theme = HOT_THEMES.find(t => t.name === themeName);
    if (!theme) return;
    const baseStocks = theme.tickers
      .map(t => stocksByTickerRef.current[t])
      .filter(Boolean)
      .sort((a, b) => b.rs - a.rs);
    setLeaders(baseStocks);
    setSelectedName(themeName);
    setView('leaders');
    setHistoryLoading(true);
    try {
      const enriched = await enrichWithHistory(baseStocks);
      setLeaders(enriched);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const handleBreadthFilter = useCallback((filterKey, filterLabel) => {
    const filtered = filterStocksByBreadth(filterKey, stocksByTickerRef.current);
    setLeaders(filtered);
    setSelectedName(filterLabel);
    setView('leaders');
  }, []);

  if (view === 'leaders') {
    return <LeadersView name={selectedName} stocks={leaders} onBack={() => setView('dashboard')} historyLoading={historyLoading} />;
  }

  // Loading skeleton
  if (loading && !marketData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <div className="text-2xl font-bold font-mono mb-3">
            <span className="text-blue-500">▲ MARKET</span>
            <span className="text-pink-500">PULSE</span>
          </div>
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
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

  const { breadth, sectorData, stageDist, stageHistory, themeData, industryGroupData, stocksByTicker, hotThemeData } = marketData || {};

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* ── Header ── */}
      <header className="border-b sticky top-0 z-20" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-5 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="text-base sm:text-lg font-bold tracking-tight font-mono whitespace-nowrap">
              <span className="text-blue-500">▲ MARKET</span>
              <span className="text-pink-500">PULSE</span>
            </span>
            <span className="hidden sm:block text-xs border-l pl-3 font-mono" style={{ color: 'var(--text-faint)', borderColor: 'var(--border)' }}>
              US EQUITY · LIVE DATA
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              className="theme-btn"
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? '☀ Light' : '☾ Dark'}
            </button>
            <RefreshBadge
              countdown={countdown}
              lastUpdated={lastUpdated}
              justRefreshed={justRefreshed}
              loading={loading}
            />
          </div>
        </div>
        {/* Desktop tabs */}
        <div className="hidden sm:flex border-t gap-1 px-4" style={{ borderColor: 'var(--border)' }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => handleTabChange(tab.key, setDesktopTab)}
              style={{
                padding: '8px 14px', fontSize: 12, fontWeight: desktopTab === tab.key ? 700 : 500,
                color: desktopTab === tab.key ? '#3b82f6' : 'var(--text-muted)',
                borderBottom: desktopTab === tab.key ? '2px solid #3b82f6' : '2px solid transparent',
                background: 'transparent', cursor: 'pointer', transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}>
              {tab.label}
            </button>
          ))}
        </div>
        {/* Mobile tabs */}
        <div className="flex sm:hidden border-t" style={{ borderColor: 'var(--border)' }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => handleTabChange(tab.key, setMobileTab)}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                mobileTab === tab.key ? 'text-blue-400 border-b-2 border-blue-500' : ''
              }`}
              style={{ color: mobileTab === tab.key ? undefined : 'var(--text-muted)' }}>
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
        {desktopTab === 'routine' && breadth && stageDist && industryGroupData && (
          <ArielDashboard breadth={breadth} stageDist={stageDist} industryGroupData={industryGroupData} stocksByTicker={stocksByTicker || {}} onGroupClick={handleGroupClick} />
        )}
        {desktopTab === 'ariel' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 12, alignItems: 'start' }}>
            <ArielBreadthTable rows={arielRows} breadth={breadth} loading={arielLoading} />
            <ArielGuide />
          </div>
        )}
        {desktopTab === 'breadth' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-2">
              {breadth && <MarketBreadth data={breadth} onFilterClick={handleBreadthFilter} />}
            </div>
            <div className="lg:col-span-3">
              {stageDist && stageHistory && <StageOverview distribution={stageDist} history={stageHistory} theme={theme} />}
            </div>
          </div>
        )}
        {desktopTab === 'stage' && stageDist && stageHistory && (
          <StageOverview distribution={stageDist} history={stageHistory} theme={theme} />
        )}
        {desktopTab === 'groups' && industryGroupData && (
          <IndustryGroups groups={industryGroupData} onGroupClick={handleGroupClick} />
        )}
        {desktopTab === 'sectors' && (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-3">
            <div className="xl:col-span-3">
              {sectorData && <SectorTable sectors={sectorData} onSectorClick={handleDrillDown} />}
            </div>
            <div className="xl:col-span-2">
              {hotThemeData && <ThemeTracker themes={hotThemeData} onThemeClick={handleHotThemeClick} theme={theme} />}
            </div>
          </div>
        )}
        {desktopTab === 'themes' && hotThemeData && (
          <ThemeTracker themes={hotThemeData} onThemeClick={handleHotThemeClick} theme={theme} />
        )}
        {desktopTab === 'screener' && (
          <Screener stocksByTicker={stocksByTicker || {}} />
        )}
        {desktopTab === 'search' && (
          <StockSearch stocksByTicker={stocksByTicker || {}} />
        )}
        <p className="text-center text-xs font-mono mt-4 pb-4" style={{ color: 'var(--text-faint)' }}>
          Live data via Yahoo Finance · Weinstein Stage Method · S2: Price &gt; 50SMA &gt; 200SMA · S4: Price &lt; 50SMA &lt; 200SMA
        </p>
      </main>

      {/* ── Mobile layout ── */}
      <div className="sm:hidden px-3 py-3">
        {mobileTab === 'routine'  && <ArielDashboard breadth={breadth} stageDist={stageDist} industryGroupData={industryGroupData} stocksByTicker={stocksByTicker || {}} onGroupClick={handleGroupClick} />}
        {mobileTab === 'ariel'   && <ArielBreadthTable rows={arielRows} breadth={breadth} loading={arielLoading} />}
        {mobileTab === 'breadth'  && breadth && <MarketBreadth data={breadth} onFilterClick={handleBreadthFilter} />}
        {mobileTab === 'stage'   && stageDist && stageHistory && (
          <StageOverview distribution={stageDist} history={stageHistory} theme={theme} />
        )}
        {mobileTab === 'groups'  && industryGroupData && <IndustryGroups groups={industryGroupData} onGroupClick={handleGroupClick} />}
        {mobileTab === 'sectors' && sectorData && <SectorTable sectors={sectorData} onSectorClick={handleDrillDown} />}
        {mobileTab === 'themes'  && hotThemeData && <ThemeTracker themes={hotThemeData} onThemeClick={handleHotThemeClick} theme={theme} />}
        {mobileTab === 'screener' && <Screener stocksByTicker={stocksByTicker || {}} />}
        {mobileTab === 'search'  && <StockSearch stocksByTicker={stocksByTicker || {}} />}
      </div>
    </div>
  );
}
