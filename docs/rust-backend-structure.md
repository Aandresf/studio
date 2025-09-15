# Árbol de Estructura del Backend en Rust (`src-backend-rust`)

Este documento detalla la estructura completa del backend migrado a Rust, describiendo la función de cada archivo y su ubicación para facilitar la navegación y el mantenimiento del código.

```
src-backend-rust/
│
├── src/
│   ├── main.rs                   // Punto de entrada principal
│   ├── config.rs                 // Configuración centralizada
│   ├── database_manager.rs       // Gestión de conexiones a BD
│   ├── excel_generator.rs        // Generación de reportes Excel
│   ├── schema.rs                 // Esquema de la base de datos
│   │
│   ├── lib/
│   │   ├── mod.rs                // Módulo que agrupa librerías
│   │   ├── authorize.rs          // Middleware de autorización
│   │   └── document_counter.rs   // Gestión de contadores de documentos
│   │
│   ├── middleware/
│   │   ├── mod.rs                // Módulo que agrupa middlewares
│   │   ├── auth.rs               // Autenticación de usuarios
│   │   └── force_https.rs        // Redirección a HTTPS
│   │
│   └── routes/
│       ├── mod.rs                // Módulo que agrupa todas las rutas
│       ├── admin.rs              // Administración del sistema
│       ├── attributes.rs         // CRUD de atributos
│       ├── auth.rs               // Autenticación (login, logout)
│       ├── brands.rs             // CRUD de marcas
│       ├── customers.rs          // CRUD de clientes
│       ├── dashboard.rs          // Dashboard principal
│       ├── departments.rs        // CRUD de departamentos
│       ├── inventory.rs          // Gestión de inventario
│       ├── products.rs           // CRUD de productos
│       ├── purchases.rs          // Gestión de compras
│       ├── reports.rs            // Generación de reportes
│       ├── role_permissions.rs   // Gestión de roles y permisos
│       ├── sales.rs              // Gestión de ventas
│       ├── search.rs             // Búsqueda global
│       ├── settings.rs           // Configuraciones del sistema
│       ├── snapshots.rs          // Gestión de snapshots de inventario
│       ├── stats.rs              // Estadísticas del sistema
│       ├── stores.rs             // CRUD de tiendas/sucursales
│       ├── suppliers.rs          // CRUD de proveedores
│       └── users.rs              // Gestión de usuarios
│
├── Cargo.toml                    // Configuración del proyecto y dependencias
│
└── data/                         // Datos de la aplicación
    ├── db.sqlite                 // Base de datos principal
    ├── settings.json             // Configuraciones del sistema
    ├── .env                      // Variables de entorno
    └── certs/                    // Certificados SSL
```

---

### Descripción Detallada

#### **Raíz (`src-backend-rust/`)**

*   **`Cargo.toml`**:
    *   **Ubicación**: `src-backend-rust/Cargo.toml`
    *   **Descripción**: Archivo de configuración del proyecto Rust. Define las dependencias, metadatos del proyecto y configuración del compilador.

---

#### **Módulos Principales (`src/`)**

*   **`main.rs`**:
    *   **Ubicación**: `src-backend-rust/src/main.rs`
    *   **Descripción**: Punto de entrada principal del servidor. Inicia el framework Actix-Web, configura middlewares globales, monta todas las rutas de la API, gestiona la conexión a la base de datos y el inicio del servidor (HTTP/HTTPS).

*   **`config.rs`**:
    *   **Ubicación**: `src-backend-rust/src/config.rs`
    *   **Descripción**: Gestión de configuración centralizada. Carga y proporciona acceso a configuraciones desde archivos `.env`, `settings.json` y argumentos de línea de comandos.

*   **`database_manager.rs`**:
    *   **Ubicación**: `src-backend-rust/src/database_manager.rs`
    *   **Descripción**: Abstrae la gestión de la base de datos SQLite. Proporciona funciones para conectar a la base de datos, ejecutar consultas y manejar transacciones.

*   **`excel_generator.rs`**:
    *   **Ubicación**: `src-backend-rust/src/excel_generator.rs`
    *   **Descripción**: Utilidad para generar reportes en formato Excel (`.xlsx`) a partir de datos estructurados. Utiliza la biblioteca `rust_xlsxwriter`.

*   **`schema.rs`**:
    *   **Ubicación**: `src-backend-rust/src/schema.rs`
    *   **Descripción**: Define la estructura de la base de datos y proporciona funciones para crear y actualizar el esquema.

---

#### **Librerías (`lib/`)**

*   **`mod.rs`**:
    *   **Ubicación**: `src-backend-rust/src/lib/mod.rs`
    *   **Descripción**: Archivo de módulo que expone y organiza las librerías internas.

*   **`authorize.rs`**:
    *   **Ubicación**: `src-backend-rust/src/lib/authorize.rs`
    *   **Descripción**: Proporciona funcionalidad para verificar si un usuario tiene los permisos necesarios para acceder a recursos específicos.

*   **`document_counter.rs`**:
    *   **Ubicación**: `src-backend-rust/src/lib/document_counter.rs`
    *   **Descripción**: Implementa la lógica para gestionar contadores numéricos secuenciales para documentos como facturas o recibos.

---

#### **Middlewares (`middleware/`)**

*   **`mod.rs`**:
    *   **Ubicación**: `src-backend-rust/src/middleware/mod.rs`
    *   **Descripción**: Archivo de módulo que expone y organiza los middlewares.

*   **`auth.rs`**:
    *   **Ubicación**: `src-backend-rust/src/middleware/auth.rs`
    *   **Descripción**: Middleware de autenticación que verifica los tokens JWT y extrae la información del usuario autenticado.

*   **`force_https.rs`**:
    *   **Ubicación**: `src-backend-rust/src/middleware/force_https.rs`
    *   **Descripción**: Middleware que redirige las solicitudes HTTP a HTTPS en entornos de producción.

---

#### **Rutas de la API (`routes/`)**

*   **`mod.rs`**:
    *   **Ubicación**: `src-backend-rust/src/routes/mod.rs`
    *   **Descripción**: Archivo de módulo que registra y configura todas las rutas de la API.

*   **`admin.rs`**:
    *   **Ubicación**: `src-backend-rust/src/routes/admin.rs`
    *   **Descripción**: Endpoints para tareas administrativas como backups, restauraciones y configuraciones avanzadas del sistema.

*   **`attributes.rs`**:
    *   **Ubicación**: `src-backend-rust/src/routes/attributes.rs`
    *   **Descripción**: CRUD para atributos de productos (ej. color, talla).

*   **`auth.rs`**:
    *   **Ubicación**: `src-backend-rust/src/routes/auth.rs`
    *   **Descripción**: Endpoints para autenticación: `login`, `logout` y `check-status`.

*   **`brands.rs`**:
    *   **Ubicación**: `src-backend-rust/src/routes/brands.rs`
    *   **Descripción**: CRUD para marcas de productos.

*   **`customers.rs`**:
    *   **Ubicación**: `src-backend-rust/src/routes/customers.rs`
    *   **Descripción**: CRUD para la gestión de clientes.

*   **`dashboard.rs`**:
    *   **Ubicación**: `src-backend-rust/src/routes/dashboard.rs`
    *   **Descripción**: Endpoints para obtener datos agregados para el panel de control principal.

*   **`departments.rs`**:
    *   **Ubicación**: `src-backend-rust/src/routes/departments.rs`
    *   **Descripción**: CRUD para departamentos de productos.

*   **`inventory.rs`**:
    *   **Ubicación**: `src-backend-rust/src/routes/inventory.rs`
    *   **Descripción**: Gestión de inventario: ajustes de stock, historial de movimientos.

*   **`products.rs`**:
    *   **Ubicación**: `src-backend-rust/src/routes/products.rs`
    *   **Descripción**: CRUD completo para productos, incluyendo variantes y precios.

*   **`purchases.rs`**:
    *   **Ubicación**: `src-backend-rust/src/routes/purchases.rs`
    *   **Descripción**: Gestión de transacciones de compras a proveedores.

*   **`reports.rs`**:
    *   **Ubicación**: `src-backend-rust/src/routes/reports.rs`
    *   **Descripción**: Generación de reportes de ventas, inventario, ganancias, etc.

*   **`role_permissions.rs`**:
    *   **Ubicación**: `src-backend-rust/src/routes/role_permissions.rs`
    *   **Descripción**: API para gestionar los roles y permisos de usuarios.

*   **`sales.rs`**:
    *   **Ubicación**: `src-backend-rust/src/routes/sales.rs`
    *   **Descripción**: Gestión de transacciones de ventas a clientes.

*   **`search.rs`**:
    *   **Ubicación**: `src-backend-rust/src/routes/search.rs`
    *   **Descripción**: Endpoints para búsqueda global y específica de entidades en el sistema.

*   **`settings.rs`**:
    *   **Ubicación**: `src-backend-rust/src/routes/settings.rs`
    *   **Descripción**: API para gestionar las configuraciones del sistema.

*   **`snapshots.rs`**:
    *   **Ubicación**: `src-backend-rust/src/routes/snapshots.rs`
    *   **Descripción**: Gestión de snapshots de inventario para respaldos y comparativas.

*   **`stats.rs`**:
    *   **Ubicación**: `src-backend-rust/src/routes/stats.rs`
    *   **Descripción**: Endpoints para estadísticas y análisis de datos del sistema.

*   **`stores.rs`**:
    *   **Ubicación**: `src-backend-rust/src/routes/stores.rs`
    *   **Descripción**: CRUD para las tiendas o sucursales.

*   **`suppliers.rs`**:
    *   **Ubicación**: `src-backend-rust/src/routes/suppliers.rs`
    *   **Descripción**: CRUD para la gestión de proveedores.

*   **`users.rs`**:
    *   **Ubicación**: `src-backend-rust/src/routes/users.rs`
    *   **Descripción**: CRUD para usuarios y asignación de roles.

---

#### **Datos de la Aplicación (`data/`)**

*   **`db.sqlite`**:
    *   **Ubicación**: `src-backend-rust/data/db.sqlite`
    *   **Descripción**: Base de datos principal SQLite que almacena todos los datos del sistema.

*   **`settings.json`**:
    *   **Ubicación**: `src-backend-rust/data/settings.json`
    *   **Descripción**: Archivo JSON con configuraciones personalizables del sistema.

*   **`.env`**:
    *   **Ubicación**: `src-backend-rust/data/.env`
    *   **Descripción**: Archivo con variables de entorno para configuración del servidor.

*   **`certs/`**:
    *   **Ubicación**: `src-backend-rust/data/certs/`
    *   **Descripción**: Directorio que contiene certificados SSL para conexiones seguras HTTPS.