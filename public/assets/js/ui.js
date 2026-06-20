/* Jalaram Computers — shared UI behaviour: splash + mobile drawer. */

/* ── Splash ── */
function initSplash() {
  const splash = document.getElementById('jc-splash');
  if (!splash) return;
  document.body.classList.add('jc-splash-active');

  const dismiss = () => {
    splash.classList.add('is-hidden');
    document.body.classList.remove('jc-splash-active');
    sessionStorage.setItem('jc-splash-seen', '1');
    setTimeout(() => splash.remove(), 700);
  };

  // Already seen this session → skip the wait.
  if (sessionStorage.getItem('jc-splash-seen')) {
    splash.style.transition = 'none';
    dismiss();
    return;
  }

  const skip = document.getElementById('jc-splash-skip');
  if (skip) skip.addEventListener('click', dismiss);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  setTimeout(dismiss, reduce ? 400 : 2900);
}

/* ── Mobile drawer ── */
function initDrawer() {
  const btn = document.getElementById('mobile-menu-btn');
  const drawer = document.getElementById('mobile-drawer');
  if (!btn || !drawer) return;

  const open = () => {
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    btn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('jc-drawer-open');
  };
  const close = () => {
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    btn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('jc-drawer-open');
  };

  btn.addEventListener('click', open);
  drawer.querySelectorAll('[data-drawer-close]').forEach((el) => el.addEventListener('click', close));
  drawer.querySelectorAll('.jc-drawer__nav a').forEach((a) => a.addEventListener('click', close));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}

function init() { initSplash(); initDrawer(); }

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
