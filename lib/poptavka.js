/**
 * Půjčovna rotopedů — sdílená logika objednávky (validace, e-maily).
 * Používá ji lokální Express server (dev-server.js) i Vercel serverless funkce (api/poptavka.js).
 *
 * Ceny se přepočítávají z katalogu (public/js/katalog.js), který používá i web — klientským číslům se nevěří.
 */

import nodemailer from 'nodemailer';
import { PRODUCTS, CITIES, LANGS, durationLabel, isDuration, priceOrder, fmtPrice, localize } from '../public/js/katalog.js';

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

/** Jazyk stránky, ze které objednávka přišla (hlášky a potvrzení zákazníkovi); neznámý → čeština. */
const langOf = (data) => (LANGS.includes(data.lang) ? data.lang : 'cs');

/** Texty pro zákazníka — chybové hlášky a potvrzovací e-mail. E-mail provozovateli je vždy česky. */
const MSG = {
  cs: {
    product: 'Vyberte stroj.', duration: 'Vyberte délku pronájmu.', city: 'Vyberte město.', date: 'Neplatné datum.',
    address: 'Vyplňte adresu doručení.', name: 'Vyplňte jméno.', phone: 'Vyplňte telefon.', email: 'Zkontrolujte e-mail.',
    long: 'Některé pole je moc dlouhé.', note: 'Poznámka je moc dlouhá.',
    failed: `Odeslání se nepovedlo. Zkuste to prosím znovu, nebo volejte ${CONTACT_PHONE}.`,
    subject: 'Děkujeme za objednávku | Půjčovna rotopedů', title: 'Děkujeme za objednávku',
    hello: 'Dobrý den,', thanks: (phone) => `děkujeme za objednávku. Za pár hodin Vám zavoláme na ${phone} a domluvíme předání.`,
    pad: 'Tlumicí podložka', mat: 'Podložka pod rotoped', ship: 'Doprava k vám', total: 'Celkem', deposit: 'Vratná záloha při předání',
    handover: 'Předání', delivery: (a) => `dovoz na adresu ${a}`, pickup: (c) => `vyzvednutí na pobočce ${c}`, from: 'od',
    asAgreed: 'dle domluvy', sign: 'Půjčovna rotopedů', web: 'https://www.pujcovna-rotopedu.cz'
  },
  en: {
    product: 'Please choose a machine.', duration: 'Please choose the rental period.', city: 'Please choose a city.', date: 'Invalid date.',
    address: 'Please fill in the delivery address.', name: 'Please fill in your name.', phone: 'Please fill in your phone.', email: 'Please check your e-mail.',
    long: 'Some field is too long.', note: 'The note is too long.',
    failed: `Sending failed. Please try again or call ${CONTACT_PHONE}.`,
    subject: 'Thank you for your order | Exercise Bike Rental', title: 'Thank you for your order',
    hello: 'Hello,', thanks: (phone) => `thank you for your order. We'll call you at ${phone} within a few hours to arrange the hand-over.`,
    pad: 'Noise-reducing mat', mat: 'Floor protection mat', ship: 'Delivery to you', total: 'Total', deposit: 'Refundable deposit at hand-over',
    handover: 'Hand-over', delivery: (a) => `delivery to ${a}`, pickup: (c) => `pick-up at our ${c} location`, from: 'from',
    asAgreed: 'as agreed', sign: 'Exercise Bike Rental (Půjčovna rotopedů)', web: 'https://www.pujcovna-rotopedu.cz/en'
  },
  de: {
    product: 'Bitte wählen Sie ein Gerät.', duration: 'Bitte wählen Sie die Mietdauer.', city: 'Bitte wählen Sie eine Stadt.', date: 'Ungültiges Datum.',
    address: 'Bitte geben Sie die Lieferadresse an.', name: 'Bitte geben Sie Ihren Namen an.', phone: 'Bitte geben Sie Ihre Telefonnummer an.', email: 'Bitte überprüfen Sie Ihre E-Mail-Adresse.',
    long: 'Ein Feld ist zu lang.', note: 'Die Anmerkung ist zu lang.',
    failed: `Senden fehlgeschlagen. Bitte versuchen Sie es erneut oder rufen Sie ${CONTACT_PHONE} an.`,
    subject: 'Vielen Dank für Ihre Bestellung | Heimtrainer-Verleih', title: 'Vielen Dank für Ihre Bestellung',
    hello: 'Guten Tag,', thanks: (phone) => `vielen Dank für Ihre Bestellung. Innerhalb weniger Stunden rufen wir Sie unter ${phone} an und vereinbaren die Übergabe.`,
    pad: 'Schalldämmende Matte', mat: 'Bodenschutzmatte', ship: 'Lieferung zu Ihnen', total: 'Gesamt', deposit: 'Kaution bei der Übergabe (erstattbar)',
    handover: 'Übergabe', delivery: (a) => `Lieferung an ${a}`, pickup: (c) => `Abholung am Standort ${c}`, from: 'ab',
    asAgreed: 'nach Vereinbarung', sign: 'Heimtrainer-Verleih (Půjčovna rotopedů)', web: 'https://www.pujcovna-rotopedu.cz/de'
  }
};

export function validate(data) {
  const m = MSG[langOf(data)];
  const errors = [];
  if (!PRODUCTS.some((p) => p.id === data.product)) errors.push(m.product);
  if (!isDuration(data.duration)) errors.push(m.duration);
  if (!CITIES.some((c) => c.name === data.city)) errors.push(m.city);
  if (str(data.date) && !/^\d{4}-\d{2}-\d{2}$/.test(str(data.date))) errors.push(m.date);
  if (data.delivery && str(data.address).length < 3) errors.push(m.address);
  if (str(data.name).length < 2) errors.push(m.name);
  if (str(data.phone).replace(/\D/g, '').length < 9) errors.push(m.phone);
  if (str(data.email) && !isValidEmail(str(data.email))) errors.push(m.email);
  for (const k of ['name', 'phone', 'email', 'address', 'city']) {
    if (str(data[k]).length > 200) errors.push(m.long);
  }
  if (str(data.note).length > 2000) errors.push(m.note);
  return [...new Set(errors)];
}

function normalize(data, lang = 'cs') {
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
    lang,
    productName: order.product ? localize(order.product, lang).name : '',
    durationLabel: durationLabel(order.product, data.duration, lang),
    order
  };
}

function formatDate(iso, lang = 'cs') {
  if (!iso) return MSG[lang].asAgreed;
  const [y, m, d] = iso.split('-');
  return `${Number(d)}. ${Number(m)}. ${y}`;
}

/** Řádky souhrnu objednávky — [popis, částka] */
function orderLines(d) {
  const m = MSG[d.lang];
  const lines = [[`${d.productName}, ${d.durationLabel}`, d.order.rent]];
  if (d.order.pad !== 0) lines.push([m.pad, d.order.pad]); // null = dohodou
  if (d.order.mat) lines.push([m.mat, d.order.mat]);
  if (d.order.ship) lines.push([m.ship, d.order.ship]);
  return lines;
}

// ---------- šablony ----------

export function buildOperatorEmail(data) {
  const d = normalize(data);
  const lines = orderLines(d);
  const handover = d.delivery ? `Dovézt domů: ${d.address}` : `Vyzvedne na pobočce ${d.city}`;

  const text = `Nová objednávka z webu pujcovna-rotopedu.cz
==========================================

${lines.map(([l, p]) => `${l}: ${fmtPrice(p)}`).join('\n')}
Celkem: ${fmtPrice(d.order.total)}
Vratná záloha: ${fmtPrice(d.order.deposit)}

Město: ${d.city}
Od kdy: ${formatDate(d.date)}
Předání: ${handover}

Jméno: ${d.name}
Telefon: ${d.phone}
E-mail: ${d.email || '(neuvedeno)'}
Jazyk webu: ${langOf(data).toUpperCase()}

Poznámka:
${d.note || '(žádná)'}
`;

  const row = (l, v, strong) => `<tr><td style="padding:4px 16px 4px 0;color:#596b84;">${l}</td><td style="padding:4px 0;${strong ? 'font-weight:700;' : ''}">${v}</td></tr>`;
  const html = `<!DOCTYPE html>
<html lang="cs"><head><meta charset="UTF-8"><title>Nová objednávka</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0A3A78;">
  <h1 style="font-size:20px;">Nová objednávka z webu</h1>
  <table style="border-collapse:collapse;font-size:15px;">
    ${lines.map(([l, p]) => row(escapeHtml(l), `${fmtPrice(p)}`)).join('\n    ')}
    ${row('Celkem', `${fmtPrice(d.order.total)}`, true)}
    ${row('Vratná záloha', `${fmtPrice(d.order.deposit)}`)}
  </table>
  <table style="border-collapse:collapse;font-size:15px;margin-top:16px;">
    ${row('Město', escapeHtml(d.city))}
    ${row('Od kdy', escapeHtml(formatDate(d.date)))}
    ${row('Předání', escapeHtml(handover))}
    ${row('Jméno', escapeHtml(d.name), true)}
    ${row('Telefon', `<a href="tel:${escapeHtml(d.phone.replace(/\s+/g, ''))}">${escapeHtml(d.phone)}</a>`)}
    ${row('E-mail', d.email ? `<a href="mailto:${escapeHtml(d.email)}">${escapeHtml(d.email)}</a>` : '(neuvedeno)')}
    ${row('Jazyk webu', langOf(data).toUpperCase())}
  </table>
  ${d.note ? `<div style="white-space:pre-wrap;border-left:3px solid #04BFA3;padding-left:12px;margin-top:16px;">${escapeHtml(d.note)}</div>` : ''}
  <p style="font-size:12px;color:#596b84;">Automaticky odesláno z pujcovna-rotopedu.cz</p>
</body></html>`;

  return { text, html };
}

export function buildCustomerEmail(data) {
  const lang = langOf(data);
  const m = MSG[lang];
  const d = normalize(data, lang);
  const lines = orderLines(d);
  const price = (n) => fmtPrice(n, lang);
  const handover = d.delivery ? m.delivery(d.address) : m.pickup(d.city);

  const text = `${m.hello}

${m.thanks(d.phone)}

${lines.map(([l, p]) => `${l}: ${price(p)}`).join('\n')}
${m.total}: ${price(d.order.total)}
${m.deposit}: ${price(d.order.deposit)}

${m.handover}: ${handover}, ${m.from} ${formatDate(d.date, lang)}

${m.sign}
${CONTACT_PHONE}
${m.web}
`;

  const html = `<!DOCTYPE html>
<html lang="${lang}"><head><meta charset="UTF-8"><title>${m.title}</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0A3A78;">
  <p>${m.hello}</p>
  <p>${escapeHtml(m.thanks(d.phone))}</p>
  <table style="border-collapse:collapse;font-size:15px;">
    ${lines.map(([l, p]) => `<tr><td style="padding:4px 16px 4px 0;">${escapeHtml(l)}</td><td style="padding:4px 0;text-align:right;">${price(p)}</td></tr>`).join('\n    ')}
    <tr><td style="padding:8px 16px 4px 0;font-weight:700;border-top:1px solid #d2dde9;">${m.total}</td><td style="padding:8px 0 4px;font-weight:700;text-align:right;border-top:1px solid #d2dde9;">${price(d.order.total)}</td></tr>
    <tr><td style="padding:4px 16px 4px 0;color:#596b84;">${m.deposit}</td><td style="padding:4px 0;color:#596b84;text-align:right;">${price(d.order.deposit)}</td></tr>
  </table>
  <p>${m.handover}: ${escapeHtml(handover)}, ${m.from} ${escapeHtml(formatDate(d.date, lang))}</p>
  <p>${m.sign}<br>${CONTACT_PHONE}<br><a href="${m.web}">${m.web.replace('https://www.', '')}</a></p>
</body></html>`;

  return { text, html, subject: m.subject };
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
      subject: customer.subject,
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
      body: { ok: false, error: MSG[langOf(body)].failed }
    };
  }
}
