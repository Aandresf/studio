#!/usr/bin/env bash
# Importa cert.pem en macOS Keychain como certificado de confianza (sólo para desarrollo)
CERT_PATH="src-backend/data/.certs/cert.pem"
if [ ! -f "$CERT_PATH" ]; then
  echo "No se encontró $CERT_PATH"
  exit 1
fi

# Requiere privilegios admin para añadir certificado como trusted root
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain "$CERT_PATH"

echo "Certificado importado en System keychain como trusted root."
