// AI Market Brief — Deepvue-style news summary panel (Vercel / Express entry).
// Core logic lives in api/_lib/market-brief-core.js, shared with the Netlify function.

import { getMarketBriefPayload } from './_lib/market-brief-core.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { status, body } = await getMarketBriefPayload();
  res.status(status).json(body);
}
