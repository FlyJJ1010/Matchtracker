// Zet de AdSense-blokken van de website in de HTML, of haalt ze weg. Schakelaar: _build/ads.config.mjs.
//   npm run build:ads   (onderdeel van npm run build, vóór build:stamp)
//
// De plekken staan als markering in de pagina's:
//   <!-- advertentie head --><!-- /advertentie head -->       in de <head>
//   <!-- advertentie home-1 --><!-- /advertentie home-1 -->   op de plek van een blok
// ADS_ENABLED = false: alles tussen de markeringen wordt leeggemaakt. Er staat dan niets in de pagina:
// geen script, geen opmaak, geen element (alleen het HTML-commentaar).
// ADS_ENABLED = true: in de head eigen opmaak, het AdSense-script (één keer) en /assets/js/ads.js;
// op elke plek een blok met het label "Advertentie" en vooraf gereserveerde hoogte.
//
// Andere pagina's (/start/, /privacy/, /contact/, 404) mogen geen markering of advertentiecode
// bevatten; dan stopt dit script met een foutmelding.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ADS_ENABLED, ADSENSE_CLIENT, AD_SLOTS } from './ads.config.mjs';

// Welke blokken op welke pagina. 'kolom': het blok staat al binnen de tekstkolom (geen eigen marge opzij).
export const PLACEMENTS = {
  'index.html': [
    { name: 'home-1', kolom: false },
    { name: 'home-2', kolom: false },
  ],
  'uitleg/index.html': [{ name: 'uitleg-1', kolom: true }],
};

const SKIP_DIRS = new Set(['node_modules', 'app', '_build', '.git']);
const SKIP_FILES = new Set(['app-oud.html']); // oude pagina, niet gepubliceerd (_config.yml)
const AD_CODE = /adsbygoogle|googlesyndication|<!-- \/?advertentie |\/assets\/js\/ads\.js/;

export const ADSENSE_SRC = (client) =>
  `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;

// Gereserveerde hoogte: label 16 px + blok 280 px (de gangbare hoogte van een responsief blok
// op telefoon en computer). Zo verspringt de pagina niet als de advertentie binnenkomt.
const CSS = [
  '.mt-ad{box-sizing:border-box;max-width:760px;margin:48px auto;padding:0 16px;text-align:center}',
  '.mt-ad.mt-ad--kolom{max-width:none;padding:0}',
  '.mt-ad-label{height:16px;margin:0;font:600 10px/16px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;' +
    'letter-spacing:.08em;text-transform:uppercase;color:#64748b}',
  '.mt-ad ins.adsbygoogle{display:block;min-height:280px}',
].join('');

function headBlock(scriptSrc) {
  return [
    '',
    `    <style>${CSS}</style>`,
    // onerror: laadt het script niet (offline, blokkering), dan meteen alle blokken dicht. Dat kan
    // gebeuren vóórdat ads.js (defer) draait; daarom de vlag mtAdsFailed, die ads.js ook nakijkt.
    `    <script async src="${scriptSrc}" crossorigin="anonymous" onerror="window.mtAdsFailed=1;if(window.mtAdsCollapse)mtAdsCollapse()"></script>`,
    '    <script src="/assets/js/ads.js" defer></script>',
    '    ',
  ].join('\n');
}

function slotBlock({ name, kolom }, client, slot) {
  const pad = '        ';
  return [
    '',
    `${pad}<aside class="mt-ad${kolom ? ' mt-ad--kolom' : ''}" aria-label="Advertentie" data-mt-ad="${name}">`,
    `${pad}    <p class="mt-ad-label">Advertentie</p>`,
    `${pad}    <ins class="adsbygoogle" style="display:block" data-ad-client="${client}" data-ad-slot="${slot}" data-ad-format="auto" data-full-width-responsive="true"></ins>`,
    `${pad}</aside>`,
    pad,
  ].join('\n');
}

function fill(html, marker, content, file) {
  const re = new RegExp(`(<!-- advertentie ${marker} -->)[\\s\\S]*?(<!-- /advertentie ${marker} -->)`);
  if (!re.test(html)) throw new Error(`site-ads: markering "${marker}" ontbreekt in ${file}`);
  return html.replace(re, (_, open, close) => open + content + close);
}

function pages(root, dir = root) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return SKIP_DIRS.has(n) ? [] : pages(root, p);
    return n.endsWith('.html') && !SKIP_FILES.has(n) ? [relative(root, p).replace(/\\/g, '/')] : [];
  });
}

/**
 * Past de schakelaar toe op de pagina's onder root.
 * scriptSrc is alleen voor de lokale testomgeving (nep-AdSense); de build gebruikt altijd Google.
 */
export function applyAds(root, { enabled = ADS_ENABLED, client = ADSENSE_CLIENT, slots = AD_SLOTS, scriptSrc } = {}) {
  const src = scriptSrc || ADSENSE_SRC(client);
  let changed = 0;
  for (const [file, places] of Object.entries(PLACEMENTS)) {
    const path = join(root, file);
    const before = readFileSync(path, 'utf8');
    let html = fill(before, 'head', enabled ? headBlock(src) : '', file);
    for (const place of places) {
      const slot = slots[place.name];
      if (enabled && !/^\d+$/.test(slot || '')) throw new Error(`site-ads: geen geldig slotnummer voor ${place.name}`);
      html = fill(html, place.name, enabled ? slotBlock(place, client, slot) : '', file);
    }
    if (/data-adtest/.test(html)) throw new Error(`site-ads: data-adtest gevonden in ${file}`);
    if (html !== before) {
      writeFileSync(path, html);
      changed++;
    }
  }
  // Bewaking: geen advertentiecode op andere pagina's (/start/, /privacy/, /contact/, 404 …).
  for (const file of pages(root)) {
    if (PLACEMENTS[file]) continue;
    if (AD_CODE.test(readFileSync(join(root, file), 'utf8'))) {
      throw new Error(`site-ads: ${file} bevat advertentiecode of een advertentiemarkering; dat mag niet.`);
    }
  }
  return changed;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
  const changed = applyAds(root);
  const names = Object.values(PLACEMENTS).flat().map((p) => p.name).join(', ');
  console.log(`advertenties website: ${ADS_ENABLED ? 'AAN' : 'UIT'} (${names}; ${changed} pagina's bijgewerkt)`);
}
