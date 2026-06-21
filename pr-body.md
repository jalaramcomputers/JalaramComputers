## Summary

This PR replaces the legacy Node.js / Firebase / static-HTML stack with a clean **Django 5.2 + PostgreSQL** application. The public storefront, customer account flow, JSON API, and branded admin console are rebuilt from scratch with Django templates, a single consolidated stylesheet, and small vanilla ES modules — no bundler, no Firebase, no client-side admin SPA.

**Branch:** `jalaramtwopointo`  
**Base:** `main`  
**Scope:** ~138 files changed, ~7,300 insertions, ~27,000 deletions  
**Commits:** 10 (foundation through production polish)

---

## Why this change

The previous `main` branch relied on:

- Static HTML pages served individually (`public/index.html`, `public/shop.html`, etc.)
- A ~190KB client-side admin SPA (`public/admin.html`) with localStorage and optional Firebase sync
- Node/Express (`server.ts`) and Firebase config/rules
- Fragmented CSS/JS (`cart-system.js`, Tailwind runtime, multiple font CSS files)

That architecture made data consistency, secure admin access, and production deployment difficult. This rebuild makes **PostgreSQL the single source of truth**, uses **Django session auth** for customers and staff, and removes the entire Firebase/Node layer.

---

## What ships in this PR

### Storefront (Phase 1)

| Route | Purpose |
|-------|---------|
| `/` | Home — hero carousel, stacked sections, brand marquee, newsletter |
| `/shop` | Product catalog — live filter, sort, search |
| `/product` | Product detail — gallery, promo, add-to-cart |
| `/cart` | Cart page — promo codes, quantity controls |
| `/checkout` | Checkout — GST, delivery, payment method selection |
| `/order-confirmed` | Order confirmation |
| `/account` | Customer portal — register, login, order history |

**Frontend stack:**
- `templates/base.html` + `templates/pages/*` + `templates/partials/*`
- `public/assets/css/app.css` — single design system (navy + gold, Playfair + Inter)
- ES modules: `api.js`, `cart.js`, `shop.js`, `product.js`, `checkout.js`, `account.js`, `home.js`, `ui.js`

### Content and forms (Phase 2)

| Route | Purpose |
|-------|---------|
| `/services` | IT services overview |
| `/book-service` | Online service booking form |
| `/about` | About page |
| `/contact` | Contact form |

API endpoints for customer-submitted data:
- `POST /api/queries/` — contact form
- `POST /api/service-bookings/` — service booking
- `POST /api/newsletter/subscribe/` — newsletter signup

### Admin console (Phase 3)

Custom-branded Django admin at `/admin/` (`JalaramAdminSite`):

- **Dashboard** — live stats (products, orders, revenue, open queries, bookings, repairs, low stock, newsletter)
- **Products** — full CRUD, promo codes, stock, images/video, bulk actions
- **Promo codes** — proxy admin for products with active promos
- **Orders** — status workflow, paid flag, customer/shipping summaries, printable GST invoice
- **Service requests** — repair ticket management with status + cost
- **Service bookings** — appointment records from book-service form
- **Customers** — user management with order counts, staff grant/revoke
- **Contact queries** — ticket status workflow
- **Site settings** — shop name, phone, email, GST, address (singleton)
- **Hero slides** — carousel configuration
- **Newsletter subscribers**
- **GST billing tool** — `/admin/billing/` for ad-hoc tax invoices

Admin UI is fully custom (`templates/admin/base.html`, `jalaram-admin.css`) — not Django default styling with overrides.

### Backend / API

**Models** (`shop/models.py`):
- `Category`, `Product`, `Order`, `ServiceRequest`, `ServiceBooking`
- `ContactQuery`, `SiteSettings`, `HeroSlideConfig`, `NewsletterSubscriber`
- `ProductPromo` (proxy model for promo admin)

**Public JSON API** (`shop/api_views.py`):
- Auth: `POST /api/auth/register/`, `login/`, `logout/`, `GET /api/auth/me/`
- Catalog: `GET /api/products/`, `GET /api/products/<slug>/`
- Settings: `GET /api/settings/shop/`, `GET /api/settings/hero-slides/`
- Orders: `GET|POST /api/orders/`, `GET /api/orders/<id>/` (authenticated)

**Removed dead admin API surface** (security cleanup):
- `admin-login`, `settings/*/admin`, `queries/list`, `services` collection/detail, `admin/sync`, `clear-products`
- These were only referenced by the deleted `jalaram-api.js` SPA and exposed PII on some routes

### Production readiness

- **WhiteNoise** — compressed static file serving when `DEBUG=false`
- **Security headers** — SSL redirect, secure cookies, HSTS, nosniff (gated on `DEBUG=false`)
- **Branded error pages** — `templates/404.html`, `templates/500.html`
- **Server-generated order IDs** — clients cannot overwrite existing orders by reusing an ID
- **Admin XSS fix** — order preview fields use `format_html` / `format_html_join` instead of raw `mark_safe` on customer-supplied checkout data
- **`python manage.py ensure_admin`** — creates superuser from env/flags
- **`docker-compose.yml`** — optional local Postgres
- **Updated README** and `.env.example`

---

## What was removed

| Removed | Reason |
|---------|--------|
| `server.ts`, `package.json`, `tsconfig.json` | Node stack replaced by Django |
| `firebase/` config and rules | Cloud DB replaced by PostgreSQL |
| `public/*.html` (index, shop, cart, admin, etc.) | Replaced by Django templates |
| `public/admin.html` (~190KB SPA) | Replaced by Django admin + custom templates |
| `public/assets/js/cart-system.js` (~8K lines) | Replaced by modular ES modules |
| `tailwind.js`, `reveal.js`, `petite-vue`, legacy CSS files | No longer needed |
| Demo seed scripts / Firebase applet config | No auto-seeding; admin is source of truth |

**No products are pre-seeded.** Catalogue is added through `/admin` only.

---

## Business details preserved

Verbatim from the original site:
- Phone: `+91 9892848643`
- Email: `jalaramcomputers21@gmail.com`
- GST: `27AACJC2026P1Z3`
- Mumbai address (Lamington Road)
- INR pricing, GST on checkout, UPI/COD payment UI

---

## Setup (for reviewers)

### Prerequisites
- Python 3.11+
- PostgreSQL (or use SQLite for a quick spin)

### Local install

```powershell
git checkout jalaramtwopointo
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py ensure_admin
python manage.py runserver
```

- Storefront: http://127.0.0.1:8000
- Admin: http://127.0.0.1:8000/admin
- Default admin (from `ensure_admin`): `admin@jalaram.local` / `admin123`

### SQLite quick test (no Postgres)

```powershell
$env:USE_SQLITE="true"
python manage.py migrate
python manage.py ensure_admin
python manage.py runserver
```

### Production check

```powershell
$env:DEBUG="false"
$env:DJANGO_SECRET_KEY="a-long-random-production-key"
python manage.py check --deploy
python manage.py collectstatic --noinput
```

---

## Automated test plan

Run with the dev server on `http://127.0.0.1:8000`:

```powershell
# Terminal 1
python manage.py runserver

# Terminal 2
python scripts/phase1_smoke.py
python scripts/phase2_smoke.py
python scripts/phase3_smoke.py
```

### Phase 1 — Storefront + auth + orders (`phase1_smoke.py`)

| # | Test | Expected |
|---|------|----------|
| 1 | `GET /`, `/shop`, `/product`, `/cart`, `/checkout`, `/order-confirmed`, `/account` | All return 200 |
| 2 | `POST /api/auth/register/` with new email | 200, user created |
| 3 | `GET /api/auth/me/` | Returns logged-in user email |
| 4 | `POST /api/orders/` with cart payload | 200, order saved with server-generated ID |
| 5 | `GET /api/orders/` | Order appears in user's list |
| 6 | `GET /api/orders/<id>/` | Order detail matches |
| 7 | `POST /api/auth/logout/` then `login/` | Session cycle works |

### Phase 2 — Content pages + forms (`phase2_smoke.py`)

| # | Test | Expected |
|---|------|----------|
| 1 | `GET /services`, `/book-service`, `/about`, `/contact` | All 200, contain `jc-header` |
| 2 | `POST /api/queries/` | 200, returns `ticketId` |
| 3 | `POST /api/service-bookings/` | 200, returns `bookingId` |

### Phase 3 — Admin (`phase3_smoke.py`)

| # | Test | Expected |
|---|------|----------|
| 1 | Login as test superuser | Success |
| 2 | `GET /admin/`, product list, promo list, orders, repairs, bookings, queries, newsletter, settings, hero, users, billing | All 200 |
| 3 | `POST /admin/shop/product/add/` | Product created |
| 4 | `GET /api/products/` | New product slug visible |
| 5 | `GET /admin/shop/order/<pk>/invoice/` | Printable invoice renders |

---

## Manual test plan

### Storefront UX

- [ ] Home page loads with splash (first visit per session), hero carousel auto-plays, dismisses on click or after ~2.4s
- [ ] Splash respects `prefers-reduced-motion` (hidden)
- [ ] Shop page: filter by category/brand, sort by price, search by name
- [ ] Product page: images load, promo code field works, add to cart updates header count
- [ ] Cart: change quantity, remove item, apply promo code, totals update
- [ ] Checkout: fill shipping, GST calculated, place order
- [ ] Order confirmed page shows correct order ID returned from API (not client-generated)
- [ ] Account: register new user, login, see order history, logout
- [ ] Mobile: header drawer opens/closes, cart icon visible, pages readable at 375px width

### Content forms

- [ ] Contact form submits and creates query visible in admin
- [ ] Book-service form submits with date/slot/promo
- [ ] Newsletter signup on home page works
- [ ] Services and About pages render with correct business info

### Admin

- [ ] Login page: username/password only, navy/gold branded card, no Google sign-in, no JS dump on page
- [ ] Dashboard: stat cards in grid layout, quick action links work
- [ ] Sidebar navigation: all sections reachable, active state highlights correctly
- [ ] Add product with images — appears on `/shop` immediately via API
- [ ] Edit order status via bulk actions (Processing, Paid, Shipped, Delivered, Cancelled)
- [ ] Open printable order invoice — GST breakdown, customer details correct
- [ ] GST billing tool: add line items, preview invoice, print
- [ ] Site settings: update phone/email/GST — reflected on storefront via `/api/settings/shop/`
- [ ] Contact query status workflow: Open → In Progress → Resolved → Closed
- [ ] Service request status workflow works

### Security (post-hardening)

- [ ] `GET /api/services/` returns 404 (removed)
- [ ] `GET /api/queries/list/` returns 404 (removed)
- [ ] `POST /api/orders/` with empty items rejected
- [ ] Posting order with duplicate client ID does not overwrite existing order
- [ ] Order with `<script>` in customer name shows escaped text in admin (not executed)
- [ ] `python manage.py check --deploy` passes (except SECRET_KEY strength warning in dev)

### Production mode

- [ ] Set `DEBUG=false`, run `collectstatic`, serve via gunicorn or `runserver`
- [ ] Static assets load (`/assets/css/app.css`, `/assets/css/jalaram-admin.css`)
- [ ] Unknown URL returns branded 404 page
- [ ] WhiteNoise serves gzip-compressed static files

---

## Deployment checklist

- [ ] Set `DEBUG=false`
- [ ] Set strong `DJANGO_SECRET_KEY`
- [ ] Set `ALLOWED_HOSTS` to production domain(s)
- [ ] Set `CSRF_TRUSTED_ORIGINS` to `https://yourdomain.com`
- [ ] Configure `DATABASE_URL` or `POSTGRES_*` for production Postgres
- [ ] Run `python manage.py migrate`
- [ ] Run `python manage.py collectstatic --noinput`
- [ ] Run `python manage.py ensure_admin --email you@example.com --password '<strong>'`
- [ ] Serve with `gunicorn config.wsgi:application` behind HTTPS reverse proxy
- [ ] Verify `python manage.py check --deploy`

---

## Known limitations / out of scope

These are intentionally **not** in this PR:

- **Razorpay / real payment gateway** — checkout UI exists; payment is not verified server-side
- **Order confirmation email** — SMTP config exists but transactional emails not wired
- **Google OAuth admin login** — admin uses Django username/password only
- **Product image upload to cloud storage** — products use URL fields for images/video
- **Automatic product seeding** — catalogue must be entered via admin
- **CI/CD pipeline** — smoke scripts exist locally but no GitHub Actions workflow yet

---

## Breaking changes

- Entire previous URL structure for static HTML files is gone; all routes are Django-served
- Firebase client config removed; any bookmarked `admin.html` SPA will 404
- Old localStorage cart/admin data is not migrated
- Removed JSON admin API endpoints (any external tooling depending on them will break)
- Order IDs are now server-generated; clients cannot supply `orderId` on create

---

## Reviewer focus areas

1. **Security** — order creation, removed PII endpoints, admin XSS escaping (`shop/admin.py` OrderAdmin previews)
2. **Data model** — `shop/models.py`, migrations `0001_initial`, `0002_productpromo`
3. **API contract** — `shop/api_views.py` vs frontend modules in `public/assets/js/`
4. **Admin templates** — `templates/admin/` and `public/assets/css/jalaram-admin.css`
5. **Production config** — `config/settings.py` WhiteNoise + `DEBUG=false` security block
6. **No regression on business copy** — phone, GST, address in templates and `SiteSettings` defaults
