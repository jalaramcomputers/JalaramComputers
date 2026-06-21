#!/usr/bin/env bash
# Railway start: migrate, collect static, then Gunicorn.
set -euo pipefail

# Nixpacks venv — pre-deploy/start may not load /root/.profile
export PATH="/opt/venv/bin:${PATH:-}"

if [ -z "${DATABASE_URL:-}" ] && [ "${USE_SQLITE:-}" != "true" ]; then
  echo "ERROR: DATABASE_URL is not set."
  echo "In Railway: New → Database → PostgreSQL, then link DATABASE_URL to this web service."
  exit 1
fi

echo "Running migrations..."
python manage.py migrate --noinput

if [ -n "${ADMIN_PASSWORD:-}" ]; then
  echo "Ensuring owner admin (${ADMIN_USERNAME:-jcowner})..."
  # Password is read from ADMIN_PASSWORD env inside ensure_admin (avoids shell $/# issues).
  python manage.py ensure_admin \
    --username "${ADMIN_USERNAME:-jcowner}" \
    --email "${ADMIN_EMAIL:-jalaramcomputers21@gmail.com}"
fi

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting Gunicorn on port ${PORT:-8000}..."
exec gunicorn config.wsgi:application \
  --bind "0.0.0.0:${PORT:-8000}" \
  --workers 2 \
  --timeout 120
