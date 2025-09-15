// src-backend-rust/src/schema.rs

// Este módulo podría contener funciones para gestionar migraciones
// o para verificar la integridad del esquema en el futuro.

pub const SCHEMA_SQL: &str = r#"
-- Este es un esquema simplificado basado en el original
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    display_name TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    role_id TEXT,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT UNIQUE,
    barcode TEXT UNIQUE,
    cost_price REAL,
    sales_price REAL,
    stock REAL DEFAULT 0,
    department_id TEXT,
    subdepartment_id TEXT,
    brand_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (subdepartment_id) REFERENCES subdepartments(id),
    FOREIGN KEY (brand_id) REFERENCES brands(id)
);

-- ... más tablas según sea necesario
"#;

pub fn apply_schema(conn: &rusqlite::Connection) -> rusqlite::Result<()> {
    conn.execute_batch(SCHEMA_SQL)
}