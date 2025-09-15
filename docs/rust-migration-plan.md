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
- [x] `models/product.js` -> `src/models/product.rs` (Completado con variantes y atributos)
- [x] `models/department.js` -> `src/models/department.rs` (Completado con subdepartamentos)
- [x] `models/brand.js` -> `src/models/brand.rs` (Completado)
- [x] `models/attribute.js` -> `src/models/attribute.rs` (Completado con valores de atributos)
- [x] `models/customer.js` y `models/supplier.js` -> `src/models/customer_supplier.rs` (Completado)
- [x] `models/inventory_movement.js` -> `src/models/inventory_movement.rs` (Completado)

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

### Fase 3: Modelos de Datos (Completada ✅)
- Implementar el modelo de usuario (Completado ✅)
- Implementar modelos para productos, departamentos, etc. (Completado ✅)
- Actualizar el esquema de la base de datos (Completado ✅)

### Fase 4: Integración de Funcionalidad (En progreso 🔄)
- Integrar funcionalidad real en cada ruta (En progreso 🔄)
  - ✅ Usuarios: Integración completa con manejo de errores y validaciones
  - ✅ Productos: Integración completa con manejo de errores y validaciones
  - ⏳ Resto de rutas: Pendiente de integrar con sus modelos correspondientes
- Implementar reportes y exportación a Excel (Pendiente ⏳)
- Integrar búsqueda y filtros (Pendiente ⏳)

### Fase 5: Optimización y Pruebas (Pendiente ⏳)
- Añadir pruebas unitarias
- Optimizar rendimiento
- Documentar el código

## Librerías de Rust Instaladas (Dependencias en `Cargo.toml`)

### Web y Servidor
* **actix-web** (v4.3.1): Framework web para construir el servidor HTTP/HTTPS
* **actix-cors** (v0.6.4): Middleware para gestionar Cross-Origin Resource Sharing
* **tokio** (v1.31.0): Runtime asíncrono para operaciones concurrentes

### Base de Datos y Persistencia
* **rusqlite** (v0.29.0): Driver nativo de SQLite para Rust
* **r2d2** (v0.8.10): Biblioteca para pool de conexiones genérico
* **r2d2_sqlite** (v0.22.0): Integración de SQLite con r2d2

### Serialización y Datos
* **serde** (v1.0.183): Framework de serialización/deserialización
* **serde_json** (v1.0.105): Implementación JSON para serde

### Seguridad y Autenticación
* **jsonwebtoken** (v8.3.0): Implementación de JSON Web Tokens (JWT)
* **bcrypt** (v0.15.0): Biblioteca para hashing seguro de contraseñas

### Utilidades
* **chrono** (v0.4.26): Biblioteca para manejo de fechas y horas
* **rust_xlsxwriter** (v0.46.0): Generación de archivos Excel
* **nanoid** (v0.4.0): Generador de IDs únicos alfanuméricos
* **dotenv** (v0.15.0): Carga de variables de entorno desde archivos .env

### Configuración y Logging
* **config** (v0.13.3): Gestión centralizada de configuración
* **env_logger** (v0.10.0): Logger configurable mediante variables de entorno
* **log** (v0.4.19): Fachada de logging para Rust

## Próximos Pasos

Con la implementación de todos los modelos y la integración de las rutas de usuarios y productos, los próximos pasos son:

1. **Continuar la Integración de Rutas**: Continuar reemplazando las respuestas simuladas por consultas reales en las rutas restantes:
   - Priorizar rutas críticas: attributes, brands, departments, inventory
   - Implementar rutas de operaciones: sales, purchases
   - Completar rutas auxiliares: stats, settings, search

2. **Implementación de Reportes**:
   - Integrar el generador de Excel con las rutas de reportes
   - Implementar la exportación de datos en varios formatos

3. **Pruebas y Validación**:
   - Crear pruebas unitarias para cada modelo y ruta
   - Implementar pruebas de integración para flujos completos
   - Validar la compatibilidad con el frontend actual

4. **Optimización y Seguridad**:
   - Revisar y optimizar consultas a la base de datos
   - Implementar caché donde sea beneficioso
   - Fortalecer la seguridad y el control de acceso

5. **Funcionalidades Avanzadas**:
   - Websockets para notificaciones en tiempo real
   - Sincronización entre múltiples instancias
   - Sistema de logs detallado para auditoría

6. **Documentación y Finalización**:
   - Completar la documentación de la API
   - Crear guías de despliegue y mantenimiento
   - Preparar para la puesta en producción
