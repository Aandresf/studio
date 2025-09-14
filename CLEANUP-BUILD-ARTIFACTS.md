Artifacts detectados (posibles builds previos)

El escaneo detectó las siguientes rutas/archivos que parecen outputs de build/portable:

- dist/backend/
- dist/frontend/
- dist/portable/
- dist/Inventario-App-Portable-v0.1.0.zip
- outpos/Inventario-App-Portable-v0.1.0.zip
- PORTABLE_RELEASE/
- PORTABLE_RELEASE_v2/
- PORTABLE_RELEASE_v3/
- PORTABLE_RELEASE_v3/Inventario App.exe
- PORTABLE_RELEASE_v3/resources/
- PORTABLE_RELEASE/msi/
- PORTABLE_RELEASE/nsis/

Si quieres limpiar localmente (Windows cmd), ejecuta desde la raíz del repo:

:: eliminar carpetas de build
rmdir /s /q dist\backend
rmdir /s /q dist\frontend
rmdir /s /q dist\portable
rmdir /s /q outpos
rmdir /s /q PORTABLE_RELEASE
rmdir /s /q PORTABLE_RELEASE_v2
rmdir /s /q PORTABLE_RELEASE_v3

:: eliminar zips antiguos
if exist dist\Inventario-App-Portable-v0.1.0.zip del /f dist\Inventario-App-Portable-v0.1.0.zip
if exist outpos\Inventario-App-Portable-v0.1.0.zip del /f outpos\Inventario-App-Portable-v0.1.0.zip

Notas:
- Estos comandos eliminan permanentemente archivos y carpetas. Asegúrate de hacer copias de seguridad si necesitas conservar versiones anteriores.
- Si prefieres una estrategia menos destructiva, renombra los zips antes de borrarlos:

ren dist\Inventario-App-Portable-v0.1.0.zip Inventario-App-Portable-v0.1.0.zip.bak

