// Vercel serverless function — Yahoo Finance assetProfile via yahoo-finance2
import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol required' });

  try {
    const summary = await yf.quoteSummary(symbol, { modules: ['assetProfile'] }, { validateResult: false });
    const profile = summary?.assetProfile || {};
    res.status(200).json({ sector: profile.sector || null, industry: profile.industry || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
