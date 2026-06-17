export type NavKey = 'home' | 'shop' | 'services' | 'about' | 'contact';

export const NAV_LINKS: { key: NavKey; href: string; label: string; id: string }[] = [
  { key: 'home', href: '/', label: 'Home', id: 'nav-home-link' },
  { key: 'shop', href: '/shop', label: 'Shop', id: 'nav-shop-link' },
  { key: 'services', href: '/services', label: 'Services', id: 'nav-services-link' },
  { key: 'about', href: '/about', label: 'About', id: 'nav-about-link' },
  { key: 'contact', href: '/contact', label: 'Contact', id: 'nav-contact-link' },
];

export const ROUTE_NAV: Record<string, NavKey | null> = {
  '/': 'home',
  '/shop': 'shop',
  '/product': 'shop',
  '/services': 'services',
  '/about': 'about',
  '/contact': 'contact',
  '/book-service': 'services',
  '/cart': null,
  '/checkout': null,
  '/order-confirmed': null,
  '/account': null,
};

const NAV_BASE = 'text-sm tracking-widest uppercase font-medium transition-colors duration-500';
export const NAV_INACTIVE = `text-silver hover:text-accent ${NAV_BASE}`;
export const NAV_ACTIVE = `text-white border-b border-accent pb-1 ${NAV_BASE}`;

export function navClass(activeNav: NavKey | null, key: NavKey): string {
  return activeNav === key ? NAV_ACTIVE : NAV_INACTIVE;
}

export function activeNavForRoute(route: string): NavKey | null {
  return ROUTE_NAV[route] ?? null;
}
