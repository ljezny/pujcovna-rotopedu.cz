import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

import { buildAll } from '../scripts/build.mjs';
import { PRODUCTS } from '../public/js/katalog.js';

const pages = buildAll();

test('vygenerované stránky jsou aktuální (jinak spusť npm run build)', () => {
  for (const [file, html] of Object.entries(pages)) {
    assert.equal(readFileSync(file, 'utf8'), html, file);
  }
});

test('každý stroj má detail se stejnou adresou jako na původním webu', () => {
  for (const p of PRODUCTS) {
    assert.ok(pages[`public/produkt/${p.slug}.html`], p.slug);
  }
  assert.equal(Object.keys(pages).filter((f) => f.startsWith('public/produkt/')).length, 9);
  for (const lang of ['en', 'de']) {
    assert.equal(Object.keys(pages).filter((f) => f.startsWith(`public/${lang}/produkt/`)).length, 9, lang);
  }
});

test('detail má předvyplněný stroj a ceny z katalogu', () => {
  const html = pages['public/produkt/rotoped-magneticky.html'];
  assert.match(html, /data-preselect="rm"/);
  assert.match(html, /<strong>800 Kč<\/strong>/);
  assert.match(html, /<title>Rotoped magnetický - /);
  assert.ok(!/\{\{|include:/.test(html));
});

test('orbitreky sdílí jednu stránku s oběma variantami', () => {
  const html = pages['public/produkt/elipticky-trenazer.html'];
  assert.match(html, /Eliptical \(orbitrek\) magnetický/);
  assert.match(html, /Eliptical \(orbitrek\) elektronický/);
});

test('detail ukazuje „Proč si … půjčit“, zbytek popisu je pod rozbalením', () => {
  for (const [file, html] of Object.entries(pages)) {
    if (!file.startsWith('public/produkt/')) continue;
    const prose = html.slice(html.indexOf('class="prose"'), html.indexOf('class="benefits"'));
    assert.match(prose, /^class="prose">\s*<h3>Proč si/, file);
    assert.match(prose, /<details class="more">/, file);
  }
});

/** Párové značky musí být správně vnořené a uzavřené — jinak rozbitý text „spolkne“ zbytek stránky. */
function unbalanced(html) {
  const stack = [];
  const body = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style|svg)\b[\s\S]*?<\/\1>/g, '');
  for (const [, close, tag] of body.matchAll(/<(\/?)(p|ul|li|h[1-6]|strong|b|em|a|div|details|summary|section|main|aside|form|label|table|tr|td|th|span|figure|blockquote)\b[^>]*>/g)) {
    if (!close) stack.push(tag);
    else if (stack.pop() !== tag) return `neočekávané </${tag}>`;
  }
  return stack.length ? `neuzavřené <${stack.join('>, <')}>` : null;
}

test('texty strojů i vygenerované stránky mají uzavřené značky', () => {
  for (const f of readdirSync('content/produkty', { recursive: true }).filter((x) => x.endsWith('.html'))) {
    assert.equal(unbalanced(readFileSync(`content/produkty/${f}`, 'utf8')), null, f);
  }
  for (const [file, html] of Object.entries(pages)) {
    if (file.endsWith('.html')) assert.equal(unbalanced(html), null, file);
  }
});

test('jazykové verze: lang, odkazy s prefixem, hreflang, přepínač', () => {
  const en = pages['public/en/index.html'];
  assert.match(en, /<html lang="en">/);
  assert.match(en, /href="\/en\/produkt\/rotoped-magneticky"/);
  assert.match(en, /hreflang="de" href="https:\/\/www\.pujcovna-rotopedu\.cz\/de"/);
  assert.match(en, /<a href="\/de" hreflang="de" lang="de">DE<\/a>/);
  const de = pages['public/de/produkt/veslovaci-trenazer.html'];
  assert.match(de, /<html lang="de">/);
  assert.match(de, /Rudergerät/);
  assert.match(de, /Am beliebtesten/);
  assert.match(de, /<a href="\/produkt\/veslovaci-trenazer" hreflang="cs"/);
  assert.ok(!/href="\/produkt\//.test(de.replace(/hreflang="cs"[^>]*>|<a href="\/produkt\/[^"]*" hreflang="cs"/g, '')), 'odkazy na detaily mají /de prefix');
});

test('slovníky cs / en / de mají stejné klíče', () => {
  const keys = ['cs', 'en', 'de'].map((l) => Object.keys(JSON.parse(readFileSync(`src/i18n/${l}.json`, 'utf8'))).sort().join());
  assert.equal(keys[0], keys[1]);
  assert.equal(keys[0], keys[2]);
});

test('ikony v překladech popisů odpovídají češtině (stejné pořadí)', () => {
  const icons = (html) => [...html.matchAll(/<svg class="ico (why__ico|icon-list__ico)[^]*?<\/svg>/g)].map((m) => m[0]);
  for (const slug of ['rotoped-magneticky', 'bezecky-pas-elektronicky', 'veslovaci-trenazer']) {
    const cs = icons(pages[`public/produkt/${slug}.html`]);
    assert.ok(cs.length > 0, slug);
    assert.deepEqual(icons(pages[`public/en/produkt/${slug}.html`]), cs, `en ${slug}`);
    assert.deepEqual(icons(pages[`public/de/produkt/${slug}.html`]), cs, `de ${slug}`);
  }
});
