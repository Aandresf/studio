Responde siempre en español y recuerda que estamos trabajando en windows
# Contexto y Planes de Gemini

## Objetivo: Aplicación de Escritorio con Tauri + Node.js

El objetivo es crear una aplicación de escritorio nativa usando Tauri como lanzador y un backend de Node.js (Express.js) funcionando como un proceso "Sidecar". El backend manejará toda la lógica de negocio y la comunicación con la base de datos SQLite. El frontend será la interfaz de usuario existente construida con Next.js/React.

### Arquitectura Final:

1.  **Tauri (Rust):** Actúa como el envoltorio nativo de la aplicación. Su principal responsabilidad es crear la ventana y lanzar/gestionar el proceso del servidor de Node.js.
2.  **Backend (Node.js):** Un servidor Express.js que se ejecuta localmente. Este servidor se conecta a la base de datos SQLite y expone una API REST local (ej. `http://localhost:3001/api/...`) para que el frontend la consuma.
3.  **Frontend (React):** La interfaz de usuario existente. Realizará llamadas `fetch` a la API del backend de Node.js para obtener y enviar datos.

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

La fase de implementación inicial ha concluido. El enfoque de desarrollo se centra ahora en la **evolución del sistema hacia la gestión de variantes de productos**.

**Última acción:** Se implementó un sistema de "pre-arranque" o pantalla de carga. El frontend ahora sondea el nuevo endpoint `/api/health` en el backend y muestra una pantalla de espera. La interfaz de usuario principal no se renderizará hasta que el backend confirme que está completamente operativo, evitando así errores de renderizado y mejorando la experiencia de inicio de la aplicación.

---


## Propuesta de Evolución: Gestión de Variantes de Productos (Tallas, Colores, etc.)

Para manejar de forma óptima productos con variantes (ropa, colonias, joyería), el sistema necesita evolucionar de su modelo actual **"1 Producto = 1 SKU"** a un modelo más flexible y robusto: **"1 Producto Base agrupa Múltiples Variantes (SKUs)"**.

Esto representa un cambio estructural significativo que impactará la base de datos, el backend y el frontend.

### 1. Cambios Fundamentales en la Base de Datos - realizado

Se debe modificar el `schema.sql` para adoptar un modelo relacional jerárquico.

*   **Nueva Tabla: `brands` (Marcas):**
    *   Gestionará las marcas de forma centralizada para evitar duplicados y estandarizar datos.
    *   **Columnas:** `id`, `name` (único).

*   **Tabla `products` (Producto Base):**
    *   Se convierte en un "contenedor" o plantilla.
    *   **Mantendrá:** `id`, `name`, `description`, `category`.
    *   **Se añadirá:** `brand_id` (FK a `brands`).
    *   **Se eliminarán:** `current_stock`, `cost_price`, `sale_price`. Estos datos ahora pertenecen a la variante.

*   **Nueva Tabla: `product_variants` (Variantes / SKUs):**
    *   Será la tabla principal para el inventario. Cada fila es un artículo único y vendible.
    *   **Columnas:** `id`, `product_id` (FK a `products`), `sku`, `cost_price`, `sale_price`, `current_stock`, `status`.

*   **Nuevas Tablas para Atributos Dinámicos:**
    *   **`attributes`**: Define los tipos de atributos (ej. "Talla", "Color", "Material", "Volumen").
    *   **`attribute_values`**: Define los valores posibles (ej. "Pequeño", "Rojo", "Oro", "100ml").
    *   **`variant_attribute_values` (Tabla Pivote):** Vincula una variante con sus valores de atributo (ej. `variant_id` 1 se vincula con `attribute_value_id` para "Rojo" y "Pequeño").

### 2. Actualizaciones del Backend (API) - realizado

Los endpoints actuales deben ser rediseñados para reflejar el nuevo modelo de datos.

*   **Endpoints de Productos:** `GET /api/products` deberá devolver los productos base, anidando un array con todas sus variantes. La creación (`POST`) será más compleja, aceptando el producto base y un array de variantes en una sola transacción.
*   **Endpoints de Movimientos:** `POST /api/purchases` y `POST /api/sales` operarán con un `variant_id` en lugar de un `product_id`.
*   **Nuevos Endpoints:** Se necesitarán endpoints para gestionar las marcas (`/api/brands`), los atributos (`/api/attributes` y `/api/attribute-values`).

### 3. Modificaciones del Frontend (UI/UX)

La experiencia de usuario para la gestión de productos y ventas cambiará significativamente.

*   ** - REALIZADO - Gestión de Atributos y Marcas:** Una nueva sección en "Configuración" para que el usuario defina sus propios atributos, valores y también para gestionar las marcas.
*   ** - REALIZADO - Formulario de Producto Rediseñado:** Un flujo de varios pasos:
    1.  Introducir datos del producto base (nombre, descripción, categoría y selección de marca desde una lista).
    2.  Seleccionar los atributos aplicables (Talla, Color).
    3.  Usar un **"Generador de Variantes"** para crear todas las combinaciones y asignarles SKU, stock y precios.
*   ** - REALIZADO - Flujo de Venta/Compra:**
    1.  Buscar y seleccionar el producto base.
    2.  Un modal o paso intermedio solicitará la selección de la variante específica (Talla, Color) antes de añadir al carrito.

    PENDIENTE - 

### 4. Plan de Implementación por Fases

1.  **- REALIZADO -Fase 1 (Fundamento):** Crear un **script de migración de datos** para pasar del esquema antiguo al nuevo sin perder información. Refactorizar todo el backend (capa de datos, API) y actualizar las pruebas de Jest.
2.  **- REALIZADO -Fase 2 (UI):** Implementar la gestión de atributos y rediseñar por completo el formulario de productos y los flujos de compra/venta.
3.  ** - POSPUESTO - Fase 3 (Módulos Dependientes):** Reconstruir la lógica de generación de reportes y ajustar el dashboard para que funcionen con el nuevo esquema.

---
### Notas y Tareas Pendientes (Agregado por el Usuario)

*   **- REALIZADO - Dividir el panel de creación de productos en 3 pestañas:** Datos Principales, Atributos, y Costo/Precio. Esto evitará saturar la vista en un solo panel.
*   ** Optimizar la selección en los combobox de compra y venta:** Especialmente en el de compra, para permitir cambiar el coste de los productos nuevos de forma más directa.
* ** form para departmaento y subdepartamento en la confiduracion:** Creacion del crud en la pestañá catalogo en configuracion para el departamento y subdepartamento, ya la creacion se esta implementando desde el acceso rapido en productDialog pero falta la modificacion e inactivacion y lectura
