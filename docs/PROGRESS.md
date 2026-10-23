# Progress — pujcovna-rotopedu.cz

Stav k 2026-10-23. Cíl: single-page web, který nahradí současný informační web www.pujcovna-rotopedu.cz.
Sesterský projekt `../beharna.cz` (stejný stack: statické HTML na Vercelu + serverless funkce s Nodemailerem).

## Hotovo

- **Kostra projektu** podle beharna.cz: `public/` (statika), `api/poptavka.js` → `lib/poptavka.js`, `dev-server.js`, `vercel.json`, testy (`npm test`, 7/7).
- **Testovací formulář** na `public/index.html` (jméno, e-mail, telefon, zpráva, souhlas, honeypot), `noindex`.
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

- [ ] Obsah a design webu (podklady ze současného www.pujcovna-rotopedu.cz, vzor beharna.cz).
- [ ] Skutečný poptávkový formulář (pole podle nabídky rotopedů) + upravit šablony e-mailů v `lib/poptavka.js`.
- [ ] Patička s odkazem „Měření návštěvnosti“ (`data-cookie-settings`) + CSS lišty `.cookies`.
- [ ] Rozhodnout o GTM a Meta Pixelu (viz výše).
- [ ] Ochrana osobních údajů (vč. sekce `#cookies`), favicon, robots.txt, sitemap.xml, OG obrázek; odstranit `noindex`.
- [ ] Ověřit DKIM pro doménu ve wp-hostingu (doručitelnost).
- [ ] Přepojit doménu `pujcovna-rotopedu.cz` / `www` na Vercel (až bude web hotový) + redirect www ↔ apex ve `vercel.json`.
