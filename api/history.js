// Vercel serverless function — Yahoo Finance history via yahoo-finance2
import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance();

function rangeToDate(range) {
  const d = new Date();
  if      (range === '2y')  d.setFullYear(d.getFullYear() - 2);
  else if (range === '1y')  d.setFullYear(d.getFullYear() - 1);
  else if (range === '6mo') d.setMonth(d.getMonth() - 6);
  else if (range === '3mo') d.setMonth(d.getMonth() - 3);
  else if (range === '1mo') d.setMonth(d.getMonth() - 1);
  else if (range === '5d')  d.setDate(d.getDate() - 8); // ~5 trading days
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
        const chart = await yf.chart(sym, { period1, interval: '1d' }, { validateResult: false });
        if (!chart?.quotes?.length) return [sym, null];
        const valid = chart.quotes.filter(q => q.close != null);
        const closes = valid.map(q => q.close);
        const timestamps = valid.map(q => Math.floor(q.date.getTime() / 1000));
        const ohlcv = valid.map(q => ({
          time:   Math.floor(q.date.getTime() / 1000),
          open:   q.open   ?? q.close,
          high:   q.high   ?? q.close,
          low:    q.low    ?? q.close,
          close:  q.close,
          volume: q.volume ?? 0,
        }));
        return [sym, { closes, timestamps, ohlcv }];
      })
    );

    const out = {};
    results.forEach(r => { if (r.status === 'fulfilled' && r.value?.[1]) out[r.value[0]] = r.value[1]; });
    res.status(200).json(out);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
