const dbm = require('../database-manager');
const fs = require('fs');
const path = require('path');

async function run() {
  const db = dbm.getActiveDb();
  try {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
    db.exec(sql, (err) => {
      if (err) {
        console.error('Error ejecutando schema.sql:', err.message);
        process.exit(1);
      }
      console.log('Migración: schema.sql ejecutado (incluye customers/suppliers).');
      process.exit(0);
    });
  } catch (err) {
    console.error('Error en migración:', err.message);
    process.exit(1);
  }
}

if (require.main === module) run();

module.exports = { run };
