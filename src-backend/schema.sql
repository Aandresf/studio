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
-- Tabla `departments` (Departamentos)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  abbreviation TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now'))
);

-- -----------------------------------------------------
-- Tabla `subdepartments` (Sub-departamentos)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS subdepartments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  department_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
  FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE CASCADE,
  UNIQUE(department_id, name),
  UNIQUE(department_id, abbreviation)
);

-- -----------------------------------------------------
-- Tabla `product_sequences` (Secuencias para SKU)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS product_sequences (
  department_id INTEGER NOT NULL,
  subdepartment_id INTEGER NOT NULL,
  last_number INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (department_id, subdepartment_id),
  FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE CASCADE,
  FOREIGN KEY (subdepartment_id) REFERENCES subdepartments (id) ON DELETE CASCADE
);

-- -----------------------------------------------------
-- Tabla `products` (Producto Base)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  base_sku TEXT UNIQUE,
  description TEXT DEFAULT '',
  department_id INTEGER,
  subdepartment_id INTEGER,
  brand_id INTEGER,
  status TEXT NOT NULL DEFAULT 'Activo',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
  FOREIGN KEY (brand_id) REFERENCES brands (id) ON DELETE SET NULL,
  FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE SET NULL,
  FOREIGN KEY (subdepartment_id) REFERENCES subdepartments (id) ON DELETE SET NULL
);

-- -----------------------------------------------------
-- Tabla `attributes` (Atributos)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS attributes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now'))
);

-- -----------------------------------------------------
-- Tabla `attribute_values` (Valores de Atributos)
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
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS product_variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  sku TEXT UNIQUE,
  cost_price REAL NOT NULL DEFAULT 0,
  sale_price REAL NOT NULL DEFAULT 0,
  current_stock REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Activo',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
  FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);

-- -----------------------------------------------------
-- Tabla `variant_attribute_values` (Tabla Pivote)
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
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  variant_id INTEGER NOT NULL,
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
-- Tabla `inventory_reports` y `document_counters`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  generated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
  report_data TEXT
);

CREATE TABLE IF NOT EXISTS document_counters (
  counter_type TEXT PRIMARY KEY,
  last_number INTEGER NOT NULL DEFAULT 0
);
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
CREATE TRIGGER IF NOT EXISTS update_products_updated_at AFTER UPDATE ON products FOR EACH ROW BEGIN UPDATE products SET updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now') WHERE id = OLD.id; END;
CREATE TRIGGER IF NOT EXISTS update_brands_updated_at AFTER UPDATE ON brands FOR EACH ROW BEGIN UPDATE brands SET updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now') WHERE id = OLD.id; END;
CREATE TRIGGER IF NOT EXISTS update_attributes_updated_at AFTER UPDATE ON attributes FOR EACH ROW BEGIN UPDATE attributes SET updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now') WHERE id = OLD.id; END;
CREATE TRIGGER IF NOT EXISTS update_attribute_values_updated_at AFTER UPDATE ON attribute_values FOR EACH ROW BEGIN UPDATE attribute_values SET updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now') WHERE id = OLD.id; END;
CREATE TRIGGER IF NOT EXISTS update_product_variants_updated_at AFTER UPDATE ON product_variants FOR EACH ROW BEGIN UPDATE product_variants SET updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now') WHERE id = OLD.id; END;
CREATE TRIGGER IF NOT EXISTS update_departments_updated_at AFTER UPDATE ON departments FOR EACH ROW BEGIN UPDATE departments SET updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now') WHERE id = OLD.id; END;
CREATE TRIGGER IF NOT EXISTS update_subdepartments_updated_at AFTER UPDATE ON subdepartments FOR EACH ROW BEGIN UPDATE subdepartments SET updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now') WHERE id = OLD.id; END;

-- -----------------------------------------------------
-- Índices para mejorar el rendimiento
-- -----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_movements_variant_id ON inventory_movements (variant_id);
CREATE INDEX IF NOT EXISTS idx_movements_transaction_id ON inventory_movements (transaction_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products (name);
CREATE INDEX IF NOT EXISTS idx_products_base_sku ON products (base_sku);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants (sku);
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON product_variants (product_id);
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands (name);
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments (name);
CREATE INDEX IF NOT EXISTS idx_subdepartments_name ON subdepartments (name);
 
-- -----------------------------------------------------
-- Tablas de autenticación y permisos
-- -----------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  -- legacy 'name' kept for compatibility; prefer using 'username' and 'display_name'
  name TEXT,
  username TEXT UNIQUE,
  display_name TEXT,
  email TEXT,
  role_id TEXT,
  password_hash TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
  FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now'))
);

CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  label TEXT,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now'))
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id TEXT NOT NULL,
  permission_id INTEGER NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_permissions (
  user_id TEXT NOT NULL,
  permission_id INTEGER NOT NULL,
  PRIMARY KEY (user_id, permission_id),
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE
);

-- Índices para tablas de permisos
CREATE INDEX IF NOT EXISTS idx_permissions_key ON permissions (key);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions (role_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions (user_id);
