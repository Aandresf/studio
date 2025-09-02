const express = require('express');
const { requirePermission, requireAnyPermission } = require('../lib/authorize');
const router = express.Router();
const databaseManager = require('../database-manager');

function runSql(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) return reject(err);
            resolve(this);
        });
    });
}

function allSql(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

function getSql(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) return reject(err);
            resolve(row);
        });
    });
}

// GET / - list attributes (supports subdepartmentId and includeGlobal)
router.get('/', requirePermission('attributes:read'), async (req, res) => {
    try {
        const db = databaseManager.getActiveDb();
        const { subdepartmentId, includeGlobal } = req.query;
        let rows;
        if (subdepartmentId) {
            if (includeGlobal === 'true' || includeGlobal === '1') {
                rows = await allSql(db, 'SELECT id, name, subdepartment_id as subdepartmentId, created_at FROM attributes WHERE subdepartment_id = ? OR subdepartment_id IS NULL ORDER BY name ASC', [subdepartmentId]);
            } else {
                rows = await allSql(db, 'SELECT id, name, subdepartment_id as subdepartmentId, created_at FROM attributes WHERE subdepartment_id = ? ORDER BY name ASC', [subdepartmentId]);
            }
        } else {
            // no subdepartmentId -> return global attributes only
            rows = await allSql(db, 'SELECT id, name, subdepartment_id as subdepartmentId, created_at FROM attributes WHERE subdepartment_id IS NULL ORDER BY name ASC', []);
        }
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: `Failed to fetch attributes: ${error.message}` });
    }
});

// POST / - create attribute
// POST / - create attribute
// Body: { name, subdepartmentId }
router.post('/', requireAnyPermission('attributes:create', 'catalog:manage'), async (req, res) => {
    const { name, subdepartmentId } = req.body;
    if (!name) return res.status(400).json({ error: 'Attribute name is required.' });
    try {
        const db = databaseManager.getActiveDb();
        const result = await runSql(db, 'INSERT INTO attributes (name, subdepartment_id, created_at) VALUES (?, ?, datetime("now"))', [name, subdepartmentId || null]);
        res.status(201).json({ id: result.lastID, name, subdepartmentId: subdepartmentId || null });
    } catch (error) {
        if (error && error.message && error.message.includes('UNIQUE')) return res.status(409).json({ error: 'An attribute with that name already exists in this scope' });
        res.status(500).json({ error: `Failed to create attribute: ${error.message}` });
    }
});

// PUT /:id - update attribute
// PUT /:id - update attribute
// Body: { name, subdepartmentId }
router.put('/:id', requireAnyPermission('attributes:edit', 'catalog:manage'), async (req, res) => {
    const { id } = req.params;
    const { name, subdepartmentId } = req.body;
    if (!name) return res.status(400).json({ error: 'Attribute name is required.' });
    try {
        const db = databaseManager.getActiveDb();
        const result = await runSql(db, 'UPDATE attributes SET name = ?, subdepartment_id = ?, updated_at = datetime("now") WHERE id = ?', [name, subdepartmentId || null, id]);
        if (result.changes === 0) return res.status(404).json({ error: 'Attribute not found' });
        res.json({ message: 'Attribute updated successfully' });
    } catch (error) {
        if (error && error.message && error.message.includes('UNIQUE')) return res.status(409).json({ error: 'An attribute with that name already exists in this scope' });
        res.status(500).json({ error: `Failed to update attribute: ${error.message}` });
    }
});

// DELETE /:id - delete attribute
router.delete('/:id', requireAnyPermission('attributes:delete', 'catalog:manage'), async (req, res) => {
    const { id } = req.params;
    try {
        const db = databaseManager.getActiveDb();
        const result = await runSql(db, 'DELETE FROM attributes WHERE id = ?', [id]);
        if (result.changes === 0) return res.status(404).json({ error: 'Attribute not found' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: `Failed to delete attribute: ${error.message}` });
    }
});

// Nested: attribute values
// GET /:attributeId/values
router.get('/:attributeId/values', requirePermission('attributes:read'), async (req, res) => {
    const { attributeId } = req.params;
    try {
        const db = databaseManager.getActiveDb();
        const rows = await allSql(db, 'SELECT id, attribute_id as attributeId, value, created_at FROM attribute_values WHERE attribute_id = ? ORDER BY value ASC', [attributeId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: `Failed to fetch attribute values: ${error.message}` });
    }
});

// POST /:attributeId/values
router.post('/:attributeId/values', requireAnyPermission('attributes:create_value', 'catalog:manage'), async (req, res) => {
    const { attributeId } = req.params;
    const { value } = req.body;
    if (!value) return res.status(400).json({ error: 'Value is required.' });
    try {
        const db = databaseManager.getActiveDb();
        const result = await runSql(db, 'INSERT INTO attribute_values (attribute_id, value, created_at) VALUES (?, ?, datetime("now"))', [attributeId, value]);
        res.status(201).json({ id: result.lastID, attribute_id: parseInt(attributeId), value });
    } catch (err) {
        if (err && err.message && err.message.includes('UNIQUE')) return res.status(409).json({ error: 'This value already exists for this attribute.' });
        res.status(500).json({ error: `Failed to create attribute value: ${err.message}` });
    }
});

// PUT /:attributeId/values/:valueId
router.put('/:attributeId/values/:valueId', requireAnyPermission('attributes:edit_value', 'catalog:manage'), async (req, res) => {
    const { attributeId, valueId } = req.params;
    const { value } = req.body;
    if (!value) return res.status(400).json({ error: 'Value is required.' });
    try {
        const db = databaseManager.getActiveDb();
        const result = await runSql(db, 'UPDATE attribute_values SET value = ?, updated_at = datetime("now") WHERE id = ? AND attribute_id = ?', [value, valueId, attributeId]);
        if (result.changes === 0) return res.status(404).json({ error: 'Attribute value not found' });
        res.json({ message: 'Attribute value updated successfully' });
    } catch (err) {
        if (err && err.message && err.message.includes('UNIQUE')) return res.status(409).json({ error: 'This value already exists for this attribute.' });
        res.status(500).json({ error: `Failed to update attribute value: ${err.message}` });
    }
});

// DELETE /:attributeId/values/:valueId
router.delete('/:attributeId/values/:valueId', requireAnyPermission('attributes:delete_value', 'catalog:manage'), async (req, res) => {
    const { attributeId, valueId } = req.params;
    try {
        const db = databaseManager.getActiveDb();
        const result = await runSql(db, 'DELETE FROM attribute_values WHERE id = ? AND attribute_id = ?', [valueId, attributeId]);
        if (result.changes === 0) return res.status(404).json({ error: 'Attribute value not found' });
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: `Failed to delete attribute value: ${err.message}` });
    }
});

module.exports = router;
