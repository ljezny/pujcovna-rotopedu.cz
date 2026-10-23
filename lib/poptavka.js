/**
 * Půjčovna rotopedů — sdílená logika objednávky (validace, e-maily).
 * Používá ji lokální Express server (dev-server.js) i Vercel serverless funkce (api/poptavka.js).
 *
 * Ceny se přepočítávají z katalogu (public/js/katalog.js), který používá i web — klientským číslům se nevěří.
 */

import nodemailer from 'nodemailer';
import { PRODUCTS, CITIES, DURATIONS, durationLabel, priceOrder, fmt } from '../public/js/katalog.js';

const CONTACT_EMAIL = 'rezervace@pujcovna-rotopedu.cz';
const CONTACT_PHONE = '+420 774 860 054';

export function isValidEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const str = (v) => (typeof v === 'string' ? v.trim() : '');

export function validate(data) {
  const errors = [];
  if (!PRODUCTS.some((p) => p.id === data.product)) errors.push('Vyberte stroj.');
  if (!Number.isInteger(data.duration) || !DURATIONS[data.duration]) errors.push('Vyberte délku pronájmu.');
  if (!CITIES.some((c) => c.name === data.city)) errors.push('Vyberte město.');
  if (str(data.date) && !/^\d{4}-\d{2}-\d{2}$/.test(str(data.date))) errors.push('Neplatné datum.');
  if (data.delivery && str(data.address).length < 3) errors.push('Vyplňte adresu doručení.');
  if (str(data.name).length < 2) errors.push('Vyplňte jméno.');
  if (str(data.phone).replace(/\D/g, '').length < 9) errors.push('Vyplňte telefon.');
  if (str(data.email) && !isValidEmail(str(data.email))) errors.push('Zkontrolujte e-mail.');
  for (const k of ['name', 'phone', 'email', 'address', 'city']) {
    if (str(data[k]).length > 200) errors.push('Některé pole je moc dlouhé.');
  }
  if (str(data.note).length > 2000) errors.push('Poznámka je moc dlouhá.');
  return [...new Set(errors)];
}

function normalize(data) {
  const order = priceOrder({
    product: data.product,
    duration: data.duration,
    delivery: !!data.delivery,
    pad: !!data.pad,
    mat: !!data.mat
  });
  return {
    name: str(data.name),
    email: str(data.email),
    phone: str(data.phone),
    city: str(data.city),
    date: str(data.date),
    delivery: !!data.delivery,
    address: str(data.address),
    note: str(data.note),
    durationLabel: durationLabel(order.product, data.duration),
    order
  };
}

function formatDate(iso) {
  if (!iso) return 'dle domluvy';
  const [y, m, d] = iso.split('-');
  return `${Number(d)}. ${Number(m)}. ${y}`;
}

/** Řádky souhrnu objednávky — [popis, částka] */
function orderLines(d) {
  const lines = [[`${d.order.product.name}, ${d.durationLabel}`, d.order.rent]];
  if (d.order.pad) lines.push(['Tlumicí podložka', d.order.pad]);
  if (d.order.mat) lines.push(['Ochranná podložka', d.order.mat]);
  if (d.order.ship) lines.push(['Doprava k vám', d.order.ship]);
  return lines;
}

// ---------- šablony ----------

export function buildOperatorEmail(data) {
  const d = normalize(data);
  const lines = orderLines(d);
  const handover = d.delivery ? `Dovézt domů: ${d.address}` : `Vyzvedne na pobočce ${d.city}`;

  const text = `Nová objednávka z webu pujcovna-rotopedu.cz
==========================================

${lines.map(([l, p]) => `${l}: ${fmt(p)} Kč`).join('\n')}
Celkem: ${fmt(d.order.total)} Kč
Vratná záloha: ${fmt(d.order.deposit)} Kč

Město: ${d.city}
Od kdy: ${formatDate(d.date)}
Předání: ${handover}

Jméno: ${d.name}
Telefon: ${d.phone}
E-mail: ${d.email || '(neuvedeno)'}

Poznámka:
${d.note || '(žádná)'}
`;

  const row = (l, v, strong) => `<tr><td style="padding:4px 16px 4px 0;color:#596b84;">${l}</td><td style="padding:4px 0;${strong ? 'font-weight:700;' : ''}">${v}</td></tr>`;
  const html = `<!DOCTYPE html>
<html lang="cs"><head><meta charset="UTF-8"><title>Nová objednávka</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0A3A78;">
  <h1 style="font-size:20px;">Nová objednávka z webu</h1>
  <table style="border-collapse:collapse;font-size:15px;">
    ${lines.map(([l, p]) => row(escapeHtml(l), `${fmt(p)} Kč`)).join('\n    ')}
    ${row('Celkem', `${fmt(d.order.total)} Kč`, true)}
    ${row('Vratná záloha', `${fmt(d.order.deposit)} Kč`)}
  </table>
  <table style="border-collapse:collapse;font-size:15px;margin-top:16px;">
    ${row('Město', escapeHtml(d.city))}
    ${row('Od kdy', escapeHtml(formatDate(d.date)))}
    ${row('Předání', escapeHtml(handover))}
    ${row('Jméno', escapeHtml(d.name), true)}
    ${row('Telefon', `<a href="tel:${escapeHtml(d.phone.replace(/\s+/g, ''))}">${escapeHtml(d.phone)}</a>`)}
    ${row('E-mail', d.email ? `<a href="mailto:${escapeHtml(d.email)}">${escapeHtml(d.email)}</a>` : '(neuvedeno)')}
  </table>
  ${d.note ? `<div style="white-space:pre-wrap;border-left:3px solid #04BFA3;padding-left:12px;margin-top:16px;">${escapeHtml(d.note)}</div>` : ''}
  <p style="font-size:12px;color:#596b84;">Automaticky odesláno z pujcovna-rotopedu.cz</p>
</body></html>`;

  return { text, html };
}

export function buildCustomerEmail(data) {
  const d = normalize(data);
  const lines = orderLines(d);
  const handover = d.delivery ? `dovoz na adresu ${d.address}` : `vyzvednutí na pobočce ${d.city}`;

  const text = `Dobrý den,

děkujeme za objednávku. Do 24 hodin Vám zavoláme na ${d.phone} a domluvíme předání.

${lines.map(([l, p]) => `${l}: ${fmt(p)} Kč`).join('\n')}
Celkem: ${fmt(d.order.total)} Kč
Vratná záloha při předání: ${fmt(d.order.deposit)} Kč

Předání: ${handover}, od ${formatDate(d.date)}

Půjčovna rotopedů
${CONTACT_PHONE}
https://www.pujcovna-rotopedu.cz
`;

  const html = `<!DOCTYPE html>
<html lang="cs"><head><meta charset="UTF-8"><title>Děkujeme za objednávku</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0A3A78;">
  <p>Dobrý den,</p>
  <p>děkujeme za objednávku. Do 24 hodin Vám zavoláme na ${escapeHtml(d.phone)} a domluvíme předání.</p>
  <table style="border-collapse:collapse;font-size:15px;">
    ${lines.map(([l, p]) => `<tr><td style="padding:4px 16px 4px 0;">${escapeHtml(l)}</td><td style="padding:4px 0;text-align:right;">${fmt(p)} Kč</td></tr>`).join('\n    ')}
    <tr><td style="padding:8px 16px 4px 0;font-weight:700;border-top:1px solid #d2dde9;">Celkem</td><td style="padding:8px 0 4px;font-weight:700;text-align:right;border-top:1px solid #d2dde9;">${fmt(d.order.total)} Kč</td></tr>
    <tr><td style="padding:4px 16px 4px 0;color:#596b84;">Vratná záloha při předání</td><td style="padding:4px 0;color:#596b84;text-align:right;">${fmt(d.order.deposit)} Kč</td></tr>
  </table>
  <p>Předání: ${escapeHtml(handover)}, od ${escapeHtml(formatDate(d.date))}</p>
  <p>Půjčovna rotopedů<br>${CONTACT_PHONE}<br><a href="https://www.pujcovna-rotopedu.cz">pujcovna-rotopedu.cz</a></p>
</body></html>`;

  return { text, html };
}

// ---------- odeslání ----------

let cachedTransporter = null;

export function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE, SMTP_TLS_REJECT_UNAUTHORIZED } = process.env;

  if (!SMTP_HOST || SMTP_HOST === 'smtp.example.com') {
    console.warn('[mail] SMTP_HOST not set — using JSON transport (emails will be LOGGED ONLY, not actually sent).');
    cachedTransporter = nodemailer.createTransport({ jsonTransport: true });
    return cachedTransporter;
  }

  const config = {
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: SMTP_SECURE === 'true',
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined
  };

  if (SMTP_TLS_REJECT_UNAUTHORIZED === 'false') {
    config.tls = { rejectUnauthorized: false };
  }

  console.log(`[mail] SMTP transport: host=${SMTP_HOST} port=${config.port} secure=${config.secure} user=${SMTP_USER || '(none)'}`);

  cachedTransporter = nodemailer.createTransport(config);
  return cachedTransporter;
}

/** Display name pro From hlavičku — bez control znaků, uvozovek a zpětných lomítek. */
function sanitizeDisplayName(name) {
  return String(name || '')
    .replace(/[\r\n\t"\\]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

/** Pošle e-mail provozovateli (chyba = throw) a potvrzení zákazníkovi, pokud vyplnil e-mail (chyba jen zalogovaná). */
export async function sendInquiryEmails(data) {
  const ORDER_EMAIL = process.env.ORDER_EMAIL || CONTACT_EMAIL;
  const FROM_EMAIL = process.env.SMTP_FROM || ORDER_EMAIL;
  const transporter = getTransporter();
  const d = normalize(data);

  const operator = buildOperatorEmail(data);
  const customer = buildCustomerEmail(data);

  // Zobrazované jméno = jméno zákazníka, adresa naše (SPF/DKIM prochází), Reply-To na zákazníka.
  const displayName = sanitizeDisplayName(d.name) || 'Objednávka';

  console.log(`[mail] sending operator notification: to=${ORDER_EMAIL} replyTo=${d.email || '(none)'}`);
  const operatorInfo = await transporter.sendMail({
    from: `"${displayName} (objednávka)" <${FROM_EMAIL}>`,
    to: ORDER_EMAIL,
    replyTo: d.email || undefined,
    subject: `Objednávka: ${d.order.product.name}, ${d.durationLabel} — ${displayName}`,
    text: operator.text,
    html: operator.html
  });
  console.log(`[mail] operator notification sent: messageId=${operatorInfo.messageId}`);

  if (!d.email) return;

  try {
    const customerInfo = await transporter.sendMail({
      from: `"Půjčovna rotopedů" <${FROM_EMAIL}>`,
      to: d.email,
      replyTo: ORDER_EMAIL,
      subject: 'Děkujeme za objednávku | Půjčovna rotopedů',
      text: customer.text,
      html: customer.html
    });
    console.log(`[mail] customer confirmation sent: messageId=${customerInfo.messageId}`);
  } catch (err) {
    console.warn(`[mail] customer confirmation FAILED: ${err.message}`);
  }
}

/**
 * Handler sdílený Expressem i Vercelem. Vrací { status, body }.
 */
export async function handleInquiry(body) {
  body = body && typeof body === 'object' ? body : {};

  if (body.website) {
    console.warn('[poptavka] honeypot triggered — silently returning ok');
    return { status: 200, body: { ok: true } };
  }

  const errors = validate(body);
  if (errors.length) {
    console.warn(`[poptavka] validation failed: ${errors.join(' ')}`);
    return { status: 400, body: { ok: false, error: errors.join(' ') } };
  }

  try {
    await sendInquiryEmails(body);
    return { status: 200, body: { ok: true } };
  } catch (err) {
    console.error('[poptavka] FAILED:', err?.message, err?.code, err?.command, err?.response);
    return {
      status: 500,
      body: { ok: false, error: `Odeslání se nepovedlo. Zkuste to prosím znovu, nebo volejte ${CONTACT_PHONE}.` }
    };
  }
}
