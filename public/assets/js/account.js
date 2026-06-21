/* Account portal — sign in / register / order history (Django session auth). */
import { authMe, authLogin, authRegister, authLogout, getMyOrders, formatINR } from './api.js';
import { esc } from './products.js';

const root = document.getElementById('account-root');
const profileDot = document.getElementById('header-profile-dot');
const googleOAuthEnabled = root?.dataset.googleOauth === '1';

const GOOGLE_ERRORS = {
  config: 'Google sign-in is not configured on the server yet.',
  csrf: 'Google sign-in session expired. Please try again.',
  missing: 'Google did not return a sign-in token. Please try again.',
  token: 'Google could not complete sign-in. Check GOOGLE_OAUTH_CLIENT_SECRET in Railway matches Google Console.',
  verify: 'Google sign-in token could not be verified. Check GOOGLE_OAUTH_CLIENT_ID matches your OAuth client.',
  invalid: 'Google sign-in could not be completed. Please try again.',
  denied: 'Google sign-in was cancelled.',
};

const GOOGLE_BTN = `<a href="/account/google/start/" class="jc-btn jc-btn--google jc-btn--block">
  <svg class="jc-btn__g-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
  Continue with Google
</a>`;

function showPanelError(panelId, message) {
  const err = document.getElementById(`${panelId}-error`);
  if (err) err.textContent = message || '';
}

function switchAuthTab(tab) {
  const loginPanel = document.getElementById('login-panel');
  const registerPanel = document.getElementById('register-panel');
  const isLogin = tab === 'login';
  if (loginPanel) loginPanel.hidden = !isLogin;
  if (registerPanel) registerPanel.hidden = isLogin;
  root.querySelectorAll('.jc-auth__tabs button').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.tab === tab);
  });
  showPanelError('login', '');
  showPanelError('register', '');
}

function initials(user) {
  const name = user.displayName || user.email || 'U';
  return name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function setProfileDot(active) {
  if (!profileDot) return;
  profileDot.hidden = !active;
}

function statusTone(status) {
  const s = (status || '').toLowerCase();
  if (s.includes('paid') || s.includes('deliver')) return 'ok';
  if (s.includes('cancel') || s.includes('fail')) return 'err';
  return 'pending';
}

function googlePanelBlock() {
  if (!googleOAuthEnabled) return '';
  return `<div class="jc-auth__divider"><span>or</span></div>
    <div class="jc-auth__google">${GOOGLE_BTN}</div>`;
}

function authView(googleError = '') {
  setProfileDot(false);
  root.innerHTML = `<div class="jc-account__card jc-auth">
    <div class="jc-auth__brand">
      <div class="jc-auth__brand-top">
        <img src="/assets/images/logo.png?v=3" alt="" class="jc-auth__logo" width="120" height="48">
        <div>
          <strong>Jalaram Computers</strong>
          <span>Mumbai's trusted IT partner</span>
        </div>
      </div>
      <ul class="jc-auth__features">
        <li><iconify-icon icon="lucide:package"></iconify-icon> Track orders</li>
        <li><iconify-icon icon="lucide:zap"></iconify-icon> Quick checkout</li>
        <li><iconify-icon icon="lucide:tag"></iconify-icon> Member deals</li>
      </ul>
    </div>
    <div class="jc-auth__tabs">
      <button type="button" class="is-active" data-tab="login">Sign In</button>
      <button type="button" data-tab="register">Create Account</button>
    </div>
    <div id="login-panel" class="jc-auth__panel">
      <form id="login-form" class="jc-auth__form">
        <div class="jc-field"><label for="li-email">Email Address</label><input id="li-email" type="email" placeholder="you@example.com" autocomplete="email" required></div>
        <div class="jc-field"><label for="li-pass">Password</label><input id="li-pass" type="password" placeholder="••••••••" autocomplete="current-password" required></div>
        <p class="jc-auth__error" id="login-error">${esc(googleError)}</p>
        <button type="submit" class="jc-btn jc-btn--navy jc-btn--block" id="login-submit">Sign In</button>
      </form>
      ${googlePanelBlock()}
    </div>
    <div id="register-panel" class="jc-auth__panel" hidden>
      <form id="register-form" class="jc-auth__form">
        <div class="jc-field"><label for="rg-name">Full Name</label><input id="rg-name" type="text" placeholder="e.g. Rajesh Gohil" autocomplete="name" required></div>
        <div class="jc-field"><label for="rg-email">Email Address</label><input id="rg-email" type="email" placeholder="you@example.com" autocomplete="email" required></div>
        <div class="jc-field"><label for="rg-pass">Password <span class="jc-auth__hint">(min. 6 characters)</span></label><input id="rg-pass" type="password" placeholder="••••••••" autocomplete="new-password" required></div>
        <p class="jc-auth__error" id="register-error"></p>
        <button type="submit" class="jc-btn jc-btn--accent jc-btn--block" id="register-submit">Create Account</button>
      </form>
      ${googlePanelBlock()}
    </div>
    <p class="jc-auth__terms">By continuing you agree to our terms &amp; privacy policy.</p>
  </div>`;

  root.querySelectorAll('.jc-auth__tabs button').forEach((btn) => {
    btn.addEventListener('click', () => switchAuthTab(btn.dataset.tab));
  });

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = document.getElementById('login-error');
    const btn = document.getElementById('login-submit');
    err.textContent = '';
    btn.disabled = true;
    btn.textContent = 'Signing in…';
    try {
      const user = await authLogin(document.getElementById('li-email').value.trim(), document.getElementById('li-pass').value);
      dashboard(user);
    } catch (ex) {
      err.textContent = (ex && ex.message) || 'Sign in failed.';
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  });

  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = document.getElementById('register-error');
    const btn = document.getElementById('register-submit');
    const pw = document.getElementById('rg-pass').value;
    err.textContent = '';
    if (pw.length < 6) {
      err.textContent = 'Password must be at least 6 characters.';
      return;
    }
    btn.disabled = true;
    btn.textContent = 'Creating account…';
    try {
      const user = await authRegister(
        document.getElementById('rg-email').value.trim(),
        pw,
        document.getElementById('rg-name').value.trim(),
      );
      dashboard(user);
    } catch (ex) {
      err.textContent = (ex && ex.message) || 'Could not create account.';
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  });
}

function orderCard(o) {
  const tone = statusTone(o.status);
  const itemCount = (o.items || []).length;
  return `<article class="jc-order">
    <div class="jc-order__head">
      <div>
        <span class="jc-order__id">#${esc(o.orderId)}</span>
        <span class="jc-order__date">${esc(o.date || '')}</span>
      </div>
      <span class="jc-order__status jc-order__status--${tone}">${esc(o.status || 'Processing')}</span>
    </div>
    <div class="jc-order__body">
      <span>${itemCount} item${itemCount === 1 ? '' : 's'}</span>
      <span class="jc-order__total">${formatINR(o.total)}</span>
    </div>
    <div class="jc-order__actions">
      <a href="/order-confirmed?id=${encodeURIComponent(o.orderId)}" class="jc-btn jc-btn--ghost jc-btn--sm">View Details</a>
      <button type="button" class="jc-btn jc-btn--navy jc-btn--sm" data-invoice="${esc(o.orderId)}">Download Invoice</button>
    </div>
  </article>`;
}

async function dashboard(user) {
  setProfileDot(true);
  const name = esc(user.displayName || user.email.split('@')[0]);
  const ownerBanner = user.isStaff ? `<div class="jc-account__owner">
    <div><strong>Shop Owner Access</strong><p>Manage products, orders and store settings.</p></div>
    <a href="/admin" class="jc-btn jc-btn--ghost jc-btn--sm">Open Admin Console</a>
  </div>` : '';

  root.innerHTML = `<div class="jc-account__card jc-account__dash">
    <div class="jc-account__profile">
      <div class="jc-account__profile-main">
        <div class="jc-avatar">${esc(initials(user))}</div>
        <div>
          <h2>${name}</h2>
          <p>${esc(user.email)}</p>
        </div>
      </div>
      <button type="button" id="logout-btn" class="jc-account__signout">Sign Out</button>
    </div>
    <div class="jc-account__orders">
      <h3 class="jc-account__h"><iconify-icon icon="lucide:package"></iconify-icon> My Orders</h3>
      <div id="account-orders"><div class="jc-empty"><iconify-icon icon="lucide:loader-2" class="jc-spin"></iconify-icon><p>Loading orders…</p></div></div>
      ${ownerBanner}
    </div>
  </div>`;

  document.getElementById('logout-btn').addEventListener('click', async () => {
    await authLogout();
    authView();
  });

  const box = document.getElementById('account-orders');
  try {
    const orders = await getMyOrders();
    orders.sort((a, b) => String(b.orderId).localeCompare(String(a.orderId)));
    if (!orders.length) {
      box.innerHTML = `<div class="jc-empty jc-empty--dashed">
        <iconify-icon icon="lucide:shopping-bag"></iconify-icon>
        <p><strong>No orders found</strong></p>
        <p class="jc-empty__sub">Place your first order and it will appear here. Make sure to checkout using <strong>${esc(user.email)}</strong>.</p>
        <a href="/shop" class="jc-btn jc-btn--navy">Start Shopping</a>
      </div>`;
      return;
    }
    box.innerHTML = `<div class="jc-orders">${orders.map(orderCard).join('')}</div>`;
    box.querySelectorAll('[data-invoice]').forEach((btn) => btn.addEventListener('click', () => {
      sessionStorage.setItem('jc-print-invoice', '1');
      location.href = `/order-confirmed?id=${encodeURIComponent(btn.dataset.invoice)}`;
    }));
  } catch {
    box.innerHTML = '<div class="jc-empty"><p>Unable to load your orders right now.</p></div>';
  }
}

function consumeGoogleErrorParam() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('google_error');
  if (!code) return '';
  const message = GOOGLE_ERRORS[code] || 'Google sign-in failed. Please try again.';
  params.delete('google_error');
  const qs = params.toString();
  const next = `${window.location.pathname}${qs ? `?${qs}` : ''}`;
  window.history.replaceState({}, '', next);
  return message;
}

(async function init() {
  const googleError = consumeGoogleErrorParam();
  try {
    const user = await authMe();
    if (user) dashboard(user);
    else authView(googleError);
  } catch {
    authView(googleError);
  }
})();
