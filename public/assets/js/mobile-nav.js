/**
 * Jalaram Computers — standalone mobile navigation drawer.
 * Loaded as a plain script (no Firebase/module deps) so the hamburger always works.
 */
(function () {
  'use strict';

  const NAV_LINKS = [
    { href: '/', label: 'Home', key: 'home' },
    { href: '/shop', label: 'Shop', key: 'shop' },
    { href: '/services', label: 'Services', key: 'services' },
    { href: '/about', label: 'About', key: 'about' },
    { href: '/contact', label: 'Contact', key: 'contact' },
    { href: '/cart', label: 'Cart', key: 'cart' },
  ];

  let delegationBound = false;

  function clickPathHasMenuButton(e) {
    const path = e.composedPath ? e.composedPath() : [];
    for (const node of path) {
      if (node && node.id === 'mobile-menu-btn') return node;
      if (node && node.closest && node.closest('#mobile-menu-btn')) return node.closest('#mobile-menu-btn');
    }
    return e.target?.closest?.('#mobile-menu-btn') || null;
  }

  function findMenuButton() {
    return (
      document.getElementById('mobile-menu-btn') ||
      [...document.querySelectorAll('header button, sd-component button')].find((btn) => {
        if (btn.id === 'logout-btn' || btn.id === 'shop-filters-toggle') return false;
        const icon = btn.querySelector('iconify-icon');
        const name = icon?.getAttribute('icon') || '';
        return name.includes('menu');
      }) ||
      document.querySelector('header button.lg\\:hidden, sd-component button.lg\\:hidden')
    );
  }

  function ensureMenuButton() {
    const btn = findMenuButton();
    if (!btn) return null;
    btn.id = 'mobile-menu-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Open menu');
    if (!btn.hasAttribute('aria-expanded')) btn.setAttribute('aria-expanded', 'false');
    if (!btn.dataset.jcMenuBound) {
      btn.dataset.jcMenuBound = 'true';
      const activate = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleDrawer();
      };
      btn.addEventListener('click', activate);
      btn.addEventListener('touchend', activate, { passive: false });
    }
    return btn;
  }

  function getDrawer() {
    return document.getElementById('mobile-nav-drawer');
  }

  function openDrawer() {
    const drawer = getDrawer();
    if (!drawer) return;
    drawer.classList.remove('hidden-drawer');
    drawer.classList.add('active-drawer');
    document.body.style.overflow = 'hidden';
    findMenuButton()?.setAttribute('aria-expanded', 'true');
  }

  function closeDrawer() {
    const drawer = getDrawer();
    if (!drawer) return;
    drawer.classList.remove('active-drawer');
    drawer.classList.add('hidden-drawer');
    document.body.style.overflow = '';
    findMenuButton()?.setAttribute('aria-expanded', 'false');
  }

  function toggleDrawer() {
    const drawer = getDrawer();
    if (!drawer) {
      createDrawer();
      return toggleDrawer();
    }
    if (drawer.classList.contains('active-drawer')) closeDrawer();
    else openDrawer();
  }

  function createDrawer() {
    if (getDrawer()) return;

    const path = window.location.pathname;
    const activeKey = { '/': 'home', '/shop': 'shop', '/services': 'services', '/about': 'about', '/contact': 'contact', '/cart': 'cart' }[path];

    const linksHtml = NAV_LINKS.map((link) => {
      const activeClass = link.key === activeKey ? ' jc-drawer-link--active' : '';
      return `<a href="${link.href}" data-nav="${link.key}" class="jc-drawer-link${activeClass}">${link.label}</a>`;
    }).join('');

    const drawer = document.createElement('div');
    drawer.id = 'mobile-nav-drawer';
    drawer.className = 'fixed inset-0 z-[300] flex justify-end hidden-drawer';
    drawer.innerHTML = `
      <div id="mobile-drawer-backdrop" class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"></div>
      <div id="mobile-nav-drawer-content" class="jc-drawer relative w-80 max-w-[85vw] h-full shadow-2xl flex flex-col z-10 p-6 overflow-y-auto">
        <div class="flex items-center justify-between mb-8 pb-5 border-b border-white/5">
          <a href="/" class="flex items-center gap-3">
            <img src="/assets/images/logo.png" alt="Jalaram Computers" class="h-9 w-auto">
            <span style="font-family:'Playfair Display',serif;font-size:0.85rem;color:#fff;letter-spacing:0.04em;">Jalaram</span>
          </a>
          <button type="button" id="mobile-drawer-close" class="jc-navbar__icon-btn" aria-label="Close menu">
            <iconify-icon icon="lucide:x" class="jc-navbar__icon"></iconify-icon>
          </button>
        </div>
        <div class="mb-5">
          <input type="search" id="mobile-nav-search" placeholder="Search products…" autocomplete="off" aria-label="Search products">
        </div>
        <nav class="flex flex-col" id="mobile-nav-list">
          ${linksHtml}
        </nav>
        <a href="/book-service" class="jc-drawer-cta jc-drawer-cta--gold">Book a Service</a>
        <a href="https://wa.me/919892848643" target="_blank" rel="noopener" class="jc-drawer-cta jc-drawer-cta--whatsapp">
          <iconify-icon icon="mdi:whatsapp"></iconify-icon> WhatsApp Us
        </a>
        <div class="pt-8 mt-auto text-[10px] tracking-[0.2em] text-silver/35 uppercase text-center font-medium">
          Est. Mumbai &middot; ${new Date().getFullYear()}
        </div>
      </div>
    `;

    document.body.appendChild(drawer);

    drawer.querySelector('#mobile-drawer-close')?.addEventListener('click', closeDrawer);
    drawer.querySelector('#mobile-drawer-backdrop')?.addEventListener('click', closeDrawer);
    drawer.querySelectorAll('#mobile-nav-list a').forEach((a) => a.addEventListener('click', closeDrawer));

    const search = drawer.querySelector('#mobile-nav-search');
    if (search) {
      search.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const q = search.value.trim();
          closeDrawer();
          window.location.href = q ? `/shop?search=${encodeURIComponent(q)}` : '/shop';
        }
      });
    }
  }

  function bindDelegation() {
    if (delegationBound) return;
    delegationBound = true;
    const handleMenuActivate = (e) => {
      const btn = clickPathHasMenuButton(e);
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      toggleDrawer();
    };
    document.addEventListener('click', handleMenuActivate, true);
    document.addEventListener('touchend', handleMenuActivate, { capture: true, passive: false });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && getDrawer()?.classList.contains('active-drawer')) closeDrawer();
    });
  }

  function init() {
    ensureMenuButton();
    bindDelegation();
    createDrawer();
  }

  function scheduleInits() {
    init();
    setTimeout(init, 100);
    setTimeout(init, 400);
    setTimeout(init, 1200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleInits);
  } else {
    scheduleInits();
  }

  function observeHeaderChanges() {
    if (!document.body || window.__jcMobileNavObserver) return;
    window.__jcMobileNavObserver = new MutationObserver(() => {
      if (findMenuButton()) ensureMenuButton();
    });
    window.__jcMobileNavObserver.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeHeaderChanges);
  } else {
    observeHeaderChanges();
  }

  window.jcMobileNav = { open: openDrawer, close: closeDrawer, toggle: toggleDrawer, init };
})();
