const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { nanoid } = require('nanoid');
const { generateInventoryExcel } = require('./excel-generator.js');
const { subDays, formatISO } = require('date-fns');

const util = require('util');
const databaseManager = require('./database-manager');
const { dataDir } = require('./config');

const isTestEnv = process.env.NODE_ENV === 'test';

const app = express();
const PORT = 3001;

// Middleware for JSON body parsing and CORS
// Allow credentials so HttpOnly session cookie can be sent from the frontend.
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Attach current user (from session cookie / JWT) to every request
app.use(require('./middleware/auth'));

// Health check endpoint used by the frontend to wait for the backend
app.get('/api/health', (req, res) => {
  res.status(200).json({ ok: true });
});

// Middleware
// --- PRODUCTS (migrado a routes/products.js) ---
app.use('/api/products', require('./routes/products'));

// --- ATTRIBUTES API (migrado a routes/attributes.js) ---
app.use('/api/attributes', require('./routes/attributes'));

// --- DEPARTMENTS & SUBDEPARTMENTS (migrado a routes/departments.js) ---
app.use('/api/departments', require('./routes/departments'));
// --- BRANDS ---
app.use('/api/brands', require('./routes/brands'));
// --- STORES ---
app.use('/api/stores', require('./routes/stores'));
// Subdepartments route (compatibilidad)
app.use('/api/subdepartments', require('./routes/subdepartments'));
// Users and roles management
app.use('/api/users', require('./routes/users'));
// Role permissions management (solo API, protegido para master)
app.use('/api/role-permissions', require('./routes/role-permissions'));
// Authentication routes (login/logout)
app.use('/api/auth', require('./routes/auth'));
// --- INVENTORY (migrado a routes/inventory.js) ---
app.use('/api/inventory', require('./routes/inventory'));
// Purchases, Sales and Reports routers (migrated to routes/)
app.use('/api/purchases', require('./routes/purchases'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/reports', require('./routes/reports'));

// --- VARIANTS ---
app.use('/api/variants', require('./routes/variants'));

// --- SKU GENERATION API ---
app.use('/api/sku', require('./routes/sku'));

// --- TRANSACTION ANNULMENT API ---
app.use('/api/transactions', require('./routes/transactions'));

// --- PENDING TRANSACTIONS (ventas/compras en espera) ---
app.use('/api/pending-transactions', require('./routes/pending-transactions'));

// Customers & Suppliers
app.use('/api/customers', require('./routes/customers'));
app.use('/api/suppliers', require('./routes/suppliers'));

// PURCHASES (BATCH)
// purchases routes migrated to routes/purchases.js

// purchases routes migrated to routes/purchases.js


// sales routes migrated to routes/sales.js


// sales routes migrated to routes/sales.js


// reports routes migrated to routes/reports.js


app.use('/api/dashboard', require('./routes/dashboard'));

// Debugging endpoints
app.use('/api/debug', require('./routes/debug'));

// SETTINGS - Simplified: using a JSON file for settings for now.
const SETTINGS_FILE = path.join(__dirname, 'settings.json');

app.use('/api/admin', require('./routes/admin'));

// DATABASE BACKUP/RESTORE - Placeholder endpoints
// database backup/restore moved to /api/admin


// Server Initialization & Graceful Shutdown
let server;

const startServer = () => {
  server = app.listen(PORT, () => {
    if (!isTestEnv) {
      console.log(`Backend server listening on http://localhost:${PORT}`);
      
  try {
        const db = databaseManager.getActiveDb();
        db.serialize(() => {
          const sqlSetup = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
          db.exec(sqlSetup, (err) => {
            if (err && !err.message.includes('already exists')) {
              console.error('Error ejecutando schema.sql:', err.message);
            } else if (!isTestEnv) {
              console.log('Esquema de base de datos verificado/inicializado.');
            }
          });

          db.run(`
            CREATE TABLE IF NOT EXISTS document_counters (
              counter_type TEXT PRIMARY KEY,
              last_number INTEGER NOT NULL DEFAULT 0
            );
          `, (err) => {
            if (err) {
              console.error("Error creando la tabla document_counters:", err.message);
              return;
            }
            db.run("INSERT OR IGNORE INTO document_counters (counter_type, last_number) VALUES ('AUTO_PURCHASE', 0);");
            db.run("INSERT OR IGNORE INTO document_counters (counter_type, last_number) VALUES ('AUTO_SALE', 0);");
          });
        });
      } catch (error) {
        if (error.message.includes("No hay una tienda activa seleccionada")) {
            console.log("No hay tienda activa. Esperando la creación de la primera tienda desde la interfaz.");
        } else {
            console.error("Error fatal al inicializar la base de datos activa:", error.message);
            process.exit(1);
        }
      }
    }
  });
};

// Initialize default users and roles in the JSON file
try {
  require('./routes/init-default-users').ensureDefaults();
} catch (e) {
  console.error('No se pudo inicializar usuarios por defecto:', e.message);
}

const shutdown = (signal) => {
  if (!isTestEnv) console.log(`\n${signal} received. Shutting down gracefully...`);
  
  server.close(() => {
    if (!isTestEnv) console.log('HTTP server closed.');
    databaseManager.closeAllConnections();
    // Dar un pequeño margen para que las conexiones se cierren
    setTimeout(() => process.exit(0), 500);
  });

  // Force shutdown after a timeout
  setTimeout(() => {
    if (!isTestEnv) console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000); // 10 seconds
};

// Listen for termination signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start the server
startServer();

module.exports = { app, startServer, shutdown };