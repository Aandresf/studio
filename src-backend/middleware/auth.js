const databaseManager = require('../database-manager');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

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
    let userId = null;

    // Prefer session cookie (JWT)
    try {
      const cookieHeader = req.headers.cookie || '';
      const match = cookieHeader.split(';').map(s => s.trim()).find(s => s.startsWith('session='));
      if (match) {
        const token = match.split('=')[1];
        const payload = jwt.verify(token, JWT_SECRET);
        if (payload && payload.userId) userId = payload.userId;
      }
    } catch (cookieErr) {
      // ignore invalid cookie
    }

    // If no session cookie / valid JWT, do not use legacy headers anymore.
    // Previous behavior accepted a legacy `x-user-id` header for migration;
    // that fallback has been removed to enforce authenticated requests.
    if (!userId) {
      req.currentUser = null;
      return next();
    }

    const db = databaseManager.getActiveDb();
    // Get basic user info
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT id, username as username, display_name as displayName, email, role_id as roleId FROM users WHERE id = ?', [userId], (err, row) => {
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
      displayName: user.displayName,
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
