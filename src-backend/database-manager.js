// src-backend/database-manager.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const { dataDir } = require('./config'); // Importar la ruta de datos centralizada

const STORES_CONFIG_PATH = path.join(dataDir, 'stores.json');
const DB_DIR = dataDir;

// Asegurarse de que el directorio de datos exista
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

let activeStoreId = null;
const openConnections = new Map();

function getStoresConfig() {
    if (!fs.existsSync(STORES_CONFIG_PATH)) {
        // Si no hay config, se empieza con una configuración vacía.
        // El frontend guiará al usuario para crear la primera tienda.
        const defaultConfig = { stores: [], activeStoreId: null };
        fs.writeFileSync(STORES_CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
        return defaultConfig;
    }
    return JSON.parse(fs.readFileSync(STORES_CONFIG_PATH, 'utf8'));
}

// Función para guardar la configuración
function saveStoresConfig(config) {
    fs.writeFileSync(STORES_CONFIG_PATH, JSON.stringify(config, null, 2));
}

// Inicializar el activeStoreId desde la configuración
activeStoreId = getStoresConfig().activeStoreId;

// Función para obtener la conexión a la BD de la tienda activa
function getActiveDb() {
    if (!activeStoreId) {
        throw new Error("No hay una tienda activa seleccionada.");
    }

    if (openConnections.has(activeStoreId)) {
        return openConnections.get(activeStoreId);
    }

    const config = getStoresConfig();
    const storeInfo = config.stores.find(s => s.id === activeStoreId);

    if (!storeInfo) {
        throw new Error(`No se encontró la configuración para la tienda con ID: ${activeStoreId}`);
    }

    const dbPath = path.join(DB_DIR, storeInfo.dbPath);
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error(`Error al abrir la base de datos ${dbPath}:`, err.message);
            throw err;
        }
        console.log(`Conexión establecida con la base de datos: ${storeInfo.name} (${dbPath})`);
    });

    openConnections.set(activeStoreId, db);
    return db;
}

// Función para cambiar la tienda activa
function setActiveStore(storeId) {
    const config = getStoresConfig();
    const storeExists = config.stores.some(s => s.id === storeId);
    if (!storeExists) {
        throw new Error(`La tienda con ID ${storeId} no existe.`);
    }
    
    activeStoreId = storeId;
    config.activeStoreId = storeId;
    saveStoresConfig(config);
    
    console.log(`Tienda activa cambiada a: ${storeId}`);
    // No es necesario cerrar la conexión anterior, se puede mantener abierta.
    // La próxima llamada a getActiveDb() usará la nueva.
    return getActiveDb();
}

// Función para añadir una nueva tienda
function addStore(store) {
    const config = getStoresConfig();
    config.stores.push(store);
    saveStoresConfig(config);
}

// Función para cerrar todas las conexiones al apagar el servidor
function closeAllConnections() {
    console.log("Cerrando todas las conexiones de base de datos...");
    for (const [id, db] of openConnections.entries()) {
        db.close(err => {
            if (err) {
                console.error(`Error al cerrar la conexión para la tienda ${id}:`, err.message);
            } else {
                console.log(`Conexión para la tienda ${id} cerrada.`);
            }
        });
    }
}

module.exports = {
    getStoresConfig,
    saveStoresConfig,
    getActiveDb,
    setActiveStore,
    addStore,
    closeAllConnections
};
