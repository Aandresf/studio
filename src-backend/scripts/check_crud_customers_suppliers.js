const fs = require('fs');
const path = require('path');
const { getStoresConfig, getActiveDb, setActiveStore } = require('../database-manager');
const sqlite3 = require('sqlite3').verbose();
const fetch = require('node-fetch');

async function listTablesAndDDL(db) {
  return new Promise((resolve, reject) => {
    db.all("SELECT name, sql FROM sqlite_master WHERE type='table' ORDER BY name", (err, rows) => {
      if (err) return reject(err);
      resolve(rows.filter(r => r.name));
    });
  });
}

async function run() {
  try {
    const config = getStoresConfig();
    const active = config.activeStoreId;
    if (!active) {
      console.error('No hay tienda activa configurada en stores.json.');
      process.exit(1);
    }

    const db = getActiveDb();

    console.log('Listando tablas y DDL relevantes...');
    const tables = await listTablesAndDDL(db);
    const names = tables.map(t => t.name);
    console.log('Tablas presentes (parcial):', names.filter(n => /customers|suppliers|sales|purchases|transactions|inventory_movements/.test(n)).join(', '));

    const cust = tables.find(t => t.name === 'customers');
    const sup = tables.find(t => t.name === 'suppliers');
    console.log('\nDDL customers:\n', cust ? cust.sql : 'NO EXISTE');
    console.log('\nDDL suppliers:\n', sup ? sup.sql : 'NO EXISTE');

    // Intentar CRUD directo en DB para customers
    console.log('\nProbando CRUD directo en DB para customers...');
    await new Promise((res, rej) => {
      db.run("INSERT INTO customers (name, document, email, phone, address, notes, updated_at) VALUES (?,?,?,?,?,?,datetime('now'))", ['Cliente PRUEBA', 'V-00000000', 'test@local', '0000', 'Dirección', 'Notas de prueba'], function(err) {
        if (err) return rej(err);
        const id = this.lastID;
        console.log('Inserted customer id=', id);
        db.get('SELECT * FROM customers WHERE id = ?', [id], (err2, row) => {
          if (err2) return rej(err2);
          console.log('Read customer:', row);
          db.run('UPDATE customers SET phone = ? WHERE id = ?', ['9999', id], (err3) => {
            if (err3) return rej(err3);
            db.get('SELECT phone FROM customers WHERE id = ?', [id], (err4, r2) => {
              if (err4) return rej(err4);
              console.log('Updated phone:', r2.phone);
              db.run('DELETE FROM customers WHERE id = ?', [id], (err5) => {
                if (err5) return rej(err5);
                console.log('Deleted customer id=', id);
                res();
              });
            });
          });
        });
      });
    }).catch(e => { throw e; });

    // CRUD directo en suppliers
    console.log('\nProbando CRUD directo en DB para suppliers...');
    await new Promise((res, rej) => {
      db.run("INSERT INTO suppliers (name, document, email, phone, address, notes, updated_at) VALUES (?,?,?,?,?,?,datetime('now'))", ['Proveedor PRUEBA', 'J-00000000', 'sup@local', '1111', 'Dir sup', 'Notas sup'], function(err) {
        if (err) return rej(err);
        const id = this.lastID;
        console.log('Inserted supplier id=', id);
        db.get('SELECT * FROM suppliers WHERE id = ?', [id], (err2, row) => {
          if (err2) return rej(err2);
          console.log('Read supplier:', row);
          db.run('UPDATE suppliers SET phone = ? WHERE id = ?', ['8888', id], (err3) => {
            if (err3) return rej(err3);
            db.get('SELECT phone FROM suppliers WHERE id = ?', [id], (err4, r2) => {
              if (err4) return rej(err4);
              console.log('Updated supplier phone:', r2.phone);
              db.run('DELETE FROM suppliers WHERE id = ?', [id], (err5) => {
                if (err5) return rej(err5);
                console.log('Deleted supplier id=', id);
                res();
              });
            });
          });
        });
      });
    }).catch(e => { throw e; });

    // Si el backend está corriendo, intentar llamadas HTTP CRUD
    const base = 'http://localhost:3001/api';
    try {
      console.log('\nProbando endpoints HTTP (si el backend está activo)...');
      const r1 = await fetch(base + '/customers', { method: 'POST', body: JSON.stringify({ name: 'Cliente HTTP', email: 'http@local' }), headers: { 'Content-Type': 'application/json' } });
      if (r1.ok) {
        const created = await r1.json();
        console.log('HTTP created customer:', created);
        const id = created.id || created.lastID || created.id;
        const r2 = await fetch(base + `/customers/${id}`);
        console.log('HTTP read:', await r2.json());
        await fetch(base + `/customers/${id}`, { method: 'PUT', body: JSON.stringify({ phone: '2222' }), headers: { 'Content-Type': 'application/json' } });
        await fetch(base + `/customers/${id}`, { method: 'DELETE' });
        console.log('HTTP CRUD customers OK');
      } else {
        console.log('POST /customers responded:', r1.status);
      }
    } catch (e) {
      console.log('No se pudo contactar el backend HTTP (¿está corriendo?)', e.message || e);
    }

    console.log('\nComprobaciones finalizadas.');
    process.exit(0);
  } catch (err) {
    console.error('Error durante las comprobaciones:', err.message || err);
    process.exit(2);
  }
}

run();
