const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');
const sqlite3 = require('sqlite3').verbose();
const { nanoid } = require('nanoid');
const { generateInventoryExcel } = require('./excel-generator.js');
const { subDays, formatISO } = require('date-fns');

const util = require('util');
const databaseManager = require('./database-manager');
const { dataDir } = require('./config');
const QRCode = require('qrcode');

const isTestEnv = process.env.NODE_ENV === 'test';

const app = express();
const PORT = process.env.PORT || 3001;
// Host to bind to. Priority: ENV vars (API_HOST/HOST) > data/.env BIND_IP > default 0.0.0.0
let HOST = process.env.API_HOST || process.env.HOST || null;
try {
  if (!HOST) {
    const envPath = path.join(__dirname, 'data', '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.split(/\r?\n/).map(l => l.trim()).find(l => l && !l.startsWith('#') && l.startsWith('BIND_IP='));
      if (match) {
        const val = match.split('=')[1].trim();
        if (val) HOST = val;
      }
    }
  }
} catch (e) {
  // ignore file read errors
}
if (!HOST) HOST = '0.0.0.0';

function normalizeAddress(addr) {
  if (!addr) return null;
  // strip IPv6 prefix for IPv4-mapped addresses like ::ffff:192.168.1.42
  if (addr.startsWith('::ffff:')) return addr.split('::ffff:').pop();
  return addr;
}

function getLocalIp(preferred) {
  // If preferred was provided (e.g., req.socket.localAddress), prefer it when it's a non-internal IPv4
  const ifaces = os.networkInterfaces();
  const preferredNormalized = normalizeAddress(String(preferred || ''));
  if (preferredNormalized) {
    for (const name of Object.keys(ifaces)) {
      for (const iface of ifaces[name]) {
        if (iface.address === preferredNormalized && iface.family === 'IPv4' && !iface.internal) return iface.address;
      }
    }
    // if not found in interfaces, still return the normalized preferred value (it may be valid)
    return preferredNormalized;
  }

  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return null;
}

function listLocalInterfaces() {
  const ifaces = os.networkInterfaces();
  const results = [];
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      results.push({ name, address: iface.address, family: iface.family, internal: !!iface.internal });
    }
  }
  return results;
}

function choosePreferredIp(ifaceList, connectionLocal) {
  // Normalize
  const conn = normalizeAddress(connectionLocal || '');
  // 1) if connectionLocal present and matches an interface, prefer it
  if (conn) {
    const found = ifaceList.find(i => normalizeAddress(String(i.address)) === conn && i.family === 'IPv4' && !i.internal);
    if (found) return found.address;
  }
  // 2) prefer common wifi interface names
  const wifiNames = ['wlan0', 'wlan', 'wi-fi', 'wifi', 'wl0', 'wlan1', 'en0'];
  for (const name of wifiNames) {
    const found = ifaceList.find(i => i.name && i.name.toLowerCase().includes(name) && i.family === 'IPv4' && !i.internal);
    if (found) return found.address;
  }
  // 3) first non-internal IPv4
  const firstIPv4 = ifaceList.find(i => i.family === 'IPv4' && !i.internal);
  if (firstIPv4) return firstIPv4.address;
  // 4) any first non-internal
  const firstNonInternal = ifaceList.find(i => !i.internal);
  if (firstNonInternal) return firstNonInternal.address;
  return null;
}

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

// Server info endpoint: devuelve la IP local detectada y host/port usados por el servidor
app.get('/api/server-info', (req, res) => {
  try {
  // Determine which local interface is handling this request (useful when multiple NICs exist)
  const connLocal = normalizeAddress(req.socket && req.socket.localAddress ? String(req.socket.localAddress) : null);
  const ip = getLocalIp(connLocal);
    const port = PORT;
    const host = HOST;
  // Try to infer frontend origin from request headers (Origin preferred, then Host)
  const frontendOrigin = req.headers.origin || (req.protocol ? `${req.protocol}://${req.headers.host}` : `http://${req.headers.host}`) || null;
  const url = `http://${ip || 'localhost'}:${port}`;
  const interfaces = listLocalInterfaces();
  const preferredIp = choosePreferredIp(interfaces, connLocal);
  res.json({ ip, preferredIp, interfaces, host, port, url, frontendOrigin, connectionLocalAddress: connLocal || null, clientRemoteAddress: normalizeAddress(req.socket && req.socket.remoteAddress ? String(req.socket.remoteAddress) : null) });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo obtener la información del servidor' });
  }
});

// QR image generation endpoint: returns PNG image for given data (query param `data`)
app.get('/api/qr', async (req, res) => {
  try {
  // Prefer explicit `data` query param. If missing, prefer request Origin (frontend origin) and then fall back to local IP:PORT
  const preferredFromReq = req.headers.origin || null;
  // compute preferred ip from interfaces and connection info
  const connLocal = normalizeAddress(req.socket && req.socket.localAddress ? String(req.socket.localAddress) : null);
  const interfaces = listLocalInterfaces();
  const preferredIp = choosePreferredIp(interfaces, connLocal) || getLocalIp(connLocal) || 'localhost';
  const defaultTarget = `http://${preferredIp}:${PORT}`;
  const data = String(req.query.data || preferredFromReq || defaultTarget);
    // Generate PNG buffer
    const buffer = await QRCode.toBuffer(data, { width: 300 });
    res.type('image/png');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.send(buffer);
  } catch (err) {
    console.error('Error generating QR:', err && err.message);
    return res.status(500).json({ error: 'Error generating QR' });
  }
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
  server = app.listen(PORT, HOST, () => {
    if (!isTestEnv) {
      const hostForLog = (HOST === '0.0.0.0' || HOST === '::') ? (getLocalIp() || '0.0.0.0') : HOST;
      console.log(`Backend server listening on http://${hostForLog}:${PORT} (bound to ${HOST})`);
      
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