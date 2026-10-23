import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

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
