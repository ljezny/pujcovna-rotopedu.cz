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

## Poznámky

- **Repo je veřejné** — žádná hesla ani tokeny do gitu. Heslo k SMTP je jen ve Vercelu.
- Vercel CLI: přihlášený účet `ljezny`, používat přes `npx vercel@latest` (globální instalace padá na právech).
- Mail server po několika neúspěšných přihlášeních dočasně blokuje IP (fail2ban) — pozor při testování hesel.
- Schránka `info@pujcovna-rotopedu.cz` se nepoužívá (přihlášení nefungovalo).

## Další kroky

- [ ] Změnit heslo schránky `rezervace@` (zaznělo v chatu) a aktualizovat `SMTP_PASS` ve Vercelu.
- [ ] Obsah a design webu (podklady ze současného www.pujcovna-rotopedu.cz, vzor beharna.cz).
- [ ] Skutečný poptávkový formulář (pole podle nabídky rotopedů) + upravit šablony e-mailů v `lib/poptavka.js`.
- [ ] Ochrana osobních údajů, favicon, robots.txt, sitemap.xml, OG obrázek; odstranit `noindex`.
- [ ] Ověřit DKIM pro doménu ve wp-hostingu (doručitelnost).
- [ ] Přepojit doménu `pujcovna-rotopedu.cz` / `www` na Vercel (až bude web hotový) + redirect www ↔ apex ve `vercel.json`.
