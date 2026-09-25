// api/etf-holders.js — "which ETFs hold this stock?"
//
// GET /api/etf-holders?ticker=NBIS
//   → { ticker, holders: [{ etf, name, weight, holdings: [{ symbol, name, weight }] }],
//       self, scanned, updatedAt }
//
// Yahoo's quoteSummary `topHoldings` module returns an ETF's top-10 positions.
// We pull it for a curated universe of sector + thematic ETFs, invert it into a
// stock → ETFs index, and cache the whole scan module-level for 12 hours
// (the holdings only change on rebalances). A stock only shows up under an ETF
// when it is one of that ETF's top-10 holdings.
import YahooFinance from 'yahoo-finance2';
import { ETF_UNIVERSE } from '../src/data/etfUniverse.js';

const yf = new YahooFinance();

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const CONCURRENCY = 8;

let _index = null;       // { byStock: Map<symbol, [{ etf, weight }]>, etfs: { [etf]: { name, holdings } } }
let _indexTime = 0;
let _building = null;    // in-flight build promise, so concurrent requests share one scan

const num = (v) => (v != null && typeof v === 'object' && 'raw' in v ? v.raw : v);

async function fetchEtf(symbol) {
  try {
    const d = await yf.quoteSummary(symbol, { modules: ['topHoldings', 'price'] }, { validateResult: false });
    const holdings = (d?.topHoldings?.holdings || [])
      .map(h => ({
        symbol: String(h.symbol || '').toUpperCase(),
        name: h.holdingName || '',
        weight: typeof num(h.holdingPercent) === 'number' ? num(h.holdingPercent) * 100 : null,
      }))
      .filter(h => h.symbol);
    if (!holdings.length) return null;
    return { name: d?.price?.longName || d?.price?.shortName || symbol, holdings };
  } catch {
    return null;
  }
}

async function buildIndex() {
  const symbols = [...new Set(ETF_UNIVERSE)];
  const etfs = {};
  for (let i = 0; i < symbols.length; i += CONCURRENCY) {
    const batch = symbols.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(fetchEtf));
    batch.forEach((sym, j) => { if (results[j]) etfs[sym] = results[j]; });
  }

  const byStock = new Map();
  for (const [etf, { holdings }] of Object.entries(etfs)) {
    for (const h of holdings) {
      if (!byStock.has(h.symbol)) byStock.set(h.symbol, []);
      byStock.get(h.symbol).push({ etf, weight: h.weight });
    }
  }
  return { byStock, etfs, scanned: symbols.length };
}

async function getIndex() {
  if (_index && Date.now() - _indexTime < CACHE_TTL_MS) return _index;
  if (!_building) {
    _building = buildIndex()
      .then(idx => {
        // Don't cache an empty scan (Yahoo outage / rate-limit) for 12h.
        if (Object.keys(idx.etfs).length) { _index = idx; _indexTime = Date.now(); }
        return idx;
      })
      .finally(() => { _building = null; });
  }
  return _building;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const ticker = String(req.query.ticker || '').trim().toUpperCase();
  if (!/^[A-Z0-9.^-]{1,12}$/.test(ticker)) return res.status(400).json({ error: 'ticker required' });

  try {
    const idx = await getIndex();
    const holders = (idx.byStock.get(ticker) || [])
      .map(({ etf, weight }) => ({ etf, name: idx.etfs[etf].name, weight, holdings: idx.etfs[etf].holdings }))
      .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0));

    // If the query is itself an ETF, return its own holdings too.
    const self = idx.etfs[ticker] || (holders.length ? null : await fetchEtf(ticker));

    res.status(200).json({
      ticker,
      holders,
      self: self ? { etf: ticker, ...self } : null,
      scanned: Object.keys(idx.etfs).length,
      updatedAt: _indexTime || Date.now(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
