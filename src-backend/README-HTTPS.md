Arrancar el backend con HTTPS (desarrollo)

Requisitos:
- OpenSSL (para generar certificados) o mkcert.
- Node.js instalado.

Generar certificados (Windows):

    scripts\generate-dev-certs.bat

Generar certificados (Linux/macOS):

    ./scripts/generate-dev-certs.sh

Los certificados se crean en `src-backend/data/.certs/key.pem` y `cert.pem`.

Arrancar el servidor con HTTPS (usa los certificados generados):

    node src-backend/index.js

El servidor detectará automáticamente los certificados en `src-backend/data/.certs` y arrancará en HTTPS.

Probar desde otro dispositivo en la LAN:
1. En un navegador del host, abre `http://localhost:3001/api/server-info` para obtener la IP detectada y preferida.
2. Desde el dispositivo móvil, visita `https://<IP>:3001` (reemplaza `<IP>` por `preferredIp` o la IP apropiada).

Confianza del certificado en dispositivos móviles:
- Lo más sencillo: usar `mkcert` para generar certificados de confianza para la CA local (recomendado para pruebas en varios dispositivos).
- Alternativa: importar `cert.pem` en cada dispositivo como certificado de confianza (no recomendado fuera de pruebas).
- Opción segura: usar un túnel HTTPS como ngrok para exponer temporalmente el servidor con certificados válidos.

Notas:
- Los certificados autofirmados generados con OpenSSL no serán confiables por defecto en navegadores móviles; use `mkcert` o ngrok para facilitar pruebas cross-device.
- Si necesita que la PWA se instale y el service worker registre en móviles de la LAN, asegúrese de que la URL sea HTTPS y que el certificado sea confiable para el dispositivo.
