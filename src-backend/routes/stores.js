const express = require('express');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { nanoid } = require('nanoid');

const router = express.Router();
const { requirePermission, requireAnyPermission } = require('../lib/authorize');

const { dataDir, schemaPath } = require('../config');
const databaseManager = require('../database-manager');

// GET / - list stores (filters out deleted)
router.get('/', (req, res) => {
    try {
        const config = databaseManager.getStoresConfig();
        const activeStores = config.stores.filter(s => s.status === 'active' || s.status === undefined);
        res.json({ ...config, stores: activeStores });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /:id - mark store deleted (cannot delete last active store)
router.delete('/:id', requirePermission('stores:delete'), (req, res) => {
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

// POST /active - set active store
router.post('/active', requirePermission('stores:set_active'), (req, res) => {
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

// POST / - create a new store
router.post('/', requirePermission('stores:create'), async (req, res) => {
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

// GET /:id/details - read store settings
router.get('/:id/details', (req, res) => {
    const { id } = req.params;
    const settingsPath = path.join(dataDir, `database_${id}_settings.json`);
    if (fs.existsSync(settingsPath)) {
        const settings = fs.readFileSync(settingsPath, 'utf8');
        res.json(JSON.parse(settings));
    } else {
        res.json({});
    }
});

// PUT /:id/details - write store settings
router.put('/:id/details', requireAnyPermission('settings:edit', 'settings:advanced'), (req, res) => {
    const { id } = req.params;
    const settingsPath = path.join(dataDir, `database_${id}_settings.json`);
    try {
        fs.writeFileSync(settingsPath, JSON.stringify(req.body, null, 2));
        res.json({ message: 'Detalles de la tienda actualizados correctamente.' });
    } catch (error) {
        res.status(500).json({ error: `Error al guardar los detalles: ${error.message}` });
    }
});

module.exports = router;
