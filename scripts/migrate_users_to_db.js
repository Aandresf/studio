const fs = require('fs');
const path = require('path');
const databaseManager = require('../src-backend/database-manager');
const { dataDir } = require('../src-backend/config');

async function run() {
  try {
    console.log('Obteniendo conexión a la BD activa...');
    const db = databaseManager.getActiveDb();

    // Leer users.json
    const usersJsonPath = path.join(__dirname, '..', 'src-backend', 'data', 'users.json');
    if (!fs.existsSync(usersJsonPath)) {
      console.error('No se encontró users.json en src-backend/data');
      process.exit(1);
    }

    const raw = fs.readFileSync(usersJsonPath, 'utf8');
    const data = JSON.parse(raw);

    const permissionsList = data.permissionsList || [];
    const roles = data.roles || [];
    const users = data.users || [];

    // Empezar transacción
    await execSql(db, 'BEGIN TRANSACTION');

    // Insertar permisos y mantener map key -> id
    const permIdByKey = {};
    for (let key of permissionsList) {
      if (!key) continue;
      const row = await getSql(db, 'SELECT id FROM permissions WHERE key = ?', [key]);
      if (row) {
        permIdByKey[key] = row.id;
      } else {
        const res = await runSql(db, 'INSERT INTO permissions (key) VALUES (?)', [key]);
        permIdByKey[key] = res.lastID;
      }
    }

    // Insertar roles
    for (let r of roles) {
      const roleId = r.id || r.name;
      const existing = await getSql(db, 'SELECT id FROM roles WHERE id = ? OR name = ?', [roleId, r.name]);
      if (!existing) {
        await runSql(db, 'INSERT INTO roles (id, name, description) VALUES (?, ?, ?)', [roleId, r.name, r.description || null]);
      }

      // role.permissions are indices into permissionsList
      const permsIdx = r.permissions || [];
      for (let pIdx of permsIdx) {
        const key = permissionsList[pIdx];
        if (!key) continue;
        const pid = permIdByKey[key];
        if (!pid) continue;
        await runSql(db, 'INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [roleId, pid]);
      }
    }

    // Insertar users
    for (let u of users) {
      const userId = u.id;
      const existing = await getSql(db, 'SELECT id FROM users WHERE id = ?', [userId]);
      if (!existing) {
        await runSql(db, 'INSERT INTO users (id, name, email, role_id) VALUES (?, ?, ?, ?)', [userId, u.name || u.displayName || 'User', u.email || null, u.roleId || null]);
      } else {
        await runSql(db, 'UPDATE users SET name = ?, email = ?, role_id = ? WHERE id = ?', [u.name || u.displayName || 'User', u.email || null, u.roleId || null, userId]);
      }

      const permsIdx = u.permissions || [];
      for (let pIdx of permsIdx) {
        const key = permissionsList[pIdx];
        if (!key) continue;
        const pid = permIdByKey[key];
        if (!pid) continue;
        await runSql(db, 'INSERT OR IGNORE INTO user_permissions (user_id, permission_id) VALUES (?, ?)', [userId, pid]);
      }
    }

    await execSql(db, 'COMMIT');
    console.log('Migración completada con éxito.');
    process.exit(0);
  } catch (err) {
    console.error('Error durante migración:', err);
    try {
      const db = databaseManager.getActiveDb();
      await execSql(db, 'ROLLBACK');
    } catch (e) {}
    process.exit(1);
  }
}

function runSql(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) return reject(err);
      resolve(this);
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

function execSql(db, sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

run();
