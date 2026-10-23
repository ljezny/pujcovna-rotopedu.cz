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
  name: 'Jana Nováková',
  email: 'jana@example.cz',
  phone: '+420 777 123 456',
  message: 'Chtěla bych si půjčit rotoped.',
  gdpr: true,
});

let sent;
beforeEach(() => {
  sent = [];
  const t = getTransporter();
  t.sendMail = async (msg) => { sent.push(msg); return { messageId: 'test' }; };
});

test('validní poptávka projde a pošle dva e-maily', async () => {
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

test('chybějící povinná pole vrátí 400, telefon je nepovinný', async () => {
  for (const key of ['name', 'email', 'message', 'gdpr']) {
    const d = valid(); delete d[key];
    const res = await handleInquiry(d);
    assert.equal(res.status, 400, key);
  }
  const d = valid(); delete d.phone;
  assert.deepEqual(validate(d), []);
  assert.equal(sent.length, 0);
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
