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



const { dataDir, schemaPath } = require('./config');
const databaseManager = require('./database-manager');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API de Gestión de Tiendas ---

app.get('/api/stores', (req, res) => {
    try {
        const config = databaseManager.getStoresConfig();
        const activeStores = config.stores.filter(s => s.status === 'active' || s.status === undefined);
        res.json({ ...config, stores: activeStores });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/stores/:id', (req, res) => {
    const { id } = req.params;
    try {
        const config = databaseManager.getStoresConfig();
        const storeIndex = config.stores.findIndex(s => s.id === id);

        if (storeIndex === -1) {
            return res.status(404).json({ error: 'Tienda no encontrada.' });
        }
        if (config.stores.filter(s => s.status === 'active').length <= 1) {
            return res.status(400).json({ error: 'No puedes eliminar la única tienda activa.' });
        }

        config.stores[storeIndex].status = 'deleted';
        config.stores[storeIndex].deletion_date = new Date().toISOString();

        if (config.activeStoreId === id) {
            const nextActiveStore = config.stores.find(s => s.status === 'active');
            config.activeStoreId = nextActiveStore.id;
        }

        databaseManager.saveStoresConfig(config);
        res.json({ message: 'Tienda marcada para eliminación.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.post('/api/stores/active', (req, res) => {
    const { storeId } = req.body;
    if (!storeId) {
        return res.status(400).json({ error: 'Se requiere el ID de la tienda (storeId).' });
    }
    try {
        databaseManager.setActiveStore(storeId);
        res.json({ message: `Tienda activa cambiada a ${storeId}` });
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

app.post('/api/stores', async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Se requiere un nombre para la nueva tienda.' });
    }

    const newId = name.toLowerCase().replace(/\s+/g, '_') + `_${nanoid(4)}`;
    const newDbPath = path.join(dataDir, `database_${newId}.db`);

    try {
        await new Promise((resolve, reject) => {
            const newDb = new sqlite3.Database(newDbPath, (err) => {
                if (err) return reject(err);
                
                const sqlSetup = fs.readFileSync(schemaPath, 'utf8');
                newDb.exec(sqlSetup, (execErr) => {
                    newDb.close();
                    if (execErr) return reject(execErr);
                    resolve();
                });
            });
        });

        const newStore = { 
            id: newId, 
            name, 
            dbPath: `database_${newId}.db`,
            status: 'active', 
            deletion_date: null 
        };
        databaseManager.addStore(newStore);
        res.status(201).json(newStore);

    } catch (error) {
        if (fs.existsSync(newDbPath)) fs.unlinkSync(newDbPath);
        res.status(500).json({ error: `Error al crear la tienda: ${error.message}` });
    }
});

app.get('/api/stores/:id/details', (req, res) => {
    const { id } = req.params;
    const settingsPath = path.join(dataDir, `database_${id}_settings.json`);
    if (fs.existsSync(settingsPath)) {
        const settings = fs.readFileSync(settingsPath, 'utf8');
        res.json(JSON.parse(settings));
    } else {
        res.json({});
    }
});

app.put('/api/stores/:id/details', (req, res) => {
    const { id } = req.params;
    const settingsPath = path.join(dataDir, `database_${id}_settings.json`);
    try {
        fs.writeFileSync(settingsPath, JSON.stringify(req.body, null, 2));
        res.json({ message: 'Detalles de la tienda actualizados correctamente.' });
    } catch (error) {
        res.status(500).json({ error: `Error al guardar los detalles: ${error.message}` });
    }
});


// --- API Endpoints (Refactorizados) ---

const PENDING_TRANSACTIONS_FILE = path.join(dataDir, 'pending_transactions.json');

// Helper para leer transacciones pendientes
const readPendingTransactions = () => {
    if (!fs.existsSync(PENDING_TRANSACTIONS_FILE)) {
        return { sales: [], purchases: [] };
    }
    const data = fs.readFileSync(PENDING_TRANSACTIONS_FILE, 'utf8');
    return JSON.parse(data);
};

// Helper para escribir transacciones pendientes
const writePendingTransactions = (data) => {
    fs.writeFileSync(PENDING_TRANSACTIONS_FILE, JSON.stringify(data, null, 2));
};

app.get('/api/pending-transactions', (req, res) => {
    const data = readPendingTransactions();
    res.json(data);
});

app.post('/api/pending-transactions', (req, res) => {
    const { type, payload } = req.body; // type es 'sale' o 'purchase'
    if (!type || !payload || !['sale', 'purchase'].includes(type)) {
        return res.status(400).json({ error: 'Tipo de transacción o payload inválido.' });
    }
    
    const data = readPendingTransactions();
    if (type === 'sale') {
        data.sales.push(payload);
    } else {
        data.purchases.push(payload);
    }
    
    writePendingTransactions(data);
    res.status(201).json(payload);
});

app.delete('/api/pending-transactions/:id', (req, res) => {
    const { id } = req.params;
    const data = readPendingTransactions();
    
    // Filtrar ambos arrays para eliminar el ID
    const initialSalesCount = data.sales.length;
    const initialPurchasesCount = data.purchases.length;

    data.sales = data.sales.filter(s => s.id !== id);
    data.purchases = data.purchases.filter(p => p.id !== id);

    const wasDeleted = data.sales.length < initialSalesCount || data.purchases.length < initialPurchasesCount;

    if (wasDeleted) {
        writePendingTransactions(data);
        res.status(200).json({ message: 'Transacción pendiente eliminada.' });
    } else {
        res.status(404).json({ error: 'No se encontró la transacción pendiente.' });
    }
});


app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.post('/api/app/quit', (req, res) => {
    console.log('Solicitud de cierre de la aplicación recibida. Terminando proceso...');
    res.status(200).json({ message: 'Cerrando el servidor.' });
    // Da un pequeño margen para que la respuesta se envíe antes de cerrar.
    setTimeout(() => {
        process.exit(0);
    }, 500);
});



// PRODUCTS
app.get('/api/products', async (req, res) => {
  console.log('--- INICIO DE PETICIÓN GET /api/products ---');
  try {
    const db = databaseManager.getActiveDb();
    const dbAll = util.promisify(db.all.bind(db));
    
    const sql = "SELECT id, name, sku, status, image, description, current_stock, average_cost, tax_rate FROM products ORDER BY id DESC";
    const rows = await dbAll(sql, []);

    const products = rows.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      status: p.status,
      image: p.image,
      description: p.description,
      tax_rate: p.tax_rate,
      stock: p.current_stock,
      price: p.average_cost
    }));
    
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products', (req, res) => {
  const { name, sku, description, stock = 0, price = 0, tax_rate = 16.00 } = req.body;
  const status = req.body.status === 'Inactivo' ? 'Inactivo' : 'Activo';

  if (!name) {
    return res.status(400).json({ error: 'Product name is required.' });
  }

  try {
    const db = databaseManager.getActiveDb();
    const sql = `INSERT INTO products (name, sku, description, status, current_stock, average_cost, tax_rate) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    db.run(sql, [name, sku, description || '', status, stock, price, tax_rate], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ 
        id: this.lastID,
        name,
        sku,
        description: description || '',
        status,
        stock,
        price,
        tax_rate
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const db = databaseManager.getActiveDb();
    const dbGet = util.promisify(db.get.bind(db));
    const sql = `
      SELECT
        id, name, sku, description, status, image, tax_rate,
        current_stock as stock,
        average_cost as price
      FROM products
      WHERE id = ?
    `;
    const row = await dbGet(sql, [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Product not found' });
    res.json(row);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/products/:id', (req, res) => {
  const { name, sku, description, stock, price, tax_rate } = req.body;
  const status = req.body.status === 'Inactivo' ? 'Inactivo' : 'Activo';
  
  if (!name) {
    return res.status(400).json({ error: 'Product name is required.' });
  }

  try {
    const db = databaseManager.getActiveDb();
    const sql = `
      UPDATE products 
      SET 
        name = ?, 
        sku = ?, 
        description = ?,
        status = ?, 
        current_stock = ?, 
        average_cost = ?, 
        tax_rate = ?,
        updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now') 
      WHERE id = ?
    `;
    const params = [name, sku, description || '', status, stock ?? 0, price ?? 0, tax_rate ?? 16.00, req.params.id];
    
    db.run(sql, params, function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json({ message: 'Product updated successfully' });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/products/:id', (req, res) => {
  try {
    const db = databaseManager.getActiveDb();
    db.run('DELETE FROM products WHERE id = ?', [req.params.id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.status(204).send();
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products/:id/movements', async (req, res) => {
  const { id } = req.params;
  try {
    const db = databaseManager.getActiveDb();
    const dbAll = util.promisify(db.all.bind(db));
    const sql = `
      SELECT * 
      FROM inventory_movements 
      WHERE product_id = ? AND status = 'Activo'
      ORDER BY transaction_date DESC
    `;
    const rows = await dbAll(sql, [id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper to promisify db.run, db.get, db.all
const util = require('util');

// Helper para generar números de documento automáticos
async function getNextDocumentNumber(db, type) {
    const run = util.promisify(db.run.bind(db));
    const get = util.promisify(db.get.bind(db));
    
    await run('BEGIN TRANSACTION');
    try {
        let counter = await get('SELECT last_number FROM document_counters WHERE counter_type = ?', [type]);
        
        if (!counter) {
            await run('INSERT INTO document_counters (counter_type, last_number) VALUES (?, 0)', [type]);
            counter = { last_number: 0 };
        }

        const newNumber = counter.last_number + 1;
        await run('UPDATE document_counters SET last_number = ? WHERE counter_type = ?', [newNumber, type]);
        await run('COMMIT');
        
        return `FAC-AUTO-${String(newNumber).padStart(5, '0')}`;
    } catch (error) {
        await run('ROLLBACK');
        throw error;
    }
}


// INVENTORY MOVEMENTS
app.post('/api/inventory/movements', async (req, res) => {
    const { product_id, type, quantity, unit_cost, description, date } = req.body;
    if (!product_id || !type || !quantity) {
        return res.status(400).json({ error: 'Missing required fields: product_id, type, quantity' });
    }

    if (type === 'ENTRADA' && (unit_cost === undefined || unit_cost === null)) {
        return res.status(400).json({ error: 'unit_cost is required for ENTRADA movements' });
    }

    const db = databaseManager.getActiveDb();
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
    const { transaction_id, purchaseData } = req.body;

    if (!transaction_id || !purchaseData || !purchaseData.items) {
        return res.status(400).json({ error: 'Faltan datos para la edición: transaction_id y purchaseData son requeridos.' });
    }

    const db = databaseManager.getActiveDb();
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

app.get('/api/purchases', async (req, res) => {
    try {
        const db = databaseManager.getActiveDb();
        const dbAll = util.promisify(db.all.bind(db));
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
        const rows = await dbAll(query, []);
        
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
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/purchases/details', async (req, res) => {
    const transactionId = req.query.id;
    if (!transactionId) {
        return res.status(400).json({ error: 'Transaction ID is required' });
    }

    try {
        const db = databaseManager.getActiveDb();
        const dbAll = util.promisify(db.all.bind(db));
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
            im.status,
            im.created_at
        FROM inventory_movements im
        JOIN products p ON im.product_id = p.id
        WHERE im.transaction_id = ? AND im.type = 'ENTRADA'
    `;
        const allItems = await dbAll(sql, [transactionId]);
        if (allItems.length === 0) return res.status(404).json({ error: 'Compra no encontrada' });

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
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.get('/api/sales', async (req, res) => {
    try {
        const db = databaseManager.getActiveDb();
        const dbAll = util.promisify(db.all.bind(db));
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
            im.price as unit_price
        FROM inventory_movements im
        JOIN products p ON im.product_id = p.id
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

        Object.values(grouped).forEach(transaction => {
            const active = transaction.movements.filter(m => m.status === 'Activo');
            const annulled = transaction.movements.filter(m => m.status === 'Anulado');

            if (active.length > 0) {
                transaction.status = 'Activo';
                transaction.movements = active;
            } else if (annulled.length > 0) {
                transaction.status = 'Anulado';
                transaction.movements = annulled;
            } else {
                const lastDate = transaction.movements.reduce((max, m) => (m.created_at > max ? m.created_at : max), '');
                transaction.movements = transaction.movements.filter(m => m.created_at === lastDate);
                transaction.status = 'Reemplazado';
            }
            transaction.total = transaction.movements.reduce((sum, m) => sum + (m.quantity * m.unit_price), 0);
        });

        res.json(Object.values(grouped));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/sales/details', async (req, res) => {
    const transactionId = req.query.id;
    if (!transactionId) {
        return res.status(400).json({ error: 'Transaction ID is required' });
    }

    try {
        const db = databaseManager.getActiveDb();
        const dbAll = util.promisify(db.all.bind(db));
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
            im.status,
            im.created_at
        FROM inventory_movements im
        JOIN products p ON im.product_id = p.id
        WHERE im.transaction_id = ? AND im.type = 'SALIDA'
    `;
        const allItems = await dbAll(sql, [transactionId]);
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
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.post('/api/sales', async (req, res) => {
    const { transaction_date, entity_document, items } = req.body;
    let { document_number, entity_name } = req.body;

    // Si no hay nombre de entidad, asignar uno por defecto.
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
            const { productId, quantity, unitPrice, description } = item;

            if (!productId || !quantity || unitPrice === undefined) {
                throw new Error('Cada item debe tener productId, quantity y unitPrice.');
            }

            const product = await get('SELECT current_stock, average_cost FROM products WHERE id = ?', [productId]);
            if (!product) {
                throw new Error(`Producto con ID ${productId} no encontrado.`);
            }

            if (!settings.advanced?.allowNegativeStock && product.current_stock < quantity) {
                throw new Error(`Stock insuficiente para el producto ID ${productId}. Disponible: ${product.current_stock}, Requerido: ${quantity}`);
            }
            if (!settings.advanced?.allowSellBelowCost && unitPrice < product.average_cost) {
                throw new Error(`El precio de venta del producto ID ${productId} (${unitPrice}) no puede ser inferior a su costo (${product.average_cost}).`);
            }

            const new_stock = product.current_stock - quantity;

            const movementSql = `
                INSERT INTO inventory_movements 
                (product_id, transaction_id, transaction_date, entity_name, entity_document, document_number, type, quantity, unit_cost, price, description, status) 
                VALUES (?, ?, ?, ?, ?, ?, 'SALIDA', ?, ?, ?, ?, 'Activo')
            `;
            await run(movementSql, [productId, transactionId, transaction_date, entity_name, entity_document, document_number, quantity, product.average_cost, unitPrice, description]);

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
    const { transaction_id, saleData } = req.body;

    if (!transaction_id || !saleData || !saleData.items) {
        return res.status(400).json({ error: 'Faltan datos para la edición: transaction_id y saleData son requeridos.' });
    }

    const db = databaseManager.getActiveDb();
    const run = util.promisify(db.run.bind(db));
    const all = util.promisify(db.all.bind(db));
    const get = util.promisify(db.get.bind(db));

    try {
        await run('BEGIN TRANSACTION');

        // --- Obtener configuración de la tienda ---
        const activeStoreId = databaseManager.getStoresConfig().activeStoreId;
        const settingsPath = path.join(dataDir, `database_${activeStoreId}_settings.json`);
        let settings = { advanced: {} }; // Default settings
        if (fs.existsSync(settingsPath)) {
            settings = { ...settings, ...JSON.parse(fs.readFileSync(settingsPath, 'utf8')) };
        }
        // --- Fin de obtener configuración ---

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
        const { transaction_date, entity_document, document_number, items } = saleData;
        const entity_name = saleData.entity_name || 'Cliente General';

        for (const item of items) {
            const product = await get('SELECT current_stock, average_cost FROM products WHERE id = ?', [item.productId]);
            if (!product) throw new Error(`Producto con ID ${item.productId} no encontrado.`);
            
            // --- Validaciones Condicionales ---
            if (!settings.advanced?.allowNegativeStock && product.current_stock < item.quantity) {
                throw new Error(`Stock insuficiente para el producto ID ${item.productId}.`);
            }
            if (!settings.advanced?.allowSellBelowCost && item.unitPrice < product.average_cost) {
                throw new Error(`El precio de venta del producto ID ${item.productId} (${item.unitPrice}) no puede ser inferior a su costo (${product.average_cost}).`);
            }
            // --- Fin de Validaciones ---

            await run(
                `INSERT INTO inventory_movements 
                (product_id, transaction_id, transaction_date, entity_name, entity_document, document_number, type, quantity, unit_cost, price, description, status) 
                VALUES (?, ?, ?, ?, ?, ?, 'SALIDA', ?, ?, ?, ?, 'Activo')`,
                [item.productId, transaction_id, transaction_date, entity_name, entity_document, document_number, item.quantity, product.average_cost, item.unitPrice, item.description]
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


app.post('/api/reports/inventory-excel', async (req, res) => {
    const { startDate, endDate } = req.body;
    
    try {
        const db = databaseManager.getActiveDb();
        const get = util.promisify(db.get.bind(db));
        const all = util.promisify(db.all.bind(db));

        const activeStoreId = databaseManager.getStoresConfig().activeStoreId;
        const settingsPath = path.join(dataDir, `database_${activeStoreId}_settings.json`);
        
        let storeDetails = { name: "MI TIENDA", rif: "J-000000000" }; // Valores por defecto
        if (fs.existsSync(settingsPath)) {
            const savedSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            // Los datos guardados tienen prioridad sobre los valores por defecto.
            storeDetails = { ...storeDetails, ...savedSettings };
        }

        const products = await all("SELECT id, name, sku FROM products");
        let inventoryData = [];

        for (const product of products) {
            // 1. Obtener estado inicial (existencia y costo) antes del período, considerando solo movimientos activos
            const initialState = await get(
                `SELECT 
                    SUM(CASE WHEN type = 'ENTRADA' THEN quantity ELSE -quantity END) as initialStock,
                    (SELECT average_cost FROM products WHERE id = ?) as initialAvgCost
                 FROM inventory_movements 
                 WHERE product_id = ? AND status = 'Activo' AND date(transaction_date) < ?`,
                [product.id, product.id, startDate]
            );

            let existenciaAnterior = initialState?.initialStock || 0;
            let costoPromedioActual = initialState?.initialAvgCost || 0;

            // 2. Obtener todos los movimientos ACTIVOS DENTRO del período, ordenados por fecha
            const movements = await all(
                `SELECT type, quantity, unit_cost, price, transaction_date 
                 FROM inventory_movements 
                 WHERE product_id = ? AND status = 'Activo' AND date(transaction_date) BETWEEN ? AND ?
                 ORDER BY transaction_date ASC`,
                [product.id, startDate, endDate]
            );

            let totalEntradasUnidades = 0;
            let totalSalidasUnidades = 0;
            let totalRetirosUnidades = 0;
            let totalAutoconsumoUnidades = 0;
            
            let valorEntradas = 0;
            let valorSalidas = 0;
            let valorRetiros = 0;
            let valorAutoconsumo = 0;

            // 3. Iterar cronológicamente para calcular valores y costos correctos
            for (const move of movements) {
                if (move.type === 'ENTRADA') {
                    const valorTotalAnterior = existenciaAnterior * costoPromedioActual;
                    const valorEntradaActual = move.quantity * move.unit_cost;
                    
                    existenciaAnterior += move.quantity;
                    costoPromedioActual = existenciaAnterior > 0 ? (valorTotalAnterior + valorEntradaActual) / existenciaAnterior : 0;
                    
                    totalEntradasUnidades += move.quantity;
                    valorEntradas += valorEntradaActual;
                } else {
                    // Para cualquier tipo de SALIDA, se valora al costo promedio del momento
                    const valorSalida = move.quantity * costoPromedioActual;
                    existenciaAnterior -= move.quantity;

                    if (move.type === 'SALIDA') {
                        totalSalidasUnidades += move.quantity;
                        valorSalidas += valorSalida;
                    } else if (move.type === 'RETIRO') {
                        totalRetirosUnidades += move.quantity;
                        valorRetiros += valorSalida;
                    } else if (move.type === 'AUTO-CONSUMO') {
                        totalAutoconsumoUnidades += move.quantity;
                        valorAutoconsumo += valorSalida;
                    }
                }
            }

            const valorExistenciaAnterior = (initialState?.initialStock || 0) * (initialState?.initialAvgCost || 0);
            
            // La existencia final es el valor de `existenciaAnterior` después de todas las iteraciones.
            const existenciaActual = existenciaAnterior; 
            const valorExistenciaActual = existenciaActual * costoPromedioActual;

            inventoryData.push({
                code: product.sku || `P-${product.id}`,
                description: product.name,
                existenciaAnterior: initialState?.initialStock || 0,
                entradas: totalEntradasUnidades,
                salidas: totalSalidasUnidades,
                retiros: totalRetirosUnidades,
                autoconsumo: totalAutoconsumoUnidades,
                existenciaActual,
                valorUnitarioAnterior: initialState?.initialAvgCost || 0,
                valorExistenciaAnterior,
                valorEntradas,
                valorSalidas,
                valorRetiros,
                valorAutoconsumo,
                valorUnitarioActual: costoPromedioActual,
                valorExistenciaActual,
                valorPromedio: (totalEntradasUnidades > 0) ? (valorEntradas / totalEntradasUnidades) : (initialState?.initialAvgCost || 0)
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


app.post('/api/reports/:type', async (req, res) => {
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
            SELECT p.name, p.sku, im.*
            FROM inventory_movements im
            JOIN products p ON im.product_id = p.id
            WHERE im.type = ? AND date(im.transaction_date) BETWEEN ? AND ?
            ORDER BY im.transaction_date
        `;
            const rows = await dbAll(query, [movementType, startDate, endDate]);
            res.json(rows);
        } else if (reportType === 'INVENTORY') {
            query = `
            SELECT p.name, p.sku, im.*
            FROM inventory_movements im
            JOIN products p ON im.product_id = p.id
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

app.get('/api/reports', async (req, res) => {
    try {
        const db = databaseManager.getActiveDb();
        const dbAll = util.promisify(db.all.bind(db));
        const rows = await dbAll('SELECT * FROM inventory_reports ORDER BY generated_at DESC', []);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.get('/api/dashboard/summary', async (req, res) => {
    try {
        const config = databaseManager.getStoresConfig();
        if (!config.activeStoreId) {
            // Si no hay tienda activa, devolver valores por defecto.
            return res.json({
                totalRevenue: { value: 0, change: 0 },
                sales: { value: 0, change: 0 },
                totalProducts: { value: 0, change: 0 },
                newCustomers: { value: 0, change: 0 }
            });
        }
        const db = databaseManager.getActiveDb();
        const get = util.promisify(db.get.bind(db));

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


app.get('/api/dashboard/recent-sales', async (req, res) => {
    try {
        const config = databaseManager.getStoresConfig();
        if (!config.activeStoreId) {
            return res.json([]); // Si no hay tienda, devolver un array vacío
        }
        const db = databaseManager.getActiveDb();
        const dbAll = util.promisify(db.all.bind(db));
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
        const rows = await dbAll(sql, []);

        const salesData = rows.map(row => ({
            id: row.id,
            customerName: row.customerName || 'Venta de mostrador',
            customerEmail: '',
            status: 'Completado',
            date: row.date,
            amount: row.amount || 0
        }));

        res.json(salesData);
    } catch (error) {
        res.status(500).json({ error: error.message });
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


// Server Initialization & Graceful Shutdown
let server;

const startServer = () => {
  server = app.listen(PORT, () => {
    if (!isTestEnv) {
      console.log(`Backend server listening on http://localhost:${PORT}`);
      
      try {
        const db = databaseManager.getActiveDb();
        db.serialize(() => {
          const sqlSetup = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
          db.exec(sqlSetup, (err) => {
            if (err && !err.message.includes('already exists')) {
              console.error('Error ejecutando schema.sql:', err.message);
            } else if (!isTestEnv) {
              console.log('Esquema de base de datos verificado/inicializado.');
            }
          });

          db.run(`
            CREATE TABLE IF NOT EXISTS document_counters (
              counter_type TEXT PRIMARY KEY,
              last_number INTEGER NOT NULL DEFAULT 0
            );
          `, (err) => {
            if (err) {
              console.error("Error creando la tabla document_counters:", err.message);
              return;
            }
            db.run("INSERT OR IGNORE INTO document_counters (counter_type, last_number) VALUES ('AUTO_PURCHASE', 0);");
            db.run("INSERT OR IGNORE INTO document_counters (counter_type, last_number) VALUES ('AUTO_SALE', 0);");
          });
        });
      } catch (error) {
        if (error.message.includes("No hay una tienda activa seleccionada")) {
            console.log("No hay tienda activa. Esperando la creación de la primera tienda desde la interfaz.");
        } else {
            console.error("Error fatal al inicializar la base de datos activa:", error.message);
            process.exit(1);
        }
      }
    }
  });
};

const shutdown = (signal) => {
  if (!isTestEnv) console.log(`\n${signal} received. Shutting down gracefully...`);
  
  server.close(() => {
    if (!isTestEnv) console.log('HTTP server closed.');
    databaseManager.closeAllConnections();
    // Dar un pequeño margen para que las conexiones se cierren
    setTimeout(() => process.exit(0), 500);
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

module.exports = { app, startServer, shutdown };