// Local development proxy server — forwards requests to Yahoo Finance
// Netlify Functions handle this in production (netlify/functions/quotes.js)
import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors());

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
};

const FIELDS = [
  'regularMarketPrice', 'regularMarketChangePercent', 'regularMarketOpen',
  'regularMarketVolume', 'averageDailyVolume3Month',
  'fiftyDayAverage', 'twoHundredDayAverage',
  'fiftyTwoWeekHigh', 'fiftyTwoWeekLow', 'shortName',
].join(',');

// Batch stock quotes
app.get('/api/quotes', async (req, res) => {
  const { symbols } = req.query;
  if (!symbols) return res.status(400).json({ error: 'symbols required' });
  try {
    const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}&fields=${FIELDS}&formatted=false&lang=en-US&region=US`;
    const { data } = await axios.get(url, { headers: YF_HEADERS, timeout: 10000 });
    res.json(data);
  } catch (err) {
    console.error('/api/quotes error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Historical data for ETF theme performance
app.get('/api/history', async (req, res) => {
  const { symbols, range = '6mo' } = req.query;
  if (!symbols) return res.status(400).json({ error: 'symbols required' });
  const list = symbols.split(',').map(s => s.trim());
  try {
    const results = await Promise.allSettled(
      list.map(async (sym) => {
        const url = `https://query2.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=${range}`;
        const { data } = await axios.get(url, { headers: YF_HEADERS, timeout: 10000 });
        const r = data?.chart?.result?.[0];
        if (!r) return [sym, null];
        const closes = r.indicators.quote[0].close;
        const timestamps = r.timestamp;
        return [sym, { closes, timestamps }];
      })
    );
    const out = {};
    results.forEach(r => { if (r.status === 'fulfilled' && r.value) out[r.value[0]] = r.value[1]; });
    res.json(out);
  } catch (err) {
    console.error('/api/history error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`📡 Market data proxy → http://localhost:${PORT}`));
