// api/earnings.js — upcoming earnings dates via Yahoo Finance quoteSummary calendarEvents
// This is far more reliable than the basic quote's earningsTimestamp fields.
// Results are cached module-level for 1 hour (works while function stays warm).
import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance();

let _cache     = null;
let _cacheTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/** Fetch next earnings date for one symbol using calendarEvents module */
async function getEarningsDate(symbol) {
  try {
    const data = await yf.quoteSummary(
      symbol,
      { modules: ['calendarEvents'] },
      { validateResult: false }
    );

    const earningsDates = data?.calendarEvents?.earnings?.earningsDate;
    if (!earningsDates?.length) return null;

    // Yahoo returns an array — can be [startDate, endDate] for a window.
    // Take the FIRST date (start of window / best estimate).
    const raw = earningsDates[0];

    let d;
    if (raw instanceof Date) {
      d = raw;
    } else if (raw != null && typeof raw === 'object' && raw.raw != null) {
      d = new Date(raw.raw * 1000); // yahoo-finance2 sometimes wraps { raw, fmt }
    } else if (typeof raw === 'number') {
      d = new Date(raw > 1e10 ? raw : raw * 1000); // ms vs seconds
    } else {
      return null;
    }

    if (isNaN(d.getTime())) return null;

    const msFromNow = d.getTime() - Date.now();
    // Accept: up to 7 days ago (just reported) or up to 120 days ahead (announced early)
    if (msFromNow < -7 * 864e5 || msFromNow > 120 * 864e5) return null;

    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Serve cache if fresh
  const now = Date.now();
  if (_cache && (now - _cacheTime) < CACHE_TTL_MS) {
    return res.status(200).json(_cache);
  }

  const { symbols } = req.query;
  if (!symbols) return res.status(400).json({ error: 'symbols required' });

  const symbolList = symbols.split(',').map(s => s.trim()).filter(Boolean);

  // Fetch all symbols in parallel — yahoo-finance2 is one HTTP call per symbol,
  // but they all start at once. Vercel functions run up to 10s (hobby) / 60s (pro).
  const settled = await Promise.allSettled(
    symbolList.map(async sym => ({ sym, date: await getEarningsDate(sym) }))
  );

  const result = {};
  settled.forEach(r => {
    if (r.status === 'fulfilled' && r.value?.date) {
      result[r.value.sym] = r.value.date;
    }
  });

  _cache     = result;
  _cacheTime = now;
  res.status(200).json(result);
}
