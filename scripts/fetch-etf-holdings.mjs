// Fetches the FULL holdings of every ETF in src/data/etfUniverse.js from
// SEC N-PORT filings and writes public/data/etf-holdings.json, which the
// ETF Holders tab loads at runtime.
//
// Why: Yahoo's topHoldings (used live by /api/etf-holders) only returns an
// ETF's top 10 positions, so a stock like IONQ in equal-weighted QTUM
// (~70 names) never shows up. N-PORT lists every position.
//
// Pipeline per ETF:
//   ticker → (cik, seriesId)   via sec.gov/files/company_tickers_mf.json
//   seriesId → latest NPORT-P   via EDGAR browse (atom feed)
//   primary_doc.xml → positions (name, CUSIP, % of net assets)
//   CUSIP → ticker              via OpenFIGI, cached in scripts/data/cusip-tickers.json
//
// N-PORT is published quarterly with a ~60-day lag, so weights can be a few
// months old; the live Yahoo top-10 layer keeps the biggest positions fresh.
//
// Run via `npm run fetch:etf-holdings` (or the daily GitHub Action).

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ETF_UNIVERSE } from '../src/data/etfUniverse.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_PATH = path.join(ROOT, 'public', 'data', 'etf-holdings.json');
const CUSIP_CACHE_PATH = path.join(ROOT, 'scripts', 'data', 'cusip-tickers.json');

// SEC rejects (403) requests whose User-Agent isn't a plain "Name email" pair.
const SEC_UA = 'MarketTracker contact@market-tracker-seven.vercel.app';
const SEC_DELAY_MS = 150;          // SEC fair-access limit is 10 req/s
const FIGI_BATCH = 10;             // OpenFIGI without an API key: 10 jobs/request…
const FIGI_DELAY_MS = 2600;        // …and 25 requests/minute

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function secFetch(url, attempt = 0) {
  await sleep(SEC_DELAY_MS);
  const r = await fetch(url, { headers: { 'User-Agent': SEC_UA, 'Accept-Encoding': 'gzip, deflate' } });
  if ((r.status === 429 || r.status >= 500) && attempt < 3) {
    await sleep(2000 * 2 ** attempt);
    return secFetch(url, attempt + 1);
  }
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r;
}

// ticker → { cik, seriesId } for every mutual fund / ETF share class on EDGAR
async function loadFundDirectory() {
  const d = await (await secFetch('https://www.sec.gov/files/company_tickers_mf.json')).json();
  const idx = Object.fromEntries(d.fields.map((f, i) => [f, i]));
  const map = {};
  for (const row of d.data) {
    map[String(row[idx.symbol]).toUpperCase()] = { cik: row[idx.cik], seriesId: row[idx.seriesId] };
  }
  return map;
}

// Latest NPORT-P for a series → URL of its primary_doc.xml. EDGAR's browse
// page accepts a series ID as the CIK (its atom output doesn't), newest first.
async function latestNportUrl(seriesId) {
  const html = await (await secFetch(
    `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${seriesId}&type=NPORT-P&dateb=&owner=include&count=10`
  )).text();
  const m = html.match(/href="(\/Archives\/edgar\/data\/\d+\/\d+)\/[\d-]+-index\.html?"/);
  return m ? `https://www.sec.gov${m[1]}/primary_doc.xml` : null;
}

const tag = (block, name) => block.match(new RegExp(`<${name}>([^<]*)</${name}>`))?.[1]?.trim() ?? null;
const decode = (s) => s?.replace(/&amp;/g, '&').replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

function parseNport(xml) {
  const repPdDate = tag(xml, 'repPdDate');
  const seriesName = decode(tag(xml, 'seriesName'));
  const positions = [];
  for (const [, block] of xml.matchAll(/<invstOrSec>([\s\S]*?)<\/invstOrSec>/g)) {
    const assetCat = tag(block, 'assetCat');
    const pct = parseFloat(tag(block, 'pctVal'));
    if (assetCat !== 'EC' || !(pct > 0)) continue; // equities only, long positions
    const cusip = tag(block, 'cusip');
    positions.push({
      name: decode(tag(block, 'name') || tag(block, 'title') || ''),
      cusip: cusip && /^[0-9A-Z]{9}$/.test(cusip) && cusip !== '000000000' ? cusip : null,
      ticker: block.match(/<ticker value="([^"]+)"/)?.[1]?.toUpperCase() ?? null,
      weight: pct,
    });
  }
  return { asOf: repPdDate, name: seriesName, positions };
}

async function resolveCusips(cusips, cache) {
  const todo = [...cusips].filter(c => !(c in cache));
  console.log(`OpenFIGI: ${todo.length} new CUSIPs to resolve (${Object.keys(cache).length} cached)`);
  for (let i = 0; i < todo.length; i += FIGI_BATCH) {
    const batch = todo.slice(i, i + FIGI_BATCH);
    for (let attempt = 0; attempt < 4; attempt++) {
      const r = await fetch('https://api.openfigi.com/v3/mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch.map(c => ({ idType: 'ID_CUSIP', idValue: c, exchCode: 'US' }))),
      });
      if (r.status === 429) { await sleep(15000); continue; }
      if (!r.ok) { console.warn(`OpenFIGI ${r.status}`); break; }
      const res = await r.json();
      batch.forEach((c, j) => {
        const t = res[j]?.data?.[0]?.ticker;
        // Yahoo-style share classes: BRK/B → BRK-B. null = known-unresolvable.
        cache[c] = t ? t.replace('/', '-').toUpperCase() : null;
      });
      break;
    }
    await sleep(FIGI_DELAY_MS);
  }
}

async function main() {
  const cache = JSON.parse(await readFile(CUSIP_CACHE_PATH, 'utf8').catch(() => '{}'));
  const funds = await loadFundDirectory();

  const raw = {};
  for (const etf of [...new Set(ETF_UNIVERSE)]) {
    const f = funds[etf];
    if (!f) { console.warn(`${etf}: not in SEC fund directory`); continue; }
    try {
      const url = await latestNportUrl(f.seriesId);
      if (!url) { console.warn(`${etf}: no NPORT-P filing`); continue; }
      const parsed = parseNport(await (await secFetch(url)).text());
      if (!parsed.positions.length) { console.warn(`${etf}: 0 equity positions (${url})`); continue; }
      raw[etf] = parsed;
      console.log(`${etf}: ${parsed.positions.length} positions as of ${parsed.asOf}`);
    } catch (err) {
      console.warn(`${etf}: ${err.message}`);
    }
  }

  const cusips = new Set(Object.values(raw).flatMap(e => e.positions.filter(p => !p.ticker && p.cusip).map(p => p.cusip)));
  await resolveCusips(cusips, cache);

  const etfs = {};
  for (const [etf, { asOf, name, positions }] of Object.entries(raw)) {
    const merged = new Map();
    for (const p of positions) {
      const sym = p.ticker || (p.cusip && cache[p.cusip]);
      if (!sym) continue;
      merged.set(sym, { n: p.name, w: (merged.get(sym)?.w || 0) + p.weight });
    }
    etfs[etf] = {
      name, asOf,
      holdings: [...merged.entries()]
        .sort((a, b) => b[1].w - a[1].w)
        .map(([s, { n, w }]) => [s, n, Math.round(w * 100) / 100]),
    };
  }

  await mkdir(path.dirname(OUT_PATH), { recursive: true });
  await mkdir(path.dirname(CUSIP_CACHE_PATH), { recursive: true });
  await writeFile(CUSIP_CACHE_PATH, JSON.stringify(Object.fromEntries(Object.entries(cache).sort()), null, 0) + '\n');
  await writeFile(OUT_PATH, JSON.stringify({ updatedAt: new Date().toISOString(), etfs }) + '\n');
  console.log(`Wrote ${Object.keys(etfs).length}/${new Set(ETF_UNIVERSE).size} ETFs → ${path.relative(ROOT, OUT_PATH)}`);
  if (!Object.keys(etfs).length) process.exit(1);
}

main().catch(err => { console.error(err); process.exit(1); });
