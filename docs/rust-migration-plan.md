# Plan de Migración del Backend a Rust

Este documento sigue el progreso de la migración del backend de Node.js a Rust. Cada componente será migrado y marcado como completado.

## Estructura del Backend en Rust (Objetivo)

```
src-backend-rust/
│
├── src/
│   ├── main.rs               // Punto de entrada, equivalente a index.js
│   │
│   ├── config.rs             // Equivalente a config.js
│   ├── database_manager.rs   // Equivalente a database-manager.js
│   ├── excel_generator.rs    // Equivalente a excel-generator.js
│   ├── schema.rs             // Para gestionar el esquema de la BD
│   │
│   ├── models/
│   │   ├── mod.rs
│   │   ├── user.rs
│   │   ├── product.rs
│   │   └── ... otros modelos
│   │
│   ├── lib/
│   │   ├── authorize.rs
│   │   ├── document_counter.rs
│   │   └── jwt.rs
│   │
│   ├── middleware/
│   │   ├── auth.rs
│   │   └── force_https.rs
│   │
│   └── routes/
│       ├── mod.rs              // Módulo que agrupa todas las rutas
│       ├── admin.rs
│       ├── attributes.rs
│       ├── auth.rs
│       ├── brands.rs
│       ├── customers.rs
│       ├── dashboard.rs
│       ├── departments.rs
│       ├── inventory.rs
│       ├── products.rs
│       ├── purchases.rs
│       ├── reports.rs
│       ├── role_permissions.rs
│       ├── sales.rs
│       ├── search.rs
│       ├── settings.rs
│       ├── snapshots.rs
│       ├── stats.rs
│       ├── stores.rs
│       ├── suppliers.rs
│       └── users.rs
│
├── Cargo.toml                // Gestor de dependencias y configuración del proyecto
└── data/                       // Datos de la aplicación (BD, .env, etc.)
```

## Progreso de la Migración

### Módulos Principales
- [x] `index.js` -> `src/main.rs` (Estructura inicial creada)
- [x] `config.js` -> `src/config.rs` (Actualizado con soporte para db_path y jwt_secret)
- [x] `database-manager.js` -> `src/database_manager.rs` (Mejorado con pool de conexiones)
- [x] `excel-generator.js` -> `src/excel_generator.rs`
- [x] `schema.sql` -> `src/schema.rs` (Actualizado con el esquema completo)

### Modelos (`models/`)
- [x] `models/user.js` -> `src/models/user.rs` (Completado con autenticación y operaciones CRUD)
- [ ] `models/product.js` -> `src/models/product.rs` (Pendiente)
- [ ] Otros modelos (departamentos, marcas, etc.) (Pendiente)

### Librerías (`lib/`)
- [x] `authorize.js` -> `src/lib/authorize.rs`
- [x] `documentCounter.js` -> `src/lib/document_counter.rs`
- [x] JWT Tokens -> `src/lib/jwt.rs` (Implementado)

### Middlewares (`middleware/`)
- [x] `auth.js` -> `src/middleware/auth.rs` (Actualizado con validación de tokens JWT)
- [x] `force-https.js` -> `src/middleware/force_https.rs`

### Rutas (`routes/`)
- [x] `products.js` -> `src/routes/products.rs`
- [x] `auth.js` -> `src/routes/auth.rs` (Actualizado con autenticación real usando el modelo User)
- [x] `users.js` -> `src/routes/users.rs`
- [x] `inventory.js` -> `src/routes/inventory.rs`
- [x] `sales.js` -> `src/routes/sales.rs`
- [x] `purchases.js` -> `src/routes/purchases.rs`
- [x] `reports.js` -> `src/routes/reports.rs`
- [x] `admin.js` -> `src/routes/admin.rs`
- [x] `attributes.js` -> `src/routes/attributes.rs`
- [x] `brands.js` -> `src/routes/brands.rs`
- [x] `customers.js` -> `src/routes/customers.rs`
- [x] `dashboard.js` -> `src/routes/dashboard.rs`
- [x] `departments.js` -> `src/routes/departments.rs`
- [x] `role-permissions.js` -> `src/routes/role_permissions.rs`
- [x] `search.js` -> `src/routes/search.rs`
- [x] `settings.js` -> `src/routes/settings.rs`
- [x] `snapshots.js` -> `src/routes/snapshots.rs`
- [x] `stats.js` -> `src/routes/stats.rs`
- [x] `stores.js` -> `src/routes/stores.rs`
- [x] `suppliers.js` -> `src/routes/suppliers.rs`

## Etapas de Migración

### Fase 1: Estructura Básica (Completada ✅)
- Configurar la estructura del proyecto
- Configurar dependencias en Cargo.toml
- Migrar la estructura de rutas

### Fase 2: Conectividad y Seguridad (Completada ✅)
- Migrar la configuración
- Implementar el administrador de base de datos
- Implementar autenticación y autorización

### Fase 3: Modelos de Datos (En progreso 🔄)
- Implementar el modelo de usuario (Completado ✅)
- Implementar modelos para productos, departamentos, etc.
- Actualizar el esquema de la base de datos

### Fase 4: Integración de Funcionalidad (Pendiente ⏳)
- Integrar funcionalidad real en cada ruta
- Implementar reportes y exportación a Excel
- Integrar búsqueda y filtros

### Fase 5: Optimización y Pruebas (Pendiente ⏳)
- Añadir pruebas unitarias
- Optimizar rendimiento
- Documentar el código

## Librerías de Rust Instaladas (Dependencias en `Cargo.toml`)

*   **actix-web**: Para el servidor web (framework principal)
*   **actix-cors**: Para el manejo de CORS
*   **tokio**: Para el runtime asíncrono
*   **serde, serde_json**: Para serialización y deserialización de datos (JSON)
*   **rusqlite**: Para la base de datos SQLite
*   **r2d2, r2d2_sqlite**: Para el pool de conexiones a la base de datos
*   **chrono**: Para manejo de fechas y horas
*   **jsonwebtoken**: Para manejar JWT (JSON Web Tokens)
*   **bcrypt**: Para el hashing de contraseñas
*   **config**: Para la gestión de configuración
*   **env_logger, log**: Para logging
*   **nanoid**: Para generación de IDs únicos
*   **rust_xlsxwriter**: Para generación de archivos Excel
*   **config**: Para gestionar la configuración desde archivos.
*   **env_logger**: Para logging.
*   **rust_xlsxwriter**: Para trabajar con archivos Excel.
*   **nanoid**: Para generar IDs únicos.

## Próximos Pasos

Ahora que hemos completado la migración de todos los archivos del backend, los próximos pasos son:

1. **Implementar Integración con Base de Datos**: Reemplazar respuestas simuladas con consultas reales a la BD.
2. **Pruebas Unitarias**: Escribir pruebas para cada módulo.
3. **Pruebas de Integración**: Verificar que todos los componentes funcionan juntos correctamente.
4. **Optimización**: Mejorar el rendimiento y uso de recursos.
5. **Documentación**: Completar la documentación de la API y el código.
6. **Implementar Websockets**: Para notificaciones en tiempo real.
7. **Refactorización**: Mejorar la estructura del código y eliminar duplicaciones.
