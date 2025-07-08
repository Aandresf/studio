# Contexto y Planes de Gemini

## Objetivo: Aplicación de Escritorio con Tauri + Node.js

El objetivo es crear una aplicación de escritorio nativa usando Tauri como lanzador y un backend de Node.js (Express.js) funcionando como un proceso "Sidecar". El backend manejará toda la lógica de negocio y la comunicación con la base de datos SQLite. El frontend será la interfaz de usuario existente construida con Next.js/React.

### Arquitectura Final:

1.  **Tauri (Rust):** Actúa como el envoltorio nativo de la aplicación. Su principal responsabilidad es crear la ventana y lanzar/gestionar el proceso del servidor de Node.js.
2.  **Backend (Node.js):** Un servidor Express.js que se ejecuta localmente. Este servidor se conecta a la base de datos SQLite y expone una API REST local (ej. `http://localhost:3001/api/...`) para que el frontend la consuma.
3.  **Frontend (React):** La interfaz de usuario existente. Realizará llamadas `fetch` a la API del backend de Node.js para obtener y enviar datos.

## Plan de Implementación

1.  **Configurar el Entorno:** Preparar la estructura de carpetas (`src-backend`), instalar dependencias de Node.js (`express`, `sqlite3`) y configurar Tauri para permitir la ejecución de procesos sidecar.
2.  **Codificar el Backend:** Desarrollar la API en Node.js con endpoints para todas las operaciones CRUD (Productos, Compras, Ventas) y la generación de reportes.
3.  **Conectar el Frontend:** Modificar los componentes de React para que se comuniquen con la API del backend local en lugar de usar datos estáticos.
4.  **Implementar el Lanzador:** Escribir el código en `main.rs` (Rust) para iniciar y detener el servidor de Node.js junto con la aplicación.

## Plan de Base de Datos (SQLite)

El archivo `database.sql` define el esquema. El backend de Node.js será el único que interactúe con esta base de datos.

---

## Endpoints de la API Requeridos

A continuación se detallan los endpoints necesarios para dar vida al frontend.

### Productos (`/api/products`)

*   **`GET /api/products`**: Obtener la lista completa de productos.
*   **`POST /api/products`**: Crear un nuevo producto.
*   **`GET /api/products/:id`**: Obtener los detalles de un solo producto.
*   **`PUT /api/products/:id`**: Actualizar un producto existente.
*   **`DELETE /api/products/:id`**: Eliminar un producto.

### Movimientos de Inventario (`/api/inventory`)

*   **`POST /api/inventory/movements`**: Registrar un nuevo movimiento (compra, venta, etc.).

### Reportes (`/api/reports`)

*   **`POST /api/reports/inventory`**: Generar un reporte de inventario.
*   **`POST /api/reports/sales`**: Generar un "Libro de Venta".
*   **`POST /api/reports/purchases`**: Generar un "Libro de Compra".
*   **`GET /api/reports`**: Obtener historial de reportes generados.

### Dashboard (`/api/dashboard`)

*   **`GET /api/dashboard/summary`**: Obtener estadísticas clave para el panel.
*   **`GET /api/dashboard/recent-sales`**: Obtener lista de ventas recientes.

### Configuración (`/api/settings`)

*   **`GET /api/settings/store`**: Obtener los detalles de la tienda.
*   **`PUT /api/settings/store`**: Actualizar los detalles de la tienda.
*   **`POST /api/database/backup`**: Iniciar respaldo de la base de datos.
*   **`POST /api/database/restore`**: Iniciar restauración de la base de datos.


