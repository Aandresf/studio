const express = require('express');
const fs = require('fs');
const path = require('path');
const { dataDir } = require('../config');

const router = express.Router();

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE_PATH = path.join(DATA_DIR, 'pending_transactions.json');

function readStore() {
  if (!fs.existsSync(FILE_PATH)) {
    // ensure dir
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(FILE_PATH, JSON.stringify({ sales: [], purchases: [] }, null, 2));
  }
  const raw = fs.readFileSync(FILE_PATH, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    // If corrupted, reset to defaults
    const empty = { sales: [], purchases: [] };
    fs.writeFileSync(FILE_PATH, JSON.stringify(empty, null, 2));
    return empty;
  }
}

function writeStore(obj) {
  const tmp = FILE_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
  fs.renameSync(tmp, FILE_PATH);
}

// GET /api/pending-transactions
router.get('/', (req, res) => {
  try {
    const store = readStore();
    res.json(store);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pending-transactions
// body: { type: 'sale'|'purchase', payload: {...}, id?: string }
const { requirePermission } = require('../lib/authorize');

router.post('/', requirePermission('pending:create'), (req, res) => {
  const { type, payload, id } = req.body;
  if (!type || !payload) return res.status(400).json({ error: 'type and payload required' });
  try {
    const store = readStore();
    const recordId = id || `pending-${Date.now()}`;
    const item = { id: recordId, ...payload };
    if (type === 'sale') store.sales.unshift(item);
    else store.purchases.unshift(item);
    writeStore(store);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/pending-transactions/:id
router.delete('/:id', requirePermission('pending:delete'), (req, res) => {
  const { id } = req.params;
  try {
    const store = readStore();
    const beforeS = store.sales.length;
    const beforeP = store.purchases.length;
    store.sales = store.sales.filter(s => s.id !== id);
    store.purchases = store.purchases.filter(p => p.id !== id);
    writeStore(store);
    res.json({ id, removed: (beforeS + beforeP) - (store.sales.length + store.purchases.length) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
