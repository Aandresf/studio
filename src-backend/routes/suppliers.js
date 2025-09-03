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

function mapSupplierToProductShape(s) {
  if (!s) return null;
  return {
    id: s.id,
    name: s.name,
    document: s.document,
    email: s.email,
    phone: s.phone,
    notes: s.notes,
    address: s.address,
    // product-shaped compatibility fields
    base_sku: s.document || null,
    sku: s.document || null,
    description: '',
    status: s.status || 'Activo',
    image: null,
    tax_rate: 0,
    current_stock: 0,
    average_cost: 0,
    variants: [],
  };
}

router.get('/', requireAnyPermission('suppliers:read', '*'), async (req, res) => {
  const q = req.query.q ? `%${req.query.q}%` : '%';
  try {
    console.log('[suppliers] GET / - query:', req.query);
    const db = databaseManager.getActiveDb();
    const rows = await allSql(db, `SELECT * FROM suppliers WHERE name LIKE ? OR document LIKE ? ORDER BY name LIMIT 200`, [q, q]);
    console.log('[suppliers] GET / - returned rows:', Array.isArray(rows) ? rows.length : 0);
    res.json((rows || []).map(mapSupplierToProductShape));
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
  res.json(mapSupplierToProductShape(row));
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
  res.status(201).json(mapSupplierToProductShape(inserted));
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
  res.json(mapSupplierToProductShape(updated));
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
  res.status(204).send();
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
    const supplier = await getSql(db, `SELECT * FROM suppliers WHERE id = ?`, [id]);
    if (!supplier) return res.status(404).json({ error: 'not_found' });

    // Buscar movimientos en inventory_movements relacionados con este proveedor
    const rows = await allSql(db, `SELECT * FROM inventory_movements WHERE (entity_document = ? OR entity_name = ?) AND status IN ('Activo','Anulado') ORDER BY transaction_date DESC LIMIT 1000`, [supplier.document || supplier.name, supplier.name]);

    // Agrupar por transaction_id
    const grouped = {};
    (rows || []).forEach(r => {
      const txId = r.transaction_id || r.id || 'tx_' + (r.transaction_date || '') + '_' + Math.random().toString(36).slice(2,8);
      if (!grouped[txId]) grouped[txId] = { transaction_id: txId, transaction_date: r.transaction_date, entity_name: r.entity_name, entity_document: r.entity_document, document_number: r.document_number, status: r.status, total: 0, movements: [] };
      grouped[txId].movements.push(r);
      grouped[txId].total += Number(r.quantity || 0) * Number(r.unit_cost || r.price || 0);
    });

    const transactions = Object.values(grouped).sort((a,b) => new Date(b.transaction_date) - new Date(a.transaction_date));
    res.json(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db_error' });
  }
});

module.exports = router;
