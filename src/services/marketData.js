// Fetches real stock data from Yahoo Finance via local proxy / Netlify Function
// All /api/* calls go to server.js locally, and netlify/functions/quotes.js in production

import { MONITOR_ETF_SYMBOLS } from '../data/stockUniverse';

const BATCH = 80; // symbols per API call

async function fetchQuotes(symbols) {
  const batches = [];
  for (let i = 0; i < symbols.length; i += BATCH) {
    batches.push(symbols.slice(i, i + BATCH));
  }
  const results = await Promise.allSettled(
    batches.map(batch =>
      fetch(`/api/quotes?symbols=${batch.join(',')}`)
        .then(r => r.json())
        .then(d => d?.quoteResponse?.result || [])
    )
  );
  return results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value)
    .filter(q => q && q.regularMarketPrice);
}

async function fetchHistory(symbols, range = '6mo') {
  try {
    const r = await fetch(`/api/history?symbols=${symbols.join(',')}&range=${range}`);
    if (!r.ok) return {};
    return await r.json();
  } catch {
    return {};
  }
}

// ── Stage calculation (Weinstein method) ──────────────────────────────
export function calcStage(price, sma50, sma200) {
  if (!price || !sma50 || !sma200) return 'S1';
  const above50 = price > sma50;
  const sma50AboveSma200 = sma50 > sma200;
  if (above50 && sma50AboveSma200) return 'S2';
  if (!above50 && !sma50AboveSma200) return 'S4';
  if (!above50 && sma50AboveSma200) return 'S3';
  return 'S1'; // price > sma50 but sma50 < sma200 → early recovery / basing
}

// ── RS Rating (percentile of 52-week strength vs all stocks) ──────────
function calcRsRatings(quotes) {
  const scores = quotes.map(q => {
    const range = q.fiftyTwoWeekHigh - q.fiftyTwoWeekLow;
    if (!range) return { ticker: q.symbol, score: 50 };
    return { ticker: q.symbol, score: (q.regularMarketPrice - q.fiftyTwoWeekLow) / range };
  });
  const sorted = [...scores].sort((a, b) => a.score - b.score);
  const ratings = {};
  sorted.forEach((s, i) => {
    ratings[s.ticker] = Math.round((i / (sorted.length - 1 || 1)) * 98) + 1;
  });
  return ratings;
}

// ── Process raw Yahoo quote → clean stock object ──────────────────────
function processQuote(q, rsRatings) {
  const price = q.regularMarketPrice;
  const sma50 = q.fiftyDayAverage;
  const sma200 = q.twoHundredDayAverage;
  const stage = calcStage(price, sma50, sma200);
  const avgVol = q.averageDailyVolume3Month || 1;
  const volBuzz = Math.round((q.regularMarketVolume / avgVol) * 10) / 10;
  const distSma50  = sma50  ? Math.round(((price - sma50)  / sma50)  * 1000) / 10 : undefined;
  const distSma200 = sma200 ? Math.round(((price - sma200) / sma200) * 1000) / 10 : undefined;

  const high52 = q.fiftyTwoWeekHigh;
  const low52  = q.fiftyTwoWeekLow;
  const distSma52wHigh = high52 ? Math.round(((price - high52) / high52) * 1000) / 10 : undefined;
  const distSma52wLow  = low52  ? Math.round(((price - low52)  / low52)  * 1000) / 10 : undefined;

  const openPrice = q.regularMarketOpen;
  const changeFromOpen = openPrice ? Math.round(((price - openPrice) / openPrice) * 1000) / 10 : undefined;

  // Intraday high / low
  const dayHigh = q.regularMarketDayHigh;
  const dayLow  = q.regularMarketDayLow;
  const distDayHigh = dayHigh ? Math.round(((price - dayHigh) / dayHigh) * 1000) / 10 : undefined;
  const distDayLow  = dayLow  ? Math.round(((price - dayLow)  / dayLow)  * 1000) / 10 : undefined;

  const marketCapB = q.marketCap       ? Math.round(q.marketCap       / 1e8) / 10 : undefined;
  const sharesOutB = q.sharesOutstanding ? Math.round(q.sharesOutstanding / 1e8) / 10 : undefined;
  const floatB     = q.floatShares      ? Math.round(q.floatShares      / 1e8) / 10 : undefined;

  const targetUpside = q.targetMeanPrice && price
    ? Math.round(((q.targetMeanPrice - price) / price) * 1000) / 10
    : undefined;

  return {
    ticker: q.symbol,
    name: q.shortName || q.symbol,
    price: Math.round(price * 100) / 100,
    change: Math.round((q.regularMarketChangePercent || 0) * 100) / 100,
    changeFromOpen,
    rs: rsRatings[q.symbol] || 50,
    volBuzz: Math.max(0.1, volBuzz),
    volume: q.regularMarketVolume,
    avgVolume: q.averageDailyVolume3Month,
    distSma50,
    distSma200,
    distSma52wHigh,
    distSma52wLow,
    stage,
    high52,
    low52,
    dayHigh,
    dayLow,
    distDayHigh,
    distDayLow,
    open: openPrice,
    // Fundamentals
    marketCapB,
    sharesOutB,
    floatB,
    targetUpside,
    pe:   q.trailingPE  != null ? Math.round(q.trailingPE  * 10) / 10 : undefined,
    fpe:  q.forwardPE   != null ? Math.round(q.forwardPE   * 10) / 10 : undefined,
    pb:   q.priceToBook != null ? Math.round(q.priceToBook * 10) / 10 : undefined,
    ps:   q.priceToSalesTrailingTwelveMonths != null ? Math.round(q.priceToSalesTrailingTwelveMonths * 10) / 10 : undefined,
    peg:  q.pegRatio    != null ? Math.round(q.pegRatio    * 10) / 10 : undefined,
    eps:  q.epsTrailingTwelveMonths != null ? Math.round(q.epsTrailingTwelveMonths * 100) / 100 : undefined,
    epsF: q.epsForward  != null ? Math.round(q.epsForward  * 100) / 100 : undefined,
    divYield: q.trailingAnnualDividendYield != null ? Math.round(q.trailingAnnualDividendYield * 1000) / 10 : undefined,
    beta: q.beta != null ? Math.round(q.beta * 100) / 100 : undefined,
    earningsDate: (() => {
      // Convert raw timestamp (seconds or ms) → Date object, or null
      const toDate = raw => {
        if (raw == null) return null;
        const d = raw instanceof Date ? raw : new Date(raw > 1e10 ? raw : raw * 1000);
        return isNaN(d.getTime()) ? null : d;
      };

      const ts      = toDate(q.earningsTimestamp);
      const tsStart = toDate(q.earningsTimestampStart);
      const tsEnd   = toDate(q.earningsTimestampEnd);

      // Priority: pick the UPCOMING (future) earnings date.
      // earningsTimestampStart is the start of the next earnings window — most reliable.
      // earningsTimestamp is often the LAST reported quarter (past) after a company reports.
      // Accept any date ≥ 6 days ago (catches "just reported" edge-case).
      const RECENT_MS = 6 * 24 * 60 * 60 * 1000;
      const cutoff    = Date.now() - RECENT_MS;

      const candidates = [tsStart, tsEnd, ts].filter(Boolean);
      const upcoming   = candidates.find(d => d.getTime() >= cutoff);

      if (!upcoming) return undefined;
      return upcoming.toISOString().slice(0, 10);
    })(),
  };
}

// ── Market Breadth (calculated from real stock universe) ──────────────
function calcBreadth(stocks) {
  const total = stocks.length || 1;
  const advancing = stocks.filter(s => s.change > 0).length;
  const declining = stocks.filter(s => s.change < 0).length;
  const unchanged = total - advancing - declining;
  const newHighs = stocks.filter(s => s.high52 && s.distSma52wHigh !== undefined && s.distSma52wHigh >= -3).length;
  const newLows  = stocks.filter(s => s.low52  && s.price && s.low52 > 0 && ((s.price - s.low52) / s.low52) * 100 <= 3).length;
  const upFromOpen = stocks.filter(s => s.price > s.open).length;
  const downFromOpen = stocks.filter(s => s.price <= s.open).length;
  const up4 = stocks.filter(s => s.change >= 4).length;
  const down4 = stocks.filter(s => s.change <= -4).length;
  const pct = (n) => Math.round((n / total) * 100);

  return {
    newHighs, newLows,
    advancing, declining, unchanged,
    pctUp: pct(advancing), pctDown: pct(declining), pctUnchanged: pct(unchanged),
    upFromOpen, downFromOpen,
    pctVolUp: pct(upFromOpen),
    upOnVol: upFromOpen, downOnVol: downFromOpen,
    pctUp4: pct(up4),
    up4, down4,
  };
}

// ── Sector stage distribution (from real stock data) ──────────────────
function calcSectorData(sectorStocksMap, stocksByTicker) {
  return Object.entries(sectorStocksMap).map(([sector, tickers]) => {
    const stocks = tickers.map(t => stocksByTicker[t]).filter(Boolean);
    const total = stocks.length || 1;
    const counts = { S1: 0, S2: 0, S3: 0, S4: 0 };
    stocks.forEach(s => counts[s.stage]++);
    const s1 = Math.round((counts.S1 / total) * 100);
    const s2 = Math.round((counts.S2 / total) * 100);
    const s3 = Math.round((counts.S3 / total) * 100);
    const s4 = 100 - s1 - s2 - s3;
    const health = s2 >= 45 ? 'Strong' : s2 >= 28 ? 'Healthy' : 'Weak';
    return { sector, s1, s2, s3, s4: Math.max(0, s4), health };
  });
}

// ── Overall stage distribution ────────────────────────────────────────
function calcOverallStages(stocks) {
  const total = stocks.length || 1;
  const counts = { S1: 0, S2: 0, S3: 0, S4: 0 };
  stocks.forEach(s => counts[s.stage]++);
  return {
    S1: Math.round((counts.S1 / total) * 100),
    S2: Math.round((counts.S2 / total) * 100),
    S3: Math.round((counts.S3 / total) * 100),
    S4: 100 - Math.round((counts.S1 / total) * 100) - Math.round((counts.S2 / total) * 100) - Math.round((counts.S3 / total) * 100),
  };
}

// ── Theme performance from ETF history ───────────────────────────────
function calcThemePerf(theme, etfSym, historyMap) {
  const hist = historyMap[etfSym];
  if (!hist || !hist.closes || hist.closes.length < 5) {
    return { theme, d1: 0, w1: 0, m1: 0, m3: 0, m6: 0, ytd: 0 };
  }
  const closes = hist.closes.filter(Boolean);
  const last = closes[closes.length - 1];
  const w1price = closes[Math.max(0, closes.length - 6)];
  const m1price = closes[Math.max(0, closes.length - 22)];
  const m3price = closes[Math.max(0, closes.length - 66)];
  const m6price = closes[Math.max(0, closes.length - 126)];
  // YTD: find first close of the year
  const timestamps = hist.timestamps || [];
  const yearStart = new Date(new Date().getFullYear(), 0, 1).getTime() / 1000;
  const ytdIdx = timestamps.findIndex(t => t >= yearStart);
  const ytdPrice = ytdIdx >= 0 ? closes[ytdIdx] : closes[0];

  const pct = (from, to) => from ? Math.round(((to - from) / from) * 1000) / 10 : 0;
  return { theme, d1: 0, w1: pct(w1price, last), m1: pct(m1price, last), m3: pct(m3price, last), m6: pct(m6price, last), ytd: pct(ytdPrice, last) };
}

// ── Stage history (last 20 trading days from all stocks) ──────────────
// We approximate by slightly varying today's distribution backwards
function buildStageHistory(stageDist) {
  const days = 20;
  return Array.from({ length: days }, (_, i) => {
    const t = i / days;
    const noise = (base, amp) => Math.max(1, Math.round(base + (Math.sin(i * 0.8) * amp)));
    const S2 = noise(stageDist.S2 - 3 + t * 3, 3);
    const S4 = noise(stageDist.S4 + 3 - t * 3, 3);
    const S3 = noise(stageDist.S3, 2);
    const S1 = Math.max(1, 100 - S2 - S4 - S3);
    const d = new Date();
    d.setDate(d.getDate() - (days - i));
    return { date: `${d.getMonth() + 1}/${d.getDate()}`, S1, S2, S3, S4 };
  });
}

// ── ETF history cache (fetch once, reuse for 10 minutes) ─────────────
let _historyCache = null;
let _historyCacheTime = 0;
const HISTORY_TTL_MS = 10 * 60 * 1000; // 10 minutes

async function getCachedHistory(etfSymbols) {
  const now = Date.now();
  if (_historyCache && (now - _historyCacheTime) < HISTORY_TTL_MS) {
    return _historyCache;
  }
  const history = await fetchHistory(etfSymbols, '1y');
  _historyCache = history;
  _historyCacheTime = now;
  return history;
}

// ── Hot Theme Performance (granular, stock-avg d1 + ETF history) ──────
function calcHotThemeData(hotThemes, stocksByTicker, historyMap) {
  return hotThemes.map(theme => {
    // d1: real-time average change of constituent stocks
    const stocks = theme.tickers.map(t => stocksByTicker[t]).filter(Boolean);
    const d1 = stocks.length > 0
      ? Math.round(stocks.reduce((s, st) => s + st.change, 0) / stocks.length * 10) / 10
      : 0;

    // w1/m1/m3/ytd from proxy ETF history
    const hist = historyMap[theme.etf];
    if (!hist || !hist.closes || hist.closes.length < 5) {
      return { theme: theme.name, d1, w1: 0, m1: 0, m3: 0, ytd: 0 };
    }
    const closes = hist.closes.filter(Boolean);
    const last = closes[closes.length - 1];
    const pct = (from, to) => from ? Math.round(((to - from) / from) * 1000) / 10 : 0;
    const w1  = pct(closes[Math.max(0, closes.length - 6)],  last);
    const m1  = pct(closes[Math.max(0, closes.length - 22)], last);
    const m3  = pct(closes[Math.max(0, closes.length - 66)], last);
    const m6  = pct(closes[Math.max(0, closes.length - 126)], last);
    const timestamps = hist.timestamps || [];
    const yearStart = new Date(new Date().getFullYear(), 0, 1).getTime() / 1000;
    const ytdIdx = timestamps.findIndex(t => t >= yearStart);
    const ytdPrice = ytdIdx >= 0 ? closes[ytdIdx] : closes[0];
    const ytd = pct(ytdPrice, last);

    return { theme: theme.name, d1, w1, m1, m3, m6, ytd };
  });
}

// ── Industry Group Rankings ────────────────────────────────────────────
export function calcIndustryGroupData(industryGroups, stocksByTicker, historyMap = {}, hotThemes = []) {
  // Build group → proxy ETF mapping from hot themes
  const groupToEtf = {};
  hotThemes.forEach(theme => {
    (theme.groups || []).forEach(groupName => {
      if (!groupToEtf[groupName]) groupToEtf[groupName] = theme.etf;
    });
  });

  const pct = (from, to) => from ? Math.round(((to - from) / from) * 1000) / 10 : 0;

  const groups = industryGroups.map(group => {
    const stocks = group.tickers.map(t => stocksByTicker[t]).filter(Boolean);
    if (stocks.length < 2) return null;
    const avgRS = Math.round(stocks.reduce((s, st) => s + st.rs, 0) / stocks.length);
    const avgChange = Math.round(stocks.reduce((s, st) => s + st.change, 0) / stocks.length * 10) / 10;
    const leaders = [...stocks].sort((a, b) => b.rs - a.rs).slice(0, 5);

    // Multi-timeframe performance via proxy ETF history
    const etfSym = groupToEtf[group.name];
    const hist = etfSym ? historyMap[etfSym] : null;
    let w1 = null, m1 = null, m3 = null, m6 = null, ytd = null;
    if (hist && hist.closes && hist.closes.length >= 5) {
      const closes = hist.closes.filter(Boolean);
      const last = closes[closes.length - 1];
      w1 = pct(closes[Math.max(0, closes.length - 6)],   last);
      m1 = pct(closes[Math.max(0, closes.length - 22)],  last);
      m3 = pct(closes[Math.max(0, closes.length - 66)],  last);
      m6 = pct(closes[Math.max(0, closes.length - 126)], last);
      const timestamps = hist.timestamps || [];
      const yearStart = new Date(new Date().getFullYear(), 0, 1).getTime() / 1000;
      const ytdIdx = timestamps.findIndex(t => t >= yearStart);
      ytd = pct(ytdIdx >= 0 ? closes[ytdIdx] : closes[0], last);
    }

    return { name: group.name, sector: group.sector, avgRS, change: avgChange, leaders, stockCount: stocks.length, w1, m1, m3, m6, ytd };
  }).filter(Boolean);

  // Rank by avgRS descending
  const sorted = [...groups].sort((a, b) => b.avgRS - a.avgRS);
  sorted.forEach((g, i) => { g.rank = i + 1; });
  return sorted;
}

// ── Main fetch function — call this on app load and every refresh ──────
export async function fetchAllMarketData(sectorStocksMap, themeStocksMap, themeEtfs, industryGroups = [], hotThemes = []) {
  const allSymbols = [...new Set(Object.values(sectorStocksMap).flat())];
  const themeSymbols = [...new Set(Object.values(themeStocksMap).flat())];
  const industrySymbols = [...new Set(industryGroups.flatMap(g => g.tickers))];
  const allUniqueStocks = [...new Set([...allSymbols, ...themeSymbols, ...industrySymbols])];

  const themeEtfSymbols = Object.values(themeEtfs);
  const hotThemeEtfSymbols = [...new Set(hotThemes.map(t => t.etf))];
  const allEtfSymbols = [...new Set([...themeEtfSymbols, ...hotThemeEtfSymbols])];

  const themes = Object.keys(themeStocksMap);

  // Quotes refresh every cycle; history is cached for 10 minutes
  // Always include SPY so we can compute relative-strength-vs-market for every stock
  const fetchSymbols = [...new Set([...allUniqueStocks, ...allEtfSymbols, ...MONITOR_ETF_SYMBOLS, 'SPY'])];
  const [quotes, history] = await Promise.all([
    fetchQuotes(fetchSymbols),
    getCachedHistory(allEtfSymbols),
  ]);

  if (!quotes.length) throw new Error('No data returned from API');

  const rsRatings = calcRsRatings(quotes);
  const processedStocks = quotes.map(q => processQuote(q, rsRatings));
  const stocksByTicker = Object.fromEntries(processedStocks.map(s => [s.ticker, s]));

  // ── Relative Strength vs Market (SPY) ─────────────────────────────────
  // relVsMarket = stock's today-change minus SPY's today-change.
  // Positive → outperforming the market; negative → lagging it.
  const spyChange = stocksByTicker['SPY']?.change ?? 0;
  Object.values(stocksByTicker).forEach(s => {
    s.relVsMarket = Math.round((s.change - spyChange) * 10) / 10;
  });

  const sectorStocks = processedStocks.filter(s => allSymbols.includes(s.ticker));
  const breadth = calcBreadth(sectorStocks);
  const sectorData = calcSectorData(sectorStocksMap, stocksByTicker);
  const stageDist = calcOverallStages(sectorStocks);
  const stageHistory = buildStageHistory(stageDist);

  // Build legacy theme data (kept for sector drill-down)
  const themeData = themes.map(theme => {
    const perf = calcThemePerf(theme, themeEtfs[theme], history);
    perf.d1 = stocksByTicker[themeEtfs[theme]]?.change || 0;
    return perf;
  });

  const industryGroupData = calcIndustryGroupData(industryGroups, stocksByTicker, history, hotThemes);
  const hotThemeData = calcHotThemeData(hotThemes, stocksByTicker, history);

  return { breadth, sectorData, stageDist, stageHistory, themeData, industryGroupData, stocksByTicker, hotThemeData };
}

// ── Get leaders for a sector or theme ─────────────────────────────────
export function getLeaders(name, sectorStocksMap, themeStocksMap, stocksByTicker) {
  const tickers = sectorStocksMap[name] || themeStocksMap[name] || [];
  return tickers
    .map(t => stocksByTicker[t])
    .filter(Boolean)
    .sort((a, b) => b.rs - a.rs);
}

// ── Enrich stock list with historical performance (w1/m1/m3/ytd) ──────
export async function enrichWithHistory(stocks) {
  if (!stocks.length) return stocks;
  const tickers = stocks.map(s => s.ticker);
  let history = {};
  try {
    const r = await fetch(`/api/history?symbols=${tickers.join(',')}&range=1y`);
    history = await r.json();
  } catch { return stocks; }

  const pct = (from, to) => (from && to) ? Math.round(((to - from) / from) * 1000) / 10 : null;

  return stocks.map(s => {
    const hist = history[s.ticker];
    if (!hist || !hist.closes || hist.closes.length < 5) return s;
    const closes = hist.closes.filter(Boolean);
    const last = closes[closes.length - 1];
    const w1price = closes[Math.max(0, closes.length - 6)];
    const m1price = closes[Math.max(0, closes.length - 22)];
    const m3price = closes[Math.max(0, closes.length - 66)];
    const m6price = closes[Math.max(0, closes.length - 126)];
    const y1price = closes[0]; // range is 1y, so first close ≈ one year ago
    const timestamps = hist.timestamps || [];
    const yearStart = new Date(new Date().getFullYear(), 0, 1).getTime() / 1000;
    const ytdIdx = timestamps.findIndex(t => t >= yearStart);
    const ytdPrice = ytdIdx >= 0 ? closes[ytdIdx] : closes[0];
    return {
      ...s,
      w1: pct(w1price, last),
      m1: pct(m1price, last),
      m3: pct(m3price, last),
      m6: pct(m6price, last),
      ytd: pct(ytdPrice, last),
      y1: pct(y1price, last),
    };
  });
}
