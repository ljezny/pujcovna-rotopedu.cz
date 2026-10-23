/**
 * Půjčovna rotopedů — generátor statických stránek.
 *
 * Ze šablon v src/ a katalogu (public/js/katalog.js) vyrobí:
 *   public/index.html               ← src/index.html
 *   public/produkt/<slug>.html      ← src/produkt.html + content/produkty/<slug>.html
 *   public/js/obrazky.js            ← otisky obrázků v public/images (pro ?v= v main.js)
 *
 * Spuštění: `npm run build`. Výstup se commituje (Vercel nic nebuildí); test hlídá, že je aktuální.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PRODUCTS, DURATIONS, PADDLE_DURATIONS, DEFAULT_DURATION, fmt } from '../public/js/katalog.js';
import { icon, iconFor } from './ikony.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(path.join(ROOT, p), 'utf8');

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Proměnné, které obsahují hotové HTML — ostatní se escapují.
const RAW = new Set(['content', 'thumbs', 'feats', 'prices', 'others', 'preselect', 'sceneClass']);

function render(template, vars) {
  const withPartials = template
    .replace(/<!-- include:([a-z-]+) -->\n?/g, (_, name) => read(`src/partials/${name}.html`))
    .replace(/\{\{icon:(\w+)\}\}/g, (_, name) => icon(name));
  return versionImages(withPartials.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in vars)) throw new Error(`Chybí proměnná {{${key}}}`);
    return RAW.has(key) ? vars[key] : esc(vars[key]);
  }));
}

/**
 * Otisky obrázků: obrázky mají cache „immutable“ na rok, takže při výměně fotky pod stejným názvem
 * by prohlížeč držel starou. Adresa proto nese ?v=<otisk obsahu>.
 */
function imageVersions() {
  const dir = path.join(ROOT, 'public/images');
  const out = {};
  for (const f of readdirSync(dir, { recursive: true }).sort()) {
    if (!/\.(jpe?g|png|webp|svg)$/.test(f)) continue;
    out[f.split(path.sep).join('/')] = createHash('sha1').update(readFileSync(path.join(dir, f))).digest('hex').slice(0, 8);
  }
  return out;
}

const IMAGES = imageVersions();

/** /images/… → /images/…?v=<otisk> ve vygenerovaném HTML */
function versionImages(html) {
  return html.replace(/"\/images\/([^"?]+)"/g, (m, p) => (IMAGES[p] ? `"/images/${p}?v=${IMAGES[p]}"` : m));
}

/** Verze pro ?v= u CSS/JS — změní se s obsahem, takže prohlížeč nedrží starou verzi. */
function assetVersion() {
  const h = createHash('sha1');
  for (const f of ['public/css/styles.css', 'public/js/main.js', 'public/js/katalog.js', 'public/js/consent.js']) h.update(read(f));
  h.update(JSON.stringify(IMAGES));
  return h.digest('hex').slice(0, 8);
}

/** content/produkty/<slug>.html: první řádek je `<!-- {json} -->` s title/description/headline (případně name). */
function readContent(slug) {
  const raw = read(`content/produkty/${slug}.html`);
  const m = raw.match(/^<!-- (\{.*\}) -->\n/);
  if (!m) throw new Error(`content/produkty/${slug}.html: chybí hlavička s metadaty`);
  return { meta: JSON.parse(m[1]), body: raw.slice(m[0].length).trim() };
}

/** Název stránky — u stránky s víc variantami (orbitreky) z metadat, jinak název stroje. */
function pageName(slug) {
  return readContent(slug).meta.name || PRODUCTS.find((p) => p.slug === slug).name;
}

/**
 * Popis stroje: sekce „Proč si … půjčit“ zůstane vidět jako hlavní body,
 * zbytek (úvod, doprava, tipy…) se schová pod rozbalovací tlačítko.
 */
const LI = /<li>(?:<strong>([^<]*?)\s*<\/strong>)?\s*([\s\S]*?)<\/li>/g;

/** „Proč si … půjčit“: odrážky „<strong>Nadpis:</strong> text“ → karty s ikonou */
function whyCards(section) {
  return section.replace(/<ul>([\s\S]*?)<\/ul>/, (_, items) => `<div class="why">${
    [...items.matchAll(LI)].map(([, title = '', text]) => {
      const t = title.replace(/:$/, '');
      return `\n  <div class="why__item">${icon(iconFor(t || text), 'ico why__ico')}<div>${t ? `<strong>${t}</strong>` : ''}<p>${text.trim()}</p></div></div>`;
    }).join('')}\n</div>`);
}

/** zbytek popisu: odrážky s nadpisem → seznam s ikonami, nadpisy sekcí s ikonou podle tématu */
function iconize(html) {
  return html
    .replace(/<ul>([\s\S]*?)<\/ul>/g, (all, items) => (/<li><strong>/.test(items)
      ? `<ul class="icon-list">${items.replace(LI, (_, title = '', text) => `<li>${icon(iconFor(title || text), 'ico icon-list__ico')}<span>${title ? `<strong>${title.trim()}</strong> ` : ''}${text.trim()}</span></li>`)}</ul>`
      : all))
    .replace(/<h3>([^<]*)<\/h3>/g, (all, t) => {
      const name = iconFor(t);
      return name === 'check' ? all : `<h3 class="h3-ico">${icon(name, 'ico')}${t}</h3>`;
    });
}

function splitContent(body) {
  const m = body.match(/<h3>Proč si[\s\S]*?<\/ul>\n?/);
  if (!m) return body;
  const rest = (body.slice(0, m.index) + body.slice(m.index + m[0].length)).trim();
  const why = whyCards(m[0].trim());
  if (!rest) return why;
  return `${why}
<details class="more">
  <summary><span data-more-label>Zobrazit další informace</span></summary>
  <div class="more__body">
${iconize(rest)}
  </div>
</details>`;
}

function productPage(slug, items, version) {
  const { meta, body } = readContent(slug);
  const main = items[0];
  const name = pageName(slug);
  const durations = main.paddle ? PADDLE_DURATIONS : DURATIONS;
  const images = [`/images/stroje/${main.img || main.id}.jpg`, ...(main.gallery || []).map((g) => `/images/stroje/galerie/${g}.jpg`)];
  const description = meta.description || `${name} k pronájmu: ${main.feats.slice(0, 2).join(', ')}. Od ${fmt(main.p[0])} Kč, Brno, Ostrava, Olomouc, Jihlava, Liberec, Zlín.`;

  const others = PRODUCTS.filter((p) => p.slug !== slug && PRODUCTS.find((q) => q.slug === p.slug) === p);

  return render(read('src/produkt.html'), {
    title: meta.title || `${name} - Půjčovna rotopedů`,
    description,
    path: `/produkt/${slug}`,
    version,
    name,
    cat: main.cat,
    headline: meta.headline || main.feats[0],
    image: images[0],
    sceneClass: main.scene ? ' gallery__main--scene' : '',
    thumbs: images.length > 1
      ? `<div class="gallery__thumbs">${images.map((src, i) => `<button type="button" data-gallery-thumb="${src}" aria-label="Fotka ${i + 1}"${i === 0 ? ' aria-current="true"' : ''}><img src="${src}" alt="" loading="lazy" width="120" height="120"></button>`).join('')}</div>`
      : '',
    feats: main.feats.map((f) => `<li>${esc(f)}</li>`).join(''),
    // ceny jako dlaždice (zalomí se, nic se neposouvá); víc variant (orbitreky) = víc bloků s nadpisem
    prices: items.map((p) => `<div class="prices">${items.length > 1 ? `<span class="prices__name">${esc(p.name)}</span>` : ''}<div class="prices__grid">${
      // 4 týdny = nejčastější pronájem → zvýrazněný (u paddleboardu jiné délky, tam ne)
      p.p.map((v, i) => (i === DEFAULT_DURATION && !p.paddle
        ? `<div class="price price--best"><em>Nejoblíbenější</em><span>${esc(durations[i])}</span><strong>${fmt(v)} Kč</strong></div>`
        : `<div class="price"><span>${esc(durations[i])}</span><strong>${fmt(v)} Kč</strong></div>`)).join('')
    }<div class="price price--long"><span>Delší doba</span><strong>dohodou</strong></div></div><span class="prices__dep">Vratná záloha ${fmt(p.dep)} Kč</span></div>`).join(''),
    ship: fmt(main.ship),
    content: splitContent(body).split('\n').map((l) => `      ${l}`).join('\n'),
    others: others.map((p) => `<a class="other" href="/produkt/${p.slug}"><img src="/images/stroje/${p.img || p.id}.jpg" alt="" loading="lazy" width="160" height="120"><span>${esc(pageName(p.slug))}</span><small>od ${fmt(p.p[0])} Kč</small></a>`).join(''),
    preselect: ` data-preselect="${main.id}"`
  });
}

/** Vrátí { 'public/…': obsah } — build() to zapíše, test porovná s commitnutými soubory. */
export function buildAll() {
  const version = assetVersion();
  const out = {
    'public/js/obrazky.js': `/* Vygenerováno scripts/build.mjs — otisky obrázků, needitovat. */
export const VERZE = ${JSON.stringify(IMAGES, null, 2)};

/** "stroje/rm.jpg" → "/images/stroje/rm.jpg?v=…" */
export const obrazek = (p) => \`/images/\${p}\${VERZE[p] ? \`?v=\${VERZE[p]}\` : ''}\`;
`,
    'public/index.html': render(read('src/index.html'), {
      title: 'Půjčovna rotopedů a fitness strojů — Brno, Ostrava, Olomouc, Jihlava, Liberec, Zlín',
      description: 'Potřebujete doma rehabilitovat či zvýšit kondici? Pronajímáme kvalitní stroje přesně pro vaše potřeby. Půjčovna rotopedů a fitness vybavení v Brně, Ostravě, Olomouci, Jihlavě, Liberci a Zlíně.',
      path: '/',
      version,
      preselect: ''
    })
  };

  const slugs = [...new Set(PRODUCTS.map((p) => p.slug))];
  const contentFiles = readdirSync(path.join(ROOT, 'content/produkty')).map((f) => f.replace(/\.html$/, ''));
  for (const slug of contentFiles) {
    if (!slugs.includes(slug)) throw new Error(`content/produkty/${slug}.html nemá stroj v katalogu`);
  }
  for (const slug of slugs) {
    out[`public/produkt/${slug}.html`] = productPage(slug, PRODUCTS.filter((p) => p.slug === slug), version);
  }
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  mkdirSync(path.join(ROOT, 'public/produkt'), { recursive: true });
  for (const [file, html] of Object.entries(buildAll())) {
    writeFileSync(path.join(ROOT, file), html);
    console.log(`✓ ${file}`);
  }
}
