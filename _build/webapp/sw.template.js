// MatchTracker service worker (scope /app/). Gegenereerd door _build/webapp/vite.web.config.mjs.
// Bewaart de hele app offline, zodat hij zonder bereik start. Elke nieuwe build krijgt een
// nieuw versienummer: dan wordt alles opnieuw opgehaald en de oude cache opgeruimd.
const VERSION = '__VERSION__';
const CACHE = `matchtracker-app-${VERSION}`;
const PRECACHE = __PRECACHE__;

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
