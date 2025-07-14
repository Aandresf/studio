// migrate_sales_price.js
// Script de un solo uso para corregir los precios de las ventas antiguas.
// Copia el valor de `unit_cost` a la columna `price` para los movimientos de 'SALIDA'.

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_FILE = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(DB_FILE, (err) => {
    if (err) {
        console.error('Error al abrir la base de datos', err.message);
        return;
    }
    console.log(`Conectado a la base de datos SQLite: ${DB_FILE}`);
    runMigration();
});

async function runMigration() {
    console.log('Iniciando migración de precios de ventas antiguas...');

    const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
        db.run(sql, params, function(err) { err ? reject(err) : resolve(this) });
    });

    try {
        const result = await dbRun(
            `UPDATE inventory_movements 
             SET price = unit_cost 
             WHERE type = 'SALIDA' AND price IS NULL AND unit_cost IS NOT NULL;`
        );

        if (result.changes > 0) {
            console.log(`¡Éxito! Se actualizaron los precios de ${result.changes} movimientos de venta antiguos.`);
        } else {
            console.log('No se encontraron ventas antiguas que necesitaran actualización de precio.');
        }

    } catch (err) {
        console.error('\nOcurrió un error durante la migración de precios:', err.message);
    } finally {
        db.close((err) => {
            if (err) {
                console.error('Error al cerrar la base de datos.', err.message);
            } else {
                console.log('Conexión con la base de datos cerrada.');
            }
        });
    }
}
