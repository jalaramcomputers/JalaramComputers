/* Jalaram Admin — console interactions: theme toggle + live clock. */
(function () {
  'use strict';

  var root = document.documentElement;

  // ── Theme toggle ──────────────────────────────────────────────────────────
  function currentTheme() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function syncThemeLabel() {
    var next = currentTheme() === 'dark' ? 'Light' : 'Dark';
    document.querySelectorAll('.ja-theme-label').forEach(function (el) {
      el.textContent = next;
    });
  }

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem('ja-theme', theme); } catch (e) {}
    syncThemeLabel();
  }

  document.addEventListener('click', function (e) {
    var toggle = e.target.closest('[data-ja-theme-toggle]');
    if (toggle) {
      setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    }
  });

  syncThemeLabel();

  // ── Live clock ────────────────────────────────────────────────────────────
  var clock = document.getElementById('ja-clock');
  if (clock) {
    var tick = function () {
      var d = new Date();
      clock.textContent =
        d.toLocaleDateString('en-US') + '  |  ' + d.toLocaleTimeString('en-US');
    };
    tick();
    setInterval(tick, 1000);
  }
})();
