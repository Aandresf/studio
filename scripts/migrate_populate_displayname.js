const databaseManager = require('../src-backend/database-manager');
const db = databaseManager.getActiveDb();

function allSql(sql, params=[]) {
  return new Promise((resolve, reject) => db.all(sql, params, (e, rows) => e ? reject(e) : resolve(rows)));
}
function runSql(sql, params=[]) {
  return new Promise((resolve, reject) => db.run(sql, params, function(e) { if (e) return reject(e); resolve(this); }));
}

(async function(){
  try {
    const users = await allSql('SELECT id, name, username, display_name FROM users');
    const taken = new Set((await allSql('SELECT username FROM users WHERE username IS NOT NULL')).map(r=>r.username));

    for (const u of users) {
      let base = (u.name || u.display_name || u.username || 'user').toString().trim();
      // normalize base to simple username
      let candidate = base.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g,'').toLowerCase();
      if (!candidate) candidate = 'user';
      let final = candidate;
      let i = 1;
      while (taken.has(final)) {
        final = `${candidate}_${i++}`;
      }
      taken.add(final);

      const display = u.display_name || u.name || final;

      await runSql('UPDATE users SET username = ?, display_name = ? WHERE id = ?', [final, display, u.id]);
      console.log('Updated', u.id, '->', final, display);
    }

    console.log('Migration completed');
    process.exit(0);
  } catch (e) {
    console.error('Migration failed', e);
    process.exit(1);
  }
})();
