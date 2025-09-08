const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbFile = path.join(__dirname, '../data/database_disveliz_diaz_studio_848V.db');
const backupFile = path.join(__dirname, `../data/database_backup_before_brands_attrs_migration_${Date.now()}.db`);

console.log('DB FILE:', dbFile);
console.log('BACKUP ->', backupFile);

fs.copyFileSync(dbFile, backupFile);
console.log('Backup created');

const db = new sqlite3.Database(dbFile);

function run(sql, params = []){
  return new Promise((res, rej) => db.run(sql, params, function(err){ if(err) return rej(err); res(this); }));
}
function all(sql, params = []){
  return new Promise((res, rej) => db.all(sql, params, (err, rows) => err ? rej(err) : res(rows)));
}

(async ()=>{
  try {
    console.log('Starting migration for brands and attributes...');
    await run('PRAGMA foreign_keys = OFF');
    await run('BEGIN TRANSACTION');

    // ----- BRANDS -----
    console.log('-- brands: renaming existing table');
    await run('ALTER TABLE brands RENAME TO brands_old');

    console.log('-- brands: creating new table with FK');
    await run(`CREATE TABLE brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      subdepartment_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
      FOREIGN KEY (subdepartment_id) REFERENCES subdepartments (id) ON DELETE CASCADE
    )`);

    console.log('-- brands: copying data');
    await run(`INSERT INTO brands (id, name, subdepartment_id, created_at, updated_at)
      SELECT id, name, subdepartment_id, COALESCE(created_at, strftime('%Y-%m-%d %H:%M:%S', 'now')), COALESCE(updated_at, strftime('%Y-%m-%d %H:%M:%S', 'now')) FROM brands_old`);

    console.log('-- brands: creating index');
    await run('CREATE UNIQUE INDEX IF NOT EXISTS idx_brands_subdept_name ON brands (subdepartment_id, name)');

    console.log('-- brands: dropping old table');
    await run('DROP TABLE IF EXISTS brands_old');

    // ----- ATTRIBUTES -----
    console.log('-- attributes: renaming existing table');
    await run('ALTER TABLE attributes RENAME TO attributes_old');

    console.log('-- attributes: creating new table with FK');
    await run(`CREATE TABLE attributes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      subdepartment_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
      FOREIGN KEY (subdepartment_id) REFERENCES subdepartments (id) ON DELETE CASCADE
    )`);

    console.log('-- attributes: copying data');
    await run(`INSERT INTO attributes (id, name, subdepartment_id, created_at, updated_at)
      SELECT id, name, subdepartment_id, COALESCE(created_at, strftime('%Y-%m-%d %H:%M:%S', 'now')), COALESCE(updated_at, strftime('%Y-%m-%d %H:%M:%S', 'now')) FROM attributes_old`);

    console.log('-- attributes: creating index');
    await run('CREATE UNIQUE INDEX IF NOT EXISTS idx_attributes_subdept_name ON attributes (subdepartment_id, name)');

    console.log('-- attributes: dropping old table');
    await run('DROP TABLE IF EXISTS attributes_old');

    // recreate triggers for updated_at if needed
    console.log('-- recreate triggers for updated_at');
    await run(`CREATE TRIGGER IF NOT EXISTS update_brands_updated_at AFTER UPDATE ON brands FOR EACH ROW BEGIN UPDATE brands SET updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now') WHERE id = OLD.id; END;`);
    await run(`CREATE TRIGGER IF NOT EXISTS update_attributes_updated_at AFTER UPDATE ON attributes FOR EACH ROW BEGIN UPDATE attributes SET updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now') WHERE id = OLD.id; END;`);

    await run('PRAGMA foreign_keys = ON');
    await run('COMMIT');

    console.log('Migration completed successfully');
  } catch (err) {
    console.error('Migration failed:', err);
    try { await run('ROLLBACK'); } catch(e){}
    console.error('DB rolled back. Backup is at', backupFile);
    process.exit(1);
  } finally {
    db.close();
  }
})();
