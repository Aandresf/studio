const express = require('express');
const util = require('util');
const databaseManager = require('../database-manager');

const router = express.Router();

// GET /api/sku/next
router.get('/next', async (req, res) => {
    const { depId, subId } = req.query;
    if (!depId || !subId) return res.status(400).json({ error: 'Department and Subdepartment IDs are required.' });

    const db = databaseManager.getActiveDb();
    const run = util.promisify(db.run.bind(db));
    const get = util.promisify(db.get.bind(db));

    try {
        await run('BEGIN TRANSACTION');
        let sequence = await get('SELECT last_number FROM product_sequences WHERE department_id = ? AND subdepartment_id = ?', [depId, subId]);
        
        if (!sequence) {
            await run('INSERT INTO product_sequences (department_id, subdepartment_id, last_number) VALUES (?, ?, 0)', [depId, subId]);
            sequence = { last_number: 0 };
        }

        const newNumber = sequence.last_number + 1;
        await run('UPDATE product_sequences SET last_number = ? WHERE department_id = ? AND subdepartment_id = ?', [newNumber, depId, subId]);
        
        const dep = await get('SELECT abbreviation FROM departments WHERE id = ?', [depId]);
        const sub = await get('SELECT abbreviation FROM subdepartments WHERE id = ?', [subId]);

        if (!dep || !sub) throw new Error('Department or Subdepartment not found.');

        const baseSku = `${dep.abbreviation}-${sub.abbreviation}-${String(newNumber).padStart(3, '0')}`;
        
        await run('COMMIT');
        res.json({ nextSku: baseSku, nextNumber: newNumber });

    } catch (error) {
        await run('ROLLBACK');
        res.status(500).json({ error: `Failed to generate SKU: ${error.message}` });
    }
});

// GET /api/sku/preview
router.get('/preview', async (req, res) => {
    const { depId, subId } = req.query;
    if (!depId || !subId) return res.status(400).json({ error: 'Department and Subdepartment IDs are required.' });

    try {
        const db = databaseManager.getActiveDb();
        const get = util.promisify(db.get.bind(db));

        let sequence = await get('SELECT last_number FROM product_sequences WHERE department_id = ? AND subdepartment_id = ?', [depId, subId]);
        const lastNumber = sequence ? sequence.last_number : 0;
        const nextNumber = lastNumber + 1;

        const dep = await get('SELECT abbreviation FROM departments WHERE id = ?', [depId]);
        const sub = await get('SELECT abbreviation FROM subdepartments WHERE id = ?', [subId]);

        if (!dep || !sub) return res.status(404).json({ error: 'Department or Subdepartment not found.' });

        const baseSku = `${dep.abbreviation}-${sub.abbreviation}-${String(nextNumber).padStart(3, '0')}`;
        res.json({ nextSku: baseSku, nextNumber });
    } catch (error) {
        res.status(500).json({ error: `Failed to preview SKU: ${error.message}` });
    }
});

module.exports = router;
