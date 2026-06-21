#!/usr/bin/env bash
# Optional manual release steps (Railway runs migrate/collectstatic via railway.toml).
set -euo pipefail

python manage.py migrate --noinput
python manage.py collectstatic --noinput

if [ -n "${ADMIN_PASSWORD:-}" ]; then
  python manage.py ensure_admin \
    --email "${ADMIN_EMAIL:-admin@jalaram.local}" \
    --username "${ADMIN_USERNAME:-admin}" \
    --password "$ADMIN_PASSWORD"
fi

echo "Railway release complete."
