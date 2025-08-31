const { nanoid } = require('nanoid');
const databaseManager = require('../database-manager');

async function ensureDefaults() {
  try {
    const db = databaseManager.getActiveDb();

    // Ensure basic permissions exist
    const defaultPerms = ['*','sales:create','sales:read','sales:edit','sales:annul','products:read','products:create','products:edit','products:delete','products:read_prices_sale','products:read_costs','products:read_costs_disabled','purchases:read','purchases:create','purchases:edit','purchases:annul','reports:read','dashboard:read','settings:edit'];
    for (const key of defaultPerms) {
      await new Promise((resolve, reject) => {
        db.run('INSERT OR IGNORE INTO permissions (key) VALUES (?)', [key], function(err) {
          if (err) return reject(err);
          resolve(this);
        });
      });
    }

    // Ensure roles exist
    const roles = [
      { id: 'master', name: 'Master', perms: ['*'] },
      { id: 'sales_admin', name: 'Ventas y Consulta', perms: ['sales:create','sales:read','sales:edit','sales:annul','dashboard:read'] },
      { id: 'sales_only', name: 'Solo Venta y Consulta', perms: ['sales:create','sales:read','dashboard:read'] },
      { id: 'read_only', name: 'Solo Lectura', perms: ['products:read','sales:read','purchases:read','reports:read','dashboard:read'] }
    ];

    for (const r of roles) {
      await new Promise((resolve, reject) => {
        db.run('INSERT OR IGNORE INTO roles (id, name, description) VALUES (?, ?, ?)', [r.id, r.name, r.name], function(err) {
          if (err) return reject(err);
          resolve(this);
        });
      });

      // Link role permissions
      for (const key of r.perms) {
        const pid = await new Promise((resolve, reject) => {
          db.get('SELECT id FROM permissions WHERE key = ?', [key], (err, row) => {
            if (err) return reject(err);
            resolve(row ? row.id : null);
          });
        });
        if (pid) {
          await new Promise((resolve, reject) => {
            db.run('INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [r.id, pid], function(err) {
              if (err) return reject(err);
              resolve(this);
            });
          });
        }
      }
    }

    // Ensure master user exists
    const master = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM users WHERE name = ?', ['master'], (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      });
    });

    if (!master) {
      const id = nanoid(8);
      const username = 'master';
      // default password for local dev; recommend changing via env or UI
      const defaultPassword = process.env.MASTER_PASSWORD || 'master';
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash(defaultPassword, 10);

      await new Promise((resolve, reject) => {
        db.run('INSERT INTO users (id, name, username, display_name, role_id, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime("now"))', [id, username, username, 'Master', 'master', passwordHash], function(err) {
          if (err) return reject(err);
          resolve(this);
        });
      });

      // Give master the '*' permission
      const star = await new Promise((resolve, reject) => {
        db.get('SELECT id FROM permissions WHERE key = ?', ['*'], (err, row) => {
          if (err) return reject(err);
          resolve(row ? row.id : null);
        });
      });
      if (star) {
        await new Promise((resolve, reject) => {
          db.run('INSERT OR IGNORE INTO user_permissions (user_id, permission_id) VALUES (?, ?)', [id, star], function(err) {
            if (err) return reject(err);
            resolve(this);
          });
        });
      }
    }
  } catch (e) {
    console.error('Error ensuring default users/roles:', e.message);
  }
}

module.exports = { ensureDefaults };
