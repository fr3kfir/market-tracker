import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const FIELDS = 'regularMarketPrice,regularMarketChangePercent,regularMarketOpen,regularMarketVolume,averageDailyVolume3Month,fiftyDayAverage,twoHundredDayAverage,fiftyTwoWeekHigh,fiftyTwoWeekLow,shortName';

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
    console.log(`✓ Quotes: ${allResults.filter(q => q.regularMarketPrice).length}/${list.length}`);
    res.json({ quoteResponse: { result: allResults } });
  } catch (err) {
    console.error('/api/quotes error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/history?symbols=SMH,IBB&range=6mo
app.get('/api/history', async (req, res) => {
  const { symbols, range = '6mo' } = req.query;
  if (!symbols) return res.status(400).json({ error: 'symbols required' });
  const list = symbols.split(',').map(s => s.trim()).filter(Boolean);

  try {
    const out = {};
    await Promise.all(list.map(async (sym) => {
      const url = `https://query2.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=${range}&crumb=${encodeURIComponent(crumb)}`;
      const r = await fetch(url, { headers: { Cookie: cookieStr, 'User-Agent': UA } });
      if (!r.ok) return;
      const d = await r.json();
      const result = d?.chart?.result?.[0];
      if (result) {
        out[sym] = {
          closes: result.indicators.quote[0].close,
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

const PORT = 3001;
app.listen(PORT, () => console.log(`📡 Market proxy → http://localhost:${PORT}`));
