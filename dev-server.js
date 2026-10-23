/**
 * Půjčovna rotopedů — lokální vývojový server (Express).
 *
 * V produkci na Vercelu se nepoužívá — tam běží `api/poptavka.js` jako serverless funkce.
 * Pojmenováno `dev-server.js` (ne `server.js`), aby Vercel nedetekoval projekt jako Node server.
 */

import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

import { handleInquiry } from './lib/poptavka.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50kb' }));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

app.post('/api/poptavka', async (req, res) => {
  const result = await handleInquiry(req.body);
  return res.status(result.status).json(result.body);
});

// Nevalidní JSON → 400 místo HTML stacktrace
app.use((err, _req, res, next) => {
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ ok: false, error: 'Neplatný požadavek.' });
  }
  return next(err);
});

app.listen(PORT, () => {
  console.log(`Půjčovna rotopedů running on http://localhost:${PORT}`);
  console.log(`Inquiries will be sent to: ${process.env.ORDER_EMAIL || 'zlin@pujcovna-rotopedu.cz'}`);
});
