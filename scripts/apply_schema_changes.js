const databaseManager = require('../src-backend/database-manager');
const db = databaseManager.getActiveDb();

function columnExists(table, column) {
  return new Promise((resolve, reject) => {
    db.get("PRAGMA table_info('" + table + "')", [], (err, row) => {
      if (err) return reject(err);
      db.all("PRAGMA table_info('" + table + "')", [], (err2, rows) => {
        if (err2) return reject(err2);
        const exists = rows.some(r => r.name === column);
        resolve(exists);
      });
    });
  });
}

async function run() {
  try {
    const cols = [ 'username', 'display_name', 'name' ];
    for (const c of cols) {
      const exists = await columnExists('users', c);
      console.log('col', c, 'exists?', exists);
    }

    // Add columns if not exist
    if (!await columnExists('users', 'username')) {
      console.log('Adding column username');
      await new Promise((res, rej) => db.run("ALTER TABLE users ADD COLUMN username TEXT", (e) => e ? rej(e) : res()));
      await new Promise((res, rej) => db.run("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)", (e) => e ? rej(e) : res()));
    }
    if (!await columnExists('users', 'display_name')) {
      console.log('Adding column display_name');
      await new Promise((res, rej) => db.run("ALTER TABLE users ADD COLUMN display_name TEXT", (e) => e ? rej(e) : res()));
    }
    // ensure legacy name exists (it should)
    if (!await columnExists('users', 'name')) {
      console.log('Adding legacy column name');
      await new Promise((res, rej) => db.run("ALTER TABLE users ADD COLUMN name TEXT", (e) => e ? rej(e) : res()));
    }

    console.log('Schema changes applied.');
    process.exit(0);
  } catch (e) {
    console.error('Error applying schema changes', e);
    process.exit(1);
  }
}

run();
