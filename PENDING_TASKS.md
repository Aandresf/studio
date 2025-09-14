mLista de tareas pendientes y soluciones (generada automáticamente)

Estado actual: Algunos cambios aplicados por petición del usuario:
- Eliminadas pruebas del backend y referencias en `src-backend/package.json`.
- Añadido endpoint de compatibilidad `/api/variants/:id/movements`.
- Creado `src-backend/TODO_UI_and_REFACTOR.md` con instrucciones de refactor y UI.

Tareas pendientes (priorizadas)

1) SKU: separar PREVIEW y RESERVA
   - Estado: Pendiente - Posiblemente realizada
   - Solución: Añadir GET `/api/sku/preview?depId=&subId=` que calcule next SKU sin actualizar `product_sequences`. Mantener la reserva (UPDATE) solo durante la creación del producto dentro de la transacción.
   - Archivos: `src-backend/index.js`, posible ajuste en `POST /api/products` para usar la reserva internamente.
   - Pruebas: PREVIEW varias veces -> mismo valor; crear producto -> secuencia aumenta solo al commit.

2) Unificar movimientos para usar `variant_id` en todo el backend
   - Estado: Parcial (se añadió endpoint de compatibilidad)
   - Solución: Actualizar endpoints que aún usan `product_id` para que usen `variant_id`; en particular `POST /api/inventory/movements` y otros handlers.
   - Archivos: `src-backend/index.js`, `src/lib/api.ts`.

3) Tipos TS y shapes coherentes
   - Estado: Pendiente
   - Solución: Revisar `src/lib/types.ts` y normalizar `attribute_name` vs `name`, `attribute_values` shape. Agregar tests unitarios para utilitarios.
   - Archivos: `src/lib/types.ts`, múltiples componentes que consumen `Product`.

4) UI mínimo para mostrar movimientos por variante
   - Estado: Parcial (endpoint añadido en backend) - posiblemente realizada
   - Solución: Añadir `getVariantMovements` (si no existiera) a `src/lib/api.ts` y un botón "Ver movimientos" en `VariantSelectionDialog` que abra un modal con lista de movimientos.
   - Archivos: `src/components/dialogs/VariantSelectionDialog.tsx`, `src/lib/api.ts`.

5) Refactor `index.js` en routers pequeños
   - Estado: Pendiente
   - Solución: Crear `src-backend/routes/` y mover bloques por dominio (products, inventory, purchases, sales, brands, attributes, departments, stores, reports). Usar `app.use('/api/products', require('./routes/products'))`.
   - Archivos: `src-backend/routes/*.js`, `src-backend/index.js`.

6) Validaciones de stock en ventas
   - Estado: Pendiente
   - Solución: En endpoints SALIDA, validar `variant.current_stock >= quantity` y devolver 409 con payload estructurado si insuficiente.
   - Archivos: `src-backend/index.js` (handlers de ventas), UI para validar antes de submit.

7) Mejoras al generador de SKU y concurrencia
   - Estado: Pendiente
   - Solución: Mantener la lógica de incremento dentro de transacciones; considerar `BEGIN IMMEDIATE` para evitar race conditions en SQLite.
   - Archivos: `src-backend/index.js`.

8) Migraciones y verificación de `schema.sql`
   - Estado: Pendiente - dejar para el final
   - Solución: Ejecutar migraciones en DB de prueba, ajustar índices y constraints, actualizar scripts si necesario.
   - Archivos: `src-backend/schema.sql`, `migrate_*.js`.

9) Tests: remover referencias y reemplazar por pruebas relevantes
   - Estado: Parcial (tests eliminados)
   - Solución: Crear tests más pequeños y relevantes post-refactor (integration tests sobre endpoints críticos).
   - Archivos: `src-backend/tests/*` (nueva ubicación).

10) Documentación de desarrollo (Windows)
    - Estado: Pendiente
    - Solución: Añadir README con comandos para iniciar backend, frontend, y Tauri (requisitos: Rust, WebView2). Incluir pasos para crear tienda de prueba.
    - Archivos: `README.md` o `docs/dev-setup.md`.

Registro de cambios aplicados en esta sesión:
- Eliminadas pruebas y actualizada `package.json` (ver `src-backend/package.json`).
- Añadido endpoint `/api/variants/:id/movements`.
 - Añadido endpoint `/api/variants/:id/movements`.

11) Agregar permiso 'reports:profit' a la base de datos
      - Estado: Pendiente
      - Solución: Ejecutar `scripts/add_reports_profit_permission.sql` contra la base de datos SQLite para crear la entrada en `permissions` y asignarla a role_id=1 / user_id=1 (ajustar ids según su DB).
      - Comando sugerido:
         sqlite3 src-backend/data/<tu_db>.db < scripts/add_reports_profit_permission.sql
      - Archivos: `scripts/add_reports_profit_permission.sql`
