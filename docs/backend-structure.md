# Árbol de Estructura del Backend (`src-backend`)

Este documento detalla la estructura completa del backend, describiendo la función de cada archivo y su ubicación para facilitar la navegación y el mantenimiento del código.

```
src-backend/
│
├── index.js
│
├── config.js
├── database-manager.js
├── excel-generator.js
├── schema.sql
├── serve-exported-frontend.js
├── spa-fallback.js
│
├── data/
│   └── (Contiene la base de datos, archivos .env, certificados y otros datos de la aplicación)
│
├── lib/
│   ├── authorize.js
│   └── documentCounter.js
│
├── middleware/
│   ├── auth.js
│   └── force-https.js
│
├── routes/
│   ├── admin.js
│   ├── attributes.js
│   ├── auth.js
│   ├── bind-ip.js
│   ├── brands.js
│   ├── customers.js
│   ├── dashboard.js
│   ├── debug.js
│   ├── departments.js
│   ├── generate-certificate.js
│   ├── init-default-users.js
│   ├── inventory.js
│   ├── network-interfaces.js
│   ├── pending-transactions.js
│   ├── products.js
│   ├── purchases.js
│   ├── reports.js
│   ├── role-permissions.js
│   ├── sales.js
│   ├── sku.js
│   ├── stores.js
│   ├── subdepartments.js
│   ├── suppliers.js
│   ├── temp-cert.js
│   ├── transactions.js
│   ├── users.js
│   └── variants.js
│
└── scripts/
    └── (Contiene scripts para migraciones de datos, pruebas y tareas de mantenimiento)
```

---

### Descripción Detallada

#### **Raíz (`src-backend/`)**

*   **`index.js`**:
    *   **Ubicación**: `src-backend/index.js`
    *   **Descripción**: Punto de entrada principal del servidor. Inicia `Express.js`, configura middlewares globales (CORS, JSON parser, auth), monta todas las rutas de la API, gestiona la conexión a la base de datos y el inicio del servidor (HTTP/HTTPS).

*   **`config.js`**:
    *   **Ubicación**: `src-backend/config.js`
    *   **Descripción**: Exporta configuraciones clave, como la ruta al directorio de datos (`dataDir`), permitiendo un acceso centralizado a las rutas de archivos importantes.

*   **`database-manager.js`**:
    *   **Ubicación**: `src-backend/database-manager.js`
    *   **Descripción**: Abstrae la gestión de la base de datos SQLite. Se encarga de crear, obtener y cerrar conexiones a las bases de datos de las diferentes tiendas.

*   **`excel-generator.js`**:
    *   **Ubicación**: `src-backend/excel-generator.js`
    *   **Descripción**: Utilidad para generar reportes en formato Excel (`.xlsx`) a partir de datos JSON, usada principalmente por la ruta de reportes.

*   **`schema.sql`**:
    *   **Ubicación**: `src-backend/schema.sql`
    *   **Descripción**: Contiene las sentencias SQL (`CREATE TABLE`) para definir la estructura de la base de datos. Se ejecuta al iniciar el servidor para garantizar que el esquema esté correctamente configurado.

*   **`serve-exported-frontend.js`**:
    *   **Ubicación**: `src-backend/serve-exported-frontend.js`
    *   **Descripción**: Módulo para servir los archivos estáticos del frontend (Next.js exportado) cuando la aplicación se empaqueta.

*   **`spa-fallback.js`**:
    *   **Ubicación**: `src-backend/spa-fallback.js`
    *   **Descripción**: Configura un fallback para aplicaciones de una sola página (SPA). Redirige todas las rutas no encontradas en la API al `index.html` del frontend, permitiendo que el enrutador del cliente funcione correctamente.

---

#### **Carpetas Principales**

*   **`data/`**:
    *   **Ubicación**: `src-backend/data/`
    *   **Descripción**: Directorio de datos de la aplicación. Almacena archivos críticos como la base de datos (`.db`), variables de entorno (`.env`), certificados SSL (`.certs`), y otros archivos generados en tiempo de ejecución. **No debe contener código fuente.**

*   **`lib/`**:
    *   **Ubicación**: `src-backend/lib/`
    *   **Descripción**: Contiene librerías y utilidades de ayuda reutilizables en diferentes partes de la aplicación.
    *   **`authorize.js`**: Middleware para verificar si un usuario tiene los permisos necesarios para acceder a una ruta específica.
    *   **`documentCounter.js`**: Lógica para gestionar contadores numéricos secuenciales para documentos como facturas o recibos.

*   **`middleware/`**:
    *   **Ubicación**: `src-backend/middleware/`
    *   **Descripción**: Contiene middlewares de Express que procesan las peticiones antes de que lleguen a las rutas.
    *   **`auth.js`**: Verifica la sesión del usuario en cada petición, decodifica el token/cookie y adjunta los datos del usuario (`req.user`) al objeto de la petición.
    *   **`force-https.js`**: Redirige el tráfico de HTTP a HTTPS en entornos de producción.

*   **`scripts/`**:
    *   **Ubicación**: `src-backend/scripts/`
    *   **Descripción**: Almacena scripts independientes para tareas de mantenimiento, migraciones de base de datos, pruebas o automatizaciones que no forman parte del flujo normal de la API.

---

#### **Rutas de la API (`src-backend/routes/`)**

Cada archivo define un conjunto de endpoints relacionados con una entidad o funcionalidad específica.

*   **`admin.js`**: Rutas para tareas administrativas (backups, restauraciones, configuraciones avanzadas).
*   **`attributes.js`**: CRUD para atributos de productos (ej. color, talla).
*   **`auth.js`**: Endpoints para autenticación: `login`, `logout`, `status`.
*   **`bind-ip.js`**: Ruta para guardar la configuración de la IP del servidor.
*   **`brands.js`**: CRUD para marcas de productos.
*   **`customers.js`**: CRUD para la gestión de clientes.
*   **`dashboard.js`**: Endpoints para obtener datos agregados para el panel de control principal.
*   **`debug.js`**: Rutas de depuración para desarrolladores.
*   **`departments.js`**: CRUD para departamentos y subdepartamentos de productos.
*   **`generate-certificate.js`**: Lógica para generar certificados SSL autofirmados.
*   **`init-default-users.js`**: Lógica para asegurar que los usuarios y roles por defecto existan en el sistema.
*   **`inventory.js`**: Gestión de inventario: ajustes de stock, historial de movimientos.
*   **`network-interfaces.js`**: Endpoint para listar las interfaces de red disponibles en el servidor.
*   **`pending-transactions.js`**: Manejo de transacciones (ventas/compras) guardadas como pendientes.
*   **`products.js`**: CRUD completo para productos, incluyendo variantes y precios.
*   **`purchases.js`**: Gestión de transacciones de compras a proveedores.
*   **`reports.js`**: Generación de reportes de ventas, inventario, ganancias, etc.
*   **`role-permissions.js`**: API para gestionar los permisos asociados a cada rol de usuario.
*   **`sales.js`**: Gestión de transacciones de ventas a clientes.
*   **`sku.js`**: API para generar SKUs (códigos de producto) únicos.
*   **`stores.js`**: CRUD para las tiendas o sucursales.
*   **`subdepartments.js`**: CRUD para subdepartamentos (ruta de compatibilidad).
*   **`suppliers.js`**: CRUD para la gestión de proveedores.
*   **`temp-cert.js`**: Ruta temporal para servir certificados durante la configuración inicial.
*   **`transactions.js`**: Lógica para anular transacciones (ventas y compras).
*   **`users.js`**: CRUD para usuarios y asignación de roles.
*   **`variants.js`**: CRUD específico para las variantes de productos.
