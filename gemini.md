# Contexto y Planes de Gemini

## Plan de Base de Datos (SQLite)

Se ha creado un archivo `database.sql` que contiene el esquema de la base de datos y las consultas necesarias para la aplicación.

### Tablas Principales:

*   **`products`**: Almacena la información de cada producto (nombre, SKU, stock actual, costo promedio).
*   **`inventory_movements`**: Registra cada movimiento de inventario (entradas, salidas, retiros, auto-consumo) con su cantidad y costo.
*   **`inventory_reports`**: Guarda los reportes generados con sus rangos de fecha y los datos resultantes.

### Lógica de Reportes:

El backend utilizará consultas SQL para:
1.  Calcular la **existencia anterior** de cada producto antes de la fecha de inicio del reporte.
2.  Sumarizar los **movimientos** (entradas, salidas, etc.) dentro del período del reporte.
3.  Calcular el **costo promedio ponderado** para valorar el inventario.

