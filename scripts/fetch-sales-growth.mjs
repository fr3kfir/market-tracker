// Fetches quarterly revenue history for the tracked stock universe and
// computes multi-quarter YoY revenue growth acceleration ("Ariel style":
// each of the last 2-3 quarters' YoY growth rate higher than the previous
// quarter's, e.g. Q1 +10% -> Q2 +18% -> Q3 +27%).
//
// Run via `npm run fetch:sales-growth` (or the daily GitHub Action). Writes
// public/data/sales-growth.json, which the Screener fetches at runtime.
//
// Yahoo's quarterly revenue lives in `fundamentalsTimeSeries`, a per-symbol
// endpoint with no batch equivalent — this is why it's precomputed on a
// schedule instead of fetched live like quotes.

import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import YahooFinance from 'yahoo-finance2';
import { ALL_SYMBOLS, ALL_INDUSTRY_SYMBOLS } from '../src/data/stockUniverse.js';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const OUT_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data', 'sales-growth.json');
const CONCURRENCY = 8;
const RETRY_DELAY_MS = 1500;
const BATCH_DELAY_MS = 400; // be gentle on Yahoo between batches

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const TOLERANCE_MS = 65 * 24 * 60 * 60 * 1000; // +/- ~65 days around the 1-year mark

const REVENUE_KEYS = ['totalRevenue', 'quarterlyTotalRevenue', 'TotalRevenue'];
const EPS_KEYS = ['dilutedEPS', 'quarterlyDilutedEPS', 'DilutedEPS', 'basicEPS', 'BasicEPS'];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function extractField(entry, keys) {
  for (const k of keys) {
    if (typeof entry[k] === 'number') return entry[k];
  }
  return null;
}

function toDate(rawDate) {
  if (rawDate instanceof Date) return rawDate;
  if (typeof rawDate === 'number') return new Date(rawDate > 1e10 ? rawDate : rawDate * 1000);
  const d = new Date(rawDate);
  return isNaN(d.getTime()) ? null : d;
}

// Given quarters ({date, value}) sorted ascending by date, compute YoY growth
// (%) for each quarter that has a same-quarter-prior-year match within tolerance.
function computeYoYGrowth(quarters) {
  const points = [];
  for (let i = quarters.length - 1; i >= 0 && points.length < 3; i--) {
    const cur = quarters[i];
    const targetTime = cur.date.getTime() - YEAR_MS;
    let best = null, bestDiff = Infinity;
    for (const q of quarters) {
      if (q === cur) continue;
      const diff = Math.abs(q.date.getTime() - targetTime);
      if (diff < bestDiff) { bestDiff = diff; best = q; }
    }
    if (best && bestDiff <= TOLERANCE_MS && best.value > 0) {
      const growth = ((cur.value - best.value) / best.value) * 100;
      points.unshift({ date: cur.date, growth: Math.round(growth * 10) / 10 });
    }
  }
  return points; // oldest -> newest, up to 3
}

// Sequential quarter-over-quarter growth (%) — latest quarter vs the one
// immediately before it, the "Qtr Over Qtr" metric Finviz-style screeners use
// (distinct from the YoY acceleration series above).
function computeQoQGrowth(quarters) {
  if (quarters.length < 2) return null;
  const cur = quarters[quarters.length - 1];
  const prev = quarters[quarters.length - 2];
  if (!(prev.value > 0)) return null;
  return Math.round(((cur.value - prev.value) / prev.value) * 1000) / 10;
}

async function fetchTicker(ticker) {
  const period1 = new Date(Date.now() - 27 * 30 * 24 * 60 * 60 * 1000); // ~27 months back
  const result = await yf.fundamentalsTimeSeries(
    ticker,
    { period1, type: 'quarterly', module: 'financials' },
    { validateResult: false }
  );
  if (!Array.isArray(result) || !result.length) return null;

  const revQuarters = result
    .map(entry => {
      const date = toDate(entry.date);
      const value = extractField(entry, REVENUE_KEYS);
      return date && value != null ? { date, value } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.date - b.date);

  if (revQuarters.length < 5) return null; // need at least 1 YoY comparison

  const yoy = computeYoYGrowth(revQuarters);
  if (yoy.length < 2) return null;

  const accelerating = yoy.every((p, i) => i === 0 || p.growth > yoy[i - 1].growth) && yoy[yoy.length - 1].growth > 0;

  const epsQuarters = result
    .map(entry => {
      const date = toDate(entry.date);
      const value = extractField(entry, EPS_KEYS);
      return date && value != null ? { date, value } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.date - b.date);

  return {
    revenueGrowthYoY: yoy.map(p => p.growth),
    quarterDates: yoy.map(p => p.date.toISOString().slice(0, 10)),
    accelerating,
    latestGrowth: yoy[yoy.length - 1].growth,
    // Sequential quarter-over-quarter growth — the "Qtr Over Qtr" filter Finviz-style screeners use
    salesGrowthQoQ: computeQoQGrowth(revQuarters),
    epsGrowthQoQ: computeQoQGrowth(epsQuarters),
  };
}

async function fetchWithRetry(ticker) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await fetchTicker(ticker);
    } catch (err) {
      if (attempt === 0) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      console.warn(`  ✗ ${ticker}: ${err.message}`);
      return null;
    }
  }
  return null;
}

async function main() {
  const universe = [...new Set([...ALL_SYMBOLS, ...ALL_INDUSTRY_SYMBOLS])];
  console.log(`Fetching quarterly revenue for ${universe.length} tickers...`);

  const tickers = {};
  let done = 0, accelerating = 0;

  for (let i = 0; i < universe.length; i += CONCURRENCY) {
    const batch = universe.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(async t => [t, await fetchWithRetry(t)]));
    for (const [ticker, data] of results) {
      if (data) {
        tickers[ticker] = data;
        if (data.accelerating) accelerating++;
      }
    }
    done += batch.length;
    if (done % 40 === 0 || done === universe.length) {
      console.log(`  ${done}/${universe.length} processed, ${accelerating} accelerating so far`);
    }
    await sleep(BATCH_DELAY_MS);
  }

  const out = { generatedAt: new Date().toISOString(), tickers };
  await mkdir(path.dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(out));

  console.log(`✓ Wrote ${Object.keys(tickers).length} tickers (${accelerating} accelerating) to ${OUT_PATH}`);
}

main().catch(err => { console.error(err); process.exit(1); });
