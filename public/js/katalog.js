/* Půjčovna rotopedů — katalog strojů, ceny a pobočky.
   Sdílí ho stránka (public/js/main.js) i server (lib/poptavka.js), aby cena v e-mailu seděla s webem. */

export const DURATIONS = ['2 týdny', '4 týdny', '6 týdnů', '8 týdnů'];
export const PADDLE_DURATIONS = ['víkend', 'týden', '10 dní', '14 dní'];
export const DEFAULT_DURATION = 1;

/* scene = fotka v interiéru (v kartě přes celou plochu), jinak produktovka na bílém
   p = cena za DURATIONS[i] (u paddleboardu PADDLE_DURATIONS[i]), dep = vratná záloha, ship = doprava jedna cesta */
export const PRODUCTS = [
  { id: 'rm', scene: true, cat: 'Rotopedy', name: 'Rotoped magnetický', sub: 'Tichý chod, bez zásuvky. Stabilní a šetrný ke kloubům.', p: [600, 800, 1200, 1600], dep: 3000, ship: 300 },
  { id: 're', cat: 'Rotopedy', name: 'Rotoped elektronický', sub: 'Cvičební programy pro výkonnostní trénink.', p: [900, 1200, 1800, 2400], dep: 4000, ship: 300 },
  { id: 'om', cat: 'Orbitreky', name: 'Orbitrek magnetický', sub: 'Eliptický trenažer, pohyb celého těla.', p: [900, 1200, 1800, 2400], dep: 4000, ship: 400 },
  { id: 'oe', img: 'om', cat: 'Orbitreky', name: 'Orbitrek elektronický', sub: 'Eliptický trenažer s programy.', p: [1000, 1400, 2100, 2800], dep: 4000, ship: 400 },
  { id: 'vt', cat: 'Veslování', name: 'Veslovací trenažer', sub: 'Posílí záda, nohy i paže najednou.', p: [1000, 1400, 2100, 2800], dep: 4000, ship: 400 },
  { id: 'bp', cat: 'Běžecké pásy', name: 'Běžecký pás', sub: 'Elektronický. Chůze i běh za každého počasí.', p: [1600, 2200, 3300, 4400], dep: 5000, ship: 400 },
  { id: 'sk', cat: 'Rotopedy', name: 'Spinningové kolo', sub: 'Pro intenzivní a sportovní trénink.', p: [1200, 1600, 2400, 3200], dep: 4000, ship: 400 },
  { id: 'ct', cat: 'Rotopedy', name: 'Cyklotrenažer', sub: 'Trenažer pro vaše vlastní kolo.', p: [400, 600, 900, 1200], dep: 2000, ship: 300 },
  { id: 'bo', cat: 'Balanční', name: 'Bosu', sub: 'Balanční podložka na posilování a rehabilitaci.', p: [300, 500, 700, 900], dep: 1000, ship: 300 },
  { id: 'pb', cat: 'Voda', name: 'Paddleboard', sub: 'Nafukovací, včetně pádla a pumpy.', p: [800, 1400, 1900, 2400], dep: 4000, ship: 400, paddle: true }
];

export const PAD_PRICES = [50, 100, 150, 200]; // tlumicí podložka podle délky pronájmu
export const MAT_PRICE = 100; // ochranná podložka

export const CITIES = [
  { name: 'Brno', addr: 'Táborská 123, Židenice', note: 'Výdejní sklad' },
  { name: 'Ostrava', addr: 'Tichá 1', note: 'Areál bývalé Jelínek, naproti nádraží Svinov' },
  { name: 'Olomouc', addr: 'Chválkovická 151/82', note: 'Areál bývalé Akumy, naproti silu' },
  { name: 'Jihlava', addr: 'Na Hranici 14', note: 'Areál Stavby Zelený' },
  { name: 'Liberec', addr: 'Olbrachtova 37', note: 'OC Luna' },
  { name: 'Zlín', addr: 'Třída Tomáše Bati 283', note: 'Areál Zliner' }
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
  return (product && product.paddle ? PADDLE_DURATIONS : DURATIONS)[i];
}

/** Souhrn objednávky — stejný výpočet na webu i v e-mailu. */
export function priceOrder({ product, duration, delivery, pad, mat }) {
  const sel = PRODUCTS.find((p) => p.id === product);
  const rent = sel ? sel.p[duration] : 0;
  const padPrice = pad ? PAD_PRICES[duration] : 0;
  const matPrice = mat ? MAT_PRICE : 0;
  const ship = delivery && sel ? sel.ship : 0;
  return { product: sel, rent, pad: padPrice, mat: matPrice, ship, total: rent + padPrice + matPrice + ship, deposit: sel ? sel.dep : 0 };
}

export const fmt = (n) => n.toLocaleString('cs-CZ').replace(/ /g, ' ');
