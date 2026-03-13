#!/bin/sh
# nginx-start.sh - Certificate-aware nginx startup script
# Uses nginx-ssl.conf if Let's Encrypt certs exist, otherwise nginx.conf (HTTP only)
set -e

CERTS_PATH="/etc/letsencrypt/live/cortexbuildpro.com/fullchain.pem"

if [ -f "$CERTS_PATH" ]; then
  echo "[nginx] SSL certificates found — starting with HTTPS configuration"
  exec nginx -c /etc/nginx/nginx-ssl.conf -g "daemon off;"
else
  echo "[nginx] No SSL certificates found — starting with HTTP-only configuration"
  echo "[nginx] Run: docker compose -f docker-compose.vps.yml run --rm certbot to obtain SSL"
  exec nginx -c /etc/nginx/nginx.conf -g "daemon off;"
fi
