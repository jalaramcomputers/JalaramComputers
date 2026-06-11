/**
 * Compress mobile hero PNGs to JPEG for faster mobile loading.
 * Usage: node scripts/compress-hero-mobile.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const heroDir = path.join(__dirname, '..', 'public', 'assets', 'images', 'hero');

const files = fs.readdirSync(heroDir).filter((f) => f.endsWith('_mobile.png'));

function compressWithMagick(input, output) {
  execSync(`magick "${input}" -resize 900x1600^ -gravity center -extent 900x1600 -quality 82 "${output}"`, { stdio: 'pipe' });
}

let ok = 0;
for (const file of files) {
  const input = path.join(heroDir, file);
  const output = path.join(heroDir, file.replace('_mobile.png', '_mobile.jpg'));
  try {
    compressWithMagick(input, output);
    const before = fs.statSync(input).size;
    const after = fs.statSync(output).size;
    console.log(`${file} → ${path.basename(output)} (${Math.round(before / 1024)}KB → ${Math.round(after / 1024)}KB)`);
    ok++;
  } catch {
    console.warn(`Skip ${file} (ImageMagick not installed)`);
  }
}

if (ok === 0) {
  console.log('No images compressed. Install ImageMagick or use desktop hero images on mobile.');
} else {
  console.log(`Compressed ${ok} mobile hero image(s).`);
}
