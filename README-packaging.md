Resumen rápido de empaquetado y archivos runtime

1) Propósito
El backend espera en tiempo de ejecución una carpeta `data` situada junto al ejecutable/back-end. Esta carpeta debe incluir, como mínimo:

- database.db (o el nombre de BD activo)
- database_*_settings.json (ajustes por tienda si aplica)
- users.json (usuarios por defecto, si no está en DB)
- stores.json
- pending_transactions.json (si aplica)
- permissions.json (metadata de permisos usada por el frontend)
- .env (opcional: BIND_IP=192.168.x.x para forzar bind)

2) Flujo de packaging (resumen)
- `npm run compile:frontend` -> genera `dist/frontend`.
- `node scripts/prepare-installer-files.js` -> crea `dist/backend` (compila backend con pkg, copia `schema.sql`, `node_sqlite3.node` y copia `src-backend/data` a `dist/backend/data`).
- `tauri build` -> empaqueta el frontend (desde `dist/frontend`) con recursos en `src-tauri/resources`.
- `node scripts/create-portable.js` -> crea `dist/portable` y zip final.

3) Verificación post-build (mínimo)
- Verificar `dist/backend/data/permissions.json` existe.
- Verificar `dist/backend/node_sqlite3.node` existe.
- Probar ejecutar el backend.exe y confirmar que detecta `data` (ejecutar con `--help` o iniciar para ver logs de arranque).

4) Recomendaciones
- Mantener `data` fuera del exe para permitir backups y cambios posteriores sin recompilar.
- Añadir una step en CI que valide la existencia de `dist/backend/data/permissions.json` y `schema.sql`.

Si quieres, puedo añadir el chequeo automático a `scripts/prepare-installer-files.js` y actualizar `package.json` para exponer un script `verify:package`.
