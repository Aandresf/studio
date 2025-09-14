#!/usr/bin/env bash
# Genera certificados de desarrollo autofirmados usando OpenSSL en sistemas POSIX.
# Coloca key.pem y cert.pem en src-backend/data/.certs

set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CERT_DIR="$ROOT_DIR/src-backend/data/.certs"
mkdir -p "$CERT_DIR"

OPENSSL_CMD=${OPENSSL:-openssl}

echo "Generating dev certs in $CERT_DIR"
$OPENSSL_CMD req -x509 -nodes -newkey rsa:2048 -keyout "$CERT_DIR/key.pem" -out "$CERT_DIR/cert.pem" -days 3650 -subj "/C=XX/ST=None/L=None/O=Dev/CN=localhost"

echo "Done. Certificates written to $CERT_DIR"
echo "To trust the certificate on your system, run the appropriate import script in this folder."
