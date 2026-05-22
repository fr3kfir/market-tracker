const UA = 'Mozilla/5.0 (compatible; MarketTracker/1.0; +https://market-tracker-seven.vercel.app)';

function parseAtomEntries(xml) {
  const entries = [];
  const re = /<entry>([\s\S]*?)<\/entry>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const c = m[1];
    const get = tag => {
      const x = c.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
      return x ? x[1].trim().replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&') : '';
    };
    const getAttr = (tag, attr) => {
      const x = c.match(new RegExp(`<${tag}[^>]*\\s${attr}="([^"]*)"`));
      return x ? x[1] : '';
    };

    const title   = get('title');
    const id      = get('id').trim();
    const updated = get('updated');
    const form    = getAttr('category', 'term') || 'N/A';
    const link    = getAttr('link', 'href');

    // Try to build direct filing URL from accession number + CIK from link
    const cikMatch = link.match(/CIK=(\d+)/i);
    const cik = cikMatch ? cikMatch[1].replace(/^0+/, '') : null;
    const accNo = id;
    const accNoDashes = accNo.replace(/-/g, '');
    const url = cik && accNoDashes
      ? `https://www.sec.gov/Archives/edgar/data/${cik}/${accNoDashes}/${accNo}-index.htm`
      : link;

    entries.push({ title, form, date: updated.slice(0, 10), accNo, url });
  }
  return entries;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: 'ticker required' });

  try {
    // EDGAR lets you look up by ticker symbol as the CIK parameter
    const url = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${encodeURIComponent(ticker)}&type=&dateb=&owner=include&count=10&search_text=&output=atom`;
    const r = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept': 'application/atom+xml,application/xml,text/xml' },
    });
    if (!r.ok) return res.status(r.status).json({ error: 'EDGAR error' });
    const xml = await r.text();
    const filings = parseAtomEntries(xml);
    const edgarUrl = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${ticker}&type=&dateb=&owner=include&count=40`;
    res.json({ filings, edgarUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
