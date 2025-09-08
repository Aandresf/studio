const express = require('express');
const { requirePermission } = require('../lib/authorize');
const router = express.Router();

// Debug endpoint - require at least 'dashboard:read' to avoid leaking internal user info
router.get('/whoami', requirePermission('dashboard:read'), (req, res) => {
  // Return current user info attached by middleware
  res.json({ currentUser: req.currentUser || null });
});

module.exports = router;
