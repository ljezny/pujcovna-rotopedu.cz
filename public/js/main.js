/* Půjčovna rotopedů — ceník, souhrn a objednávkový formulář */
import {
  DURATIONS, DEFAULT_DURATION, PRODUCTS, PAD_PRICES, CITIES, ZONES,
  durationLabel, priceOrder, fmt
} from './katalog.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const state = { duration: DEFAULT_DURATION, mode: 'pickup' };
const form = $('#order-form');

// ---------- statický obsah z katalogu ----------

$('[data-products]').innerHTML = PRODUCTS.map((p) => `
  <article class="product">
    <div class="product__img${p.scene ? ' product__img--scene' : ''}"><img src="/images/stroje/${p.img || p.id}.jpg" alt="${esc(p.name)}" loading="lazy" width="700" height="700"></div>
    <div class="product__body">
      <span class="product__cat">${esc(p.cat)}</span>
      <h3 class="product__name" style="margin:0">${esc(p.name)}</h3>
      <span class="product__sub">${esc(p.sub)}</span>
      <div class="product__price"><strong><span data-price="${p.id}"></span> Kč</strong><span>za <span data-per="${p.id}"></span></span></div>
      <span class="product__dep">Vratná záloha ${fmt(p.dep)} Kč</span>
      <button type="button" class="btn btn--outline btn--sm" data-pick="${p.id}">Objednat</button>
    </div>
  </article>`).join('');

$('[data-zones]').innerHTML = ZONES.map((z) => `<div class="zone"><strong>${esc(z.city)}</strong><span>${esc(z.area)}</span></div>`).join('');

$('[data-branches]').innerHTML = CITIES.map((c) => `
  <div class="branch"><strong>${esc(c.name)}</strong><span>${esc(c.addr)}</span><small>${esc(c.note)}</small></div>`).join('');

$('[data-product-select]').insertAdjacentHTML('beforeend',
  PRODUCTS.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join(''));
$('[data-city-select]').innerHTML = CITIES.map((c) => `<option>${esc(c.name)}</option>`).join('');

$('[data-durations]').innerHTML = DURATIONS.map((d, i) => `<button type="button" data-dur="${i}">${d}</button>`).join('');
$('[data-form-durations]').innerHTML = DURATIONS.map((_, i) => `<button type="button" class="choice" data-dur="${i}"></button>`).join('');

$('[data-date]').min = new Date().toISOString().slice(0, 10);

// ---------- překreslení podle stavu ----------

function selectedProduct() {
  return PRODUCTS.find((p) => p.id === form.product.value);
}

function render() {
  const d = state.duration;
  const sel = selectedProduct();

  $$('[data-dur]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.dur) === d)));
  $$('[data-form-durations] [data-dur]').forEach((b) => { b.textContent = durationLabel(sel, Number(b.dataset.dur)); });

  PRODUCTS.forEach((p) => {
    $(`[data-price="${p.id}"]`).textContent = fmt(p.p[d]);
    $(`[data-per="${p.id}"]`).textContent = durationLabel(p, d);
  });
  $$('[data-pad-price]').forEach((el) => { el.textContent = fmt(PAD_PRICES[d]); });

  $$('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === state.mode)));
  $('[data-address]').hidden = state.mode !== 'delivery';

  const sum = priceOrder({
    product: form.product.value, duration: d, delivery: state.mode === 'delivery',
    pad: form.pad.checked, mat: form.mat.checked
  });
  $('[data-sum="label"]').textContent = sel ? `${sel.name}, ${durationLabel(sel, d)}` : `Vyberte stroj · ${DURATIONS[d]}`;
  $('[data-sum="rent"]').textContent = fmt(sum.rent);
  $('[data-sum="pad"]').textContent = fmt(sum.pad);
  $('[data-sum="mat"]').textContent = fmt(sum.mat);
  $('[data-sum="ship"]').textContent = fmt(sum.ship);
  $('[data-sum="total"]').textContent = fmt(sum.total);
  $('[data-sum="dep"]').textContent = sel ? fmt(sum.deposit) : '–';
  $('[data-sum-row="pad"]').hidden = !form.pad.checked;
  $('[data-sum-row="mat"]').hidden = !form.mat.checked;
  $('[data-sum-row="ship"]').hidden = sum.ship === 0;
}

function showError(msg) {
  const el = $('[data-error]');
  el.textContent = msg || '';
  el.hidden = !msg;
}

// ---------- události ----------

document.addEventListener('click', (e) => {
  const dur = e.target.closest('[data-dur]');
  if (dur) { state.duration = Number(dur.dataset.dur); render(); return; }

  const mode = e.target.closest('[data-mode]');
  if (mode) { state.mode = mode.dataset.mode; showError(''); render(); return; }

  const pick = e.target.closest('[data-pick]');
  if (pick) {
    form.product.value = pick.dataset.pick;
    showError('');
    render();
    $('#objednavka').scrollIntoView({ behavior: 'smooth' });
    window.gtag && window.gtag('event', 'select_item', { items: [{ item_id: pick.dataset.pick }] });
  }
});

form.addEventListener('input', () => { showError(''); render(); });
form.addEventListener('change', render);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = form.elements;
  if (!f.product.value) return showError('Vyberte prosím stroj.');
  if (!f.name.value.trim() || !f.phone.value.trim()) return showError('Vyplňte prosím jméno a telefon.');
  if (state.mode === 'delivery' && !f.address.value.trim()) return showError('Vyplňte prosím adresu doručení.');
  if (f.email.value.trim() && !f.email.checkValidity()) return showError('Zkontrolujte prosím e-mail.');

  const data = {
    product: f.product.value,
    duration: state.duration,
    city: f.city.value,
    date: f.date.value,
    delivery: state.mode === 'delivery',
    address: state.mode === 'delivery' ? f.address.value : '',
    name: f.name.value,
    phone: f.phone.value,
    email: f.email.value,
    note: f.note.value,
    pad: f.pad.checked,
    mat: f.mat.checked,
    website: f.website.value
  };

  const btn = form.querySelector('button[type=submit]');
  btn.disabled = true;
  btn.textContent = 'Odesílám…';
  try {
    const res = await fetch('/api/poptavka', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.ok) throw new Error(body.error || 'Odeslání se nepovedlo. Zkuste to prosím znovu, nebo volejte +420 774 860 054.');

    const sum = priceOrder({ ...data, duration: state.duration });
    window.gtag && window.gtag('event', 'generate_lead', { currency: 'CZK', value: sum.total, item_id: data.product });

    $('[data-thanks-name]').textContent = data.name.trim();
    $('[data-thanks-phone]').textContent = data.phone.trim();
    form.hidden = true;
    $('[data-thanks]').hidden = false;
  } catch (err) {
    showError(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Odeslat objednávku';
  }
});

$('[data-reset]').addEventListener('click', () => {
  form.reset();
  state.mode = 'pickup';
  form.hidden = false;
  $('[data-thanks]').hidden = true;
  render();
});

render();
