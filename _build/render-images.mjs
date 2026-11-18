// Rendert de PNG-iconen, favicon.ico en de deelafbeelding met de lokaal geïnstalleerde Chrome/Edge.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';

const browser = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find(existsSync);
const profile = mkdtempSync(join(tmpdir(), 'mt-render-'));

function shot(url, out, w, h) {
  // Chrome heeft een minimale vensterbreedte: render klein formaat via een schaalfactor.
  const scale = w < 500 ? Math.ceil(500 / w) : 1;
  execFileSync(browser, [`--force-device-scale-factor=${1 / scale}`,'--headless=new', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${profile}`,
    '--default-background-color=00000000', `--window-size=${w * scale},${h * scale}`, `--screenshot=${resolve(out)}`, url], { stdio: 'ignore' });
  console.log('gemaakt:', out);
}
const page = (svg) => pathToFileURL(resolve('_build/size.html')).href + '#' + pathToFileURL(resolve(svg)).href;

shot(page('favicon.svg'), 'assets/img/favicon-32.png', 32, 32);
shot(page('favicon.svg'), 'assets/img/icon-192.png', 192, 192);
shot(page('favicon.svg'), 'assets/img/icon-512.png', 512, 512);
shot(page('_build/logo-full.svg'), 'assets/img/icon-maskable-512.png', 512, 512);
shot(page('_build/logo-full.svg'), 'apple-touch-icon.png', 180, 180);
shot(pathToFileURL(resolve('_build/og.html')).href, 'assets/img/og-image.png', 1200, 630);

// favicon.ico = PNG van 32x32 in een ICO-verpakking
const png = readFileSync('assets/img/favicon-32.png');
const ico = Buffer.alloc(22);
ico.writeUInt16LE(0, 0); ico.writeUInt16LE(1, 2); ico.writeUInt16LE(1, 4);
ico.writeUInt8(32, 6); ico.writeUInt8(32, 7); ico.writeUInt16LE(1, 10); ico.writeUInt16LE(32, 12);
ico.writeUInt32LE(png.length, 14); ico.writeUInt32LE(22, 18);
writeFileSync('favicon.ico', Buffer.concat([ico, png]));
console.log('gemaakt: favicon.ico');
