/* Půjčovna rotopedů — katalog strojů, ceny a pobočky.
   Sdílí ho stránka (public/js/main.js) i server (lib/poptavka.js), aby cena v e-mailu seděla s webem. */

export const DURATIONS = ['2 týdny', '4 týdny', '6 týdnů', '8 týdnů'];
export const PADDLE_DURATIONS = ['víkend (čt–po)', 'týden', '10 dní', '14 dní'];
export const DEFAULT_DURATION = 1;
/* „Delší doba“ — poslední záložka za DURATIONS, cena dohodou */
export const LONG = DURATIONS.length;
export const LONG_LABEL = 'Delší doba';

/* Stroje, texty a ceny podle původního webu www.pujcovna-rotopedu.cz (ceník platný od 1. 8. 2025).
   slug = podstránka /produkt/<slug> (stejné adresy jako na původním webu; oba orbitreky sdílí jednu),
   gallery = další fotky v images/stroje/galerie/ (produktovka na bílém, další fotky),
   scene = hlavní fotka v interiéru (AI, scripts/ai-fotky.mjs) přes celou plochu, jinak produktovka na bílém,
   extra = doplňkové vybavení na konci ceníku — na mobilu schované pod tlačítkem „Více“
   p = cena za DURATIONS[i] (u paddleboardu PADDLE_DURATIONS[i]), dep = vratná záloha, ship = doprava jedna cesta */
export const PRODUCTS = [
  {
    id: 'rm', slug: 'rotoped-magneticky', scene: true, gallery: ['rm-produkt'], cat: 'Rotopedy a cyklotrenažery', name: 'Rotoped magnetický',
    feats: ['Vhodný pro rehabilitaci – stabilní a šetrný ke kloubům', 'Tichý chod – neruší sousedy ani sledování televize', 'Nepotřebuje zásuvku – umístíte ho kamkoliv', 'Dodáme složený a seřízený – bez nutnosti montáže'],
    p: [600, 800, 1200, 1600], dep: 3000, ship: 300
  },
  {
    id: 're', slug: 'rotoped-elektronicky', scene: true, gallery: ['re-produkt'], cat: 'Rotopedy a cyklotrenažery', name: 'Rotoped elektronický',
    feats: ['Tréninkové programy – automatické nastavení zátěže pro hubnutí i kondici', 'Přesná kontrola zátěže – ideální pro řízenou rehabilitaci', 'Maximální komfort – tichý chod, přehledný displej a ovládání tlačítky', 'Dodáme složený a připravený – stačí jen zapojit'],
    p: [900, 1200, 1800, 2400], dep: 4000, ship: 300
  },
  {
    id: 'bp', slug: 'bezecky-pas-elektronicky', scene: true, gallery: ['bp-produkt'], cat: 'Běžecké pásy', name: 'Běžecký pás elektronický',
    feats: ['Stabilní – nosnost min. 120 kg, běžecká plocha 40+ cm', 'Sklápěcí konstrukce – po tréninku šetří místo', 'Dodáme složený a seřízený – nemusíte nic montovat', 'Možnost dopravy – s výnosem až do bytu'],
    p: [1600, 2200, 3300, 4400], dep: 5000, ship: 400
  },
  {
    id: 'vt', slug: 'veslovaci-trenazer', scene: true, gallery: ['vt-produkt'], cat: 'Veslovací trenažery', name: 'Veslovací trenažer',
    feats: ['Procvičí celé tělo – zapojíte svaly nohou, zad, rukou i břicha', 'Sklápěcí konstrukce – po tréninku trenažér snadno složíte', 'Dodáme složený a seřízený – nemusíte nic montovat', 'Snadná manipulace – vejde se do auta i do každého pokoje'],
    p: [1000, 1400, 2100, 2800], dep: 4000, ship: 400
  },
  {
    id: 'sk', slug: 'spinningove-kolo', scene: true, gallery: ['sk-produkt'], cat: 'Rotopedy a cyklotrenažery', name: 'Spinningové kolo',
    feats: ['Vysoká stabilita – pevná konstrukce i při jízdě ve stoje', 'Těžký setrvačník – plynulý chod i při vysoké zátěži', 'Nastavení na míru – snadné přizpůsobení sedla i řídítek', 'Nemusíte nic montovat – dodáme složený a seřízený'],
    p: [1200, 1600, 2400, 3200], dep: 4000, ship: 400
  },
  {
    id: 'om', slug: 'elipticky-trenazer', scene: true, gallery: ['om-produkt'], cat: 'Eliptické trenažery', name: 'Eliptical (orbitrek) magnetický',
    feats: ['Efektivní trénink – vysoký výdej energie a podpora spalování tuků', 'Procvičí celé tělo – zapojíte nohy, hýždě, ruce i břicho', 'Tichý chod – plynulý pohyb, který neruší ostatní členy domácnosti', 'Transportní kolečka – snadné přemístění trenažéru po tréninku'],
    p: [900, 1200, 1800, 2400], dep: 4000, ship: 400
  },
  {
    id: 'oe', slug: 'elipticky-trenazer', scene: true, gallery: ['om-produkt'], img: 'om', cat: 'Eliptické trenažery', name: 'Eliptical (orbitrek) elektronický',
    feats: ['Efektivní trénink – vysoký výdej energie a podpora spalování tuků', 'Procvičí celé tělo – zapojíte nohy, hýždě, ruce i břicho', 'Plynulý pohyb – bez tvrdých nárazů jako při běhu', 'Transportní kolečka – snadné přemístění trenažéru po tréninku'],
    p: [1000, 1400, 2100, 2800], dep: 4000, ship: 400
  },
  {
    id: 'bo', slug: 'bosu', extra: true, cat: 'Bosu', name: 'Bosu',
    feats: ['Zlepší stabilitu těla a rovnováhu', 'Posílí hluboký stabilizační systém', 'Původně pomůcka pro rehabilitační centra', 'Doma i v kanceláři – například jako prevence bolesti zad'],
    p: [300, 500, 700, 900], dep: 1000, ship: 300
  },
  {
    id: 'ct', slug: 'cyklotrenazer', extra: true, cat: 'Rotopedy a cyklotrenažery', name: 'Cyklotrenažer',
    feats: ['Trénujete na vlastním kole – žádné zvykání na jiný posed', 'Plynulé řazení – využíváte vlastní přehazovačku jako venku', 'Kompaktní a skladný – po tréninku trenažér snadno uklidíte', 'Snadná přeprava – pohodlně se vejde do každého auta'],
    p: [400, 600, 900, 1200], dep: 2000, ship: 300
  },
  {
    id: 'pb', slug: 'paddleboard', extra: true, cat: 'Paddleboardy', name: 'Paddleboard vč. pádla a pumpy',
    feats: ['Nafukovací – v ceně pumpa, pádlo a batoh', 'Sbalený váží cca 15 kg – odvezete ho klidně i tramvají', 'Zapojí svaly celého těla a zlepší rovnováhu', 'Techniku zvládnete hravě vy i vaše děti'],
    p: [800, 1400, 1900, 2400], dep: 4000, ship: 400, paddle: true
  }
];

export const PAD_PRICES = [50, 100, 150, 200]; // tlumicí podložka podle délky pronájmu
export const MAT_PRICE = 100; // ochranná podložka

export const CITIES = [
  { name: 'Brno', addr: 'Táborská 123, Brno-Židenice', note: 'Parkování ve dvoře – opatrně, úzký vjezd', phone: '+420 774 860 054' },
  { name: 'Olomouc', addr: 'Chválkovická 151/82', note: 'Areál bývalé Akumy, naproti silu, vstup z boku budovy', phone: '+420 774 860 054' },
  { name: 'Ostrava', addr: 'Tichá 1, Ostrava-Svinov', note: 'Areál Jelínek, naproti nádraží Svinov', phone: '+420 774 860 054' },
  { name: 'Jihlava', addr: 'Na Hranici 14, Jihlava-Bedřichov', note: 'Areál Stavby Zelený', phone: '+420 774 860 054' },
  { name: 'Liberec', addr: 'Olbrachtova 618/37, Liberec-Starý Harcov', note: 'OC Luna', phone: '+420 731 405 548' },
  { name: 'Zlín', addr: 'Třída Tomáše Bati 283', note: 'Areál Zliner', phone: '+420 703 953 470' }
];

export const ZONES = [
  { city: 'Brno', area: 'Brno-město, Jinačovice, Modřice, Moravany, Ostopovice, Rozdrojovice, Šlapanice' },
  { city: 'Ostrava', area: 'Ostrava' },
  { city: 'Olomouc', area: 'Olomouc' },
  { city: 'Jihlava', area: 'Jihlava' },
  { city: 'Liberec', area: 'Liberec, Jablonec, Stráž nad Nisou' },
  { city: 'Zlín', area: 'Zlín, Otrokovice, Napajedla, Bohuslavice u Zlína, Lípa, Fryšták, Mysločovice' }
];

export function durationLabel(product, i) {
  if (i === LONG) return 'delší doba';
  return (product && product.paddle ? PADDLE_DURATIONS : DURATIONS)[i];
}

export const isDuration = (i) => Number.isInteger(i) && i >= 0 && i <= LONG;

/** Souhrn objednávky — stejný výpočet na webu i v e-mailu. U „Delší doby“ je půjčovné (a tím i celkem) null = dohodou. */
export function priceOrder({ product, duration, delivery, pad, mat }) {
  const sel = PRODUCTS.find((p) => p.id === product);
  const long = duration === LONG;
  const rent = !sel ? 0 : long ? null : sel.p[duration];
  const padPrice = !pad ? 0 : long ? null : PAD_PRICES[duration];
  const matPrice = mat ? MAT_PRICE : 0;
  const ship = delivery && sel ? sel.ship : 0;
  const total = rent === null || padPrice === null ? null : rent + padPrice + matPrice + ship;
  return { product: sel, rent, pad: padPrice, mat: matPrice, ship, total, deposit: sel ? sel.dep : 0 };
}

export const fmt = (n) => n.toLocaleString('cs-CZ').replace(/ /g, ' ');
/** cena s „Kč“, null → „dohodou“ */
export const fmtPrice = (n) => (n === null ? 'dohodou' : `${fmt(n)} Kč`);
