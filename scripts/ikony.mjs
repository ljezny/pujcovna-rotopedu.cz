/**
 * Půjčovna rotopedů — jednoduché inline SVG ikony pro detail stroje (24×24, obrys, barva = currentColor).
 * Ikona se k bodu popisu vybírá podle klíčových slov v jeho nadpisu (iconFor).
 */

const PATHS = {
  truck: '<path d="M2 6h11v10H2z"/><path d="M13 9h4l4 4v3h-8z"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  quiet: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9.5l4 5M21 9.5l-4 5"/>',
  plug: '<path d="M9 2v5M15 2v5"/><path d="M6 7h12v4a6 6 0 0 1-12 0z"/><path d="M12 17v5"/>',
  monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  gauge: '<path d="M4 16a8 8 0 1 1 16 0"/><path d="M12 16l4-5"/><circle cx="12" cy="16" r="1"/>',
  sliders: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  flame: '<path d="M12 22c3.9 0 7-2.9 7-6.8 0-4.7-4.5-7-5.5-12.2-2.8 1.9-4.6 4.6-4.6 7.7-.9-.8-1.6-1.8-1.9-3.4C5.3 9.2 5 11.6 5 15.2 5 19.1 8.1 22 12 22z"/>',
  body: '<circle cx="12" cy="4.5" r="2"/><path d="M5 9l7 1 7-1M12 10v5l-3 7M12 15l3 7"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/>',
  move: '<path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/>',
  shield: '<path d="M12 3l8 3v6c0 4.8-3.4 8-8 9-4.6-1-8-4.2-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  mountain: '<path d="M3 20l6.5-11 4 6.5 2.5-4L21 20z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  bike: '<circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="M6 16l4-8h5l3 8M9 5h3"/>',
  wallet: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M16 14.5h2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.8 10.6c.6.6.8 1.3.8 2.4h6c0-1.1.2-1.8.8-2.4A6 6 0 0 0 12 3z"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  pin: '<path d="M12 21s7-6.1 7-12a7 7 0 0 0-14 0c0 5.9 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  wave: '<path d="M2 10c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 16c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  ruler: '<rect x="2" y="8" width="20" height="8" rx="1"/><path d="M6 8v3M10 8v4M14 8v3M18 8v4"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.5L16 9.5"/>'
};

/** pořadí rozhoduje — první shoda vyhrává */
const RULES = [
  [/doprav|převoz|přeprav|odvoz|auta|auto\b/, 'truck'],
  [/tich|hluč/, 'quiet'],
  [/zásuv|napájen|elektř/, 'plug'],
  [/program|displej|trenér|panel|přehled/, 'monitor'],
  [/zátěž|odpor|setrvačník|intenzit/, 'gauge'],
  [/nastaven|na míru|ergonomi|převod|řazen/, 'sliders'],
  [/spal|kalori|hubn|energi/, 'flame'],
  [/celé tělo|celého těla|sval|zapojen|stabilizační/, 'body'],
  [/klou|rehab|plynul|šetří/, 'heart'],
  [/sklád|sklápě|skladn|kompakt|manipul|dveř/, 'move'],
  [/stabil|bezpeč|nosnost|pevn|rovnováh/, 'shield'],
  [/kopec|sklon/, 'mountain'],
  [/zim|počasí|such/, 'calendar'],
  [/investic|cen[aěu]|levn|vůli|zkouš|věšák/, 'wallet'],
  [/rozměr|hmotnost/, 'ruler'],
  [/podlah|plášť/, 'shield'],
  [/poradíme|poraď/, 'chat'],
  [/vod[aně]|paddle|plav/, 'wave'],
  [/zvládne/, 'star'],
  [/tip/, 'bulb'],
  [/praktick|logistik/, 'truck']
];

export function iconFor(text) {
  const t = String(text).toLowerCase();
  const rule = RULES.find(([re]) => re.test(t));
  return rule ? rule[1] : 'check';
}

export function icon(name, cls = 'ico') {
  return `<svg class="${cls}" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name] || PATHS.check}</svg>`;
}
