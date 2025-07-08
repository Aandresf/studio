
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3');

module.exports = async () => {
  return new Promise((resolve, reject) => {
    const dbPath = path.join(__dirname, 'database.db');
    const schemaPath = path.join(__dirname, 'schema.sql');

    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }

    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) return reject(err);

      const schema = fs.readFileSync(schemaPath, 'utf8');
      db.exec(schema, (execErr) => {
        if (execErr) {
          db.close();
          return reject(execErr);
        }
        db.close((closeErr) => {
          if (closeErr) return reject(closeErr);
          console.log('\nTest database initialized from schema.sql.');
          resolve();
        });
      });
    });
  });
};
