
-- Activa la coerción de claves foráneas
PRAGMA foreign_keys = ON;

-- -----------------------------------------------------
-- Tabla `products`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  tax_rate REAL NOT NULL DEFAULT 16.00, -- Tasa de impuesto (ej. 16.00 para 16%). 0 para exento.
  status TEXT NOT NULL DEFAULT 'Activo', -- Puede ser 'Activo' o 'Inactivo'
  image TEXT, -- URL o path a la imagen del producto
  current_stock REAL NOT NULL DEFAULT 0,
  average_cost REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now'))
);

-- -----------------------------------------------------
-- Tabla `inventory_movements`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  type TEXT CHECK(type IN ('ENTRADA', 'SALIDA', 'RETIRO', 'AUTO-CONSUMO', 'ANULACION_ENTRADA')) NOT NULL,
  quantity REAL NOT NULL,
  unit_cost REAL, -- Costo unitario al momento de la entrada
  date TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Activo', -- Puede ser 'Activo' o 'Anulado'
  FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);

-- -----------------------------------------------------
-- Tabla `inventory_reports`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  generated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
  report_data TEXT -- Almacenará el reporte en formato JSON
);
