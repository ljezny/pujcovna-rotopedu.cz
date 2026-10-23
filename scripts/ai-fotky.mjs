/**
 * Půjčovna rotopedů — produktové fotky strojů → fotky v domácím prostředí (OpenAI images/edits).
 *
 * Každá fotka jde přes stejný prompt; jako druhý vstup dostane AI nálepku assets/nalepka.png.
 *
 *   node scripts/ai-fotky.mjs generate [--only vt,bp] [--n 2] [--src ~/Desktop/foto]
 *       → varianty do ai-fotky/<id>-<n>.png (složka je v .gitignore)
 *   node scripts/ai-fotky.mjs hero [--style kolaz|scena] [--n 2]
 *       → úvodní fotka (na výšku) ze všech hlavních strojů do ai-fotky/hero-<styl>-<n>.png
 *   node scripts/ai-fotky.mjs apply vt=2 bp=1 …
 *       → vybraná varianta do public/images/stroje/<id>.jpg,
 *         původní produktovka se přesune do public/images/stroje/galerie/<id>-produkt.jpg
 *
 * Klíč: OPENAI_API_KEY v .env.local (nikdy ne do gitu). Model: OPENAI_IMAGE_MODEL (výchozí gpt-image-2).
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir, homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(ROOT, '.env.local') });

const OUT = path.join(ROOT, 'ai-fotky');
const STICKER = path.join(ROOT, 'assets/nalepka.png');
const MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2';

/** soubor ve vstupní složce (bez přípony) → id stroje v katalogu */
const PHOTOS = {
  'rotoped': 'rm',
  'elektronicky rotoped': 're',
  'eliptical': 'om',
  'veslo': 'vt',
  'bezecky pas': 'bp',
  'spinning': 'sk'
};

const PROMPT = `Place the exercise machine from the first image into a bright, modern, tidy Czech apartment interior \
(for example a living room or bedroom with wooden floor, a rug, some furniture and plants, soft natural daylight from a window). \
Keep the machine exactly as it is: same shape, colors, proportions, logos and all details; do not add, remove or redesign any part. \
Apply the white rectangular sticker from the second image onto one or two flat, clearly visible surfaces of the machine \
(for example the frame or the side cover), like a real printed vinyl sticker following the surface; \
the sticker's logo and the text "www.PUJCOVNA-ROTOPEDU.cz" must be reproduced exactly, letter by letter. \
The whole machine is visible, standing naturally on the floor in a realistic position and scale, with realistic shadows. \
Eye-level camera, slight three-quarter view, photorealistic interior photography, no people, no other text.`;

/** úvodní fotka: stroje, které na ní mají být (id z PHOTOS) */
const HERO_MACHINES = ['rm', 'sk', 'bp', 'vt', 'om'];
const HERO_PROMPTS = {
  kolaz: `Create a portrait photo collage for the hero section of a fitness equipment rental website. \
Use exactly the five exercise machines from the input images (an upright exercise bike, a spinning bike, a treadmill, a rowing machine and an elliptical trainer), \
each as its own photo tile in a clean grid with thin white gaps between the tiles. \
Every tile shows one machine in a bright, modern, tidy Czech apartment (wooden floor, rug, plants, soft natural daylight), \
all tiles share the same warm, light color grading so the collage looks consistent. \
Keep each machine exactly as it is: same shape, colors, proportions and logos; do not add, remove or redesign any part. \
Each machine fully visible in its tile, realistic shadows, photorealistic interior photography, no people, no text, no captions.`,
  scena: `Create one portrait photorealistic photo for the hero section of a fitness equipment rental website: \
a bright, spacious, modern Czech apartment living room with light wooden floor, rugs, plants and soft natural daylight from large windows, \
where all five exercise machines from the input images stand neatly arranged together (an upright exercise bike, a spinning bike, a treadmill, a rowing machine and an elliptical trainer). \
Keep each machine exactly as it is: same shape, colors, proportions and logos; do not add, remove or redesign any part. \
All machines fully visible, realistic scale relative to each other and to the room, realistic shadows, eye-level camera, \
inviting and uncluttered composition, no people, no text.`
};

// ---------- pomocné ----------

function args() {
  const [cmd, ...rest] = process.argv.slice(2);
  const opts = { only: null, n: 2, style: 'kolaz', src: path.join(homedir(), 'Desktop/foto'), picks: [] };
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--only') opts.only = rest[++i].split(',');
    else if (rest[i] === '--n') opts.n = Number(rest[++i]);
    else if (rest[i] === '--style') opts.style = rest[++i];
    else if (rest[i] === '--src') opts.src = rest[++i].replace(/^~/, homedir());
    else opts.picks.push(rest[i]);
  }
  return { cmd, opts };
}

/** API bere png/jpeg/webp — AVIF a spol. převedeme přes macOS `sips` na PNG. */
function toPng(file) {
  const out = path.join(tmpdir(), `ai-fotky-${process.pid}-${path.basename(file).replace(/\W+/g, '-')}.png`); // pid: souběžné běhy si nepřepisují soubory
  execFileSync('sips', ['-s', 'format', 'png', file, '--out', out], { stdio: 'ignore' });
  return out;
}

function findSource(src, name) {
  const file = readdirSync(src).find((f) => f.replace(/\.[^.]+$/, '').normalize('NFC') === name.normalize('NFC'));
  if (!file) throw new Error(`Ve složce ${src} chybí fotka „${name}“`);
  return path.join(src, file);
}

async function edit(imageFiles, n, prompt = PROMPT, size = '1536x1024') {
  const form = new FormData();
  form.append('model', MODEL);
  form.append('prompt', prompt);
  form.append('n', String(n));
  form.append('size', size);
  form.append('quality', 'high');
  // gpt-image-2 parametr nepodporuje (detaily drží sám), gpt-image-1.x ano
  if (MODEL.startsWith('gpt-image-1')) form.append('input_fidelity', 'high');
  for (const f of imageFiles) {
    form.append('image[]', new Blob([readFileSync(f)], { type: 'image/png' }), path.basename(f));
  }
  const res = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: form
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${body.error?.message || JSON.stringify(body)}`);
  return body;
}

// ---------- příkazy ----------

async function generate({ only, n, src }) {
  if (!process.env.OPENAI_API_KEY) throw new Error('Chybí OPENAI_API_KEY v .env.local');
  mkdirSync(OUT, { recursive: true });
  const sticker = toPng(STICKER);
  for (const [name, id] of Object.entries(PHOTOS)) {
    if (only && !only.includes(id)) continue;
    console.log(`→ ${id} (${name}), ${n}× ${MODEL} …`);
    const started = Date.now();
    const body = await edit([toPng(findSource(src, name)), sticker], n);
    save(id, body, started);
  }
}

/** uloží varianty jako <prefix>-<n>.png — číslujeme dál, ať nová várka nepřepíše předchozí */
function save(prefix, body, started) {
  let next = 1;
  while (existsSync(path.join(OUT, `${prefix}-${next}.png`))) next++;
  body.data.forEach((img, i) => {
    const file = path.join(OUT, `${prefix}-${next + i}.png`);
    writeFileSync(file, Buffer.from(img.b64_json, 'base64'));
    console.log(`  ✓ ${path.relative(ROOT, file)} (${MODEL})`);
  });
  console.log(`  ${Math.round((Date.now() - started) / 1000)} s`);
}

async function hero({ style, n, src }) {
  if (!process.env.OPENAI_API_KEY) throw new Error('Chybí OPENAI_API_KEY v .env.local');
  if (!HERO_PROMPTS[style]) throw new Error(`Neznámý styl „${style}“ (${Object.keys(HERO_PROMPTS).join(', ')})`);
  mkdirSync(OUT, { recursive: true });
  const byId = Object.fromEntries(Object.entries(PHOTOS).map(([name, id]) => [id, name]));
  const images = HERO_MACHINES.map((id) => toPng(findSource(src, byId[id])));
  console.log(`→ hero (${style}), ${n}× ${MODEL} …`);
  const started = Date.now();
  save(`hero-${style}`, await edit(images, n, HERO_PROMPTS[style], '1024x1536'), started);
}

function apply({ picks }) {
  const stroje = path.join(ROOT, 'public/images/stroje');
  for (const pick of picks) {
    const [id, variant] = pick.split('=');
    const from = path.join(OUT, `${id}-${variant}.png`);
    if (!existsSync(from)) throw new Error(`Chybí ${path.relative(ROOT, from)}`);
    const target = path.join(stroje, `${id}.jpg`);
    const product = path.join(stroje, 'galerie', `${id}-produkt.jpg`);
    if (existsSync(target) && !existsSync(product)) renameSync(target, product);
    execFileSync('sips', ['-Z', '1000', '-s', 'format', 'jpeg', '-s', 'formatOptions', '68', from, '--out', target], { stdio: 'ignore' });
    console.log(`✓ ${id}: ${path.relative(ROOT, from)} → ${path.relative(ROOT, target)}`);
  }
}

const { cmd, opts } = args();
if (cmd === 'generate') await generate(opts);
else if (cmd === 'hero') await hero(opts);
else if (cmd === 'apply') { apply(opts); console.log('→ teď spusť npm run build (nové otisky obrázků, jinak prohlížeče drží staré fotky)'); }
else console.log('Použití: node scripts/ai-fotky.mjs generate [--only vt] [--n 2] | apply vt=2 bp=1');
