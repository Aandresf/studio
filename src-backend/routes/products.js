const express = require('express');
const router = express.Router();
const databaseManager = require('../database-manager');
const util = require('util');

// GET / - list products with variants and attribute values
router.get('/', async (req, res) => {
  try {
    const db = databaseManager.getActiveDb();
    const dbAll = util.promisify(db.all.bind(db));
    const productsSql = `
      SELECT p.*, b.name as brand_name 
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      ORDER BY p.id DESC
    `;
    const products = await dbAll(productsSql, []);
    const variantsSql = `SELECT * FROM product_variants`;
    const allVariants = await dbAll(variantsSql, []);
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

    const finalProducts = products.map(p => ({
      ...p,
      variants: variantsWithAttrs.filter(v => v.product_id === p.id)
    }));
    res.json(finalProducts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST / - create product with transactional SKU and variants
router.post('/', async (req, res) => {
    const { name, description, brand_id, department_id, subdepartment_id, status = 'Activo', variants } = req.body;

    if (!name || !variants || !Array.isArray(variants) || !department_id || !subdepartment_id) {
        return res.status(400).json({ error: 'Faltan datos requeridos (nombre, variantes, departamento, subdepartamento).' });
    }

    const db = databaseManager.getActiveDb();
    const run = util.promisify(db.run.bind(db));
    const get = util.promisify(db.get.bind(db));

    try {
        await run('BEGIN TRANSACTION');

        let sequence = await get('SELECT last_number FROM product_sequences WHERE department_id = ? AND subdepartment_id = ?', [department_id, subdepartment_id]);
        if (!sequence) {
            await run('INSERT INTO product_sequences (department_id, subdepartment_id, last_number) VALUES (?, ?, 0)', [department_id, subdepartment_id]);
            sequence = { last_number: 0 };
        }
        const newNumber = sequence.last_number + 1;
        await run('UPDATE product_sequences SET last_number = ? WHERE department_id = ? AND subdepartment_id = ?', [newNumber, department_id, subdepartment_id]);
        const dep = await get('SELECT abbreviation FROM departments WHERE id = ?', [department_id]);
        const sub = await get('SELECT abbreviation FROM subdepartments WHERE id = ?', [subdepartment_id]);
        if (!dep || !sub) throw new Error('Departamento o Subdepartamento no encontrado.');
        const baseSku = `${dep.abbreviation}-${sub.abbreviation}-${String(newNumber).padStart(3, '0')}`;

        const productSql = `INSERT INTO products (name, description, brand_id, department_id, subdepartment_id, base_sku, status) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const productResult = await new Promise((resolve, reject) => {
            db.run(productSql, [name, description, brand_id, department_id, subdepartment_id, baseSku, status], function(err) {
                if (err) reject(err); else resolve({ lastID: this.lastID });
            });
        });
        const productId = productResult.lastID;

        for (const variant of variants) {
            const { sku, cost_price, sale_price, current_stock, attribute_values } = variant;
            const variantSql = `INSERT INTO product_variants (product_id, sku, cost_price, sale_price, current_stock, status) VALUES (?, ?, ?, ?, ?, ?)`;
            const variantResult = await new Promise((resolve, reject) => {
                db.run(variantSql, [productId, sku, cost_price, sale_price, current_stock, status], function(err) {
                    if (err) reject(err); else resolve({ lastID: this.lastID });
                });
            });
            const variantId = variantResult.lastID;

            if (attribute_values && Array.isArray(attribute_values)) {
                for (const attrValue of attribute_values) {
                    await run(`INSERT INTO variant_attribute_values (variant_id, attribute_value_id) VALUES (?, ?)`, [variantId, attrValue.id]);
                }
            }
        }

        await run('COMMIT');
        const createdProduct = await get('SELECT * FROM products WHERE id = ?', [productId]);
        res.status(201).json(createdProduct);

    } catch (err) {
        console.error('Error al crear producto:', err.message);
        await run('ROLLBACK');
        res.status(500).json({ error: `Error en la transacción: ${err.message}` });
    }
});

// GET /:id - product details
router.get('/:id', async (req, res) => {
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

// PUT /:id - update product and variants
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, brand_id, status = 'Activo', variants, variantsToDelete } = req.body;

    if (!name || !variants || !Array.isArray(variants)) {
        return res.status(400).json({ error: 'Faltan datos requeridos (nombre, variantes).' });
    }

    const db = databaseManager.getActiveDb();
    const run = util.promisify(db.run.bind(db));
    const get = util.promisify(db.get.bind(db));

    try {
        await run('BEGIN TRANSACTION');

        const productSql = `
            UPDATE products 
            SET name = ?, description = ?, brand_id = ?, status = ?, updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now') 
            WHERE id = ?
        `;
        await run(productSql, [name, description, brand_id, status, id]);

        if (variantsToDelete && variantsToDelete.length > 0) {
            for (const variantId of variantsToDelete) {
                const variant = await get('SELECT current_stock FROM product_variants WHERE id = ?', [variantId]);
                if (variant && variant.current_stock > 0) {
                    const variantDetails = await get(`
                        SELECT p.name as product_name, GROUP_CONCAT(av.value, ' / ') as variant_name
                        FROM product_variants pv
                        JOIN products p ON pv.product_id = p.id
                        LEFT JOIN variant_attribute_values vav ON vav.variant_id = pv.id
                        LEFT JOIN attribute_values av ON vav.attribute_value_id = av.id
                        WHERE pv.id = ?
                        GROUP BY pv.id
                    `, [variantId]);

                    const errorPayload = {
                        message: `No se puede desactivar la variante "${variantDetails.variant_name || 'Estándar'}" del producto "${variantDetails.product_name}" porque tiene stock.`,
                        details: {
                            variantId: variantId,
                            stock: variant.current_stock,
                            variantName: variantDetails.variant_name,
                            productName: variantDetails.product_name
                        },
                        code: 'VARIANT_IN_STOCK'
                    };
                    const err = new Error(errorPayload.message);
                    err.details = errorPayload;
                    throw err;
                }
                await run(`UPDATE product_variants SET status = 'inactive' WHERE id = ?`, [variantId]);
            }
        }

        for (const variant of variants) {
            const { id: variantId, sku, cost_price, sale_price, current_stock, attribute_values } = variant;
            if (variantId) {
                const updateVariantSql = `
                    UPDATE product_variants 
                    SET sku = ?, cost_price = ?, sale_price = ?, current_stock = ?, status = ?
                    WHERE id = ?
                `;
                await run(updateVariantSql, [sku, cost_price, sale_price, current_stock, status, variantId]);
            } else {
                const insertVariantSql = `INSERT INTO product_variants (product_id, sku, cost_price, sale_price, current_stock, status) VALUES (?, ?, ?, ?, ?, ?)`;
                const variantResult = await new Promise((resolve, reject) => {
                    db.run(insertVariantSql, [id, sku, cost_price, sale_price, current_stock, status], function(err) {
                        if (err) reject(err); else resolve({ lastID: this.lastID });
                    });
                });
                const newVariantId = variantResult.lastID;
                if (attribute_values && Array.isArray(attribute_values)) {
                    const pivotSql = `INSERT INTO variant_attribute_values (variant_id, attribute_value_id) VALUES (?, ?)`;
                    for (const attrValue of attribute_values) {
                        await run(pivotSql, [newVariantId, attrValue.id]);
                    }
                }
            }
        }

        await run('COMMIT');
        res.json({ message: 'Producto actualizado exitosamente' });

    } catch (err) {
        console.error('Error al actualizar producto con variantes:', err.message);
        await run('ROLLBACK');
        if (err.details && err.details.code === 'VARIANT_IN_STOCK') {
            return res.status(409).json({ error: err.details.message, details: err.details });
        }
        res.status(500).json({ error: `Error en la transacción: ${err.message}` });
    }
});

// DELETE /:id
router.delete('/:id', (req, res) => {
  try {
    const db = databaseManager.getActiveDb();
    db.run('DELETE FROM products WHERE id = ?', [req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Product not found' });
      res.status(204).send();
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /:id/movements - movements for product
router.get('/:id/movements', async (req, res) => {
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

module.exports = router;
