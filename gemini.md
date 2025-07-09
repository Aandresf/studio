Responde siempre en español y recuerda que estamos trabajando en windows
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

> **Nota:** Los endpoints del Dashboard (`/summary` y `/recent-sales`) actualmente usan valores de marcador de posición (placeholders) para datos como los porcentajes de cambio y la información del cliente. Estos deben ser reemplazados por consultas dinámicas a la base de datos cuando el esquema lo permita.

*   **`GET /api/dashboard/summary`**: Obtener estadísticas clave para el panel.
*   **`GET /api/dashboard/recent-sales`**: Obtener lista de ventas recientes.

### Configuración (`/api/settings`)

*   **`GET /api/settings/store`**: Obtener los detalles de la tienda.
*   **`PUT /api/settings/store`**: Actualizar los detalles de la tienda.
*   **`POST /api/database/backup`**: Iniciar respaldo de la base de datos.
*   **`POST /api/database/restore`**: Iniciar restauración de la base de datos.

### Health Check (`/api/health`)

*   **`GET /api/health`**: Verifica que el backend esté funcionando correctamente. Devuelve un estado `ok`.

---

## Estado Actual del Proyecto

La estructura inicial del proyecto ya ha sido creada, siguiendo la arquitectura definida en este documento. Existen los archivos base para el backend de Node.js (`src-backend`), el frontend de Next.js (`src`) y el lanzador de Tauri (`src-tauri`).

El proyecto se encuentra en la **fase de desarrollo e implementación activa**. El trabajo futuro debe centrarse en desarrollar los endpoints de la API y conectar los componentes del frontend, en lugar de volver a generar el código base.

**Última acción:** Se implementó un sistema de "pre-arranque" o pantalla de carga. El frontend ahora sondea el nuevo endpoint `/api/health` en el backend y muestra una pantalla de espera. La interfaz de usuario principal no se renderizará hasta que el backend confirme que está completamente operativo, evitando así errores de renderizado y mejorando la experiencia de inicio de la aplicación.

---

## Últimas Actualizaciones (9 de Julio de 2025)

Se ha realizado una revisión y refactorización exhaustiva de varios endpoints del backend para asegurar la consistencia de los datos y prevenir errores en el frontend.

1.  **Alineación de Datos (Producto):**
    *   Se modificaron los endpoints `GET /api/products` y `GET /api/products/:id`.
    *   Ahora devuelven los campos `stock` y `price` (usando alias de SQL) en lugar de `current_stock` y `average_cost`, que es lo que el frontend esperaba. Esto solucionó un error crítico que impedía renderizar la página de productos.

2.  **Robustecimiento del Backend:**
    *   Se revisaron los endpoints del Dashboard (`/api/dashboard/summary` y `/api/dashboard/recent-sales`) para que el backend maneje los valores nulos o indefinidos.
    *   Los cálculos y los datos de marcador de posición (placeholders) ahora se resuelven en el servidor, enviando una estructura de datos limpia y predecible al cliente.

3.  **Nuevos Endpoints (Compras y Ventas):**
    *   Se crearon los endpoints `GET /api/purchases` y `GET /api/sales`.
    *   Estos endpoints proporcionan listas dedicadas para el historial de compras (`ENTRADA`) y ventas (`SALIDA`), filtrando la tabla `inventory_movements`. Esto permite que las páginas de Compras y Ventas del frontend funcionen correctamente.

4.  **Implementación del Estado de Productos y Corrección de Errores:**
    *   Se solucionó un error crítico (`SQLITE_ERROR: no such column: status`) que impedía la carga de las páginas de productos, compras y ventas.
    *   Se añadió una columna `status` a la tabla `products` en la base de datos (`schema.sql`) para gestionar si un producto está 'Activo' o 'Inactivo'.
    *   Se actualizaron los endpoints del backend (`POST`, `PUT`, `GET` para productos) para que sean compatibles con el nuevo campo `status`.
    *   Se refactorizó por completo la página de productos del frontend (`products/page.tsx`) para implementar la funcionalidad de **edición**, que no existía.
    *   El diálogo de productos ahora sirve tanto para crear como para editar, y utiliza un componente `Switch` para cambiar el estado del producto.
    *   Se actualizaron las definiciones de tipos (`Product`) y las llamadas a la API (`createProduct`, `updateProduct`) para alinearlas con los cambios.


