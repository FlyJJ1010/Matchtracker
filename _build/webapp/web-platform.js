// MatchTracker webversie: alleen web-specifieke aanvullingen. De app-logica (src/) blijft ongewijzigd.
//  1. Platformvlag (window.MT_PLATFORM = "web").
//  2. Geluid ontgrendelen bij een tik (iOS staat WebAudio pas toe na een aanraking).
//  3. "Scherm aan houden" via de Wake Lock API; schakelaar verborgen als de browser dat niet kan.
import { runtime } from 'mt-app/src/state.js';

window.MT_PLATFORM = 'web';

// ---------- 2. Geluid ontgrendelen ----------
// De app maakt haar AudioContext pas aan op het moment van het eindsignaal. Op iOS is dat geen
// aanraking, dus blijft het geluid dan stil. Daarom maken we dezelfde gedeelde context
// (runtime.sharedAudioCtx, die alerts.js gebruikt) al aan bij een tik, bij voorkeur op Start.

// iOS 17+: geluid als "afspelen" behandelen, zodat het minder snel door de stille modus wordt gedempt.
try {
  if (navigator.audioSession) navigator.audioSession.type = 'playback';
} catch {}

function unlockAudio() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  try {
    if (!runtime.sharedAudioCtx) runtime.sharedAudioCtx = new AudioCtx();
    const ctx = runtime.sharedAudioCtx;
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    // Eén stil sample afspelen binnen de aanraking: dat ontgrendelt WebAudio op iOS definitief.
    const src = ctx.createBufferSource();
    src.buffer = ctx.createBuffer(1, 1, 22050);
    src.connect(ctx.destination);
    src.start(0);
  } catch {}
}

// Elke knop in de app (data-action), dus ook Start. Na terugkeer uit de achtergrond kan iOS de
// context weer pauzeren; de eerstvolgende tik ontgrendelt hem dan opnieuw.
document.addEventListener(
  'click',
  (e) => {
    if (e.target.closest && e.target.closest('[data-action]')) unlockAudio();
  },
  { capture: true },
);

// ---------- 3. Scherm aan houden (Wake Lock) ----------
const PREFS_KEY = 'matchtracker_prefs_v1'; // zelfde sleutel als src/prefs.js
const wakeLockSupported = 'wakeLock' in navigator && typeof navigator.wakeLock.request === 'function';
let wanted = false;
let sentinel = null;

async function acquireWakeLock() {
  if (!wakeLockSupported || !wanted || sentinel || document.visibilityState !== 'visible') return;
  try {
    sentinel = await navigator.wakeLock.request('screen');
    sentinel.addEventListener('release', () => {
      sentinel = null;
    });
  } catch {
    sentinel = null; // bijv. energiebesparingsmodus: het scherm volgt dan gewoon de systeeminstelling
  }
}

async function releaseWakeLock() {
  const s = sentinel;
  sentinel = null;
  if (s) {
    try {
      await s.release();
    } catch {}
  }
}

function setWanted(on) {
  wanted = !!on;
  if (wanted) acquireWakeLock();
  else releaseWakeLock();
}

function readSavedKeepAwake() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(PREFS_KEY) || 'null');
    return !!(saved && saved.keepAwake === true);
  } catch {
    return false;
  }
}

function setupKeepAwake() {
  const sw = document.getElementById('settings-keepawake');
  if (!sw) return;
  const row = sw.parentElement;
  const textBox = row.querySelector('span.flex-1');

  const note = document.createElement('span');
  note.className = 'block text-[11px] text-amber-300 mt-1';

  if (!wakeLockSupported) {
    // Vangnet: deze browser kan het scherm niet aan houden. Schakelaar weg, wel uitleg.
    sw.style.display = 'none';
    note.textContent =
      'Deze browser kan het scherm niet aan houden. Houd het scherm zelf aan om het eindsignaal te horen (zet de automatische vergrendeling tijdelijk langer).';
    textBox.lastElementChild.textContent = 'Niet beschikbaar in deze browser.';
    textBox.append(note);
    return;
  }

  note.textContent = 'Op iPhone klinkt het eindsignaal alleen als het scherm aan staat en de app open is.';
  textBox.append(note);

  // De app werkt aria-checked bij als je de schakelaar omzet (ui.js); daar volgen we op.
  new MutationObserver(() => setWanted(sw.getAttribute('aria-checked') === 'true')).observe(sw, {
    attributes: true,
    attributeFilter: ['aria-checked'],
  });
  // Opgeslagen keuze bij het opstarten (standaard UIT).
  setWanted(readSavedKeepAwake());
  // Een wake lock vervalt als de app naar de achtergrond gaat: bij terugkeer opnieuw aanvragen.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') acquireWakeLock();
  });
  // Sommige browsers geven de wake lock alleen na een aanraking: dan bij de eerstvolgende tik.
  document.addEventListener('click', acquireWakeLock, { capture: true });
}

setupKeepAwake();
