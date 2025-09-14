const databaseManager = require('../src-backend/database-manager');

async function run() {
  const db = databaseManager.getActiveDb();
  const key = 'catalog:manage';
  try {
    const row = await getSql(db, 'SELECT id FROM permissions WHERE key = ?', [key]);
    if (row) {
      console.log(`Permiso '${key}' ya existe (id=${row.id}).`);
      process.exit(0);
    }

    const res = await runSql(db, 'INSERT INTO permissions (key) VALUES (?)', [key]);
    console.log(`Permiso '${key}' insertado con id=${res.lastID}.`);
    process.exit(0);
  } catch (err) {
    console.error('Error asegurando permiso:', err);
    process.exit(1);
  }
}

function runSql(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function getSql(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

run();
