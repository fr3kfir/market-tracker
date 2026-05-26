// api/sec-preview.js — Fetch an SEC filing and return an AI-generated summary
// Accepts: ?url=<filing-index-url>&form=<8-K|10-K|10-Q|S-1>&company=<name>
// Returns: { summary, docUrl, error? }

import Anthropic from '@anthropic-ai/sdk';

const UA = 'MarketPulse kfiryanay45@gmail.com';

// ── HTML → clean text ────────────────────────────────────────────────────────

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function htmlToText(html) {
  return decodeEntities(
    html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      // iXBRL — strip numeric tags, keep text containers
      .replace(/<ix:nonfraction[^>]*>[\s\S]*?<\/ix:nonfraction>/gi, ' ')
      .replace(/<\/?ix:[a-z:]+[^>]*>/gi, '')
      // Block elements → newline so paragraphs survive
      .replace(/<\/?(p|div|br|h[1-6]|tr|li|section|article)[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n[ \t]+/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

// ── Remove SEC boilerplate (cover page, signatures, etc.) ────────────────────

function removeBoilerplate(text) {
  return text
    .replace(/UNITED STATES\s+SECURITIES AND EXCHANGE COMMISSION[\s\S]{0,800}/i, '')
    .replace(/Commission\s+file\s+(?:number|no\.?)[\s\S]{0,400}/i, '')
    .replace(/Washington,?\s+D\.?C\.?\s+\d{4,5}/gi, '')
    .replace(/\(State or other jurisdiction[\s\S]{0,600}?(?=\n[A-Z])/i, '')
    .replace(/Indicate by check mark[\s\S]{0,400}?(?=\n[A-Z])/gi, '')
    .replace(/Pursuant to the requirements[\s\S]{0,600}/i, '')
    .replace(/SIGNATURES[\s\S]{0,600}/i, '')
    .replace(/[☐☑✓□■✗]/g, '')
    .replace(/\[\s*[Xx\s]\s*\]/g, '')
    .replace(/[-–]\s*\d+\s*[-–]/g, '')
    .replace(/\bPage\s+\d+\s+of\s+\d+\b/gi, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ── Extract the most relevant section for the given form type ────────────────

function extractRawSection(text, form) {
  const strategies = {
    '8-K': [
      /\bItem\s+\d+\.\d+\b[^\n]*\n([\s\S]{200,3000}?)(?=\bItem\s+\d+\.\d+\b|\bSignature|\bExhibit\b|$)/i,
      /\bItem\s+\d+\.\d+\b[\s\S]{300,3000}/i,
    ],
    '10-K': [
      /\bItem\s+1\.?\s+Business\b[^\n]*\n([\s\S]{300,4000}?)(?=\bItem\s+1A\b|\bItem\s+2\b|$)/i,
      /\bBusiness\s+Overview\b[\s\S]{400,3000}/i,
      /\bOur\s+Business\b[\s\S]{400,3000}/i,
    ],
    '10-Q': [
      /\bItem\s+2\.?\s+Management.s\s+Discussion[\s\S]{400,4000}/i,
      /\bExecutive\s+(?:Summary|Overview)\b[\s\S]{400,3000}/i,
      /\bOverview\b[\s\S]{400,3000}/i,
    ],
    'S-1': [
      /Prospectus\s+Summary\b[\s\S]{400,4000}/i,
      /\bOur\s+(?:Company|Business|Mission)\b[\s\S]{300,3000}/i,
      /\bWe\s+(?:are|operate|develop|provide|build)\b[\s\S]{200,3000}/i,
    ],
  };

  for (const re of (strategies[form] || [])) {
    const m = text.match(re);
    if (m) {
      const chunk = (m[1] || m[0]).trim();
      if (chunk.split(/\s+/).length >= 40) return chunk.slice(0, 4000);
    }
  }

  // Fallback: skip first 15% (usually boilerplate) and return up to 4000 chars
  const skip = Math.floor(text.length * 0.15);
  return text.slice(skip, skip + 4000);
}

// ── Get primary document URL from EDGAR filing index ────────────────────────

async function getPrimaryDocUrl(indexUrl) {
  if (!indexUrl.includes('/Archives/edgar/data/')) return null;
  const r = await fetch(indexUrl, {
    headers: { 'User-Agent': UA, Accept: 'text/html' },
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) throw new Error(`Index ${r.status}`);
  const html = await r.text();

  const linkRe = /href="(\/Archives\/edgar\/data\/[^"]+\.htm)"/gi;
  let m;
  while ((m = linkRe.exec(html)) !== null) {
    if (!m[1].includes('-index')) return 'https://www.sec.gov' + m[1];
  }
  return null;
}

// ── AI summary via Claude ────────────────────────────────────────────────────

async function generateSummary(rawText, form, company) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null; // graceful fallback — caller will use raw text

  const client = new Anthropic({ apiKey });

  const formDescriptions = {
    '8-K':  'a current report about a material event (earnings, executive change, acquisition, etc.)',
    '10-K': 'an annual report with full-year financials and business overview',
    '10-Q': 'a quarterly report with financial results and management discussion',
    'S-1':  'an IPO registration statement for a company going public',
  };

  const prompt = `You are analyzing an SEC filing for an investor.

Company: ${company || 'Unknown'}
Form type: ${form} — ${formDescriptions[form] || 'regulatory filing'}

Here is the extracted text from the filing:
---
${rawText.slice(0, 3500)}
---

Write a concise 3-5 sentence summary in plain English that:
1. States the main topic/event of this filing in the first sentence
2. Mentions the key facts: who is involved, what action was taken, any specific amounts or dates
3. Notes the potential significance for investors (1 sentence)

Rules:
- Write in plain English, no legal jargon
- Be specific — include actual names, amounts, dates if mentioned
- Do NOT start with "This filing" or "The company"
- No bullet points, just flowing sentences
- Keep it under 120 words`;

  const msg = await client.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages:   [{ role: 'user', content: prompt }],
  });

  return msg.content[0]?.text?.trim() || null;
}

// ── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url, form = '', company = '' } = req.query;
  if (!url) return res.status(400).json({ error: 'url required' });
  if (!url.startsWith('https://www.sec.gov/'))
    return res.status(400).json({ error: 'Only SEC EDGAR URLs are supported' });

  try {
    // 1. Find primary document
    const docUrl = await getPrimaryDocUrl(url);
    if (!docUrl) return res.status(200).json({ summary: null, docUrl: null, error: 'Primary document not found' });

    // 2. Fetch document (cap at 600 KB)
    const r = await fetch(docUrl, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) throw new Error(`Document fetch ${r.status}`);

    const buf     = await r.arrayBuffer();
    const rawHtml = new TextDecoder('utf-8', { fatal: false }).decode(
      buf.byteLength > 600_000 ? buf.slice(0, 600_000) : buf
    );

    // 3. Convert HTML → clean text → remove boilerplate → extract section
    const fullText   = htmlToText(rawHtml);
    const cleanText  = removeBoilerplate(fullText);
    const section    = extractRawSection(cleanText, form.toUpperCase());

    // 4. AI summary (requires ANTHROPIC_API_KEY) — fall back to cleaned section
    const aiSummary = await generateSummary(section, form.toUpperCase(), company);
    const summary   = aiSummary || section.slice(0, 800).replace(/\n+/g, ' ').trim();

    return res.status(200).json({ summary, docUrl, aiPowered: !!aiSummary });

  } catch (err) {
    console.error('[sec-preview]', err.message);
    return res.status(200).json({ summary: null, docUrl: null, error: err.message });
  }
}
