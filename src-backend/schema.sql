-- Activa la coerción de claves foráneas
PRAGMA foreign_keys = ON;

-- -----------------------------------------------------
-- Tabla `brands`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS brands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now'))
);

-- -----------------------------------------------------
-- Tabla `products` (Producto Base)
-- Se convierte en un "contenedor" o plantilla.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT, -- Categoría del producto (ej. Ropa, Electrónica)
  subcategory TEXT, -- Sub-categoría del producto
  brand_id INTEGER, -- FK a la tabla `brands`
  status TEXT NOT NULL DEFAULT 'Activo', -- 'Activo' o 'Inactivo'
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
  FOREIGN KEY (brand_id) REFERENCES brands (id) ON DELETE SET NULL
);

-- -----------------------------------------------------
-- Tabla `attributes` (Atributos)
-- Define los tipos de atributos (ej. "Talla", "Color").
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS attributes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now'))
);

-- -----------------------------------------------------
-- Tabla `attribute_values` (Valores de Atributos)
-- Define los valores posibles para cada atributo (ej. "S", "M", "Rojo", "Azul").
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS attribute_values (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  attribute_id INTEGER NOT NULL,
  value TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
  FOREIGN KEY (attribute_id) REFERENCES attributes (id) ON DELETE CASCADE,
  UNIQUE(attribute_id, value)
);

-- -----------------------------------------------------
-- Tabla `product_variants` (Variantes de Producto / SKUs)
-- Cada fila es un artículo único y vendible.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS product_variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  sku TEXT UNIQUE,
  cost_price REAL NOT NULL DEFAULT 0,
  sale_price REAL NOT NULL DEFAULT 0,
  current_stock REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Activo', -- 'Activo' o 'Inactivo'
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
  FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);

-- -----------------------------------------------------
-- Tabla `variant_attribute_values` (Tabla Pivote)
-- Vincula una variante con sus valores de atributo.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS variant_attribute_values (
  variant_id INTEGER NOT NULL,
  attribute_value_id INTEGER NOT NULL,
  PRIMARY KEY (variant_id, attribute_value_id),
  FOREIGN KEY (variant_id) REFERENCES product_variants (id) ON DELETE CASCADE,
  FOREIGN KEY (attribute_value_id) REFERENCES attribute_values (id) ON DELETE CASCADE
);

-- -----------------------------------------------------
-- Tabla `inventory_movements`
-- Se modifica para apuntar a `product_variants` en lugar de `products`.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  variant_id INTEGER NOT NULL, -- Cambiado de product_id a variant_id
  transaction_id TEXT NOT NULL,
  transaction_date DATETIME NOT NULL,
  entity_name TEXT,
  entity_document TEXT,
  document_number TEXT,
  type TEXT CHECK(type IN ('ENTRADA', 'SALIDA', 'RETIRO', 'AUTO-CONSUMO', 'AJUSTE')) NOT NULL,
  quantity REAL NOT NULL,
  unit_cost REAL,
  price REAL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Activo',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
  FOREIGN KEY (variant_id) REFERENCES product_variants (id) ON DELETE CASCADE
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

-- -----------------------------------------------------
-- Tabla `document_counters`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS document_counters (
  counter_type TEXT PRIMARY KEY,
  last_number INTEGER NOT NULL DEFAULT 0
);

-- Inicializar los contadores si no existen
INSERT OR IGNORE INTO document_counters (counter_type, last_number) VALUES ('AUTO_PURCHASE', 0);
INSERT OR IGNORE INTO document_counters (counter_type, last_number) VALUES ('AUTO_SALE', 0);

-- -----------------------------------------------------
-- Tabla `inventory_snapshots`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  snapshot_date TEXT NOT NULL,
  closing_stock REAL NOT NULL,
  closing_average_cost REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
  FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
  UNIQUE(product_id, snapshot_date)
);

-- -----------------------------------------------------
-- Triggers para `updated_at`
-- -----------------------------------------------------
CREATE TRIGGER IF NOT EXISTS update_products_updated_at
AFTER UPDATE ON products
FOR EACH ROW
BEGIN
  UPDATE products SET updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS update_brands_updated_at
AFTER UPDATE ON brands
FOR EACH ROW
BEGIN
  UPDATE brands SET updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS update_attributes_updated_at
AFTER UPDATE ON attributes
FOR EACH ROW
BEGIN
  UPDATE attributes SET updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS update_attribute_values_updated_at
AFTER UPDATE ON attribute_values
FOR EACH ROW
BEGIN
  UPDATE attribute_values SET updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS update_product_variants_updated_at
AFTER UPDATE ON product_variants
FOR EACH ROW
BEGIN
  UPDATE product_variants SET updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now') WHERE id = OLD.id;
END;

-- -----------------------------------------------------
-- Índices para mejorar el rendimiento
-- -----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_movements_variant_id ON inventory_movements (variant_id); -- Cambiado de product_id
CREATE INDEX IF NOT EXISTS idx_movements_transaction_id ON inventory_movements (transaction_id);
CREATE INDEX IF NOT EXISTS idx_movements_date ON inventory_movements (transaction_date);
CREATE INDEX IF NOT EXISTS idx_products_name ON products (name);
CREATE INDEX IF NOT EXISTS idx_products_status ON products (status);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants (sku);
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON product_variants (product_id);
CREATE INDEX IF NOT EXISTS idx_movements_status ON inventory_movements (status);
CREATE INDEX IF NOT EXISTS idx_movements_type ON inventory_movements (type);
CREATE INDEX IF NOT EXISTS idx_snapshots_product_date ON inventory_snapshots (product_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands (name);
CREATE INDEX IF NOT EXISTS idx_attributes_name ON attributes (name);
CREATE INDEX IF NOT EXISTS idx_attribute_values_value ON attribute_values (value);
