/**
 * Jalaram Computers — header search + expandable search field
 */
(function () {
  'use strict';

  function bindSearch(input) {
    if (!input || input.dataset.jcSearchBound) return;
    input.dataset.jcSearchBound = 'true';
    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const q = input.value.trim();
      window.location.href = q ? `/shop?search=${encodeURIComponent(q)}` : '/shop';
    });
  }

  function bindSearchToggle() {
    const wrap = document.getElementById('header-search-wrap');
    const toggle = document.getElementById('header-search-toggle');
    const input = document.getElementById('header-search');
    if (!wrap || !toggle || !input || toggle.dataset.jcToggleBound) return;
    toggle.dataset.jcToggleBound = 'true';

    toggle.addEventListener('click', () => {
      const open = wrap.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        input.focus();
      } else {
        input.value = '';
      }
    });

    document.addEventListener('click', (e) => {
      if (!wrap.classList.contains('is-open')) return;
      if (wrap.contains(e.target)) return;
      wrap.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && wrap.classList.contains('is-open')) {
        wrap.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        input.blur();
      }
    });
  }

  function bindScrollState() {
    const header = document.getElementById('site-header');
    if (!header || header.dataset.jcScrollBound) return;
    header.dataset.jcScrollBound = 'true';

    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 12);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function init() {
    bindSearch(document.getElementById('header-search'));
    document.querySelectorAll('.search-input:not([data-jc-search-bound])').forEach((el) => {
      if (el.id !== 'mobile-nav-search') bindSearch(el);
    });
    bindSearchToggle();
    bindScrollState();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
