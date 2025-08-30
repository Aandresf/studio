const express = require('express');
const fs = require('fs');
const path = require('path');
const { nanoid } = require('nanoid');
const router = express.Router();
const { requirePermission } = require('../lib/authorize');

const { dataDir } = require('../config');
const USERS_FILE = path.join(dataDir, 'users.json');

function readUsersData() {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({ users: [], roles: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

function writeUsersData(data) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

function expandPermissionsArray(arr, permissionsList) {
  if (!Array.isArray(arr)) return [];
  return arr.map(p => {
    if (typeof p === 'number') return permissionsList?.[p] ?? null;
    return p;
  }).filter(Boolean);
}

function mapPermsToIndices(permsInput, data) {
  // permsInput can be array of strings or numbers; ensure storage as indices
  const list = data.permissionsList || [];
  const indices = [];
  (permsInput || []).forEach(p => {
    if (typeof p === 'number') {
      if (typeof list[p] !== 'undefined') indices.push(p);
      return;
    }
    // p is string
    let idx = list.indexOf(p);
    if (idx === -1) {
      // add new permission to list and use new index
      idx = list.length;
      list.push(p);
    }
    indices.push(idx);
  });
  // persist any new permissions added to list back into data
  data.permissionsList = list;
  return indices;
}

function expandUserForResponse(user, data) {
  const out = { ...user };
  out.permissions = expandPermissionsArray(user.permissions, data.permissionsList);
  return out;
}

function expandRoleForResponse(role, data) {
  const out = { ...role };
  out.permissions = expandPermissionsArray(role.permissions, data.permissionsList);
  return out;
}

// GET / - listar usuarios y roles
router.get('/', (req, res) => {
  try {
  const data = readUsersData();
  const users = (data.users || []).map(u => expandUserForResponse(u, data));
  const roles = (data.roles || []).map(r => expandRoleForResponse(r, data));
  res.json({ users, roles, permissionsList: data.permissionsList || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id - obtener usuario
router.get('/:id', (req, res) => {
  try {
    const data = readUsersData();
    const user = data.users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(expandUserForResponse(user, data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / - crear usuario
router.post('/', requirePermission('users:create'), (req, res) => {
  try {
    const { username, displayName, roleId, permissions } = req.body;
    if (!username) return res.status(400).json({ error: 'username es requerido' });
    const data = readUsersData();
    if (data.users.some(u => u.username === username)) {
      return res.status(400).json({ error: 'username ya existe' });
    }
    // Si no se envían permisos explícitos, usar el rol como plantilla y copiar sus permisos
    let newPermissionsIndices = [];
    if (typeof permissions !== 'undefined' && Array.isArray(permissions)) {
      newPermissionsIndices = mapPermsToIndices(permissions || [], data);
    } else if (roleId) {
      const role = (data.roles || []).find(r => r.id === roleId);
      if (role && Array.isArray(role.permissions)) {
        // copiar índices del rol como permisos directos
        newPermissionsIndices = [...role.permissions];
      }
    }

    const newUser = {
      id: nanoid(8),
      username,
      displayName: displayName || username,
      roleId: roleId || null,
      permissions: newPermissionsIndices,
      createdAt: new Date().toISOString()
    };
    data.users.push(newUser);
    writeUsersData(data);
    res.status(201).json(expandUserForResponse(newUser, data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /:id - actualizar usuario (incluye roleId y permisos)
router.put('/:id', requirePermission('users:edit'), (req, res) => {
  try {
    const { username, displayName, roleId, permissions } = req.body;
    const data = readUsersData();
    const idx = data.users.findIndex(u => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Usuario no encontrado' });
    const user = data.users[idx];
    // No permitir eliminar al master accidentalmente por username
    if (user.username === 'master' && req.body.deleted) {
      return res.status(400).json({ error: 'No se puede eliminar el usuario master' });
    }
    user.username = username || user.username;
    user.displayName = displayName || user.displayName;
    user.roleId = typeof roleId !== 'undefined' ? roleId : user.roleId;
  user.permissions = typeof permissions !== 'undefined' ? mapPermsToIndices(permissions, data) : user.permissions;
    user.updatedAt = new Date().toISOString();
    data.users[idx] = user;
    writeUsersData(data);
  res.json(expandUserForResponse(user, data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id - eliminar usuario (marcar o eliminar físicamente)
router.delete('/:id', requirePermission('users:delete'), (req, res) => {
  try {
    const data = readUsersData();
    const idx = data.users.findIndex(u => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Usuario no encontrado' });
    const user = data.users[idx];
    if (user.username === 'master') return res.status(400).json({ error: 'No se puede eliminar el usuario master' });
    data.users.splice(idx, 1);
    writeUsersData(data);
    res.json({ message: 'Usuario eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id/permissions - obtener permisos efectivos (role + directos)
router.get('/:id/permissions', (req, res) => {
  try {
    const data = readUsersData();
    const user = data.users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  // Devolver sólo permisos directos del usuario. Los roles se usan como plantilla en creación.
  const direct = expandPermissionsArray(user.permissions, data.permissionsList);
  res.json({ permissions: direct });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /:id/permissions - reemplazar permisos directos (no cambia role)
router.put('/:id/permissions', requirePermission('users:permissions'), (req, res) => {
  try {
    const { permissions } = req.body;
    const data = readUsersData();
    const idx = data.users.findIndex(u => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Usuario no encontrado' });
  data.users[idx].permissions = mapPermsToIndices(permissions, data);
  writeUsersData(data);
  res.json({ permissions: expandPermissionsArray(data.users[idx].permissions, data.permissionsList) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
