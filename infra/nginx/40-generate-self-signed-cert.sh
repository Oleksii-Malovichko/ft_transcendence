#!/bin/sh
set -eu

CERT_DIR="${CERT_DIR:-/etc/nginx/certs}"
CERT="$CERT_DIR/server.crt"
KEY="$CERT_DIR/server.key"

if [ -s "$CERT" ] && [ -s "$KEY" ]; then
  echo "tls: reusing the existing certificate"
  exit 0
fi

mkdir -p "$CERT_DIR"
openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
  -keyout "$KEY" -out "$CERT" \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" 2>/dev/null
chmod 600 "$KEY"
echo "tls: generated a self-signed certificate for localhost"