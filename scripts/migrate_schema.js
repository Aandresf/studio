// scripts/migrate_schema.js
const path = require('path');
const databaseManager = require('../src-backend/database-manager');

console.log('Iniciando script de migración de esquema...');

try {
    const db = databaseManager.getActiveDb();
    console.log('Conexión a la base de datos activa establecida.');

    const migrationSteps = [
        // --- Fase 1: Crear nuevas tablas ---
        `CREATE TABLE IF NOT EXISTS departments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            abbreviation TEXT NOT NULL UNIQUE,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
            updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now'))
        );`,
        `CREATE TABLE IF NOT EXISTS subdepartments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            abbreviation TEXT NOT NULL,
            department_id INTEGER NOT NULL,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
            updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
            FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE CASCADE,
            UNIQUE(department_id, name),
            UNIQUE(department_id, abbreviation)
        );`,
        `CREATE TABLE IF NOT EXISTS product_sequences (
            department_id INTEGER NOT NULL,
            subdepartment_id INTEGER NOT NULL,
            last_number INTEGER NOT NULL DEFAULT 0,
            PRIMARY KEY (department_id, subdepartment_id),
            FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE CASCADE,
            FOREIGN KEY (subdepartment_id) REFERENCES subdepartments (id) ON DELETE CASCADE
        );`,

        // --- Fase 2: Modificar la tabla 'products' ---
        // SQLite no soporta DROP COLUMN, así que la recreamos.
        `CREATE TABLE products_new (
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
        );`,
        // Copiamos los datos existentes, las nuevas columnas se llenarán con DEFAULT o NULL
        `INSERT INTO products_new (id, name, description, brand_id, status, created_at, updated_at)
         SELECT id, name, description, brand_id, status, created_at, updated_at FROM products;`,
        `DROP TABLE products;`,
        `ALTER TABLE products_new RENAME TO products;`,

        // --- Fase 3: Añadir nuevos triggers ---
        `CREATE TRIGGER IF NOT EXISTS update_departments_updated_at AFTER UPDATE ON departments FOR EACH ROW BEGIN UPDATE departments SET updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now') WHERE id = OLD.id; END;`,
        `CREATE TRIGGER IF NOT EXISTS update_subdepartments_updated_at AFTER UPDATE ON subdepartments FOR EACH ROW BEGIN UPDATE subdepartments SET updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now') WHERE id = OLD.id; END;`,
        
        // --- Fase 4: Añadir nuevos índices ---
        `CREATE INDEX IF NOT EXISTS idx_products_base_sku ON products (base_sku);`,
        `CREATE INDEX IF NOT EXISTS idx_departments_name ON departments (name);`,
        `CREATE INDEX IF NOT EXISTS idx_subdepartments_name ON subdepartments (name);`
    ];

    db.serialize(() => {
        db.run('BEGIN TRANSACTION;', (err) => {
            if (err) throw err;
        });

        migrationSteps.forEach((step, index) => {
            db.run(step, (err) => {
                if (err) {
                    console.error(`Error en el paso ${index + 1}: ${step.substring(0, 80)}...`);
                    db.run('ROLLBACK;', () => {
                        throw err; // Lanza el error para detener el script
                    });
                }
                console.log(`Paso ${index + 1} completado.`);
            });
        });

        db.run('COMMIT;', (err) => {
            if (err) throw err;
            console.log('✅ Migración completada y confirmada exitosamente.');
        });
    });

    databaseManager.closeAllConnections();

} catch (error) {
    console.error('❌ Error durante el proceso de migración:', error.message);
    process.exit(1);
}
