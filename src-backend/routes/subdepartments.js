const express = require('express');
const router = express.Router();
const databaseManager = require('../database-manager');
const util = require('util');

// GET / - list subdepartments, optional ?departmentId=...
router.get('/', async (req, res) => {
    const { departmentId } = req.query;
    let query = `
    SELECT s.*, d.name as department_name 
    FROM subdepartments s
    JOIN departments d ON s.department_id = d.id
  `;
    const params = [];
    if (departmentId) {
        query += ' WHERE s.department_id = ?';
        params.push(departmentId);
    }
    try {
        const db = databaseManager.getActiveDb();
        const rows = await util.promisify(db.all.bind(db))(query + ' ORDER BY s.name ASC', params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST / - create
router.post('/', (req, res) => {
    const { department_id, name, abbreviation } = req.body;
    if (!department_id || !name || !abbreviation) return res.status(400).json({ error: 'department_id, name and abbreviation are required.' });
    try {
        const db = databaseManager.getActiveDb();
        db.run('INSERT INTO subdepartments (department_id, name, abbreviation) VALUES (?, ?, ?)', [department_id, name, abbreviation], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) return res.status(409).json({ error: 'Subdepartment already exists.' });
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id: this.lastID, department_id, name, abbreviation });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /:id - update
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { department_id, name, abbreviation } = req.body;
    if (!department_id || !name || !abbreviation) return res.status(400).json({ error: 'department_id, name and abbreviation are required.' });
    try {
        const db = databaseManager.getActiveDb();
        db.run('UPDATE subdepartments SET department_id = ?, name = ?, abbreviation = ? WHERE id = ?', [department_id, name, abbreviation, id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Subdepartment not found' });
            res.json({ message: 'Subdepartment updated successfully' });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /:id - delete
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    try {
        const db = databaseManager.getActiveDb();
        db.run('DELETE FROM subdepartments WHERE id = ?', [id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Subdepartment not found' });
            res.status(204).send();
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
