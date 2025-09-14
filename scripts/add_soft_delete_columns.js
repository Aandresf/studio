// Script de migración: añade status, deleted_at y deleted_by a tablas que no lo tienen.
// Uso: node scripts\\add_soft_delete_columns.js

const databaseManager = require('../src-backend/database-manager');
const util = require('util');

async function hasColumn(db, table, column) {
  const get = util.promisify(db.get.bind(db));
  const row = await get("PRAGMA table_info('" + table + "')");
  // PRAGMA table_info returns multiple rows; we need to run all and check
  const all = util.promisify(db.all.bind(db));
  const cols = await all("PRAGMA table_info('" + table + "')");
  return cols.some(c => c.name === column);
}

async function run(db, sql) {
  const runp = util.promisify(db.run.bind(db));
  return runp(sql);
}

async function migrate() {
  try {
    const db = databaseManager.getActiveDb();
    const tables = [
      'customers',
      'suppliers',
      'brands',
      'departments',
      'subdepartments',
      'attributes',
      'attribute_values',
      'users',
      'roles',
      'permissions'
      // no añadimos inventory_movements/products/product_variants porque ya tienen status
    ];

    for (const t of tables) {
      console.log('Procesando tabla', t);
      const hasStatus = await hasColumn(db, t, 'status');
      if (!hasStatus) {
        console.log(`- Añadiendo columna status a ${t}`);
        try {
          await run(db, `ALTER TABLE ${t} ADD COLUMN status TEXT NOT NULL DEFAULT 'Activo'`);
        } catch (e) {
          console.error(`  Error al añadir status a ${t}:`, e.message);
        }
      } else {
        console.log(`- status ya existe en ${t}`);
      }

      const hasDeletedAt = await hasColumn(db, t, 'deleted_at');
      if (!hasDeletedAt) {
        console.log(`- Añadiendo columna deleted_at a ${t}`);
        try {
          await run(db, `ALTER TABLE ${t} ADD COLUMN deleted_at TEXT NULL`);
        } catch (e) {
          console.error(`  Error al añadir deleted_at a ${t}:`, e.message);
        }
      } else {
        console.log(`- deleted_at ya existe en ${t}`);
      }

      const hasDeletedBy = await hasColumn(db, t, 'deleted_by');
      if (!hasDeletedBy) {
        console.log(`- Añadiendo columna deleted_by a ${t}`);
        try {
          await run(db, `ALTER TABLE ${t} ADD COLUMN deleted_by TEXT NULL`);
        } catch (e) {
          console.error(`  Error al añadir deleted_by a ${t}:`, e.message);
        }
      } else {
        console.log(`- deleted_by ya existe en ${t}`);
      }
    }

    console.log('Migración completada.');
    process.exit(0);
  } catch (err) {
    console.error('Fallo en migración:', err);
    process.exit(1);
  }
}

migrate();
