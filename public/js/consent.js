/* Půjčovna rotopedů — měření stejně jako na původním webu www.pujcovna-rotopedu.cz:
   Google Analytics 4 + Google Ads (gtag), Google Tag Manager, 3× Meta Pixel, retargeting Seznam (Sklik).
   Měření běží rovnou (bez cookie lišty, stejně jako beharna.cz); návštěvník ho může vypnout
   odkazem s atributem data-cookie-settings (opt-out uložený v prohlížeči). */
(function () {
  'use strict';

  var GA_ID = 'G-8523CEM02H';
  var ADS_ID = 'AW-16848333244';
  var GTM_ID = 'GTM-NQ4M6RKD';
  var PIXEL_IDS = ['763845957713706', '1576770476026952', '239999245211871'];
  var SEZNAM_RTG_ID = 1150011;
  var KEY = 'pujcovna-consent'; // 'denied' = měření vypnuté, jinak zapnuté

  var LANG = (document.documentElement.lang || 'cs').slice(0, 2);
  var TEXTS = {
    cs: {
      label: 'Souhlas s cookies',
      text: 'Návštěvnost webu a účinnost reklam měříme přes Google Analytics, Google Ads, Meta Pixel a Seznam, které k tomu používají cookies. Pokud nechcete, aby se Vaše návštěva měřila, můžete měření vypnout.',
      more: 'Více informací', deny: 'Vypnout měření', ok: 'Nechat zapnuté'
    },
    en: {
      label: 'Cookie consent',
      text: 'We measure website traffic and ad performance with Google Analytics, Google Ads, Meta Pixel and Seznam, which use cookies. If you do not want your visit to be measured, you can turn measurement off.',
      more: 'More information', deny: 'Turn off measurement', ok: 'Keep it on'
    },
    de: {
      label: 'Cookie-Einwilligung',
      text: 'Wir messen die Besucherzahlen und die Wirkung unserer Werbung mit Google Analytics, Google Ads, Meta Pixel und Seznam, die dafür Cookies verwenden. Wenn Sie nicht möchten, dass Ihr Besuch gemessen wird, können Sie die Messung ausschalten.',
      more: 'Mehr Informationen', deny: 'Messung ausschalten', ok: 'Eingeschaltet lassen'
    }
  };
  var T = TEXTS[LANG] || TEXTS.cs;

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

  function script(src) {
    var s = document.createElement('script');
    s.async = true;
    s.src = src;
    document.head.appendChild(s);
    return s;
  }

  function loadGoogle() {
    gtag('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted'
    });
    gtag('js', new Date());
    gtag('config', GA_ID);
    gtag('config', ADS_ID);
    script('https://www.googletagmanager.com/gtag/js?id=' + GA_ID);
    // Google Tag Manager — stejný kontejner jako původní web
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    script('https://www.googletagmanager.com/gtm.js?id=' + GTM_ID);
  }

  function loadPixels() {
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    PIXEL_IDS.forEach(function (id) { fbq('init', id); });
    fbq('track', 'PageView');
  }

  function loadSeznam() {
    script('https://c.seznam.cz/js/rc.js').onload = function () {
      if (window.rc && window.rc.retargetingHit) window.rc.retargetingHit({ rtgId: SEZNAM_RTG_ID });
    };
  }

  var loaded = false;
  function loadAll() {
    if (loaded) return;
    loaded = true;
    loadGoogle();
    loadPixels();
    loadSeznam();
  }

  /** Odeslaná objednávka — konverze do GA/Ads (přes gtag) i do Meta Pixelů. Volá js/main.js. */
  window.trackLead = function (value, itemId) {
    if (!loaded) return;
    gtag('event', 'generate_lead', { currency: 'CZK', value: value || 0, item_id: itemId });
    if (window.fbq) fbq('track', 'Lead', { currency: 'CZK', value: value || 0, content_ids: [itemId] });
  };

  function removeTrackingCookies() {
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (/^(_ga|_gcl|_fbp|_fbc|sid|_sklik)/.test(name)) {
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
    bar.setAttribute('aria-label', T.label);
    bar.innerHTML =
      '<p class="cookies__text">' + T.text + ' ' +
      '<a href="/ochrana-osobnich-udaju#cookies">' + T.more + '</a></p>' +
      '<div class="cookies__btns">' +
      '<button type="button" class="cookies__deny">' + T.deny + '</button>' +
      '<button type="button" class="cookies__ok">' + T.ok + '</button>' +
      '</div>';
    document.body.appendChild(bar);
    bar.querySelector('.cookies__ok').addEventListener('click', function () {
      write('granted'); bar.hidden = true; loadAll();
    });
    bar.querySelector('.cookies__deny').addEventListener('click', function () {
      write('denied'); bar.hidden = true; removeTrackingCookies();
      if (loaded) location.reload(); // už načtené skripty zastaví jen nové načtení stránky
    });
  }

  if (read() !== 'denied') loadAll();

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-cookie-settings]').forEach(function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); showBar(); });
    });
  });
})();
