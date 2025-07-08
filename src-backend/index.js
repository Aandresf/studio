const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Determinar el archivo de la base de datos. Usar una base de datos en memoria para las pruebas.
const isTestEnv = process.env.NODE_ENV === 'test';
const DB_FILE = isTestEnv ? ':memory:' : path.join(__dirname, 'database.db');

// Conexión a la base de datos
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error('Error al abrir la base de datos', err.message);
  } else {
    console.log(`Conexión exitosa con la base de datos: ${DB_FILE}`);
  }
});

// --- Endpoints de la API ---

// GET /api/products
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products ORDER BY name', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// POST /api/products
app.post('/api/products', (req, res) => {
  const { name, sku, current_stock, average_cost } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'El campo "name" es requerido.' });
  }
  const sql = `INSERT INTO products (name, sku, current_stock, average_cost) VALUES (?, ?, ?, ?)`;
  const params = [name, sku || null, parseFloat(current_stock || 0), parseFloat(average_cost || 0)];
  db.run(sql, params, function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({ id: this.lastID, name, sku, current_stock, average_cost });
  });
});

// Iniciar el servidor y la base de datos
const server = app.listen(PORT, () => {
  // No registrar en el entorno de prueba para mantener los logs limpios
  if (!isTestEnv) {
    console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
  }
  // Inicializar el esquema de la base de datos desde el archivo SQL
  const SQL_SETUP_FILE = path.join(__dirname, 'database.sql');
  const sql = fs.readFileSync(SQL_SETUP_FILE, 'utf8');
  db.exec(sql, (err) => {
    if (err && !err.message.includes('already exists')) {
      console.error('Error al ejecutar database.sql:', err.message);
    } else if (!isTestEnv) {
      console.log('Base de datos inicializada correctamente.');
    }
  });
});

// Cierre controlado
const shutdown = () => {
  server.close(() => {
    if (!isTestEnv) console.log('Servidor cerrado.');
    db.close((err) => {
      if (err) {
        return console.error(err.message);
      }
      if (!isTestEnv) console.log('Conexión de la base de datos cerrada.');
      process.exit(0);
    });
  });
};

process.on('SIGINT', shutdown);

// Exportar la app, el servidor y la BD para poder usarlos en las pruebas
module.exports = { app, server, db, shutdown };