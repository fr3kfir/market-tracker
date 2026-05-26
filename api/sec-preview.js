// api/sec-preview.js — Fetch & extract a plain-text summary from an SEC filing
// Accepts: ?url=<filing-index-url>&form=<8-K|10-K|10-Q|S-1>
// Returns: { summary, docUrl, error? }

const UA = 'MarketPulse kfiryanay45@gmail.com';

// ── HTML helpers ────────────────────────────────────────────────────────────

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function stripHtml(html) {
  return decodeEntities(
    html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
      // iXBRL inline tags — strip but keep inner text
      .replace(/<\/?ix:[a-z:]+[^>]*>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
  );
}

// ── Fetch the EDGAR index page and return the primary document URL ──────────

async function getPrimaryDocUrl(indexUrl) {
  // Only handle real Archives URLs — skip EDGAR search fallback URLs
  if (!indexUrl.includes('/Archives/edgar/data/')) return null;

  const r = await fetch(indexUrl, {
    headers: { 'User-Agent': UA, Accept: 'text/html' },
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) throw new Error(`Index ${r.status}`);
  const html = await r.text();

  // EDGAR index tables contain rows like:
  //   <td>1</td><td>Description</td><td><a href="/Archives/edgar/data/.../foo.htm">foo.htm</a></td>
  // We want the first non-index .htm link.
  const linkRe = /href="(\/Archives\/edgar\/data\/[^"]+\.htm)"/gi;
  let m;
  while ((m = linkRe.exec(html)) !== null) {
    const path = m[1];
    if (!path.includes('-index')) {
      return 'https://www.sec.gov' + path;
    }
  }
  return null;
}

// ── Extract meaningful text from filing HTML ────────────────────────────────

function extractContent(html, form) {
  // Remove common noise blocks before stripping tags
  const cleaned = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    // iXBRL numeric values — replace with a single space so surrounding text stays intact
    .replace(/<ix:nonfraction[^>]*>[\s\S]*?<\/ix:nonfraction>/gi, ' ')
    // iXBRL container tags — keep inner text
    .replace(/<\/?ix:[a-z:]+[^>]*>/gi, '');

  const text = stripHtml(cleaned);

  // Form-specific extraction strategies (ordered from most to least specific)
  const strategies = {
    '8-K': [
      // Look for "Item X.XX" header followed by descriptive text
      /\bItem\s+\d+\.\d+\b[^.]{0,120}(?:\.\s+|\n)([A-Z][^]{200,1800})/i,
      // Or just grab from the first "Item" occurrence
      /\bItem\s+\d+\.\d+\b[\s\S]{300,2000}/i,
    ],
    'S-1': [
      /Prospectus\s+Summary\b[\s\S]{300,2500}/i,
      /\bOur\s+(?:Company|Business|Mission)\b[^.]{0,80}\.[\s\S]{200,2000}/i,
      /\bWe\s+(?:are|operate|develop|provide|build)\b[^.]{30,}\.[\s\S]{100,2000}/i,
    ],
    '10-K': [
      /\bItem\s+1\.?\s+Business\b[\s\S]{300,2500}/i,
      /\bBusiness\s+Overview\b[\s\S]{300,2000}/i,
      /\bOur\s+Business\b[\s\S]{300,2000}/i,
    ],
    '10-Q': [
      /\bItem\s+2\.?\s+Management.s\s+Discussion[\s\S]{300,2500}/i,
      /\bExecutive\s+(?:Summary|Overview)\b[\s\S]{300,2000}/i,
      /\bOverview\b[\s\S]{300,2000}/i,
    ],
  };

  const formStrategies = strategies[form] || [];
  for (const pattern of formStrategies) {
    const match = text.match(pattern);
    if (match) {
      const candidate = match[0].slice(0, 2000).trim();
      // Require at least 40 real words
      if (candidate.split(/\s+/).length >= 40) return candidate;
    }
  }

  // Fallback: skip the first ~80 words (usually cover-page boilerplate) and return 350 words
  const words = text.split(/\s+/).filter(Boolean);
  const skip  = Math.min(80, Math.floor(words.length * 0.08));
  return words.slice(skip, skip + 350).join(' ');
}

// ── Vercel / Netlify serverless handler ────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url, form = '' } = req.query;
  if (!url) return res.status(400).json({ error: 'url required' });

  // Guard: only proxy SEC EDGAR URLs
  if (!url.startsWith('https://www.sec.gov/')) {
    return res.status(400).json({ error: 'Only SEC EDGAR URLs are supported' });
  }

  try {
    // 1. Resolve the primary document from the filing index
    const docUrl = await getPrimaryDocUrl(url);
    if (!docUrl) {
      return res.status(200).json({
        summary: null,
        docUrl: null,
        error: 'Could not locate primary document in filing index',
      });
    }

    // 2. Fetch the primary document — cap at 600 KB to handle large 10-Ks
    const r = await fetch(docUrl, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) throw new Error(`Document fetch ${r.status}`);

    const buf    = await r.arrayBuffer();
    const rawHtml = new TextDecoder('utf-8', { fatal: false }).decode(
      buf.byteLength > 600_000 ? buf.slice(0, 600_000) : buf
    );

    // 3. Extract and return a clean summary
    const summary = extractContent(rawHtml, form.toUpperCase());
    return res.status(200).json({ summary, docUrl });

  } catch (err) {
    console.error('[sec-preview]', err.message);
    return res.status(200).json({ summary: null, docUrl: null, error: err.message });
  }
}
