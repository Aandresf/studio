const express = require('express');
const { requirePermission } = require('../lib/authorize');
const router = express.Router();
const databaseManager = require('../database-manager');
const util = require('util');

function mapCustomerToProductShape(c) {
  // Map customer row to the product-shaped contract expected by frontend
  return {
    id: c.id,
    name: c.name,
  document: c.document || null,
  email: c.email || null,
  phone: c.phone || null,
  notes: c.notes || '',
  address: c.address || null,
    base_sku: c.document || '',
    sku: c.document || '',
    description: c.notes || c.description || '',
    status: c.status || 'Activo',
    image: c.image || null,
    tax_rate: c.tax_rate || null,
    current_stock: 0,
    average_cost: 0,
    variants: []
  };
}

// GET / - list customers but return product-shaped objects
router.get('/', requirePermission('customers:read'), async (req, res) => {
  try {
    const q = req.query.q ? `%${req.query.q}%` : '%';
    const db = databaseManager.getActiveDb();
    const dbAll = util.promisify(db.all.bind(db));
    const rows = await dbAll(`SELECT * FROM customers WHERE name LIKE ? OR document LIKE ? ORDER BY name LIMIT 200`, [q, q]);
    const mapped = (rows || []).map(mapCustomerToProductShape);
    res.json(mapped);
  } catch (err) {
    console.error('[customers] GET / error', err && err.message);
    res.status(500).json({ error: err.message || 'db_error' });
  }
});

// POST / - create customer and return created object in product-shaped contract (201)
router.post('/', requirePermission('customers:create'), async (req, res) => {
  const { name, document, email, phone, address, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Faltan datos requeridos: name' });
  const db = databaseManager.getActiveDb();
  const run = util.promisify(db.run.bind(db));
  const get = util.promisify(db.get.bind(db));
  try {
    // Use a simple insert
    const insertSql = `INSERT INTO customers (name, document, email, phone, address, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`;
    const result = await new Promise((resolve, reject) => {
      db.run(insertSql, [name, document, email, phone, address, notes], function(err) {
        if (err) return reject(err);
        resolve({ lastID: this.lastID });
      });
    });
    const created = await get(`SELECT * FROM customers WHERE id = ?`, [result.lastID]);
    res.status(201).json(mapCustomerToProductShape(created));
  } catch (err) {
    console.error('[customers] POST / error', err && err.message);
    res.status(500).json({ error: err.message || 'db_error' });
  }
});

// GET /:id - customer details mapped to product-shaped contract
router.get('/:id', requirePermission('customers:read'), async (req, res) => {
  try {
    const db = databaseManager.getActiveDb();
    const dbGet = util.promisify(db.get.bind(db));
    const row = await dbGet(`SELECT * FROM customers WHERE id = ?`, [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Customer not found' });
    res.json(mapCustomerToProductShape(row));
  } catch (err) {
    console.error('[customers] GET /:id error', err && err.message);
    res.status(500).json({ error: err.message || 'db_error' });
  }
});

// PUT /:id - update customer and return updated mapped object
router.put('/:id', requirePermission('customers:edit'), async (req, res) => {
  const { name, document, email, phone, address, notes } = req.body;
  const id = req.params.id;
  const db = databaseManager.getActiveDb();
  const run = util.promisify(db.run.bind(db));
  const get = util.promisify(db.get.bind(db));
  try {
    await run(`UPDATE customers SET name = ?, document = ?, email = ?, phone = ?, address = ?, notes = ?, updated_at = datetime('now') WHERE id = ?`, [name, document, email, phone, address, notes, id]);
    const updated = await get(`SELECT * FROM customers WHERE id = ?`, [id]);
    res.json(mapCustomerToProductShape(updated));
  } catch (err) {
    console.error('[customers] PUT /:id error', err && err.message);
    res.status(500).json({ error: err.message || 'db_error' });
  }
});

// DELETE /:id - delete and return 204 like products
router.delete('/:id', requirePermission('customers:delete'), async (req, res) => {
  try {
    const db = databaseManager.getActiveDb();
    const dbRun = util.promisify(db.run.bind(db));
    const result = await dbRun(`DELETE FROM customers WHERE id = ?`, [req.params.id]);
    // SQLite's run does not return affected rows via promisify; we assume success
    res.status(204).send();
  } catch (err) {
    console.error('[customers] DELETE /:id error', err && err.message);
    res.status(500).json({ error: err.message || 'db_error' });
  }
});

// GET /:id/history - existing behavior unchanged
router.get('/:id/history', requirePermission('customers:read'), async (req, res) => {
  const id = req.params.id;
  try {
    console.log('[customers] GET /:id/history - id:', id);
    const db = databaseManager.getActiveDb();
    const dbAll = util.promisify(db.all.bind(db));
    const rows = await dbAll(`SELECT t.* FROM sales_transactions t WHERE t.customer_id = ? ORDER BY t.transaction_date DESC LIMIT 200`, [id]);
    console.log('[customers] GET /:id/history - returned rows:', Array.isArray(rows) ? rows.length : 0);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db_error' });
  }
});

module.exports = router;
