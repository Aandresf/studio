
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

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

// --- API Endpoints ---

// PRODUCTS
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products ORDER BY name', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/products', (req, res) => {
  const { name, sku, current_stock = 0, average_cost = 0 } = req.body;
  if (!name) return res.status(400).json({ error: 'Product name is required.' });
  const sql = `INSERT INTO products (name, sku, current_stock, average_cost) VALUES (?, ?, ?, ?)`;
  db.run(sql, [name, sku, current_stock, average_cost], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, ...req.body });
  });
});

app.get('/api/products/:id', (req, res) => {
    db.get('SELECT * FROM products WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Product not found' });
        res.json(row);
    });
});

app.put('/api/products/:id', (req, res) => {
  const { name, sku, current_stock, average_cost } = req.body;
  if (!name) return res.status(400).json({ error: 'Product name is required.' });
  const sql = `UPDATE products SET name = ?, sku = ?, current_stock = ?, average_cost = ?, updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now') WHERE id = ?`;
  db.run(sql, [name, sku, current_stock, average_cost, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product updated successfully' });
  });
});

app.delete('/api/products/:id', (req, res) => {
  db.run('DELETE FROM products WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Product not found' });
    res.status(204).send();
  });
});

// INVENTORY MOVEMENTS
app.post('/api/inventory/movements', (req, res) => {
    const { product_id, type, quantity, unit_cost, description } = req.body;
    if (!product_id || !type || !quantity) {
        return res.status(400).json({ error: 'Missing required fields: product_id, type, quantity' });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // 1. Get current product state
        db.get('SELECT current_stock, average_cost FROM products WHERE id = ?', [product_id], (err, product) => {
            if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: err.message });
            }
            if (!product) {
                db.run('ROLLBACK');
                return res.status(404).json({ error: 'Product not found' });
            }

            let new_stock = product.current_stock;
            let new_avg_cost = product.average_cost;

            if (type === 'ENTRADA') {
                new_stock += quantity;
                const current_total_value = product.current_stock * product.average_cost;
                const entry_value = quantity * unit_cost;
                new_avg_cost = (current_total_value + entry_value) / new_stock;
            } else { // SALIDA, RETIRO, AUTO-CONSUMO
                if (product.current_stock < quantity) {
                    db.run('ROLLBACK');
                    return res.status(400).json({ error: 'Insufficient stock' });
                }
                new_stock -= quantity;
            }

            // 2. Insert movement
            const movementSql = `INSERT INTO inventory_movements (product_id, type, quantity, unit_cost, description) VALUES (?, ?, ?, ?, ?)`;
            db.run(movementSql, [product_id, type, quantity, unit_cost, description], function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: err.message });
                }

                // 3. Update product
                const productSql = `UPDATE products SET current_stock = ?, average_cost = ?, updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now') WHERE id = ?`;
                db.run(productSql, [new_stock, new_avg_cost, product_id], (err) => {
                    if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: err.message });
                    }
                    db.run('COMMIT');
                    res.status(201).json({ message: 'Movement registered and product updated' });
                });
            });
        });
    });
});


// REPORTS
app.post('/api/reports/:type', (req, res) => {
    const { type } = req.params;
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    let query;
    const reportType = type.toUpperCase();

    if (reportType === 'SALES' || reportType === 'PURCHASES') {
        const movementType = reportType === 'SALES' ? 'SALIDA' : 'ENTRADA';
        query = `
            SELECT p.name, p.sku, im.*
            FROM inventory_movements im
            JOIN products p ON im.product_id = p.id
            WHERE im.type = ? AND im.date BETWEEN ? AND ?
            ORDER BY im.date
        `;
        db.all(query, [movementType, startDate, endDate], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    } else if (reportType === 'INVENTORY') {
        // This is a complex report, for now we just return all movements in the range
        query = `
            SELECT p.name, p.sku, im.*
            FROM inventory_movements im
            JOIN products p ON im.product_id = p.id
            WHERE im.date BETWEEN ? AND ?
            ORDER BY p.name, im.date
        `;
         db.all(query, [startDate, endDate], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    } else {
        res.status(400).json({ error: 'Invalid report type' });
    }
});

app.get('/api/reports', (req, res) => {
    db.all('SELECT * FROM inventory_reports ORDER BY generated_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});


// DASHBOARD
app.get('/api/dashboard/summary', (req, res) => {
    const queries = {
        totalRevenue: `SELECT SUM(quantity * unit_cost) as total FROM inventory_movements WHERE type = 'SALIDA'`, // This is conceptually wrong, needs a sales table
        totalSales: `SELECT COUNT(*) as total FROM inventory_movements WHERE type = 'SALIDA'`,
        productCount: `SELECT COUNT(*) as total FROM products`,
        // newCustomers: `SELECT COUNT(*) as total FROM customers WHERE created_at >= date('now', '-30 days')` // Needs customers table
    };
    // This is a simplified version. A real dashboard would need more complex queries and tables.
    db.get("SELECT (SELECT SUM(current_stock * average_cost) FROM products) as totalValue, (SELECT COUNT(*) FROM products) as productCount", (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
    });
});

app.get('/api/dashboard/recent-sales', (req, res) => {
    const sql = `
        SELECT p.name as productName, im.quantity, im.date
        FROM inventory_movements im
        JOIN products p ON im.product_id = p.id
        WHERE im.type = 'SALIDA'
        ORDER BY im.date DESC
        LIMIT 5
    `;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
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
