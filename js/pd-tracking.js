/* PD on Demand – Consent, Google Ads Tracking, Calendly-Popup
   Konfiguration: ADS_ID und die Conversion-Labels nach Anlage des Google-Ads-Kontos eintragen.
   Solange ADS_ID nicht gesetzt ist, tut dieses Skript nichts (kein Banner, kein Tracking). */
(function () {
  var CFG = {
    ADS_ID: 'AW-REPLACE_ME',                    // z. B. AW-1234567890
    CONV_BOOKING: 'REPLACE_BOOKING_LABEL',      // Conversion-Label "Kennenlernen gebucht"
    CONV_WHATSAPP: 'REPLACE_WHATSAPP_LABEL',    // Conversion-Label "WhatsApp-Klick"
    CALENDLY_HOST: 'calendly.com'
  };
  var KEY = 'pd_consent_v1';
  var configured = CFG.ADS_ID.indexOf('REPLACE') === -1;
  var en = (document.documentElement.lang || 'de').toLowerCase().indexOf('en') === 0;
  var T = en ? {
    txt: 'We would like to use Google Ads measurement to see which ads lead to a booking. This only happens with your consent.',
    yes: 'Accept', no: 'Decline', more: 'Privacy policy', href: '/privacy.html'
  } : {
    txt: 'Wir möchten mit Google-Ads-Messung erfassen, welche Anzeigen zu einer Buchung führen. Das passiert nur mit deiner Einwilligung.',
    yes: 'Akzeptieren', no: 'Ablehnen', more: 'Datenschutzrichtlinie', href: '/datenschutz.html'
  };

  function store(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  var loaded = false;
  function loadGoogle() {
    if (!configured || loaded) return;
    loaded = true;
    gtag('consent', 'update', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'denied' });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(CFG.ADS_ID);
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', CFG.ADS_ID);
  }

  function convert(label) {
    if (!configured || read() !== 'granted' || !label || label.indexOf('REPLACE') !== -1) return;
    gtag('event', 'conversion', { send_to: CFG.ADS_ID + '/' + label });
  }

  function banner() {
    var b = document.createElement('div');
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-label', 'Cookie');
    b.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;max-width:560px;margin:auto;z-index:9999;background:#132623;color:#F1F3EF;padding:18px 20px;border-radius:12px;font:14px/1.5 Arial,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.3)';
    b.innerHTML = '<p style="margin:0 0 12px">' + T.txt + ' <a href="' + T.href + '" style="color:#F1F3EF;text-decoration:underline">' + T.more + '</a></p>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
      '<button type="button" data-a="1" style="background:#F1F3EF;color:#132623;border:0;border-radius:8px;padding:10px 18px;font:600 14px Arial,sans-serif;cursor:pointer">' + T.yes + '</button>' +
      '<button type="button" data-a="0" style="background:transparent;color:#F1F3EF;border:1px solid #7C8A85;border-radius:8px;padding:10px 18px;font:14px Arial,sans-serif;cursor:pointer">' + T.no + '</button></div>';
    b.addEventListener('click', function (e) {
      var a = e.target && e.target.getAttribute && e.target.getAttribute('data-a');
      if (a === null || a === undefined) return;
      store(a === '1' ? 'granted' : 'denied');
      if (a === '1') loadGoogle();
      b.remove();
    });
    document.body.appendChild(b);
  }

  /* Consent Mode: Standard = verweigert */
  gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' });

  var c = read();
  if (configured) {
    if (c === 'granted') loadGoogle();
    else if (c === null) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', banner); else banner(); }
  }

  /* Calendly als Popup, damit die Buchung auf der Seite messbar ist.
     Ohne JavaScript oder wenn das Widget nicht lädt, öffnet der normale Link. */
  var widgetReady = null;
  function ensureCalendly(cb) {
    if (window.Calendly) return cb(true);
    if (widgetReady) { widgetReady.push(cb); return; }
    widgetReady = [cb];
    var css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = 'https://assets.calendly.com/assets/external/widget.css';
    document.head.appendChild(css);
    var s = document.createElement('script');
    s.src = 'https://assets.calendly.com/assets/external/widget.js'; s.async = true;
    s.onload = function () { widgetReady.forEach(function (f) { f(true); }); };
    s.onerror = function () { widgetReady.forEach(function (f) { f(false); }); };
    document.head.appendChild(s);
  }

  function utmFromUrl() {
    var p = new URLSearchParams(location.search), o = {};
    [['utm_source', 'utmSource'], ['utm_medium', 'utmMedium'], ['utm_campaign', 'utmCampaign'], ['utm_term', 'utmTerm'], ['utm_content', 'utmContent']]
      .forEach(function (k) { if (p.get(k[0])) o[k[1]] = p.get(k[0]); });
    return o;
  }

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href.indexOf('wa.me/') !== -1) { convert(CFG.CONV_WHATSAPP); return; }
    if (href.indexOf(CFG.CALENDLY_HOST) !== -1 && !(e.ctrlKey || e.metaKey || e.shiftKey)) {
      e.preventDefault();
      ensureCalendly(function (ok) {
        if (!ok) { window.open(href, '_blank', 'noopener'); return; }
        window.Calendly.initPopupWidget({ url: href, utm: utmFromUrl() });
      });
    }
  });

  window.addEventListener('message', function (e) {
    if (e.origin !== 'https://calendly.com') return;
    if (e.data && e.data.event === 'calendly.event_scheduled') convert(CFG.CONV_BOOKING);
  });
})();
