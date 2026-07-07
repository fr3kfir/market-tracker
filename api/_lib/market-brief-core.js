// Shared core for the AI Market Brief — used by the Vercel function
// (api/market-brief.js), the Netlify function (netlify/functions/market-brief.mjs)
// and the local Express server. Requires ANTHROPIC_API_KEY.
// Vercel ignores files under api/_lib (underscore prefix), so this is not an endpoint.

import Anthropic from '@anthropic-ai/sdk';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const NEWS_QUERIES = ['stock market today', 'S&P 500', 'Federal Reserve', 'Nasdaq'];

async function fetchHeadlines() {
  const results = await Promise.allSettled(
    NEWS_QUERIES.map(async q => {
      const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=0&newsCount=10&lang=en-US&region=US&enableFuzzyQuery=false`;
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!r.ok) return [];
      const d = await r.json();
      return d?.news || [];
    })
  );

  const seen = new Set();
  const headlines = [];
  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    for (const n of r.value) {
      if (!n.title || seen.has(n.title)) continue;
      seen.add(n.title);
      headlines.push({ title: n.title, publisher: n.publisher, time: n.providerPublishTime });
    }
  }
  return headlines.sort((a, b) => (b.time || 0) - (a.time || 0)).slice(0, 25);
}

const BRIEF_SCHEMA = {
  type: 'object',
  properties: {
    sentiment: { type: 'string', enum: ['Bullish', 'Neutral', 'Bearish'] },
    paragraphs: {
      type: 'array',
      items: { type: 'string' },
      description: '2-3 short paragraphs summarizing the market narrative',
    },
  },
  required: ['sentiment', 'paragraphs'],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `You are a market analyst writing the "Market Brief" panel of a live trading dashboard used by a relative-strength swing trader (Ariel Hernandez style: leaders, laggards, industry groups, institutional money flow).

From the news headlines provided, write a brief of 2-3 short paragraphs:
- Paragraph 1: the main story driving the market right now.
- Paragraph 2: secondary forces (rates, sectors rotating, macro events).
- Paragraph 3 (optional): what to watch next.

Rules: plain text only (no markdown), concise and factual, name specific tickers/sectors when the headlines support it, never invent numbers that aren't implied by the headlines. Also classify the overall news sentiment as Bullish, Neutral, or Bearish.`;

async function generateBrief() {
  const headlines = await fetchHeadlines();
  if (headlines.length < 3) throw new Error('Not enough news headlines available');

  const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY from env

  const headlineText = headlines
    .map(h => `- ${h.title} (${h.publisher || 'unknown'})`)
    .join('\n');

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 4000,
    thinking: { type: 'adaptive' },
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `Recent market headlines:\n\n${headlineText}` }],
    output_config: { format: { type: 'json_schema', schema: BRIEF_SCHEMA } },
  });

  if (response.stop_reason === 'refusal') throw new Error('Model declined the request');

  const text = response.content.find(b => b.type === 'text')?.text;
  if (!text) throw new Error('Empty model response');
  const parsed = JSON.parse(text);

  return {
    sentiment: parsed.sentiment,
    paragraphs: parsed.paragraphs,
    headlineCount: headlines.length,
    generatedAt: new Date().toISOString(),
  };
}

// 15-minute cache + in-flight dedupe so concurrent clients trigger one generation.
// Module-level state survives for the lifetime of a warm serverless instance.
let _cache = null;
let _cacheTime = 0;
let _inFlight = null;
const TTL_MS = 15 * 60 * 1000;

// Returns { status, body } — platform wrappers turn this into a response.
export async function getMarketBriefPayload() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { status: 200, body: { unavailable: true, reason: 'ANTHROPIC_API_KEY is not configured on the server' } };
  }

  const now = Date.now();
  if (_cache && now - _cacheTime < TTL_MS) return { status: 200, body: _cache };

  try {
    if (!_inFlight) {
      _inFlight = generateBrief().finally(() => { _inFlight = null; });
    }
    const brief = await _inFlight;
    _cache = brief;
    _cacheTime = Date.now();
    return { status: 200, body: brief };
  } catch (err) {
    console.error('market-brief error:', err.message);
    // Serve a stale brief over an error if we have one
    if (_cache) return { status: 200, body: { ..._cache, stale: true } };
    return { status: 500, body: { error: err.message } };
  }
}
