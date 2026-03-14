#!/bin/sh
set -e
CERTS_PATH="/etc/letsencrypt/live/cortexbuildpro.com/fullchain.pem"
if [ -f "$CERTS_PATH" ]; then
  echo "[nginx] SSL certificates found — starting with HTTPS"
  exec nginx -c /etc/nginx/nginx-ssl.conf -g "daemon off;"
else
  echo "[nginx] No SSL — starting HTTP only"
  exec nginx -c /etc/nginx/nginx.conf -g "daemon off;"
fi
