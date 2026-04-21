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

    res.status(200).json({ quoteResponse: { result: resultArray.filter(Boolean) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
