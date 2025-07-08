-- Esquema de Base de Datos para el Sistema de Inventario (SQLite)

-- Activa la coerción de claves foráneas
PRAGMA foreign_keys = ON;

-- -----------------------------------------------------
-- Tabla `products`
-- Almacena la información de cada producto.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  current_stock REAL NOT NULL DEFAULT 0,
  average_cost REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now'))
);

-- -----------------------------------------------------
-- Tabla `inventory_movements`
-- Registra cada entrada, salida, retiro o auto-consumo de un producto.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('ENTRADA', 'SALIDA', 'RETIRO', 'AUTO-CONSUMO')),
  quantity REAL NOT NULL,
  unit_cost REAL, -- Costo unitario al momento de la entrada
  date TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
  description TEXT,
  FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);

-- -----------------------------------------------------
-- Tabla `inventory_reports`
-- Almacena los reportes de inventario generados.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  generated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
  report_data TEXT -- Almacenará el reporte en formato JSON
);


-- =====================================================
-- CONSULTAS DE EJEMPLO
-- Nota: En una aplicación real, usa parámetros (?) para prevenir inyección SQL.
-- =====================================================

-- CRUD para Products
-- -----------------------------------------------------

-- Crear un nuevo producto:
INSERT INTO products (name, sku, current_stock, average_cost) VALUES ('Producto de Ejemplo', 'SKU-001', 100, 15.50);

-- Leer un producto por ID:
SELECT * FROM products WHERE id = 1;

-- Leer todos los productos:
SELECT * FROM products;

-- Actualizar un producto (ej. el nombre):
-- La actualización de stock y costo promedio debería ser manejada por triggers o lógica de aplicación.
UPDATE products SET name = 'Nuevo Nombre de Producto', updated_at = (strftime('%Y-%m-%d %H:%M:%S', 'now')) WHERE id = 1;

-- Eliminar un producto:
DELETE FROM products WHERE id = 1;


-- CRUD para Inventory Movements
-- -----------------------------------------------------

-- Registrar una entrada de inventario:
INSERT INTO inventory_movements (product_id, type, quantity, unit_cost, description) VALUES (1, 'ENTRADA', 50, 16.00, 'Compra a proveedor X');

-- Registrar una salida (venta):
INSERT INTO inventory_movements (product_id, type, quantity, description) VALUES (1, 'SALIDA', 10, 'Venta a cliente Y');


-- Lógica para Generación de Reportes
-- -----------------------------------------------------
-- Estas son las consultas base para construir la lógica del reporte en el backend.

-- 1. Calcular Existencia Anterior (Unidades) para un producto antes de una fecha de inicio:
SELECT
  SUM(CASE WHEN type = 'ENTRADA' THEN quantity ELSE -quantity END) AS opening_stock
FROM inventory_movements
WHERE product_id = 1 AND date < '2025-01-01 00:00:00';

-- 2. Calcular Movimientos (Unidades) dentro del período del reporte para un producto:
SELECT
  type,
  SUM(quantity) as total_quantity
FROM inventory_movements
WHERE product_id = 1 AND date BETWEEN '2025-01-01 00:00:00' AND '2025-03-31 23:59:59'
GROUP BY type;

-- 3. Calcular Costo Promedio Ponderado de un producto hasta una fecha:
SELECT
  SUM(quantity * unit_cost) / SUM(quantity) AS weighted_average_cost
FROM inventory_movements
WHERE product_id = 1 AND type = 'ENTRADA' AND unit_cost IS NOT NULL AND date <= '2025-03-31 23:59:59';

