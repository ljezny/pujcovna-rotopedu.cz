/* Půjčovna rotopedů — Google Analytics 4 + Google Ads (stejná ID jako původní web).
   Měření běží rovnou (bez cookie lišty, stejně jako beharna.cz); návštěvník ho může vypnout
   odkazem s atributem data-cookie-settings (opt-out uložený v prohlížeči). */
(function () {
  'use strict';

  var GA_ID = 'G-8523CEM02H';
  var ADS_ID = 'AW-16848333244';
  var KEY = 'pujcovna-consent'; // 'denied' = měření vypnuté, jinak zapnuté

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  });

  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* bez úložiště se lišta jen zobrazí znovu */ } }

  var loaded = false;
  function loadGa() {
    if (loaded) return;
    loaded = true;
    gtag('consent', 'update', { analytics_storage: 'granted' });
    gtag('js', new Date());
    gtag('config', GA_ID);
    gtag('config', ADS_ID);
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }

  function removeTrackingCookies() {
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (/^(_ga|_gcl)/.test(name)) {
        ['', '; domain=.' + location.hostname, '; domain=' + location.hostname].forEach(function (d) {
          document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + d;
        });
      }
    });
  }

  var bar;
  function showBar() {
    if (bar) { bar.hidden = false; return; }
    bar = document.createElement('div');
    bar.className = 'cookies';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Souhlas s cookies');
    bar.innerHTML =
      '<p class="cookies__text">Návštěvnost webu a účinnost reklam měříme přes Google Analytics a Google Ads, které k tomu používají cookies. ' +
      'Pokud nechcete, aby se Vaše návštěva měřila, můžete měření vypnout. ' +
      '<a href="/ochrana-osobnich-udaju#cookies">Více informací</a></p>' +
      '<div class="cookies__btns">' +
      '<button type="button" class="cookies__deny">Vypnout měření</button>' +
      '<button type="button" class="cookies__ok">Nechat zapnuté</button>' +
      '</div>';
    document.body.appendChild(bar);
    bar.querySelector('.cookies__ok').addEventListener('click', function () {
      write('granted'); bar.hidden = true; loadGa();
    });
    bar.querySelector('.cookies__deny').addEventListener('click', function () {
      write('denied'); bar.hidden = true; removeTrackingCookies();
      if (loaded) location.reload(); // už načtený gtag zastaví jen nové načtení stránky
    });
  }

  if (read() !== 'denied') loadGa();

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-cookie-settings]').forEach(function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); showBar(); });
    });
  });
})();
