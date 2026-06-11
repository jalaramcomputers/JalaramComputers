/**
 * Compress hero images → optimized JPG + WebP (desktop + mobile).
 * Run: node scripts/optimize-hero-images.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HERO_DIR = path.join(__dirname, '..', 'public', 'assets', 'images', 'hero');

const SLIDES = [
  'instant_support',
  'networking_support',
  'printers_repair',
  'computer_repair',
  'laptop_repair',
  'cctv_installation',
];

function findSource(id) {
  const png = path.join(HERO_DIR, `${id}.png`);
  const jpg = path.join(HERO_DIR, `${id}.jpg`);
  if (fs.existsSync(png)) {
    const pngSize = fs.statSync(png).size;
    const jpgSize = fs.existsSync(jpg) ? fs.statSync(jpg).size : Infinity;
    return pngSize > jpgSize * 1.5 ? png : (fs.existsSync(jpg) ? jpg : png);
  }
  return fs.existsSync(jpg) ? jpg : null;
}

async function writeVariant(src, outPath, width, height, format) {
  const input = fs.readFileSync(src);
  let pipeline = sharp(input).rotate().resize(width, height, { fit: 'cover', withoutEnlargement: true });
  if (format === 'jpg') {
    pipeline = pipeline.jpeg({ quality: 78, mozjpeg: true });
  } else {
    pipeline = pipeline.webp({ quality: 76 });
  }
  const tmp = `${outPath}.tmp`;
  await pipeline.toFile(tmp);
  fs.renameSync(tmp, outPath);
  const kb = Math.round(fs.statSync(outPath).size / 1024);
  console.log(`  ${path.basename(outPath)} → ${kb} KB`);
}

for (const id of SLIDES) {
  const src = findSource(id);
  if (!src) {
    console.warn(`Skip ${id}: no source image`);
    continue;
  }
  console.log(`\n${id} ← ${path.basename(src)}`);
  await writeVariant(src, path.join(HERO_DIR, `${id}.jpg`), 1600, 900, 'jpg');
  await writeVariant(src, path.join(HERO_DIR, `${id}.webp`), 1600, 900, 'webp');
  await writeVariant(src, path.join(HERO_DIR, `${id}_mobile.jpg`), 800, 520, 'jpg');
  await writeVariant(src, path.join(HERO_DIR, `${id}_mobile.webp`), 800, 520, 'webp');
}

console.log('\nDone.');
