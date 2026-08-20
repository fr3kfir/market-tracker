// Vercel serverless function — company sector/industry via yahoo-finance2's
// quoteSummary assetProfile module. The plain /v7/finance/quote endpoint
// (used by /api/quotes) never carries sector/industry — those only live in
// this separate module — so out-of-universe ticker lookups need this too.
import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol required' });

  try {
    const result = await yf.quoteSummary(symbol, { modules: ['assetProfile'] }, { validateResult: false });
    const profile = result?.assetProfile || {};
    res.status(200).json({ sector: profile.sector || null, industry: profile.industry || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
