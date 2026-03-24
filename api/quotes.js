// Vercel serverless function — Yahoo Finance quotes proxy
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const FIELDS = [
  'regularMarketPrice', 'regularMarketChangePercent', 'regularMarketOpen',
  'regularMarketVolume', 'averageDailyVolume3Month',
  'fiftyDayAverage', 'twoHundredDayAverage',
  'fiftyTwoWeekHigh', 'fiftyTwoWeekLow', 'shortName',
].join(',');

async function getAuth() {
  const r1 = await fetch('https://fc.yahoo.com', {
    redirect: 'follow',
    headers: { 'User-Agent': UA }
  });
  const raw = r1.headers.getSetCookie?.() || [];
  const cookieStr = raw.map(c => c.split(';')[0]).join('; ');

  const r2 = await fetch('https://query2.finance.yahoo.com/v1/test/getcrumb', {
    headers: { Cookie: cookieStr, 'User-Agent': UA }
  });
  const crumb = await r2.text();
  return { cookieStr, crumb };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { symbols } = req.query;
  if (!symbols) return res.status(400).json({ error: 'symbols required' });

  try {
    const { cookieStr, crumb } = await getAuth();
    const yfHeaders = { 'User-Agent': UA, Cookie: cookieStr, Accept: 'application/json' };

    const symbolList = symbols.split(',').map(s => s.trim());
    const chunks = [];
    for (let i = 0; i < symbolList.length; i += 100) chunks.push(symbolList.slice(i, i + 100));

    const allResults = [];
    for (const chunk of chunks) {
      const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(chunk.join(','))}&fields=${FIELDS}&formatted=false&lang=en-US&region=US&crumb=${encodeURIComponent(crumb)}`;
      const r = await fetch(url, { headers: yfHeaders });
      const data = await r.json();
      const results = data?.quoteResponse?.result || [];
      allResults.push(...results);
    }

    res.status(200).json({ quoteResponse: { result: allResults } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
