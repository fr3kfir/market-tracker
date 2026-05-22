const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: 'ticker required' });

  try {
    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(ticker)}&quotesCount=0&newsCount=8&lang=en-US&region=US&enableFuzzyQuery=false`;
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!r.ok) return res.status(r.status).json({ error: 'Yahoo Finance error' });
    const d = await r.json();
    const news = (d?.news || []).map(n => ({
      title: n.title,
      link: n.link,
      publisher: n.publisher,
      time: n.providerPublishTime,
      thumbnail: n.thumbnail?.resolutions?.[0]?.url ?? null,
    }));
    res.json({ news });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
