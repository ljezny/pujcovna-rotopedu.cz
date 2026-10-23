/* Půjčovna rotopedů — ceník, souhrn a objednávkový formulář.
   Běží na úvodní stránce i na detailech strojů (public/produkt/*) — sekce, které stránka nemá, se přeskočí. */
import {
  DURATIONS, DEFAULT_DURATION, PRODUCTS, PAD_PRICES, CITIES, ZONES,
  durationLabel, priceOrder, fmt
} from './katalog.js';
import { obrazek } from './obrazky.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const state = { duration: DEFAULT_DURATION, mode: 'pickup' };
const form = $('#order-form');
const fill = (sel, html) => { const el = $(sel); if (el) el.innerHTML = html; };

// ---------- statický obsah z katalogu ----------

fill('[data-products]', PRODUCTS.map((p) => `
  <article class="product${p.extra ? ' product--extra' : ''}">
    <a href="/produkt/${p.slug}" class="product__img${p.scene ? ' product__img--scene' : ''}"><img src="${obrazek(`stroje/${p.img || p.id}.jpg`)}" alt="${esc(p.name)}" loading="lazy" width="700" height="700"></a>
    <div class="product__body">
      <span class="product__cat">${esc(p.cat)}</span>
      <h3 class="product__name" style="margin:0"><a href="/produkt/${p.slug}">${esc(p.name)}</a></h3>
      <ul class="product__feats">${p.feats.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
      <div class="product__price"><strong><span data-price="${p.id}"></span> Kč</strong><span>za <span data-per="${p.id}"></span></span></div>
      <span class="product__dep">Vratná záloha ${fmt(p.dep)} Kč</span>
      <div class="product__actions">
        <button type="button" class="btn btn--outline btn--sm" data-pick="${p.id}">Objednat</button>
        <a href="/produkt/${p.slug}" class="product__more">Více informací</a>
      </div>
    </div>
  </article>`).join(''));

fill('[data-zones]', ZONES.map((z) => `<div class="zone"><strong>${esc(z.city)}</strong><span>${esc(z.area)}</span></div>`).join(''));

fill('[data-branches]', CITIES.map((c) => `
  <div class="branch"><strong>${esc(c.name)}</strong><span>${esc(c.addr)}</span><small>${esc(c.note)}</small>
    <a class="branch__tel" href="tel:${c.phone.replace(/\s+/g, '')}">${esc(c.phone)}</a></div>`).join(''));

$('[data-product-select]').insertAdjacentHTML('beforeend',
  PRODUCTS.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join(''));
$('[data-city-select]').innerHTML = CITIES.map((c) => `<option>${esc(c.name)}</option>`).join('');

fill('[data-durations]', DURATIONS.map((d, i) => `<button type="button" data-dur="${i}">${d}</button>`).join(''));
$('[data-form-durations]').innerHTML = DURATIONS.map((_, i) => `<button type="button" class="choice" data-dur="${i}"></button>`).join('');

$('[data-date]').min = new Date().toISOString().slice(0, 10);

// detail stroje: formulář má předvyplněný stroj
if (form.dataset.preselect) form.product.value = form.dataset.preselect;

// detail stroje: text tlačítka „další informace“ podle stavu
$$('details.more').forEach((d) => d.addEventListener('toggle', () => {
  $('[data-more-label]', d).textContent = d.open ? 'Skrýt další informace' : 'Zobrazit další informace';
}));

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
    const price = $(`[data-price="${p.id}"]`);
    if (!price) return;
    price.textContent = fmt(p.p[d]);
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

  const thumb = e.target.closest('[data-gallery-thumb]');
  if (thumb) {
    $('[data-gallery-main]').src = thumb.dataset.galleryThumb;
    $$('[data-gallery-thumb]').forEach((b) => (b === thumb ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
    return;
  }

  const moreProducts = e.target.closest('[data-more-products]');
  if (moreProducts) {
    $('[data-products]').classList.add('is-open');
    moreProducts.hidden = true;
    return;
  }

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
  if (form.dataset.preselect) form.product.value = form.dataset.preselect;
  state.mode = 'pickup';
  form.hidden = false;
  $('[data-thanks]').hidden = true;
  render();
});

render();
