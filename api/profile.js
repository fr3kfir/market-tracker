const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

async function getCrumb() {
  // Step 1: get cookie from Yahoo
  const cookieRes = await fetch('https://fc.yahoo.com/v1/test/csrfToken', {
    headers: { 'User-Agent': UA },
    redirect: 'follow',
  });
  const cookie = cookieRes.headers.get('set-cookie') || '';

  // Step 2: fetch crumb
  const crumbRes = await fetch('https://query2.finance.yahoo.com/v1/test/getcrumb', {
    headers: { 'User-Agent': UA, Cookie: cookie },
  });
  const crumb = await crumbRes.text();
  return { crumb: crumb.trim(), cookie };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol required' });

  try {
    const { crumb, cookie } = await getCrumb();
    const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=assetProfile&crumb=${encodeURIComponent(crumb)}`;
    const r = await fetch(url, { headers: { 'User-Agent': UA, Cookie: cookie } });
    if (!r.ok) return res.status(r.status).json({ error: `Yahoo returned ${r.status}` });
    const d = await r.json();
    const profile = d?.quoteSummary?.result?.[0]?.assetProfile || {};
    res.status(200).json({ sector: profile.sector || null, industry: profile.industry || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
