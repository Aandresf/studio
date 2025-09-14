Migraciones: añadir soft-delete columns

Qué hace:
- Añade columnas `status TEXT NOT NULL DEFAULT 'Activo'`, `deleted_at TEXT NULL`, y `deleted_by TEXT NULL` a las tablas listadas en `scripts/add_soft_delete_columns.js` si no existen.

Cómo usar (Windows):
1. Asegúrate de que la tienda activa esté configurada en `data/stores.json` (o usa la UI para seleccionar la tienda activa).
2. Abre un terminal en la raíz del repo y ejecuta:

```cmd
node scripts\add_soft_delete_columns.js
```

Notas:
- El script opera sobre la base de datos de la tienda activa configurada por `database-manager.getStoresConfig()`.
- Para aplicar la migración en otra tienda, cambia `activeStoreId` en `data/stores.json` o usa la API del servidor para seleccionar la tienda activa.
- Después de ejecutar la migración, el backend ya filtra registros `status='deleted'` en los endpoints principales que devuelven listados o detalles (productos, clientes, proveedores, marcas, departamentos, subdepartamentos, atributos, valores de atributo, usuarios).

Pasos recomendados posteriores:
- Ejecutar la suite de tests (npm test / jest) y verificar que las rutas críticas funcionan.
- Verificar manualmente desde el front que los elementos marcados como eliminados ya no aparecen.
- Eventualmente, actualizar las consultas restantes si hay endpoints adicionales que requieran filtrado.
