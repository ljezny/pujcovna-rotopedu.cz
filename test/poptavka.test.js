import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

delete process.env.SMTP_HOST; // JSON transport — e-maily se jen logují

const {
  validate,
  escapeHtml,
  buildOperatorEmail,
  handleInquiry,
  getTransporter,
} = await import('../lib/poptavka.js');

const valid = () => ({
  product: 'rm',
  duration: 1,
  city: 'Brno',
  date: '2026-11-02',
  delivery: true,
  address: 'Táborská 1, Brno, 3. patro',
  name: 'Jana Nováková',
  email: 'jana@example.cz',
  phone: '+420 777 123 456',
  note: 'Po operaci kolena.',
  pad: true,
  mat: false,
});

let sent;
beforeEach(() => {
  sent = [];
  const t = getTransporter();
  t.sendMail = async (msg) => { sent.push(msg); return { messageId: 'test' }; };
});

test('validní objednávka projde a pošle dva e-maily', async () => {
  const res = await handleInquiry(valid());
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { ok: true });
  assert.equal(sent.length, 2);
  assert.equal(sent[0].to, 'rezervace@pujcovna-rotopedu.cz');
  assert.equal(sent[0].replyTo, 'jana@example.cz');
  assert.equal(sent[1].to, 'jana@example.cz');
});

test('honeypot vrátí ok a nic nepošle', async () => {
  const res = await handleInquiry({ ...valid(), website: 'spam' });
  assert.equal(res.status, 200);
  assert.equal(sent.length, 0);
});

test('chybějící povinná pole vrátí 400', async () => {
  for (const key of ['product', 'duration', 'city', 'name', 'phone', 'address']) {
    const d = valid(); delete d[key];
    const res = await handleInquiry(d);
    assert.equal(res.status, 400, key);
  }
  assert.equal(sent.length, 0);
});

test('neznámý stroj, délka nebo město neprojde', () => {
  assert.notDeepEqual(validate({ ...valid(), product: 'xx' }), []);
  assert.notDeepEqual(validate({ ...valid(), duration: 5 }), []);
  assert.notDeepEqual(validate({ ...valid(), duration: '1' }), []);
  assert.notDeepEqual(validate({ ...valid(), city: 'Praha' }), []);
});

test('adresa je povinná jen pro dovoz', () => {
  assert.deepEqual(validate({ ...valid(), delivery: false, address: '' }), []);
});

test('bez e-mailu odejde jen e-mail provozovateli', async () => {
  const res = await handleInquiry({ ...valid(), email: '' });
  assert.equal(res.status, 200);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].replyTo, undefined);
});

test('cena se počítá z katalogu, ne z klienta', () => {
  // rotoped magnetický 4 týdny 800 + tlumicí podložka 100 + doprava 300 = 1 200
  const { text } = buildOperatorEmail({ ...valid(), total: 1 });
  assert.match(text, /Rotoped magnetický, 4 týdny: 800 Kč/);
  assert.match(text, /Celkem: 1 200 Kč/);
  assert.match(text, /Vratná záloha: 3 000 Kč/);
});

test('prázdné / chybějící body vrátí 400', async () => {
  assert.equal((await handleInquiry(undefined)).status, 400);
  assert.equal((await handleInquiry({})).status, 400);
});

test('HTML ve vstupech je escapované', () => {
  const { html } = buildOperatorEmail({ ...valid(), name: '<script>alert(1)</script>' });
  assert.ok(!html.includes('<script>alert'));
  assert.equal(escapeHtml(`<&"'>`), '&lt;&amp;&quot;&#39;&gt;');
});

test('From hlavička je sanitizovaná', async () => {
  await handleInquiry({ ...valid(), name: 'Eva "X"\r\nBcc: a@b.cz' });
  assert.ok(!/[\r\n]/.test(sent[0].from));
});

test('selhání e-mailu provozovateli vrátí 500', async () => {
  getTransporter().sendMail = async () => { throw new Error('smtp down'); };
  const res = await handleInquiry(valid());
  assert.equal(res.status, 500);
});

test('delší doba: objednávka projde, cena „dohodou“', async () => {
  const d = { ...valid(), duration: 4 };
  assert.deepEqual(validate(d), []);
  const { text } = buildOperatorEmail(d);
  assert.match(text, /Rotoped magnetický, delší doba: dohodou/);
  assert.match(text, /Tlumicí podložka: dohodou/);
  assert.match(text, /Celkem: dohodou/);
  assert.match(text, /Vratná záloha: 3 000 Kč/);
  const res = await handleInquiry(d);
  assert.equal(res.status, 200);
  assert.match(sent[0].subject, /delší doba/);
});

test('anglická objednávka: hlášky i potvrzení anglicky, provozovateli česky', async () => {
  assert.deepEqual(validate({ ...valid(), lang: 'en', phone: '1' }), ['Please fill in your phone.']);
  const res = await handleInquiry({ ...valid(), lang: 'en' });
  assert.equal(res.status, 200);
  assert.match(sent[0].text, /Rotoped magnetický, 4 týdny/);
  assert.match(sent[0].text, /Jazyk webu: EN/);
  assert.equal(sent[1].subject, 'Thank you for your order | Exercise Bike Rental');
  assert.match(sent[1].text, /Magnetic exercise bike, 4 weeks: 800 CZK/);
  assert.match(sent[1].text, /Total: 1 200 CZK/);
});

test('neznámý jazyk → čeština', () => {
  assert.deepEqual(validate({ ...valid(), lang: 'xx', phone: '1' }), ['Vyplňte telefon.']);
});
