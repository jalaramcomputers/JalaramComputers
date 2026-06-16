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

export const NAV_LINK = 'jc-nav-link';
export const NAV_LINK_ACTIVE = 'jc-nav-link jc-nav-link--active';

export function navClass(activeNav: NavKey | null, key: NavKey): string {
  return activeNav === key ? NAV_LINK_ACTIVE : NAV_LINK;
}

export function activeNavForRoute(route: string): NavKey | null {
  return ROUTE_NAV[route] ?? null;
}
