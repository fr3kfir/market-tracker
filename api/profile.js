const UA = 'Mozilla/5.0 (compatible; MarketTracker/1.0; +https://market-tracker-seven.vercel.app)';

// Map SIC code ranges to Yahoo-style sector + industry names
function sicToSector(sic) {
  const n = parseInt(sic, 10);
  if (!n) return null;

  if (n >= 100  && n <= 999)  return { sector: 'Consumer Staples',        industry: 'Agriculture' };
  if (n >= 1000 && n <= 1499) return { sector: 'Materials',               industry: 'Mining' };
  if (n >= 1500 && n <= 1799) return { sector: 'Industrials',             industry: 'Construction' };
  if (n >= 2000 && n <= 2099) return { sector: 'Consumer Staples',        industry: 'Food & Beverage' };
  if (n >= 2100 && n <= 2199) return { sector: 'Consumer Staples',        industry: 'Tobacco' };
  if (n >= 2200 && n <= 2399) return { sector: 'Consumer Discretionary',  industry: 'Apparel & Textile' };
  if (n >= 2400 && n <= 2699) return { sector: 'Materials',               industry: 'Paper & Wood Products' };
  if (n >= 2700 && n <= 2799) return { sector: 'Communication Services',  industry: 'Printing & Publishing' };
  if (n >= 2830 && n <= 2836) return { sector: 'Healthcare',              industry: 'Pharmaceuticals & Biotech' };
  if (n >= 2800 && n <= 2899) return { sector: 'Materials',               industry: 'Chemicals' };
  if (n >= 2900 && n <= 2999) return { sector: 'Energy',                  industry: 'Oil & Gas Refining' };
  if (n >= 3000 && n <= 3299) return { sector: 'Materials',               industry: 'Rubber, Plastics & Glass' };
  if (n >= 3300 && n <= 3399) return { sector: 'Materials',               industry: 'Metals & Mining' };
  if (n >= 3400 && n <= 3499) return { sector: 'Industrials',             industry: 'Fabricated Metal Products' };
  if (n >= 3500 && n <= 3599) return { sector: 'Industrials',             industry: 'Industrial Machinery' };
  if (n >= 3600 && n <= 3699) return { sector: 'Technology',              industry: 'Electronic Equipment' };
  if (n >= 3700 && n <= 3716) return { sector: 'Consumer Discretionary',  industry: 'Auto Manufacturers' };
  if (n >= 3720 && n <= 3729) return { sector: 'Industrials',             industry: 'Aerospace & Defense' };
  if (n >= 3730 && n <= 3799) return { sector: 'Industrials',             industry: 'Transportation Equipment' };
  if (n === 3812)              return { sector: 'Industrials',             industry: 'Aerospace & Defense' };
  if (n >= 3800 && n <= 3899) return { sector: 'Technology',              industry: 'Measuring Instruments' };
  if (n >= 3900 && n <= 3999) return { sector: 'Industrials',             industry: 'Miscellaneous Manufacturing' };
  if (n >= 4000 && n <= 4599) return { sector: 'Industrials',             industry: 'Transportation' };
  if (n >= 4600 && n <= 4699) return { sector: 'Energy',                  industry: 'Pipelines' };
  if (n >= 4800 && n <= 4899) return { sector: 'Communication Services',  industry: 'Telecommunications' };
  if (n >= 4900 && n <= 4999) return { sector: 'Utilities',               industry: 'Utilities' };
  if (n >= 5000 && n <= 5199) return { sector: 'Industrials',             industry: 'Wholesale Trade' };
  if (n >= 5200 && n <= 5999) return { sector: 'Consumer Discretionary',  industry: 'Retail' };
  if (n >= 6000 && n <= 6199) return { sector: 'Financials',              industry: 'Banks' };
  if (n >= 6200 && n <= 6299) return { sector: 'Financials',              industry: 'Securities & Investments' };
  if (n >= 6300 && n <= 6399) return { sector: 'Financials',              industry: 'Insurance' };
  if (n >= 6500 && n <= 6599) return { sector: 'Real Estate',             industry: 'Real Estate' };
  if (n >= 6700 && n <= 6799) return { sector: 'Financials',              industry: 'Holding Companies' };
  if (n >= 7000 && n <= 7099) return { sector: 'Consumer Discretionary',  industry: 'Hotels & Lodging' };
  if (n >= 7200 && n <= 7299) return { sector: 'Consumer Discretionary',  industry: 'Personal Services' };
  if (n >= 7370 && n <= 7379) return { sector: 'Technology',              industry: 'Software & IT Services' };
  if (n >= 7300 && n <= 7399) return { sector: 'Industrials',             industry: 'Business Services' };
  if (n >= 7500 && n <= 7599) return { sector: 'Consumer Discretionary',  industry: 'Auto Services' };
  if (n >= 7800 && n <= 7999) return { sector: 'Communication Services',  industry: 'Media & Entertainment' };
  if (n >= 8000 && n <= 8099) return { sector: 'Healthcare',              industry: 'Healthcare Services' };
  if (n >= 8700 && n <= 8799) return { sector: 'Industrials',             industry: 'Engineering Services' };
  if (n >= 8000 && n <= 8999) return { sector: 'Industrials',             industry: 'Professional Services' };
  return null;
}

async function fetchFromEdgar(symbol) {
  // Step 1: get CIK via EDGAR company search
  const searchUrl = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${encodeURIComponent(symbol)}&type=10-K&dateb=&owner=include&count=1&output=atom`;
  const r = await fetch(searchUrl, { headers: { 'User-Agent': UA } });
  if (!r.ok) return null;
  const xml = await r.text();

  const cikMatch = xml.match(/CIK=0*(\d+)/i);
  if (!cikMatch) return null;
  const cik = cikMatch[1].padStart(10, '0');

  // Step 2: fetch company submission JSON for SIC code
  const subUrl = `https://data.sec.gov/submissions/CIK${cik}.json`;
  const sr = await fetch(subUrl, { headers: { 'User-Agent': UA } });
  if (!sr.ok) return null;
  const data = await sr.json();

  const sic = data.sic;
  const sicDesc = data.sicDescription || null;
  const mapped = sicToSector(sic);
  if (!mapped) return null;

  return { sector: mapped.sector, industry: mapped.industry || sicDesc };
}

function extractCookies(res) {
  const raw = typeof res.headers.getSetCookie === 'function'
    ? res.headers.getSetCookie()
    : (res.headers.get('set-cookie') || '').split(/,(?=[^ ])/).filter(Boolean);
  return raw.map(h => h.split(';')[0].trim()).filter(Boolean).join('; ');
}

async function fetchFromYahoo(symbol) {
  const cookieRes = await fetch('https://fc.yahoo.com/v1/test/csrfToken', {
    headers: { 'User-Agent': UA }, redirect: 'follow',
  });
  const cookie = extractCookies(cookieRes);
  const crumbRes = await fetch('https://query2.finance.yahoo.com/v1/test/getcrumb', {
    headers: { 'User-Agent': UA, Cookie: cookie },
  });
  const crumb = (await crumbRes.text()).trim();
  if (!crumb || crumb.length < 3) throw new Error('bad crumb');

  const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=assetProfile&crumb=${encodeURIComponent(crumb)}`;
  const r = await fetch(url, { headers: { 'User-Agent': UA, Cookie: cookie } });
  if (!r.ok) throw new Error(`Yahoo ${r.status}`);
  const d = await r.json();
  const profile = d?.quoteSummary?.result?.[0]?.assetProfile || {};
  if (!profile.sector) throw new Error('no sector in response');
  return { sector: profile.sector, industry: profile.industry || null };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol required' });

  // Try Yahoo Finance first, fall back to SEC EDGAR
  try {
    const result = await fetchFromYahoo(symbol);
    return res.status(200).json(result);
  } catch { /* fall through */ }

  try {
    const result = await fetchFromEdgar(symbol);
    if (result) return res.status(200).json(result);
  } catch { /* fall through */ }

  res.status(200).json({ sector: null, industry: null });
}
