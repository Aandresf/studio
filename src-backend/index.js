const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { nanoid } = require('nanoid');
const { generateInventoryExcel } = require('./excel-generator.js');
const { subDays, formatISO } = require('date-fns');

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
    // La inicialización del esquema base se maneja en el script de inicio del servidor.
    // Las migraciones complejas se manejarán con scripts dedicados.
  }
});

// --- API Endpoints ---

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// PRODUCTS
app.get('/api/products', (req, res) => {
  console.log('--- INICIO DE PETICIÓN GET /api/products ---');
  console.log('Query params:', req.query);
  // 1. Obtenemos los datos con los nombres de columna originales.
  const sql = "SELECT id, name, sku, status, image, current_stock, average_cost, tax_rate FROM products ORDER BY id DESC";
  
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
      tax_rate: p.tax_rate,
      stock: p.current_stock, // Mapeo explícito
      price: p.average_cost   // Mapeo explícito
    }));
    
    res.json(products);
  });
});

app.post('/api/products', (req, res) => {
  // Frontend envía 'stock' y 'price'. Los mapeamos a las columnas de la BD.
  const { name, sku, stock = 0, price = 0, tax_rate = 16.00 } = req.body;
  const status = req.body.status === 'Inactivo' ? 'Inactivo' : 'Activo';

  if (!name) {
    return res.status(400).json({ error: 'Product name is required.' });
  }

  const sql = `INSERT INTO products (name, sku, status, current_stock, average_cost, tax_rate) VALUES (?, ?, ?, ?, ?, ?)`;
  // Usamos los valores de 'stock' y 'price' para las columnas correctas.
  db.run(sql, [name, sku, status, stock, price, tax_rate], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    
    // Devolvemos el objeto creado con la misma estructura que espera el frontend.
    res.status(201).json({ 
      id: this.lastID, 
      name,
      sku,
      status,
      stock,
      price,
      tax_rate
    });
  });
});

app.get('/api/products/:id', (req, res) => {
  console.log('--- INICIO DE PETICIÓN GET /api/products/:id ---');
  console.log('ID del producto:', req.params.id);
    const sql = `
      SELECT
        id, name, sku, status, image, tax_rate,
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
  const { name, sku, stock, price, tax_rate } = req.body;
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
      tax_rate = ?,
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
    tax_rate ?? 16.00,
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

app.get('/api/products/:id/movements', (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT * 
    FROM inventory_movements 
    WHERE product_id = ? AND status = 'Activo'
    ORDER BY transaction_date DESC
  `;
  db.all(sql, [id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Helper to promisify db.run, db.get, db.all
const util = require('util');

// INVENTORY MOVEMENTS
app.post('/api/inventory/movements', async (req, res) => {
    console.log('--- INICIO DE PETICIÓN POST /api/inventory/movements ---');
    console.log('Cuerpo recibido:', JSON.stringify(req.body, null, 2));
    
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

        const movementDate = new Date().toISOString();
        const movementSql = `INSERT INTO inventory_movements (product_id, type, quantity, unit_cost, description, transaction_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        await run(movementSql, [product_id, type, quantity, unit_cost, description, movementDate, movementDate]);

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

// PURCHASES (BATCH)
app.post('/api/purchases', async (req, res) => {
    console.log('--- INICIO DE PETICIÓN POST /api/purchases (NUEVA LÓGICA) ---');
    console.log('Cuerpo de la petición:', JSON.stringify(req.body, null, 2));

    const { transaction_date, entity_name, entity_document, document_number, items } = req.body;

    if (!transaction_date || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Faltan campos requeridos: transaction_date, items' });
    }

    const run = util.promisify(db.run.bind(db));
    const get = util.promisify(db.get.bind(db));
    const transactionId = nanoid(); // Genera un ID único para toda la transacción

    try {
        await run('BEGIN TRANSACTION');

        for (const item of items) {
            const { productId, quantity, unitCost, description } = item;

            if (!productId || !quantity || unitCost === undefined) {
                throw new Error('Cada item debe tener productId, quantity y unitCost.');
            }

            const product = await get('SELECT current_stock, average_cost FROM products WHERE id = ?', [productId]);
            if (!product) {
                throw new Error(`Producto con ID ${productId} no encontrado.`);
            }

            const new_stock = product.current_stock + quantity;
            const current_total_value = product.current_stock * product.average_cost;
            const entry_value = quantity * unitCost;
            const new_avg_cost = new_stock > 0 ? (current_total_value + entry_value) / new_stock : 0;

            const movementSql = `
                INSERT INTO inventory_movements 
                (product_id, transaction_id, transaction_date, entity_name, entity_document, document_number, type, quantity, unit_cost, description, status) 
                VALUES (?, ?, ?, ?, ?, ?, 'ENTRADA', ?, ?, ?, 'Activo')
            `;
            await run(movementSql, [productId, transactionId, transaction_date, entity_name, entity_document, document_number, quantity, unitCost, description]);

            const productSql = `UPDATE products SET current_stock = ?, average_cost = ?, updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now') WHERE id = ?`;
            await run(productSql, [new_stock, new_avg_cost, productId]);
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

app.put('/api/purchases', async (req, res) => {
    console.log('--- INICIO DE PETICIÓN PUT /api/purchases (EDITAR - NUEVA LÓGICA) ---');
    const { transaction_id, purchaseData } = req.body;

    if (!transaction_id || !purchaseData || !purchaseData.items) {
        return res.status(400).json({ error: 'Faltan datos para la edición: transaction_id y purchaseData son requeridos.' });
    }

    const run = util.promisify(db.run.bind(db));
    const all = util.promisify(db.all.bind(db));
    const get = util.promisify(db.get.bind(db));

    try {
        await run('BEGIN TRANSACTION');

        // 1. ANULACIÓN: Revertir los movimientos originales usando el transaction_id
        const originalMovements = await all(
            `SELECT * FROM inventory_movements WHERE transaction_id = ? AND status = 'Activo'`,
            [transaction_id]
        );

        if (originalMovements.length === 0) {
            throw new Error('No se encontraron movimientos activos para la transacción a editar.');
        }

        for (const move of originalMovements) {
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
            await run("UPDATE inventory_movements SET status = 'Reemplazado' WHERE id = ?", [move.id]);
        }

        // 2. RE-CREACIÓN: Crear los nuevos movimientos con el mismo transaction_id
        const { transaction_date, entity_name, entity_document, document_number, items } = purchaseData;

        for (const item of items) {
            const product = await get('SELECT current_stock, average_cost FROM products WHERE id = ?', [item.productId]);
            if (!product) throw new Error(`Producto con ID ${item.productId} no encontrado durante la re-creación.`);

            const new_stock = product.current_stock + item.quantity;
            const current_total_value = product.current_stock * product.average_cost;
            const entry_value = item.quantity * item.unitCost;
            const new_avg_cost = new_stock > 0 ? (current_total_value + entry_value) / new_stock : 0;

            await run(
                `INSERT INTO inventory_movements 
                (product_id, transaction_id, transaction_date, entity_name, entity_document, document_number, type, quantity, unit_cost, description, status) 
                VALUES (?, ?, ?, ?, ?, ?, 'ENTRADA', ?, ?, ?, 'Activo')`,
                [item.productId, transaction_id, transaction_date, entity_name, entity_document, document_number, item.quantity, item.unitCost, item.description]
            );
            await run('UPDATE products SET current_stock = ?, average_cost = ? WHERE id = ?', [new_stock, new_avg_cost, item.productId]);
        }

        await run('COMMIT');
        res.status(200).json({ message: 'Compra actualizada exitosamente' });

    } catch (err) {
        console.error('Error durante la transacción de edición:', err.message);
        try {
            await run('ROLLBACK');
            res.status(500).json({ error: `Error en la transacción: ${err.message}` });
        } catch (rollbackErr) {
            console.error('Fatal: No se pudo revertir la transacción', rollbackErr);
            res.status(500).json({ error: 'Error fatal en la base de datos durante el rollback.' });
        }
    }
});

app.delete('/api/purchases', async (req, res) => {
    console.log('--- INICIO DE PETICIÓN DELETE /api/purchases (ANULAR - NUEVA LÓGICA) ---');
    const { transaction_id } = req.body;

    if (!transaction_id) {
        return res.status(400).json({ error: 'Se requiere un transaction_id.' });
    }

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

// PURCHASES (ENTRADA) - OBTENER HISTORIAL
app.get('/api/purchases', (req, res) => {
    const query = `
        SELECT 
            im.id as movementId,
            p.id as productId,
            im.transaction_id,
            im.transaction_date,
            im.entity_name,
            im.entity_document,
            im.document_number,
            im.status,
            im.created_at,
            p.name as productName,
            im.quantity,
            im.unit_cost
        FROM inventory_movements im
        JOIN products p ON im.product_id = p.id
        WHERE im.type = 'ENTRADA'
        ORDER BY im.transaction_date DESC, im.transaction_id;
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const grouped = rows.reduce((acc, row) => {
            if (!acc[row.transaction_id]) {
                acc[row.transaction_id] = {
                    transaction_id: row.transaction_id,
                    transaction_date: row.transaction_date,
                    entity_name: row.entity_name,
                    entity_document: row.entity_document,
                    document_number: row.document_number,
                    status: 'Unknown', // Se determinará después
                    total_cost: 0,
                    movements: [],
                };
            }
            // Mapear explícitamente para asegurar la estructura del objeto
            const movement = {
                movementId: row.movementId,
                productId: row.productId,
                productName: row.productName,
                quantity: row.quantity,
                unit_cost: row.unit_cost,
                status: row.status,
                created_at: row.created_at
            };
            acc[row.transaction_id].movements.push(movement);
            return acc;
        }, {});

        // Post-procesamiento para determinar el estado final y filtrar los movimientos
        Object.values(grouped).forEach(transaction => {
            const active = transaction.movements.filter(m => m.status === 'Activo');
            const annulled = transaction.movements.filter(m => m.status === 'Anulado');

            if (active.length > 0) {
                transaction.status = 'Activo';
                transaction.movements = active;
            } else if (annulled.length > 0) {
                transaction.status = 'Anulado';
                transaction.movements = annulled;
            } else { // Solo quedan 'Reemplazado'
                transaction.status = 'Reemplazado';
                const lastDate = transaction.movements.reduce((max, m) => (m.created_at > max ? m.created_at : max), '');
                transaction.movements = transaction.movements.filter(m => m.created_at === lastDate);
            }

            // Recalcular el total basado solo en los movimientos filtrados
            transaction.total_cost = transaction.movements.reduce((sum, m) => sum + (m.quantity * m.unit_cost), 0);
        });

        res.json(Object.values(grouped));
    });
});

// GET PURCHASE DETAILS BY TRANSACTION ID
app.get('/api/purchases/details', (req, res) => {
    const transactionId = req.query.id;
    if (!transactionId) {
        return res.status(400).json({ error: 'Transaction ID is required' });
    }

    const sql = `
        SELECT
            im.product_id as productId,
            p.name as productName,
            im.quantity,
            im.unit_cost as unitCost,
            p.tax_rate,
            im.transaction_date,
            im.entity_name,
            im.entity_document,
            im.document_number,
            im.status
        FROM inventory_movements im
        JOIN products p ON im.product_id = p.id
        WHERE im.transaction_id = ? AND im.type = 'ENTRADA'
    `;
    db.all(sql, [transactionId], (err, allItems) => {
        if (err) return res.status(500).json({ error: err.message });
        if (allItems.length === 0) return res.status(404).json({ error: 'Compra no encontrada' });

        let itemsToShow = allItems.filter(item => item.status === 'Activo');
        
        if (itemsToShow.length === 0) {
            // If no active items, it's a historical view. Prioritize showing the annulled state.
            const annulledItems = allItems.filter(item => item.status === 'Anulado');
            if (annulledItems.length > 0) {
                itemsToShow = annulledItems;
            } else {
                // If not annulled, it must have been replaced. Show the most recent set of replaced items.
                const lastReplacedDate = allItems
                    .filter(item => item.status === 'Reemplazado')
                    .reduce((max, i) => (i.created_at > max ? i.created_at : max), allItems[0].created_at);
                
                itemsToShow = allItems.filter(item => item.status === 'Reemplazado' && item.created_at === lastReplacedDate);
            }
        }

        if (itemsToShow.length === 0) {
            return res.status(404).json({ error: 'No se encontraron items para esta transacción.' });
        }

        const firstItem = itemsToShow[0];
        
        const purchasePayload = {
            transaction_date: firstItem.transaction_date,
            entity_name: firstItem.entity_name,
            entity_document: firstItem.entity_document,
            document_number: firstItem.document_number,
            items: itemsToShow.map(i => ({
                productId: i.productId,
                quantity: i.quantity,
                unitCost: i.unitCost,
                tax_rate: i.tax_rate
            }))
        };

        res.json(purchasePayload);
    });
});


// SALES (SALIDA) - OBTENER HISTORIAL
app.get('/api/sales', (req, res) => {
    const query = `
        SELECT 
            im.id as movementId,
            p.id as productId,
            im.transaction_id,
            im.transaction_date,
            im.entity_name,
            im.entity_document,
            im.document_number,
            im.status,
            im.created_at,
            p.name as productName,
            im.quantity,
            im.price as unit_price -- Usamos la columna 'price' para el precio de venta
        FROM inventory_movements im
        JOIN products p ON im.product_id = p.id
        WHERE im.type = 'SALIDA'
        ORDER BY im.transaction_date DESC, im.transaction_id;
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

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
            // Mapear explícitamente para asegurar la estructura del objeto
            const movement = {
                movementId: row.movementId,
                productId: row.productId,
                productName: row.productName,
                quantity: row.quantity,
                unit_price: row.unit_price,
                status: row.status,
                created_at: row.created_at
            };
            acc[row.transaction_id].movements.push(movement);
            return acc;
        }, {});

        // Post-procesamiento para determinar el estado final y filtrar los movimientos
        Object.values(grouped).forEach(transaction => {
            const active = transaction.movements.filter(m => m.status === 'Activo');
            const annulled = transaction.movements.filter(m => m.status === 'Anulado');

            if (active.length > 0) {
                transaction.status = 'Activo';
                transaction.movements = active;
            } else if (annulled.length > 0) {
                transaction.status = 'Anulado';
                transaction.movements = annulled;
            } else { // Solo quedan 'Reemplazado'
                transaction.status = 'Reemplazado';
                const lastDate = transaction.movements.reduce((max, m) => (m.created_at > max ? m.created_at : max), '');
                transaction.movements = transaction.movements.filter(m => m.created_at === lastDate);
            }

            // Recalcular el total basado solo en los movimientos filtrados
            transaction.total = transaction.movements.reduce((sum, m) => sum + (m.quantity * m.unit_price), 0);
        });

        res.json(Object.values(grouped));
    });
});

// GET SALE DETAILS BY TRANSACTION ID
app.get('/api/sales/details', (req, res) => {
    const transactionId = req.query.id;
    if (!transactionId) {
        return res.status(400).json({ error: 'Transaction ID is required' });
    }

    const sql = `
        SELECT
            im.product_id as productId,
            p.name as productName,
            im.quantity,
            im.price as unitPrice,
            p.tax_rate,
            im.transaction_date,
            im.entity_name,
            im.entity_document,
            im.document_number,
            im.status
        FROM inventory_movements im
        JOIN products p ON im.product_id = p.id
        WHERE im.transaction_id = ? AND im.type = 'SALIDA'
    `;
    db.all(sql, [transactionId], (err, allItems) => {
        if (err) return res.status(500).json({ error: err.message });
        if (allItems.length === 0) return res.status(404).json({ error: 'Venta no encontrada' });

        let itemsToShow = allItems.filter(item => item.status === 'Activo');

        if (itemsToShow.length === 0) {
            const annulledItems = allItems.filter(item => item.status === 'Anulado');
            if (annulledItems.length > 0) {
                itemsToShow = annulledItems;
            } else {
                const lastReplacedDate = allItems
                    .filter(item => item.status === 'Reemplazado')
                    .reduce((max, i) => (i.created_at > max ? i.created_at : max), allItems[0].created_at);
                
                itemsToShow = allItems.filter(item => item.status === 'Reemplazado' && item.created_at === lastReplacedDate);
            }
        }

        if (itemsToShow.length === 0) {
            return res.status(404).json({ error: 'No se encontraron items para esta transacción.' });
        }

        const firstItem = itemsToShow[0];

        const salePayload = {
            transaction_date: firstItem.transaction_date,
            entity_name: firstItem.entity_name,
            entity_document: firstItem.entity_document,
            document_number: firstItem.document_number,
            items: itemsToShow.map(i => ({
                productId: i.productId,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                tax_rate: i.tax_rate
            }))
        };

        res.json(salePayload);
    });
});


// SALES (BATCH - NEW)
app.post('/api/sales', async (req, res) => {
    console.log('--- INICIO DE PETICIÓN POST /api/sales (NUEVA LÓGICA) ---');
    console.log('Cuerpo de la petición:', JSON.stringify(req.body, null, 2));

    const { transaction_date, entity_name, entity_document, document_number, items } = req.body;

    if (!transaction_date || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Faltan campos requeridos: transaction_date, items' });
    }

    const run = util.promisify(db.run.bind(db));
    const get = util.promisify(db.get.bind(db));
    const transactionId = nanoid();

    try {
        await run('BEGIN TRANSACTION');

        for (const item of items) {
            const { productId, quantity, unitPrice, description } = item;

            if (!productId || !quantity || unitPrice === undefined) {
                throw new Error('Cada item debe tener productId, quantity y unitPrice.');
            }

            const product = await get('SELECT current_stock FROM products WHERE id = ?', [productId]);
            if (!product) {
                throw new Error(`Producto con ID ${productId} no encontrado.`);
            }
            if (product.current_stock < quantity) {
                throw new Error(`Stock insuficiente para el producto ID ${productId}. Disponible: ${product.current_stock}, Requerido: ${quantity}`);
            }

            const new_stock = product.current_stock - quantity;

            const movementSql = `
                INSERT INTO inventory_movements 
                (product_id, transaction_id, transaction_date, entity_name, entity_document, document_number, type, quantity, price, description, status) 
                VALUES (?, ?, ?, ?, ?, ?, 'SALIDA', ?, ?, ?, 'Activo')
            `;
            await run(movementSql, [productId, transactionId, transaction_date, entity_name, entity_document, document_number, quantity, unitPrice, description]);

            const productSql = `UPDATE products SET current_stock = ?, updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now') WHERE id = ?`;
            await run(productSql, [new_stock, productId]);
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

app.put('/api/sales', async (req, res) => {
    console.log('--- INICIO DE PETICIÓN PUT /api/sales (EDITAR - NUEVA LÓGICA) ---');
    const { transaction_id, saleData } = req.body;

    if (!transaction_id || !saleData || !saleData.items) {
        return res.status(400).json({ error: 'Faltan datos para la edición: transaction_id y saleData son requeridos.' });
    }

    const run = util.promisify(db.run.bind(db));
    const all = util.promisify(db.all.bind(db));
    const get = util.promisify(db.get.bind(db));

    try {
        await run('BEGIN TRANSACTION');

        // 1. ANULACIÓN: Revertir el stock de los movimientos originales
        const originalMovements = await all(`SELECT * FROM inventory_movements WHERE transaction_id = ? AND status = 'Activo'`, [transaction_id]);

        if (originalMovements.length === 0) {
            throw new Error('No se encontraron movimientos de venta activos para editar.');
        }

        for (const move of originalMovements) {
            await run('UPDATE products SET current_stock = current_stock + ? WHERE id = ?', [move.quantity, move.product_id]);
            await run("UPDATE inventory_movements SET status = 'Reemplazado' WHERE id = ?", [move.id]);
        }

        // 2. RE-CREACIÓN: Crear los nuevos movimientos con el mismo transaction_id
        const { transaction_date, entity_name, entity_document, document_number, items } = saleData;

        for (const item of items) {
            const product = await get('SELECT current_stock FROM products WHERE id = ?', [item.productId]);
            if (!product) throw new Error(`Producto con ID ${item.productId} no encontrado.`);
            if (product.current_stock < item.quantity) throw new Error(`Stock insuficiente para el producto ID ${item.productId}.`);

            await run(
                `INSERT INTO inventory_movements 
                (product_id, transaction_id, transaction_date, entity_name, entity_document, document_number, type, quantity, price, description, status) 
                VALUES (?, ?, ?, ?, ?, ?, 'SALIDA', ?, ?, ?, 'Activo')`,
                [item.productId, transaction_id, transaction_date, entity_name, entity_document, document_number, item.quantity, item.unitPrice, item.description]
            );
            await run('UPDATE products SET current_stock = current_stock - ? WHERE id = ?', [item.quantity, item.productId]);
        }

        await run('COMMIT');
        res.status(200).json({ message: 'Venta actualizada exitosamente' });

    } catch (err) {
        console.error('Error durante la transacción de edición de venta:', err.message);
        await run('ROLLBACK');
        res.status(500).json({ error: `Error en la transacción: ${err.message}` });
    }
});

app.delete('/api/sales', async (req, res) => {
    console.log('--- INICIO DE PETICIÓN DELETE /api/sales (ANULAR - NUEVA LÓGICA) ---');
    const { transaction_id } = req.body;

    if (!transaction_id) {
        return res.status(400).json({ error: 'Se requiere un transaction_id.' });
    }

    const run = util.promisify(db.run.bind(db));
    const all = util.promisify(db.all.bind(db));

    try {
        await run('BEGIN TRANSACTION');

        const movementsToAnnul = await all(`SELECT * FROM inventory_movements WHERE transaction_id = ? AND status = 'Activo'`, [transaction_id]);

        if (movementsToAnnul.length === 0) {
            throw new Error('No se encontraron movimientos de venta activos para anular.');
        }

        for (const move of movementsToAnnul) {
            // Revertir el stock es sumar la cantidad que se vendió
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


// REPORTS
app.post('/api/reports/inventory-excel', async (req, res) => {
    const { startDate, endDate } = req.body;
    console.log(`--- Solicitud de Reporte Excel de Inventario para ${startDate} a ${endDate} ---`);

    const get = util.promisify(db.get.bind(db));
    const all = util.promisify(db.all.bind(db));

    try {
        // 1. Obtener detalles de la tienda
        const storeDetails = await new Promise((resolve, reject) => {
            fs.readFile(path.join(__dirname, 'settings.json'), 'utf8', (err, data) => {
                if (err) {
                    if (err.code === 'ENOENT') return resolve({ name: "MI TIENDA", rif: "J-000000000" });
                    return reject(err);
                }
                resolve(JSON.parse(data));
            });
        });

        // 2. Obtener todos los productos
        const products = await all("SELECT id, name, sku FROM products");

        let inventoryData = [];

        // 3. Para cada producto, calcular los datos del reporte
        for (const product of products) {
            // Existencia al inicio del período
            const initialStockResult = await get(
                `SELECT 
                    SUM(CASE WHEN type = 'ENTRADA' THEN quantity ELSE -quantity END) as stock
                 FROM inventory_movements 
                 WHERE product_id = ? AND date(transaction_date) < ?`,
                [product.id, startDate]
            );
            const existenciaAnterior = initialStockResult?.stock || 0;

            // Movimientos dentro del período
            const movements = await all(
                `SELECT type, quantity, unit_cost FROM inventory_movements WHERE product_id = ? AND date(transaction_date) BETWEEN ? AND ?`,
                [product.id, startDate, endDate]
            );

            const entradas = movements.filter(m => m.type === 'ENTRADA').reduce((sum, m) => sum + m.quantity, 0);
            const salidas = movements.filter(m => m.type === 'SALIDA').reduce((sum, m) => sum + m.quantity, 0);
            const retiros = movements.filter(m => m.type === 'RETIRO').reduce((sum, m) => sum + m.quantity, 0);
            const autoconsumo = movements.filter(m => m.type === 'AUTO-CONSUMO').reduce((sum, m) => sum + m.quantity, 0);
            
            const existenciaActual = existenciaAnterior + entradas - salidas - retiros - autoconsumo;

            // TODO: La lógica de valoración (costos) es compleja y se puede añadir después.
            // Por ahora, usamos placeholders.
            const valorUnitarioAnterior = 0;
            const valorUnitarioActual = 0;
            const valorPromedio = 0;

            inventoryData.push({
                code: product.sku || `P-${product.id}`,
                description: product.name,
                existenciaAnterior,
                entradas,
                salidas,
                retiros,
                autoconsumo,
                existenciaActual,
                valorUnitarioAnterior,
                valorUnitarioActual,
                valorPromedio
            });
        }

        // 4. Llamar al generador de Excel
        await generateInventoryExcel(res, storeDetails, inventoryData, startDate, endDate);

    } catch (error) {
        console.error('Error durante la obtención de datos para el reporte de Excel:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Error interno al obtener los datos para el reporte.' });
        }
    }
});


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
            WHERE im.type = ? AND date(im.transaction_date) BETWEEN ? AND ?
            ORDER BY im.transaction_date
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
            WHERE im.transaction_date BETWEEN ? AND ?
            ORDER BY p.name, im.transaction_date
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
app.get('/api/dashboard/summary', async (req, res) => {
    const get = util.promisify(db.get.bind(db));

    try {
        const now = new Date();
        const thirtyDaysAgo = formatISO(subDays(now, 30));
        const sixtyDaysAgo = formatISO(subDays(now, 60));

        const salesQuery = `
            SELECT
                SUM(CASE WHEN transaction_date >= ? THEN quantity * price ELSE 0 END) as currentRevenue,
                COUNT(CASE WHEN transaction_date >= ? THEN 1 ELSE NULL END) as currentSalesCount,
                SUM(CASE WHEN transaction_date >= ? AND transaction_date < ? THEN quantity * price ELSE 0 END) as previousRevenue,
                COUNT(CASE WHEN transaction_date >= ? AND transaction_date < ? THEN 1 ELSE NULL END) as previousSalesCount
            FROM inventory_movements
            WHERE type = 'SALIDA' AND status = 'Activo' AND transaction_date >= ?
        `;

        const productQuery = `
            SELECT
                COUNT(*) as totalProducts
            FROM products
            WHERE status = 'Activo'
        `;

        const salesData = await get(salesQuery, [thirtyDaysAgo, thirtyDaysAgo, sixtyDaysAgo, thirtyDaysAgo, sixtyDaysAgo, thirtyDaysAgo, sixtyDaysAgo]);
        const productData = await get(productQuery);

        const calculateChange = (current, previous) => {
            if (previous === 0) {
                return current > 0 ? 100.0 : 0.0;
            }
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
                change: 0 // Not implemented yet
            },
            newCustomers: {
                value: 0, // Not implemented yet
                change: 0
            }
        };

        res.json(summary);

    } catch (err) {
        console.error("Error fetching dashboard summary:", err);
        res.status(500).json({ error: "Failed to fetch dashboard summary" });
    }
});


app.get('/api/dashboard/recent-sales', (req, res) => {
    const sql = `
        SELECT
            transaction_id as id,
            SUM(im.quantity * im.price) as amount,
            MAX(im.transaction_date) as date,
            entity_name as customerName
        FROM inventory_movements im
        WHERE im.type = 'SALIDA' AND im.status = 'Activo'
        GROUP BY transaction_id
        ORDER BY date DESC
        LIMIT 5
    `;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const salesData = rows.map(row => ({
            id: row.id,
            customerName: row.customerName || 'Venta de mostrador',
            customerEmail: '',
            status: 'Completado',
            date: row.date,
            amount: row.amount || 0
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