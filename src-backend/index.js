
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
app.use(express.urlencoded({ extended: true }));



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

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// PRODUCTS
app.get('/api/products', (req, res) => {
  console.log('--- INICIO DE PETICIÓN GET /api/products ---');
  console.log('Query params:', req.query);
  // 1. Obtenemos los datos con los nombres de columna originales.
  const sql = "SELECT id, name, sku, status, image, current_stock, average_cost FROM products ORDER BY id DESC";
  
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    // 2. Transformamos manualmente los datos para asegurar que el frontend reciba 'stock' y 'price'.
    // Esto elimina la dependencia en el comportamiento del alias del driver de la BD.
    const products = rows.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      status: p.status,
      image: p.image,
      stock: p.current_stock, // Mapeo explícito
      price: p.average_cost   // Mapeo explícito
    }));
    
    res.json(products);
  });
});

app.post('/api/products', (req, res) => {
  // Frontend envía 'stock' y 'price'. Los mapeamos a las columnas de la BD.
  const { name, sku, stock = 0, price = 0 } = req.body;
  const status = req.body.status === 'Inactivo' ? 'Inactivo' : 'Activo';

  if (!name) {
    return res.status(400).json({ error: 'Product name is required.' });
  }

  const sql = `INSERT INTO products (name, sku, status, current_stock, average_cost) VALUES (?, ?, ?, ?, ?)`;
  // Usamos los valores de 'stock' y 'price' para las columnas correctas.
  db.run(sql, [name, sku, status, stock, price], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    
    // Devolvemos el objeto creado con la misma estructura que espera el frontend.
    res.status(201).json({ 
      id: this.lastID, 
      name,
      sku,
      status,
      stock,
      price
    });
  });
});

app.get('/api/products/:id', (req, res) => {
  console.log('--- INICIO DE PETICIÓN GET /api/products/:id ---');
  console.log('ID del producto:', req.params.id);
    const sql = `
      SELECT
        id, name, sku, status, image,
        current_stock as stock,
        average_cost as price
      FROM products
      WHERE id = ?
    `;
    db.get(sql, [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Product not found' });
        res.json(row);
    });
});

app.put('/api/products/:id', (req, res) => {

  console.log('--- INICIO DE PETICIÓN PUT /api/products/:id ---');
  console.log('ID del producto:', req.params.id);
  console.log('Cuerpo de la petición (req.body):', JSON.stringify(req.body, null, 2));

  // Frontend envía 'stock' y 'price'. Los mapeamos a las columnas de la BD.
  const { name, sku, stock, price } = req.body;
  const status = req.body.status === 'Inactivo' ? 'Inactivo' : 'Activo';
  
  if (!name) {
    return res.status(400).json({ error: 'Product name is required.' });
  }

  const sql = `
    UPDATE products 
    SET 
      name = ?, 
      sku = ?, 
      status = ?, 
      current_stock = ?, 
      average_cost = ?, 
      updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now') 
    WHERE id = ?
  `;
  
  // Usamos los valores de 'stock' y 'price' y nos aseguramos de que no sean nulos.
  const params = [
    name, 
    sku, 
    status, 
    stock ?? 0, 
    price ?? 0, 
    req.params.id
  ];

  console.log('Executing SQL:', sql, 'with params:', params);
  db.run(sql, params, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product updated successfully' });
  });
});

app.delete('/api/products/:id', (req, res) => {
  console.log('--- INICIO DE PETICIÓN DELETE /api/products/:id ---');
  console.log('ID del producto:', req.params.id);
  
  db.run('DELETE FROM products WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Product not found' });
    res.status(204).send();
  });
});

// Helper to promisify db.run, db.get, db.all
const util = require('util');

// INVENTORY MOVEMENTS
app.post('/api/inventory/movements', async (req, res) => {
    const { product_id, type, quantity, unit_cost, description, date } = req.body;
    if (!product_id || !type || !quantity) {
        return res.status(400).json({ error: 'Missing required fields: product_id, type, quantity' });
    }

    if (type === 'ENTRADA' && (unit_cost === undefined || unit_cost === null)) {
        return res.status(400).json({ error: 'unit_cost is required for ENTRADA movements' });
    }

    const run = util.promisify(db.run.bind(db));
    const get = util.promisify(db.get.bind(db));

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

// PURCHASES (ENTRADA)
app.get('/api/purchases', (req, res) => {
    const query = `
        SELECT 
            im.id,
            im.date,
            p.name as productName,
            im.quantity,
            im.unit_cost,
            im.description
        FROM inventory_movements im
        JOIN products p ON im.product_id = p.id
        WHERE im.type = 'ENTRADA'
        ORDER BY im.date DESC;
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Calculate total_cost in JS for clarity and consistency.
        const purchases = rows.map(p => ({ 
            ...p, 
            total_cost: (p.quantity || 0) * (p.unit_cost || 0) 
        }));

        res.json(purchases);
    });
});

// SALES (SALIDA)
app.get('/api/sales', (req, res) => {
    const query = `
        SELECT 
            im.id,
            im.date,
            p.name as productName,
            im.quantity,
            im.unit_cost, -- This might be the sale price
            im.description
        FROM inventory_movements im
        JOIN products p ON im.product_id = p.id
        WHERE im.type = 'SALIDA'
        ORDER BY im.date DESC;
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        // Calculate total_revenue in JS for clarity and consistency.
        const sales = rows.map(s => ({ 
            ...s, 
            total_revenue: (s.quantity || 0) * (s.unit_cost || 0) 
        }));

        res.json(sales);
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
            WHERE im.type = ? AND date(im.date) BETWEEN ? AND ?
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
    const query = `
        SELECT
            (SELECT SUM(current_stock * average_cost) FROM products) as totalValue,
            (SELECT COUNT(*) FROM products) as productCount,
            (SELECT COUNT(*) FROM inventory_movements WHERE type = 'SALIDA' AND date >= date('now', '-30 days')) as salesCount
    `;
    db.get(query, (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        // Ensure backend handles nulls and provides a consistent structure.
        const summaryData = {
            totalRevenue: { value: row.totalValue || 0, change: 0 }, // Change placeholder
            sales: { value: row.salesCount || 0, change: 0 }, // Change placeholder
            totalProducts: { value: row.productCount || 0, change: 0 }, // Change placeholder
            newCustomers: { value: 0, change: 0 } // Not implemented yet
        };

        res.json(summaryData);
    });
});

app.get('/api/dashboard/recent-sales', (req, res) => {
    const sql = `
        SELECT
            im.id,
            p.name as productName,
            im.quantity,
            im.unit_cost,
            im.date
        FROM inventory_movements im
        JOIN products p ON im.product_id = p.id
        WHERE im.type = 'SALIDA'
        ORDER BY im.date DESC
        LIMIT 5
    `;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const salesData = rows.map(row => ({
            id: row.id.toString(),
            customerName: 'Venta de mostrador', // Generic placeholder
            customerEmail: '', // Keep it clean
            status: 'Completado', // Consistent status
            date: row.date,
            amount: row.quantity * (row.unit_cost || 0) // Handle possible null cost
        }));

        res.json(salesData);
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


// Server Initialization & Graceful Shutdown
let server;

const startServer = () => {
  server = app.listen(PORT, () => {
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
};

const shutdown = (signal) => {
  if (!isTestEnv) console.log(`\n${signal} received. Shutting down gracefully...`);
  
  server.close(() => {
    if (!isTestEnv) console.log('HTTP server closed.');
    
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        if (!isTestEnv) console.log('Database connection closed.');
      }
      process.exit(err ? 1 : 0);
    });
  });

  // Force shutdown after a timeout
  setTimeout(() => {
    if (!isTestEnv) console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000); // 10 seconds
};

// Listen for termination signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start the server
startServer();

module.exports = { app, db, startServer, shutdown };

