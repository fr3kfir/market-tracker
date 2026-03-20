// Netlify serverless function — same logic as server.js but runs on Netlify
const FIELDS = [
  'regularMarketPrice', 'regularMarketChangePercent', 'regularMarketOpen',
  'regularMarketVolume', 'averageDailyVolume3Month',
  'fiftyDayAverage', 'twoHundredDayAverage',
  'fiftyTwoWeekHigh', 'fiftyTwoWeekLow', 'shortName',
].join(',');

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
};

exports.handler = async (event) => {
  const { symbols, type, range = '6mo' } = event.queryStringParameters || {};
  if (!symbols) return { statusCode: 400, body: JSON.stringify({ error: 'symbols required' }) };

  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

  try {
    if (type === 'history') {
      const list = symbols.split(',').map(s => s.trim());
      const results = await Promise.allSettled(
        list.map(async (sym) => {
          const url = `https://query2.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=${range}`;
          const r = await fetch(url, { headers: YF_HEADERS });
          const data = await r.json();
          const result = data?.chart?.result?.[0];
          if (!result) return [sym, null];
          return [sym, { closes: result.indicators.quote[0].close, timestamps: result.timestamp }];
        })
      );
      const out = {};
      results.forEach(r => { if (r.status === 'fulfilled' && r.value) out[r.value[0]] = r.value[1]; });
      return { statusCode: 200, headers, body: JSON.stringify(out) };
    }

    // Default: batch quotes
    const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}&fields=${FIELDS}&formatted=false&lang=en-US&region=US`;
    const r = await fetch(url, { headers: YF_HEADERS });
    const data = await r.json();
    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
