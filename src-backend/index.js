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
  console.log('--- INICIO DE PETICIÓN GET /api/products (con variantes) ---');
  try {
    const db = databaseManager.getActiveDb();
    const dbAll = util.promisify(db.all.bind(db));
    
    // 1. Obtener todos los productos base
    const productsSql = `
      SELECT p.*, b.name as brand_name 
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      ORDER BY p.id DESC
    `;
    const products = await dbAll(productsSql, []);

    // 2. Obtener todas las variantes y agruparlas por product_id
    const variantsSql = `SELECT * FROM product_variants`;
    const allVariants = await dbAll(variantsSql, []);
    
    // 3. Obtener todas las relaciones variante-atributo-valor
    const variantAttrsSql = `
      SELECT 
        vav.variant_id, 
        av.id as attribute_value_id, 
        av.value, 
        a.id as attribute_id, 
        a.name as attribute_name
      FROM variant_attribute_values vav
      JOIN attribute_values av ON vav.attribute_value_id = av.id
      JOIN attributes a ON av.attribute_id = a.id
    `;
    const allVariantAttrs = await dbAll(variantAttrsSql, []);

    // 4. Mapear los atributos a sus variantes
    const variantsWithAttrs = allVariants.map(variant => {
      const attributes = allVariantAttrs
        .filter(attr => attr.variant_id === variant.id)
        .map(attr => ({
          id: attr.attribute_value_id,
          value: attr.value,
          attribute_id: attr.attribute_id,
          attribute_name: attr.attribute_name
        }));
      return { ...variant, attribute_values: attributes };
    });

    // 5. Anidar las variantes en sus productos correspondientes
    const finalProducts = products.map(p => ({
      ...p,
      variants: variantsWithAttrs.filter(v => v.product_id === p.id)
    }));
    
    res.json(finalProducts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PRODUCTS (con variantes)
app.post('/api/products', async (req, res) => {
    const { name, description, brand_id, category, subcategory, status = 'Activo', variants } = req.body;

    if (!name || !variants || !Array.isArray(variants) || variants.length === 0) {
        return res.status(400).json({ error: 'Nombre y al menos una variante son requeridos.' });
    }

    const db = databaseManager.getActiveDb();
    const run = util.promisify(db.run.bind(db));
    const get = util.promisify(db.get.bind(db));

    try {
        await run('BEGIN TRANSACTION');

        // 1. Insertar el producto base
        const productSql = `INSERT INTO products (name, description, brand_id, category, subcategory, status) VALUES (?, ?, ?, ?, ?, ?)`;
        const productResult = await new Promise((resolve, reject) => {
            db.run(productSql, [name, description, brand_id, category, subcategory, status], function(err) {
                if (err) reject(err);
                else resolve({ lastID: this.lastID });
            });
        });
        const productId = productResult.lastID;

        // 2. Iterar e insertar cada variante y sus atributos
        for (const variant of variants) {
            const { sku, cost_price, sale_price, current_stock, attribute_values } = variant;
            
            // Insertar la variante
            const variantSql = `INSERT INTO product_variants (product_id, sku, cost_price, sale_price, current_stock, status) VALUES (?, ?, ?, ?, ?, ?)`;
            const variantResult = await new Promise((resolve, reject) => {
                db.run(variantSql, [productId, sku, cost_price, sale_price, current_stock, status], function(err) {
                    if (err) reject(err);
                    else resolve({ lastID: this.lastID });
                });
            });
            const variantId = variantResult.lastID;

            // Vincular valores de atributos a la variante
            if (attribute_values && Array.isArray(attribute_values)) {
                const pivotSql = `INSERT INTO variant_attribute_values (variant_id, attribute_value_id) VALUES (?, ?)`;
                for (const attrValue of attribute_values) {
                    await run(pivotSql, [variantId, attrValue.id]);
                }
            }
        }

        await run('COMMIT');
        
        // Devolver el producto completo creado (sin hacer otro query por simplicidad ahora)
        res.status(201).json({ id: productId, ...req.body });

    } catch (err) {
        console.error('Error al crear producto con variantes:', err.message);
        try {
            await run('ROLLBACK');
            res.status(500).json({ error: `Error en la transacción: ${err.message}` });
        } catch (rollbackErr) {
            res.status(500).json({ error: 'Error fatal durante el rollback.' });
        }
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

app.put('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, brand_id, category, subcategory, status = 'Activo', variants } = req.body;

    if (!name || !variants || !Array.isArray(variants)) {
        return res.status(400).json({ error: 'Faltan datos requeridos.' });
    }

    const db = databaseManager.getActiveDb();
    const run = util.promisify(db.run.bind(db));
    const all = util.promisify(db.all.bind(db));

    try {
        await run('BEGIN TRANSACTION');

        // 1. Actualizar el producto base
        const productSql = `
            UPDATE products 
            SET name = ?, description = ?, brand_id = ?, category = ?, subcategory = ?, status = ?, updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now') 
            WHERE id = ?
        `;
        await run(productSql, [name, description, brand_id, category, subcategory, status, id]);

        // 2. Obtener los IDs de las variantes viejas para borrarlas
        const oldVariantIds = await all('SELECT id FROM product_variants WHERE product_id = ?', [id]);
        const idsToDelete = oldVariantIds.map(v => v.id);

        if (idsToDelete.length > 0) {
            // Borrar las relaciones en la tabla pivote
            await run(`DELETE FROM variant_attribute_values WHERE variant_id IN (${idsToDelete.join(',')})`);
            // Borrar las variantes viejas
            await run(`DELETE FROM product_variants WHERE id IN (${idsToDelete.join(',')})`);
        }

        // 3. Re-crear las variantes con la nueva información
        for (const variant of variants) {
            const { sku, cost_price, sale_price, current_stock, attribute_values } = variant;
            
            const variantSql = `INSERT INTO product_variants (product_id, sku, cost_price, sale_price, current_stock, status) VALUES (?, ?, ?, ?, ?, ?)`;
            const variantResult = await new Promise((resolve, reject) => {
                db.run(variantSql, [id, sku, cost_price, sale_price, current_stock, status], function(err) {
                    if (err) reject(err); else resolve({ lastID: this.lastID });
                });
            });
            const variantId = variantResult.lastID;

            if (attribute_values && Array.isArray(attribute_values)) {
                const pivotSql = `INSERT INTO variant_attribute_values (variant_id, attribute_value_id) VALUES (?, ?)`;
                for (const attrValue of attribute_values) {
                    await run(pivotSql, [variantId, attrValue.id]);
                }
            }
        }

        await run('COMMIT');
        res.json({ message: 'Producto actualizado exitosamente' });

    } catch (err) {
        console.error('Error al actualizar producto con variantes:', err.message);
        await run('ROLLBACK');
        res.status(500).json({ error: `Error en la transacción: ${err.message}` });
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

// --- BRANDS API ---
app.get('/api/brands', async (req, res) => {
    try {
        const db = databaseManager.getActiveDb();
        const dbAll = util.promisify(db.all.bind(db));
        const rows = await dbAll("SELECT * FROM brands ORDER BY name ASC", []);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: `Failed to fetch brands: ${error.message}` });
    }
});

app.post('/api/brands', (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Brand name is required.' });
    }
    try {
        const db = databaseManager.getActiveDb();
        const sql = `INSERT INTO brands (name) VALUES (?)`;
        db.run(sql, [name], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ error: 'Brand name already exists.' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id: this.lastID, name });
        });
    } catch (error) {
        res.status(500).json({ error: `Failed to create brand: ${error.message}` });
    }
});

app.put('/api/brands/:id', (req, res) => {
    const { name } = req.body;
    const { id } = req.params;
    if (!name) {
        return res.status(400).json({ error: 'Brand name is required.' });
    }
    try {
        const db = databaseManager.getActiveDb();
        const sql = `UPDATE brands SET name = ? WHERE id = ?`;
        db.run(sql, [name, id], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ error: 'Brand name already exists.' });
                }
                return res.status(500).json({ error: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Brand not found' });
            }
            res.json({ message: 'Brand updated successfully' });
        });
    } catch (error) {
        res.status(500).json({ error: `Failed to update brand: ${error.message}` });
    }
});

app.delete('/api/brands/:id', (req, res) => {
    const { id } = req.params;
    try {
        const db = databaseManager.getActiveDb();
        db.run('DELETE FROM brands WHERE id = ?', [id], function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Brand not found' });
            }
            res.status(204).send();
        });
    } catch (error) {
        res.status(500).json({ error: `Failed to delete brand: ${error.message}` });
    }
});

// --- ATTRIBUTES API ---
app.get('/api/attributes', async (req, res) => {
    try {
        const db = databaseManager.getActiveDb();
        const dbAll = util.promisify(db.all.bind(db));
        const rows = await dbAll("SELECT * FROM attributes ORDER BY name ASC", []);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: `Failed to fetch attributes: ${error.message}` });
    }
});

app.post('/api/attributes', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Attribute name is required.' });
    try {
        const db = databaseManager.getActiveDb();
        db.run(`INSERT INTO attributes (name) VALUES (?)`, [name], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ error: 'Attribute name already exists.' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id: this.lastID, name });
        });
    } catch (error) {
        res.status(500).json({ error: `Failed to create attribute: ${error.message}` });
    }
});

app.put('/api/attributes/:id', (req, res) => {
    const { name } = req.body;
    const { id } = req.params;
    if (!name) return res.status(400).json({ error: 'Attribute name is required.' });
    try {
        const db = databaseManager.getActiveDb();
        db.run(`UPDATE attributes SET name = ? WHERE id = ?`, [name, id], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ error: 'Attribute name already exists.' });
                }
                return res.status(500).json({ error: err.message });
            }
            if (this.changes === 0) return res.status(404).json({ error: 'Attribute not found' });
            res.json({ message: 'Attribute updated successfully' });
        });
    } catch (error) {
        res.status(500).json({ error: `Failed to update attribute: ${error.message}` });
    }
});

app.delete('/api/attributes/:id', (req, res) => {
    const { id } = req.params;
    try {
        const db = databaseManager.getActiveDb();
        db.run('DELETE FROM attributes WHERE id = ?', [id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Attribute not found' });
            res.status(204).send();
        });
    } catch (error) {
        res.status(500).json({ error: `Failed to delete attribute: ${error.message}` });
    }
});

// --- ATTRIBUTE VALUES API ---
app.get('/api/attributes/:attributeId/values', async (req, res) => {
    const { attributeId } = req.params;
    try {
        const db = databaseManager.getActiveDb();
        const dbAll = util.promisify(db.all.bind(db));
        const rows = await dbAll("SELECT * FROM attribute_values WHERE attribute_id = ? ORDER BY value ASC", [attributeId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: `Failed to fetch attribute values: ${error.message}` });
    }
});

app.post('/api/attributes/:attributeId/values', (req, res) => {
    const { attributeId } = req.params;
    const { value } = req.body;
    if (!value) return res.status(400).json({ error: 'Value is required.' });
    try {
        const db = databaseManager.getActiveDb();
        db.run(`INSERT INTO attribute_values (attribute_id, value) VALUES (?, ?)`, [attributeId, value], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ error: 'This value already exists for this attribute.' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id: this.lastID, attribute_id: parseInt(attributeId), value });
        });
    } catch (error) {
        res.status(500).json({ error: `Failed to create attribute value: ${error.message}` });
    }
});

app.put('/api/attributes/:attributeId/values/:valueId', (req, res) => {
    const { attributeId, valueId } = req.params;
    const { value } = req.body;
    if (!value) return res.status(400).json({ error: 'Value is required.' });
    try {
        const db = databaseManager.getActiveDb();
        db.run(`UPDATE attribute_values SET value = ? WHERE id = ? AND attribute_id = ?`, [value, valueId, attributeId], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ error: 'This value already exists for this attribute.' });
                }
                return res.status(500).json({ error: err.message });
            }
            if (this.changes === 0) return res.status(404).json({ error: 'Attribute value not found' });
            res.json({ message: 'Attribute value updated successfully' });
        });
    } catch (error) {
        res.status(500).json({ error: `Failed to update attribute value: ${error.message}` });
    }
});

app.delete('/api/attributes/:attributeId/values/:valueId', (req, res) => {
    const { attributeId, valueId } = req.params;
    try {
        const db = databaseManager.getActiveDb();
        db.run('DELETE FROM attribute_values WHERE id = ? AND attribute_id = ?', [valueId, attributeId], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Attribute value not found' });
            res.status(204).send();
        });
    } catch (error) {
        res.status(500).json({ error: `Failed to delete attribute value: ${error.message}` });
    }
});

// --- TRANSACTION ANNULMENT API ---
app.delete('/api/sales/:transactionId', async (req, res) => {
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

app.delete('/api/purchases/:transactionId', async (req, res) => {
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
        }
        await run("UPDATE inventory_movements SET status = 'Anulado' WHERE transaction_id = ? AND status = 'Activo'", [transactionId]);

        await run('COMMIT');
        res.status(200).json({ message: 'Compra anulada correctamente.' });
    } catch (err) {
        await run('ROLLBACK');
        res.status(500).json({ error: `Error en la anulación: ${err.message}` });
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

app.get('/api/inventory/latest-snapshot', async (req, res) => {
    try {
        const db = databaseManager.getActiveDb();
        const get = util.promisify(db.get.bind(db));
        const latest = await get("SELECT MAX(snapshot_date) as last_date FROM inventory_snapshots");
        res.json({ last_date: latest?.last_date || null });
    } catch (error) {
        console.error('Error al obtener el último snapshot:', error);
        res.status(500).json({ error: 'Error interno al consultar el último snapshot.' });
    }
});

app.post('/api/inventory/create-snapshot', async (req, res) => {
    const { snapshot_date } = req.body;
    if (!snapshot_date) {
        return res.status(400).json({ error: 'Se requiere un snapshot_date.' });
    }

    const db = databaseManager.getActiveDb();
    const get = util.promisify(db.get.bind(db));
    const all = util.promisify(db.all.bind(db));
    const run = util.promisify(db.run.bind(db));

    try {
        await run('BEGIN TRANSACTION');

        const products = await all("SELECT id FROM products");
        let createdCount = 0;
        let totalValue = 0;

        for (const product of products) {
            // Lógica optimizada: buscar el snapshot más reciente como punto de partida
            const latestSnapshot = await get(
                `SELECT snapshot_date, closing_stock, closing_average_cost 
                 FROM inventory_snapshots
                 WHERE product_id = ? AND date(snapshot_date) < ?
                 ORDER BY snapshot_date DESC
                 LIMIT 1`,
                [product.id, snapshot_date]
            );

            let closing_stock = 0;
            let closing_average_cost = 0;
            let calculationStartDate = '1970-01-01';

            if (latestSnapshot) {
                closing_stock = latestSnapshot.closing_stock;
                closing_average_cost = latestSnapshot.closing_average_cost;
                calculationStartDate = latestSnapshot.snapshot_date;
            }

            const movements = await all(
                `SELECT type, quantity, unit_cost 
                 FROM inventory_movements 
                 WHERE product_id = ? AND status = 'Activo' AND date(transaction_date) > ? AND date(transaction_date) <= ?
                 ORDER BY transaction_date ASC, created_at ASC`,
                [product.id, calculationStartDate, snapshot_date]
            );

            for (const move of movements) {
                if (move.type === 'ENTRADA') {
                    const currentTotalValue = closing_stock * closing_average_cost;
                    const entryValue = move.quantity * (move.unit_cost || 0);
                    closing_stock += move.quantity;
                    closing_average_cost = closing_stock > 0 ? (currentTotalValue + entryValue) / closing_stock : 0;
                } else {
                    closing_stock -= move.quantity;
                }
            }

            if (closing_stock > 0 || (latestSnapshot && movements.length === 0)) {
                 const insertSql = `
                    INSERT INTO inventory_snapshots (product_id, snapshot_date, closing_stock, closing_average_cost) 
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT(product_id, snapshot_date) DO UPDATE SET
                        closing_stock = excluded.closing_stock,
                        closing_average_cost = excluded.closing_average_cost;
                `;
                await run(insertSql, [product.id, snapshot_date, closing_stock, closing_average_cost]);
                createdCount++;
                if (closing_stock > 0) {
                    totalValue += closing_stock * closing_average_cost;
                }
            }
        }

        await run('COMMIT');
        res.status(201).json({ 
            message: `Snapshot creado/actualizado exitosamente para ${createdCount} productos en la fecha ${snapshot_date}.`,
            snapshot: {
                date: snapshot_date,
                productCount: createdCount,
                totalValue: totalValue
            }
        });

    } catch (error) {
        console.error('Error creando el snapshot:', error);
        await run('ROLLBACK');
        res.status(500).json({ error: `Error al crear el snapshot: ${error.message}` });
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

app.put('/api/purchases', async (req, res) => {
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


app.get('/api/sales', async (req, res) => {
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


app.post('/api/sales', async (req, res) => {
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

app.put('/api/sales', async (req, res) => {
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
            // 1. Buscar el snapshot más reciente ANTES de la fecha de inicio del reporte.
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
            let calculationStartDate = '1970-01-01'; // Fecha de inicio por defecto si no hay snapshot

            if (latestSnapshot) {
                initialStock = latestSnapshot.closing_stock;
                initialAvgCost = latestSnapshot.closing_average_cost;
                calculationStartDate = latestSnapshot.snapshot_date;
            }

            // 2. Calcular estado inicial desde el último snapshot (o desde el inicio) hasta la fecha de inicio del reporte.
            const historicalMovements = await all(
                `SELECT type, quantity, unit_cost 
                 FROM inventory_movements 
                 WHERE product_id = ? AND status = 'Activo' AND date(transaction_date) > ? AND date(transaction_date) < ?
                 ORDER BY transaction_date ASC, created_at ASC`,
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

            // 'initialStock' y 'initialAvgCost' ahora tienen el estado correcto al inicio del período del reporte.
            let existenciaAcumulada = initialStock;
            let costoPromedioActual = initialAvgCost;

            // 3. Obtener todos los movimientos ACTIVOS DENTRO del período del reporte.
            const movements = await all(
                `SELECT type, quantity, unit_cost, price, transaction_date 
                 FROM inventory_movements 
                 WHERE product_id = ? AND status = 'Activo' AND date(transaction_date) BETWEEN ? AND ?
                 ORDER BY transaction_date ASC, created_at ASC`,
                [product.id, startDate, endDate]
            );

            let totalEntradasUnidades = 0, totalSalidasUnidades = 0, totalRetirosUnidades = 0, totalAutoconsumoUnidades = 0;
            let valorEntradas = 0, valorSalidas = 0, valorRetiros = 0, valorAutoconsumo = 0;

            // 4. Iterar cronológicamente para calcular valores DENTRO del período del reporte.
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
                code: product.sku || `P-${product.id}`,
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


app.post('/api/reports/historical-summary', async (req, res) => {
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
                `SELECT type, quantity, unit_cost 
                 FROM inventory_movements 
                 WHERE product_id = ? AND status = 'Activo' AND date(transaction_date) > ? AND date(transaction_date) <= ?
                 ORDER BY transaction_date ASC, created_at ASC`,
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

app.post('/api/reports/historical-summary', async (req, res) => {
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
                `SELECT type, quantity, unit_cost 
                 FROM inventory_movements 
                 WHERE product_id = ? AND status = 'Activo' AND date(transaction_date) > ? AND date(transaction_date) <= ?
                 ORDER BY transaction_date ASC, created_at ASC`,
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
            newCustomers: { value: 0, change: 0 } // Placeholder
        };

        res.json(summary);

    } catch (err) {
        console.error("Error fetching dashboard summary:", err);
        res.status(500).json({ error: "Failed to fetch dashboard summary" });
    }
});


app.get('/api/dashboard/recent-sales', async (req, res) => {
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
            // Combinamos el nombre del producto y la variante para mayor claridad
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