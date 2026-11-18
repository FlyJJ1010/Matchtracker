// Bouwt de webversie en zet hem in /app/ van de site.
// Gebruik (vanuit de site-map):  node _build/webapp/build-webapp.mjs
// App-bron: C:\Projecten\Matchtracker-build (of MT_APP_DIR). NOOIT het Android-project zelf gebruiken.
import { execFileSync } from 'node:child_process';
import { cpSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = resolve(here, '..', '..');
const appRoot = resolve(process.env.MT_APP_DIR || 'C:/Projecten/Matchtracker-build');
const outDir = join(appRoot, 'dist-web');
const target = join(siteRoot, 'app');

if (/[\\/]Matchtracker[\\/]?$/i.test(appRoot)) {
  throw new Error('Weigering: dit is het Android-project. Gebruik een kopie (Matchtracker-build).');
}
if (!existsSync(join(appRoot, 'node_modules'))) {
  throw new Error(`Eerst "npm ci" draaien in ${appRoot}`);
}

const vite = join(appRoot, 'node_modules', 'vite', 'bin', 'vite.js');
execFileSync(process.execPath, [vite, 'build', '--config', join(here, 'vite.web.config.mjs')], {
  cwd: appRoot, // Tailwind van de app zoekt ./index.html en ./src vanaf hier
  stdio: 'inherit',
});

rmSync(target, { recursive: true, force: true });
cpSync(outDir, target, { recursive: true });
console.log(`Webapp gekopieerd naar ${target}:`, readdirSync(target).join(', '));
