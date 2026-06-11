/**
 * Download optimized JPEG hero images (local, fast) from Unsplash source IDs.
 * Usage: node scripts/fetch-hero-jpegs.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const heroDir = path.join(__dirname, '..', 'public', 'assets', 'images', 'hero');
fs.mkdirSync(heroDir, { recursive: true });

const SLIDES = [
  { file: 'instant_support', mobile: 'instant_support_mobile', photo: 'photo-1553877522-43269d4ea984' },
  { file: 'networking_support', mobile: 'networking_support_mobile', photo: 'photo-1558494949-ef010cbdcc31' },
  { file: 'printers_repair', mobile: 'printers_repair_mobile', photo: 'photo-1612815154858-60aa4c59eaa6' },
  { file: 'computer_repair', mobile: 'computer_repair_mobile', photo: 'photo-1593642632823-8f785ba67e45' },
  { file: 'laptop_repair', mobile: 'laptop_repair_mobile', photo: 'photo-1496181130204-755241524eab' },
  { file: 'cctv_installation', mobile: 'cctv_installation_mobile', photo: 'photo-1557597774-9d273605dfa9' },
];

async function download(url, outPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buf);
  return buf.length;
}

for (const slide of SLIDES) {
  const desktopUrl = `https://images.unsplash.com/${slide.photo}?auto=format&fit=crop&w=1280&h=720&q=72&fm=jpg`;
  const mobileUrl = `https://images.unsplash.com/${slide.photo}?auto=format&fit=crop&w=750&h=1200&q=72&fm=jpg`;
  const desktopPath = path.join(heroDir, `${slide.file}.jpg`);
  const mobilePath = path.join(heroDir, `${slide.mobile}.jpg`);
  try {
    const d = await download(desktopUrl, desktopPath);
    const m = await download(mobileUrl, mobilePath);
    console.log(`${slide.file}.jpg ${Math.round(d / 1024)}KB | ${slide.mobile}.jpg ${Math.round(m / 1024)}KB`);
  } catch (err) {
    console.error(`Failed ${slide.file}:`, err.message);
  }
}

console.log('Done.');
