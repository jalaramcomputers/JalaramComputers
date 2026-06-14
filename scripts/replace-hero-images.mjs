/**
 * Replace specific hero images with new Unsplash photos, keeping the same
 * filenames/references. Regenerates jpg + webp (desktop + mobile) for each.
 * Run: node scripts/replace-hero-images.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HERO_DIR = path.join(__dirname, '..', 'public', 'assets', 'images', 'hero');

// New photo IDs (different from the originals) for these two slides.
const REPLACEMENTS = [
  { file: 'cctv_installation', candidates: ['photo-1590856029826-c7a73142bbf1'] },
];

async function fetchPhoto(candidates) {
  for (const id of candidates) {
    const url = `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1920&h=1080&q=80&fm=jpg`;
    try {
      const res = await fetch(url);
      if (res.ok) {
        console.log(`  fetched ${id}`);
        return Buffer.from(await res.arrayBuffer());
      }
      console.warn(`  ${res.status} for ${id}, trying next`);
    } catch (e) {
      console.warn(`  error for ${id}: ${e.message}`);
    }
  }
  throw new Error('all candidates failed');
}

async function writeVariant(input, outPath, width, height, format) {
  let pipeline = sharp(input).rotate().resize(width, height, { fit: 'cover', withoutEnlargement: true });
  pipeline = format === 'jpg'
    ? pipeline.jpeg({ quality: 78, mozjpeg: true })
    : pipeline.webp({ quality: 76 });
  const tmp = `${outPath}.tmp`;
  await pipeline.toFile(tmp);
  fs.renameSync(tmp, outPath);
  console.log(`  ${path.basename(outPath)} → ${Math.round(fs.statSync(outPath).size / 1024)} KB`);
}

for (const { file, candidates } of REPLACEMENTS) {
  console.log(`\n${file}`);
  const input = await fetchPhoto(candidates);
  await writeVariant(input, path.join(HERO_DIR, `${file}.jpg`), 1600, 900, 'jpg');
  await writeVariant(input, path.join(HERO_DIR, `${file}.webp`), 1600, 900, 'webp');
  await writeVariant(input, path.join(HERO_DIR, `${file}_mobile.jpg`), 800, 520, 'jpg');
  await writeVariant(input, path.join(HERO_DIR, `${file}_mobile.webp`), 800, 520, 'webp');
}

console.log('\nDone.');
