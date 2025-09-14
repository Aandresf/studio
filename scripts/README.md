Generación de certificados de desarrollo

Estos scripts generan certificados autofirmados para pruebas locales y permiten ejecutar el backend con HTTPS.

Archivos (moved to scripts/certificados):
- `scripts/certificados/generate-dev-certs.bat` : script para Windows (cmd.exe). Requiere `openssl` en PATH o define la variable de entorno `OPENSSL` con la ruta al ejecutable.
- `scripts/certificados/generate-dev-certs.sh`  : script POSIX (Linux/macOS). Requiere `openssl` en PATH.

Salida:
- `src-backend/data/.certs/key.pem`
- `src-backend/data/.certs/cert.pem`

Uso (Windows, cmd.exe):

    scripts\certificados\generate-dev-certs.bat

Uso (POSIX):

    ./scripts/certificados/generate-dev-certs.sh

Confianza del certificado:
- Para confiar en Windows, la forma más sencilla es instalar `mkcert` (https://github.com/FiloSottile/mkcert) y usar `mkcert -install`.
- Alternativamente, importe `src-backend/data/.certs/cert.pem` en el almacén "Trusted Root Certification Authorities" usando la utilidad de certificados de Windows.

Notas:
- Los certificados generados son autofirmados y solo deben usarse en entornos de desarrollo.
- Si planeas exponer el servidor a otros dispositivos en la LAN para pruebas de PWA, prefiera `mkcert` o un túnel HTTPS (ngrok) para evitar problemas de confianza en dispositivos móviles.

Importar el certificado en tu sistema
-----------------------------------

Windows (PowerShell - requiere privilegios de administrador):

    scripts\certificados\import-cert-windows.bat

Esto ejecuta `import-cert-windows.ps1` y añadirá `src-backend/data/.certs/cert.pem` al almacén "Trusted Root Certification Authorities" (LocalMachine). Se pedirá elevación si no se ejecuta como administrador.

macOS (requiere sudo):

    ./scripts/certificados/import-cert-macos.sh

Linux (Debian/Ubuntu, requiere sudo/root):

    sudo ./scripts/certificados/import-cert-linux.sh

Advertencia: Importar un certificado como trusted root afecta la confianza del sistema; úsalo únicamente en entornos de desarrollo controlados.
