const express = require('express');
const router = express.Router();

router.get('/whoami', (req, res) => {
  // Return current user info attached by middleware
  res.json({ currentUser: req.currentUser || null });
});

module.exports = router;
