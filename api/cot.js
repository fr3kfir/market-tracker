// api/cot.js — CFTC Commitment of Traders (COT) net positioning
// Source: CFTC "Legacy - Futures Only" Socrata dataset (weekly, published Fridays).
// Net position = Long - Short for each trader class:
//   Large Specs  = Noncommercial (funds/large speculators)
//   Commercials  = Commercial hedgers
//   Small Specs  = Nonreportable (retail-sized, below reporting threshold)
const COT_BASE = 'https://publicreporting.cftc.gov/resource/6dca-aqww.json';

// market_and_exchange_names substrings for supported contracts.
// Matched with a case-insensitive LIKE so exact CFTC naming/codes don't need to be memorized.
const CONTRACTS = {
  ES:  { label: 'S&P 500 E-Mini (ES)',      like: 'E-MINI S&P 500' },
  NQ:  { label: 'Nasdaq-100 E-Mini (NQ)',   like: 'NASDAQ-100' },
  YM:  { label: 'Dow E-Mini (YM)',          like: 'DOW JONES' },
  RTY: { label: 'Russell 2000 E-Mini (RTY)',like: 'RUSSELL' },
  VIX: { label: 'VIX Futures',              like: 'VIX FUTURES' },
  GC:  { label: 'Gold (GC)',                like: 'GOLD' },
  SI:  { label: 'Silver (SI)',              like: 'SILVER' },
  CL:  { label: 'Crude Oil WTI (CL)',       like: 'CRUDE OIL, LIGHT SWEET' },
  NG:  { label: 'Natural Gas (NG)',         like: 'NATURAL GAS' },
  DX:  { label: 'US Dollar Index (DX)',     like: 'USD INDEX' },
  ZN:  { label: '10-Yr T-Note (ZN)',        like: '10-YEAR U.S. TREASURY NOTES' },
  ZB:  { label: '30-Yr T-Bond (ZB)',        like: 'U.S. TREASURY BONDS' },
  BTC: { label: 'Bitcoin (BTC)',            like: 'BITCOIN' },
};

const _cache = {}; // { [contract]: { ts, rows } }
const TTL_MS = 6 * 60 * 60 * 1000; // COT updates once a week (Fri) — 6h cache is plenty fresh

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

async function fetchCotRows(contractKey) {
  const def = CONTRACTS[contractKey];
  if (!def) return null;

  const now = Date.now();
  if (_cache[contractKey] && (now - _cache[contractKey].ts) < TTL_MS) {
    return _cache[contractKey].rows;
  }

  const where = `market_and_exchange_names like '%25${encodeURIComponent(def.like)}%25'`;
  const url = `${COT_BASE}?$where=${where}&$order=report_date_as_yyyy_mm_dd ASC&$limit=300`;

  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`CFTC API ${r.status}`);
  const raw = await r.json();

  // A LIKE match on the contract name can pull in related contracts sharing the
  // substring (e.g. minis and non-minis) — pin to the single most frequent
  // market_and_exchange_names value, which is the specific contract we searched for.
  const counts = {};
  for (const row of raw) {
    const name = row.market_and_exchange_names;
    counts[name] = (counts[name] || 0) + 1;
  }
  const primaryName = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const filtered = primaryName ? raw.filter(row => row.market_and_exchange_names === primaryName) : raw;

  const rows = filtered.map(row => {
    const largeLong  = num(row.noncomm_positions_long_all);
    const largeShort = num(row.noncomm_positions_short_all);
    const commLong   = num(row.comm_positions_long_all);
    const commShort  = num(row.comm_positions_short_all);
    const smallLong   = num(row.nonrept_positions_long_all);
    const smallShort  = num(row.nonrept_positions_short_all);
    return {
      date: row.report_date_as_yyyy_mm_dd?.slice(0, 10),
      largeSpecsLong: largeLong, largeSpecsShort: largeShort, largeSpecsNet: largeLong - largeShort,
      commercialsLong: commLong, commercialsShort: commShort, commercialsNet: commLong - commShort,
      smallSpecsLong: smallLong, smallSpecsShort: smallShort, smallSpecsNet: smallLong - smallShort,
      openInterest: num(row.open_interest_all),
    };
  }).filter(r => r.date);

  _cache[contractKey] = { ts: now, rows };
  return rows;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const contract = (req.query.contract || 'ES').toUpperCase();

  if (contract === '_LIST') {
    return res.status(200).json({
      contracts: Object.entries(CONTRACTS).map(([key, v]) => ({ key, label: v.label })),
    });
  }

  if (!CONTRACTS[contract]) {
    return res.status(400).json({ error: `Unknown contract "${contract}"`, available: Object.keys(CONTRACTS) });
  }

  try {
    const rows = await fetchCotRows(contract);
    res.status(200).json({ contract, label: CONTRACTS[contract].label, rows });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}
