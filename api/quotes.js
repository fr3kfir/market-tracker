// Vercel serverless function — Yahoo Finance quotes via yahoo-finance2
import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { symbols } = req.query;
  if (!symbols) return res.status(400).json({ error: 'symbols required' });

  try {
    const symbolList = symbols.split(',').map(s => s.trim()).filter(Boolean);

    const results = await yf.quote(symbolList, {}, { validateResult: false });
    const resultArray = Array.isArray(results) ? results : (results ? [results] : []);

    // yahoo-finance2's `quote` module never returns sector/industry — those
    // only live in `quoteSummary`'s assetProfile module. Fetch it too, but
    // only for small requests (single-ticker lookups), so bulk universe
    // pulls don't pay for an extra call per symbol.
    if (symbolList.length <= 5) {
      await Promise.all(resultArray.map(async (r) => {
        if (!r?.symbol) return;
        try {
          const profile = await yf.quoteSummary(r.symbol, { modules: ['assetProfile'] }, { validateResult: false });
          if (profile?.assetProfile) {
            r.sector = profile.assetProfile.sector;
            r.industry = profile.assetProfile.industry;
          }
        } catch { /* sector/industry are optional enrichment */ }
      }));
    }

    res.status(200).json({ quoteResponse: { result: resultArray.filter(Boolean) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
