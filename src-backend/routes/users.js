const express = require('express');
const fs = require('fs');
const path = require('path');
const { nanoid } = require('nanoid');
const router = express.Router();

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

// GET / - listar usuarios y roles
router.get('/', (req, res) => {
  try {
    const data = readUsersData();
    res.json({ users: data.users, roles: data.roles });
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
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / - crear usuario
router.post('/', (req, res) => {
  try {
    const { username, displayName, roleId, permissions } = req.body;
    if (!username) return res.status(400).json({ error: 'username es requerido' });
    const data = readUsersData();
    if (data.users.some(u => u.username === username)) {
      return res.status(400).json({ error: 'username ya existe' });
    }
    const newUser = {
      id: nanoid(8),
      username,
      displayName: displayName || username,
      roleId: roleId || null,
      permissions: permissions || [],
      createdAt: new Date().toISOString()
    };
    data.users.push(newUser);
    writeUsersData(data);
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /:id - actualizar usuario (incluye roleId y permisos)
router.put('/:id', (req, res) => {
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
    user.permissions = typeof permissions !== 'undefined' ? permissions : user.permissions;
    user.updatedAt = new Date().toISOString();
    data.users[idx] = user;
    writeUsersData(data);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id - eliminar usuario (marcar o eliminar físicamente)
router.delete('/:id', (req, res) => {
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
    let perms = new Set();
    if (user.roleId) {
      const role = data.roles.find(r => r.id === user.roleId);
      if (role && role.permissions) role.permissions.forEach(p => perms.add(p));
    }
    if (user.permissions) user.permissions.forEach(p => perms.add(p));
    res.json({ permissions: Array.from(perms) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /:id/permissions - reemplazar permisos directos (no cambia role)
router.put('/:id/permissions', (req, res) => {
  try {
    const { permissions } = req.body;
    const data = readUsersData();
    const idx = data.users.findIndex(u => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Usuario no encontrado' });
    data.users[idx].permissions = permissions || [];
    writeUsersData(data);
    res.json({ permissions: data.users[idx].permissions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
