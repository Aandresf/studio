const express = require('express');
const router = express.Router();
const databaseManager = require('../database-manager');
const util = require('util');

// POST /movements - register inventory movement and update variant
router.post('/movements', async (req, res) => {
    const { variant_id, type, quantity, unit_cost, description, date } = req.body;
    if (!variant_id || !type || !quantity) {
        return res.status(400).json({ error: 'Missing required fields: variant_id, type, quantity' });
    }

    if (type === 'ENTRADA' && (unit_cost === undefined || unit_cost === null)) {
        return res.status(400).json({ error: 'unit_cost is required for ENTRADA movements' });
    }

    const db = databaseManager.getActiveDb();
    const run = util.promisify(db.run.bind(db));
    const get = util.promisify(db.get.bind(db));

    try {
        await run('BEGIN TRANSACTION');

        const variant = await get('SELECT current_stock, cost_price FROM product_variants WHERE id = ?', [variant_id]);

        if (!variant) {
            await run('ROLLBACK');
            return res.status(404).json({ error: 'Variant not found' });
        }

        let new_stock = variant.current_stock;
        let new_cost = variant.cost_price;

        if (type === 'ENTRADA') {
            new_stock += quantity;
            const current_total_value = variant.current_stock * variant.cost_price;
            const entry_value = quantity * unit_cost;
            new_cost = new_stock > 0 ? (current_total_value + entry_value) / new_stock : 0;
        } else { // SALIDA, RETIRO, AUTO-CONSUMO
            if (variant.current_stock < quantity) {
                await run('ROLLBACK');
                return res.status(400).json({ error: 'Insufficient stock' });
            }
            new_stock -= quantity;
        }

        const movementDate = new Date().toISOString();
        const movementSql = `INSERT INTO inventory_movements (variant_id, type, quantity, unit_cost, description, transaction_date, created_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'Activo')`;
        await run(movementSql, [variant_id, type, quantity, unit_cost, description, movementDate, movementDate]);

        const variantSql = `UPDATE product_variants SET current_stock = ?, cost_price = ? WHERE id = ?`;
        await run(variantSql, [new_stock, new_cost, variant_id]);

        await run('COMMIT');
        res.status(201).json({ message: 'Movement registered and variant updated' });

    } catch (err) {
        try {
            await run('ROLLBACK');
        } catch (rollbackErr) {
            console.error('Fatal: Could not rollback transaction', rollbackErr);
        }
        res.status(500).json({ error: err.message });
    }
});

// GET /latest-snapshot
router.get('/latest-snapshot', async (req, res) => {
    try {
        const db = databaseManager.getActiveDb();
        const get = util.promisify(db.get.bind(db));
        const latest = await get("SELECT MAX(snapshot_date) as last_date FROM inventory_snapshots");
        res.json({ last_date: latest?.last_date || null });
    } catch (error) {
        console.error('Error al obtener el último snapshot:', error);
        res.status(500).json({ error: 'Error interno al consultar el último snapshot.' });
    }
});

// POST /create-snapshot
router.post('/create-snapshot', async (req, res) => {
    const { snapshot_date } = req.body;
    if (!snapshot_date) {
        return res.status(400).json({ error: 'Se requiere un snapshot_date.' });
    }

    const db = databaseManager.getActiveDb();
    const get = util.promisify(db.get.bind(db));
    const all = util.promisify(db.all.bind(db));
    const run = util.promisify(db.run.bind(db));

    try {
        await run('BEGIN TRANSACTION');

        const products = await all("SELECT id FROM products");
        let createdCount = 0;
        let totalValue = 0;

        for (const product of products) {
            const latestSnapshot = await get(
                `SELECT snapshot_date, closing_stock, closing_average_cost 
                 FROM inventory_snapshots
                 WHERE product_id = ? AND date(snapshot_date) < ?
                 ORDER BY snapshot_date DESC
                 LIMIT 1`,
                [product.id, snapshot_date]
            );

            let closing_stock = 0;
            let closing_average_cost = 0;
            let calculationStartDate = '1970-01-01';

            if (latestSnapshot) {
                closing_stock = latestSnapshot.closing_stock;
                closing_average_cost = latestSnapshot.closing_average_cost;
                calculationStartDate = latestSnapshot.snapshot_date;
            }

            const movements = await all(
                `SELECT im.type, im.quantity, im.unit_cost
                 FROM inventory_movements im
                 JOIN product_variants pv ON im.variant_id = pv.id
                 WHERE pv.product_id = ? AND im.status = 'Activo' AND date(im.transaction_date) > ? AND date(im.transaction_date) <= ?
                 ORDER BY im.transaction_date ASC, im.created_at ASC`,
                [product.id, calculationStartDate, snapshot_date]
            );

            for (const move of movements) {
                if (move.type === 'ENTRADA') {
                    const currentTotalValue = closing_stock * closing_average_cost;
                    const entryValue = move.quantity * (move.unit_cost || 0);
                    closing_stock += move.quantity;
                    closing_average_cost = closing_stock > 0 ? (currentTotalValue + entryValue) / closing_stock : 0;
                } else {
                    closing_stock -= move.quantity;
                }
            }

            const closingValue = closing_stock * closing_average_cost;
            totalValue += closingValue;

            await run('INSERT INTO inventory_snapshots (product_id, snapshot_date, closing_stock, closing_average_cost, created_at) VALUES (?, ?, ?, ?, ?)', [product.id, snapshot_date, closing_stock, closing_average_cost, new Date().toISOString()]);
            createdCount++;
        }

        await run('COMMIT');
        res.json({ message: 'Snapshots created', createdCount, totalValue });

    } catch (err) {
        await run('ROLLBACK');
        console.error('Error creating snapshots:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
