// Zet de app-screenshots uit screenshots-bron/ (niet in git) om naar WebP in assets/img/app/.
// Gebruikt de lokaal geïnstalleerde Chrome/Edge (zoals render-images.mjs): de PNG gaat als data-URL in een
// canvas, wordt verkleind tot max. 720 px breed (2x de weergavebreedte op de site) en als WebP teruggelezen.
// Gebruik: node _build/screens-webp.mjs
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';

const MAP = {
  'scherm-klok': 'voetbal-tijdvak.png',
  'scherm-doelpunt-details': 'voetbal-doelpuntpaneel.png',
  'scherm-tijdstraf': 'hockey-tijdvak.png',
  'scherm-opslaan-verwijderen': 'voetbal-opslaan-of-verwijderen.png',
  'scherm-samenvatting': 'voetbal-samenvatting.png',
  'deel-afbeelding': 'voetbal-afbeelding.png',
};
const MAX_W = 720;
const QUALITY = 0.82;

const browser = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find(existsSync);
if (!browser) throw new Error('Chrome of Edge niet gevonden');
const tmp = mkdtempSync(join(tmpdir(), 'mt-webp-'));
mkdirSync('assets/img/app', { recursive: true });

for (const [name, src] of Object.entries(MAP)) {
  const png = readFileSync(resolve('screenshots-bron', src)).toString('base64');
  const html = `<!doctype html><meta charset="utf-8"><body><pre id="out"></pre><script>
const img = new Image();
img.onload = () => {
  const s = Math.min(1, ${MAX_W} / img.naturalWidth);
  const c = document.createElement('canvas');
  c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
  const g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
  g.drawImage(img, 0, 0, c.width, c.height);
  document.getElementById('out').textContent = c.width + 'x' + c.height + ' ' + c.toDataURL('image/webp', ${QUALITY});
};
img.src = 'data:image/png;base64,${png}';
</script>`;
  const page = join(tmp, name + '.html');
  writeFileSync(page, html);
  const dom = execFileSync(browser, ['--headless=new', '--disable-gpu', `--user-data-dir=${join(tmp, 'profiel')}`,
    '--virtual-time-budget=10000', '--dump-dom', pathToFileURL(page).href], { maxBuffer: 64 * 1024 * 1024 }).toString();
  const m = dom.match(/(\d+)x(\d+) data:image\/webp;base64,([A-Za-z0-9+/=]+)/);
  if (!m) throw new Error(`${name}: geen WebP-uitvoer (browser ondersteunt WebP-encoding niet?)`);
  const out = `assets/img/app/${name}.webp`;
  writeFileSync(out, Buffer.from(m[3], 'base64'));
  console.log(`gemaakt: ${out} (${m[1]}x${m[2]}, ${Math.round(Buffer.from(m[3], 'base64').length / 1024)} kB) uit ${src}`);
}
