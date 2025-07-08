const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3001; // Puerto para nuestro backend

// Middleware para permitir peticiones de otros orígenes (nuestro frontend) y para parsear JSON
app.use(cors());
app.use(express.json());

const DB_FILE = path.join(__dirname, 'database.db');
const SQL_SETUP_FILE = path.join(__dirname, 'database.sql');

// Conexión a la base de datos SQLite
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error('Error al abrir la base de datos', err.message);
    return;
  }
  console.log('Conexión exitosa con la base de datos', DB_FILE);

  // Ejecutar el script de configuración SQL
  const sql = fs.readFileSync(SQL_SETUP_FILE, 'utf8');
  db.exec(sql, (err) => {
    if (err) {
      // Este error es esperado si las tablas ya existen, así que no es crítico.
      if (!err.message.includes('already exists')) {
        console.error('Error al ejecutar database.sql:', err.message);
      }
    } else {
      console.log('Base de datos inicializada correctamente.');
    }

    // Una vez que la BD está lista, iniciamos el servidor Express
    app.listen(PORT, () => {
      console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
    });
  });
});

// --- Endpoints de la API ---

// GET /api/products - Obtener todos los productos
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products ORDER BY name', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// POST /api/products - Añadir un nuevo producto
app.post('/api/products', (req, res) => {
  // Ajustado para que coincida con el esquema de database.sql
  const { name, sku, current_stock, average_cost } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'El campo "name" es requerido.' });
  }

  const sql = `INSERT INTO products (name, sku, current_stock, average_cost) VALUES (?, ?, ?, ?)`;
  const params = [
    name,
    sku || null,
    parseFloat(current_stock || 0),
    parseFloat(average_cost || 0),
  ];

  db.run(sql, params, function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // Devolvemos el objeto recién creado con su nuevo ID
    res.status(201).json({ id: this.lastID, name, sku, current_stock, average_cost });
  });
});

// Cierre controlado: cerrar la conexión a la BD cuando se detiene el servidor
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Conexión de la base de datos cerrada.');
    process.exit(0);
  });
});
