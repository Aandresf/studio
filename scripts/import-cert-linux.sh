#!/usr/bin/env bash
# Importa cert.pem en sistemas Linux (Debian/Ubuntu) añadiéndolo a /usr/local/share/ca-certificates y actualizando ca-certificates
CERT_PATH="src-backend/data/.certs/cert.pem"
if [ ! -f "$CERT_PATH" ]; then
  echo "No se encontró $CERT_PATH"
  exit 1
fi

if [ "$EUID" -ne 0 ]; then
  echo "Este script requiere privilegios de root. Vuelve a ejecutarlo con sudo."
  exit 1
fi

cp "$CERT_PATH" /usr/local/share/ca-certificates/studio-dev-cert.crt
update-ca-certificates

echo "Certificado añadido al store de certificados del sistema."
