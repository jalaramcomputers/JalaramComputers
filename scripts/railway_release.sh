#!/usr/bin/env bash
# Optional manual release steps (Railway runs migrate/collectstatic via railway.toml).
set -euo pipefail

python manage.py migrate --noinput
python manage.py collectstatic --noinput

if [ -n "${ADMIN_PASSWORD:-}" ]; then
  python manage.py ensure_admin \
    --username "${ADMIN_USERNAME:-jcowner}" \
    --email "${ADMIN_EMAIL:-jalaramcomputers21@gmail.com}" \
    --password "$ADMIN_PASSWORD"
fi

echo "Railway release complete."
