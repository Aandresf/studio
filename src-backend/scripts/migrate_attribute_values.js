const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const src = path.join(__dirname, '..', 'data', 'database_disveliz_diaz_studio_848V.db');
const bkp = path.join(path.dirname(src), 'backup_before_attribute_values_migration_' + Date.now() + '.db');

console.log('DB path:', src);
fs.copyFileSync(src, bkp);
console.log('Backup created:', bkp);

const db = new sqlite3.Database(src);

db.serialize(() => {
  db.run('BEGIN TRANSACTION;');
  db.run('ALTER TABLE attribute_values RENAME TO attribute_values_old;');

  db.run(`CREATE TABLE attribute_values (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    attribute_id INTEGER NOT NULL,
    value TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
    FOREIGN KEY (attribute_id) REFERENCES attributes (id) ON DELETE CASCADE,
    UNIQUE(attribute_id, value)
  );`, (err) => { if (err) console.error('CREATE TABLE error:', err.message); });

  db.run(`INSERT INTO attribute_values (id, attribute_id, value, created_at, updated_at)
    SELECT av.id, av.attribute_id, av.value, av.created_at, av.updated_at FROM attribute_values_old av
    JOIN attributes a ON av.attribute_id = a.id;`, (err) => { if (err) console.error('INSERT error:', err.message); });

  db.run(`CREATE TRIGGER IF NOT EXISTS update_attribute_values_updated_at
    AFTER UPDATE ON attribute_values FOR EACH ROW
    BEGIN
      UPDATE attribute_values SET updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now') WHERE id = OLD.id;
    END;`, (err) => { if (err) console.error('TRIGGER error:', err.message); });

  db.run('DROP TABLE IF EXISTS attribute_values_old;', (err) => { if (err) console.error('DROP error:', err.message); });
  db.run('COMMIT;', (err) => { if (err) console.error('COMMIT error:', err.message); else console.log('Migration committed'); });

  db.close();
  console.log('Migration script finished');
});
