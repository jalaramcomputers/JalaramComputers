import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { activeNavForRoute, type NavKey } from './nav.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PAGES_DIR = path.join(__dirname, '..', 'views', 'pages');

export type PageMeta = {
  title: string;
  bodyClass: string;
  heroPreload: boolean;
  pageCss: string[];
  pageStyles: string | null;
  whatsappFloat: boolean;
  scriptsPartial?: string;
};

export const PAGE_ROUTES: Record<string, string> = {
  '/': 'home',
  '/shop': 'shop',
  '/product': 'product',
  '/cart': 'cart',
  '/checkout': 'checkout',
  '/order-confirmed': 'order-confirmed',
  '/services': 'services',
  '/about': 'about',
  '/contact': 'contact',
  '/account': 'account',
  '/book-service': 'book-service',
};

const metaCache = new Map<string, PageMeta>();

function loadPageMeta(viewName: string): PageMeta {
  if (metaCache.has(viewName)) return metaCache.get(viewName)!;

  const metaPath = path.join(PAGES_DIR, `${viewName}.meta.json`);
  const defaults: PageMeta = {
    title: 'Jalaram Computers',
    bodyClass: 'bg-alabaster text-charcoal font-sans jc-site',
    heroPreload: false,
    pageCss: [],
    pageStyles: null,
    whatsappFloat: false,
  };

  if (!fs.existsSync(metaPath)) {
    metaCache.set(viewName, defaults);
    return defaults;
  }

  const meta = { ...defaults, ...JSON.parse(fs.readFileSync(metaPath, 'utf-8')) } as PageMeta;
  metaCache.set(viewName, meta);
  return meta;
}

export function getPageRenderOptions(route: string) {
  const viewName = PAGE_ROUTES[route];
  if (!viewName) return null;

  const meta = loadPageMeta(viewName);
  const activeNav = activeNavForRoute(route);

  let pageScripts: string | undefined;
  if (meta.scriptsPartial) {
    const scriptsPath = path.join(PAGES_DIR, `${meta.scriptsPartial}.ejs`);
    if (fs.existsSync(scriptsPath)) {
      pageScripts = fs.readFileSync(scriptsPath, 'utf-8');
    }
  }

  return {
    view: `pages/${viewName}`,
    locals: {
      title: meta.title,
      bodyClass: meta.bodyClass,
      heroPreload: meta.heroPreload,
      pageCss: meta.pageCss,
      pageStyles: meta.pageStyles,
      whatsappFloat: meta.whatsappFloat,
      pageScripts,
      activeNav: activeNav as NavKey | null,
    },
  };
}
