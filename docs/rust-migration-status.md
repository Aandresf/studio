# Migración del Backend a Rust - Estado Actual para Studio (Sistema de Inventario para Tienda de Ropa)

## Estructura del Backend en Rust

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
│   ├── models/                   // Modelos de datos
│   │   ├── mod.rs                // Exporta todos los modelos
│   │   ├── user.rs               // Modelo de usuario
│   │   ├── product.rs            // Modelo de producto y variantes
│   │   ├── department.rs         // Modelo de departamento y subdepartamentos
│   │   ├── brand.rs              // Modelo de marca
│   │   ├── attribute.rs          // Modelo de atributo y valores de atributos
│   │   ├── customer_supplier.rs  // Modelos de cliente y proveedor
│   │   └── inventory_movement.rs // Modelo de movimientos de inventario
│   │
│   ├── lib/
│   │   ├── mod.rs                // Módulo que agrupa librerías
│   │   ├── authorize.rs          // Middleware de autorización
│   │   ├── document_counter.rs   // Gestión de contadores de documentos
│   │   └── jwt.rs                // Gestión de tokens JWT
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
│       └── suppliers.rs          // CRUD de proveedores
│
└── Cargo.toml                    // Configuración del proyecto y dependencias
```

## Componentes Migrados

### Archivos Principales
- ✅ `main.rs` - Punto de entrada, configuración del servidor
- ✅ `config.rs` - Gestión de configuración
- ✅ `database_manager.rs` - Conexiones a la base de datos (mejorado con pool de conexiones)
- ✅ `excel_generator.rs` - Generación de archivos Excel
- ✅ `schema.rs` - Esquema de la base de datos (adaptado para Studio - tienda de ropa)

### Modelos
- ✅ `models/user.rs` - Modelo de usuario completo con funciones CRUD
- ✅ `models/product.rs` - Modelo de producto con variantes y atributos
- ✅ `models/department.rs` - Modelo de departamento con subdepartamentos
- ✅ `models/brand.rs` - Modelo de marca
- ✅ `models/attribute.rs` - Modelo de atributo con valores de atributos
- ✅ `models/customer_supplier.rs` - Modelos de cliente y proveedor
- ✅ `models/inventory_movement.rs` - Modelo de movimientos de inventario

### Librerías
- ✅ `lib/authorize.rs` - Middleware de autorización
- ✅ `lib/document_counter.rs` - Contadores para documentos secuenciales
- ✅ `lib/jwt.rs` - Gestión de tokens JWT

### Middlewares
- ✅ `middleware/auth.rs` - Middleware de autenticación
- ✅ `middleware/force_https.rs` - Forzar HTTPS en producción

### Rutas de API
- ✅ `routes/auth.rs` - Login/Logout/Status (mejorado con JWT)
- ✅ `routes/admin.rs` - Administración del sistema (solo estructura básica)
- ✅ `routes/attributes.rs` - CRUD de atributos (solo estructura básica)
- ✅ `routes/brands.rs` - CRUD de marcas (solo estructura básica)
- ✅ `routes/customers.rs` - CRUD de clientes (solo estructura básica)
- ✅ `routes/dashboard.rs` - Dashboard principal (solo estructura básica)
- ✅ `routes/departments.rs` - CRUD de departamentos (solo estructura básica)
- ✅ `routes/inventory.rs` - Gestión de inventario (solo estructura básica)
- ✅ `routes/products.rs` - CRUD de productos (solo estructura básica)
- ✅ `routes/purchases.rs` - Gestión de compras (solo estructura básica)
- ✅ `routes/reports.rs` - Generación de reportes (solo estructura básica)
- ✅ `routes/role_permissions.rs` - Gestión de roles y permisos (solo estructura básica)
- ✅ `routes/sales.rs` - Gestión de ventas (solo estructura básica)
- ✅ `routes/search.rs` - Búsqueda global (solo estructura básica)
- ✅ `routes/settings.rs` - Configuraciones del sistema (solo estructura básica)
- ✅ `routes/snapshots.rs` - Gestión de snapshots de inventario (solo estructura básica)
- ✅ `routes/stats.rs` - Estadísticas del sistema (solo estructura básica)
- ✅ `routes/suppliers.rs` - CRUD de proveedores (solo estructura básica)

## Progreso de la Migración

- ✅ **Estructura básica**: Creada y organizada
- ✅ **Rutas API**: Todas las rutas migradas (con respuestas simuladas)
- ✅ **Configuración**: Sistema de configuración completo
- ✅ **Base de datos**: Implementado esquema y conexión con pool
- ✅ **Autenticación**: Sistema de autenticación JWT implementado
- ✅ **Modelos de datos**: Todos los modelos implementados con operaciones CRUD
- ❌ **Integración completa**: Pendiente reemplazar datos simulados por consultas reales utilizando los modelos
- ❌ **Pruebas**: Pendiente de implementar pruebas unitarias y de integración

## Próximos Pasos

1. Integrar los modelos con las rutas API existentes
2. Reemplazar datos simulados con consultas reales utilizando los modelos implementados
3. Implementar pruebas unitarias para todos los modelos y rutas
4. Mejorar el manejo de errores y la validación de datos
5. Optimización del rendimiento
6. Implementar websockets para notificaciones en tiempo real
7. Mejorar la seguridad y el control de acceso

## Dependencias de Rust Utilizadas

- **actix-web**: Framework web usado para las rutas y el servidor HTTP
- **actix-cors**: Manejo de CORS para peticiones de diferentes orígenes
- **rusqlite**: Driver de SQLite para acceso a la base de datos
- **r2d2, r2d2_sqlite**: Pool de conexiones para mejor rendimiento
- **serde, serde_json**: Serialización/deserialización de datos
- **jsonwebtoken**: Generación y validación de tokens JWT
- **bcrypt**: Hashing seguro de contraseñas
- **chrono**: Manejo de fechas y tiempos
- **tokio**: Runtime asíncrono
- **rust_xlsxwriter**: Generación de archivos Excel
- **nanoid**: Generación de IDs únicos
- **env_logger, log**: Sistema de logging
- **config**: Manejo de configuración centralizada

## Notas Específicas para Studio (Tienda de Ropa)

- El esquema de la base de datos ha sido adaptado específicamente para ser compatible con el frontend existente en Angular.
- Se ha prestado especial atención a la estructura de los departamentos, subdepartamentos y productos para tiendas de ropa.
- Los campos de atributos permiten manejar variantes como talla, color, etc., típicos en inventarios de ropa.
- El modelo de datos soporta operaciones específicas para este tipo de negocio.