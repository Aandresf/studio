const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');

function loadUsersData() {
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return { users: [], roles: [], permissionsList: [] };
  }
}

function expandPermissions(indicesOrStrings, permissionsList) {
  if (!Array.isArray(indicesOrStrings)) return [];
  return indicesOrStrings.map(p => {
    if (typeof p === 'number') return permissionsList[p] || null;
    if (typeof p === 'string') return p;
    return null;
  }).filter(Boolean);
}

// Middleware: reads x-user-id header and attaches req.currentUser = { id, username, permissions }
module.exports = function attachCurrentUser(req, res, next) {
  try {
    const userId = req.headers['x-user-id'] || req.headers['x_user_id'];
    const data = loadUsersData();
    const permissionsList = data.permissionsList || [];

    if (!userId) {
      req.currentUser = null;
      return next();
    }

    const user = (data.users || []).find(u => String(u.id) === String(userId));
    if (!user) {
      req.currentUser = null;
      return next();
    }

    // Collect role permissions (indices) and user-level permissions
    const role = (data.roles || []).find(r => r.id === user.roleId);
    const rolePerms = role ? expandPermissions(role.permissions, permissionsList) : [];
    const userPerms = expandPermissions(user.permissions, permissionsList);

    // Unique set
    const effective = Array.from(new Set([...(rolePerms || []), ...(userPerms || [])]));

    req.currentUser = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      roleId: user.roleId,
      permissions: effective,
    };
  } catch (e) {
    req.currentUser = null;
  }
  return next();
};
