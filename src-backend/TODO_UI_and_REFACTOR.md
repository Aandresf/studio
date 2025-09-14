Tareas solicitadas por el usuario:

1) Eliminar pruebas (ya realizadas)
   - Los archivos de pruebas y la configuración de jest han sido eliminados del repositorio.
   - package.json actualizado para quitar el script de test y las devDependencies relacionadas.

2) Implementar en UI (cambios mínimos) la visualización y manejo de movimientos por variante

Resumen objetivo:
- Mostrar en UI (lista de productos, modal de selección, y detalle de producto) los movimientos asociados a una variante específica (no al product base).
- Mantener cambios en la UI lo más pequeños posible, preferiblemente añadiendo wrappers o pequeñas adaptaciones en los componentes que ya llaman a la API.

Pasos concretos (mínimos cambios):

A. Endpoints backend (asumimos compatibles):
   - Asegurarse de que existe GET /api/variants/:id/movements o GET /api/products/:productId/variants/:variantId/movements. Si no existe, añadir un wrapper en el backend (index.js) que haga la consulta:
     SELECT * FROM inventory_movements WHERE variant_id = ? ORDER BY transaction_date DESC

B. Frontend mínimo (archivos a tocar):
   1. `src/lib/api.ts`
      - Añadir una función exportada: `export const getVariantMovements = (variantId: number) => fetchAPI(`/variants/${variantId}/movements`);`
      - No tocar llamadas existentes a getProductMovements por ahora; usar este nuevo método en los puntos donde mostramos movimientos por variante.

   2. `src/components/dialogs/VariantSelectionDialog.tsx` (o donde se muestren detalles de variante)
      - Añadir una llamada opcional a `getVariantMovements` cuando se seleccione una variante y mostrar los últimos N movimientos en una sección colapsable.
      - Mantener el formulario de selección sin cambios en su estructura; solo agregar un botón "Ver movimientos" que abra la vista rápida.

   3. `src/app/(app)/products/page.tsx` y `src/app/(app)/purchases/page.tsx`
      - Cuando se renderiza la lista de variantes (por ejemplo en tooltip o resumen), no reemplazar nada; solo preparar un enlace/trigger para abrir movimientos de la variante seleccionada.

C. UX mínimo:
   - "Ver movimientos" debe ser un botón pequeño junto a la variante, que abre un modal simple con la lista de movimientos (fecha, tipo, cantidad, documento).
   - Opcional: mostrar stock disponible al lado del botón.

Pruebas manuales:
- Seleccionar una variante y abrir "Ver movimientos" -> comprobar que la lista trae datos correctos.

3) Refactor de `index.js` (dividir en varios archivos)

Objetivo:
- Mantener `src-backend/index.js` como punto de arranque que solo configura express, middlewares y registra routers para cada módulo.
- Crear routers separados en `src-backend/routes/` por área: `products.js`, `inventory.js`, `purchases.js`, `sales.js`, `brands.js`, `attributes.js`, `departments.js`, `stores.js`, `reports.js`, etc.
- Mover la lógica de `database-manager.js` a un helper separado (ya existe) y seguir usándolo en los routers.

Pasos concretos para refactor (no destructivos):
1. Crear carpeta `src-backend/routes/`.
2. Para cada bloque de endpoints en `index.js`, cortar y pegar en su respectivo archivo: por ejemplo, `products` contiene endpoints relacionados con `/api/products`.
3. En cada archivo router, exportar un `const router = express.Router(); module.exports = router;` y usar `router.get(...)`, `router.post(...)`.
4. En `index.js` (root), reemplazar los bloques cortados con `app.use('/api/products', require('./routes/products'))` y así sucesivamente.
5. Mantener referencias a helpers (`databaseManager`, `util`, `dataDir`) mediante `require` en cada router.
6. Ejecutar manualmente `node index.js` y probar que rutas principales respondan.

Notas para debugging y mantenimiento:
- Mantener `console.log` reducidos y usar `DEBUG` env var para activar logs más verbosos si es necesario.
- Crear un pequeño script `scripts/check-routes.js` que lea `routes/` y liste rutas registradas (opcional).

Riesgos y mitigación:
- Refactor grande puede romper rutas por nombres incorrectos; hacerlo en pasos pequeños, mover un módulo a la vez y probar.
- Mantener backups: antes de mover un bloque, copiar el fragmento original en un archivo `.bak`.

---
Archivo generado automáticamente por el asistente: no realizar commits automáticos sin revisar.

---
## Cambios recientes realizados (resumen)

- Se refactorizó `src-backend/index.js` para registrar routers y se movieron endpoints a módulos bajo `src-backend/routes/`.
- Rutas añadidas / extraídas y archivos creados/actualizados:
   - `routes/sku.js`, `routes/dashboard.js`, `routes/transactions.js`, `routes/admin.js` (migradas desde index)
   - `routes/products.js`, `routes/attributes.js`, `routes/departments.js`, `routes/inventory.js`, `routes/purchases.js`, `routes/sales.js`, `routes/reports.js` (ajustes y migración)
   - `routes/brands.js` (migrado y registrado)
   - `routes/variants.js` (nuevo: expone `GET /api/variants` y `GET /api/variants/:id`)
   - `routes/stores.js` (registrado para exponer `/api/stores`)

- Cambios funcionales y correcciones realizadas:
   - `reports.js` y `inventory.js` actualizados para usar `product_variants` en joins y `products.base_sku` en lugar de `products.sku`.
   - `inventory` endpoints adaptados para usar `variant_id` en movimientos (POST /movements ahora usa `variant_id`).
   - `sales.js` importó `dataDir` para resolver settings correctamente.
   - Se añadieron middlewares globales en `index.js`: `cors()` y `express.json()`.

- Scripts de prueba creados/ejecutados y limpieza:
   - Se crearon scripts de prueba de integración en `scripts/tests/`:
     - `targeted_checks_http.js`, `extended_checks.js`, `advanced_checks.js`, `concurrency_and_settings_checks.js`.
   - Se realizó la limpieza final: los duplicados de estos scripts en el directorio raíz `scripts/` fueron eliminados y las copias canónicas quedaron en `scripts/tests/`.

- Resultados de la ejecución de `scripts/full_integration_test.js` (ejecución completa):
   - 1) GET /api/products → 200
   - 2) POST /api/purchases → 201 (compra registrada)
   - 3) POST /api/sales → 201 (venta registrada)
   - 4) GET detalles de compra/venta → 200 (datos correctos)
   - 5) DELETE venta → 200 (venta anulada)
   - 6) DELETE compra → 200 (compra anulada)
   - 7) Crear snapshot → 500 con error: `SQLITE_CONSTRAINT: UNIQUE constraint failed: inventory_snapshots.product_id, inventory_snapshots.snapshot_date` (indica intento de crear un snapshot duplicado para la misma fecha/producto)
   - 8) Reporte histórico → 200
   - 9) Reporte SALES → 200

- Observaciones de pruebas:
   - Compras y ventas secuenciales funcionan correctamente.
   - Validación `allowSellBelowCost` verificada.
   - Persisten limitaciones con concurrencia en SQLite (transacciones simultáneas pueden fallar). No se realizaron cambios de arquitectura en esta tanda.


## Próxima tarea sugerida (para finalizar backend)

1) Limpieza final y pruebas de aceptación — Estado: hecho (parcial)
    - Eliminar scripts de prueba duplicados del root (`scripts/`) y mantener las copias en `scripts/tests/` — Hecho.
    - Ejecutar la suite de integraciones completa (`scripts/full_integration_test.js`) — Hecho; ver resultados arriba.
    - Acción pendiente relacionada: resolver el error de creación de snapshots (ver punto 1.1).

1.1) Corregir creación de snapshots (error UNIQUE)
    - Problema detectado: la API intenta insertar un `inventory_snapshot` que ya existe para la misma combinación `product_id` + `snapshot_date`, provocando un error 500.
    - Opciones de solución (ordenadas por impacto/seguridad):
       a) Comprobar existencia antes de insertar: ejecutar `SELECT 1 FROM inventory_snapshots WHERE product_id = ? AND snapshot_date = ?` y sólo insertar si no existe. Esto permite controlar la respuesta (201/409/200 según convenga).
       b) Usar `INSERT OR IGNORE` o `INSERT OR REPLACE` si la lógica del snapshot lo permite (hacerlo sólo si se entiende el comportamiento de reemplazo).
       c) Manejar la excepción en el backend y devolver 409 (Conflict) con un mensaje claro si ya existe.
    - Recomendación inmediata: implementar (a) — comprobar antes de insertar y devolver 409 con mensaje "Snapshot ya existe para ese producto/fecha".
    - Tarea práctica: modificar el endpoint que crea snapshots en `routes/inventory.js` (o donde esté implementado) para realizar la comprobación y responder adecuadamente. Luego re-ejecutar `scripts/full_integration_test.js`.

2) Opcional — mitigaciones de concurrencia (si en el futuro se requiere)
    - Implementar `PRAGMA journal_mode=WAL` y `busy_timeout` en `database-manager.js`.
    - Añadir reintentos (retry/backoff) ante `SQLITE_BUSY` en endpoints críticos.
    - Considerar abrir conexiones por petición o migrar a Postgres si la concurrencia es un requisito.

3) Revisar y documentar la API para el frontend
    - Actualizar `README.md` o crear `API.md` con rutas principales y payloads esperados (productos, variantes, compras, ventas, inventario, snapshots).

4) Revisiones de seguridad y saneamiento
    - Revisar todos los endpoints que ejecutan SQL con parámetros y asegurar que no existen inyecciones SQL (usar placeholders ya presentes).
    - Añadir validaciones más estrictas en payloads (types, ranges).

Si quieres que aplique la corrección (1.1) ahora mismo, la implemento en `src-backend/routes/inventory.js`, ejecuto la suite de integración y dejo el archivo `TODO_UI_and_REFACTOR.md` actualizado con el resultado.
