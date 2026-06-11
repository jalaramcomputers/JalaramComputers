import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

const DRAFT_ROUTES = {
  'f7e4c6a0-87e7-47fc-911b-bfa27489b88b': '/',
  '5c473e81-1a65-4639-91d8-15f5f4d65e1d': '/shop',
  'a9afe14c-897a-4d67-a3c3-f4bc987e5d42': '/product',
  '18c4be18-b393-429f-b284-37d56f69bb36': '/cart',
  '93544c81-424b-4e97-b308-0398e2a0ec47': '/checkout',
  '5873d4b7-b6d8-4ab1-b3d1-2ce455d6685f': '/order-confirmed',
};

const HASH_PAGE_ROUTES = {
  '#services': '/services',
  '#about': '/about',
  '#contact': '/contact',
};

const HOME_HASHES = new Set([
  '#blog', '#faq',
  '#privacy', '#terms', '#refund', '#home',
  '#computer-repair', '#laptop-repair', '#networking',
  '#cctv', '#remote-support', '#printer-services',
]);

function resolveUrl(match) {
  for (const [id, route] of Object.entries(DRAFT_ROUTES)) {
    if (!match.includes(id)) continue;

    const hashMatch = match.match(/#([a-z0-9-]+)/i);
    const hash = hashMatch ? `#${hashMatch[1]}` : '';

    if (hash && HASH_PAGE_ROUTES[hash]) {
      return HASH_PAGE_ROUTES[hash];
    }
    if (hash && (route === '/' || HOME_HASHES.has(hash))) {
      return `/${hash}`;
    }
    if (hash && route !== '/') {
      return route;
    }
    return route;
  }
  return match;
}

function fixContent(html) {
  let out = html;

  // SuperDesign absolute URLs (with optional query + hash)
  out = out.replace(
    /https:\/\/(?:draft-[a-f0-9-]+\.preview\.superdesign\.dev|p\.superdesign\.dev\/draft\/[a-f0-9-]+)[^"'\s>]*/gi,
    (m) => resolveUrl(m)
  );

  // Legacy .html filenames
  out = out.replace(/(?:\.\/)?f7e4c6a0-87e7-47fc-911b-bfa27489b88b\.html/g, '/');
  out = out.replace(/(?:\.\/)?5c473e81-1a65-4639-91d8-15f5f4d65e1d\.html/g, '/shop');
  out = out.replace(/(?:\.\/)?a9afe14c-897a-4d67-a3c3-f4bc987e5d42\.html/g, '/product');
  out = out.replace(/(?:\.\/)?18c4be18-b393-429f-b284-37d56f69bb36\.html/g, '/cart');
  out = out.replace(/(?:\.\/)?93544c81-424b-4e97-b308-0398e2a0ec47\.html/g, '/checkout');
  out = out.replace(/(?:\.\/)?5873d4b7-b6d8-4ab1-b3d1-2ce455d6685f\.html/g, '/order-confirmed');

  // Broken lone hashes on shop page footers
  out = out.replace(/href="\/shop#(services|about|contact|blog|faq)"/g, 'href="/#$1"');

  // Nav defaults
  out = out.replace(/id="nav-home-logo"[^>]*href="[^"]*"/, 'id="nav-home-logo" href="/"');
  out = out.replace(/id="nav-home-link"[^>]*href="[^"]*"/, 'id="nav-home-link" href="/"');
  out = out.replace(/id="nav-shop-link"[^>]*href="[^"]*"/, 'id="nav-shop-link" href="/shop"');
  out = out.replace(/id="nav-services-link"[^>]*href="[^"]*"/, 'id="nav-services-link" href="/services"');
  out = out.replace(/id="nav-about-link"[^>]*href="[^"]*"/, 'id="nav-about-link" href="/about"');
  out = out.replace(/id="footer-about"[^>]*href="[^"]*"/, 'id="footer-about" href="/about"');
  out = out.replace(/href="\/#about"/g, 'href="/about"');
  out = out.replace(/id="hero-services-btn"[^>]*href="[^"]*"/, 'id="hero-services-btn" href="/services"');
  out = out.replace(/id="footer-services"[^>]*href="[^"]*"/, 'id="footer-services" href="/services"');
  out = out.replace(/href="\/#services"/g, 'href="/services"');
  out = out.replace(/id="nav-about-link"[^>]*href="[^"]*"/, 'id="nav-about-link" href="/#about"');
  out = out.replace(/id="nav-contact-link"[^>]*href="[^"]*"/, 'id="nav-contact-link" href="/contact"');
  out = out.replace(/id="footer-contact"[^>]*href="[^"]*"/, 'id="footer-contact" href="/contact"');
  out = out.replace(/href="\/#contact"/g, 'href="/contact"');
  out = out.replace(/id="nav-cart-link"[^>]*href="[^"]*"/, 'id="nav-cart-link" href="/cart"');

  // Remove blog/faq from nav (minimal)
  out = out.replace(/<a id="nav-blog-link"[^>]*>[\s\S]*?<\/a>/g, '');
  out = out.replace(/<a id="nav-faq-link"[^>]*>[\s\S]*?<\/a>/g, '');

  // Footer hash-based service links → /services
  out = out.replace(/href="\/#computer-repair"/g, 'href="/services"');
  out = out.replace(/href="\/#laptop-repair"/g, 'href="/services"');
  out = out.replace(/href="\/#networking"/g, 'href="/services"');
  out = out.replace(/href="\/#cctv"/g, 'href="/services"');
  out = out.replace(/href="\/#remote-support"/g, 'href="/services"');
  out = out.replace(/href="\/#printer-services"/g, 'href="/services"');

  // Footer hash-based quick links without dedicated pages
  out = out.replace(/href="\/#blog"/g, 'href="/shop"');
  out = out.replace(/href="\/#faq"/g, 'href="/contact"');
  out = out.replace(/href="\/#home"/g, 'href="/"');

  // Footer policy links (no dedicated policy pages yet)
  out = out.replace(/href="\/#privacy"/g, 'href="/contact"');
  out = out.replace(/href="\/#terms"/g, 'href="/contact"');
  out = out.replace(/href="\/#refund"/g, 'href="/contact"');

  // Footer social icon anchors (with id) pointing to wrong URLs → WhatsApp
  out = out.replace(
    /(id="footer-(?:facebook|instagram|twitter|youtube)"[^>]*href=")[^"]*"/g,
    '$1https://wa.me/919892848643" target="_blank" rel="noopener"'
  );
  // Footer social icon anchors without id (shop/cart/checkout/product/order-confirmed pages)
  out = out.replace(
    /(<a class="w-9 h-9 border border-silver\/15[^>]*href=")\/(?:shop|cart|checkout|product|order-confirmed)"/g,
    '$1https://wa.me/919892848643" target="_blank" rel="noopener"'
  );

  return out;
}

for (const file of fs.readdirSync(publicDir).filter((f) => f.endsWith('.html'))) {
  const filePath = path.join(publicDir, file);
  const fixed = fixContent(fs.readFileSync(filePath, 'utf-8'));
  fs.writeFileSync(filePath, fixed, 'utf-8');
  console.log(`Fixed URLs in ${file}`);
}
