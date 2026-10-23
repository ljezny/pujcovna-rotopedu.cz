# Progress — pujcovna-rotopedu.cz

Stav k 2026-10-23. Cíl: single-page web, který nahradí současný informační web www.pujcovna-rotopedu.cz.
Sesterský projekt `../beharna.cz` (stejný stack: statické HTML na Vercelu + serverless funkce s Nodemailerem).

## Hotovo

- **Kostra projektu** podle beharna.cz: `public/` (statika), `api/poptavka.js` → `lib/poptavka.js`, `dev-server.js`, `vercel.json`, testy (`npm test`, 18/18).
- **Web podle návrhu z Claude Design** (export `~/Downloads/Pujcovna rotopedu.html`, rozbalený do statického HTML/CSS/JS):
  - `public/index.html` + `css/styles.css` + `js/main.js`; fonty Archivo a JetBrains Mono jsou lokálně v `public/fonts/`.
  - Ceník, pobočky a zóny dopravy jsou v `public/js/katalog.js`. Stejný soubor importuje i `lib/poptavka.js`, takže cena v e-mailu se počítá ze stejných dat jako na webu (číslům z prohlížeče se nevěří).
  - Hero = koláž v CSS mřížce z fotek strojů v ceníku (`images/stroje/*.jpg`, s nálepkou); obrázky mají v adrese otisk `?v=` (po výměně vždy `npm run build`).
  - Objednávka: stroj, délka, město, datum, vyzvednutí/dovoz (+ adresa), jméno, telefon (povinný), e-mail (nepovinný; bez něj nechodí potvrzení zákazníkovi), poznámka, podložky. E-mail provozovateli obsahuje souhrn ceny a zálohy.
  - **Obsah převzatý z původního webu** (23. 10.): stroje, názvy, pořadí, kategorie a výhody ✔️ podle ceníku a WooCommerce produktů, ceník (platný od 1. 8. 2025), doprava, pobočky (vč. telefonů Liberec a Zlín), 5 kroků „Jak to funguje“, skutečné recenze, příběh zakladatele, poukazy, odkaz na paddleboardbrno.cz. Odpovídá se „za pár hodin“ (dřív v návrhu „do 24 hodin“).
  - **Detaily strojů** `/produkt/<slug>` (stejné adresy jako původní web; oba orbitreky na `/produkt/elipticky-trenazer`). Generuje `npm run build` (`scripts/build.mjs` ze šablon v `src/`, texty v `content/produkty/`, 1. řádek = JSON metadata). Obsah stránky:
    - galerie max 2 fotky (AI z ceníku + produktovka z původního webu),
    - ceny jako dlaždice (2/4/6/8 týdnů + „Delší doba – dohodou“), 4 týdny zvýrazněné „Nejoblíbenější“,
    - pás s ikonami: doprava (cena dle stroje), složený a seřízený, 6 poboček, stroj na míru postavě,
    - „Proč si … půjčit“ jako karty s ikonami; zbytek popisu pod „Zobrazit další informace“ (odrážky a nadpisy s ikonami),
    - ikony = inline SVG v `scripts/ikony.mjs`, vybírají se automaticky podle textu bodu (`iconFor`),
    - výhody půjčení, další stroje, objednávkový formulář s předvyplněným strojem.
  - **„Delší doba“** v ceníku i formuláři: cena dohodou, vzkaz ať se ozvou; objednávka projde, e-mail uvádí „dohodou“ (`LONG` v `katalog.js`).
  - **Logo**: znak `images/logo-znak.jpg` + název textem („Půjčovna rotopedů / a fitness vybavení“), favicon a apple-touch-icon ze znaku; na mobilu telefon jako kulatá ikona.
  - **Ceník na mobilu**: kompaktní řádky (fotka vlevo, bez výhod).
  - **AI fotky strojů v interiéru** (gpt-image-2, `scripts/ai-fotky.mjs`, nálepka `assets/nalepka.png`): rotopedy, pás, veslo, spinning, eliptical. Produktovky jsou v galerii detailu (`galerie/<id>-produkt.jpg`). Bosu, cyklotrenažer a paddleboard mají zatím původní fotky.
  - Pořadí v ceníku: rotopedy, pás, veslo, spinning, orbitreky; Bosu, cyklotrenažer, paddleboard na konci (`extra: true`) — na mobilu pod tlačítkem „Více“.
  - Hero koláž: stroje klikací na detail (štítek s názvem).
  - **Cache**: obrázky `immutable` na rok → v adresách otisk `?v=` (`public/js/obrazky.js`, generuje build); `katalog.js`/`obrazky.js` přes import mapu s verzí; JS se revaliduje (`max-age=0`). Po výměně fotky nebo změně katalogu vždy `npm run build`.
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
  - stejný princip jako beharna.cz: měří se hned, opt-out přes odkaz „Měření návštěvnosti“ v patičce (lišta `.cookies`)

## Měřicí kódy na původním webu (nepřevzaté)

- `UA-69282226-1` — Universal Analytics, Google ho v roce 2023 vypnul, nemá smysl přenášet.
- GTM `GTM-NQ4M6RKD` — Google Tag Manager; je potřeba ověřit, co v něm je.
- Meta Pixel: `763845957713706`, `1576770476026952`, `239999245211871` (3 pixely) — rozhodnout, který převzít.

## Poznámky

- **Repo je veřejné** — žádná hesla ani tokeny do gitu. Heslo k SMTP je jen ve Vercelu.
- Vercel CLI: přihlášený účet `ljezny`, používat přes `npx vercel@latest` (globální instalace padá na právech).
- Mail server po několika neúspěšných přihlášeních dočasně blokuje IP (fail2ban) — pozor při testování hesel.
- Schránka `info@pujcovna-rotopedu.cz` se nepoužívá (přihlášení nefungovalo). Kontakt na webu i odesílání zůstává `rezervace@` (23. 10. potvrzeno).
- AI fotky: `node scripts/ai-fotky.mjs generate --only rm --n 2` → `ai-fotky/` (gitignore) → `apply rm=1` → `npm run build`. Klíč `OPENAI_API_KEY` v `.env.local` (platnost 7 dní od 23. 10.). Model `gpt-image-2` nepodporuje `input_fidelity`.
- Texty importované z původního webu kontrolovat — u vesla import natáhl zbytek staré stránky (opraveno, test hlídá uzavřené značky).

## Další kroky

- [ ] Ověřit objednávku na produkci (skutečný e-mail na `rezervace@`).
- [x] Hero: koláž z fotek ceníku (vyzkoušeno i video a AI koláž `ai-fotky.mjs hero` — bez nálepek, nepoužito).
- [ ] Orbitrek magnetický a elektronický sdílí jednu fotku (původní web má jen jeden produkt „Eliptický trenažer“).
- [ ] Pobočky Zlín a Liberec mají jiné provozovatele (fakturační údaje: Michaela Horská, IČ 09278095; Petr Martínek, IČ 04293762) a Olomouc je Půjčovna rotopedů SV s.r.o. (IČ 223013305) — objednávky teď chodí všechny na `rezervace@`. Rozhodnout, jestli je posílat i na `zlin@` / `olomouc@` apod.
- [ ] Rozhodnout o GTM a Meta Pixelu (viz výše).
- [ ] Stránka `/ochrana-osobnich-udaju` (vč. sekce `#cookies`) — odkazuje na ni cookie lišta; robots.txt, sitemap.xml (vč. `/produkt/*`), OG obrázek; odstranit `noindex`.
- [ ] Zvýraznit 4 týdny i v přepínači délky v hlavním ceníku? (na detailu hotovo)
- [ ] Bosu, cyklotrenažer, paddleboard — zatím bez AI fotky v interiéru.
- [ ] Ověřit DKIM pro doménu ve wp-hostingu (doručitelnost).
- [ ] Přepojit doménu `pujcovna-rotopedu.cz` / `www` na Vercel (až bude web hotový) + redirect www ↔ apex ve `vercel.json`.
