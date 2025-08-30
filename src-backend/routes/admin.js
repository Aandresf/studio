const express = require('express');
const fs = require('fs');
const path = require('path');
const databaseManager = require('../database-manager');
const { dataDir } = require('../config');

const router = express.Router();
const { requirePermission } = require('../lib/authorize');

const SETTINGS_FILE = path.join(__dirname, '..', 'settings.json');

router.get('/settings/store', (req, res) => {
    fs.readFile(SETTINGS_FILE, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') return res.json({});
            return res.status(500).json({ error: err.message });
        }
        res.json(JSON.parse(data));
    });
});

router.put('/settings/store', requirePermission('settings:edit'), (req, res) => {
    fs.writeFile(SETTINGS_FILE, JSON.stringify(req.body, null, 2), (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Settings updated successfully' });
    });
});

router.post('/database/backup', requirePermission('admin:backup'), (req, res) => {
    try {
        const storesConfig = databaseManager.getStoresConfig();
        const activeStore = storesConfig.stores.find(s => s.id === storesConfig.activeStoreId);
        if (!activeStore) return res.status(400).json({ error: 'No active store selected or store not found.' });

        const dbPath = path.join(dataDir, activeStore.dbPath);
        const backupPath = path.join(__dirname, '..', `backup-${Date.now()}.db`);

        const src = fs.createReadStream(dbPath);
        const dest = fs.createWriteStream(backupPath);
        src.pipe(dest);
        src.on('end', () => res.json({ message: `Backup created at ${backupPath}` }));
        src.on('error', (err) => res.status(500).json({ error: err.message }));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/database/restore', requirePermission('admin:restore'), (req, res) => {
    res.status(511).json({ message: 'Restore functionality not fully implemented.' });
});

module.exports = router;
