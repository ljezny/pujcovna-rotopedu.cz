# Půjčovna rotopedů — pujcovna-rotopedu.cz

Single-page web, který nahradí současný informační web www.pujcovna-rotopedu.cz.
Sesterský projekt: beharna.cz (stejný stack i odesílání e-mailů).

Web je podle návrhu z Claude Design: ceník, doprava, pobočky, FAQ a objednávkový formulář.

## Stack

- **Frontend:** HTML / CSS / vanilla JS v `public/`, bez build kroku
- **Backend:** Vercel serverless funkce `api/poptavka.js` → `lib/poptavka.js` (validace + Nodemailer)
- **Lokálně:** Express `dev-server.js`

```
src/                 šablony stránek: index.html, produkt.html, partials/ (head, hlavička, objednávka)
content/produkty/    texty detailů strojů (převzaté z původního webu), 1. řádek = metadata v JSON
scripts/build.mjs    generátor: src/ + content/ + katalog → public/index.html a public/produkt/*.html
public/              vygenerované HTML + css/styles.css, fonts/, images/
public/js/katalog.js ceník, pobočky, výpočet ceny — sdílí web i lib/poptavka.js
public/js/main.js    ceník, souhrn a odeslání objednávky
public/js/consent.js GA4 + Google Ads (opt-out lišta)
api/poptavka.js      POST /api/poptavka (Vercel)
lib/poptavka.js      sdílená logika: validace, šablony e-mailů, odeslání
test/                node --test
dev-server.js        lokální server (statika + API)
vercel.json          outputDirectory public, hlavičky, cache
```

## Stránky a build

`public/index.html` a `public/produkt/*.html` se **needitují ručně** — mění se šablony v `src/`, texty v `content/produkty/`
a stroje/ceny v `public/js/katalog.js`, pak `npm run build`. Vygenerované soubory se commitují (Vercel nic nebuildí);
`npm test` selže, když build neodpovídá šablonám.

Detaily strojů mají stejné adresy jako původní web (`/produkt/rotoped-magneticky` …), oba orbitreky sdílí `/produkt/elipticky-trenazer`.

## Lokálně

```bash
npm install
cp .env.example .env   # bez SMTP_HOST se e-maily jen logují do konzole
npm run build          # po změně šablon / textů / katalogu
npm run dev            # http://localhost:3000
npm test
```

## Objednávka

Po odeslání odchází dva e-maily:
1. **Provozovateli** na `ORDER_EMAIL` (výchozí `rezervace@pujcovna-rotopedu.cz`) se souhrnem ceny. From je jméno zákazníka, Reply-To jeho e-mail (pokud ho vyplnil).
2. **Zákazníkovi** potvrzení — jen pokud vyplnil e-mail (selhání se jen zaloguje).

Ceny se mění v `public/js/katalog.js` (platí pro web i e-maily).

Proměnné prostředí (Vercel → Project → Settings → Environment Variables): `ORDER_EMAIL`, `SMTP_FROM`,
`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` (viz `.env.example`).

Bez `SMTP_HOST` formulář „projde“, ale e-maily se **jen zalogují** (Vercel → Logs).

## Nasazení

Push na `main` → Vercel automaticky nasadí produkci (projekt je propojený s GitHub repem).

**Repo je veřejné — žádné tokeny ani hesla do gitu.** Vercel token je jen lokálně (stejný jako u beharna.cz, `../beharna.cz/.env.deploy`).
