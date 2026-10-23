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
});

test('detail má předvyplněný stroj a ceny z katalogu', () => {
  const html = pages['public/produkt/rotoped-magneticky.html'];
  assert.match(html, /data-preselect="rm"/);
  assert.match(html, /<td>800<\/td>/);
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
  for (const f of readdirSync('content/produkty')) {
    assert.equal(unbalanced(readFileSync(`content/produkty/${f}`, 'utf8')), null, f);
  }
  for (const [file, html] of Object.entries(pages)) {
    if (file.endsWith('.html')) assert.equal(unbalanced(html), null, file);
  }
});
