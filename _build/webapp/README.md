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
- PWA: `app/manifest.json` (standalone, themakleur, iconen) en `app/sw.js` (scope `/app/`),
  gemaakt uit `sw.template.js`. De service worker bewaart de hele app offline. Het versienummer
  is een vingerafdruk van alle bestanden: na elke nieuwe build komt de update vanzelf door
  (de oude cache wordt opgeruimd).
