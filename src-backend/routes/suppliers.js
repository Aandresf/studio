const express = require('express');
const databaseManager = require('../database-manager');
const { requireAnyPermission } = require('../lib/authorize');

function runSql(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function allSql(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function getSql(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

const router = express.Router();

router.get('/', requireAnyPermission('suppliers:read', '*'), async (req, res) => {
  const q = req.query.q ? `%${req.query.q}%` : '%';
  try {
  console.log('[suppliers] GET / - query:', req.query);
    const db = databaseManager.getActiveDb();
    const rows = await allSql(db, `SELECT * FROM suppliers WHERE name LIKE ? OR document LIKE ? ORDER BY name LIMIT 200`, [q, q]);
  console.log('[suppliers] GET / - returned rows:', Array.isArray(rows) ? rows.length : 0);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db_error' });
  }
});

router.get('/:id', requireAnyPermission('suppliers:read', '*'), async (req, res) => {
  const id = req.params.id;
  try {
  console.log('[suppliers] GET /:id - id:', id);
    const db = databaseManager.getActiveDb();
    const row = await getSql(db, `SELECT * FROM suppliers WHERE id = ?`, [id]);
  console.log('[suppliers] GET /:id - row:', row);
    if (!row) return res.status(404).json({ error: 'not_found' });
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db_error' });
  }
});

router.post('/', requireAnyPermission('suppliers:create', '*'), async (req, res) => {
  const { name, document, email, phone, address, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'invalid_name' });
  try {
    const db = databaseManager.getActiveDb();
    const result = await runSql(db, `INSERT INTO suppliers (name, document, email, phone, address, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`, [name, document, email, phone, address, notes]);
    const inserted = await getSql(db, `SELECT * FROM suppliers WHERE id = ?`, [result.lastID]);
    res.json(inserted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db_error' });
  }
});

router.put('/:id', requireAnyPermission('suppliers:edit', '*'), async (req, res) => {
  const id = req.params.id;
  const { name, document, email, phone, address, notes } = req.body;
  try {
    const db = databaseManager.getActiveDb();
    await runSql(db, `UPDATE suppliers SET name = ?, document = ?, email = ?, phone = ?, address = ?, notes = ?, updated_at = datetime('now') WHERE id = ?`, [name, document, email, phone, address, notes, id]);
    const updated = await getSql(db, `SELECT * FROM suppliers WHERE id = ?`, [id]);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db_error' });
  }
});

router.delete('/:id', requireAnyPermission('suppliers:delete', '*'), async (req, res) => {
  const id = req.params.id;
  try {
    const db = databaseManager.getActiveDb();
    await runSql(db, `DELETE FROM suppliers WHERE id = ?`, [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db_error' });
  }
});

router.get('/:id/history', requireAnyPermission('suppliers:read', '*'), async (req, res) => {
  const id = req.params.id;
  try {
  console.log('[suppliers] GET /:id/history - id:', id);
    const db = databaseManager.getActiveDb();
    const rows = await allSql(db, `SELECT t.* FROM purchases_transactions t WHERE t.supplier_id = ? ORDER BY t.transaction_date DESC LIMIT 200`, [id]);
  console.log('[suppliers] GET /:id/history - returned rows:', Array.isArray(rows) ? rows.length : 0);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db_error' });
  }
});

module.exports = router;
