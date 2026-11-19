// Zet een versienummer (vingerafdruk van de inhoud) achter site.css, site.js en ads.js in alle sitepagina's:
//   /assets/css/site.css?v=1a2b3c4d5e
// GitHub Pages laat browsers deze bestanden 10 minuten bewaren. Zonder versienummer kan een nieuwe
// pagina dan met oude CSS getoond worden (zo stonden op /start/ alle varianten door elkaar).
// Draai na elke wijziging aan site.css, site.js of ads.js: npm run build (doet dit als laatste stap).
// ads.js staat alleen in de pagina's als de advertenties aan staan (zie _build/site-ads.mjs).
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const ASSETS = ['assets/css/site.css', 'assets/js/site.js', 'assets/js/ads.js'];
const SKIP = new Set(['node_modules', 'app', '_build', '.git']);

const hash = (f) => createHash('sha256').update(readFileSync(f)).digest('hex').slice(0, 10);
const versions = Object.fromEntries(ASSETS.map((a) => [a, hash(a)]));

function pages(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return SKIP.has(n) ? [] : pages(p);
    return n.endsWith('.html') ? [p] : [];
  });
}

let changed = 0;
for (const page of pages('.')) {
  const before = readFileSync(page, 'utf8');
  let after = before;
  for (const [asset, v] of Object.entries(versions)) {
    const re = new RegExp(`/${asset.replace(/[.]/g, '\\.')}(\\?v=[0-9a-f]+)?"`, 'g');
    after = after.replace(re, `/${asset}?v=${v}"`);
  }
  if (after !== before) {
    writeFileSync(page, after);
    changed++;
  }
}
console.log(`versienummers: ${Object.entries(versions).map(([a, v]) => `${a}?v=${v}`).join(', ')} (${changed} pagina's bijgewerkt)`);
