const express = require('express');
const util = require('util');
const path = require('path');
const fs = require('fs');
const { generateInventoryExcel } = require('../excel-generator.js');
const databaseManager = require('../database-manager');
const { dataDir } = require('../config');

const router = express.Router();

router.post('/inventory-excel', async (req, res) => {
    const { startDate, endDate } = req.body;
    
    try {
        const db = databaseManager.getActiveDb();
        const get = util.promisify(db.get.bind(db));
        const all = util.promisify(db.all.bind(db));

        const activeStoreId = databaseManager.getStoresConfig().activeStoreId;
        const settingsPath = path.join(dataDir, `database_${activeStoreId}_settings.json`);
        
        let storeDetails = { name: "MI TIENDA", rif: "J-000000000" };
        if (fs.existsSync(settingsPath)) {
            const savedSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            storeDetails = { ...storeDetails, ...savedSettings };
        }

    const products = await all("SELECT id, name, base_sku FROM products");
        let inventoryData = [];

        for (const product of products) {
            const latestSnapshot = await get(
                `SELECT snapshot_date, closing_stock, closing_average_cost 
                 FROM inventory_snapshots
                 WHERE product_id = ? AND date(snapshot_date) < ?
                 ORDER BY snapshot_date DESC
                 LIMIT 1`,
                [product.id, startDate]
            );

            let initialStock = 0;
            let initialAvgCost = 0;
            let calculationStartDate = '1970-01-01';

            if (latestSnapshot) {
                initialStock = latestSnapshot.closing_stock;
                initialAvgCost = latestSnapshot.closing_average_cost;
                calculationStartDate = latestSnapshot.snapshot_date;
            }

            const historicalMovements = await all(
                `SELECT im.type, im.quantity, im.unit_cost 
                 FROM inventory_movements im
                 JOIN product_variants pv ON im.variant_id = pv.id
                 WHERE pv.product_id = ? AND im.status = 'Activo' AND date(im.transaction_date) > ? AND date(im.transaction_date) < ?
                 ORDER BY im.transaction_date ASC, im.created_at ASC`,
                [product.id, calculationStartDate, startDate]
            );

            for (const move of historicalMovements) {
                if (move.type === 'ENTRADA') {
                    const currentTotalValue = initialStock * initialAvgCost;
                    const entryValue = move.quantity * (move.unit_cost || 0);
                    initialStock += move.quantity;
                    initialAvgCost = initialStock > 0 ? (currentTotalValue + entryValue) / initialStock : 0;
                } else {
                    initialStock -= move.quantity;
                }
            }

            let existenciaAcumulada = initialStock;
            let costoPromedioActual = initialAvgCost;

            const movements = await all(
                `SELECT im.type, im.quantity, im.unit_cost, im.price, im.transaction_date 
                 FROM inventory_movements im
                 JOIN product_variants pv ON im.variant_id = pv.id
                 WHERE pv.product_id = ? AND im.status = 'Activo' AND date(im.transaction_date) BETWEEN ? AND ?
                 ORDER BY im.transaction_date ASC, im.created_at ASC`,
                [product.id, startDate, endDate]
            );

            let totalEntradasUnidades = 0, totalSalidasUnidades = 0, totalRetirosUnidades = 0, totalAutoconsumoUnidades = 0;
            let valorEntradas = 0, valorSalidas = 0, valorRetiros = 0, valorAutoconsumo = 0;

            for (const move of movements) {
                if (move.type === 'ENTRADA') {
                    const valorTotalAnterior = existenciaAcumulada * costoPromedioActual;
                    const valorEntradaActual = move.quantity * move.unit_cost;
                    existenciaAcumulada += move.quantity;
                    costoPromedioActual = existenciaAcumulada > 0 ? (valorTotalAnterior + valorEntradaActual) / existenciaAcumulada : 0;
                    totalEntradasUnidades += move.quantity;
                    valorEntradas += valorEntradaActual;
                } else {
                    const valorSalida = move.quantity * costoPromedioActual;
                    existenciaAcumulada -= move.quantity;
                    if (move.type === 'SALIDA') { totalSalidasUnidades += move.quantity; valorSalidas += valorSalida; }
                    else if (move.type === 'RETIRO') { totalRetirosUnidades += move.quantity; valorRetiros += valorSalida; }
                    else if (move.type === 'AUTO-CONSUMO') { totalAutoconsumoUnidades += move.quantity; valorAutoconsumo += valorSalida; }
                }
            }

            const valorExistenciaAnterior = initialStock * initialAvgCost;
            const existenciaActual = existenciaAcumulada;
            const valorExistenciaActual = existenciaActual * costoPromedioActual;

            inventoryData.push({
                code: product.base_sku || `P-${product.id}`,
                description: product.name,
                existenciaAnterior: initialStock,
                entradas: totalEntradasUnidades,
                salidas: totalSalidasUnidades,
                retiros: totalRetirosUnidades,
                autoconsumo: totalAutoconsumoUnidades,
                existenciaActual,
                valorUnitarioAnterior: initialAvgCost,
                valorExistenciaAnterior,
                valorEntradas,
                valorSalidas,
                valorRetiros,
                valorAutoconsumo,
                valorUnitarioActual: costoPromedioActual,
                valorExistenciaActual,
                valorPromedio: (totalEntradasUnidades > 0) ? (valorEntradas / totalEntradasUnidades) : initialAvgCost
            });
        }

        await generateInventoryExcel(res, storeDetails, inventoryData, startDate, endDate);

    } catch (error) {
        console.error('Error durante la obtención de datos para el reporte de Excel:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Error interno al obtener los datos para el reporte.' });
        }
    }
});

router.post('/historical-summary', async (req, res) => {
    const { date } = req.body;
    if (!date) {
        return res.status(400).json({ error: 'Se requiere una fecha.' });
    }

    try {
        const db = databaseManager.getActiveDb();
        const get = util.promisify(db.get.bind(db));
        const all = util.promisify(db.all.bind(db));

        const products = await all("SELECT id FROM products");
        let totalStock = 0;
        let totalValue = 0;

        for (const product of products) {
            const latestSnapshot = await get(
                `SELECT snapshot_date, closing_stock, closing_average_cost 
                 FROM inventory_snapshots
                 WHERE product_id = ? AND date(snapshot_date) <= ?
                 ORDER BY snapshot_date DESC
                 LIMIT 1`,
                [product.id, date]
            );

            let currentStock = 0;
            let avgCost = 0;
            let calculationStartDate = '1970-01-01';

            if (latestSnapshot) {
                currentStock = latestSnapshot.closing_stock;
                avgCost = latestSnapshot.closing_average_cost;
                calculationStartDate = latestSnapshot.snapshot_date;
            }

            const movements = await all(
                `SELECT im.type, im.quantity, im.unit_cost
                 FROM inventory_movements im
                 JOIN product_variants pv ON im.variant_id = pv.id
                 WHERE pv.product_id = ? AND im.status = 'Activo' AND date(im.transaction_date) > ? AND date(im.transaction_date) <= ?
                 ORDER BY im.transaction_date ASC, im.created_at ASC`,
                [product.id, calculationStartDate, date]
            );

            for (const move of movements) {
                if (move.type === 'ENTRADA') {
                    const currentTotalValue = currentStock * avgCost;
                    const entryValue = move.quantity * (move.unit_cost || 0);
                    currentStock += move.quantity;
                    avgCost = currentStock > 0 ? (currentTotalValue + entryValue) / currentStock : 0;
                } else {
                    currentStock -= move.quantity;
                }
            }
            
            if (currentStock > 0) {
                totalStock += currentStock;
                totalValue += currentStock * avgCost;
            }
        }
        
        res.json({
            date,
            totalProductCount: products.length,
            totalStock,
            totalValue
        });

    } catch (error) {
        console.error(`Error calculando el resumen histórico para la fecha ${date}:`, error);
        res.status(500).json({ error: 'Error interno al calcular el resumen.' });
    }
});

router.post('/:type', async (req, res) => {
    const { type } = req.params;
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    try {
        const db = databaseManager.getActiveDb();
        const dbAll = util.promisify(db.all.bind(db));
        let query;
        const reportType = type.toUpperCase();

        if (reportType === 'SALES' || reportType === 'PURCHASES') {
            const movementType = reportType === 'SALES' ? 'SALIDA' : 'ENTRADA';
            query = `
            SELECT p.name, p.base_sku as sku, pv.sku as variant_sku, im.*
            FROM inventory_movements im
            JOIN product_variants pv ON im.variant_id = pv.id
            JOIN products p ON pv.product_id = p.id
            WHERE im.type = ? AND date(im.transaction_date) BETWEEN ? AND ?
            ORDER BY im.transaction_date
        `;
            const rows = await dbAll(query, [movementType, startDate, endDate]);
            res.json(rows);
        } else if (reportType === 'INVENTORY') {
            query = `
            SELECT p.name, p.base_sku as sku, pv.sku as variant_sku, im.*
            FROM inventory_movements im
            JOIN product_variants pv ON im.variant_id = pv.id
            JOIN products p ON pv.product_id = p.id
            WHERE im.transaction_date BETWEEN ? AND ?
            ORDER BY p.name, im.transaction_date
        `;
            const rows = await dbAll(query, [startDate, endDate]);
            res.json(rows);
        } else {
            res.status(400).json({ error: 'Invalid report type' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const db = databaseManager.getActiveDb();
        const dbAll = util.promisify(db.all.bind(db));
        const rows = await dbAll('SELECT * FROM inventory_reports ORDER BY generated_at DESC', []);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
