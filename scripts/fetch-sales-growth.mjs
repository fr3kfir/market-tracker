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
const CONCURRENCY = 4;
const RETRY_BACKOFF_MS = [2000, 6000, 15000]; // exponential backoff — Yahoo rate-limits bursts hard on this endpoint
const BATCH_DELAY_MS = 1000; // be gentle on Yahoo between batches — now 2 calls/ticker (financials + earnings history)

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

// Nearest same-quarter-prior-year match for `cur`, within tolerance, or null.
function nearestYoYQuarter(quarters, cur) {
  const targetTime = cur.date.getTime() - YEAR_MS;
  let best = null, bestDiff = Infinity;
  for (const q of quarters) {
    if (q === cur) continue;
    const diff = Math.abs(q.date.getTime() - targetTime);
    if (diff < bestDiff) { bestDiff = diff; best = q; }
  }
  return best && bestDiff <= TOLERANCE_MS ? best : null;
}

// Given quarters ({date, value}) sorted ascending by date, compute YoY growth
// (%) for each quarter that has a same-quarter-prior-year match within tolerance.
function computeYoYGrowth(quarters) {
  const points = [];
  for (let i = quarters.length - 1; i >= 0 && points.length < 3; i--) {
    const cur = quarters[i];
    const best = nearestYoYQuarter(quarters, cur);
    if (best && best.value > 0) {
      const growth = ((cur.value - best.value) / best.value) * 100;
      points.unshift({ date: cur.date, growth: Math.round(growth * 10) / 10 });
    }
  }
  return points; // oldest -> newest, up to 3
}

// Latest-quarter YoY growth for EPS specifically, plus a loss→profit flag for
// when the prior-year quarter was breakeven/negative (in which case a growth
// % is undefined/misleading — screeners ask for "growth OR turned profitable").
function computeEpsYoY(quarters) {
  if (!quarters.length) return { growth: null, turnedProfitable: false };
  const cur = quarters[quarters.length - 1];
  const best = nearestYoYQuarter(quarters, cur);
  if (!best) return { growth: null, turnedProfitable: false };
  if (best.value > 0) {
    return { growth: Math.round(((cur.value - best.value) / best.value) * 1000) / 10, turnedProfitable: false };
  }
  return { growth: null, turnedProfitable: cur.value > 0 };
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

// Returns { data } on success or { reason } on a well-formed "nothing to report"
// result (as opposed to a thrown network/API error) — the reason is tallied in
// main() so a CI run's log shows exactly where coverage is being lost.
async function fetchTicker(ticker) {
  // Extending this further doesn't help: verified that Yahoo's fundamentalsTimeSeries
  // caps out at ~5-6 quarters for the vast majority of tickers regardless of period1
  // (a 40-month request returned the exact same 5 tickers with 2+ YoY points as 27
  // months did). "accelerating" needs 2+ YoY-matched points, which needs ~9 clean
  // quarters — that's a real ceiling on Yahoo's side for most symbols, not this window.
  const period1 = new Date(Date.now() - 27 * 30 * 24 * 60 * 60 * 1000); // ~27 months back
  const result = await yf.fundamentalsTimeSeries(
    ticker,
    { period1, type: 'quarterly', module: 'financials' },
    { validateResult: false }
  );
  if (!Array.isArray(result) || !result.length) return { reason: 'empty-result' };

  const revQuarters = result
    .map(entry => {
      const date = toDate(entry.date);
      const value = extractField(entry, REVENUE_KEYS);
      return date && value != null ? { date, value } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.date - b.date);

  if (revQuarters.length < 5) return { reason: 'too-few-revenue-quarters' };

  const yoy = computeYoYGrowth(revQuarters);
  // Only 1 YoY point is needed to report a growth figure at all; "accelerating"
  // (which compares consecutive YoY rates) additionally needs 2+ below.
  if (yoy.length < 1) return { reason: 'too-few-yoy-matches' };

  const accelerating = yoy.length >= 2
    && yoy.every((p, i) => i === 0 || p.growth > yoy[i - 1].growth)
    && yoy[yoy.length - 1].growth > 0;

  const epsQuarters = result
    .map(entry => {
      const date = toDate(entry.date);
      const value = extractField(entry, EPS_KEYS);
      return date && value != null ? { date, value } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.date - b.date);

  const epsYoy = computeEpsYoY(epsQuarters);

  // Earnings surprise — optional enrichment via a second, lighter-weight call.
  // Never let this fail the whole ticker; just omit it if Yahoo balks.
  let epsSurprisePercent = null;
  try {
    await sleep(300); // spread the two calls out instead of firing back-to-back
    const es = await yf.quoteSummary(ticker, { modules: ['earningsHistory'] }, { validateResult: false });
    const hist = es?.earningsHistory?.history;
    const latest = Array.isArray(hist) && hist.length ? hist[hist.length - 1] : null;
    if (latest && typeof latest.surprisePercent === 'number') {
      // Yahoo reports this as a fraction (0.052 = +5.2%)
      epsSurprisePercent = Math.round(latest.surprisePercent * 1000) / 10;
    }
  } catch { /* optional — leave epsSurprisePercent null */ }

  return {
    data: {
      revenueGrowthYoY: yoy.map(p => p.growth),
      quarterDates: yoy.map(p => p.date.toISOString().slice(0, 10)),
      accelerating,
      latestGrowth: yoy[yoy.length - 1].growth,
      // Sequential quarter-over-quarter growth — the "Qtr Over Qtr" filter Finviz-style screeners use
      salesGrowthQoQ: computeQoQGrowth(revQuarters),
      epsGrowthQoQ: computeQoQGrowth(epsQuarters),
      // Latest-quarter YoY EPS growth (or a loss→profit flag when % is undefined)
      epsGrowthYoY: epsYoy.growth,
      epsTurnedProfitable: epsYoy.turnedProfitable,
      // Last reported quarter's beat/miss vs analyst estimate, in % (+ = beat)
      epsSurprisePercent,
    },
  };
}

async function fetchWithRetry(ticker) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fetchTicker(ticker);
    } catch (err) {
      if (attempt < RETRY_BACKOFF_MS.length) {
        await sleep(RETRY_BACKOFF_MS[attempt]);
        continue;
      }
      return { reason: `error: ${err.message}` };
    }
  }
}

async function main() {
  const universe = [...new Set([...ALL_SYMBOLS, ...ALL_INDUSTRY_SYMBOLS])];
  console.log(`Fetching quarterly revenue for ${universe.length} tickers...`);

  const tickers = {};
  const reasonCounts = {};
  let done = 0, accelerating = 0;

  for (let i = 0; i < universe.length; i += CONCURRENCY) {
    const batch = universe.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(async t => [t, await fetchWithRetry(t)]));
    for (const [ticker, { data, reason }] of results) {
      if (data) {
        tickers[ticker] = data;
        if (data.accelerating) accelerating++;
      } else if (reason) {
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
      }
    }
    done += batch.length;
    if (done % 40 === 0 || done === universe.length) {
      console.log(`  ${done}/${universe.length} processed, ${Object.keys(tickers).length} with data so far`);
    }
    await sleep(BATCH_DELAY_MS);
  }

  const out = { generatedAt: new Date().toISOString(), tickers };
  await mkdir(path.dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(out));

  console.log(`✓ Wrote ${Object.keys(tickers).length} tickers (${accelerating} accelerating) to ${OUT_PATH}`);
  console.log('Failure reasons:', JSON.stringify(reasonCounts, null, 2));
}

main().catch(err => { console.error(err); process.exit(1); });
