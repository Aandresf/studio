const express = require('express');
const router = express.Router();
const databaseManager = require('../database-manager');
const path = require('path');

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
  const map = {};
  for (const key of keys || []) {
    if (!key) continue;
    const existing = await getSql(db, 'SELECT id FROM permissions WHERE key = ?', [key]);
    if (existing) map[key] = existing.id;
    else {
      const res = await runSql(db, 'INSERT INTO permissions (key) VALUES (?)', [key]);
      map[key] = res.lastID;
    }
  }
  return map;
}

// Middleware: sólo permite al usuario con username 'master'
function requireMaster(req, res, next) {
  const u = req.currentUser;
  if (!u || u.username !== 'master') return res.status(403).json({ error: 'Forbidden: master only' });
  return next();
}

// GET / - listar roles con permisos
router.get('/', requireMaster, async (req, res) => {
  try {
    const db = databaseManager.getActiveDb();
    const roles = await allSql(db, 'SELECT id, name, description FROM roles ORDER BY name');
    for (const r of roles) {
      const rows = await allSql(db, 'SELECT p.key FROM permissions p JOIN role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id = ?', [r.id]);
      r.permissions = rows.map(x => x.key);
    }
    res.json({ roles });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /:id - obtener rol
router.get('/:id', requireMaster, async (req, res) => {
  try {
    const db = databaseManager.getActiveDb();
    const role = await getSql(db, 'SELECT id, name, description FROM roles WHERE id = ?', [req.params.id]);
    if (!role) return res.status(404).json({ error: 'Role not found' });
    const rows = await allSql(db, 'SELECT p.key FROM permissions p JOIN role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id = ?', [role.id]);
    role.permissions = rows.map(x => x.key);
    res.json(role);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /:id/permissions - reemplazar permisos del rol
router.put('/:id/permissions', requireMaster, async (req, res) => {
  try {
    const { permissions } = req.body;
    const db = databaseManager.getActiveDb();
    const role = await getSql(db, 'SELECT id FROM roles WHERE id = ?', [req.params.id]);
    if (!role) return res.status(404).json({ error: 'Role not found' });

    const map = await ensurePermissionIds(db, permissions || []);
    await runSql(db, 'DELETE FROM role_permissions WHERE role_id = ?', [req.params.id]);
    for (const key of Object.keys(map)) {
      await runSql(db, 'INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [req.params.id, map[key]]);
    }
    const rows = await allSql(db, 'SELECT p.key FROM permissions p JOIN role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id = ?', [req.params.id]);
    res.json({ permissions: rows.map(r => r.key) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /:id/permissions - añadir permisos (sin eliminar existentes)
router.post('/:id/permissions', requireMaster, async (req, res) => {
  try {
    const { permissions } = req.body;
    const db = databaseManager.getActiveDb();
    const role = await getSql(db, 'SELECT id FROM roles WHERE id = ?', [req.params.id]);
    if (!role) return res.status(404).json({ error: 'Role not found' });
    const map = await ensurePermissionIds(db, permissions || []);
    for (const key of Object.keys(map)) {
      await runSql(db, 'INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [req.params.id, map[key]]);
    }
    const rows = await allSql(db, 'SELECT p.key FROM permissions p JOIN role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id = ?', [req.params.id]);
    res.status(201).json({ permissions: rows.map(r => r.key) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /:id/permissions/:key - eliminar permiso del rol por clave
router.delete('/:id/permissions/:key', requireMaster, async (req, res) => {
  try {
    const db = databaseManager.getActiveDb();
    const role = await getSql(db, 'SELECT id FROM roles WHERE id = ?', [req.params.id]);
    if (!role) return res.status(404).json({ error: 'Role not found' });
    const perm = await getSql(db, 'SELECT id FROM permissions WHERE key = ?', [req.params.key]);
    if (!perm) return res.status(404).json({ error: 'Permission key not found' });
    // role_permissions is a pivot table; physical delete is expected here
    await runSql(db, 'DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?', [req.params.id, perm.id]);
    res.json({ message: 'deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
