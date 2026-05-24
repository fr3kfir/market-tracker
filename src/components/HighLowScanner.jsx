import { useState, useMemo } from 'react';
import { INDUSTRY_GROUPS } from '../data/stockUniverse';
import MiniChart from './MiniChart';

// ── Colors ───────────────────────────────────────────────────────────────
const RS_COLOR = rs => rs >= 80 ? '#10b981' : rs >= 60 ? '#3b82f6' : rs >= 40 ? '#f59e0b' : '#e879f9';
const STAGE_COLORS = { S1: '#94a3b8', S2: '#60a5fa', S3: '#f59e0b', S4: '#f472b6' };

// ── Thresholds ────────────────────────────────────────────────────────────
// 52w High tabs
const HIGH_TABS = [
  { key: '52w',  label: '52-Week High',  icon: '🏔', desc: 'Within 5% of 52-week high' },
  { key: 'intra', label: 'Intraday High', icon: '⚡', desc: 'Near today\'s intraday high' },
];
const LOW_TABS = [
  { key: '52w',   label: '52-Week Low',   icon: '🕳', desc: 'Within 5% of 52-week low' },
  { key: 'intra', label: 'Intraday Low',  icon: '🔻', desc: 'Near today\'s intraday low' },
];

// ── Build ticker→group lookup from live industryGroupData ─────────────────
function buildGroupMap(industryGroupData) {
  const map = {};
  industryGroupData.forEach(g => {
    const groupDef = INDUSTRY_GROUPS.find(ig => ig.name === g.name);
    if (groupDef) {
      groupDef.tickers.forEach(t => {
        if (!map[t]) map[t] = { rank: g.rank, name: g.name };
      });
    }
  });
  return map;
}

// ── RSBadge ───────────────────────────────────────────────────────────────
function RSBadge({ rs }) {
  const c = RS_COLOR(rs);
  return (
    <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: c, background: c + '18', padding: '1px 5px', borderRadius: 4 }}>
      RS {rs}
    </span>
  );
}

// ── StageBadge ────────────────────────────────────────────────────────────
function StageBadge({ stage }) {
  const c = STAGE_COLORS[stage] || '#94a3b8';
  return (
    <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: c, background: c + '22', padding: '1px 5px', borderRadius: 4 }}>
      {stage}
    </span>
  );
}

// ── GroupRankBadge ────────────────────────────────────────────────────────
function GroupRankBadge({ rank, name }) {
  if (!rank) return null;
  const color = rank <= 10 ? '#f59e0b' : rank <= 20 ? '#34d399' : rank <= 40 ? '#3b82f6' : '#94a3b8';
  return (
    <span title={name} style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color, background: color + '18', padding: '1px 5px', borderRadius: 4, whiteSpace: 'nowrap' }}>
      Grp #{rank}
    </span>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: 'var(--bg)', border: `1px solid ${color}33`, borderRadius: 8, padding: '10px 14px', flex: '1 1 110px', minWidth: 110 }}>
      <div style={{ fontSize: 9, color: 'var(--text-faint)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace', color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

// ── Stock Row ─────────────────────────────────────────────────────────────
function StockRow({ s, dist, isHigh, groupMap, showChart, onChartToggle }) {
  const [hover, setHover] = useState(false);
  const gi = groupMap[s.ticker];
  const distColor = isHigh
    ? (dist >= -1 ? '#22c55e' : dist >= -3 ? '#34d399' : dist >= -5 ? '#f59e0b' : '#94a3b8')
    : (dist <= 1  ? '#f87171' : dist <= 3  ? '#fb923c' : dist <= 5  ? '#f59e0b' : '#94a3b8');
  const changeColor = s.change > 0 ? '#22c55e' : s.change < 0 ? '#f87171' : 'var(--text-muted)';

  return (
    <>
      <tr
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          borderBottom: showChart ? 'none' : '1px solid var(--border)',
          background: hover ? 'rgba(59,130,246,0.05)' : 'transparent',
          transition: 'background 0.12s',
          cursor: 'pointer',
        }}
        onClick={onChartToggle}
      >
        {/* Ticker */}
        <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
          <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#60a5fa' }}>{s.ticker}</div>
          <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 1, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
        </td>
        {/* Price */}
        <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
          ${s.price?.toFixed(2)}
        </td>
        {/* Distance */}
        <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: distColor }}>
          {dist > 0 ? '+' : ''}{dist?.toFixed(2)}%
        </td>
        {/* Today */}
        <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: changeColor }}>
          {s.change > 0 ? '+' : ''}{s.change?.toFixed(2)}%
        </td>
        {/* RS */}
        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
          <RSBadge rs={s.rs} />
        </td>
        {/* Stage */}
        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
          <StageBadge stage={s.stage} />
        </td>
        {/* Group */}
        <td style={{ padding: '8px 8px', textAlign: 'left' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <GroupRankBadge rank={gi?.rank} name={gi?.name} />
            {gi?.name && <span style={{ fontSize: 9, color: 'var(--text-faint)', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gi.name}</span>}
          </div>
        </td>
        {/* Vol Buzz */}
        <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
          color: s.volBuzz >= 2 ? '#f59e0b' : s.volBuzz >= 1.5 ? '#60a5fa' : 'var(--text-muted)' }}>
          {s.volBuzz?.toFixed(1)}x
        </td>
        {/* Chart toggle */}
        <td style={{ padding: '8px 8px', textAlign: 'center' }}>
          <button
            onClick={e => { e.stopPropagation(); onChartToggle(); }}
            style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 5, cursor: 'pointer',
              border: `1px solid ${showChart ? '#3b82f6' : 'var(--border)'}`,
              background: showChart ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: showChart ? '#3b82f6' : 'var(--text-faint)',
            }}
          >{showChart ? '▲ Hide' : '📈 Chart'}</button>
        </td>
      </tr>
      {showChart && (
        <tr style={{ borderBottom: '1px solid var(--border)' }}>
          <td colSpan={8} style={{ padding: '0 10px 10px', background: 'var(--bg)' }}>
            <MiniChart ticker={s.ticker} range="3M" height={200} />
          </td>
        </tr>
      )}
    </>
  );
}

// ── Panel (one side: highs or lows) ──────────────────────────────────────
function ScanPanel({ title, icon, color, stocks, isHigh, groupMap, rsMin, setRsMin, groupRankMax, setGroupRankMax, stageFilter, setStageFilter }) {
  const [expandedTicker, setExpandedTicker] = useState(null);
  const [activeTab, setActiveTab] = useState('52w');
  const tabs = isHigh ? HIGH_TABS : LOW_TABS;

  const toggleChart = (ticker) => setExpandedTicker(t => t === ticker ? null : ticker);

  // Get stocks for current tab
  const tabStocks = useMemo(() => {
    return stocks.filter(s => {
      if (activeTab === '52w') {
        const d = s.distSma52wHigh;
        return isHigh ? (d !== undefined && d >= -5 && d <= 0.5) : (s.distSma52wLow !== undefined && s.distSma52wLow >= 0 && s.distSma52wLow <= 5);
      } else {
        const d = isHigh ? s.distDayHigh : s.distDayLow;
        return d !== undefined && Math.abs(d) <= 1;
      }
    });
  }, [stocks, activeTab, isHigh]);

  // Get dist for display
  const getDist = (s) => {
    if (activeTab === '52w') return isHigh ? s.distSma52wHigh : s.distSma52wLow;
    return isHigh ? s.distDayHigh : s.distDayLow;
  };

  // Sort
  const sorted = useMemo(() => {
    return [...tabStocks].sort((a, b) => {
      const da = Math.abs(getDist(a) ?? 999);
      const db = Math.abs(getDist(b) ?? 999);
      return da - db;
    });
  }, [tabStocks]);

  const breakoutCount = tabStocks.filter(s => {
    const d = getDist(s);
    return d !== undefined && Math.abs(d) <= 1;
  }).length;

  return (
    <div style={{
      background: 'var(--bg-panel)', border: `1px solid ${color}33`,
      borderRadius: 12, overflow: 'hidden', flex: '1 1 0', minWidth: 0,
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: `1px solid ${color}22`,
        background: `${color}08`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'monospace' }}>{title}</div>
            <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>
              {tabStocks.length} stocks · {breakoutCount} at breakout
            </div>
          </div>
        </div>
        {/* Stats */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ padding: '4px 10px', borderRadius: 6, background: `${color}15`, border: `1px solid ${color}33` }}>
            <div style={{ fontSize: 9, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total</div>
            <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color }}>{tabStocks.length}</div>
          </div>
          <div style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)' }}>
            <div style={{ fontSize: 9, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Breakout</div>
            <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#60a5fa' }}>{breakoutCount}</div>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 8px', gap: 4 }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setExpandedTicker(null); }}
            title={tab.desc}
            style={{
              padding: '7px 12px', fontSize: 11, fontFamily: 'monospace', fontWeight: activeTab === tab.key ? 700 : 500,
              background: 'transparent', cursor: 'pointer',
              color: activeTab === tab.key ? color : 'var(--text-muted)',
              borderBottom: activeTab === tab.key ? `2px solid ${color}` : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >{tab.icon} {tab.label}</button>
        ))}
      </div>

      {/* Filters row */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 10, color: 'var(--text-faint)', fontFamily: 'monospace' }}>RS≥</span>
          {[0, 70, 80, 90].map(v => (
            <button key={v} onClick={() => setRsMin(v)} style={{
              padding: '2px 8px', fontSize: 10, fontFamily: 'monospace', fontWeight: 600,
              borderRadius: 12, border: '1px solid', cursor: 'pointer',
              borderColor: rsMin === v ? color : 'var(--border)',
              background:  rsMin === v ? color + '22' : 'transparent',
              color:       rsMin === v ? color : 'var(--text-muted)',
            }}>{v || 'All'}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 10, color: 'var(--text-faint)', fontFamily: 'monospace' }}>Grp≤</span>
          {[null, 20, 40].map(v => (
            <button key={String(v)} onClick={() => setGroupRankMax(v)} style={{
              padding: '2px 8px', fontSize: 10, fontFamily: 'monospace', fontWeight: 600,
              borderRadius: 12, border: '1px solid', cursor: 'pointer',
              borderColor: groupRankMax === v ? '#f59e0b' : 'var(--border)',
              background:  groupRankMax === v ? '#f59e0b22' : 'transparent',
              color:       groupRankMax === v ? '#f59e0b' : 'var(--text-muted)',
            }}>{v ? `Top ${v}` : 'All'}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {['All', 'S2', 'S4'].map(s => (
            <button key={s} onClick={() => setStageFilter(s === 'All' ? null : s)} style={{
              padding: '2px 8px', fontSize: 10, fontFamily: 'monospace', fontWeight: 600,
              borderRadius: 12, border: '1px solid', cursor: 'pointer',
              borderColor: (s === 'All' ? stageFilter === null : stageFilter === s) ? STAGE_COLORS[s] || color : 'var(--border)',
              background:  (s === 'All' ? stageFilter === null : stageFilter === s) ? (STAGE_COLORS[s] || color) + '22' : 'transparent',
              color:       (s === 'All' ? stageFilter === null : stageFilter === s) ? (STAGE_COLORS[s] || color) : 'var(--text-muted)',
            }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 12, fontFamily: 'monospace' }}>
          No stocks match these filters
        </div>
      ) : (
        <div style={{ overflowX: 'auto', maxHeight: 520, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-panel)', zIndex: 2 }}>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Ticker', 'Price', isHigh ? '% from High' : '% from Low', 'Today', 'RS', 'Stage', 'Group', 'Vol Buzz', ''].map((h, i) => (
                  <th key={i} style={{
                    padding: '6px 10px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.08em', color: 'var(--text-faint)', fontFamily: 'monospace',
                    textAlign: i === 0 || i === 6 ? 'left' : i === 8 ? 'center' : 'right',
                    whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map(s => (
                <StockRow
                  key={s.ticker}
                  s={s}
                  dist={getDist(s)}
                  isHigh={isHigh}
                  groupMap={groupMap}
                  showChart={expandedTicker === s.ticker}
                  onChartToggle={() => toggleChart(s.ticker)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function HighLowScanner({ stocksByTicker, industryGroupData = [] }) {
  // Global filters (shared or separate per panel)
  const [highRsMin, setHighRsMin]             = useState(80);
  const [lowRsMin,  setLowRsMin]              = useState(0);
  const [highGroupRankMax, setHighGroupRankMax] = useState(null);
  const [lowGroupRankMax,  setLowGroupRankMax]  = useState(null);
  const [highStage, setHighStage]             = useState('S2');
  const [lowStage,  setLowStage]              = useState(null);

  const groupMap = useMemo(() => buildGroupMap(industryGroupData), [industryGroupData]);
  const allStocks = useMemo(() => Object.values(stocksByTicker), [stocksByTicker]);

  // Stats
  const near52wHighCount = useMemo(() => allStocks.filter(s => s.distSma52wHigh !== undefined && s.distSma52wHigh >= -5).length, [allStocks]);
  const near52wLowCount  = useMemo(() => allStocks.filter(s => s.distSma52wLow  !== undefined && s.distSma52wLow  <= 5).length,  [allStocks]);
  const breakoutCount    = useMemo(() => allStocks.filter(s => s.distSma52wHigh !== undefined && s.distSma52wHigh >= -1).length, [allStocks]);
  const breakdownCount   = useMemo(() => allStocks.filter(s => s.distSma52wLow  !== undefined && s.distSma52wLow  <= 1).length,  [allStocks]);

  // Filter stocks for high panel
  const highStocks = useMemo(() => allStocks.filter(s => {
    if (s.rs < highRsMin) return false;
    if (highStage && s.stage !== highStage) return false;
    if (highGroupRankMax != null) {
      const rank = groupMap[s.ticker]?.rank;
      if (rank == null || rank > highGroupRankMax) return false;
    }
    return true;
  }), [allStocks, highRsMin, highStage, highGroupRankMax, groupMap]);

  // Filter stocks for low panel
  const lowStocks = useMemo(() => allStocks.filter(s => {
    if (s.rs < lowRsMin) return false;
    if (lowStage && s.stage !== lowStage) return false;
    if (lowGroupRankMax != null) {
      const rank = groupMap[s.ticker]?.rank;
      if (rank == null || rank > lowGroupRankMax) return false;
    }
    return true;
  }), [allStocks, lowRsMin, lowStage, lowGroupRankMax, groupMap]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── Summary stats ── */}
      <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-faint)', marginBottom: 10 }}>
          Market Breadth — Highs & Lows
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <StatCard label="Near 52w High" value={near52wHighCount} sub="Within 5%" color="#22c55e" />
          <StatCard label="Breaking Out"  value={breakoutCount}    sub="Within 1%" color="#34d399" />
          <StatCard label="Near 52w Low"  value={near52wLowCount}  sub="Within 5%" color="#f87171" />
          <StatCard label="Breaking Down" value={breakdownCount}   sub="Within 1%" color="#ef4444" />
          <StatCard label="High/Low Ratio"
            value={(near52wHighCount / (near52wLowCount || 1)).toFixed(1) + 'x'}
            sub="Bullish if > 2"
            color={near52wHighCount > near52wLowCount * 2 ? '#22c55e' : near52wHighCount > near52wLowCount ? '#f59e0b' : '#f87171'}
          />
        </div>
      </div>

      {/* ── Two panels ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'start' }}>
        <ScanPanel
          title="New Highs"
          icon="🏔"
          color="#22c55e"
          stocks={highStocks}
          isHigh={true}
          groupMap={groupMap}
          rsMin={highRsMin}         setRsMin={setHighRsMin}
          groupRankMax={highGroupRankMax} setGroupRankMax={setHighGroupRankMax}
          stageFilter={highStage}   setStageFilter={setHighStage}
        />
        <ScanPanel
          title="New Lows"
          icon="🕳"
          color="#f87171"
          stocks={lowStocks}
          isHigh={false}
          groupMap={groupMap}
          rsMin={lowRsMin}          setRsMin={setLowRsMin}
          groupRankMax={lowGroupRankMax} setGroupRankMax={setLowGroupRankMax}
          stageFilter={lowStage}    setStageFilter={setLowStage}
        />
      </div>

      <p style={{ textAlign: 'center', fontSize: 10, fontFamily: 'monospace', color: 'var(--text-faint)', margin: 0 }}>
        Auto-refreshes every 5s · Click 📈 Chart to expand TradingView mini chart · Grp # = Industry Group Rank
      </p>
    </div>
  );
}
