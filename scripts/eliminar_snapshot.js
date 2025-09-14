

const util = require('util');
const databaseManager = require('../src-backend/database-manager');

// NOTA: Cambia esta fecha a la fecha exacta del snapshot que quieres eliminar.
const SNAPSHOT_DATE_TO_DELETE = '2024-11-30'; 

async function deleteSnapshot() {
    console.log(`--- Eliminando snapshot para la fecha: ${SNAPSHOT_DATE_TO_DELETE} ---`);
    
    const db = databaseManager.getActiveDb();
    const run = util.promisify(db.run.bind(db));

    try {
        await run('BEGIN TRANSACTION');

        const sql = `DELETE FROM inventory_snapshots WHERE snapshot_date = ?`;
        
        // Usamos 'this' de la función de callback, por lo que no podemos usar arrow function aquí.
        const result = await new Promise((resolve, reject) => {
            db.run(sql, [SNAPSHOT_DATE_TO_DELETE], function(err) {
                if (err) return reject(err);
                resolve(this);
            });
        });

        await run('COMMIT');

        if (result.changes > 0) {
            console.log(`\n¡Éxito! Se eliminaron ${result.changes} registros del snapshot.`);
        } else {
            console.log(`\nNo se encontraron registros para la fecha ${SNAPSHOT_DATE_TO_DELETE}. No se realizó ningún cambio.`);
        }

    } catch (error) {
        console.error('\nError durante la eliminación. Revirtiendo cambios...', error);
        try {
            await run('ROLLBACK');
        } catch (rollbackErr) {
            console.error('¡Error fatal al revertir!', rollbackErr);
        }
    } finally {
        databaseManager.closeAllConnections();
    }
}

deleteSnapshot();

