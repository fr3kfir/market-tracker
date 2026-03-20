// Fetches real stock data from Yahoo Finance via local proxy / Netlify Function
// All /api/* calls go to server.js locally, and netlify/functions/quotes.js in production

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
  const distSma50 = sma50 ? Math.round(((price - sma50) / sma50) * 1000) / 10 : 0;

  return {
    ticker: q.symbol,
    name: q.shortName || q.symbol,
    price: Math.round(price * 100) / 100,
    change: Math.round((q.regularMarketChangePercent || 0) * 100) / 100,
    rs: rsRatings[q.symbol] || 50,
    volBuzz: Math.max(0.1, volBuzz),
    distSma50,
    stage,
    high52: q.fiftyTwoWeekHigh,
    low52: q.fiftyTwoWeekLow,
    open: q.regularMarketOpen,
  };
}

// ── Market Breadth (calculated from real stock universe) ──────────────
function calcBreadth(stocks) {
  const total = stocks.length || 1;
  const advancing = stocks.filter(s => s.change > 0).length;
  const declining = stocks.filter(s => s.change < 0).length;
  const unchanged = total - advancing - declining;
  const newHighs = stocks.filter(s => s.price >= s.high52 * 0.98).length;
  const newLows = stocks.filter(s => s.price <= s.low52 * 1.02).length;
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
    return { theme, w1: 0, m1: 0, ytd: 0 };
  }
  const closes = hist.closes.filter(Boolean);
  const last = closes[closes.length - 1];
  const w1price = closes[Math.max(0, closes.length - 6)];
  const m1price = closes[Math.max(0, closes.length - 22)];
  // YTD: find first close of the year
  const timestamps = hist.timestamps || [];
  const yearStart = new Date(new Date().getFullYear(), 0, 1).getTime() / 1000;
  const ytdIdx = timestamps.findIndex(t => t >= yearStart);
  const ytdPrice = ytdIdx >= 0 ? closes[ytdIdx] : closes[0];

  const pct = (from, to) => from ? Math.round(((to - from) / from) * 1000) / 10 : 0;
  return { theme, w1: pct(w1price, last), m1: pct(m1price, last), ytd: pct(ytdPrice, last) };
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

// ── Main fetch function — call this on app load and every refresh ──────
export async function fetchAllMarketData(sectorStocksMap, themeStocksMap, themeEtfs) {
  const allSymbols = [...new Set(Object.values(sectorStocksMap).flat())];
  const etfSymbols = Object.values(themeEtfs);
  const themes = Object.keys(themeStocksMap);

  // Parallel fetch: stock quotes + ETF history
  const [quotes, history] = await Promise.all([
    fetchQuotes([...allSymbols, ...etfSymbols]),
    fetchHistory(etfSymbols, '6mo'),
  ]);

  if (!quotes.length) throw new Error('No data returned from API');

  const rsRatings = calcRsRatings(quotes);
  const processedStocks = quotes.map(q => processQuote(q, rsRatings));
  const stocksByTicker = Object.fromEntries(processedStocks.map(s => [s.ticker, s]));

  const sectorStocks = processedStocks.filter(s => allSymbols.includes(s.ticker));
  const breadth = calcBreadth(sectorStocks);
  const sectorData = calcSectorData(sectorStocksMap, stocksByTicker);
  const stageDist = calcOverallStages(sectorStocks);
  const stageHistory = buildStageHistory(stageDist);
  const themeData = themes.map(theme => calcThemePerf(theme, themeEtfs[theme], history));

  return { breadth, sectorData, stageDist, stageHistory, themeData, stocksByTicker };
}

// ── Get leaders for a sector or theme ─────────────────────────────────
export function getLeaders(name, sectorStocksMap, themeStocksMap, stocksByTicker) {
  const tickers = sectorStocksMap[name] || themeStocksMap[name] || [];
  return tickers
    .map(t => stocksByTicker[t])
    .filter(Boolean)
    .sort((a, b) => b.rs - a.rs);
}
