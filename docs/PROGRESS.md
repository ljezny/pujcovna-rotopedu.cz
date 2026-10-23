# Progress — pujcovna-rotopedu.cz

Stav k 2026-10-23. Cíl: single-page web, který nahradí současný informační web www.pujcovna-rotopedu.cz.
Sesterský projekt `../beharna.cz` (stejný stack: statické HTML na Vercelu + serverless funkce s Nodemailerem).

## Hotovo

- **Kostra projektu** podle beharna.cz: `public/` (statika), `api/poptavka.js` → `lib/poptavka.js`, `dev-server.js`, `vercel.json`, testy (`npm test`, 7/7).
- **Web podle návrhu z Claude Design** (export `~/Downloads/Pujcovna rotopedu.html`, rozbalený do statického HTML/CSS/JS):
  - `public/index.html` + `css/styles.css` + `js/main.js`; fonty Archivo a JetBrains Mono jsou lokálně v `public/fonts/`.
  - Ceník, pobočky a zóny dopravy jsou v `public/js/katalog.js`. Stejný soubor importuje i `lib/poptavka.js`, takže cena v e-mailu se počítá ze stejných dat jako na webu (číslům z prohlížeče se nevěří).
  - Fotky strojů v ceníku jsou skutečné fotky z WooCommerce na původním webu (`public/images/stroje/`), u magnetického rotopedu nová fotka v interiéru (`scene: true` v katalogu = fotka přes celou kartu). Hero fotka (`images/hero.jpg`) je zatím ta z návrhu.
  - Objednávka: stroj, délka, město, datum, vyzvednutí/dovoz (+ adresa), jméno, telefon (povinný), e-mail (nepovinný; bez něj nechodí potvrzení zákazníkovi), poznámka, podložky. E-mail provozovateli obsahuje souhrn ceny a zálohy.
  - Kontaktní e-mail na webu je `rezervace@` (v návrhu bylo `info@`, ta schránka se nepoužívá).
  - Stále `noindex` — vypnout až při přepojení domény.
- **Vercel projekt** `pujcovna-rotopedu` v týmu „ljezny's projects“ (`prj_R7jeiL2uEdWwgKPClNY89uNCQBZr`), propojený s GitHub repem — push na `main` = produkční deploy.
- **Produkce:** https://pujcovna-rotopedu.vercel.app
- **SMTP funguje** (ověřeno na produkci, e-mail dorazil):
  - server `mail.wp-hosting.eu`, port 465, SSL
  - schránka `rezervace@pujcovna-rotopedu.cz` (odesílatel i příjemce poptávek)
  - env proměnné ve Vercelu (production + preview): `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_FROM`, `ORDER_EMAIL`, `SMTP_PASS` (sensitive)
- **Google Analytics** v `public/js/consent.js` (vložený v `<head>`), ID převzatá z původního webu:
  - GA4 `G-8523CEM02H` (původní web ho vkládá přes WordPress plugin Site Kit)
  - Google Ads `AW-16848333244`
  - stejný princip jako beharna.cz: měří se hned, opt-out přes odkaz s `data-cookie-settings` (lišta `.cookies`, zatím bez stylů)

## Měřicí kódy na původním webu (nepřevzaté)

- `UA-69282226-1` — Universal Analytics, Google ho v roce 2023 vypnul, nemá smysl přenášet.
- GTM `GTM-NQ4M6RKD` — Google Tag Manager; je potřeba ověřit, co v něm je.
- Meta Pixel: `763845957713706`, `1576770476026952`, `239999245211871` (3 pixely) — rozhodnout, který převzít.

## Poznámky

- **Repo je veřejné** — žádná hesla ani tokeny do gitu. Heslo k SMTP je jen ve Vercelu.
- Vercel CLI: přihlášený účet `ljezny`, používat přes `npx vercel@latest` (globální instalace padá na právech).
- Mail server po několika neúspěšných přihlášeních dočasně blokuje IP (fail2ban) — pozor při testování hesel.
- Schránka `info@pujcovna-rotopedu.cz` se nepoužívá (přihlášení nefungovalo).

## Další kroky

- [ ] Ověřit objednávku na produkci (skutečný e-mail na `rezervace@`).
- [ ] Hero fotka — nahradit vlastní fotkou z půjčovny?
- [ ] Ověřit texty a ceny v `katalog.js` (2 orbitreky sdílí jednu fotku; původní web má jen „Eliptický trenažer“).
- [ ] Rozhodnout o GTM a Meta Pixelu (viz výše).
- [ ] Stránka `/ochrana-osobnich-udaju` (vč. sekce `#cookies`) — odkazuje na ni cookie lišta, favicon, robots.txt, sitemap.xml, OG obrázek; odstranit `noindex`.
- [ ] Ověřit DKIM pro doménu ve wp-hostingu (doručitelnost).
- [ ] Přepojit doménu `pujcovna-rotopedu.cz` / `www` na Vercel (až bude web hotový) + redirect www ↔ apex ve `vercel.json`.
