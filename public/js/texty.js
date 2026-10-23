/* Půjčovna rotopedů — texty, které skládá js/main.js za běhu (cs / en / de).
   Texty šablon jsou v src/i18n/*.json, texty strojů v js/katalog.js. */

const TEXTY = {
  cs: {
    order: 'Objednat', more: 'Více informací', deposit: 'Vratná záloha', per: 'za', onRequest: 'Cena dohodou',
    pick: 'Vyberte stroj', showMore: 'Zobrazit další informace', hideMore: 'Skrýt další informace',
    errProduct: 'Vyberte prosím stroj.', errNamePhone: 'Vyplňte prosím jméno a telefon.',
    errAddress: 'Vyplňte prosím adresu doručení.', errEmail: 'Zkontrolujte prosím e-mail.',
    errSend: 'Odeslání se nepovedlo. Zkuste to prosím znovu, nebo volejte +420 774 860 054.',
    sending: 'Odesílám…', submit: 'Odeslat objednávku'
  },
  en: {
    order: 'Order', more: 'More information', deposit: 'Refundable deposit', per: 'for', onRequest: 'Price on request',
    pick: 'Choose a machine', showMore: 'Show more information', hideMore: 'Hide more information',
    errProduct: 'Please choose a machine.', errNamePhone: 'Please fill in your name and phone.',
    errAddress: 'Please fill in the delivery address.', errEmail: 'Please check your e-mail.',
    errSend: 'Sending failed. Please try again or call +420 774 860 054.',
    sending: 'Sending…', submit: 'Send order'
  },
  de: {
    order: 'Bestellen', more: 'Mehr Informationen', deposit: 'Kaution', per: 'für', onRequest: 'Preis auf Anfrage',
    pick: 'Gerät wählen', showMore: 'Weitere Informationen anzeigen', hideMore: 'Weitere Informationen ausblenden',
    errProduct: 'Bitte wählen Sie ein Gerät.', errNamePhone: 'Bitte geben Sie Ihren Namen und Ihre Telefonnummer an.',
    errAddress: 'Bitte geben Sie die Lieferadresse an.', errEmail: 'Bitte überprüfen Sie Ihre E-Mail-Adresse.',
    errSend: 'Senden fehlgeschlagen. Bitte versuchen Sie es erneut oder rufen Sie +420 774 860 054 an.',
    sending: 'Wird gesendet…', submit: 'Bestellung senden'
  }
};

export const LANG = TEXTY[document.documentElement.lang] ? document.documentElement.lang : 'cs';
export const T = TEXTY[LANG];
/** prefix adres v daném jazyce: '' / '/en' / '/de' */
export const LP = LANG === 'cs' ? '' : `/${LANG}`;
