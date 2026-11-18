// Maakt /assets/icons.svg: één bestand met alleen de iconen die de site gebruikt.
// Bron: Font Awesome Free 6.4.0 (iconen: CC BY 4.0, https://fontawesome.com/license/free).
import { readFileSync, writeFileSync } from 'node:fs';

const base = 'node_modules/@fortawesome/fontawesome-free/svgs';
const icons = {
  'google-play': 'brands', 'apple': 'brands',
  'circle-info': 'solid', 'arrow-up-from-bracket': 'solid', 'square-plus': 'regular',
  'gavel': 'solid', 'clipboard-user': 'solid', 'users': 'solid', 'people-group': 'solid',
  'futbol': 'solid', 'hockey-puck': 'solid', 'clock': 'solid', 'plus': 'solid',
  'chevron-up': 'solid', 'chevron-down': 'solid', 'right-left': 'solid',
  'envelope': 'solid', 'arrow-left': 'solid', 'triangle-exclamation': 'solid',
  'mobile-screen': 'solid', 'shield-halved': 'solid', 'book-open': 'solid',
};

let out = '<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n' +
  '<!-- Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0) -->\n';
for (const [name, set] of Object.entries(icons)) {
  const svg = readFileSync(`${base}/${set}/${name}.svg`, 'utf8');
  const viewBox = svg.match(/viewBox="([^"]+)"/)[1];
  const paths = svg.replace(/<!--[\s\S]*?-->/g, '').match(/<path[^>]*\/>/g).join('');
  out += `<symbol id="${name}" viewBox="${viewBox}">${paths}</symbol>\n`;
}
out += '</svg>\n';
writeFileSync('assets/icons.svg', out);
console.log(`icons.svg: ${Object.keys(icons).length} iconen`);
