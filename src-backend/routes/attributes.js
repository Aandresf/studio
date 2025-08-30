const express = require('express');
const router = express.Router();
const { requirePermission, requireAnyPermission } = require('../lib/authorize');
const databaseManager = require('../database-manager');
const util = require('util');

// GET / - list attributes
router.get('/', async (req, res) => {
    try {
        const db = databaseManager.getActiveDb();
        const dbAll = util.promisify(db.all.bind(db));
        const rows = await dbAll("SELECT * FROM attributes ORDER BY name ASC", []);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: `Failed to fetch attributes: ${error.message}` });
    }
});

// POST / - create attribute
router.post('/', requireAnyPermission('attributes:create', 'catalog:manage'), (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Attribute name is required.' });
    try {
        const db = databaseManager.getActiveDb();
        db.run('INSERT INTO attributes (name) VALUES (?)', [name], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID, name });
        });
    } catch (error) {
        res.status(500).json({ error: `Failed to create attribute: ${error.message}` });
    }
});

// PUT /:id - update attribute
router.put('/:id', requireAnyPermission('attributes:edit', 'catalog:manage'), (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Attribute name is required.' });
    try {
        const db = databaseManager.getActiveDb();
        db.run('UPDATE attributes SET name = ? WHERE id = ?', [name, id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Attribute not found' });
            res.json({ message: 'Attribute updated successfully' });
        });
    } catch (error) {
        res.status(500).json({ error: `Failed to update attribute: ${error.message}` });
    }
});

// DELETE /:id - delete attribute
router.delete('/:id', requireAnyPermission('attributes:delete', 'catalog:manage'), (req, res) => {
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

// Nested: attribute values
// GET /:attributeId/values
router.get('/:attributeId/values', async (req, res) => {
    const { attributeId } = req.params;
    try {
        const db = databaseManager.getActiveDb();
        const dbAll = util.promisify(db.all.bind(db));
        const rows = await dbAll('SELECT * FROM attribute_values WHERE attribute_id = ? ORDER BY value ASC', [attributeId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: `Failed to fetch attribute values: ${error.message}` });
    }
});

// POST /:attributeId/values
router.post('/:attributeId/values', requireAnyPermission('attributes:create_value', 'catalog:manage'), (req, res) => {
    const { attributeId } = req.params;
    const { value } = req.body;
    if (!value) return res.status(400).json({ error: 'Value is required.' });
    try {
        const db = databaseManager.getActiveDb();
        db.run('INSERT INTO attribute_values (attribute_id, value) VALUES (?, ?)', [attributeId, value], function(err) {
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

// PUT /:attributeId/values/:valueId
router.put('/:attributeId/values/:valueId', requireAnyPermission('attributes:edit_value', 'catalog:manage'), (req, res) => {
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

// DELETE /:attributeId/values/:valueId
router.delete('/:attributeId/values/:valueId', requireAnyPermission('attributes:delete_value', 'catalog:manage'), (req, res) => {
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

module.exports = router;
