#!/usr/bin/env node
const databaseManager = require('../database-manager');

function runSql(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function allSql(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function getSql(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

const PERMISSION_REQUIRES = {
  'products:create': ['brands:read','departments:read','attributes:read','variants:read']
};

function expandWithRequirements(keys) {
  const set = new Set(keys || []);
  const stack = Array.from(set);
  while (stack.length) {
    const k = stack.pop();
    const reqs = PERMISSION_REQUIRES[k];
    if (!reqs) continue;
    for (const r of reqs) {
      if (!set.has(r)) {
        set.add(r);
        stack.push(r);
      }
    }
  }
  return Array.from(set);
}

async function ensurePermissionExists(db, key) {
  const row = await getSql(db, 'SELECT id FROM permissions WHERE key = ?', [key]);
  if (row) return row.id;
  const res = await runSql(db, 'INSERT INTO permissions (key) VALUES (?)', [key]);
  return res.lastID;
}

async function migrate() {
  const db = databaseManager.getActiveDb();
  const summary = { rolesUpdated: 0, usersUpdated: 0, permsCreated: 0 };

  // Migrate roles
  const roles = await allSql(db, 'SELECT id FROM roles');
  for (const r of roles) {
    const rows = await allSql(db, 'SELECT p.key FROM permissions p JOIN role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id = ?', [r.id]);
    const keys = rows.map(x => x.key);
    const normalized = expandWithRequirements(keys);
    const missing = normalized.filter(k => !keys.includes(k));
    if (missing.length) {
      for (const k of missing) {
        const pid = await ensurePermissionExists(db, k);
        summary.permsCreated += 0; // permission might exist, count created only if new
        await runSql(db, 'INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [r.id, pid]);
      }
      summary.rolesUpdated++;
      console.log(`Updated role ${r.id}: added ${missing.length} required permissions`);
    }
  }

  // Migrate users
  const users = await allSql(db, 'SELECT id FROM users');
  for (const u of users) {
    const rows = await allSql(db, 'SELECT p.key FROM permissions p JOIN user_permissions up ON p.id = up.permission_id WHERE up.user_id = ?', [u.id]);
    const keys = rows.map(x => x.key);
    const normalized = expandWithRequirements(keys);
    const missing = normalized.filter(k => !keys.includes(k));
    if (missing.length) {
      for (const k of missing) {
        const pid = await ensurePermissionExists(db, k);
        await runSql(db, 'INSERT OR IGNORE INTO user_permissions (user_id, permission_id) VALUES (?, ?)', [u.id, pid]);
      }
      summary.usersUpdated++;
      console.log(`Updated user ${u.id}: added ${missing.length} required permissions`);
    }
  }

  console.log('Migration complete', summary);
}

migrate().catch(e => {
  console.error('Migration failed:', e && e.message);
  process.exit(1);
});
