/**
 * Půjčovna rotopedů — sdílená logika poptávky (validace, e-maily).
 * Používá ji lokální Express server (dev-server.js) i Vercel serverless funkce (api/poptavka.js).
 *
 * Zatím jen testovací formulář (jméno, e-mail, telefon, zpráva) pro ověření odesílání pošty.
 */

import nodemailer from 'nodemailer';

const CONTACT_EMAIL = 'rezervace@pujcovna-rotopedu.cz';

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
  if (str(data.name).length < 2) errors.push('Vyplňte jméno.');
  if (!isValidEmail(str(data.email))) errors.push('Vyplňte platný e-mail.');
  if (str(data.message).length < 2) errors.push('Vyplňte zprávu.');
  if (str(data.message).length > 2000) errors.push('Zpráva je moc dlouhá.');
  if (!data.gdpr) errors.push('Potřebujeme souhlas se zpracováním osobních údajů.');
  return errors;
}

function normalize(data) {
  return {
    name: str(data.name),
    email: str(data.email),
    phone: str(data.phone),
    message: str(data.message)
  };
}

// ---------- šablony ----------

export function buildOperatorEmail(data) {
  const d = normalize(data);

  const text = `Nová poptávka z webu pujcovna-rotopedu.cz
=========================================

Jméno: ${d.name}
E-mail: ${d.email}
Telefon: ${d.phone || '(neuvedeno)'}

Zpráva:
${d.message}

Souhlas se zpracováním osobních údajů: ano
`;

  const html = `<!DOCTYPE html>
<html lang="cs"><head><meta charset="UTF-8"><title>Nová poptávka</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;">
  <h1 style="font-size:20px;">Nová poptávka z webu</h1>
  <p><strong>${escapeHtml(d.name)}</strong><br>
  <a href="mailto:${escapeHtml(d.email)}">${escapeHtml(d.email)}</a><br>
  ${escapeHtml(d.phone || '(telefon neuveden)')}</p>
  <div style="white-space:pre-wrap;border-left:3px solid #ccc;padding-left:12px;">${escapeHtml(d.message)}</div>
  <p style="font-size:12px;color:#666;">Automaticky odesláno z pujcovna-rotopedu.cz · Souhlas se zpracováním osobních údajů: ano</p>
</body></html>`;

  return { text, html };
}

export function buildCustomerEmail(data) {
  const d = normalize(data);

  const text = `Dobrý den,

děkujeme za Vaši zprávu, brzy se Vám ozveme.

Vaše zpráva:
${d.message}

Půjčovna rotopedů
https://www.pujcovna-rotopedu.cz
`;

  const html = `<!DOCTYPE html>
<html lang="cs"><head><meta charset="UTF-8"><title>Děkujeme za zprávu</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;">
  <p>Dobrý den,</p>
  <p>děkujeme za Vaši zprávu, brzy se Vám ozveme.</p>
  <div style="white-space:pre-wrap;border-left:3px solid #ccc;padding-left:12px;">${escapeHtml(d.message)}</div>
  <p>Půjčovna rotopedů<br><a href="https://www.pujcovna-rotopedu.cz">pujcovna-rotopedu.cz</a></p>
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

/** Pošle e-mail provozovateli (chyba = throw) a potvrzení zákazníkovi (chyba jen zalogovaná). */
export async function sendInquiryEmails(data) {
  const ORDER_EMAIL = process.env.ORDER_EMAIL || CONTACT_EMAIL;
  const FROM_EMAIL = process.env.SMTP_FROM || ORDER_EMAIL;
  const transporter = getTransporter();
  const d = normalize(data);

  const operator = buildOperatorEmail(data);
  const customer = buildCustomerEmail(data);

  // Zobrazované jméno = jméno zákazníka, adresa naše (SPF/DKIM prochází), Reply-To na zákazníka.
  const displayName = sanitizeDisplayName(d.name) || 'Poptávka';

  console.log(`[mail] sending operator notification: to=${ORDER_EMAIL} replyTo=${d.email}`);
  const operatorInfo = await transporter.sendMail({
    from: `"${displayName} (poptávka)" <${FROM_EMAIL}>`,
    to: ORDER_EMAIL,
    replyTo: d.email,
    subject: `Nová poptávka z webu: ${displayName}`,
    text: operator.text,
    html: operator.html
  });
  console.log(`[mail] operator notification sent: messageId=${operatorInfo.messageId}`);

  try {
    const customerInfo = await transporter.sendMail({
      from: `"Půjčovna rotopedů" <${FROM_EMAIL}>`,
      to: d.email,
      replyTo: ORDER_EMAIL,
      subject: 'Děkujeme za zprávu | Půjčovna rotopedů',
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
      body: { ok: false, error: `Odeslání se nepovedlo. Zkuste to prosím znovu, nebo nám napište na ${CONTACT_EMAIL}.` }
    };
  }
}
