const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const databaseManager = require('../database-manager');
const { dataDir } = require('../config');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRY = '7d';

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });

    const db = databaseManager.getActiveDb();
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT id, username, password_hash as passwordHash, display_name as displayName, role_id as roleId FROM users WHERE username = ?', [username], (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      });
    });

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.passwordHash || '');
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id, roleId: user.roleId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  // Set HttpOnly cookie. Mark as secure when the request is over HTTPS so browsers will
  // send it in secure contexts. Keep sameSite lax for normal navigations.
  const isSecure = (req.secure === true) || (req.protocol === 'https') || (req.get('X-Forwarded-Proto') === 'https');
  res.cookie('session', token, { httpOnly: true, sameSite: 'lax', secure: !!isSecure });

  // Return minimal user info and token (token allows cross-origin clients to authenticate via Authorization header)
  res.json({ id: user.id, username: user.username, displayName: user.displayName, roleId: user.roleId, token });
  } catch (e) {
    console.error('Login error', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('session');
  res.json({ ok: true });
});

// GET /api/auth/me - devuelve el usuario actual según req.currentUser
router.get('/me', (req, res) => {
  try {
    if (!req.currentUser) return res.status(401).json({ error: 'Not authenticated' });
    const u = req.currentUser;
    res.json({ id: u.id, username: u.username, displayName: u.displayName, roleId: u.roleId, permissions: u.permissions });
  } catch (e) {
    res.status(500).json({ error: 'Internal error' });
  }
});

module.exports = router;
