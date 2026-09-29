// Vercel serverless entry. Core logic lives in lib/diagnose-core.js.
import { diagnosePlant } from '../lib/diagnose-core.js';

export const config = { api: { bodyParser: { sizeLimit: '4mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { status, body } = await diagnosePlant(req.body || {});
  res.status(status).json(body);
}
