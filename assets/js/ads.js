// match-tracker.nl – advertentieblokken (Google AdSense) op de homepage en Uitleg & FAQ.
// Alleen in gebruik als ADS_ENABLED in _build/ads.config.mjs aan staat: _build/site-ads.mjs zet dan
// de blokken (<aside class="mt-ad">) en dit script in de pagina. Staat de schakelaar uit, dan verwijst
// geen enkele pagina naar dit bestand.
// ES5, zoals site.js. Per blok precies één aanvraag; geen verversen.
// Een blok verdwijnt volledig (met label, zonder lege ruimte) als:
//  - Google geen advertentie heeft (data-ad-status="unfilled"),
//  - het AdSense-script niet laadt (offline, blokkering), of
//  - er na TIMEOUT_MS nog geen advertentie staat.
(function () {
  var TIMEOUT_MS = 10000;

  function collapse(box) {
    if (box && box.parentNode) box.parentNode.removeChild(box);
  }

  function hasAd(ins) {
    var status = ins.getAttribute('data-ad-status');
    if (status === 'filled') return true;
    if (status === 'unfilled') return false;
    // Oudere AdSense-versies zetten geen data-ad-status: kijk of er een zichtbare advertentie in staat.
    var frame = ins.querySelector('iframe');
    return !!frame && frame.offsetHeight > 0;
  }

  function setup(box) {
    var ins = box.querySelector('ins.adsbygoogle');
    if (!ins) return collapse(box);
    if (navigator.onLine === false) return collapse(box);

    if (window.MutationObserver) {
      var obs = new MutationObserver(function () {
        if (ins.getAttribute('data-ad-status') === 'unfilled') {
          obs.disconnect();
          collapse(box);
        }
      });
      obs.observe(ins, { attributes: true, attributeFilter: ['data-ad-status'] });
    }

    setTimeout(function () {
      if (!hasAd(ins)) collapse(box);
    }, TIMEOUT_MS);

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      collapse(box);
    }
  }

  // Script geblokkeerd of offline: alle blokken dicht. Wordt aangeroepen door de onerror van de
  // AdSense-scripttag; was die fout er al vóór dit script, dan staat window.mtAdsFailed.
  function collapseAll() {
    Array.prototype.forEach.call(document.querySelectorAll('.mt-ad'), collapse);
  }
  window.mtAdsCollapse = collapseAll;

  function init() {
    if (window.mtAdsFailed) return collapseAll();
    Array.prototype.forEach.call(document.querySelectorAll('.mt-ad'), setup);
  }

  try {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  } catch (e) {
    if (window.console && console.error) console.error('ads.js:', e);
  }
})();
