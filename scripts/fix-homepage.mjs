import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const indexPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'index.html');
let html = fs.readFileSync(indexPath, 'utf-8');

// Remove SuperDesign / SDComponent dev runtime
html = html.replace(/<meta name="preview-version"[^>]*>\s*/gi, '');
html = html.replace(/<meta name="preview-timestamp"[^>]*>\s*/gi, '');
html = html.replace(/<style>\s*body\.sd-ready[\s\S]*?sd-component[\s\S]*?<\/style>\s*/gi, '');
html = html.replace(/<script type="module">[\s\S]*?\[SDComponent\] Runtime initialized[\s\S]*?<\/script>\s*/gi, '');

// Remove cinematic splash overlay (blocks homepage on desktop)
html = html.replace(/<!-- CINEMATIC PRE-LAUNCH[\s\S]*?<\/script>\s*\n\s*\n<div class="min-h-screen/s, '\n<div class="min-h-screen');

// Ensure production CSS bundle in head
if (!html.includes('minimal.css')) {
  html = html.replace(
    /<link href="\/assets\/css\/fonts-fast\.css" rel="stylesheet">/i,
    '<link href="/assets/css/fonts-fast.css" rel="stylesheet">\n<link rel="stylesheet" href="/assets/css/minimal.css" id="jc-minimal">'
  );
}

// Hero: default subtitle so page isn't blank before JS
html = html.replace(
  /<p id="hero-subtitle" class="text-sm sm:text-base md:text-lg leading-relaxed mt-3 md:mt-4"><\/p>/,
  '<p id="hero-subtitle" class="text-sm sm:text-base md:text-lg leading-relaxed mt-3 md:mt-4">Remote &amp; on-site IT help — same-day response for urgent issues</p>'
);

// Fix title encoding
html = html.replace(/JALARAM COMPUTERS \?/g, 'JALARAM COMPUTERS —');

// Ensure body starts clean
html = html.replace(/<body class="sd-ready">/, '<body>');

fs.writeFileSync(indexPath, html, 'utf-8');
console.log('Homepage cleaned:', indexPath);
