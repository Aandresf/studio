const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const util = require('util');

const isTestEnv = process.env.NODE_ENV === 'test';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const DB_FILE = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log(`Connected to the SQLite database: ${DB_FILE}`);
  }
});

// Promisified DB methods
const run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) {
                console.error('DB run error:', err.message);
                reject(err);
            } else {
                resolve({ lastID: this.lastID, changes: this.changes });
            }
        });
    });
};
const get = util.promisify(db.get.bind(db));
const all = util.promisify(db.all.bind(db));


// --- API Endpoints ---

// PRODUCTS
app.get('/api/products', async (req, res) => {
  try {
    const rows = await all('SELECT * FROM products ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  const { name, sku, current_stock = 0, average_cost = 0 } = req.body;
  if (!name) return res.status(400).json({ error: 'Product name is required.' });
  const sql = `INSERT INTO products (name, sku, current_stock, average_cost) VALUES (?, ?, ?, ?)`;
  try {
    const result = await run(sql, [name, sku, current_stock, average_cost]);
    res.status(201).json({ id: result.lastID, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const row = await get('SELECT * FROM products WHERE id = ?', [req.params.id]);
        if (!row) return res.status(404).json({ error: 'Product not found' });
        res.json(row);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/products/:id', async (req, res) => {
  const { name, sku, current_stock, average_cost } = req.body;
  if (!name) return res.status(400).json({ error: 'Product name is required.' });
  const sql = `UPDATE products SET name = ?, sku = ?, current_stock = ?, average_cost = ?, updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now') WHERE id = ?`;
  try {
    const result = await run(sql, [name, sku, current_stock, average_cost, req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const result = await run('DELETE FROM products WHERE id = ?', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: 'Product not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// INVENTORY MOVEMENTS
app.post('/api/inventory/movements', async (req, res) => {
    const { product_id, type, quantity, unit_cost, description, date } = req.body;
    if (!product_id || !type || !quantity) {
        return res.status(400).json({ error: 'Missing required fields: product_id, type, quantity' });
    }

    if (type === 'ENTRADA' && (unit_cost === undefined || unit_cost === null)) {
        return res.status(400).json({ error: 'unit_cost is required for ENTRADA movements' });
    }

    try {
        await run('BEGIN TRANSACTION');

        const product = await get('SELECT current_stock, average_cost FROM products WHERE id = ?', [product_id]);

        if (!product) {
            await run('ROLLBACK');
            return res.status(404).json({ error: 'Product not found' });
        }

        let new_stock = product.current_stock;
        let new_avg_cost = product.average_cost;

        if (type === 'ENTRADA') {
            new_stock += quantity;
            const current_total_value = product.current_stock * product.average_cost;
            const entry_value = quantity * unit_cost;
            new_avg_cost = new_stock > 0 ? (current_total_value + entry_value) / new_stock : 0;
        } else { // SALIDA, RETIRO, AUTO-CONSUMO
            if (product.current_stock < quantity) {
                await run('ROLLBACK');
                return res.status(400).json({ error: 'Insufficient stock' });
            }
            new_stock -= quantity;
        }

        const movementDate = date ? date : new Date().toISOString().slice(0, 19).replace('T', ' ');
        const movementSql = `INSERT INTO inventory_movements (product_id, type, quantity, unit_cost, description, date) VALUES (?, ?, ?, ?, ?, ?)`;
        await run(movementSql, [product_id, type, quantity, unit_cost, description, movementDate]);

        const productSql = `UPDATE products SET current_stock = ?, average_cost = ?, updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now') WHERE id = ?`;
        await run(productSql, [new_stock, new_avg_cost, product_id]);

        await run('COMMIT');
        res.status(201).json({ message: 'Movement registered and product updated' });

    } catch (err) {
        try {
            await run('ROLLBACK');
        } catch (rollbackErr) {
            console.error('Fatal: Could not rollback transaction', rollbackErr);
        }
        res.status(500).json({ error: err.message });
    }
});


// REPORTS

async function generateInventoryReport(startDate, endDate) {
    // This query calculates the stock for each product at the beginning of the startDate
    // by summing all movements that occurred before that date.
    const openingStockQuery = `
        SELECT
            p.id AS product_id,
            p.name,
            p.sku,
            IFNULL(SUM(
                CASE
                    WHEN im.type = 'ENTRADA' THEN im.quantity
                    ELSE -im.quantity
                END
            ), 0) AS opening_stock
        FROM
            products p
        LEFT JOIN
            inventory_movements im ON p.id = im.product_id AND date(im.date) < ?
        GROUP BY
            p.id, p.name, p.sku
        ORDER BY
            p.name;
    `;

    // This query gets all movements within the specified date range.
    const movementsQuery = `
        SELECT
            product_id,
            type,
            quantity
        FROM
            inventory_movements
        WHERE
            date(date) BETWEEN ? AND ?;
    `;

    const [openingStocks, movements] = await Promise.all([
        all(openingStockQuery, [startDate]),
        all(movementsQuery, [startDate, endDate])
    ]);

    const movementsByProduct = new Map();
    movements.forEach(m => {
        if (!movementsByProduct.has(m.product_id)) {
            movementsByProduct.set(m.product_id, { entradas: 0, salidas: 0 });
        }
        const productMovements = movementsByProduct.get(m.product_id);
        if (m.type === 'ENTRADA') {
            productMovements.entradas += m.quantity;
        } else {
            productMovements.salidas += m.quantity;
        }
    });

    const report = openingStocks.map(product => {
        const productMovements = movementsByProduct.get(product.product_id) || { entradas: 0, salidas: 0 };
        const { entradas, salidas } = productMovements;
        const closing_stock = product.opening_stock + entradas - salidas;

        return {
            product_id: product.product_id,
            name: product.name,
            sku: product.sku,
            opening_stock: product.opening_stock,
            entradas,
            salidas,
            closing_stock
        };
    });

    return report;
}


app.post('/api/reports/:type', async (req, res) => {
    const { type } = req.params;
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const reportType = type.toUpperCase();

    try {
        let reportData;
        let query;

        if (reportType === 'SALES' || reportType === 'PURCHASES') {
            const movementType = reportType === 'SALES' ? 'SALIDA' : 'ENTRADA';
            query = `
                SELECT p.name, p.sku, im.*
                FROM inventory_movements im
                JOIN products p ON im.product_id = p.id
                WHERE im.type = ? AND date(im.date) BETWEEN ? AND ?
                ORDER BY im.date
            `;
            reportData = await all(query, [movementType, startDate, endDate]);
        } else if (reportType === 'INVENTORY') {
            reportData = await generateInventoryReport(startDate, endDate);
        } else {
            return res.status(400).json({ error: 'Invalid report type' });
        }

        const reportJson = JSON.stringify(reportData);
        const insertSql = `INSERT INTO inventory_reports (start_date, end_date, report_data) VALUES (?, ?, ?)`;
        
        const result = await run(insertSql, [startDate, endDate, reportJson]);
        const reportId = result.lastID;

        const newReport = await get('SELECT * FROM inventory_reports WHERE id = ?', [reportId]);

        res.status(201).json(newReport);

    } catch (err) {
        console.error('Error generating report:', err);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

app.get('/api/reports', async (req, res) => {
    try {
        const rows = await all('SELECT id, start_date, end_date, generated_at FROM inventory_reports ORDER BY generated_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/reports/:id', async (req, res) => {
    try {
        const report = await get('SELECT * FROM inventory_reports WHERE id = ?', [req.params.id]);
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }
        res.json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// DASHBOARD
app.get('/api/dashboard/summary', async (req, res) => {
    try {
        const summary = await get(`
            SELECT
                (SELECT COUNT(*) FROM products) as productCount,
                (SELECT SUM(current_stock * average_cost) FROM products) as totalInventoryValue,
                (SELECT COUNT(*) FROM inventory_movements WHERE type = 'SALIDA' AND date(date) >= date('now', '-30 days')) as salesCount30d
        `);
        res.json(summary);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/dashboard/recent-sales', async (req, res) => {
    const sql = `
        SELECT p.name as productName, im.quantity, im.date
        FROM inventory_movements im
        JOIN products p ON im.product_id = p.id
        WHERE im.type = 'SALIDA'
        ORDER BY im.date DESC
        LIMIT 5
    `;
    try {
        const rows = await all(sql);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// SETTINGS - Simplified: using a JSON file for settings for now.
const SETTINGS_FILE = path.join(__dirname, 'settings.json');

app.get('/api/settings/store', (req, res) => {
    fs.readFile(SETTINGS_FILE, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') return res.json({}); // No settings yet
            return res.status(500).json({ error: err.message });
        }
        res.json(JSON.parse(data));
    });
});

app.put('/api/settings/store', (req, res) => {
    fs.writeFile(SETTINGS_FILE, JSON.stringify(req.body, null, 2), (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Settings updated successfully' });
    });
});

// DATABASE BACKUP/RESTORE - Placeholder endpoints
app.post('/api/database/backup', (req, res) => {
    const backupPath = path.join(__dirname, `backup-${Date.now()}.db`);
    const src = fs.createReadStream(DB_FILE);
    const dest = fs.createWriteStream(backupPath);
    src.pipe(dest);
    src.on('end', () => res.json({ message: `Backup created at ${backupPath}` }));
    src.on('error', (err) => res.status(500).json({ error: err.message }));
});

app.post('/api/database/restore', (req, res) => {
    // This is a dangerous operation and needs more robust implementation
    // For example, getting the backup file path from the request body
    res.status(511).json({ message: 'Restore functionality not fully implemented.' });
});


// Server Initialization
const server = app.listen(PORT, () => {
  if (!isTestEnv) {
    console.log(`Backend server listening on http://localhost:${PORT}`);
    const SQL_SETUP_FILE = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(SQL_SETUP_FILE, 'utf8');
    db.exec(sql, (err) => {
      if (err && !err.message.includes('already exists')) {
        console.error('Error executing schema.sql:', err.message);
      } else if (!isTestEnv) {
        console.log('Database initialized successfully.');
      }
    });
  }
});

// Graceful Shutdown
const shutdown = () => {
  server.close(() => {
    if (!isTestEnv) console.log('Server closed.');
    db.close((err) => {
      if (err) return console.error(err.message);
      if (!isTestEnv) console.log('Database connection closed.');
      process.exit(0);
    });
  });
};

process.on('SIGINT', shutdown);

module.exports = { app, server, db, shutdown };