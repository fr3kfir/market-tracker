// Netlify serverless function — Yahoo Finance proxy with crumb auth
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const FIELDS = [
  'regularMarketPrice', 'regularMarketChangePercent', 'regularMarketOpen',
  'regularMarketVolume', 'averageDailyVolume3Month',
  'fiftyDayAverage', 'twoHundredDayAverage',
  'fiftyTwoWeekHigh', 'fiftyTwoWeekLow', 'shortName', 'longName',
  'sector', 'industry',
].join(',');

async function getAuth() {
  const r1 = await fetch('https://fc.yahoo.com', {
    redirect: 'follow',
    headers: { 'User-Agent': UA }
  });
  const raw = r1.headers.getSetCookie?.() || [];
  const cookieStr = raw.map(c => c.split(';')[0]).join('; ');

  const r2 = await fetch('https://query2.finance.yahoo.com/v1/test/getcrumb', {
    headers: { Cookie: cookieStr, 'User-Agent': UA }
  });
  const crumb = await r2.text();
  return { cookieStr, crumb };
}

exports.handler = async (event) => {
  const { symbols, type, range = '6mo', interval = '1d' } = event.queryStringParameters || {};
  const HISTORY_INTERVALS = new Set(['1d', '60m', '30m', '15m', '5m', '1wk', '1mo']);
  const iv = HISTORY_INTERVALS.has(interval) ? interval : '1d';
  if (!symbols) return { statusCode: 400, body: JSON.stringify({ error: 'symbols required' }) };

  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

  try {
    const { cookieStr, crumb } = await getAuth();
    const yfHeaders = { 'User-Agent': UA, Cookie: cookieStr, Accept: 'application/json' };

    if (type === 'history') {
      const list = symbols.split(',').map(s => s.trim());
      const results = await Promise.allSettled(
        list.map(async (sym) => {
          const url = `https://query2.finance.yahoo.com/v8/finance/chart/${sym}?interval=${iv}&range=${range}&crumb=${encodeURIComponent(crumb)}`;
          const r = await fetch(url, { headers: yfHeaders });
          const data = await r.json();
          const result = data?.chart?.result?.[0];
          if (!result) return [sym, null];
          const q = result.indicators.quote[0];
          return [sym, { closes: q.close, highs: q.high, lows: q.low, timestamps: result.timestamp }];
        })
      );
      const out = {};
      results.forEach(r => { if (r.status === 'fulfilled' && r.value) out[r.value[0]] = r.value[1]; });
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(out) };
    }

    // Default: batch quotes (split into chunks of 100)
    const symbolList = symbols.split(',').map(s => s.trim());
    const chunks = [];
    for (let i = 0; i < symbolList.length; i += 100) chunks.push(symbolList.slice(i, i + 100));

    const allResults = [];
    for (const chunk of chunks) {
      const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(chunk.join(','))}&fields=${FIELDS}&formatted=false&lang=en-US&region=US&crumb=${encodeURIComponent(crumb)}`;
      const r = await fetch(url, { headers: yfHeaders });
      const data = await r.json();
      const results = data?.quoteResponse?.result || [];
      allResults.push(...results);
    }

    // v7/finance/quote doesn't reliably carry sector/industry even when
    // requested via `fields` — those live in quoteSummary's assetProfile
    // module. Backfill from there, but only for small (single-ticker) lookups
    // so bulk universe pulls don't pay for an extra call per symbol.
    if (symbolList.length <= 5) {
      await Promise.all(allResults.map(async (r) => {
        if (!r?.symbol || (r.sector && r.industry)) return;
        try {
          const profileUrl = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(r.symbol)}?modules=assetProfile&crumb=${encodeURIComponent(crumb)}`;
          const pr = await fetch(profileUrl, { headers: yfHeaders });
          const pd = await pr.json();
          const profile = pd?.quoteSummary?.result?.[0]?.assetProfile;
          if (profile) {
            r.sector = profile.sector;
            r.industry = profile.industry;
          }
        } catch { /* sector/industry are optional enrichment */ }
      }));
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ quoteResponse: { result: allResults } })
    };
  } catch (err) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
  }
};
