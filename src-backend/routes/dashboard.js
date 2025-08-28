const express = require('express');
const util = require('util');
const { subDays, formatISO } = require('date-fns');
const databaseManager = require('../database-manager');

const router = express.Router();

router.get('/summary', async (req, res) => {
    try {
        const db = databaseManager.getActiveDb();
        const get = util.promisify(db.get.bind(db));

        const now = new Date();
        const thirtyDaysAgo = formatISO(subDays(now, 30), { representation: 'date' });
        const sixtyDaysAgo = formatISO(subDays(now, 60), { representation: 'date' });

        const salesQuery = `
            SELECT
                SUM(CASE WHEN date(transaction_date) >= ? THEN quantity * price ELSE 0 END) as currentRevenue,
                COUNT(DISTINCT CASE WHEN date(transaction_date) >= ? THEN transaction_id ELSE NULL END) as currentSalesCount,
                SUM(CASE WHEN date(transaction_date) >= ? AND date(transaction_date) < ? THEN quantity * price ELSE 0 END) as previousRevenue,
                COUNT(DISTINCT CASE WHEN date(transaction_date) >= ? AND date(transaction_date) < ? THEN transaction_id ELSE NULL END) as previousSalesCount
            FROM inventory_movements
            WHERE type = 'SALIDA' AND status = 'Activo' AND date(transaction_date) >= ?
        `;
        
        const productQuery = `SELECT COUNT(*) as totalProducts FROM products WHERE status = 'Activo'`;
        
        const salesData = await get(salesQuery, [thirtyDaysAgo, thirtyDaysAgo, sixtyDaysAgo, thirtyDaysAgo, sixtyDaysAgo, thirtyDaysAgo, sixtyDaysAgo]);
        const productData = await get(productQuery);

        const calculateChange = (current, previous) => {
            if (previous === 0) return current > 0 ? 100.0 : 0.0;
            return ((current - previous) / previous) * 100;
        };

        const summary = {
            totalRevenue: {
                value: salesData.currentRevenue || 0,
                change: calculateChange(salesData.currentRevenue || 0, salesData.previousRevenue || 0)
            },
            sales: {
                value: salesData.currentSalesCount || 0,
                change: calculateChange(salesData.currentSalesCount || 0, salesData.previousSalesCount || 0)
            },
            totalProducts: {
                value: productData.totalProducts || 0,
                change: 0
            },
            newCustomers: { value: 0, change: 0 }
        };

        res.json(summary);

    } catch (err) {
        console.error("Error fetching dashboard summary:", err);
        res.status(500).json({ error: "Failed to fetch dashboard summary" });
    }
});

router.get('/recent-sales', async (req, res) => {
    try {
        const db = databaseManager.getActiveDb();
        const dbAll = util.promisify(db.all.bind(db));
        const sql = `
            SELECT
                im.transaction_id as id,
                SUM(im.quantity * im.price) as amount,
                MAX(im.transaction_date) as date,
                im.entity_name as customerName,
                p.name as productName,
                (
                    SELECT GROUP_CONCAT(av.value, ' / ')
                    FROM variant_attribute_values vav
                    JOIN attribute_values av ON vav.attribute_value_id = av.id
                    WHERE vav.variant_id = im.variant_id
                ) as variantName
            FROM inventory_movements im
            JOIN product_variants pv ON im.variant_id = pv.id
            JOIN products p ON pv.product_id = p.id
            WHERE im.type = 'SALIDA' AND im.status = 'Activo'
            GROUP BY im.transaction_id
            ORDER BY date DESC
            LIMIT 5
        `;
        const rows = await dbAll(sql, []);

        const salesData = rows.map(row => ({
            id: row.id,
            customerName: row.customerName || 'Venta de mostrador',
            productName: row.variantName ? `${row.productName} (${row.variantName})` : row.productName,
            status: 'Completado',
            date: row.date,
            amount: row.amount || 0
        }));

        res.json(salesData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
