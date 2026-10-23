/**
 * Půjčovna rotopedů — generátor statických stránek (cs / en / de).
 *
 * Ze šablon v src/, slovníků src/i18n/<jazyk>.json a katalogu (public/js/katalog.js) vyrobí:
 *   public/index.html, public/en/index.html, public/de/index.html          ← src/index.html
 *   public/[en/|de/]produkt/<slug>.html  ← src/produkt.html + content/produkty/[en/|de/]<slug>.html
 *   public/js/obrazky.js                 ← otisky obrázků v public/images (pro ?v= v main.js)
 *
 * V šablonách: {{t:klíč}} = text ze slovníku (může obsahovat HTML), {{lp}} = prefix jazyka ('' / '/en' / '/de'),
 * {{home}} = úvodní stránka jazyka, {{icon:jméno}} = SVG ikona, {{proměnná}} = hodnota z buildu.
 *
 * Spuštění: `npm run build`. Výstup se commituje (Vercel nic nebuildí); test hlídá, že je aktuální.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PRODUCTS, LANGS, DEFAULT_DURATION, localize, durationNames, fmt, fmtPrice } from '../public/js/katalog.js';
import { icon, iconFor } from './ikony.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(path.join(ROOT, p), 'utf8');

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const DICT = Object.fromEntries(LANGS.map((l) => [l, JSON.parse(read(`src/i18n/${l}.json`))]));
const LANG_NAMES = { cs: 'CZ', en: 'EN', de: 'DE' };
const lp = (lang) => (lang === 'cs' ? '' : `/${lang}`);
const homeOf = (lang) => lp(lang) || '/';

// Proměnné, které obsahují hotové HTML — ostatní se escapují.
const RAW = new Set(['content', 'thumbs', 'feats', 'prices', 'others', 'preselect', 'sceneClass', 'langs', 'alternates']);

function render(template, vars) {
  const lang = vars.lang;
  const withPartials = template
    .replace(/<!-- include:([a-z-]+) -->\n?/g, (_, name) => read(`src/partials/${name}.html`))
    .replace(/\{\{icon:(\w+)\}\}/g, (_, name) => icon(name))
    .replace(/\{\{t:([\w.]+)\}\}/g, (_, key) => {
      if (!(key in DICT[lang])) throw new Error(`src/i18n/${lang}.json: chybí „${key}“`);
      return DICT[lang][key];
    });
  return versionImages(withPartials.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in vars)) throw new Error(`Chybí proměnná {{${key}}}`);
    return RAW.has(key) ? vars[key] : esc(vars[key]);
  }));
}

/** Společné proměnné stránky v daném jazyce: odkazy, přepínač jazyků, hreflang. pagePath = cesta bez prefixu jazyka. */
function pageVars(lang, pagePath, version) {
  const url = (l) => (pagePath === '/' ? homeOf(l) : `${lp(l)}${pagePath}`);
  return {
    lang,
    lp: lp(lang),
    home: homeOf(lang),
    path: url(lang),
    version,
    langs: LANGS.map((l) => `<a href="${url(l)}" hreflang="${l}" lang="${l}"${l === lang ? ' aria-current="true"' : ''}>${LANG_NAMES[l]}</a>`).join(''),
    alternates: [...LANGS.map((l) => `  <link rel="alternate" hreflang="${l}" href="https://www.pujcovna-rotopedu.cz${url(l)}">`),
      `  <link rel="alternate" hreflang="x-default" href="https://www.pujcovna-rotopedu.cz${url('cs')}">`].join('\n')
  };
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
  for (const f of ['public/css/styles.css', 'public/js/main.js', 'public/js/katalog.js', 'public/js/texty.js', 'public/js/consent.js']) h.update(read(f));
  h.update(JSON.stringify(IMAGES));
  return h.digest('hex').slice(0, 8);
}

/** content/produkty/[en/|de/]<slug>.html: první řádek je `<!-- {json} -->` s title/description/headline (případně name). */
function readContent(slug, lang = 'cs') {
  const file = `content/produkty/${lang === 'cs' ? '' : `${lang}/`}${slug}.html`;
  const raw = read(file);
  const m = raw.match(/^<!-- (\{.*\}) -->\n/);
  if (!m) throw new Error(`${file}: chybí hlavička s metadaty`);
  return { meta: JSON.parse(m[1]), body: raw.slice(m[0].length).trim() };
}

/** Název stránky — u stránky s víc variantami (orbitreky) z metadat, jinak název stroje. */
function pageName(slug, lang) {
  return readContent(slug, lang).meta.name || localize(PRODUCTS.find((p) => p.slug === slug), lang).name;
}

// ---------- popis stroje ----------

/** Nadpis sekce „Proč si … půjčit“ v jednotlivých jazycích (překlady ho tak začínají). */
const WHY = { cs: 'Proč si', en: 'Why rent', de: 'Warum Sie' };
const LI = /<li>(?:<strong>([^<]*?)\s*<\/strong>)?\s*([\s\S]*?)<\/li>/g;

function sections(body, lang) {
  const m = body.match(new RegExp(`<h3>${WHY[lang]}[\\s\\S]*?<\\/ul>\\n?`));
  if (!m) return { why: null, rest: body };
  return { why: m[0].trim(), rest: (body.slice(0, m.index) + body.slice(m.index + m[0].length)).trim() };
}

/** Ikony se vybírají podle českého textu (iconFor zná česká slova) a do překladů se přenesou podle pořadí. */
function iconPlan(slug) {
  const { why, rest } = sections(readContent(slug, 'cs').body, 'cs');
  const whyItems = why ? [...why.match(/<ul>([\s\S]*?)<\/ul>/)[1].matchAll(LI)] : [];
  const listItems = [...rest.matchAll(/<ul>([\s\S]*?)<\/ul>/g)]
    .filter(([, items]) => /<li><strong>/.test(items))
    .flatMap(([, items]) => [...items.matchAll(LI)]);
  return {
    why: whyItems.map(([, title = '', text]) => iconFor(title || text)),
    list: listItems.map(([, title = '', text]) => iconFor(title || text)),
    h3: [...rest.matchAll(/<h3>([^<]*)<\/h3>/g)].map(([, t]) => iconFor(t))
  };
}

/** „Proč si … půjčit“: odrážky „<strong>Nadpis:</strong> text“ → karty s ikonou */
function whyCards(section, icons) {
  let i = 0;
  return section.replace(/<ul>([\s\S]*?)<\/ul>/, (_, items) => `<div class="why">${
    [...items.matchAll(LI)].map(([, title = '', text]) => {
      const t = title.replace(/:$/, '');
      return `\n  <div class="why__item">${icon(icons[i++] || 'check', 'ico why__ico')}<div>${t ? `<strong>${t}</strong>` : ''}<p>${text.trim()}</p></div></div>`;
    }).join('')}\n</div>`);
}

/** zbytek popisu: odrážky s nadpisem → seznam s ikonami, nadpisy sekcí s ikonou podle tématu */
function iconize(html, plan) {
  let li = 0;
  let h = 0;
  return html
    .replace(/<ul>([\s\S]*?)<\/ul>/g, (all, items) => (/<li><strong>/.test(items)
      ? `<ul class="icon-list">${items.replace(LI, (_, title = '', text) => `<li>${icon(plan.list[li++] || 'check', 'ico icon-list__ico')}<span>${title ? `<strong>${title.trim()}</strong> ` : ''}${text.trim()}</span></li>`)}</ul>`
      : all))
    .replace(/<h3>([^<]*)<\/h3>/g, (all, t) => {
      const name = plan.h3[h++] || 'check';
      return name === 'check' ? all : `<h3 class="h3-ico">${icon(name, 'ico')}${t}</h3>`;
    });
}

/**
 * Popis stroje: sekce „Proč si … půjčit“ zůstane vidět jako hlavní body,
 * zbytek (úvod, doprava, tipy…) se schová pod rozbalovací tlačítko.
 */
function splitContent(body, lang, plan) {
  const { why, rest } = sections(body, lang);
  if (!why) return body;
  const cards = whyCards(why, plan.why);
  if (!rest) return cards;
  return `${cards}
<details class="more">
  <summary><span data-more-label>${DICT[lang]['detail.more']}</span></summary>
  <div class="more__body">
${iconize(rest, plan)}
  </div>
</details>`;
}

// ---------- stránky ----------

function productPage(slug, items, lang, version) {
  const t = DICT[lang];
  const { meta, body } = readContent(slug, lang);
  const variants = items.map((p) => localize(p, lang));
  const main = variants[0];
  const name = pageName(slug, lang);
  const durations = durationNames(lang, main.paddle);
  const images = [`/images/stroje/${main.img || main.id}.jpg`, ...(main.gallery || []).map((g) => `/images/stroje/galerie/${g}.jpg`)];
  const description = meta.description || `${name} ${t['detail.rentLabel']}: ${main.feats.slice(0, 2).join(', ')}. ${t['detail.descFrom']} ${fmtPrice(main.p[0], lang)}, ${t['detail.descCities']}.`;
  const others = PRODUCTS.filter((p) => p.slug !== slug && PRODUCTS.find((q) => q.slug === p.slug) === p);
  const priceTile = (cls, label, value, badge = '') => `<div class="price${cls}">${badge}<span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;

  return render(read('src/produkt.html'), {
    ...pageVars(lang, `/produkt/${slug}`, version),
    title: meta.title || `${name} - ${t['detail.titleSuffix']}`,
    description,
    name,
    cat: main.cat,
    headline: meta.headline || main.feats[0],
    image: images[0],
    sceneClass: main.scene ? ' gallery__main--scene' : '',
    thumbs: images.length > 1
      ? `<div class="gallery__thumbs">${images.map((src, i) => `<button type="button" data-gallery-thumb="${src}" aria-label="${esc(t['detail.photo'])} ${i + 1}"${i === 0 ? ' aria-current="true"' : ''}><img src="${src}" alt="" loading="lazy" width="120" height="120"></button>`).join('')}</div>`
      : '',
    feats: main.feats.map((f) => `<li>${esc(f)}</li>`).join(''),
    // ceny jako dlaždice (zalomí se, nic se neposouvá); víc variant (orbitreky) = víc bloků s nadpisem
    prices: variants.map((p) => `<div class="prices">${variants.length > 1 ? `<span class="prices__name">${esc(p.name)}</span>` : ''}<div class="prices__grid">${
      // 4 týdny = nejčastější pronájem → zvýrazněný (u paddleboardu jiné délky, tam ne)
      p.p.map((v, i) => (i === DEFAULT_DURATION && !p.paddle
        ? priceTile(' price--best', durations[i], fmtPrice(v, lang), `<em>${esc(t['detail.best'])}</em>`)
        : priceTile('', durations[i], fmtPrice(v, lang)))).join('')
    }${priceTile(' price--long', t['detail.long'], t['detail.onRequest'])}</div><span class="prices__dep">${esc(t['detail.deposit'])} ${fmtPrice(p.dep, lang)}</span></div>`).join(''),
    ship: fmt(main.ship),
    content: splitContent(body, lang, iconPlan(slug)).split('\n').map((l) => `      ${l}`).join('\n'),
    others: others.map((p) => `<a class="other" href="${lp(lang)}/produkt/${p.slug}"><img src="/images/stroje/${p.img || p.id}.jpg" alt="" loading="lazy" width="160" height="120"><span>${esc(pageName(p.slug, lang))}</span><small>${esc(t['detail.descFrom'])} ${fmtPrice(p.p[0], lang)}</small></a>`).join(''),
    preselect: ` data-preselect="${main.id}"`
  });
}

const outDir = (lang) => (lang === 'cs' ? 'public' : `public/${lang}`);

/** Vrátí { 'public/…': obsah } — build() to zapíše, test porovná s commitnutými soubory. */
export function buildAll() {
  const version = assetVersion();
  const out = {
    'public/js/obrazky.js': `/* Vygenerováno scripts/build.mjs — otisky obrázků, needitovat. */
export const VERZE = ${JSON.stringify(IMAGES, null, 2)};

/** "stroje/rm.jpg" → "/images/stroje/rm.jpg?v=…" */
export const obrazek = (p) => \`/images/\${p}\${VERZE[p] ? \`?v=\${VERZE[p]}\` : ''}\`;
`
  };

  const slugs = [...new Set(PRODUCTS.map((p) => p.slug))];
  for (const lang of LANGS) {
    const dir = `content/produkty${lang === 'cs' ? '' : `/${lang}`}`;
    for (const f of readdirSync(path.join(ROOT, dir)).filter((x) => x.endsWith('.html'))) {
      if (!slugs.includes(f.replace(/\.html$/, ''))) throw new Error(`${dir}/${f} nemá stroj v katalogu`);
    }
    for (const slug of slugs) {
      if (!existsSync(path.join(ROOT, dir, `${slug}.html`))) throw new Error(`Chybí překlad ${dir}/${slug}.html`);
    }

    out[`${outDir(lang)}/index.html`] = render(read('src/index.html'), {
      ...pageVars(lang, '/', version),
      title: DICT[lang]['meta.title'],
      description: DICT[lang]['meta.description'],
      preselect: ''
    });
    for (const slug of slugs) {
      out[`${outDir(lang)}/produkt/${slug}.html`] = productPage(slug, PRODUCTS.filter((p) => p.slug === slug), lang, version);
    }
  }
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const [file, html] of Object.entries(buildAll())) {
    mkdirSync(path.dirname(path.join(ROOT, file)), { recursive: true });
    writeFileSync(path.join(ROOT, file), html);
    console.log(`✓ ${file}`);
  }
}
