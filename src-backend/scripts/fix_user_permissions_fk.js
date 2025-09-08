const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../data/database_disveliz_diaz_studio_848V.db');
console.log('DB PATH:', dbPath);
const db = new sqlite3.Database(dbPath, (err) => { if (err) return console.error('OPEN ERR', err.message); });

db.serialize(() => {
  db.run('PRAGMA foreign_keys = OFF;');
  db.run('BEGIN TRANSACTION;');

  db.run(`ALTER TABLE user_permissions RENAME TO user_permissions_old;`);

  db.run(`CREATE TABLE user_permissions (
    user_id TEXT NOT NULL,
    permission_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, permission_id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE
  );`, (err) => {
    if (err) return console.error('CREATE ERR', err.message);
  });

  db.run(`INSERT OR IGNORE INTO user_permissions (user_id, permission_id)
          SELECT up.user_id, up.permission_id FROM user_permissions_old up
          JOIN users u ON u.id = up.user_id
          JOIN permissions p ON p.id = up.permission_id;`, (err) => {
    if (err) console.error('COPY ERR', err.message);
  });

  db.run('DROP TABLE IF EXISTS user_permissions_old;');
  db.run('PRAGMA foreign_keys = ON;');
  db.run('COMMIT;', (err) => {
    if (err) console.error('COMMIT ERR', err.message);
    console.log('Migration finished');
    db.close();
  });
});
