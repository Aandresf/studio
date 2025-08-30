const express = require('express');
const { nanoid } = require('nanoid');
const router = express.Router();
const { requirePermission } = require('../lib/authorize');
const databaseManager = require('../database-manager');

// Utilities for DB
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

async function ensurePermissionIds(db, keys) {
  // keys: array of permission keys (strings). Returns map key->id
  const map = {};
  for (const key of keys) {
    if (!key) continue;
    const existing = await getSql(db, 'SELECT id FROM permissions WHERE key = ?', [key]);
    if (existing) {
      map[key] = existing.id;
    } else {
      const res = await runSql(db, 'INSERT INTO permissions (key) VALUES (?)', [key]);
      map[key] = res.lastID;
    }
  }
  return map;
}

async function getPermissionsForUser(db, userId) {
  const rows = await allSql(db, `SELECT p.key FROM permissions p JOIN user_permissions up ON p.id = up.permission_id WHERE up.user_id = ?`, [userId]);
  return rows.map(r => r.key);
}

async function getPermissionsForRole(db, roleId) {
  const rows = await allSql(db, `SELECT p.key FROM permissions p JOIN role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id = ?`, [roleId]);
  return rows.map(r => r.key);
}

// GET / - listar usuarios y roles
router.get('/', async (req, res) => {
  try {
    const db = databaseManager.getActiveDb();
  const users = await allSql(db, 'SELECT id, name as username, name as displayName, email, role_id as roleId FROM users');
    const roles = await allSql(db, 'SELECT id, name, description FROM roles');

    // Expand permissions for each user and role
    for (const u of users) {
      u.permissions = await getPermissionsForUser(db, u.id);
    }
    for (const r of roles) {
      r.permissions = await getPermissionsForRole(db, r.id);
    }

    const permissionsListRows = await allSql(db, 'SELECT key FROM permissions ORDER BY id');
    const permissionsList = permissionsListRows.map(r => r.key);
    res.json({ users, roles, permissionsList });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id - obtener usuario
router.get('/:id', async (req, res) => {
  try {
    const db = databaseManager.getActiveDb();
  const user = await getSql(db, 'SELECT id, name as username, name as displayName, email, role_id as roleId FROM users WHERE id = ?', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    user.permissions = await getPermissionsForUser(db, user.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / - crear usuario
router.post('/', requirePermission('users:create'), async (req, res) => {
  try {
    const { username, displayName, roleId, permissions } = req.body;
    if (!username) return res.status(400).json({ error: 'username es requerido' });
    const db = databaseManager.getActiveDb();

    // Check username uniqueness
    const existing = await getSql(db, 'SELECT id FROM users WHERE name = ?', [username]);
    if (existing) return res.status(400).json({ error: 'username ya existe' });

    const userId = nanoid(8);
    await runSql(db, 'INSERT INTO users (id, name, email, role_id, created_at) VALUES (?, ?, ?, ?, datetime("now"))', [userId, username, null, roleId || null]);

    // Determine permissions to assign: if provided, use them; otherwise copy from role
    let keysToAssign = [];
    if (Array.isArray(permissions)) {
      keysToAssign = permissions;
    } else if (roleId) {
      keysToAssign = await getPermissionsForRole(db, roleId);
    }

    // Ensure permission rows exist and assign
    const map = await ensurePermissionIds(db, keysToAssign);
    for (const key of Object.keys(map)) {
      await runSql(db, 'INSERT OR IGNORE INTO user_permissions (user_id, permission_id) VALUES (?, ?)', [userId, map[key]]);
    }

  const user = await getSql(db, 'SELECT id, name as username, name as displayName, email, role_id as roleId, created_at as createdAt FROM users WHERE id = ?', [userId]);
  user.permissions = await getPermissionsForUser(db, userId);
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /:id - actualizar usuario (incluye roleId y permisos)
router.put('/:id', requirePermission('users:edit'), async (req, res) => {
  try {
    const { username, displayName, roleId, permissions } = req.body;
    const db = databaseManager.getActiveDb();
    const user = await getSql(db, 'SELECT id, name, email, role_id as roleId FROM users WHERE id = ?', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (user.name === 'master' && req.body.deleted) {
      return res.status(400).json({ error: 'No se puede eliminar el usuario master' });
    }

    // Update basic fields
    await runSql(db, 'UPDATE users SET name = ?, role_id = ?, updated_at = datetime("now") WHERE id = ?', [username || user.name, roleId || user.roleId, req.params.id]);

    // If permissions provided, replace user_permissions
    if (typeof permissions !== 'undefined') {
      // Ensure permission records
      const map = await ensurePermissionIds(db, permissions);
      // Delete current user_permissions
      await runSql(db, 'DELETE FROM user_permissions WHERE user_id = ?', [req.params.id]);
      for (const key of Object.keys(map)) {
        await runSql(db, 'INSERT OR IGNORE INTO user_permissions (user_id, permission_id) VALUES (?, ?)', [req.params.id, map[key]]);
      }
    }

  const updated = await getSql(db, 'SELECT id, name as username, name as displayName, email, role_id as roleId, updated_at as updatedAt FROM users WHERE id = ?', [req.params.id]);
  updated.permissions = await getPermissionsForUser(db, req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id - eliminar usuario (marcar o eliminar físicamente)
router.delete('/:id', requirePermission('users:delete'), async (req, res) => {
  try {
    const db = databaseManager.getActiveDb();
    const user = await getSql(db, 'SELECT id, name FROM users WHERE id = ?', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (user.name === 'master') return res.status(400).json({ error: 'No se puede eliminar el usuario master' });
    await runSql(db, 'DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'Usuario eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id/permissions - obtener permisos efectivos (role + directos)
router.get('/:id/permissions', async (req, res) => {
  try {
    const db = databaseManager.getActiveDb();
    const user = await getSql(db, 'SELECT id FROM users WHERE id = ?', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    const direct = await getPermissionsForUser(db, req.params.id);
    res.json({ permissions: direct });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /:id/permissions - reemplazar permisos directos (no cambia role)
router.put('/:id/permissions', requirePermission('users:permissions'), async (req, res) => {
  try {
    const { permissions } = req.body;
    const db = databaseManager.getActiveDb();
    const user = await getSql(db, 'SELECT id FROM users WHERE id = ?', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Ensure permission records exist and replace user_permissions
    const map = await ensurePermissionIds(db, permissions || []);
    await runSql(db, 'DELETE FROM user_permissions WHERE user_id = ?', [req.params.id]);
    for (const key of Object.keys(map)) {
      await runSql(db, 'INSERT OR IGNORE INTO user_permissions (user_id, permission_id) VALUES (?, ?)', [req.params.id, map[key]]);
    }
    const direct = await getPermissionsForUser(db, req.params.id);
    res.json({ permissions: direct });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
