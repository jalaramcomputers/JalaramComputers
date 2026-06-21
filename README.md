# Jalaram Computers

A professional e-commerce + IT-services platform for Jalaram Computers, built on
**Django 5.2 + PostgreSQL**. No Node.js, no build step — clean Django templates,
one stylesheet, and small vanilla ES modules.

## Features

- **Storefront** — home (animated hero carousel + stacked sections), shop with
  live filters/sort/search, product detail, cart, checkout (GST + delivery),
  order confirmation, account (session auth + order history).
- **Services** — services overview, online service booking, contact form.
- **Admin** — full branded Django admin at `/admin`: products, promo codes,
  orders (status workflow + printable GST invoices), repairs, bookings,
  customers, queries, store settings, hero slides, newsletter, and a GST
  billing tool.
- **Production-ready** — WhiteNoise static serving, security headers, error
  pages, server-authoritative order IDs.

## Quick start (local)

```powershell
pip install -r requirements.txt
copy .env.example .env          # then edit DB credentials if needed
python manage.py migrate
python manage.py ensure_admin   # creates admin@jalaram.local / admin123
python manage.py runserver
```

Open http://localhost:8000 · Admin → http://localhost:8000/admin

> No products are pre-seeded. Add your catalogue through the admin — products
> appear on the storefront immediately.

**No PostgreSQL handy?** Run against SQLite for a quick spin:

```powershell
$env:USE_SQLITE="true"; python manage.py migrate; python manage.py ensure_admin; python manage.py runserver
```

## Configuration (`.env`)

| Variable | Purpose |
| --- | --- |
| `DEBUG` | `true` for dev, `false` in production |
| `DJANGO_SECRET_KEY` | **set a long random value in production** |
| `ALLOWED_HOSTS` | comma-separated hostnames |
| `POSTGRES_*` / `DATABASE_URL` | database connection |
| `ADMIN_EMAIL` | email treated as staff for the storefront API |
| `SMTP_*`, `MAIL_FROM` | newsletter email (optional) |
| `CSRF_TRUSTED_ORIGINS` | comma-separated https origins (production) |

## Railway deploy (one-click)

This repo includes `railway.toml`, `Procfile`, `runtime.txt`, and auto-detection of
`DATABASE_URL` / `RAILWAY_PUBLIC_DOMAIN`. Nixpacks auto-detects Python from
`requirements.txt` — do not add a custom `nixpacks.toml` unless you know what
you are doing (it can break `pip`).

### Steps

1. **New project** on [Railway](https://railway.app) → **Deploy from GitHub** → select this repo → branch `main`.
2. **Add PostgreSQL** — Railway dashboard → **+ New** → **Database** → **PostgreSQL**.
3. **Link database** — open your web service → **Variables** → **Add Reference** → `DATABASE_URL` from Postgres.
4. **Set variables** (see `.env.railway.example`):

   | Variable | Value |
   | --- | --- |
   | `DEBUG` | `false` |
   | `DJANGO_SECRET_KEY` | long random string |
   | `ADMIN_PASSWORD` | your admin password (for first login) |

   Railway auto-sets `RAILWAY_PUBLIC_DOMAIN`, `PORT`, and `DATABASE_URL`.

5. **Deploy** — Railway runs `migrate` + `collectstatic` before start, then Gunicorn.

6. **Create admin** (first time only):

   ```bash
   railway run python manage.py ensure_admin --email you@example.com --password 'your-password'
   ```

   Or set `ADMIN_PASSWORD` and run `bash scripts/railway_release.sh` from the Railway shell.

Open the generated `*.up.railway.app` URL. Admin → `/admin`.

## Production deploy (generic)

```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py ensure_admin --email you@example.com --password '<strong>'
gunicorn config.wsgi:application
```

Set `DEBUG=false`, a real `DJANGO_SECRET_KEY`, and `ALLOWED_HOSTS`. With
`DEBUG=false` the app enables HTTPS redirect, secure cookies and HSTS, and
WhiteNoise serves the compressed static files. Verify with
`python manage.py check --deploy`.

## Project layout

```
config/        Django project (settings, urls, wsgi/asgi)
shop/          app — models, page views, JSON API (api_views), admin
templates/     base + partials + pages + admin
public/assets/ app.css, ES modules (api/cart/shop/product/checkout/…), images
```

## Stack

- Django 5.2 · PostgreSQL · WhiteNoise · Gunicorn
- Vanilla ES-module JavaScript (no framework, no bundler)
- One design-system stylesheet (`public/assets/css/app.css`)
