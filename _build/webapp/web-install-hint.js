// MatchTracker webversie: eenmalige melding "Zet op beginscherm" in Safari op iPhone/iPad.
// De app-logica (src/) blijft ongewijzigd; dit is alleen een laag eromheen.
//  - Alleen Safari op iPhone/iPad (iPadOS meldt zich als Mac: herkend aan het aanraakscherm).
//  - Nooit in de geïnstalleerde app (navigator.standalone of display-mode: standalone).
//  - Nooit tijdens een lopende wedstrijd (begonnen en nog niet afgefloten, ook in de rust).
//    Begint er een wedstrijd terwijl de melding open staat, dan verdwijnt hij (telt niet als gesloten).
//  - Sluiten wordt onthouden in localStorage: daarna nooit meer.
import { state } from 'mt-app/src/state.js';

const CLOSED_KEY = 'mt_web_install_hint_closed';
const SHOW_DELAY_MS = 2500; // eerst de app laten opstarten en zijn opgeslagen wedstrijd laten laden

const ua = navigator.userAgent || '';
const isIOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
// Andere browsers op iOS (Chrome, Firefox, Edge, Opera, Google-app, in-app browsers) uitsluiten.
const isSafari = /Safari\//.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA\/|FBAN|FBAV|Instagram|Line\//.test(ua);

function isStandalone() {
  if (navigator.standalone === true) return true;
  try {
    return window.matchMedia('(display-mode: standalone)').matches;
  } catch {
    return false;
  }
}

function wasClosed() {
  try {
    return window.localStorage.getItem(CLOSED_KEY) === '1';
  } catch {
    return false;
  }
}

function rememberClosed() {
  try {
    window.localStorage.setItem(CLOSED_KEY, '1');
  } catch {}
}

/** Lopende wedstrijd: klok loopt, rust loopt, of begonnen en nog niet afgefloten. */
function matchInProgress() {
  return !!(state.isRunning || state.isInBreak || (state.matchStartedAt && !state.matchEnd));
}

let el = null;
let watch = null;

function hide() {
  if (watch) clearInterval(watch);
  watch = null;
  if (el) el.remove();
  el = null;
}

function show() {
  if (el || wasClosed() || isStandalone() || matchInProgress()) return;
  addStyle();
  el = document.createElement('div');
  el.id = 'mt-install-hint';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', 'Zet MatchTracker op je beginscherm');
  el.innerHTML = `
    <div class="mt-ih-body">
      <strong>Zet MatchTracker op je beginscherm</strong>
      <span>Tik op <span class="mt-ih-nw"><b>Delen</b> <i class="fa-solid fa-arrow-up-from-bracket" aria-hidden="true"></i></span>
        en kies <span class="mt-ih-nw"><b>Zet op beginscherm</b> <i class="fa-regular fa-square-plus" aria-hidden="true"></i>.</span>
        Zo blijven je wedstrijden betrouwbaar bewaard.</span>
    </div>
    <button type="button" class="mt-ih-close" aria-label="Sluiten"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>`;
  el.querySelector('.mt-ih-close').addEventListener('click', () => {
    rememberClosed();
    hide();
  });
  document.body.appendChild(el);
  // Start er een wedstrijd (of wordt de app geïnstalleerd geopend), dan meteen weg.
  watch = setInterval(() => {
    if (matchInProgress() || isStandalone()) hide();
  }, 1000);
}

function addStyle() {
  if (document.getElementById('mt-install-hint-style')) return;
  const style = document.createElement('style');
  style.id = 'mt-install-hint-style';
  // Altijd 24px boven de advertentiebalk (--ad-space, inclusief veilige zone) of, zonder advertentie,
  // boven de thuisbalk. De sluitknop zit rechtsboven: zo ver mogelijk van de advertentie.
  // z-index onder de pop-ups van de app (105+) en het schermslot (200), boven de reclamebalk (99).
  style.textContent = `
#mt-install-hint{position:fixed;left:12px;right:12px;bottom:calc(max(var(--ad-space,0px),env(safe-area-inset-bottom,0px)) + 24px);
  z-index:104;max-width:420px;margin:0 auto;display:flex;align-items:flex-start;gap:10px;padding:12px 8px 12px 14px;
  background:#0c2a4a;border:1px solid rgba(56,189,248,.45);border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.5);
  color:#bae6fd;font:400 13px/1.45 Inter,system-ui,-apple-system,sans-serif}
#mt-install-hint .mt-ih-body{flex:1;min-width:0}
#mt-install-hint strong{display:block;color:#fff;font-weight:700;font-size:14px;margin-bottom:2px}
#mt-install-hint b{color:#fff;font-weight:600}
#mt-install-hint i{margin:0 2px}
#mt-install-hint .mt-ih-nw{white-space:nowrap}
#mt-install-hint .mt-ih-close{flex-shrink:0;width:36px;height:36px;margin:-6px 0 0;border:0;border-radius:10px;
  background:transparent;color:#bae6fd;font-size:16px;cursor:pointer}
#mt-install-hint .mt-ih-close:active{background:rgba(255,255,255,.08)}`;
  document.head.appendChild(style);
}

if (isIOS && isSafari && !isStandalone() && !wasClosed()) {
  const schedule = () => setTimeout(show, SHOW_DELAY_MS);
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });
}
