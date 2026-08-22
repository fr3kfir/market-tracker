// Relative Strength engine — Ariel Hernandez style
// Computes multi-timeframe performance vs SPY for the whole stock universe:
//   • rel1w / rel1m / rel3m / rel6m — stock return minus SPY return per window
//   • weighted momentum score → percentile RS Score (1-99)
//   • RS-line distance from its 3-month high (0 = RS line at new high)
//   • pullbackHold — avg outperformance vs SPY on SPY's DOWN days (last month).
//     High value = the stock "holds up" when the market pulls back — Ariel's
//     core tell for institutional accumulation.

const BATCH = 80;

// Lookbacks in trading days
const LOOKBACKS = { r1w: 5, r1m: 21, r3m: 63, r6m: 126 };

// Weighted momentum: front-load recent strength (Ariel trades fresh strength)
const WEIGHTS = { rel1w: 0.1, rel1m: 0.3, rel3m: 0.4, rel6m: 0.2 };

async function fetchHistoryBatch(symbols) {
  try {
    const r = await fetch(`/api/history?symbols=${symbols.join(',')}&range=1y`);
    if (!r.ok) return {};
    return await r.json();
  } catch { return {}; }
}

function cleanSeries(hist) {
  if (!hist?.closes || !hist?.timestamps) return null;
  const ts = [], closes = [], highs = [], lows = [];
  for (let i = 0; i < hist.closes.length; i++) {
    if (hist.closes[i] != null && hist.timestamps[i] != null) {
      ts.push(hist.timestamps[i]);
      closes.push(hist.closes[i]);
      highs.push(hist.highs?.[i] ?? hist.closes[i]);
      lows.push(hist.lows?.[i] ?? hist.closes[i]);
    }
  }
  return closes.length >= 10 ? { ts, closes, highs, lows } : null;
}

// ADR% — Average Daily Range over the last `window` sessions: avg(high/low) - 1.
// Ariel only trades names that actually move — typically ADR ≥ 3.5%.
function calcAdrPct(highs, lows, window = 20) {
  const n = highs.length;
  const from = Math.max(0, n - window);
  let sum = 0, cnt = 0;
  for (let i = from; i < n; i++) {
    if (highs[i] > 0 && lows[i] > 0 && highs[i] >= lows[i]) {
      sum += highs[i] / lows[i];
      cnt++;
    }
  }
  const minCnt = Math.max(3, Math.round(window / 2));
  return cnt >= minCnt ? Math.round((sum / cnt - 1) * 1000) / 10 : null;
}

// Rolling N-day high/low distance — % the latest close sits from the highest
// high / lowest low over the trailing window (0 = sitting right at that extreme).
function calcRollingDist(closes, highs, lows, window) {
  const n = closes.length;
  if (n < Math.round(window / 2)) return { distHigh: null, distLow: null };
  const from = Math.max(0, n - window);
  const windowHigh = Math.max(...highs.slice(from, n));
  const windowLow = Math.min(...lows.slice(from, n));
  const last = closes[n - 1];
  return {
    distHigh: windowHigh > 0 ? Math.round(((last - windowHigh) / windowHigh) * 1000) / 10 : null,
    distLow: windowLow > 0 ? Math.round(((last - windowLow) / windowLow) * 1000) / 10 : null,
  };
}

function returnOver(closes, days) {
  const n = closes.length;
  if (n < days + 1) return null;
  const from = closes[n - 1 - days];
  return from ? Math.round(((closes[n - 1] - from) / from) * 1000) / 10 : null;
}

// Is the N-day SMA itself trending up? Compares today's SMA to the same SMA
// as of `lookback` sessions ago — a real slope check, not just "price above
// the average" (which only says where price sits, not which way the average
// is moving).
function sma(closes, from, window) {
  let sum = 0;
  for (let i = from; i < from + window; i++) sum += closes[i];
  return sum / window;
}
function calcSmaRising(closes, window, lookback = 10) {
  const n = closes.length;
  if (n < window + lookback) return null;
  const now = sma(closes, n - window, window);
  const then = sma(closes, n - window - lookback, window);
  return now > then;
}

// ── 10-minute cache (same TTL policy as marketData's ETF history cache) ──
let _cache = null;
let _cacheTime = 0;
const TTL_MS = 10 * 60 * 1000;

export async function fetchRelativeStrengthData(allSymbols) {
  const now = Date.now();
  if (_cache && now - _cacheTime < TTL_MS) return _cache;

  const symbols = [...new Set([...allSymbols, 'SPY'])];
  const batches = [];
  for (let i = 0; i < symbols.length; i += BATCH)
    batches.push(symbols.slice(i, i + BATCH));

  const results = await Promise.allSettled(batches.map(fetchHistoryBatch));
  const historyMap = {};
  results.forEach(r => { if (r.status === 'fulfilled') Object.assign(historyMap, r.value); });

  const spy = cleanSeries(historyMap['SPY']);
  if (!spy) return { byTicker: {}, spy: null };

  // SPY benchmark returns + close-by-timestamp lookup
  const spyReturns = {};
  Object.entries(LOOKBACKS).forEach(([key, days]) => { spyReturns[key] = returnOver(spy.closes, days); });
  const spyByTs = new Map();
  spy.ts.forEach((t, i) => spyByTs.set(t, spy.closes[i]));

  const byTicker = {};
  const weightedList = [];

  for (const sym of Object.keys(historyMap)) {
    if (sym === 'SPY') continue;
    const s = cleanSeries(historyMap[sym]);
    if (!s) continue;

    const entry = {};

    // Absolute + relative returns per timeframe
    Object.entries(LOOKBACKS).forEach(([key, days]) => {
      const r = returnOver(s.closes, days);
      entry[key] = r;
      const relKey = 'rel' + key.slice(1); // r1m → rel1m
      entry[relKey] = (r != null && spyReturns[key] != null)
        ? Math.round((r - spyReturns[key]) * 10) / 10
        : null;
    });

    // RS line (stock / SPY) — distance from its 3-month high.
    // Ariel: RS line making new highs BEFORE price = leader tell.
    const ratios = [];
    const start = Math.max(0, s.ts.length - 64);
    for (let i = start; i < s.ts.length; i++) {
      const spyClose = spyByTs.get(s.ts[i]);
      if (spyClose) ratios.push(s.closes[i] / spyClose);
    }
    if (ratios.length >= 20) {
      const last = ratios[ratios.length - 1];
      const max = Math.max(...ratios);
      entry.rsLineDist = Math.round(((last - max) / max) * 1000) / 10; // ≤ 0, 0 = new high
    } else {
      entry.rsLineDist = null;
    }

    // Pullback hold: avg (stock day-change − SPY day-change) on SPY down days, last ~21 sessions
    let holdSum = 0, holdCnt = 0;
    const from = Math.max(1, s.ts.length - 22);
    for (let i = from; i < s.ts.length; i++) {
      const spyNow = spyByTs.get(s.ts[i]);
      const spyPrev = spyByTs.get(s.ts[i - 1]);
      if (!spyNow || !spyPrev) continue;
      const spyChg = (spyNow - spyPrev) / spyPrev * 100;
      if (spyChg >= -0.2) continue; // only meaningful market down days
      const stChg = (s.closes[i] - s.closes[i - 1]) / s.closes[i - 1] * 100;
      holdSum += stChg - spyChg;
      holdCnt++;
    }
    entry.pullbackHold = holdCnt >= 2 ? Math.round((holdSum / holdCnt) * 10) / 10 : null;

    // ADR% — how much the stock actually moves per day (20-day) and per week (5-day)
    entry.adrPct = calcAdrPct(s.highs, s.lows, 20);
    entry.adrPctWeek = calcAdrPct(s.highs, s.lows, 5);

    // Is the 50/200-day SMA itself rising — not just "price above it"
    entry.sma50Rising = calcSmaRising(s.closes, 50, 10);
    entry.sma200Rising = calcSmaRising(s.closes, 200, 10);

    // Rolling 20-day / 50-day high & low distance — real "new high" breakout detection
    const d20 = calcRollingDist(s.closes, s.highs, s.lows, 20);
    const d50 = calcRollingDist(s.closes, s.highs, s.lows, 50);
    entry.dist20dHigh = d20.distHigh;
    entry.dist20dLow  = d20.distLow;
    entry.dist50dHigh = d50.distHigh;
    entry.dist50dLow  = d50.distLow;

    // Weighted momentum (renormalize over available timeframes)
    let wSum = 0, wTot = 0;
    Object.entries(WEIGHTS).forEach(([key, w]) => {
      if (entry[key] != null) { wSum += entry[key] * w; wTot += w; }
    });
    entry.weighted = wTot > 0 ? Math.round((wSum / wTot) * 10) / 10 : null;
    if (entry.weighted != null) weightedList.push({ sym, v: entry.weighted });

    byTicker[sym] = entry;
  }

  // Percentile RS Score 1-99 from weighted relative momentum
  weightedList.sort((a, b) => a.v - b.v);
  weightedList.forEach((item, i) => {
    byTicker[item.sym].rsScore = Math.round((i / (weightedList.length - 1 || 1)) * 98) + 1;
  });

  const data = { byTicker, spy: spyReturns };
  _cache = data;
  _cacheTime = now;
  return data;
}
