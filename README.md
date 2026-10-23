# Půjčovna rotopedů — pujcovna-rotopedu.cz

Single-page web, který nahradí současný informační web www.pujcovna-rotopedu.cz.
Sesterský projekt: beharna.cz (stejný stack i odesílání e-mailů).

Zatím je na webu jen **testovací formulář** pro ověření odesílání e-mailů.

## Stack

- **Frontend:** HTML / CSS / vanilla JS v `public/`, bez build kroku
- **Backend:** Vercel serverless funkce `api/poptavka.js` → `lib/poptavka.js` (validace + Nodemailer)
- **Lokálně:** Express `dev-server.js`

```
public/              index.html
api/poptavka.js      POST /api/poptavka (Vercel)
lib/poptavka.js      sdílená logika: validace, šablony e-mailů, odeslání
test/                node --test
dev-server.js        lokální server (statika + API)
vercel.json          outputDirectory public, hlavičky, cache
```

## Lokálně

```bash
npm install
cp .env.example .env   # bez SMTP_HOST se e-maily jen logují do konzole
npm run dev            # http://localhost:3000
npm test
```

## Formulář

Po odeslání odchází dva e-maily:
1. **Provozovateli** na `ORDER_EMAIL` (výchozí `zlin@pujcovna-rotopedu.cz`). From je jméno zákazníka, Reply-To jeho e-mail.
2. **Zákazníkovi** potvrzení (selhání se jen zaloguje).

Proměnné prostředí (Vercel → Project → Settings → Environment Variables): `ORDER_EMAIL`, `SMTP_FROM`,
`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` (viz `.env.example`).

Bez `SMTP_HOST` formulář „projde“, ale e-maily se **jen zalogují** (Vercel → Logs).

## Nasazení

Push na `main` → Vercel automaticky nasadí produkci (projekt je propojený s GitHub repem).

**Repo je veřejné — žádné tokeny ani hesla do gitu.** Vercel token je jen lokálně (stejný jako u beharna.cz, `../beharna.cz/.env.deploy`).
