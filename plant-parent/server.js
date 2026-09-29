// Local dev API server (Vite proxies /api here). Loads .env if present.
import express from 'express';
import { existsSync } from 'node:fs';
import { diagnosePlant } from './lib/diagnose-core.js';

if (existsSync('.env')) process.loadEnvFile('.env');

const app = express();
app.use(express.json({ limit: '12mb' }));

app.post('/api/diagnose', async (req, res) => {
  const { status, body } = await diagnosePlant(req.body || {});
  res.status(status).json(body);
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Plant Parent API on http://localhost:${PORT}`));
