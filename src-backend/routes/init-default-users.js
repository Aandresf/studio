const fs = require('fs');
const path = require('path');
const { nanoid } = require('nanoid');
const { dataDir } = require('../config');

const USERS_FILE = path.join(dataDir, 'users.json');

function ensureDefaults() {
  if (!fs.existsSync(USERS_FILE)) {
    // If the file doesn't exist, copy from package data default if present
    const defaultPath = path.join(__dirname, '..', 'data', 'users.json');
    if (fs.existsSync(defaultPath)) {
      fs.copyFileSync(defaultPath, USERS_FILE);
    } else {
      fs.writeFileSync(USERS_FILE, JSON.stringify({ users: [], roles: [] }, null, 2));
    }
  }

  const data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  // If no users, create master and sample users
  if (!data.users || data.users.length === 0) {
    data.users = [
      { id: nanoid(8), username: 'master', displayName: 'Administrador', roleId: 'master', permissions: ['*'], createdAt: new Date().toISOString() },
      { id: nanoid(8), username: 'ventas_admin', displayName: 'Encargado de Ventas', roleId: 'sales_admin', permissions: [], createdAt: new Date().toISOString() },
      { id: nanoid(8), username: 'vendedor', displayName: 'Vendedor', roleId: 'sales_only', permissions: [], createdAt: new Date().toISOString() },
      { id: nanoid(8), username: 'lector', displayName: 'Usuario Lectura', roleId: 'read_only', permissions: [], createdAt: new Date().toISOString() }
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
  }
}

module.exports = { ensureDefaults };
