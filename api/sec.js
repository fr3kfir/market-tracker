const UA = 'Mozilla/5.0 (compatible; MarketTracker/1.0; +https://market-tracker-seven.vercel.app)';

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

    const title  = get('title');
    const id     = get('id').trim();      // accession number e.g. 0001193125-24-025033
    const updated = get('updated');
    const form   = getAttr('category', 'term') || 'N/A';
    const link   = getAttr('link', 'href');

    // Extract CIK from title: "8-K - Apple Inc. (0000320193) (Filer)"
    const cikMatch = title.match(/\((\d+)\)\s*\(Filer\)/);
    const cik = cikMatch ? cikMatch[1].replace(/^0+/, '') : null;
    const companyMatch = title.match(/^[^-]+-\s*(.+?)\s*\(\d+\)/);
    const company = companyMatch ? companyMatch[1].trim() : title;

    const accNo = id;
    const accNoDashes = accNo.replace(/-/g, '');
    const url = cik && accNoDashes
      ? `https://www.sec.gov/Archives/edgar/data/${cik}/${accNoDashes}/${accNo}-index.htm`
      : link;

    entries.push({ company, form, date: updated.slice(0, 10), accNo, url });
  }
  return entries;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { form = '' } = req.query;
  const typeParam = form || '8-K,10-K,10-Q,S-1';

  try {
    const url = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=${encodeURIComponent(typeParam)}&dateb=&owner=include&count=40&search_text=&output=atom`;
    const r = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept': 'application/atom+xml,application/xml,text/xml' },
    });
    if (!r.ok) return res.status(r.status).json({ error: 'EDGAR error' });
    const xml = await r.text();
    const filings = parseAtomEntries(xml);
    res.json({ filings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
