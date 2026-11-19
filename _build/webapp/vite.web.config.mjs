// Bouwinstelling voor de WEBVERSIE van MatchTracker (match-tracker.nl/app/).
// Draait op een KOPIE van het app-project (nooit op het Android-project zelf):
//   node _build/webapp/build-webapp.mjs   (zie README.md in deze map)
// De app-broncode (src/) wordt niet aangepast; alles hier is een laag eromheen.
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, relative } from 'node:path';
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(process.env.MT_APP_DIR || 'C:/Projecten/Matchtracker-build');
const stub = (f) => resolve(here, 'stubs', f);
const pkg = JSON.parse(readFileSync(resolve(appRoot, 'package.json'), 'utf8'));

const WEB_PRIVACY_URL = 'https://match-tracker.nl/privacy/';
const PLATFORM_ENTRY = '/@mt-web/web-platform.js';

// Advertenties in de webversie (Google AdSense), uitgevoerd door web-ads.js.
// De schakelaar ADS_ENABLED staat in _build/ads.config.mjs (geldt ook voor de website).
// ADS_ENABLED = false: slots leeg in window.MT_ADS -> geen script, geen container, geen verzoeken.
import { ADS_ENABLED, ADSENSE_CLIENT, AD_SLOTS } from '../ads.config.mjs';
const MT_ADS = {
  client: ADSENSE_CLIENT,
  slotBanner: ADS_ENABLED ? AD_SLOTS.banner : '',
  slotBreak: ADS_ENABLED ? AD_SLOTS.break : '',
};

/** Vervangt een stuk tekst en stopt de build als het niet (meer) gevonden wordt. */
function mustReplace(text, find, replacement, what) {
  const out = text.replace(find, replacement);
  if (out === text) throw new Error(`Webbuild: "${what}" niet gevonden in de app. Is de app-code veranderd?`);
  return out;
}

/** Stopt de build als iets waar web-ads.js op leunt niet (meer) in de app staat. */
function mustContain(text, find, what) {
  const found = typeof find === 'string' ? text.includes(find) : find.test(text);
  if (!found) throw new Error(`Webbuild (advertenties): "${what}" niet gevonden in de app. Is de app-code veranderd?`);
}

// web-ads.js gebruikt deze elementen en isEligibleBreak uit core/adPolicy.js.
const AD_ELEMENT_IDS = ['main-scroll-area', 'time-section', 'break-active-bar', 'lock-overlay'];
function checkAdHooks(html) {
  for (const id of AD_ELEMENT_IDS) mustContain(html, `id="${id}"`, `id="${id}"`);
  const policy = readFileSync(resolve(appRoot, 'src/core/adPolicy.js'), 'utf8');
  mustContain(policy, /export\s+function\s+isEligibleBreak\s*\(/, 'isEligibleBreak in src/core/adPolicy.js');
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
        checkAdHooks(html);
        html = hideMonetization(html);
        return mustReplace(html, '<script type="module" src="/src/main.js"></script>',
          '<script>window.MT_PLATFORM = "web";</script>\n' +
          `    <script>window.MT_ADS = ${JSON.stringify(MT_ADS)};</script>\n` +
          `    <script type="module" src="${PLATFORM_ENTRY}"></script>\n` +
          '    <script type="module" src="/src/main.js"></script>', 'main.js-script');
      },
    },
  };
}

// ---------- PWA: manifest, iPhone-instellingen en service worker ----------

const THEME = '#020617'; // zelfde als <meta name="theme-color"> en de achtergrond van de app
const SITE_ICONS = ['/favicon.ico', '/favicon.svg', '/apple-touch-icon.png', '/assets/img/icon-192.png', '/assets/img/icon-512.png', '/assets/img/icon-maskable-512.png'];

const manifest = {
  id: '/app/',
  name: 'MatchTracker',
  short_name: 'MatchTracker',
  description: 'Wedstrijdklok en scoreapp voor scheidsrechters (voetbal en hockey).',
  lang: 'nl',
  start_url: '/app/',
  scope: '/app/',
  display: 'standalone',
  orientation: 'portrait',
  background_color: THEME,
  theme_color: THEME,
  icons: [
    { src: '/assets/img/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/assets/img/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/assets/img/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
};

const PWA_HEAD = `
    <meta name="google-adsense-account" content="ca-pub-9906906182484323">
    <meta name="description" content="MatchTracker: wedstrijdklok en scoreapp voor scheidsrechters (voetbal en hockey). Werkt ook zonder internet.">
    <link rel="canonical" href="https://match-tracker.nl/app/">
    <link rel="manifest" href="/app/manifest.json">
    <link rel="icon" href="/favicon.ico" sizes="32x32">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-title" content="MatchTracker">
    <meta name="apple-mobile-web-app-status-bar-style" content="black">
`;

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

function pwaPlugin() {
  let outDir;
  let failed = false; // mislukte build: closeBundle mag de echte foutmelding niet overschrijven
  return {
    name: 'matchtracker-pwa',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    buildEnd(error) {
      if (error) failed = true;
    },
    renderError() {
      failed = true;
    },
    // Na de verwerking door Vite, zodat deze absolute site-paden ongewijzigd blijven.
    transformIndexHtml: {
      order: 'post',
      handler: (html) => mustReplace(html, '</head>', `${PWA_HEAD}</head>`, '</head>'),
    },
    closeBundle() {
      if (failed || !existsSync(join(outDir, 'index.html'))) return;
      writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
      // Alles wat de app nodig heeft om offline te starten. .ttf/.woff zijn reserve-formaten
      // die moderne browsers niet laden (zij gebruiken .woff2).
      const files = walk(outDir)
        .map((f) => relative(outDir, f).replace(/\\/g, '/'))
        .filter((f) => !/\.(ttf|woff)$/.test(f) && f !== 'sw.js')
        .sort();
      const precache = files.map((f) => (f === 'index.html' ? '/app/' : `/app/${f}`)).concat(SITE_ICONS);
      // Versie = vingerafdruk van alle bestanden: elke wijziging in de app geeft een nieuwe cache.
      const hash = createHash('sha256');
      for (const f of files) hash.update(f).update(readFileSync(join(outDir, f)));
      hash.update(readFileSync(resolve(here, 'sw.template.js'))).update(JSON.stringify(precache));
      for (const icon of SITE_ICONS) hash.update(readFileSync(join(here, '..', '..', icon)));
      const version = `${pkg.version}-${hash.digest('hex').slice(0, 10)}`;
      const sw = readFileSync(resolve(here, 'sw.template.js'), 'utf8')
        .replace('__VERSION__', version)
        .replace('__PRECACHE__', JSON.stringify(precache, null, 2));
      writeFileSync(join(outDir, 'sw.js'), sw);
      console.log(`service worker: versie ${version}, ${precache.length} bestanden offline`);
    },
  };
}

export default {
  root: appRoot,
  base: '/app/',
  logLevel: 'warn',
  plugins: [webPlatformPlugin(), pwaPlugin()],
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
