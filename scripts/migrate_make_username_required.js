const databaseManager = require('../src-backend/database-manager');
const db = databaseManager.getActiveDb();

function all(sql, params=[]) {
  return new Promise((resolve, reject) => db.all(sql, params, (e, rows) => e ? reject(e) : resolve(rows)));
}
function run(sql, params=[]) {
  return new Promise((resolve, reject) => db.run(sql, params, function(e) { if (e) return reject(e); resolve(this); }));
}
function get(sql, params=[]) {
  return new Promise((resolve, reject) => db.get(sql, params, (e, row) => e ? reject(e) : resolve(row)));
}

(async function(){
  try {
    console.log('Starting migration to enforce username NOT NULL UNIQUE...');
    const users = await all('SELECT id, name, username, display_name FROM users');

    // Build unique username set
    const taken = new Set();
    for (const u of users) {
      if (u.username) taken.add(u.username);
    }

    // Prepare final mapping and ensure uniqueness
    const updates = [];
    for (const u of users) {
      let base = (u.username || u.name || u.display_name || 'user').toString().trim();
      let candidate = base.replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_\-]/g,'').toLowerCase();
      if (!candidate) candidate = 'user';
      let final = candidate;
      let i = 1;
      while (taken.has(final)) {
        final = `${candidate}_${i++}`;
      }
      taken.add(final);
      updates.push({ id: u.id, username: final, display_name: u.display_name || u.name || final });
    }

    // Create new table users_new with username NOT NULL UNIQUE and no legacy name
    await run(`CREATE TABLE IF NOT EXISTS users_new (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      display_name TEXT,
      email TEXT,
      role_id TEXT,
      password_hash TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
      FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE SET NULL
    )`);

    // Copy rows
    const insertStmt = db.prepare('INSERT INTO users_new (id, username, display_name, email, role_id, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    for (const u of updates) {
      const old = await get('SELECT email, role_id, password_hash, created_at, updated_at FROM users WHERE id = ?', [u.id]);
      insertStmt.run(u.id, u.username, u.display_name, old ? old.email : null, old ? old.role_id : null, old ? old.password_hash : null, old ? old.created_at : null, old ? old.updated_at : null);
      console.log('Prepared copy', u.id, u.username);
    }
    insertStmt.finalize();

    // Swap tables safely inside transaction
    await run('BEGIN TRANSACTION');
    await run('ALTER TABLE users RENAME TO users_old');
    await run('ALTER TABLE users_new RENAME TO users');
    await run('COMMIT');

    console.log('Migration complete. Old table renamed to users_old. Please verify and drop users_old when satisfied.');
    process.exit(0);
  } catch (e) {
    console.error('Migration failed', e);
    try { await run('ROLLBACK'); } catch(_){}
    process.exit(1);
  }
})();
