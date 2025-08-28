const express = require('express');
const router = express.Router();
const databaseManager = require('../database-manager');
const util = require('util');

// GET / - list all variants (careful on large datasets)
router.get('/', async (req, res) => {
    try {
        const db = databaseManager.getActiveDb();
        const dbAll = util.promisify(db.all.bind(db));
        const rows = await dbAll(`SELECT pv.*, p.name as product_name, p.base_sku FROM product_variants pv JOIN products p ON pv.product_id = p.id ORDER BY pv.id ASC`, []);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /:id - get variant details
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const db = databaseManager.getActiveDb();
        const get = util.promisify(db.get.bind(db));
        const row = await get(`SELECT pv.*, p.name as product_name, p.base_sku FROM product_variants pv JOIN products p ON pv.product_id = p.id WHERE pv.id = ?`, [id]);
        if (!row) return res.status(404).json({ error: 'Variant not found' });
        res.json(row);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /:id/movements - list inventory movements for a variant
router.get('/:id/movements', async (req, res) => {
    const { id } = req.params;
    try {
        const db = databaseManager.getActiveDb();
        const all = util.promisify(db.all.bind(db));
        const rows = await all(
            `SELECT im.*, pv.sku as variant_sku, pv.product_id, p.name as product_name
             FROM inventory_movements im
             LEFT JOIN product_variants pv ON im.variant_id = pv.id
             LEFT JOIN products p ON pv.product_id = p.id
             WHERE im.variant_id = ? AND (im.status IS NULL OR im.status = 'Activo')
             ORDER BY im.transaction_date DESC, im.created_at DESC`,
            [id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
