/**
 * Vercel serverless function — POST /api/poptavka
 */

import { handleInquiry } from '../lib/poptavka.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  // Vercel parsuje JSON body automaticky (Content-Type: application/json); fallback pro string.
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const result = await handleInquiry(body || {});
  return res.status(result.status).json(result.body);
}
