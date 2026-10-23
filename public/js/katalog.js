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

// ---------- překlady (cs je výchozí v datech výše) ----------

export const LANGS = ['cs', 'en', 'de'];

const TR = {
  en: {
    durations: ['2 weeks', '4 weeks', '6 weeks', '8 weeks'],
    paddle: ['weekend (Thu–Mon)', 'week', '10 days', '14 days'],
    long: 'Longer period', longLower: 'longer period', onRequest: 'on request', cur: 'CZK',
    products: {
      rm: { cat: 'Exercise bikes & bike trainers', name: 'Magnetic exercise bike', feats: ['Suitable for rehabilitation – stable and gentle on the joints', 'Quiet – won’t disturb the neighbours or your TV', 'No power socket needed – place it anywhere', 'Delivered assembled and adjusted – no assembly needed'] },
      re: { cat: 'Exercise bikes & bike trainers', name: 'Electronic exercise bike', feats: ['Training programmes – automatic resistance for weight loss and fitness', 'Precise resistance control – ideal for guided rehabilitation', 'Maximum comfort – quiet, clear display and push-button control', 'Delivered assembled and ready – just plug it in'] },
      bp: { cat: 'Treadmills', name: 'Electric treadmill', feats: ['Stable – min. 120 kg load capacity, 40+ cm running surface', 'Folding frame – saves space after training', 'Delivered assembled and adjusted – no assembly needed', 'Delivery available – carried right into your flat'] },
      vt: { cat: 'Rowing machines', name: 'Rowing machine', feats: ['Full-body workout – legs, back, arms and core', 'Folding frame – easy to fold away after training', 'Delivered assembled and adjusted – no assembly needed', 'Easy to handle – fits in a car and in any room'] },
      sk: { cat: 'Exercise bikes & bike trainers', name: 'Spinning bike', feats: ['Very stable – solid frame even when riding standing up', 'Heavy flywheel – smooth ride even at high resistance', 'Fully adjustable – saddle and handlebars set in seconds', 'No assembly – delivered assembled and adjusted'] },
      om: { cat: 'Cross trainers', name: 'Magnetic cross trainer (elliptical)', feats: ['Effective training – high energy burn that helps you lose fat', 'Full-body workout – legs, glutes, arms and core', 'Quiet – smooth motion that won’t disturb the household', 'Transport wheels – easy to move after training'] },
      oe: { cat: 'Cross trainers', name: 'Electronic cross trainer (elliptical)', feats: ['Effective training – high energy burn that helps you lose fat', 'Full-body workout – legs, glutes, arms and core', 'Smooth motion – no hard impact like when running', 'Transport wheels – easy to move after training'] },
      bo: { cat: 'Bosu', name: 'Bosu', feats: ['Improves body stability and balance', 'Strengthens the deep stabilising muscles', 'Originally an aid for rehabilitation centres', 'At home or in the office – e.g. to prevent back pain'] },
      ct: { cat: 'Exercise bikes & bike trainers', name: 'Bike trainer', feats: ['Train on your own bike – no getting used to a different position', 'Smooth shifting – use your own derailleur just like outdoors', 'Compact – easy to put away after training', 'Easy to transport – fits in any car'] },
      pb: { cat: 'Paddleboards', name: 'Paddleboard incl. paddle and pump', feats: ['Inflatable – pump, paddle and backpack included', 'Packed weight approx. 15 kg – you can even take it on the tram', 'Works the whole body and improves balance', 'Easy to learn for you and your kids'] }
    },
    cityNotes: {
      Brno: 'Courtyard parking – careful, narrow entrance',
      Olomouc: 'Former Akuma site, opposite the silo, side entrance',
      Ostrava: 'Jelínek site, opposite Svinov railway station',
      Jihlava: 'Stavby Zelený site',
      Liberec: 'Luna shopping centre',
      Zlín: 'Zliner site'
    }
  },
  de: {
    durations: ['2 Wochen', '4 Wochen', '6 Wochen', '8 Wochen'],
    paddle: ['Wochenende (Do–Mo)', 'Woche', '10 Tage', '14 Tage'],
    long: 'Längere Dauer', longLower: 'längere Dauer', onRequest: 'auf Anfrage', cur: 'CZK',
    products: {
      rm: { cat: 'Heimtrainer & Rollentrainer', name: 'Magnet-Heimtrainer', feats: ['Für die Reha geeignet – stabil und gelenkschonend', 'Leise – stört weder Nachbarn noch Fernsehen', 'Kein Stromanschluss nötig – überall aufstellbar', 'Montiert und eingestellt geliefert – kein Aufbau nötig'] },
      re: { cat: 'Heimtrainer & Rollentrainer', name: 'Elektronischer Heimtrainer', feats: ['Trainingsprogramme – automatischer Widerstand zum Abnehmen und für die Kondition', 'Genaue Widerstandssteuerung – ideal für eine gezielte Reha', 'Maximaler Komfort – leise, übersichtliches Display, Tastenbedienung', 'Montiert und startklar geliefert – einfach einstecken'] },
      bp: { cat: 'Laufbänder', name: 'Elektrisches Laufband', feats: ['Stabil – Belastbarkeit mind. 120 kg, Lauffläche 40+ cm', 'Klappbar – spart nach dem Training Platz', 'Montiert und eingestellt geliefert – kein Aufbau nötig', 'Lieferung möglich – bis in die Wohnung getragen'] },
      vt: { cat: 'Rudergeräte', name: 'Rudergerät', feats: ['Ganzkörpertraining – Beine, Rücken, Arme und Bauch', 'Klappbar – nach dem Training einfach zusammenklappen', 'Montiert und eingestellt geliefert – kein Aufbau nötig', 'Leicht zu handhaben – passt ins Auto und in jedes Zimmer'] },
      sk: { cat: 'Heimtrainer & Rollentrainer', name: 'Spinning-Bike', feats: ['Sehr stabil – fester Rahmen auch im Wiegetritt', 'Schweres Schwungrad – ruhiger Lauf auch bei hohem Widerstand', 'Individuell einstellbar – Sattel und Lenker in Sekunden', 'Kein Aufbau – montiert und eingestellt geliefert'] },
      om: { cat: 'Crosstrainer', name: 'Magnet-Crosstrainer (Ellipsentrainer)', feats: ['Effektives Training – hoher Kalorienverbrauch, unterstützt die Fettverbrennung', 'Ganzkörpertraining – Beine, Po, Arme und Bauch', 'Leise – fließende Bewegung, die niemanden stört', 'Transportrollen – nach dem Training leicht zu verschieben'] },
      oe: { cat: 'Crosstrainer', name: 'Elektronischer Crosstrainer (Ellipsentrainer)', feats: ['Effektives Training – hoher Kalorienverbrauch, unterstützt die Fettverbrennung', 'Ganzkörpertraining – Beine, Po, Arme und Bauch', 'Fließende Bewegung – keine harten Stöße wie beim Laufen', 'Transportrollen – nach dem Training leicht zu verschieben'] },
      bo: { cat: 'Bosu', name: 'Bosu', feats: ['Verbessert Stabilität und Gleichgewicht', 'Stärkt die tiefe Stabilisationsmuskulatur', 'Ursprünglich ein Hilfsmittel für Reha-Zentren', 'Zu Hause oder im Büro – z. B. gegen Rückenschmerzen'] },
      ct: { cat: 'Heimtrainer & Rollentrainer', name: 'Rollentrainer', feats: ['Training auf dem eigenen Rad – keine Umgewöhnung an eine andere Sitzposition', 'Fließendes Schalten – mit Ihrer eigenen Schaltung wie draußen', 'Kompakt – nach dem Training schnell verstaut', 'Leicht zu transportieren – passt in jedes Auto'] },
      pb: { cat: 'Paddleboards', name: 'Paddleboard inkl. Paddel und Pumpe', feats: ['Aufblasbar – Pumpe, Paddel und Rucksack inklusive', 'Verpackt ca. 15 kg – passt sogar in die Straßenbahn', 'Trainiert den ganzen Körper und das Gleichgewicht', 'Leicht zu lernen – für Sie und Ihre Kinder'] }
    },
    cityNotes: {
      Brno: 'Parken im Hof – Vorsicht, enge Einfahrt',
      Olomouc: 'Ehemaliges Akuma-Gelände, gegenüber dem Silo, Eingang seitlich',
      Ostrava: 'Gelände Jelínek, gegenüber dem Bahnhof Svinov',
      Jihlava: 'Gelände Stavby Zelený',
      Liberec: 'Einkaufszentrum Luna',
      Zlín: 'Gelände Zliner'
    }
  }
};

const tr = (lang) => TR[lang] || null;

/** Stroj s přeloženým názvem, kategorií a výhodami (cs = beze změny). */
export function localize(product, lang = 'cs') {
  const t = tr(lang)?.products[product.id];
  return t ? { ...product, ...t } : product;
}

export function cityNote(city, lang = 'cs') {
  return tr(lang)?.cityNotes[city.name] || city.note;
}

export function durationNames(lang = 'cs', paddle = false) {
  const t = tr(lang);
  if (paddle) return t ? t.paddle : PADDLE_DURATIONS;
  return t ? t.durations : DURATIONS;
}

export const longLabel = (lang = 'cs') => tr(lang)?.long || LONG_LABEL;

export function durationLabel(product, i, lang = 'cs') {
  if (i === LONG) return tr(lang)?.longLower || 'delší doba';
  return durationNames(lang, product && product.paddle)[i];
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
/** cena s měnou („Kč“, v cizích jazycích „CZK“), null → „dohodou“ */
export const fmtPrice = (n, lang = 'cs') => (n === null ? (tr(lang)?.onRequest || 'dohodou') : `${fmt(n)} ${tr(lang)?.cur || 'Kč'}`);
