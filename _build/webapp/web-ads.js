// MatchTracker webversie: advertenties (Google AdSense). De app-logica (src/) blijft ongewijzigd.
// Instellingen komen uit window.MT_ADS (gezet door vite.web.config.mjs):
//   { client: "ca-pub-…", slotBanner: "…", slotBreak: "…" }
// Zijn beide slots leeg (of ontbreekt client), dan gebeurt er niets: geen script, geen container.
//
//  - Banner 320x50: vaste balk onderin. De ruimte wordt vrijgemaakt via de CSS-variabele --ad-space
//    van de app (styles.css): de app wordt zoveel lager en pop-ups eindigen erboven, dus er ligt
//    nooit een knop onder de advertentie.
//  - Rustblok 300x250: alleen in een rust waarvoor isEligibleBreak(state) waar is (voetbal: na de
//    1e helft, hockey: na het 2e kwart), onderaan de inhoud, zo ver mogelijk van de knoppen.
//  - Elke advertentie wordt één keer aangevraagd: geen timers, geen verversen.
//  - Geen advertentie (data-ad-status="unfilled"), geen script (offline, blokkering): blok dicht.
//  - Schermslot (#lock-overlay) actief: advertenties onzichtbaar.
import { state } from 'mt-app/src/state.js';
import { isEligibleBreak } from 'mt-app/src/core/adPolicy.js';

const BANNER = { w: 320, h: 50 };
const BREAK = { w: 300, h: 250 };
const LABEL_H = 12; // regel "Advertentie" boven de banner
const BANNER_SPACE = `calc(${BANNER.h + LABEL_H}px + env(safe-area-inset-bottom, 0px))`;

const text = (v) => (typeof v === 'string' ? v.trim() : '');
const cfg = window.MT_ADS || {};
const client = text(cfg.client);
const slotBanner = text(cfg.slotBanner);
const slotBreak = text(cfg.slotBreak);

let scriptFailed = false;
let bannerEl = null;
let breakEl = null;
let breakKeyLoaded = null; // per rust één aanvraag (sleutel: begintijd van de rust)

if (client && (slotBanner || slotBreak)) start();

function start() {
  addStyle();
  loadScript();
  watchLock();
  if (slotBanner) openBanner();
  if (slotBreak) watchBreak();
}

// ---------- AdSense-script (één keer) ----------

function loadScript() {
  if (document.querySelector('script[data-mt-adsbygoogle]')) return;
  const s = document.createElement('script');
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
  s.setAttribute('data-mt-adsbygoogle', '');
  s.onerror = () => {
    // Offline of geblokkeerd: alles dicht, en deze sessie niet opnieuw proberen.
    scriptFailed = true;
    closeBanner();
    closeBreak();
  };
  document.head.appendChild(s);
}

/** Bouwt een advertentie op uit de configuratie, met label erboven. */
function createAd(id, slot, size) {
  const box = document.createElement('div');
  box.id = id;
  box.setAttribute('aria-label', 'Advertentie');
  const label = document.createElement('div');
  label.className = 'mt-ad-label';
  label.textContent = 'Advertentie';
  const ins = document.createElement('ins');
  ins.className = 'adsbygoogle';
  ins.setAttribute('style', `display:inline-block;width:${size.w}px;height:${size.h}px`);
  ins.setAttribute('data-ad-client', client);
  ins.setAttribute('data-ad-slot', slot);
  box.append(label, ins);
  return { box, ins };
}

/** Eén aanvraag per advertentie. Pas aanroepen als het blok in de pagina staat. */
function requestAd(ins, onUnfilled) {
  const obs = new MutationObserver(() => {
    if (ins.getAttribute('data-ad-status') === 'unfilled') {
      obs.disconnect();
      onUnfilled();
    }
  });
  obs.observe(ins, { attributes: true, attributeFilter: ['data-ad-status'] });
  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch {
    obs.disconnect();
    onUnfilled();
  }
}

// ---------- Banner onderin ----------

function openBanner() {
  if (scriptFailed || bannerEl || !navigator.onLine) return;
  const { box, ins } = createAd('mt-ad-banner', slotBanner, BANNER);
  bannerEl = box;
  document.body.appendChild(box);
  document.documentElement.style.setProperty('--ad-space', BANNER_SPACE);
  requestAd(ins, closeBanner);
}

function closeBanner() {
  if (!bannerEl) return;
  bannerEl.remove();
  bannerEl = null;
  document.documentElement.style.setProperty('--ad-space', '0px');
}

// ---------- Rustblok ----------

function watchBreak() {
  const bar = document.getElementById('break-active-bar');
  const main = document.getElementById('main-scroll-area');
  if (!bar || !main) return; // bouwcontrole bewaakt dit; hier alleen een vangnet
  // De app zet bij elke weergave de klasse "hidden" op deze balk volgens state.isInBreak
  // (ook na herladen tijdens een rust). Wijzigt de klasse, dan opnieuw beoordelen.
  new MutationObserver(syncBreak).observe(bar, { attributes: true, attributeFilter: ['class'] });
  syncBreak();
}

function syncBreak() {
  const bar = document.getElementById('break-active-bar');
  const inBreak = !!bar && !bar.classList.contains('hidden') && state.isInBreak;
  if (!inBreak || !isEligibleBreak(state)) {
    closeBreak();
    return;
  }
  const key = String(state.breakStartTimestamp);
  if (key === breakKeyLoaded) return; // deze rust al aangevraagd (of dichtgeklapt): niet opnieuw
  breakKeyLoaded = key;
  if (scriptFailed || !navigator.onLine) return;
  const { box, ins } = createAd('mt-ad-break', slotBreak, BREAK);
  breakEl = box;
  // Onderaan de inhoud, na het wedstrijdboek: de plek met de meeste afstand tot de knoppen.
  document.getElementById('main-scroll-area').appendChild(box);
  requestAd(ins, closeBreak);
}

function closeBreak() {
  if (!breakEl) return;
  breakEl.remove();
  breakEl = null;
}

// ---------- Schermslot ----------

function watchLock() {
  const overlay = document.getElementById('lock-overlay');
  if (!overlay) return;
  const sync = () => document.documentElement.classList.toggle('mt-ads-locked', !overlay.classList.contains('hidden'));
  new MutationObserver(sync).observe(overlay, { attributes: true, attributeFilter: ['class'] });
  sync();
}

// ---------- Opmaak ----------

function addStyle() {
  const css = `
#mt-ad-banner{position:fixed;left:0;right:0;bottom:0;z-index:99;height:${BANNER_SPACE};
  padding-bottom:env(safe-area-inset-bottom,0px);box-sizing:border-box;background:#020617;
  border-top:1px solid rgba(51,65,85,.7);text-align:center;overflow:hidden}
#mt-ad-banner .mt-ad-label{height:${LABEL_H - 1}px;line-height:${LABEL_H - 1}px}
#mt-ad-banner ins{vertical-align:top}
#mt-ad-break{flex-shrink:0;padding-top:40px;text-align:center}
#mt-ad-break .mt-ad-label{margin-bottom:4px}
.mt-ad-label{font:600 9px/1 Inter,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#64748b}
.mt-ads-locked #mt-ad-banner,.mt-ads-locked #mt-ad-break{visibility:hidden}`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}
