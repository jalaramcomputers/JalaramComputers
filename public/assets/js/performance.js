(function () {
  'use strict';

  function markLoaded(img) {
    if (img.complete && img.naturalWidth > 0) {
      img.classList.add('jc-loaded');
    } else {
      img.addEventListener('load', () => img.classList.add('jc-loaded'), { once: true });
      img.addEventListener('error', () => img.classList.add('jc-loaded'), { once: true });
    }
  }

  function optimizeImages(root) {
    const scope = root || document;
    const images = scope.querySelectorAll('img');
    images.forEach((img, index) => {
      const inHero = img.closest('#services-hero, #hero-bg-layers');
      const isLogo = img.closest('#nav-home-logo') || img.id === 'nav-home-logo';
      if (!inHero && !isLogo) {
        if (!img.hasAttribute('loading')) img.loading = 'lazy';
        if (!img.hasAttribute('decoding')) img.decoding = 'async';
      } else if (inHero && index > 0) {
        img.loading = 'lazy';
        img.decoding = 'async';
      }
      markLoaded(img);
    });
  }

  function observeNewImages() {
    if (!window.MutationObserver || !document.body) return;
    const obs = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.tagName === 'IMG') markLoaded(node);
          else if (node.querySelectorAll) optimizeImages(node);
        });
      });
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  function boot() {
    if (!document.body) return;
    optimizeImages();
    observeNewImages();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
