import express from 'express';
import cors from 'cors';
import fs from 'fs';

// Load .env (KEY=value lines) so ANTHROPIC_API_KEY works in local dev.
// Real env vars always win; missing file is fine.
try {
  for (const line of fs.readFileSync(new URL('.env', import.meta.url), 'utf8').split('\n')) {
    if (line.trim().startsWith('#')) continue;
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
    }
  }
} catch { /* no .env file */ }

const app = express();
app.use(cors());

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const FIELDS = 'regularMarketPrice,regularMarketChangePercent,regularMarketOpen,regularMarketVolume,averageDailyVolume3Month,fiftyDayAverage,twoHundredDayAverage,fiftyTwoWeekHigh,fiftyTwoWeekLow,shortName,trailingPE,forwardPE,marketCap,priceToBook,epsTrailingTwelveMonths,beta,pegRatio,priceToSalesTrailingTwelveMonths,trailingAnnualDividendYield,epsForward,targetMeanPrice,sharesOutstanding,floatShares,earningsTimestampStart,earningsCallTimestampStart';

let cookieStr = '';
let crumb = '';

async function refreshAuth() {
  try {
    const r1 = await fetch('https://fc.yahoo.com', { redirect: 'follow' });
    const raw = r1.headers.getSetCookie?.() || [];
    cookieStr = raw.map(c => c.split(';')[0]).join('; ');

    const r2 = await fetch('https://query2.finance.yahoo.com/v1/test/getcrumb', {
      headers: { Cookie: cookieStr, 'User-Agent': UA }
    });
    crumb = await r2.text();
    console.log('✓ Auth refreshed, crumb:', crumb.slice(0, 8));
    return true;
  } catch (err) {
    console.error('Auth error:', err.message);
    return false;
  }
}

// Init auth on startup
await refreshAuth();
setInterval(refreshAuth, 25 * 60 * 1000); // refresh every 25 min

const BATCH = 100;

// GET /api/quotes?symbols=AAPL,NVDA,...
app.get('/api/quotes', async (req, res) => {
  const { symbols } = req.query;
  if (!symbols) return res.status(400).json({ error: 'symbols required' });
  const list = symbols.split(',').map(s => s.trim()).filter(Boolean);

  try {
    const allResults = [];
    for (let i = 0; i < list.length; i += BATCH) {
      const batch = list.slice(i, i + BATCH).join(',');
      const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(batch)}&crumb=${encodeURIComponent(crumb)}&fields=${FIELDS}&formatted=false`;
      const r = await fetch(url, { headers: { Cookie: cookieStr, 'User-Agent': UA } });
      if (r.status === 401) {
        await refreshAuth();
        return res.status(503).json({ error: 'Auth refreshed, please retry' });
      }
      const d = await r.json();
      const results = d?.quoteResponse?.result || [];
      allResults.push(...results);
    }
    // v7/finance/quote doesn't carry sector/industry; those live in
    // quoteSummary's assetProfile module. Backfill for small (single-ticker)
    // lookups only, so bulk universe pulls don't pay for an extra call per symbol.
    if (list.length <= 5) {
      await Promise.all(allResults.map(async (r) => {
        if (!r?.symbol || (r.sector && r.industry)) return;
        try {
          const profileUrl = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(r.symbol)}?modules=assetProfile&crumb=${encodeURIComponent(crumb)}`;
          const pr = await fetch(profileUrl, { headers: { Cookie: cookieStr, 'User-Agent': UA } });
          const pd = await pr.json();
          const profile = pd?.quoteSummary?.result?.[0]?.assetProfile;
          if (profile) {
            r.sector = profile.sector;
            r.industry = profile.industry;
          }
        } catch { /* sector/industry are optional enrichment */ }
      }));
    }

    console.log(`✓ Quotes: ${allResults.filter(q => q.regularMarketPrice).length}/${list.length}`);
    res.json({ quoteResponse: { result: allResults } });
  } catch (err) {
    console.error('/api/quotes error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/history?symbols=SMH,IBB&range=6mo&interval=1d
const HISTORY_INTERVALS = new Set(['1d', '60m', '30m', '15m', '5m', '1wk', '1mo']);

app.get('/api/history', async (req, res) => {
  const { symbols, range = '6mo', interval = '1d' } = req.query;
  if (!symbols) return res.status(400).json({ error: 'symbols required' });
  const list = symbols.split(',').map(s => s.trim()).filter(Boolean);
  const iv = HISTORY_INTERVALS.has(interval) ? interval : '1d';

  try {
    const out = {};
    await Promise.all(list.map(async (sym) => {
      const url = `https://query2.finance.yahoo.com/v8/finance/chart/${sym}?interval=${iv}&range=${range}&crumb=${encodeURIComponent(crumb)}`;
      const r = await fetch(url, { headers: { Cookie: cookieStr, 'User-Agent': UA } });
      if (!r.ok) return;
      const d = await r.json();
      const result = d?.chart?.result?.[0];
      if (result) {
        out[sym] = {
          closes: result.indicators.quote[0].close,
          highs:  result.indicators.quote[0].high,
          lows:   result.indicators.quote[0].low,
          timestamps: result.timestamp,
        };
      }
    }));
    console.log(`✓ History: ${Object.keys(out).length}/${list.length}`);
    res.json(out);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/news?ticker=AAPL
app.get('/api/news', async (req, res) => {
  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: 'ticker required' });
  try {
    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(ticker)}&quotesCount=0&newsCount=8&lang=en-US&region=US&enableFuzzyQuery=false`;
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    const d = await r.json();
    const news = (d?.news || []).map(n => ({
      title: n.title, link: n.link, publisher: n.publisher,
      time: n.providerPublishTime,
      thumbnail: n.thumbnail?.resolutions?.[0]?.url ?? null,
    }));
    res.json({ news });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sec — SEC EDGAR filings feed (delegates to Vercel function)
import secHandler         from './api/sec.js';
import secPreviewHandler  from './api/sec-preview.js';
import marketBriefHandler from './api/market-brief.js';
import cotHandler         from './api/cot.js';

app.get('/api/sec',          (req, res) => secHandler(req, res));
app.get('/api/sec-preview',  (req, res) => secPreviewHandler(req, res));
app.get('/api/market-brief', (req, res) => marketBriefHandler(req, res));
app.get('/api/cot',          (req, res) => cotHandler(req, res));

const PORT = 3001;
app.listen(PORT, () => console.log(`📡 Market proxy → http://localhost:${PORT}`));
