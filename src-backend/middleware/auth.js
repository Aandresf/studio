const databaseManager = require('../database-manager');

function uniq(arr) {
  return Array.from(new Set(arr || []));
}

async function getPermissionsForUser(db, userId) {
  const rows = await new Promise((resolve, reject) => {
    db.all('SELECT p.key FROM permissions p JOIN user_permissions up ON p.id = up.permission_id WHERE up.user_id = ?', [userId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
  return rows.map(r => r.key);
}

async function getPermissionsForRole(db, roleId) {
  const rows = await new Promise((resolve, reject) => {
    db.all('SELECT p.key FROM permissions p JOIN role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id = ?', [roleId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
  return rows.map(r => r.key);
}

// Middleware: reads x-user-id header and attaches req.currentUser = { id, username, displayName, roleId, permissions (effective), directPermissions }
module.exports = async function attachCurrentUser(req, res, next) {
  try {
    const userId = req.headers['x-user-id'] || req.headers['x_user_id'];
    if (!userId) {
      req.currentUser = null;
      return next();
    }

    const db = databaseManager.getActiveDb();
    // Get basic user info
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT id, name as username, email, role_id as roleId FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      });
    });

    if (!user) {
      req.currentUser = null;
      return next();
    }

    const direct = await getPermissionsForUser(db, user.id);
    const rolePerms = user.roleId ? await getPermissionsForRole(db, user.roleId) : [];
    const effective = uniq([...(rolePerms || []), ...(direct || [])]);

    req.currentUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      roleId: user.roleId,
      permissions: effective,
      directPermissions: direct
    };
  } catch (e) {
    // On error, don't block requests; just leave currentUser null
    req.currentUser = null;
  }
  return next();
};
