// Vercel serverless function — Yahoo Finance history proxy
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

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

  const { symbols, range = '6mo' } = req.query;
  if (!symbols) return res.status(400).json({ error: 'symbols required' });

  try {
    const { cookieStr, crumb } = await getAuth();
    const yfHeaders = { 'User-Agent': UA, Cookie: cookieStr, Accept: 'application/json' };

    const list = symbols.split(',').map(s => s.trim());
    const results = await Promise.allSettled(
      list.map(async (sym) => {
        const url = `https://query2.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=${range}&crumb=${encodeURIComponent(crumb)}`;
        const r = await fetch(url, { headers: yfHeaders });
        const data = await r.json();
        const result = data?.chart?.result?.[0];
        if (!result) return [sym, null];
        return [sym, { closes: result.indicators.quote[0].close, timestamps: result.timestamp }];
      })
    );

    const out = {};
    results.forEach(r => { if (r.status === 'fulfilled' && r.value?.[1]) out[r.value[0]] = r.value[1]; });
    res.status(200).json(out);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
