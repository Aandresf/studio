const express = require('express');
const util = require('util');
const { nanoid } = require('nanoid');
const path = require('path');
const fs = require('fs');
const databaseManager = require('../database-manager');
const { dataDir } = require('../config');
const { getNextDocumentNumber } = require('../lib/documentCounter');

const router = express.Router();
const { requirePermission, hasPermission } = require('../lib/authorize');

// Public read for PWA devices
router.get('/', async (req, res) => {
    const isPwa = (req.headers['x-pwa'] === '1');
    if (!hasPermission(req, 'sales:read') && !isPwa) {
        return res.status(403).json({ error: 'Forbidden: missing permission sales:read' });
    }
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
                im.price as unit_price,
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
            WHERE im.type = 'SALIDA'
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
                    total: 0,
                    movements: [],
                };
            }
            const movement = {
                variantId: row.variantId,
                productName: row.productName,
                variantName: row.variantName || 'Estándar',
                sku: row.sku,
                quantity: row.quantity,
                unit_price: row.unit_price,
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
                transaction.status = 'Anulado';
            }
            transaction.total = transaction.movements.reduce((sum, m) => sum + (m.quantity * m.unit_price), 0);
        });

        res.json(Object.values(grouped));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/details', async (req, res) => {
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
                im.quantity, im.price as unitPrice, im.transaction_date,
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
            WHERE im.transaction_id = ? AND im.type = 'SALIDA'
        `;
        const allItems = await dbAll(sql, [transactionId]);
        if (allItems.length === 0) return res.status(404).json({ error: 'Venta no encontrada' });

        let itemsToShow = allItems.filter(item => item.status === 'Activo');
        
        if (itemsToShow.length === 0) {
            itemsToShow = allItems.filter(item => item.status === 'Anulado');
        }
        
        if (itemsToShow.length === 0) {
            const lastDate = allItems.reduce((max, i) => (i.created_at > max ? i.created_at : max), '');
            itemsToShow = allItems.filter(item => item.created_at === lastDate);
        }

        if (itemsToShow.length === 0) return res.status(404).json({ error: 'No se encontraron items válidos para esta transacción.' });

        const firstItem = itemsToShow[0];
        const salePayload = {
            transaction_date: firstItem.transaction_date,
            entity_name: firstItem.entity_name,
            entity_document: firstItem.entity_document,
            document_number: firstItem.document_number,
            items: itemsToShow.map(i => ({
                variantId: i.variantId, productName: i.productName, variantName: i.variantName || 'Estándar',
                sku: i.sku, quantity: i.quantity, unitPrice: i.unitPrice,
            }))
        };

        res.json(salePayload);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', requirePermission('sales:create'), async (req, res) => {
    const { transaction_date, entity_document, items } = req.body;
    let { document_number, entity_name } = req.body;

    entity_name = entity_name || 'Cliente General';

    if (!transaction_date || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Faltan campos requeridos: transaction_date, items' });
    }

    const db = databaseManager.getActiveDb();
    const run = util.promisify(db.run.bind(db));
    const get = util.promisify(db.get.bind(db));
    const transactionId = nanoid();

    try {
        const activeStoreId = databaseManager.getStoresConfig().activeStoreId;
        const settingsPath = path.join(dataDir, `database_${activeStoreId}_settings.json`);
        let settings = { advanced: {} };
        if (fs.existsSync(settingsPath)) {
            settings = { ...settings, ...JSON.parse(fs.readFileSync(settingsPath, 'utf8')) };
        }

        if (!document_number) {
            document_number = await getNextDocumentNumber(db, 'AUTO_SALE');
        }

        await run('BEGIN TRANSACTION');

        for (const item of items) {
            const { variantId, quantity, unitPrice, description } = item;

            if (!variantId || !quantity || unitPrice === undefined) {
                throw new Error('Cada item debe tener variantId, quantity y unitPrice.');
            }

            const variant = await get('SELECT product_id, current_stock, cost_price FROM product_variants WHERE id = ?', [variantId]);
            if (!variant) {
                throw new Error(`Variante con ID ${variantId} no encontrada.`);
            }

            if (!settings.advanced?.allowNegativeStock && variant.current_stock < quantity) {
                throw new Error(`Stock insuficiente para la variante ID ${variantId}. Disponible: ${variant.current_stock}, Requerido: ${quantity}`);
            }
            if (!settings.advanced?.allowSellBelowCost && unitPrice < variant.cost_price) {
                throw new Error(`El precio de venta de la variante ID ${variantId} (${unitPrice}) no puede ser inferior a su costo (${variant.cost_price}).`);
            }

            const new_stock = variant.current_stock - quantity;

            const movementSql = `
                INSERT INTO inventory_movements 
                (variant_id, transaction_id, transaction_date, entity_name, entity_document, document_number, type, quantity, unit_cost, price, description, status) 
                VALUES (?, ?, ?, ?, ?, ?, 'SALIDA', ?, ?, ?, ?, 'Activo')
            `;
            await run(movementSql, [variantId, transactionId, transaction_date, entity_name, entity_document, document_number, quantity, variant.cost_price, unitPrice, description]);

            const variantSql = `UPDATE product_variants SET current_stock = ? WHERE id = ?`;
            await run(variantSql, [new_stock, variantId]);
        }

        await run('COMMIT');
        res.status(201).json({ message: 'Venta registrada exitosamente', transaction_id: transactionId });

    } catch (err) {
        console.error('Error durante la transacción de venta:', err.message);
        try {
            await run('ROLLBACK');
            res.status(500).json({ error: `Error en la transacción: ${err.message}` });
        } catch (rollbackErr) {
            console.error('Fatal: No se pudo revertir la transacción', rollbackErr);
            res.status(500).json({ error: 'Error fatal en la base de datos durante el rollback.' });
        }
    }
});

router.put('/', requirePermission('sales:edit'), async (req, res) => {
    const { transaction_id, saleData } = req.body;
    if (!transaction_id || !saleData || !saleData.items) {
        return res.status(400).json({ error: 'Faltan datos para la edición.' });
    }

    const db = databaseManager.getActiveDb();
    const run = util.promisify(db.run.bind(db));
    const all = util.promisify(db.all.bind(db));
    const get = util.promisify(db.get.bind(db));

    try {
        await run('BEGIN TRANSACTION');

        const originalMovements = await all(`SELECT * FROM inventory_movements WHERE transaction_id = ? AND status = 'Activo'`, [transaction_id]);
        if (originalMovements.length === 0) throw new Error('No se encontraron movimientos de venta activos para editar.');

        for (const move of originalMovements) {
            await run('UPDATE product_variants SET current_stock = current_stock + ? WHERE id = ?', [move.quantity, move.variant_id]);
            await run("UPDATE inventory_movements SET status = 'Reemplazado' WHERE id = ?", [move.id]);
        }

        const { transaction_date, entity_document, document_number, items } = saleData;
        const entity_name = saleData.entity_name || 'Cliente General';

        for (const item of items) {
            const variant = await get('SELECT current_stock, cost_price FROM product_variants WHERE id = ?', [item.variantId]);
            if (!variant) throw new Error(`Variante con ID ${item.variantId} no encontrada.`);
            
            await run(
                `INSERT INTO inventory_movements (variant_id, transaction_id, transaction_date, entity_name, entity_document, document_number, type, quantity, unit_cost, price, status) 
                VALUES (?, ?, ?, ?, ?, ?, 'SALIDA', ?, ?, ?, 'Activo')`,
                [item.variantId, transaction_id, transaction_date, entity_name, entity_document, document_number, item.quantity, variant.cost_price, item.unitPrice]
            );
            await run('UPDATE product_variants SET current_stock = current_stock - ? WHERE id = ?', [item.quantity, item.variantId]);
        }

        await run('COMMIT');
        res.status(200).json({ message: 'Venta actualizada exitosamente' });

    } catch (err) {
        console.error('Error durante la edición de venta:', err.message);
        await run('ROLLBACK');
        res.status(500).json({ error: `Error en la transacción: ${err.message}` });
    }
});

router.delete('/', requirePermission('sales:delete'), async (req, res) => {
    const { transaction_id } = req.body;

    if (!transaction_id) {
        return res.status(400).json({ error: 'Se requiere un transaction_id.' });
    }

    const db = databaseManager.getActiveDb();
    const run = util.promisify(db.run.bind(db));
    const all = util.promisify(db.all.bind(db));

    try {
        await run('BEGIN TRANSACTION');

        const movementsToAnnul = await all(`SELECT * FROM inventory_movements WHERE transaction_id = ? AND status = 'Activo'`, [transaction_id]);

        if (movementsToAnnul.length === 0) {
            throw new Error('No se encontraron movimientos de venta activos para anular.');
        }

        for (const move of movementsToAnnul) {
            await run('UPDATE products SET current_stock = current_stock + ? WHERE id = ?', [move.quantity, move.product_id]);
            await run("UPDATE inventory_movements SET status = 'Anulado' WHERE id = ?", [move.id]);
        }

        await run('COMMIT');
        res.status(200).json({ message: 'Venta anulada correctamente.' });

    } catch (err) {
        console.error('Error durante la anulación de la venta:', err.message);
        await run('ROLLBACK');
        res.status(500).json({ error: `Error en la transacción: ${err.message}` });
    }
});

// Anular por transactionId (param)
router.delete('/:transactionId', requirePermission('sales:delete'), async (req, res) => {
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

module.exports = router;
