const express = require('express');
const { requirePermission, requireAnyPermission } = require('../lib/authorize');
const router = express.Router();
const databaseManager = require('../database-manager');
const util = require('util');

// GET / - list brands
router.get('/', requirePermission('brands:read'), async (req, res) => {
    try {
        const db = databaseManager.getActiveDb();
        const dbAll = util.promisify(db.all.bind(db));
        const rows = await dbAll("SELECT * FROM brands ORDER BY name ASC", []);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: `Failed to fetch brands: ${error.message}` });
    }
});

// POST / - create brand
router.post('/', requireAnyPermission('brands:create', 'catalog:manage'), (req, res) => {
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

// PUT /:id - update brand
router.put('/:id', requireAnyPermission('brands:edit', 'catalog:manage'), (req, res) => {
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

// DELETE /:id - delete brand
router.delete('/:id', requireAnyPermission('brands:delete', 'catalog:manage'), (req, res) => {
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

module.exports = router;
