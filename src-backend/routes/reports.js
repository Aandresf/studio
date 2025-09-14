const express = require('express');
const util = require('util');
const path = require('path');
const fs = require('fs');
const { generateInventoryExcel, generateInventoryAsOfExcel } = require('../excel-generator.js');
const { generateMovementsExcel } = require('../excel-generator.js');
const databaseManager = require('../database-manager');
const { dataDir } = require('../config');
const { requirePermission } = require('../lib/authorize');

const router = express.Router();

async function buildDetailedInventory(all, get, startDate, endDate, filters = {}) {
    const rows = [];
    // Apply optional department/subdepartment filters
    let variantSql = `SELECT pv.id as variant_id, pv.sku as variant_sku, pv.cost_price, p.id as product_id, p.name as product_name, p.department_id, p.subdepartment_id
         FROM product_variants pv JOIN products p ON pv.product_id = p.id`;
    const variantParams = [];
    if (filters.departmentId) {
        variantSql += ' WHERE p.department_id = ?';
        variantParams.push(filters.departmentId);
    }
    if (filters.subdepartmentId) {
        if (variantParams.length === 0) variantSql += ' WHERE p.subdepartment_id = ?';
        else variantSql += ' AND p.subdepartment_id = ?';
        variantParams.push(filters.subdepartmentId);
    }
    const variants = await all(variantSql, variantParams);

    for (const v of variants) {
        const latestSnapshot = await get(
            `SELECT snapshot_date FROM inventory_snapshots WHERE product_id = ? AND date(snapshot_date) < ? ORDER BY snapshot_date DESC LIMIT 1`,
            [v.product_id, startDate]
        );
        const calculationStartDate = latestSnapshot ? latestSnapshot.snapshot_date : '1970-01-01';

        const historicalMovements = await all(
            `SELECT im.type, im.quantity, im.unit_cost FROM inventory_movements im WHERE im.variant_id = ? AND im.status = 'Activo' AND date(im.transaction_date) > ? AND date(im.transaction_date) < ? ORDER BY im.transaction_date ASC, im.created_at ASC`,
            [v.variant_id, calculationStartDate, startDate]
        );

        let initialStock = 0;
        let initialAvgCost = v.cost_price || 0;
        for (const m of historicalMovements) {
            if (m.type === 'ENTRADA') {
                const currentTotalValue = initialStock * initialAvgCost;
                const entryValue = m.quantity * (m.unit_cost || 0);
                initialStock += m.quantity;
                initialAvgCost = initialStock > 0 ? (currentTotalValue + entryValue) / initialStock : 0;
            } else {
                initialStock -= m.quantity;
            }
        }

        let existenciaAcumulada = initialStock;
        let costoPromedioActual = initialAvgCost;

        const movements = await all(
            `SELECT im.type, im.quantity, im.unit_cost FROM inventory_movements im WHERE im.variant_id = ? AND im.status = 'Activo' AND date(im.transaction_date) BETWEEN ? AND ? ORDER BY im.transaction_date ASC, im.created_at ASC`,
            [v.variant_id, startDate, endDate]
        );

        let totalEntradas = 0, totalSalidas = 0, valorEntradas = 0, valorSalidas = 0;
        for (const m of movements) {
            if (m.type === 'ENTRADA') {
                const prevValue = existenciaAcumulada * costoPromedioActual;
                const entryValue = m.quantity * (m.unit_cost || 0);
                existenciaAcumulada += m.quantity;
                costoPromedioActual = existenciaAcumulada > 0 ? (prevValue + entryValue) / existenciaAcumulada : 0;
                totalEntradas += m.quantity; valorEntradas += entryValue;
            } else {
                const salidaValue = m.quantity * costoPromedioActual;
                existenciaAcumulada -= m.quantity; totalSalidas += m.quantity; valorSalidas += salidaValue;
            }
        }

        const attrRows = await all(`SELECT av.value as attribute_value FROM variant_attribute_values vav JOIN attribute_values av ON vav.attribute_value_id = av.id WHERE vav.variant_id = ? ORDER BY av.id`, [v.variant_id]);
        // description format: sku - nombre - valor - valor - ...
        let descriptionParts = [];
        if (v.variant_sku) descriptionParts.push(v.variant_sku);
        descriptionParts.push(v.product_name || '');
        if (attrRows && attrRows.length) {
            descriptionParts = descriptionParts.concat(attrRows.map(r => r.attribute_value));
        }
        const description = descriptionParts.filter(Boolean).join(' - ');

        rows.push({
            code: v.variant_sku || `V-${v.variant_id}`,
            description,
            existenciaAnterior: initialStock,
            entradas: totalEntradas,
            salidas: totalSalidas,
            retiros: 0,
            autoconsumo: 0,
            existenciaActual: existenciaAcumulada,
            valorUnitarioAnterior: initialAvgCost,
            valorExistenciaAnterior: initialStock * initialAvgCost,
            valorEntradas,
            valorSalidas,
            valorRetiros: 0,
            valorAutoconsumo: 0,
            valorUnitarioActual: costoPromedioActual,
            valorExistenciaActual: existenciaAcumulada * costoPromedioActual,
            valorPromedio: totalEntradas > 0 ? (valorEntradas / totalEntradas) : initialAvgCost
        });
    }
    return rows;
}

async function buildSummaryInventory(all, get, startDate, endDate, filters = {}) {
    const rows = [];
    // apply optional filters on department/subdepartment
    let prodSql = 'SELECT id, name, base_sku, department_id, subdepartment_id FROM products';
    const prodParams = [];
    if (filters.departmentId) {
        prodSql += ' WHERE department_id = ?';
        prodParams.push(filters.departmentId);
    }
    if (filters.subdepartmentId) {
        if (prodParams.length === 0) prodSql += ' WHERE subdepartment_id = ?';
        else prodSql += ' AND subdepartment_id = ?';
        prodParams.push(filters.subdepartmentId);
    }
    const products = await all(prodSql, prodParams);
    for (const p of products) {
        const latestSnapshot = await get(`SELECT snapshot_date, closing_stock, closing_average_cost FROM inventory_snapshots WHERE product_id = ? AND date(snapshot_date) < ? ORDER BY snapshot_date DESC LIMIT 1`, [p.id, startDate]);
        let initialStock = 0, initialAvgCost = 0, calculationStartDate = '1970-01-01';
        if (latestSnapshot) { initialStock = latestSnapshot.closing_stock; initialAvgCost = latestSnapshot.closing_average_cost; calculationStartDate = latestSnapshot.snapshot_date; }

        const historicalMovements = await all(`SELECT im.type, im.quantity, im.unit_cost FROM inventory_movements im JOIN product_variants pv ON im.variant_id = pv.id WHERE pv.product_id = ? AND im.status = 'Activo' AND date(im.transaction_date) > ? AND date(im.transaction_date) < ? ORDER BY im.transaction_date ASC, im.created_at ASC`, [p.id, calculationStartDate, startDate]);
        for (const m of historicalMovements) {
            if (m.type === 'ENTRADA') {
                const curVal = initialStock * initialAvgCost; const entryVal = m.quantity * (m.unit_cost || 0);
                initialStock += m.quantity; initialAvgCost = initialStock > 0 ? (curVal + entryVal) / initialStock : 0;
            } else { initialStock -= m.quantity; }
        }

        let existenciaAcumulada = initialStock; let costoPromedioActual = initialAvgCost;
        const movements = await all(`SELECT im.type, im.quantity, im.unit_cost FROM inventory_movements im JOIN product_variants pv ON im.variant_id = pv.id WHERE pv.product_id = ? AND im.status = 'Activo' AND date(im.transaction_date) BETWEEN ? AND ? ORDER BY im.transaction_date ASC, im.created_at ASC`, [p.id, startDate, endDate]);
        let entradas = 0, salidas = 0, vEntradas = 0, vSalidas = 0;
        for (const m of movements) {
            if (m.type === 'ENTRADA') { const prev = existenciaAcumulada * costoPromedioActual; const ev = m.quantity * (m.unit_cost || 0); existenciaAcumulada += m.quantity; costoPromedioActual = existenciaAcumulada > 0 ? (prev + ev) / existenciaAcumulada : 0; entradas += m.quantity; vEntradas += ev; }
            else { const sv = m.quantity * costoPromedioActual; existenciaAcumulada -= m.quantity; salidas += m.quantity; vSalidas += sv; }
        }

        rows.push({
            code: p.base_sku || `P-${p.id}`,
            description: p.name,
            existenciaAnterior: initialStock,
            entradas,
            salidas,
            retiros: 0,
            autoconsumo: 0,
            existenciaActual: existenciaAcumulada,
            valorUnitarioAnterior: initialAvgCost,
            valorExistenciaAnterior: initialStock * initialAvgCost,
            valorEntradas: vEntradas,
            valorSalidas: vSalidas,
            valorRetiros: 0,
            valorAutoconsumo: 0,
            valorUnitarioActual: costoPromedioActual,
            valorExistenciaActual: existenciaAcumulada * costoPromedioActual,
            valorPromedio: entradas > 0 ? (vEntradas / entradas) : initialAvgCost
        });
    }
    return rows;
}

// Endpoint: generate inventory excel, accepts mode: 'summary' | 'detailed'
router.post('/inventory-excel', requirePermission('reports:read'), async (req, res) => {
    const { startDate, endDate, mode, filters } = req.body || {};
    if (!startDate || !endDate) return res.status(400).json({ error: 'startDate and endDate are required' });
    try {
        const db = databaseManager.getActiveDb();
        const get = util.promisify(db.get.bind(db));
        const all = util.promisify(db.all.bind(db));
        const activeStoreId = databaseManager.getStoresConfig().activeStoreId;
        const settingsPath = path.join(dataDir, `database_${activeStoreId}_settings.json`);
        let storeDetails = { name: 'MI TIENDA', rif: 'J-000000000' };
        if (fs.existsSync(settingsPath)) storeDetails = { ...storeDetails, ...JSON.parse(fs.readFileSync(settingsPath, 'utf8')) };

        const inventoryData = mode === 'detailed'
            ? await buildDetailedInventory(all, get, startDate, endDate, filters || {})
            : await buildSummaryInventory(all, get, startDate, endDate, filters || {});

        await generateInventoryExcel(res, storeDetails, inventoryData, startDate, endDate);
    } catch (err) {
        console.error('Error generating inventory excel:', err);
        if (!res.headersSent) res.status(500).json({ error: 'Error interno al obtener los datos para el reporte.' });
    }
});

// Inventory as of a specific date (snapshot-like report)
router.post('/inventory-as-of', requirePermission('reports:read'), async (req, res) => {
    const { date, mode, filters } = req.body || {};
    if (!date) return res.status(400).json({ error: 'date is required' });
    try {
        const db = databaseManager.getActiveDb();
        const get = util.promisify(db.get.bind(db));
        const all = util.promisify(db.all.bind(db));
        const activeStoreId = databaseManager.getStoresConfig().activeStoreId;
        const settingsPath = path.join(dataDir, `database_${activeStoreId}_settings.json`);
        let storeDetails = { name: 'MI TIENDA', rif: 'J-000000000' };
        if (fs.existsSync(settingsPath)) storeDetails = { ...storeDetails, ...JSON.parse(fs.readFileSync(settingsPath, 'utf8')) };

        // Build inventory as of date by reusing builders with startDate = date and endDate = date
        const inventoryData = mode === 'detailed'
            ? await buildDetailedInventory(all, get, date, date, filters || {})
            : await buildSummaryInventory(all, get, date, date, filters || {});

        // Use a separate generator for the 'as-of' report so it doesn't reuse the movement excel template
        await generateInventoryAsOfExcel(res, storeDetails, inventoryData, date);
    } catch (err) {
        console.error('Error generating inventory-as-of excel:', err);
        if (!res.headersSent) res.status(500).json({ error: 'Error interno al obtener los datos para el reporte.' });
    }
});

// Profits / earnings reports (JSON)
router.post('/profits', requirePermission('reports:profit'), async (req, res) => {
    const { startDate, endDate, groupBy = 'product', filters, topN, periodGranularity = 'month' } = req.body || {};
    if (!startDate || !endDate) return res.status(400).json({ error: 'startDate and endDate are required' });
    try {
        const db = databaseManager.getActiveDb();
        const all = util.promisify(db.all.bind(db));

        // Common WHERE base
        const baseWhere = `im.type = 'SALIDA' AND im.status = 'Activo' AND date(im.transaction_date) BETWEEN ? AND ?`;
        const baseParams = [startDate, endDate];
        // Apply product-level filters later per query

        if (groupBy === 'client') {
            let sql = `SELECT im.entity_document as entity_document, im.entity_name as entity_name, SUM(im.quantity) as qty_sold, SUM(im.price * im.quantity) as revenue, SUM((im.unit_cost) * im.quantity) as cost
                FROM inventory_movements im
                WHERE ${baseWhere}`;
            if (filters?.departmentId) { sql += ' AND im.variant_id IN (SELECT id FROM product_variants WHERE product_id IN (SELECT id FROM products WHERE department_id = ?))'; baseParams.push(filters.departmentId); }
            if (filters?.subdepartmentId) { sql += ' AND im.variant_id IN (SELECT id FROM product_variants WHERE product_id IN (SELECT id FROM products WHERE subdepartment_id = ?))'; baseParams.push(filters.subdepartmentId); }
            sql += ' GROUP BY im.entity_document, im.entity_name ORDER BY revenue DESC';
            if (topN) sql += ` LIMIT ${Number(topN)}`;
            const rows = await all(sql, baseParams);
            const result = rows.map(r => ({ entity_document: r.entity_document, entity_name: r.entity_name, qty_sold: r.qty_sold || 0, revenue: r.revenue || 0, cost: r.cost || 0, profit: (r.revenue || 0) - (r.cost || 0) }));
            return res.json(result);
        }

        if (groupBy === 'product-detailed') {
            let sql = `SELECT pv.id as variant_id, pv.sku as variant_sku, p.id as product_id, p.name as product_name, SUM(im.quantity) as qty_sold, SUM(im.price * im.quantity) as revenue, SUM((im.unit_cost) * im.quantity) as cost
                FROM inventory_movements im
                JOIN product_variants pv ON im.variant_id = pv.id
                JOIN products p ON pv.product_id = p.id
                WHERE ${baseWhere}`;
            const params = [...baseParams];
            if (filters?.departmentId) { sql += ' AND p.department_id = ?'; params.push(filters.departmentId); }
            if (filters?.subdepartmentId) { sql += ' AND p.subdepartment_id = ?'; params.push(filters.subdepartmentId); }
            sql += ' GROUP BY pv.id ORDER BY revenue DESC';
            if (topN) sql += ` LIMIT ${Number(topN)}`;
            const rows = await all(sql, params);
            const result = rows.map(r => ({ variant_id: r.variant_id, variant_sku: r.variant_sku, product_id: r.product_id, product_name: r.product_name, qty_sold: r.qty_sold || 0, revenue: r.revenue || 0, cost: r.cost || 0, profit: (r.revenue || 0) - (r.cost || 0) }));
            return res.json(result);
        }

        if (groupBy === 'period') {
            // periodGranularity: 'day' | 'month' | 'year'
            let fmt = '%Y-%m';
            if (periodGranularity === 'day') fmt = '%Y-%m-%d';
            if (periodGranularity === 'year') fmt = '%Y';
            let sql = `SELECT strftime('${fmt}', im.transaction_date) as period, SUM(im.quantity) as qty_sold, SUM(im.price * im.quantity) as revenue, SUM((im.unit_cost) * im.quantity) as cost
                FROM inventory_movements im
                JOIN product_variants pv ON im.variant_id = pv.id
                JOIN products p ON pv.product_id = p.id
                WHERE ${baseWhere}`;
            const params = [...baseParams];
            if (filters?.departmentId) { sql += ' AND p.department_id = ?'; params.push(filters.departmentId); }
            if (filters?.subdepartmentId) { sql += ' AND p.subdepartment_id = ?'; params.push(filters.subdepartmentId); }
            sql += ' GROUP BY period ORDER BY period ASC';
            const rows = await all(sql, params);
            const result = rows.map(r => ({ period: r.period, qty_sold: r.qty_sold || 0, revenue: r.revenue || 0, cost: r.cost || 0, profit: (r.revenue || 0) - (r.cost || 0) }));
            return res.json(result);
        }

        // fallback to product grouping
        let baseSql = `SELECT p.id as product_id, p.name as product_name, p.department_id, p.subdepartment_id, SUM(im.quantity) as qty_sold, SUM(im.price * im.quantity) as revenue, SUM((im.unit_cost) * im.quantity) as cost
            FROM inventory_movements im
            JOIN product_variants pv ON im.variant_id = pv.id
            JOIN products p ON pv.product_id = p.id
            WHERE ${baseWhere}`;
        const params = [...baseParams];
        if (filters?.departmentId) { baseSql += ' AND p.department_id = ?'; params.push(filters.departmentId); }
        if (filters?.subdepartmentId) { baseSql += ' AND p.subdepartment_id = ?'; params.push(filters.subdepartmentId); }
        baseSql += ' GROUP BY p.id ORDER BY revenue DESC';
        if (topN) baseSql += ` LIMIT ${Number(topN)}`;
        const rows = await all(baseSql, params);
        const result = rows.map(r => ({ product_id: r.product_id, product_name: r.product_name, qty_sold: r.qty_sold || 0, revenue: r.revenue || 0, cost: r.cost || 0, profit: (r.revenue || 0) - (r.cost || 0) }));
        return res.json(result);
    } catch (err) {
        console.error('Error computing profits:', err);
        res.status(500).json({ error: 'Error interno al calcular ganancias.' });
    }
});

// Preview report data as JSON (client-side preview before download)
router.post('/preview', requirePermission('reports:read'), async (req, res) => {
    const { type, startDate, endDate, filters, mode = 'detailed', groupBy } = req.body || {};
    if (!type || !startDate || !endDate) return res.status(400).json({ error: 'type, startDate and endDate are required' });
    try {
        const db = databaseManager.getActiveDb();
        const all = util.promisify(db.all.bind(db));
        const reportType = type.toUpperCase();

        if (reportType === 'SALES') {
            // Use same logic as sales-excel but return JSON
            let rows = [];
            if (groupBy === 'client') {
                let sql = `SELECT im.entity_document as client_document, im.entity_name as client_name, SUM(im.quantity) as total_qty, SUM(im.price * im.quantity) as total_amount
                    FROM inventory_movements im
                    JOIN product_variants pv ON im.variant_id = pv.id
                    JOIN products p ON pv.product_id = p.id
                    WHERE im.type = 'SALIDA' AND date(im.transaction_date) BETWEEN ? AND ?`;
                const params = [startDate, endDate];
                if (filters?.departmentId) { sql += ' AND p.department_id = ?'; params.push(filters.departmentId); }
                if (filters?.subdepartmentId) { sql += ' AND p.subdepartment_id = ?'; params.push(filters.subdepartmentId); }
                sql += ' GROUP BY im.entity_document, im.entity_name ORDER BY total_amount DESC';
                rows = await all(sql, params);
                rows = rows.map(r => ({ client_document: r.client_document, client_name: r.client_name, qty: r.total_qty, amount: r.total_amount }));
                return res.json(rows);
            }

            if (mode === 'summary') {
                let sql = `SELECT strftime('%Y-%m-%d', im.transaction_date) as date, im.document_number as invoice_number, im.entity_name as client_name, SUM(im.quantity) as total_qty, SUM(im.price * im.quantity) as total_amount
                    FROM inventory_movements im
                    JOIN product_variants pv ON im.variant_id = pv.id
                    JOIN products p ON pv.product_id = p.id
                    WHERE im.type = 'SALIDA' AND date(im.transaction_date) BETWEEN ? AND ?`;
                const params = [startDate, endDate];
                if (filters?.departmentId) { sql += ' AND p.department_id = ?'; params.push(filters.departmentId); }
                if (filters?.subdepartmentId) { sql += ' AND p.subdepartment_id = ?'; params.push(filters.subdepartmentId); }
                sql += ' GROUP BY im.document_number, date ORDER BY date';
                const summaryRows = await all(sql, params);
                return res.json(summaryRows.map(r => ({ date: r.date, invoice_number: r.invoice_number, client_name: r.client_name, total_qty: r.total_qty, total_amount: r.total_amount })));
            }

            // detailed
            let sql = `SELECT strftime('%Y-%m-%d %H:%M', im.transaction_date) as transaction_date_formatted, p.name as product_name, pv.sku as variant_sku, im.quantity, im.price, im.entity_name, im.entity_document, im.document_number
                FROM inventory_movements im
                JOIN product_variants pv ON im.variant_id = pv.id
                JOIN products p ON pv.product_id = p.id
                WHERE im.type = 'SALIDA' AND date(im.transaction_date) BETWEEN ? AND ?`;
            const params = [startDate, endDate];
            if (filters?.departmentId) { sql += ' AND p.department_id = ?'; params.push(filters.departmentId); }
            if (filters?.subdepartmentId) { sql += ' AND p.subdepartment_id = ?'; params.push(filters.subdepartmentId); }
            sql += ' ORDER BY im.transaction_date';
            const detailedRows = await all(sql, params);
            return res.json(detailedRows.map(r => ({ transaction_date: r.transaction_date_formatted, product_name: r.product_name, variant_sku: r.variant_sku, quantity: r.quantity, price: r.price, entity_name: r.entity_name, entity_document: r.entity_document, document_number: r.document_number })));
        }

        if (reportType === 'PURCHASES') {
            let rows = [];
            if (groupBy === 'client' || groupBy === 'supplier') {
                let sql = `SELECT im.entity_document as entity_document, im.entity_name as entity_name, SUM(im.quantity) as total_qty, SUM(im.unit_cost * im.quantity) as total_cost
                    FROM inventory_movements im
                    JOIN product_variants pv ON im.variant_id = pv.id
                    JOIN products p ON pv.product_id = p.id
                    WHERE im.type = 'ENTRADA' AND date(im.transaction_date) BETWEEN ? AND ?`;
                const params = [startDate, endDate];
                if (filters?.departmentId) { sql += ' AND p.department_id = ?'; params.push(filters.departmentId); }
                if (filters?.subdepartmentId) { sql += ' AND p.subdepartment_id = ?'; params.push(filters.subdepartmentId); }
                sql += ' GROUP BY im.entity_document, im.entity_name ORDER BY total_cost DESC';
                rows = await all(sql, params);
                return res.json(rows.map(r => ({ entity_document: r.entity_document, entity_name: r.entity_name, qty: r.total_qty, total_cost: r.total_cost })));
            }

            if (mode === 'summary') {
                let sql = `SELECT strftime('%Y-%m-%d', im.transaction_date) as date, im.document_number as invoice_number, im.entity_name as entity_name, SUM(im.quantity) as total_qty, SUM(im.unit_cost * im.quantity) as total_cost
                    FROM inventory_movements im
                    JOIN product_variants pv ON im.variant_id = pv.id
                    JOIN products p ON pv.product_id = p.id
                    WHERE im.type = 'ENTRADA' AND date(im.transaction_date) BETWEEN ? AND ?`;
                const params = [startDate, endDate];
                if (filters?.departmentId) { sql += ' AND p.department_id = ?'; params.push(filters.departmentId); }
                if (filters?.subdepartmentId) { sql += ' AND p.subdepartment_id = ?'; params.push(filters.subdepartmentId); }
                sql += ' GROUP BY im.document_number, date ORDER BY date';
                const summaryRows = await all(sql, params);
                return res.json(summaryRows.map(r => ({ date: r.date, invoice_number: r.invoice_number, entity_name: r.entity_name, total_qty: r.total_qty, total_cost: r.total_cost })));
            }

            // detailed
            let sql = `SELECT strftime('%Y-%m-%d %H:%M', im.transaction_date) as transaction_date_formatted, p.name as product_name, pv.sku as variant_sku, im.quantity, im.unit_cost, im.entity_name, im.entity_document, im.document_number
                FROM inventory_movements im
                JOIN product_variants pv ON im.variant_id = pv.id
                JOIN products p ON pv.product_id = p.id
                WHERE im.type = 'ENTRADA' AND date(im.transaction_date) BETWEEN ? AND ?`;
            const params = [startDate, endDate];
            if (filters?.departmentId) { sql += ' AND p.department_id = ?'; params.push(filters.departmentId); }
            if (filters?.subdepartmentId) { sql += ' AND p.subdepartment_id = ?'; params.push(filters.subdepartmentId); }
            sql += ' ORDER BY im.transaction_date';
            const detailedRows = await all(sql, params);
            return res.json(detailedRows.map(r => ({ transaction_date: r.transaction_date_formatted, product_name: r.product_name, variant_sku: r.variant_sku, quantity: r.quantity, unit_cost: r.unit_cost, entity_name: r.entity_name, entity_document: r.entity_document, document_number: r.document_number })));
        }

        if (reportType === 'INVENTORY') {
            // Reuse builders
            const get = util.promisify(db.get.bind(db));
            const allFn = util.promisify(db.all.bind(db));
            if (mode === 'detailed') {
                const data = await buildDetailedInventory(allFn, get, startDate, endDate, filters || {});
                return res.json(data);
            } else {
                const data = await buildSummaryInventory(allFn, get, startDate, endDate, filters || {});
                return res.json(data);
            }
        }

        return res.status(400).json({ error: 'Invalid report type' });
    } catch (err) {
        console.error('Error in preview:', err);
        res.status(500).json({ error: 'Error interno al generar la previsualización.' });
    }
});

// Export sales to Excel (supports mode: 'detailed'|'summary' and groupBy: 'client')
router.post('/sales-excel', requirePermission('reports:read'), async (req, res) => {
    const { startDate, endDate, filters, mode = 'detailed', groupBy } = req.body || {};
    if (!startDate || !endDate) return res.status(400).json({ error: 'startDate and endDate are required' });
    try {
        const db = databaseManager.getActiveDb();
        const all = util.promisify(db.all.bind(db));
        let rows = [];

        if (groupBy === 'client') {
            // Aggregate by client
            let sql = `SELECT im.entity_document as client_document, im.entity_name as client_name, SUM(im.quantity) as total_qty, SUM(im.price * im.quantity) as total_amount
                FROM inventory_movements im
                JOIN product_variants pv ON im.variant_id = pv.id
                JOIN products p ON pv.product_id = p.id
                WHERE im.type = 'SALIDA' AND date(im.transaction_date) BETWEEN ? AND ?`;
            const params = [startDate, endDate];
            if (filters?.departmentId) { sql += ' AND p.department_id = ?'; params.push(filters.departmentId); }
            if (filters?.subdepartmentId) { sql += ' AND p.subdepartment_id = ?'; params.push(filters.subdepartmentId); }
            sql += ' GROUP BY im.entity_document, im.entity_name ORDER BY total_amount DESC';
            rows = await all(sql, params);
            // Map to generator shape: date empty, type empty, product empty, quantity=total_qty, total price=total_amount, entidad=client_name
            rows = rows.map(r => ({ transaction_date: '', type: '', name: '', base_sku: '', variant_sku: '', quantity: r.total_qty, price: 0, unit_cost: 0, total_price: r.total_amount, total_cost: 0, entity_name: r.client_name, entity_document: r.client_document }));
        } else if (mode === 'summary') {
            // Summary by invoice/document_number
            let sql = `SELECT strftime('%Y-%m-%d', im.transaction_date) as date, im.document_number as invoice_number, im.entity_name as client_name, SUM(im.quantity) as total_qty, SUM(im.price * im.quantity) as total_amount
                FROM inventory_movements im
                JOIN product_variants pv ON im.variant_id = pv.id
                JOIN products p ON pv.product_id = p.id
                WHERE im.type = 'SALIDA' AND date(im.transaction_date) BETWEEN ? AND ?`;
            const params = [startDate, endDate];
            if (filters?.departmentId) { sql += ' AND p.department_id = ?'; params.push(filters.departmentId); }
            if (filters?.subdepartmentId) { sql += ' AND p.subdepartment_id = ?'; params.push(filters.subdepartmentId); }
            sql += ' GROUP BY im.document_number, date ORDER BY date';
            const summaryRows = await all(sql, params);
            rows = summaryRows.map(r => ({ transaction_date: r.date, type: '', name: '', base_sku: '', variant_sku: '', quantity: r.total_qty, price: 0, unit_cost: 0, total_price: r.total_amount, total_cost: 0, entity_name: r.client_name, document_number: r.invoice_number }));
        } else {
            // detailed
            let sql = `SELECT strftime('%Y-%m-%d %H:%M', im.transaction_date) as transaction_date_formatted, p.name as product_name, pv.sku as variant_sku, im.quantity, im.price, im.entity_name, im.entity_document, im.document_number
                FROM inventory_movements im
                JOIN product_variants pv ON im.variant_id = pv.id
                JOIN products p ON pv.product_id = p.id
                WHERE im.type = 'SALIDA' AND date(im.transaction_date) BETWEEN ? AND ?`;
            const params = [startDate, endDate];
            if (filters?.departmentId) { sql += ' AND p.department_id = ?'; params.push(filters.departmentId); }
            if (filters?.subdepartmentId) { sql += ' AND p.subdepartment_id = ?'; params.push(filters.subdepartmentId); }
            sql += ' ORDER BY im.transaction_date';
            const detailedRows = await all(sql, params);
            rows = detailedRows.map(r => ({ transaction_date: r.transaction_date_formatted, type: '', name: r.product_name, base_sku: '', variant_sku: r.variant_sku, quantity: r.quantity, price: r.price, unit_cost: null, total_price: (r.price || 0) * (r.quantity || 0), total_cost: 0, entity_name: r.entity_name, entity_document: r.entity_document, document_number: r.document_number }));
        }

        const activeStoreId = databaseManager.getStoresConfig().activeStoreId;
        const settingsPath = path.join(dataDir, `database_${activeStoreId}_settings.json`);
        let storeDetails = { name: 'MI TIENDA', rif: 'J-000000000' };
        if (fs.existsSync(settingsPath)) storeDetails = { ...storeDetails, ...JSON.parse(fs.readFileSync(settingsPath, 'utf8')) };
        await generateMovementsExcel(res, storeDetails, rows, startDate, endDate, 'Ventas');
    } catch (err) {
        console.error('Error generating sales excel:', err);
        if (!res.headersSent) res.status(500).json({ error: 'Error interno al generar el archivo.' });
    }
});

// Export purchases to Excel (supports mode: 'detailed'|'summary' and groupBy: 'supplier'|'client')
router.post('/purchases-excel', requirePermission('reports:read'), async (req, res) => {
    const { startDate, endDate, filters, mode = 'detailed', groupBy } = req.body || {};
    if (!startDate || !endDate) return res.status(400).json({ error: 'startDate and endDate are required' });
    try {
        const db = databaseManager.getActiveDb();
        const all = util.promisify(db.all.bind(db));
        let rows = [];

        if (groupBy === 'client' || groupBy === 'supplier') {
            // Aggregate by entity (for purchases it may be supplier)
            let sql = `SELECT im.entity_document as entity_document, im.entity_name as entity_name, SUM(im.quantity) as total_qty, SUM(im.unit_cost * im.quantity) as total_cost
                FROM inventory_movements im
                JOIN product_variants pv ON im.variant_id = pv.id
                JOIN products p ON pv.product_id = p.id
                WHERE im.type = 'ENTRADA' AND date(im.transaction_date) BETWEEN ? AND ?`;
            const params = [startDate, endDate];
            if (filters?.departmentId) { sql += ' AND p.department_id = ?'; params.push(filters.departmentId); }
            if (filters?.subdepartmentId) { sql += ' AND p.subdepartment_id = ?'; params.push(filters.subdepartmentId); }
            sql += ' GROUP BY im.entity_document, im.entity_name ORDER BY total_cost DESC';
            rows = await all(sql, params);
            rows = rows.map(r => ({ transaction_date: '', type: '', name: '', base_sku: '', variant_sku: '', quantity: r.total_qty, price: 0, unit_cost: 0, total_price: 0, total_cost: r.total_cost, entity_name: r.entity_name, entity_document: r.entity_document }));
        } else if (mode === 'summary') {
            // Summary by document_number
            let sql = `SELECT strftime('%Y-%m-%d', im.transaction_date) as date, im.document_number as invoice_number, im.entity_name as entity_name, SUM(im.quantity) as total_qty, SUM(im.unit_cost * im.quantity) as total_cost
                FROM inventory_movements im
                JOIN product_variants pv ON im.variant_id = pv.id
                JOIN products p ON pv.product_id = p.id
                WHERE im.type = 'ENTRADA' AND date(im.transaction_date) BETWEEN ? AND ?`;
            const params = [startDate, endDate];
            if (filters?.departmentId) { sql += ' AND p.department_id = ?'; params.push(filters.departmentId); }
            if (filters?.subdepartmentId) { sql += ' AND p.subdepartment_id = ?'; params.push(filters.subdepartmentId); }
            sql += ' GROUP BY im.document_number, date ORDER BY date';
            const summaryRows = await all(sql, params);
            rows = summaryRows.map(r => ({ transaction_date: r.date, type: '', name: '', base_sku: '', variant_sku: '', quantity: r.total_qty, price: 0, unit_cost: 0, total_price: 0, total_cost: r.total_cost, entity_name: r.entity_name, document_number: r.invoice_number }));
        } else {
            // detailed
            let sql = `SELECT strftime('%Y-%m-%d %H:%M', im.transaction_date) as transaction_date_formatted, p.name as product_name, pv.sku as variant_sku, im.quantity, im.unit_cost, im.entity_name, im.entity_document, im.document_number
                FROM inventory_movements im
                JOIN product_variants pv ON im.variant_id = pv.id
                JOIN products p ON pv.product_id = p.id
                WHERE im.type = 'ENTRADA' AND date(im.transaction_date) BETWEEN ? AND ?`;
            const params = [startDate, endDate];
            if (filters?.departmentId) { sql += ' AND p.department_id = ?'; params.push(filters.departmentId); }
            if (filters?.subdepartmentId) { sql += ' AND p.subdepartment_id = ?'; params.push(filters.subdepartmentId); }
            sql += ' ORDER BY im.transaction_date';
            const detailedRows = await all(sql, params);
            rows = detailedRows.map(r => ({ transaction_date: r.transaction_date_formatted, type: '', name: r.product_name, base_sku: '', variant_sku: r.variant_sku, quantity: r.quantity, price: 0, unit_cost: r.unit_cost, total_price: 0, total_cost: (r.unit_cost || 0) * (r.quantity || 0), entity_name: r.entity_name, entity_document: r.entity_document, document_number: r.document_number }));
        }

        const activeStoreId = databaseManager.getStoresConfig().activeStoreId;
        const settingsPath = path.join(dataDir, `database_${activeStoreId}_settings.json`);
        let storeDetails = { name: 'MI TIENDA', rif: 'J-000000000' };
        if (fs.existsSync(settingsPath)) storeDetails = { ...storeDetails, ...JSON.parse(fs.readFileSync(settingsPath, 'utf8')) };
        await generateMovementsExcel(res, storeDetails, rows, startDate, endDate, 'Compras');
    } catch (err) {
        console.error('Error generating purchases excel:', err);
        if (!res.headersSent) res.status(500).json({ error: 'Error interno al generar el archivo.' });
    }
});

router.post('/historical-summary', requirePermission('reports:read'), async (req, res) => {
    const { date } = req.body;
    if (!date) return res.status(400).json({ error: 'Se requiere una fecha.' });
    try {
        const db = databaseManager.getActiveDb();
        const get = util.promisify(db.get.bind(db));
        const all = util.promisify(db.all.bind(db));
        const products = await all('SELECT id FROM products');
        let totalStock = 0, totalValue = 0;
        for (const p of products) {
            const latestSnapshot = await get('SELECT snapshot_date, closing_stock, closing_average_cost FROM inventory_snapshots WHERE product_id = ? AND date(snapshot_date) <= ? ORDER BY snapshot_date DESC LIMIT 1', [p.id, date]);
            let currentStock = 0, avgCost = 0, calcStart = '1970-01-01';
            if (latestSnapshot) { currentStock = latestSnapshot.closing_stock; avgCost = latestSnapshot.closing_average_cost; calcStart = latestSnapshot.snapshot_date; }
            const movements = await all('SELECT im.type, im.quantity, im.unit_cost FROM inventory_movements im JOIN product_variants pv ON im.variant_id = pv.id WHERE pv.product_id = ? AND im.status = "Activo" AND date(im.transaction_date) > ? AND date(im.transaction_date) <= ? ORDER BY im.transaction_date ASC, im.created_at ASC', [p.id, calcStart, date]);
            for (const m of movements) {
                if (m.type === 'ENTRADA') { const cur = currentStock * avgCost; const ev = m.quantity * (m.unit_cost || 0); currentStock += m.quantity; avgCost = currentStock > 0 ? (cur + ev) / currentStock : 0; }
                else { currentStock -= m.quantity; }
            }
            if (currentStock > 0) { totalStock += currentStock; totalValue += currentStock * avgCost; }
        }
        res.json({ date, totalProductCount: products.length, totalStock, totalValue });
    } catch (err) {
        console.error('Error historical-summary:', err);
        res.status(500).json({ error: 'Error interno al calcular el resumen.' });
    }
});

router.post('/:type', requirePermission('reports:read'), async (req, res) => {
    const { type } = req.params; const { startDate, endDate, filters } = req.body || {};
    if (!startDate || !endDate) return res.status(400).json({ error: 'startDate and endDate are required' });
    try {
        const db = databaseManager.getActiveDb();
        const dbAll = util.promisify(db.all.bind(db));
        const reportType = type.toUpperCase();
        if (reportType === 'SALES' || reportType === 'PURCHASES') {
            const movementType = reportType === 'SALES' ? 'SALIDA' : 'ENTRADA';
            let sql = `SELECT p.name, p.base_sku as sku, pv.sku as variant_sku, im.* FROM inventory_movements im JOIN product_variants pv ON im.variant_id = pv.id JOIN products p ON pv.product_id = p.id WHERE im.type = ? AND date(im.transaction_date) BETWEEN ? AND ?`;
            const params = [movementType, startDate, endDate];
            if (filters?.departmentId) { sql += ' AND p.department_id = ?'; params.push(filters.departmentId); }
            if (filters?.subdepartmentId) { sql += ' AND p.subdepartment_id = ?'; params.push(filters.subdepartmentId); }
            sql += ' ORDER BY im.transaction_date';
            const rows = await dbAll(sql, params);
            return res.json(rows);
        }
        if (reportType === 'INVENTORY') {
            let sql = `SELECT p.name, p.base_sku as sku, pv.sku as variant_sku, im.* FROM inventory_movements im JOIN product_variants pv ON im.variant_id = pv.id JOIN products p ON pv.product_id = p.id WHERE date(im.transaction_date) BETWEEN ? AND ?`;
            const params = [startDate, endDate];
            if (filters?.departmentId) { sql += ' AND p.department_id = ?'; params.push(filters.departmentId); }
            if (filters?.subdepartmentId) { sql += ' AND p.subdepartment_id = ?'; params.push(filters.subdepartmentId); }
            sql += ' ORDER BY p.name, im.transaction_date';
            const rows = await dbAll(sql, params);
            return res.json(rows);
        }
        res.status(400).json({ error: 'Invalid report type' });
    } catch (err) {
        console.error('Error in /:type report:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/', requirePermission('reports:read'), async (req, res) => {
    try {
        const db = databaseManager.getActiveDb();
        const dbAll = util.promisify(db.all.bind(db));
        const rows = await dbAll('SELECT * FROM inventory_reports ORDER BY generated_at DESC', []);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
