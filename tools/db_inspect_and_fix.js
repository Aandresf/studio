#!/usr/bin/env node
// tools/db_inspect_and_fix.js
// Inspecciona la DB activa y busca referencias a "brands_old"; opcionalmente crea un shim o dropea objetos.
// Uso:
//   node tools\db_inspect_and_fix.js           -> intenta detectar DB y muestra referencias
//   node tools\db_inspect_and_fix.js --db path\to\db.db
//   node tools\db_inspect_and_fix.js --shim --db path\to\db.db   -> crea temporal brands_old AS SELECT * FROM brands
//   node tools\db_inspect_and_fix.js --drop trigger_or_view_name --db path\to\db.db

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function runSqlite(dbPath, sql) {
  try {
    const out = execFileSync('sqlite3', [dbPath, sql], { encoding: 'utf8' });
    return out.trim();
  } catch (err) {
    throw new Error('Failed to run sqlite3. Ensure sqlite3 is installed and in PATH. ' + err.message);
  }
}

function detectDbFromStores() {
  const storesJsonPath = path.join(__dirname, '..', 'src-backend', 'data', 'stores.json');
  if (fs.existsSync(storesJsonPath)) {
    try {
      const s = JSON.parse(fs.readFileSync(storesJsonPath, 'utf8'));
      const active = s.activeStoreId || (s.stores && s.stores[0] && s.stores[0].id);
      if (!active) return null;
      const store = (s.stores || []).find(x => x.id === active) || (s.stores && s.stores[0]);
      if (!store) return null;
      const dbPath = path.join(__dirname, '..', 'src-backend', 'data', store.dbPath);
      if (fs.existsSync(dbPath)) return dbPath;
    } catch (e) {
      return null;
    }
  }
  // fallback common file seen in repo
  const fallback = path.join(__dirname, '..', 'src-backend', 'data', 'database_disveliz_diaz_studio_848V.db');
  if (fs.existsSync(fallback)) return fallback;
  return null;
}

function printUsage() {
  console.log('Usage: node tools\\db_inspect_and_fix.js [--db path] [--shim] [--drop name]');
  process.exit(1);
}

const args = process.argv.slice(2);
let dbArg = null;
let doShim = false;
let dropName = null;
let fixMode = null; // 'shim' or 'recreate-products'
for (let i=0;i<args.length;i++){
  const a = args[i];
  if (a === '--db') { dbArg = args[++i]; }
  else if (a === '--shim') doShim = true;
  else if (a === '--drop') { dropName = args[++i]; }
  else if (a === '--fix') { fixMode = args[++i]; }
  else if (a === '--help') printUsage();
}

const dbPath = dbArg ? path.resolve(dbArg) : detectDbFromStores();
if (!dbPath) {
  console.error('Could not detect DB path. Provide --db path or ensure src-backend/data/stores.json is configured.');
  process.exit(2);
}
if (!fs.existsSync(dbPath)) {
  console.error('DB file not found:', dbPath);
  process.exit(2);
}

console.log('Using DB:', dbPath);

try {
  // 1) buscar referencias a brands_old en sqlite_master
  const q1 = `SELECT name || '|' || type || '|' || sql FROM sqlite_master WHERE sql LIKE '%brands_old%';`;
  const r1 = runSqlite(dbPath, q1);
  if (!r1) console.log('No references to brands_old found in sqlite_master.');
  else {
    console.log('Found references to brands_old:');
    r1.split('\n').forEach(line => console.log('  ', line));
  }

  // 2) listar triggers y views
  const q2 = `SELECT name || '|' || type || '|' || sql FROM sqlite_master WHERE type IN ('trigger','view') ORDER BY type;`;
  const r2 = runSqlite(dbPath, q2);
  console.log('\nTriggers/Views:');
  if (!r2) console.log('  (none)'); else r2.split('\n').forEach(line => console.log('  ', line));

  // 3) opcional: crear shim
  if (doShim || fixMode === 'shim') {
    console.log('\nCreating shim table brands_old AS SELECT * FROM brands;');
    const createSql = `CREATE TABLE IF NOT EXISTS brands_old AS SELECT * FROM brands;`;
    const res = runSqlite(dbPath, createSql + "; SELECT 'OK';");
    console.log('Shim create result:', res.split('\n').pop());
  }

  // 4) opcional: dropear objeto
  if (dropName) {
    console.log(`\nDropping object named ${dropName} if exists (tries trigger, view).`);
    try {
      runSqlite(dbPath, `DROP TRIGGER IF EXISTS ${dropName};`);
      runSqlite(dbPath, `DROP VIEW IF EXISTS ${dropName};`);
      console.log('Drop attempted (check sqlite_master to confirm)');
    } catch (e) {
      console.error('Error dropping object:', e.message);
    }
  }

  // 5) opcion: recreate-products -> safe migration to change FK from brands_old to brands
  if (fixMode === 'recreate-products') {
    console.log('\nRunning recreate-products migration (this will backup DB and modify products table).');
    const backupPath = dbPath + '.before_recreate_products.' + Date.now() + '.bak';
    fs.copyFileSync(dbPath, backupPath);
    console.log('Backup created at', backupPath);

    // 5.1 get triggers for products
    const triggersSql = `SELECT name || '|' || sql FROM sqlite_master WHERE type='trigger' AND tbl_name='products';`;
    const triggersOut = runSqlite(dbPath, triggersSql);
    const triggers = triggersOut ? triggersOut.split('\n').map(l => { const i = l.indexOf('|'); return { name: l.slice(0,i), sql: l.slice(i+1) }; }) : [];
    if (triggers.length) console.log('Found product triggers:', triggers.map(t=>t.name).join(', '));

    // Drop triggers
    for (const t of triggers) {
      try { runSqlite(dbPath, `DROP TRIGGER IF EXISTS ${t.name};`); console.log('Dropped trigger', t.name); } catch(e) { console.warn('Failed to drop trigger', t.name, e.message); }
    }

    // Build SQL to create new table and migrate
    const createNew = `\nBEGIN TRANSACTION;\n` +
      `CREATE TABLE products_new (\n` +
      `  id INTEGER PRIMARY KEY AUTOINCREMENT,\n` +
      `  name TEXT NOT NULL,\n` +
      `  base_sku TEXT UNIQUE,\n` +
      `  description TEXT DEFAULT '',\n` +
      `  department_id INTEGER,\n` +
      `  subdepartment_id INTEGER,\n` +
      `  brand_id INTEGER,\n` +
      `  status TEXT NOT NULL DEFAULT 'Activo',\n` +
      `  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),\n` +
      `  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),\n` +
      `  FOREIGN KEY (brand_id) REFERENCES brands (id) ON DELETE SET NULL,\n` +
      `  FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE SET NULL,\n` +
      `  FOREIGN KEY (subdepartment_id) REFERENCES subdepartments (id) ON DELETE SET NULL\n` +
      `);\n` +
      `INSERT INTO products_new (id, name, base_sku, description, department_id, subdepartment_id, brand_id, status, created_at, updated_at) SELECT id, name, base_sku, description, department_id, subdepartment_id, brand_id, status, created_at, updated_at FROM products;\n` +
      `DROP TABLE products;\n` +
      `ALTER TABLE products_new RENAME TO products;\n` +
      `COMMIT;`;

    try {
      runSqlite(dbPath, createNew);
      console.log('Migration executed.');
    } catch (e) {
      console.error('Migration failed:', e.message);
      console.error('DB backup left at', backupPath);
      process.exit(4);
    }

    // Recreate triggers
    for (const t of triggers) {
      try {
        if (t.sql && t.sql.trim()) runSqlite(dbPath, t.sql);
        console.log('Recreated trigger', t.name);
      } catch (e) {
        console.warn('Failed to recreate trigger', t.name, e.message);
      }
    }

    console.log('Recreate-products finished.');
  }

  console.log('\nDone.');
} catch (err) {
  console.error('Error:', err.message);
  process.exit(3);
}
