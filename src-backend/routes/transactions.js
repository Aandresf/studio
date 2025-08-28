const express = require('express');
const util = require('util');
const databaseManager = require('../database-manager');

const router = express.Router();

// Anular venta
router.delete('/sales/:transactionId', async (req, res) => {
    const { transactionId } = req.params;
    const db = databaseManager.getActiveDb();
    const run = util.promisify(db.run.bind(db));
    const all = util.promisify(db.all.bind(db));

    try {
        await run('BEGIN TRANSACTION');
        const movements = await all(`SELECT * FROM inventory_movements WHERE transaction_id = ? AND status = 'Activo' AND type = 'SALIDA'`, [transactionId]);
        if (movements.length === 0) throw new Error('No se encontraron movimientos de venta activos para anular.');

        for (const move of movements) {
            await run('UPDATE product_variants SET current_stock = current_stock + ? WHERE id = ?', [move.quantity, move.variant_id]);
        }
        await run("UPDATE inventory_movements SET status = 'Anulado' WHERE transaction_id = ? AND status = 'Activo'", [transactionId]);
        
        await run('COMMIT');
        res.status(200).json({ message: 'Venta anulada correctamente.' });
    } catch (err) {
        await run('ROLLBACK');
        res.status(500).json({ error: `Error en la anulación: ${err.message}` });
    }
});

// Anular compra
router.delete('/purchases/:transactionId', async (req, res) => {
    const { transactionId } = req.params;
    const db = databaseManager.getActiveDb();
    const run = util.promisify(db.run.bind(db));
    const all = util.promisify(db.all.bind(db));
    const get = util.promisify(db.get.bind(db));

    try {
        await run('BEGIN TRANSACTION');
        const movements = await all(`SELECT * FROM inventory_movements WHERE transaction_id = ? AND status = 'Activo' AND type = 'ENTRADA'`, [transactionId]);
        if (movements.length === 0) throw new Error('No se encontraron movimientos de compra activos para anular.');

        for (const move of movements) {
            const variant = await get('SELECT current_stock, cost_price FROM product_variants WHERE id = ?', [move.variant_id]);
            if (!variant) throw new Error(`Variante ${move.variant_id} no encontrada.`);

            const stock_before = variant.current_stock - move.quantity;
            let cost_before = 0;
            if (stock_before > 0) {
                const total_value_current = variant.current_stock * variant.cost_price;
                const entry_value = move.quantity * move.unit_cost;
                cost_before = (total_value_current - entry_value) / stock_before;
            }

            await run('UPDATE product_variants SET current_stock = ?, cost_price = ? WHERE id = ?', [stock_before, cost_before, move.variant_id]);
            await run("UPDATE inventory_movements SET status = 'Anulado' WHERE id = ?", [move.id]);
        }

        await run('COMMIT');
        res.status(200).json({ message: 'Compra anulada correctamente.' });
    } catch (err) {
        await run('ROLLBACK');
        res.status(500).json({ error: `Error en la anulación: ${err.message}` });
    }
});

module.exports = router;
