// api/sec.js — SEC EDGAR filings feed
// Primary:  EDGAR EFTS full-text-search JSON API (modern, reliable)
// Fallback: EDGAR ATOM feed per form type
// SEC requires User-Agent = "Company contactemail@example.com"

const UA = 'MarketPulse kfiryanay45@gmail.com';

// ── Parse legacy ATOM feed ───────────────────────────────────────────────
function parseAtomEntries(xml) {
  const entries = [];
  const re = /<entry>([\s\S]*?)<\/entry>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const c = m[1];
    const get = tag => {
      const x = c.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
      return x ? x[1].trim().replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>') : '';
    };
    const getAttr = (tag, attr) => {
      const x = c.match(new RegExp(`<${tag}[^>]*\\s${attr}="([^"]*)"`));
      return x ? x[1] : '';
    };
    const title   = get('title');
    const updated = get('updated');
    const form    = getAttr('category', 'term') || 'N/A';
    const link    = getAttr('link', 'href');
    const cikMatch = title.match(/\((\d+)\)\s*\(Filer\)/);
    const cik = cikMatch ? cikMatch[1].replace(/^0+/, '') : null;
    const companyMatch = title.match(/^[^-]+-\s*(.+?)\s*\(\d+\)/);
    const company = companyMatch ? companyMatch[1].trim() : title;
    const accNoMatch = link.match(/([0-9]+-[0-9]+-[0-9]+)/);
    const accNo = accNoMatch ? accNoMatch[1] : '';
    const accNoDashes = accNo.replace(/-/g, '');
    const url = cik && accNoDashes
      ? `https://www.sec.gov/Archives/edgar/data/${cik}/${accNoDashes}/${accNo}-index.htm`
      : link;
    if (company) entries.push({ company, form, date: updated.slice(0, 10), accNo, url });
  }
  return entries;
}

// ── EFTS JSON approach (primary) ─────────────────────────────────────────
async function fetchViaEfts(forms) {
  const today   = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
  const url = `https://efts.sec.gov/LATEST/search-index?q=%22%22&forms=${encodeURIComponent(forms)}&dateRange=custom&startdt=${weekAgo}&enddt=${today}&hits.hits.total.value=1`;

  const r = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept': 'application/json' },
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`EFTS ${r.status}`);
  const data = await r.json();

  return (data?.hits?.hits || []).map(hit => {
    const s   = hit._source || {};
    const acc = s.accession_no || hit._id || '';
    const accNoDashes = acc.replace(/-/g, '');
    // CIK is the first segment of accession_no (10 zero-padded digits)
    const cikPadded = acc.split('-')[0] || '';
    const cik = parseInt(cikPadded, 10) || 0;
    const filingUrl = cik && accNoDashes
      ? `https://www.sec.gov/Archives/edgar/data/${cik}/${accNoDashes}/${acc}-index.htm`
      : `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=${encodeURIComponent(s.entity_name || '')}&type=${s.form_type || ''}&dateb=&owner=include&count=5`;

    return {
      company: s.entity_name || 'Unknown',
      form:    s.form_type   || 'N/A',
      date:    s.file_date   || today,
      accNo:   acc,
      url:     filingUrl,
    };
  });
}

// ── ATOM feed fallback (per form type) ───────────────────────────────────
async function fetchViaAtom(formTypes) {
  const settled = await Promise.allSettled(
    formTypes.map(async ft => {
      const url = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=${encodeURIComponent(ft)}&dateb=&owner=include&count=15&search_text=&output=atom`;
      const r = await fetch(url, {
        headers: { 'User-Agent': UA, 'Accept': 'application/atom+xml,application/xml,text/xml' },
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) throw new Error(`ATOM ${r.status}`);
      return parseAtomEntries(await r.text());
    })
  );
  return settled.filter(r => r.status === 'fulfilled').flatMap(r => r.value);
}

// ── Handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { form = '' } = req.query;
  const formTypes = form ? [form] : ['8-K', '10-K', '10-Q', 'S-1'];
  const formsParam = formTypes.join(',');

  let filings = [];
  let source  = 'efts';

  try {
    filings = await fetchViaEfts(formsParam);
  } catch (err1) {
    // Fallback to ATOM feeds
    source = 'atom';
    try {
      filings = await fetchViaAtom(formTypes);
    } catch (err2) {
      return res.status(200).json({ filings: [], error: `EFTS: ${err1.message} · ATOM: ${err2.message}` });
    }
  }

  // Sort by date descending, deduplicate by accNo
  const seen = new Set();
  const deduped = filings
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter(f => {
      const key = f.accNo || `${f.company}|${f.date}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 50);

  res.status(200).json({ filings: deduped, source });
}
