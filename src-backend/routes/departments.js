const express = require('express');
const router = express.Router();
const databaseManager = require('../database-manager');
const util = require('util');

// GET / - list departments
router.get('/', async (req, res) => {
    try {
        const db = databaseManager.getActiveDb();
        const rows = await util.promisify(db.all.bind(db))("SELECT * FROM departments ORDER BY name ASC", []);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: `Failed to fetch departments: ${error.message}` });
    }
});

// POST / - create department
router.post('/', (req, res) => {
    const { name, abbreviation } = req.body;
    if (!name || !abbreviation) return res.status(400).json({ error: 'Name and abbreviation are required.' });
    try {
        const db = databaseManager.getActiveDb();
        db.run(`INSERT INTO departments (name, abbreviation) VALUES (?, ?)`, [name, abbreviation], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ error: 'Department name or abbreviation already exists.' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id: this.lastID, name, abbreviation });
        });
    } catch (error) {
        res.status(500).json({ error: `Failed to create department: ${error.message}` });
    }
});

// PUT /:id - update department
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { name, abbreviation } = req.body;
    if (!name || !abbreviation) return res.status(400).json({ error: 'Name and abbreviation are required.' });
    try {
        const db = databaseManager.getActiveDb();
        db.run(`UPDATE departments SET name = ?, abbreviation = ? WHERE id = ?`, [name, abbreviation, id], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ error: 'Department name or abbreviation already exists.' });
                }
                return res.status(500).json({ error: err.message });
            }
            if (this.changes === 0) return res.status(404).json({ error: 'Department not found' });
            res.json({ message: 'Department updated successfully' });
        });
    } catch (error) {
        res.status(500).json({ error: `Failed to update department: ${error.message}` });
    }
});

// DELETE /:id - delete department
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    try {
        const db = databaseManager.getActiveDb();
        db.run('DELETE FROM departments WHERE id = ?', [id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Department not found' });
            res.status(204).send();
        });
    } catch (error) {
        res.status(500).json({ error: `Failed to delete department: ${error.message}` });
    }
});

// SUBDEPARTMENTS
// GET /subdepartments - optional query ?departmentId=...
router.get('/subdepartments', async (req, res) => {
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

// POST /subdepartments - create
router.post('/subdepartments', (req, res) => {
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

// PUT /subdepartments/:id - update
router.put('/subdepartments/:id', (req, res) => {
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

// DELETE /subdepartments/:id - delete
router.delete('/subdepartments/:id', (req, res) => {
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
