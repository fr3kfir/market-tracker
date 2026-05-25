// api/expected-move.js — Options straddle implied expected move (EM)
// EM% = (ATM call mid + ATM put mid) / stock price × 100
// Uses nearest-expiry chain for the most liquid, tightest bid/ask.
import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance();

// Per-symbol cache (lives while the function stays warm)
const _cache = {};
const TTL_MS = 20 * 60 * 1000; // 20 minutes

function midPrice(opt) {
  if (opt.ask > 0 && opt.bid >= 0) return (opt.ask + opt.bid) / 2;
  return opt.lastPrice || 0;
}

async function calcExpectedMove(symbol, price) {
  if (!price || price <= 0) return null;

  try {
    // 1. Get available expiry dates (sorted nearest → farthest)
    const meta = await yf.options(symbol, {}, { validateResult: false });
    const expiries = meta?.expirationDates;
    if (!expiries?.length) return null;

    // 2. Fetch the nearest-expiry options chain (most liquid)
    const chainData = await yf.options(symbol, { date: expiries[0] }, { validateResult: false });
    const opts = chainData?.options?.[0];
    if (!opts) return null;

    const calls = opts.calls || [];
    const puts  = opts.puts  || [];
    if (!calls.length || !puts.length) return null;

    // 3. Find ATM strike (closest to current price)
    let atmStrike = null, minDist = Infinity;
    for (const c of calls) {
      const d = Math.abs(c.strike - price);
      if (d < minDist) { minDist = d; atmStrike = c.strike; }
    }
    if (!atmStrike) return null;

    const atmCall = calls.find(c => c.strike === atmStrike);
    const atmPut  = puts.find(p  => p.strike === atmStrike);
    if (!atmCall || !atmPut) return null;

    // 4. Straddle mid = call mid + put mid
    const straddle = midPrice(atmCall) + midPrice(atmPut);
    if (straddle <= 0) return null;

    // 5. EM% rounded to 1 decimal
    const em = Math.round((straddle / price) * 1000) / 10;
    return em > 0 ? em : null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { symbols, prices } = req.query;
  if (!symbols) return res.status(400).json({ error: 'symbols required' });

  const symList = symbols.split(',').map(s => s.trim()).filter(Boolean);

  // Parse price map: "AAPL:175.50,NVDA:875.20"
  const priceMap = {};
  if (prices) {
    prices.split(',').forEach(p => {
      const [s, v] = p.split(':');
      if (s && v) priceMap[s.trim()] = parseFloat(v);
    });
  }

  const now = Date.now();
  const result = {};

  await Promise.allSettled(
    symList.map(async sym => {
      // Return from cache if fresh
      if (_cache[sym] && (now - _cache[sym].ts) < TTL_MS) {
        if (_cache[sym].em != null) result[sym] = _cache[sym].em;
        return;
      }
      const em = await calcExpectedMove(sym, priceMap[sym]);
      _cache[sym] = { em, ts: now };
      if (em != null) result[sym] = em;
    })
  );

  res.status(200).json(result);
}
