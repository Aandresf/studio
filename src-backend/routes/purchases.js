const express = require('express');
const util = require('util');
const { nanoid } = require('nanoid');
const databaseManager = require('../database-manager');
const { getNextDocumentNumber } = require('../lib/documentCounter');

const router = express.Router();
const { requirePermission } = require('../lib/authorize');

// PURCHASES (BATCH)
router.post('/', requirePermission('purchases:create'), async (req, res) => {
    const { transaction_date, entity_name, entity_document, items } = req.body;
    let { document_number } = req.body;

    if (!transaction_date || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Faltan campos requeridos: transaction_date, items' });
    }

    const db = databaseManager.getActiveDb();
    const run = util.promisify(db.run.bind(db));
    const get = util.promisify(db.get.bind(db));
    const transactionId = nanoid();

    try {
        if (!document_number) {
            document_number = await getNextDocumentNumber(db, 'AUTO_PURCHASE');
        }

        await run('BEGIN TRANSACTION');

        for (const item of items) {
            const { variantId, quantity, unitCost, description } = item;

            if (!variantId || !quantity || unitCost === undefined) {
                throw new Error('Cada item debe tener variantId, quantity y unitCost.');
            }

            const variant = await get('SELECT current_stock, cost_price FROM product_variants WHERE id = ?', [variantId]);
            if (!variant) {
                throw new Error(`Variante con ID ${variantId} no encontrada.`);
            }

            const new_stock = variant.current_stock + quantity;
            const current_total_value = variant.current_stock * variant.cost_price;
            const entry_value = quantity * unitCost;
            const new_avg_cost = new_stock > 0 ? (current_total_value + entry_value) / new_stock : 0;

            const movementSql = `
                INSERT INTO inventory_movements 
                (variant_id, transaction_id, transaction_date, entity_name, entity_document, document_number, type, quantity, unit_cost, description, status) 
                VALUES (?, ?, ?, ?, ?, ?, 'ENTRADA', ?, ?, ?, 'Activo')
            `;
            await run(movementSql, [variantId, transactionId, transaction_date, entity_name, entity_document, document_number, quantity, unitCost, description]);

            const variantSql = `UPDATE product_variants SET current_stock = ?, cost_price = ? WHERE id = ?`;
            await run(variantSql, [new_stock, new_avg_cost, variantId]);
        }

        await run('COMMIT');
        res.status(201).json({ message: 'Compra registrada exitosamente', transaction_id: transactionId });

    } catch (err) {
        console.error('Error durante la transacción de compra:', err.message);
        try {
            await run('ROLLBACK');
            res.status(500).json({ error: `Error en la transacción: ${err.message}` });
        } catch (rollbackErr) {
            console.error('Fatal: No se pudo revertir la transacción', rollbackErr);
            res.status(500).json({ error: 'Error fatal en la base de datos durante el rollback.' });
        }
    }
});

router.put('/', requirePermission('purchases:edit'), async (req, res) => {
    const { transaction_id, purchaseData } = req.body;
    if (!transaction_id || !purchaseData || !purchaseData.items) {
        return res.status(400).json({ error: 'Faltan datos para la edición.' });
    }

    const db = databaseManager.getActiveDb();
    const run = util.promisify(db.run.bind(db));
    const all = util.promisify(db.all.bind(db));
    const get = util.promisify(db.get.bind(db));

    try {
        await run('BEGIN TRANSACTION');

        const originalMovements = await all(`SELECT * FROM inventory_movements WHERE transaction_id = ? AND status = 'Activo'`, [transaction_id]);
        if (originalMovements.length === 0) throw new Error('No se encontraron movimientos de compra activos para editar.');

        for (const move of originalMovements) {
            const variant = await get('SELECT current_stock, cost_price FROM product_variants WHERE id = ?', [move.variant_id]);
            if (!variant) throw new Error(`Variante con ID ${move.variant_id} no encontrada.`);

            const stock_before = variant.current_stock - move.quantity;
            let cost_before = 0;
            if (stock_before > 0) {
                const total_value_current = variant.current_stock * variant.cost_price;
                const entry_value = move.quantity * move.unit_cost;
                cost_before = (total_value_current - entry_value) / stock_before;
            }
            
            await run('UPDATE product_variants SET current_stock = ?, cost_price = ? WHERE id = ?', [stock_before, cost_before, move.variant_id]);
            await run("UPDATE inventory_movements SET status = 'Reemplazado' WHERE id = ?", [move.id]);
        }

        const { transaction_date, entity_name, entity_document, document_number, items } = purchaseData;

        for (const item of items) {
            const variant = await get('SELECT current_stock, cost_price FROM product_variants WHERE id = ?', [item.variantId]);
            if (!variant) throw new Error(`Variante con ID ${item.variantId} no encontrada.`);

            const new_stock = variant.current_stock + item.quantity;
            const current_total_value = variant.current_stock * variant.cost_price;
            const entry_value = item.quantity * item.unitCost;
            const new_avg_cost = new_stock > 0 ? (current_total_value + entry_value) / new_stock : 0;

            await run(
                `INSERT INTO inventory_movements (variant_id, transaction_id, transaction_date, entity_name, entity_document, document_number, type, quantity, unit_cost, status) 
                VALUES (?, ?, ?, ?, ?, ?, 'ENTRADA', ?, ?, 'Activo')`,
                [item.variantId, transaction_id, transaction_date, entity_name, entity_document, document_number, item.quantity, item.unitCost]
            );
            await run('UPDATE product_variants SET current_stock = ?, cost_price = ? WHERE id = ?', [new_stock, new_avg_cost, item.variantId]);
        }

        await run('COMMIT');
        res.status(200).json({ message: 'Compra actualizada exitosamente' });

    } catch (err) {
        console.error('Error durante la edición de compra:', err.message);
        await run('ROLLBACK');
        res.status(500).json({ error: `Error en la transacción: ${err.message}` });
    }
});

router.delete('/', requirePermission('purchases:delete'), async (req, res) => {
    const { transaction_id } = req.body;

    if (!transaction_id) {
        return res.status(400).json({ error: 'Se requiere un transaction_id.' });
    }

    const db = databaseManager.getActiveDb();
    const run = util.promisify(db.run.bind(db));
    const all = util.promisify(db.all.bind(db));
    const get = util.promisify(db.get.bind(db));

    try {
        await run('BEGIN TRANSACTION');

        const movementsToAnnul = await all(
            `SELECT * FROM inventory_movements WHERE transaction_id = ? AND status = 'Activo'`,
            [transaction_id]
        );

        if (movementsToAnnul.length === 0) {
            throw new Error('No se encontraron movimientos activos para anular en esta transacción.');
        }

        for (const move of movementsToAnnul) {
            const product = await get('SELECT current_stock, average_cost FROM products WHERE id = ?', [move.product_id]);
            if (!product) throw new Error(`Producto con ID ${move.product_id} no encontrado durante la anulación.`);

            const stock_before_entry = product.current_stock - move.quantity;
            let avg_cost_before_entry = 0;

            if (stock_before_entry > 0) {
                const current_total_value = product.current_stock * product.average_cost;
                const entry_value = move.quantity * move.unit_cost;
                avg_cost_before_entry = (current_total_value - entry_value) / stock_before_entry;
            }

            await run('UPDATE products SET current_stock = ?, average_cost = ? WHERE id = ?', [stock_before_entry, avg_cost_before_entry, move.product_id]);
            await run("UPDATE inventory_movements SET status = 'Anulado' WHERE id = ?", [move.id]);
        }

        await run('COMMIT');
        res.status(200).json({ message: 'Compra anulada correctamente.' });

    } catch (err) {
        console.error('Error durante la anulación de la compra:', err.message);
        try {
            await run('ROLLBACK');
            res.status(500).json({ error: `Error en la transacción: ${err.message}` });
        } catch (rollbackErr) {
            console.error('Fatal: No se pudo revertir la transacción', rollbackErr);
            res.status(500).json({ error: 'Error fatal durante el rollback.' });
        }
    }
});

// Anular por transactionId (param)
router.delete('/:transactionId', requirePermission('purchases:delete'), async (req, res) => {
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

router.get('/', requirePermission('purchases:read'), async (req, res) => {
    try {
        const db = databaseManager.getActiveDb();
        const dbAll = util.promisify(db.all.bind(db));
        const query = `
            SELECT 
                im.transaction_id,
                im.transaction_date,
                im.entity_name,
                im.entity_document,
                im.document_number,
                im.status,
                im.created_at,
                p.name as productName,
                pv.sku,
                im.quantity,
                im.unit_cost,
                im.variant_id as variantId,
                (
                    SELECT GROUP_CONCAT(av.value, ' / ')
                    FROM variant_attribute_values vav
                    JOIN attribute_values av ON vav.attribute_value_id = av.id
                    WHERE vav.variant_id = im.variant_id
                ) as variantName
            FROM inventory_movements im
            JOIN product_variants pv ON im.variant_id = pv.id
            JOIN products p ON pv.product_id = p.id
            WHERE im.type = 'ENTRADA'
            ORDER BY im.transaction_date DESC, im.transaction_id;
        `;
        const rows = await dbAll(query, []);
        
        const grouped = rows.reduce((acc, row) => {
            if (!acc[row.transaction_id]) {
                acc[row.transaction_id] = {
                    transaction_id: row.transaction_id,
                    transaction_date: row.transaction_date,
                    entity_name: row.entity_name,
                    entity_document: row.entity_document,
                    document_number: row.document_number,
                    status: 'Unknown',
                    total_cost: 0,
                    movements: [],
                };
            }
            const movement = {
                variantId: row.variantId,
                productName: row.productName,
                variantName: row.variantName || 'Estándar',
                sku: row.sku,
                quantity: row.quantity,
                unit_cost: row.unit_cost,
                status: row.status,
            };
            acc[row.transaction_id].movements.push(movement);
            return acc;
        }, {});

        Object.values(grouped).forEach(transaction => {
            const active = transaction.movements.filter(m => m.status === 'Activo');
            if (active.length > 0) {
                transaction.status = 'Activo';
                transaction.movements = active;
            } else {
                // Simplified logic for now
                transaction.status = 'Anulado';
            }
            transaction.total_cost = transaction.movements.reduce((sum, m) => sum + (m.quantity * m.unit_cost), 0);
        });

        res.json(Object.values(grouped));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/details', requirePermission('purchases:read'), async (req, res) => {
    const transactionId = req.query.id;
    if (!transactionId) {
        return res.status(400).json({ error: 'Transaction ID is required' });
    }

    try {
        const db = databaseManager.getActiveDb();
        const dbAll = util.promisify(db.all.bind(db));
        const sql = `
            SELECT
                im.variant_id as variantId, p.name as productName, pv.sku,
                im.quantity, im.unit_cost as unitCost, im.transaction_date,
                im.entity_name, im.entity_document, im.document_number,
                im.status, im.created_at,
                (
                    SELECT GROUP_CONCAT(av.value, ' / ')
                    FROM variant_attribute_values vav
                    JOIN attribute_values av ON vav.attribute_value_id = av.id
                    WHERE vav.variant_id = im.variant_id
                ) as variantName
            FROM inventory_movements im
            JOIN product_variants pv ON im.variant_id = pv.id
            JOIN products p ON pv.product_id = p.id
            WHERE im.transaction_id = ? AND im.type = 'ENTRADA'
        `;
        const allItems = await dbAll(sql, [transactionId]);
        if (allItems.length === 0) return res.status(404).json({ error: 'Compra no encontrada' });

        let itemsToShow = allItems.filter(item => item.status === 'Activo');
        
        if (itemsToShow.length === 0) {
            // Si no hay activos, es porque fue anulada o editada. Priorizamos mostrar los anulados.
            itemsToShow = allItems.filter(item => item.status === 'Anulado');
        }
        
        if (itemsToShow.length === 0) {
            // Si tampoco hay anulados, significa que solo fue editada. Mostramos la última versión.
            const lastDate = allItems.reduce((max, i) => (i.created_at > max ? i.created_at : max), '');
            itemsToShow = allItems.filter(item => item.created_at === lastDate);
        }

        if (itemsToShow.length === 0) return res.status(404).json({ error: 'No se encontraron items válidos para esta transacción.' });

        const firstItem = itemsToShow[0];
        const purchasePayload = {
            transaction_date: firstItem.transaction_date,
            entity_name: firstItem.entity_name,
            entity_document: firstItem.entity_document,
            document_number: firstItem.document_number,
            items: itemsToShow.map(i => ({
                variantId: i.variantId, productName: i.productName, variantName: i.variantName || 'Estándar',
                sku: i.sku, quantity: i.quantity, unitCost: i.unitCost,
            }))
        };

        res.json(purchasePayload);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
