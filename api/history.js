// Vercel serverless function — Yahoo Finance history via yahoo-finance2
import yahooFinance from 'yahoo-finance2';

function rangeToDate(range) {
  const d = new Date();
  if (range === '1y')  d.setFullYear(d.getFullYear() - 1);
  else if (range === '6mo') d.setMonth(d.getMonth() - 6);
  else if (range === '3mo') d.setMonth(d.getMonth() - 3);
  else d.setFullYear(d.getFullYear() - 1);
  return d;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { symbols, range = '6mo' } = req.query;
  if (!symbols) return res.status(400).json({ error: 'symbols required' });

  try {
    const list = symbols.split(',').map(s => s.trim()).filter(Boolean);
    const period1 = rangeToDate(range);

    const results = await Promise.allSettled(
      list.map(async (sym) => {
        const chart = await yahooFinance.chart(sym, { period1, interval: '1d' }, { validateResult: false });
        if (!chart?.quotes?.length) return [sym, null];
        const closes = chart.quotes.map(q => q.close);
        const timestamps = chart.quotes.map(q => Math.floor(new Date(q.date).getTime() / 1000));
        return [sym, { closes, timestamps }];
      })
    );

    const out = {};
    results.forEach(r => { if (r.status === 'fulfilled' && r.value?.[1]) out[r.value[0]] = r.value[1]; });
    res.status(200).json(out);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
