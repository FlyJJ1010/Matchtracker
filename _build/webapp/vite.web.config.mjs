// Bouwinstelling voor de WEBVERSIE van MatchTracker (match-tracker.nl/app/).
// Draait op een KOPIE van het app-project (nooit op het Android-project zelf):
//   node _build/webapp/build-webapp.mjs   (zie README.md in deze map)
// De app-broncode (src/) wordt niet aangepast; alles hier is een laag eromheen.
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(process.env.MT_APP_DIR || 'C:/Projecten/Matchtracker-build');
const stub = (f) => resolve(here, 'stubs', f);
const pkg = JSON.parse(readFileSync(resolve(appRoot, 'package.json'), 'utf8'));

const WEB_PRIVACY_URL = 'https://match-tracker.nl/privacy/';
const PLATFORM_ENTRY = '/@mt-web/web-platform.js';

/** Vervangt een stuk tekst en stopt de build als het niet (meer) gevonden wordt. */
function mustReplace(text, find, replacement, what) {
  const out = text.replace(find, replacement);
  if (out === text) throw new Error(`Webbuild: "${what}" niet gevonden in de app. Is de app-code veranderd?`);
  return out;
}

// Reclame- en aankoopelementen die op het web geen betekenis hebben. De app-code zoekt ze op
// (renderMonetization), dus ze blijven in de HTML maar worden nooit getoond en nemen geen ruimte in.
const WEB_HIDDEN_IDS = [
  'pro-badge', // PRO-badge in de kop
  'upgrade-banner', // "Reclamevrij fluiten? Reclame verwijderen"
  'billing-notice', // aankoopmeldingen
  'settings-remove-ads', // tandwiel: Reclame verwijderen
  'settings-restore', // tandwiel: Aankoop herstellen
  'settings-privacy', // tandwiel: toestemming advertenties
  'settings-test-ads', // label "Testadvertenties"
  'billing-modal', // koopscherm Google Play
];

function hideMonetization(html) {
  for (const id of WEB_HIDDEN_IDS) {
    html = mustReplace(html, `id="${id}"`, `id="${id}" data-mt-web-hidden`, id);
  }
  // "Status: Gratis versie (met reclame)" onder het scorebord, inclusief de scheidingslijn.
  html = mustReplace(html, /(<!-- Advertentie-status -->\s*<div) /, '$1 data-mt-web-hidden ', 'advertentie-status');
  return mustReplace(html, '</head>',
    '    <style>[data-mt-web-hidden]{display:none!important}</style>\n</head>', '</head>');
}

function webPlatformPlugin() {
  return {
    name: 'matchtracker-web-platform',
    enforce: 'pre',
    resolveId(id) {
      if (id === PLATFORM_ENTRY) return resolve(here, 'web-platform.js');
      return null;
    },
    // Privacybeleid-knop in de app: op het web naar de eigen site (Android ongewijzigd).
    transform(code, id) {
      if (!id.replace(/\\/g, '/').endsWith('/src/config/app.config.js')) return null;
      return mustReplace(code, /export const PRIVACY_POLICY_URL = '[^']*';/,
        `export const PRIVACY_POLICY_URL = '${WEB_PRIVACY_URL}';`, 'PRIVACY_POLICY_URL');
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        html = hideMonetization(html);
        return mustReplace(html, '<script type="module" src="/src/main.js"></script>',
          '<script>window.MT_PLATFORM = "web";</script>\n' +
          `    <script type="module" src="${PLATFORM_ENTRY}"></script>\n` +
          '    <script type="module" src="/src/main.js"></script>', 'main.js-script');
      },
    },
  };
}

export default {
  root: appRoot,
  base: '/app/',
  logLevel: 'warn',
  plugins: [webPlatformPlugin()],
  resolve: {
    alias: [
      { find: /^@capacitor\/core$/, replacement: stub('capacitor-core.js') },
      { find: /^@capacitor\/(preferences|local-notifications|browser)$/, replacement: stub('native-plugins.js') },
      { find: /^@capacitor-community\/keep-awake$/, replacement: stub('native-plugins.js') },
      { find: /^@capacitor-community\/admob$/, replacement: stub('admob.js') },
      // @capacitor/splash-screen blijft zoals in de app (op het web doet hide() al niets).
      { find: /^mt-app\//, replacement: appRoot.replace(/\\/g, '/') + '/' },
    ],
  },
  define: {
    __BILLING_MOCK__: 'false',
    __ADS_RELEASE__: 'false',
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    outDir: resolve(appRoot, 'dist-web'),
    emptyOutDir: true,
    assetsInlineLimit: 0,
  },
};
