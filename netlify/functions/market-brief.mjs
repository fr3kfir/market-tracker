// Netlify serverless function — AI Market Brief.
// Same core as the Vercel function; routed via the /api/market-brief redirect
// in netlify.toml. Requires ANTHROPIC_API_KEY (Netlify → Site configuration →
// Environment variables).

import { getMarketBriefPayload } from '../../api/_lib/market-brief-core.js';

export default async () => {
  const { status, body } = await getMarketBriefPayload();
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
