import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

const PERF_HEAD = [
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
  '<link rel="stylesheet" href="/assets/css/performance.css?v=1" id="jc-perf">',
  '<script src="/assets/js/performance.js?v=1" defer id="jc-perf-js"></script>',
].join('');

function stripSuperdesign(html) {
  let out = html;
  out = out.replace(/<meta name="preview-version"[^>]*>\s*/gi, '');
  out = out.replace(/<meta name="preview-timestamp"[^>]*>\s*/gi, '');
  out = out.replace(/<script type="module">import '\/__visual-edit-bridge\/iframe-runtime\.mjs[^']*';<\/script>/gi, '');
  out = out.replace(/<script src="\/assets\/js\/petite-vue\.iife\.js"><\/script>/gi, '');
  out = out.replace(/<script type="module">[\s\S]*?__SUPERDESIGN_PREVIEW__[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<script type="module">[\s\S]*?\[SDComponent\] Runtime initialized[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<style>\s*body\.sd-ready[\s\S]*?sd-component[\s\S]*?<\/style>/gi, '');
  out = out.replace(/body:not\(\.sd-ready\)\s*\{\s*opacity:\s*0\s*!important;\s*\}/gi, '');
  out = out.replace(/<!-- CINEMATIC PRE-LAUNCH[\s\S]*?id="jalaram-splash"[\s\S]*?<\/script>\s*/gi, '');
  out = out.replace(/<body class="sd-ready">/gi, '<body>');
  return out;
}

function optimizeHtml(html) {
  let out = stripSuperdesign(html);
  out = out.replace(/fonts-inter\.css/g, 'fonts-fast.css');
  out = out.replace(
    /<script src="\/assets\/js\/iconify-icon\.min\.js"><\/script>/gi,
    '<script src="/assets/js/iconify-icon.min.js" defer></script>'
  );
  if (!out.includes('performance.css')) {
    out = out.replace(/<\/head>/i, `${PERF_HEAD}</head>`);
  }
  if (!out.includes('mobile.css')) {
    out = out.replace(
      /<\/head>/i,
      '<link rel="stylesheet" href="/assets/css/mobile.css?v=9" id="jc-mobile"></head>'
    );
  }
  out = out.replace(
    /<meta name="viewport" content="width=device-width, initial-scale=1\.0">/gi,
    '<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">'
  );
  return out;
}

for (const file of fs.readdirSync(publicDir)) {
  if (!file.endsWith('.html')) continue;
  const fp = path.join(publicDir, file);
  const before = fs.readFileSync(fp, 'utf-8');
  const after = optimizeHtml(before);
  if (after !== before) {
    fs.writeFileSync(fp, after, 'utf-8');
    console.log('updated', file);
  }
}

console.log('done');
