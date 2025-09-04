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

// GET / - list brands (supports subdepartmentId and includeGlobal)
router.get('/', requirePermission('brands:read'), async (req, res) => {
    try {
        const db = databaseManager.getActiveDb();
        const { subdepartmentId, includeGlobal } = req.query;
        let rows;
    if (subdepartmentId) {
            if (includeGlobal === 'true' || includeGlobal === '1') {
                rows = await allSql(db, `SELECT id, name, subdepartment_id as subdepartmentId, created_at FROM brands WHERE (status IS NULL OR status <> 'deleted') AND (subdepartment_id = ? OR subdepartment_id IS NULL) ORDER BY name ASC`, [subdepartmentId]);
            } else {
                rows = await allSql(db, `SELECT id, name, subdepartment_id as subdepartmentId, created_at FROM brands WHERE (status IS NULL OR status <> 'deleted') AND subdepartment_id = ? ORDER BY name ASC`, [subdepartmentId]);
            }
        } else {
            rows = await allSql(db, `SELECT id, name, subdepartment_id as subdepartmentId, created_at FROM brands WHERE (status IS NULL OR status <> 'deleted') AND subdepartment_id IS NULL ORDER BY name ASC`, []);
        }
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: `Failed to fetch brands: ${error.message}` });
    }
});

// POST / - create brand
router.post('/', requireAnyPermission('brands:create', 'catalog:manage'), async (req, res) => {
    const { name, subdepartmentId } = req.body;
    if (!name) return res.status(400).json({ error: 'Brand name is required.' });
    try {
        const db = databaseManager.getActiveDb();
        const result = await runSql(db, 'INSERT INTO brands (name, subdepartment_id, created_at) VALUES (?, ?, datetime("now"))', [name, subdepartmentId || null]);
        res.status(201).json({ id: result.lastID, name, subdepartmentId: subdepartmentId || null });
    } catch (err) {
        if (err && err.message && err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Brand name already exists in this scope' });
        res.status(500).json({ error: `Failed to create brand: ${err.message}` });
    }
});

// PUT /:id - update brand
router.put('/:id', requireAnyPermission('brands:edit', 'catalog:manage'), async (req, res) => {
    const { name, subdepartmentId } = req.body;
    const { id } = req.params;
    if (!name) return res.status(400).json({ error: 'Brand name is required.' });
    try {
        const db = databaseManager.getActiveDb();
        const result = await runSql(db, 'UPDATE brands SET name = ?, subdepartment_id = ?, updated_at = datetime("now") WHERE id = ?', [name, subdepartmentId || null, id]);
        if (result.changes === 0) return res.status(404).json({ error: 'Brand not found' });
        res.json({ message: 'Brand updated successfully' });
    } catch (err) {
        if (err && err.message && err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Brand name already exists in this scope' });
        res.status(500).json({ error: `Failed to update brand: ${err.message}` });
    }
});

// DELETE /:id - try soft-delete via status column then fallback to physical delete
router.delete('/:id', requireAnyPermission('brands:delete', 'catalog:manage'), async (req, res) => {
    const { id } = req.params;
    try {
        const db = databaseManager.getActiveDb();
        try {
            const deleter = (req.currentUser && req.currentUser.id) ? req.currentUser.id : ((req.currentUser && req.currentUser.username) ? req.currentUser.username : 'system');
            const r = await runSql(db, "UPDATE brands SET status = 'deleted', deleted_at = datetime('now'), deleted_by = ?, updated_at = datetime('now') WHERE id = ?", [deleter, id]);
            if (r && r.changes && r.changes > 0) return res.status(204).send();
        } catch (e) {
            if (!(e && e.message && e.message.includes('no such column'))) throw e;
        }
        const result = await runSql(db, 'DELETE FROM brands WHERE id = ?', [id]);
        if (result.changes === 0) return res.status(404).json({ error: 'Brand not found' });
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: `Failed to delete brand: ${err.message}` });
    }
});

module.exports = router;
