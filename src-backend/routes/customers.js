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
  const rows = await dbAll(`SELECT * FROM customers WHERE (status IS NULL OR status <> 'deleted') AND (name LIKE ? OR document LIKE ?) ORDER BY name LIMIT 200`, [q, q]);
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
  if (!row || (row.status && row.status === 'deleted')) return res.status(404).json({ error: 'Customer not found' });
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

// DELETE /:id - try soft-delete by setting status='deleted' if column exists, else physical delete
router.delete('/:id', requirePermission('customers:delete'), async (req, res) => {
  try {
    const db = databaseManager.getActiveDb();
    const run = util.promisify(db.run.bind(db));
    try {
      const deleter = (req.currentUser && req.currentUser.id) ? req.currentUser.id : ((req.currentUser && req.currentUser.username) ? req.currentUser.username : 'system');
      try {
        const r = await run("UPDATE customers SET status = 'deleted', deleted_at = datetime('now'), deleted_by = ?, updated_at = datetime('now') WHERE id = ?", [deleter, req.params.id]);
        if (r && r.changes && r.changes > 0) return res.status(204).send();
      } catch (inner) {
        if (!(inner && inner.message && inner.message.includes('no such column'))) throw inner;
      }
    } catch (e) {
      if (!(e && e.message && e.message.includes('no such column'))) throw e;
    }

    // fallback to delete
    const result = await run(`DELETE FROM customers WHERE id = ?`, [req.params.id]);
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
    const dbGet = util.promisify(db.get.bind(db));
    const dbAll = util.promisify(db.all.bind(db));

    // Get customer to obtain document and name
    const customer = await dbGet(`SELECT * FROM customers WHERE id = ?`, [id]);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    // Look for inventory movements where the entity_document or entity_name matches the customer
    // Only include movements with status 'Activo' or 'Anulado' to avoid 'Reemplazado' noise
    const rows = await dbAll(
      `SELECT im.* FROM inventory_movements im WHERE (im.entity_document = ? OR im.entity_name = ?) AND im.status IN ('Activo','Anulado') ORDER BY im.transaction_date DESC LIMIT 1000`,
      [customer.document || '', customer.name || '']
    );

    // Group by transaction_id to return one entry per transaction
    const grouped = (rows || []).reduce((acc, row) => {
      if (!acc[row.transaction_id]) {
        acc[row.transaction_id] = {
          transaction_id: row.transaction_id,
          transaction_date: row.transaction_date,
          entity_name: row.entity_name,
          entity_document: row.entity_document,
          document_number: row.document_number,
          status: 'Anulado',
          total: 0,
          movements: []
        };
      }
      const mv = {
        id: row.id,
        variant_id: row.variant_id,
        quantity: row.quantity,
        unit_cost: row.unit_cost,
        price: row.price,
        status: row.status,
        description: row.description,
        created_at: row.created_at
      };
      acc[row.transaction_id].movements.push(mv);
      acc[row.transaction_id].total += (row.quantity || 0) * (row.price || 0);
      // if any movement is active, mark transaction as active
      if (row.status === 'Activo') acc[row.transaction_id].status = 'Activo';
      return acc;
    }, {});

    const results = Object.values(grouped).sort((a, b) => (b.transaction_date || '').localeCompare(a.transaction_date || ''));
    console.log('[customers] GET /:id/history - returned transactions:', results.length);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db_error' });
  }
});

module.exports = router;
