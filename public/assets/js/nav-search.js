/**
 * Jalaram Computers — header search wiring
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

  function init() {
    bindSearch(document.getElementById('header-search'));
    document.querySelectorAll('.search-input:not([data-jc-search-bound])').forEach((el) => {
      if (el.id !== 'mobile-nav-search') bindSearch(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
