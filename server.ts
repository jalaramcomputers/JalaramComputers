import compression from 'compression';
import express from 'express';
import expressLayouts from 'express-ejs-layouts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { NAV_LINKS, navClass } from './lib/nav.js';
import { getPageRenderOptions, PAGE_ROUTES } from './lib/pages.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PUBLIC_DIR = path.join(__dirname, 'public');
const VIEWS_DIR = path.join(__dirname, 'views');
const PORT = Number(process.env.PORT) || 3000;

app.use(compression({ threshold: 1024 }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', VIEWS_DIR);
app.use(expressLayouts);
app.set('layout', 'layout');

app.use((_req, res, next) => {
  res.locals.navLinks = NAV_LINKS;
  res.locals.navClass = navClass;
  next();
});

const htmlToCleanRoute: Record<string, string> = {
  'index.html': '/',
  'shop.html': '/shop',
  'product.html': '/product',
  'cart.html': '/cart',
  'checkout.html': '/checkout',
  'order-confirmed.html': '/order-confirmed',
  'services.html': '/services',
  'about.html': '/about',
  'contact.html': '/contact',
  'account.html': '/account',
  'admin.html': '/admin',
  'book-service.html': '/book-service',
};

app.use((req, res, next) => {
  const lowerPath = req.path.toLowerCase();
  if (req.path !== lowerPath && PAGE_ROUTES[lowerPath]) {
    const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    return res.redirect(301, lowerPath + queryString);
  }
  next();
});

app.use((req, res, next) => {
  const filename = req.path.startsWith('/') ? req.path.slice(1) : req.path;
  if (htmlToCleanRoute[filename]) {
    const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    return res.redirect(301, htmlToCleanRoute[filename] + queryString);
  }
  next();
});

function stripSuperdesignDevScripts(html: string): string {
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

function processAdminHtml(content: string): string {
  let html = stripSuperdesignDevScripts(content);
  html = html.replace(/fonts-inter\.css/g, 'fonts-fast.css');
  if (!html.includes('cart-system.js')) {
    html = html.replace(
      /<\/body>/i,
      '<script type="module" src="/assets/js/cart-system.js" id="sd-interceptor"></script></body>',
    );
  }
  return html;
}

const HERO_IMAGE_FALLBACKS: Record<string, string> = {
  'instant_support.jpg': 'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1280&h=720&q=72&fm=jpg',
  'instant_support_mobile.jpg': 'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=750&h=1200&q=72&fm=jpg',
  'networking_support.jpg': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1280&h=720&q=72&fm=jpg',
  'networking_support_mobile.jpg': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=750&h=1200&q=72&fm=jpg',
  'printers_repair.jpg': 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=1280&h=720&q=72&fm=jpg',
  'printers_repair_mobile.jpg': 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=750&h=1200&q=72&fm=jpg',
  'computer_repair.jpg': 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1280&h=720&q=72&fm=jpg',
  'computer_repair_mobile.jpg': 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=750&h=1200&q=72&fm=jpg',
  'laptop_repair.jpg': 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1280&h=720&q=72&fm=jpg',
  'laptop_repair_mobile.jpg': 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=750&h=1200&q=72&fm=jpg',
  'cctv_installation.jpg': 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=1280&h=720&q=72&fm=jpg',
  'cctv_installation_mobile.jpg': 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=750&h=1200&q=72&fm=jpg',
};

function heroLocalCandidates(file: string): string[] {
  const base = file.replace(/\.(webp|jpg|jpeg|png)$/i, '');
  const ext = path.extname(file).toLowerCase();
  const names = new Set<string>([file]);
  if (ext === '.webp') {
    names.add(`${base}.webp`);
    names.add(`${base}.jpg`);
    names.add(`${base.replace(/-/g, '_')}.webp`);
    names.add(`${base.replace(/-/g, '_')}.jpg`);
    names.add(`${base.replace(/_/g, '-')}.webp`);
    names.add(`${base.replace(/_/g, '-')}.jpg`);
  }
  return [...names];
}

app.get('/assets/images/hero/:file', (req, res) => {
  const file = req.params.file;
  for (const candidate of heroLocalCandidates(file)) {
    const local = path.join(PUBLIC_DIR, 'assets/images/hero', candidate);
    if (fs.existsSync(local)) {
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      return res.sendFile(local);
    }
  }
  const jpgFallback = HERO_IMAGE_FALLBACKS[file]
    || (file.endsWith('.webp') ? HERO_IMAGE_FALLBACKS[file.replace(/\.webp$/i, '.jpg')] : null)
    || (file.endsWith('.webp') ? HERO_IMAGE_FALLBACKS[file.replace(/\.webp$/i, '.jpg').replace(/-/g, '_')] : null);
  if (jpgFallback) return res.redirect(302, jpgFallback);
  const pngAsJpg = file.endsWith('.jpg') ? HERO_IMAGE_FALLBACKS[file.replace('.jpg', '.png')] : null;
  if (pngAsJpg) return res.redirect(302, pngAsJpg);
  res.status(404).end();
});

for (const route of Object.keys(PAGE_ROUTES)) {
  app.get(route, (req, res, next) => {
    const options = getPageRenderOptions(route);
    if (!options) {
      res.status(404).send('Page not found');
      return;
    }
    res.render(options.view, options.locals, (err, html) => {
      if (err) return next(err);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.send(html);
    });
  });
}

app.get('/admin', (_req, res) => {
  const filePath = path.join(PUBLIC_DIR, 'admin.html');
  if (!fs.existsSync(filePath)) {
    res.status(404).send('Admin page not found');
    return;
  }
  const html = processAdminHtml(fs.readFileSync(filePath, 'utf-8'));
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.send(html);
});

app.use(express.static(PUBLIC_DIR, {
  maxAge: '7d',
  etag: true,
  index: false,
  setHeaders(res, filePath) {
    if (/\.(webp|jpg|jpeg|png|gif|svg|ico|woff2?)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (/\.(css|js)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=604800');
    }
  },
}));

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).send('Something went wrong rendering this page.');
});

const server = app.listen(PORT, () => {
  console.log(`Jalaram Computers server listening on http://localhost:${PORT}`);
  console.log('Rendering pages with EJS templates (shared header/footer partials)');
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nPort ${PORT} is already in use.`);
    console.error('Another dev server is likely already running — open http://localhost:3000');
    console.error('To restart, stop the other process first (PowerShell):');
    console.error(`  Get-NetTCPConnection -LocalPort ${PORT} -State Listen | Select OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }\n`);
    process.exit(1);
  }
  throw err;
});
