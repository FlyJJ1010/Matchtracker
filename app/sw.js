// MatchTracker service worker (scope /app/). Gegenereerd door _build/webapp/vite.web.config.mjs.
// Bewaart de hele app offline, zodat hij zonder bereik start. Elke nieuwe build krijgt een
// nieuw versienummer: dan wordt alles opnieuw opgehaald en de oude cache opgeruimd.
const VERSION = '1.0.0-08bcee4e67';
const CACHE = `matchtracker-app-${VERSION}`;
const PRECACHE = [
  "/app/assets/chakra-petch-latin-600-normal-DVQm9bgb.woff2",
  "/app/assets/chakra-petch-latin-700-normal-CnDBPjkL.woff2",
  "/app/assets/chakra-petch-latin-ext-600-normal-CdGvbdDU.woff2",
  "/app/assets/chakra-petch-latin-ext-700-normal-DAkvJhej.woff2",
  "/app/assets/chakra-petch-thai-600-normal-C620THcd.woff2",
  "/app/assets/chakra-petch-thai-700-normal-B7WL5pBr.woff2",
  "/app/assets/chakra-petch-vietnamese-600-normal-YQPWIhHU.woff2",
  "/app/assets/chakra-petch-vietnamese-700-normal-ZDCXY9IA.woff2",
  "/app/assets/fa-brands-400-D_cYUPeE.woff2",
  "/app/assets/fa-regular-400-BjRzuEpd.woff2",
  "/app/assets/fa-solid-900-CTAAxXor.woff2",
  "/app/assets/fa-v4compatibility-C9RhG_FT.woff2",
  "/app/assets/index-C7EmxtG9.js",
  "/app/assets/index-CXIcIWdd.css",
  "/app/assets/inter-cyrillic-400-normal-obahsSVq.woff2",
  "/app/assets/inter-cyrillic-500-normal-BasfLYem.woff2",
  "/app/assets/inter-cyrillic-600-normal-CWCymEST.woff2",
  "/app/assets/inter-cyrillic-700-normal-CjBOestx.woff2",
  "/app/assets/inter-cyrillic-ext-400-normal-BQZuk6qB.woff2",
  "/app/assets/inter-cyrillic-ext-500-normal-B0yAr1jD.woff2",
  "/app/assets/inter-cyrillic-ext-600-normal-Dfes3d0z.woff2",
  "/app/assets/inter-cyrillic-ext-700-normal-BjwYoWNd.woff2",
  "/app/assets/inter-greek-400-normal-B4URO6DV.woff2",
  "/app/assets/inter-greek-500-normal-BIZE56-Y.woff2",
  "/app/assets/inter-greek-600-normal-plRanbMR.woff2",
  "/app/assets/inter-greek-700-normal-C3JjAnD8.woff2",
  "/app/assets/inter-greek-ext-400-normal-DGGRlc-M.woff2",
  "/app/assets/inter-greek-ext-500-normal-C4iEst2y.woff2",
  "/app/assets/inter-greek-ext-600-normal-DRtmH8MT.woff2",
  "/app/assets/inter-greek-ext-700-normal-qfdV9bQt.woff2",
  "/app/assets/inter-latin-400-normal-C38fXH4l.woff2",
  "/app/assets/inter-latin-500-normal-Cerq10X2.woff2",
  "/app/assets/inter-latin-600-normal-LgqL8muc.woff2",
  "/app/assets/inter-latin-700-normal-Yt3aPRUw.woff2",
  "/app/assets/inter-latin-ext-400-normal-C1nco2VV.woff2",
  "/app/assets/inter-latin-ext-500-normal-CV4jyFjo.woff2",
  "/app/assets/inter-latin-ext-600-normal-D2bJ5OIk.woff2",
  "/app/assets/inter-latin-ext-700-normal-Ca8adRJv.woff2",
  "/app/assets/inter-vietnamese-400-normal-DMkecbls.woff2",
  "/app/assets/inter-vietnamese-500-normal-DOriooB6.woff2",
  "/app/assets/inter-vietnamese-600-normal-Cc8MFFhd.woff2",
  "/app/assets/inter-vietnamese-700-normal-DlLaEgI2.woff2",
  "/app/assets/web-CVQl2qX7.js",
  "/app/",
  "/app/manifest.json",
  "/favicon.ico",
  "/favicon.svg",
  "/apple-touch-icon.png",
  "/assets/img/icon-192.png",
  "/assets/img/icon-512.png",
  "/assets/img/icon-maskable-512.png"
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('matchtracker-app-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Andere domeinen (o.a. advertenties van Google AdSense) nooit onderscheppen of cachen:
  // die gaan rechtstreeks naar internet en mislukken offline, waarna de advertentieblokken dicht blijven.
  if (url.origin !== self.location.origin) return;

  // De app zelf (/app/ of /app/index.html): altijd direct uit de cache, ook zonder bereik.
  if (req.mode === 'navigate') {
    event.respondWith(caches.match('/app/', { cacheName: CACHE }).then((hit) => hit || fetch(req)));
    return;
  }
  // Overige bestanden: uit de cache, anders van internet.
  event.respondWith(caches.match(req, { cacheName: CACHE, ignoreSearch: true }).then((hit) => hit || fetch(req)));
});
