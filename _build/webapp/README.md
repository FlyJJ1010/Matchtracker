# Webversie van MatchTracker bouwen (match-tracker.nl/app/)

Deze map wordt niet gepubliceerd (Jekyll slaat mappen met `_` over).

1. Kopieer het app-project naar `C:\Projecten\Matchtracker-build`
   (zonder `node_modules`, `android` en `dist`). **Nooit** in `C:\Projecten\Matchtracker` bouwen.
2. In `Matchtracker-build`: `npm ci`
3. In deze site-map: `node _build/webapp/build-webapp.mjs`
   → bouwt de webversie en zet hem in `/app/`.

Wat de webbuild doet, zonder de app-code (`src/`) aan te passen:
- `stubs/`: vervangt Capacitor, AdMob, Billing, meldingen, KeepAwake en Preferences door lege
  web-varianten. De app kiest dan zelf haar browserpad (localStorage, WebAudio, delen/download).
- `web-platform.js`: `window.MT_PLATFORM = "web"`, geluid ontgrendelen bij een tik (iOS),
  "Scherm aan houden" via de Wake Lock API (schakelaar verborgen als de browser dat niet kan).
- Reclame/aankoop verborgen (`WEB_HIDDEN_IDS` in `vite.web.config.mjs`): PRO-badge,
  "Reclame verwijderen"-balk, aankoopmeldingen, koopscherm, tandwiel-items en de advertentiestatus.
  Verandert de app-HTML zodat een element niet meer gevonden wordt, dan stopt de build met een melding.
- Privacybeleid-knop wijst naar https://match-tracker.nl/privacy/.
- Advertenties (Google AdSense, `web-ads.js`): instellingen in `MT_ADS` bovenin `vite.web.config.mjs`
  (komt als `window.MT_ADS` in de pagina). Banner 320x50 als vaste balk onderin via `--ad-space`;
  rustblok 300x250 onderaan de inhoud, alleen in een rust waarvoor `isEligibleBreak(state)` geldt.
  Elke advertentie wordt één keer aangevraagd; geen advertentie, offline of schermslot: blok dicht/verborgen.
  Beide slots leeg: geen script en geen container. De build stopt als `main-scroll-area`, `time-section`,
  `break-active-bar`, `lock-overlay` of `isEligibleBreak` niet meer in de app staan.
- **Advertenties aanzetten:** zet `ADS_ENABLED` in `vite.web.config.mjs` op `true`.
  Bouw daarna opnieuw (`node _build/webapp/build-webapp.mjs`), commit en push.
- Installatiemelding (`web-install-hint.js`): alleen in Safari op iPhone/iPad, niet in de geïnstalleerde app
  (`navigator.standalone` / `display-mode: standalone`) en niet tijdens een lopende wedstrijd. Eén keer:
  sluiten wordt onthouden in localStorage (`mt_web_install_hint_closed`).
- PWA: `app/manifest.json` (standalone, themakleur, iconen) en `app/sw.js` (scope `/app/`),
  gemaakt uit `sw.template.js`. De service worker bewaart de hele app offline. Het versienummer
  is een vingerafdruk van alle bestanden: na elke nieuwe build komt de update vanzelf door
  (de oude cache wordt opgeruimd).
