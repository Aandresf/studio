const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_FILE = path.join(__dirname, 'database.db');
const SQL_SETUP_FILE = path.join(__dirname, 'database.sql');

const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error('Error al abrir la base de datos', err.message);
    return;
  }
  console.log('Conexión exitosa con la base de datos', DB_FILE);

  fs.readFile(SQL_SETUP_FILE, 'utf8', (err, sql) => {
    if (err) {
      console.error('Error al leer el archivo database.sql', err);
      return;
    }

    // Filtrar y ejecutar solo las sentencias CREATE TABLE
    const createTableStatements = sql.split(';').filter(cmd => cmd.trim().toUpperCase().startsWith('CREATE TABLE'));

    db.serialize(() => {
      db.run('PRAGMA foreign_keys = ON;', (err) => {
        if (err) console.error('Error al activar foreign keys', err.message);
      });

      createTableStatements.forEach(statement => {
        if (statement.trim()) {
          db.run(statement.trim() + ';', (err) => {
            if (err) {
              // Este error es esperado si la tabla ya existe, así que no es crítico.
              if (!err.message.includes('already exists')) {
                 console.error('Error al ejecutar sentencia:', statement, err.message);
              }
            }
          });
        }
      });

      console.log('Tablas creadas o ya existentes correctamente.');

      db.close((err) => {
        if (err) {
          console.error('Error al cerrar la base de datos', err.message);
        }
        console.log('Conexión de la base de datos cerrada.');
      });
    });
  });
});
