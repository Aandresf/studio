const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/database_disveliz_diaz_studio_848V.db');
console.log('DB PATH:', dbPath);
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) return console.error('OPEN ERR', err.message);
});

function q(sql) {
  return new Promise((res, rej) => db.all(sql, (err, rows) => err ? rej(err) : res(rows)));
}

(async () => {
  try {
    console.log('PRAGMA foreign_keys:');
    const fk = await q("PRAGMA foreign_keys;");
    console.log(fk);

    console.log('\nroles:');
    console.log(await q('SELECT id, name FROM roles ORDER BY id'));

    console.log('\npermissions:');
    console.log(await q('SELECT id, key FROM permissions ORDER BY id'));

    console.log('\nrole_permissions:');
    console.log(await q('SELECT role_id, permission_id FROM role_permissions ORDER BY role_id'));

    console.log('\nuser_permissions (sample 20):');
    console.log(await q('SELECT user_id, permission_id FROM user_permissions ORDER BY user_id LIMIT 20'));

    console.log('\nCount permissions:');
    const pcount = await q('SELECT COUNT(*) as c FROM permissions');
    console.log(pcount[0]);

    console.log('\nAny orphaned role_permissions (permission_id not in permissions)?');
    const orphan = await q("SELECT rp.* FROM role_permissions rp LEFT JOIN permissions p ON p.id = rp.permission_id WHERE p.id IS NULL");
    console.log(orphan);

  } catch (err) {
    console.error('ERR', err);
  } finally {
    db.close();
  }
})();
