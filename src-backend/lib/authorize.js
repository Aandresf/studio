function hasPermission(req, required) {
  if (!required) return true;
  const user = req.currentUser;
  if (!user || !Array.isArray(user.permissions)) return false;
  if (user.permissions.includes('*')) return true;
  return user.permissions.includes(required);
}

function requirePermission(required) {
  return function(req, res, next) {
    if (!hasPermission(req, required)) {
      return res.status(403).json({ error: 'Forbidden: missing permission ' + required });
    }
    return next();
  };
}

function requireAnyPermission(...requiredKeys) {
  return function(req, res, next) {
    const user = req.currentUser;
    if (!user || !Array.isArray(user.permissions)) {
      return res.status(403).json({ error: 'Forbidden: missing permissions' });
    }
    if (user.permissions.includes('*')) return next();
    for (const key of requiredKeys) {
      if (user.permissions.includes(key)) return next();
    }
    return res.status(403).json({ error: 'Forbidden: missing any of permissions ' + requiredKeys.join(',') });
  };
}

module.exports = { hasPermission, requirePermission, requireAnyPermission };
