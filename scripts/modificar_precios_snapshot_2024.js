const util = require('util');
const databaseManager = require('../src-backend/database-manager');

const SNAPSHOT_DATE = '2024-11-30';
const PERCENTAGE_INCREASE = 0.05784637203491623; // 5.7846372035%

async function applySnapshotModification() {
    console.log(`--- FASE DE EJECUCIÓN ---`);
    console.log(`Aplicando aumento de precios del ${(PERCENTAGE_INCREASE * 100).toFixed(8)}% al snapshot del ${SNAPSHOT_DATE}.`);
    
    const db = databaseManager.getActiveDb();
    const all = util.promisify(db.all.bind(db));
    const run = util.promisify(db.run.bind(db));

    try {
        await run('BEGIN TRANSACTION');

        const snapshotEntries = await all(
            `SELECT id, closing_average_cost 
             FROM inventory_snapshots 
             WHERE snapshot_date = ?`,
            [SNAPSHOT_DATE]
        );

        if (snapshotEntries.length === 0) {
            throw new Error(`No se encontró ningún snapshot para la fecha ${SNAPSHOT_DATE}.`);
        }

        console.log(`\nActualizando ${snapshotEntries.length} registros...`);

        for (const entry of snapshotEntries) {
            const new_cost = entry.closing_average_cost * (1 + PERCENTAGE_INCREASE);
            await run(
                'UPDATE inventory_snapshots SET closing_average_cost = ? WHERE id = ?',
                [new_cost, entry.id]
            );
        }

        await run('COMMIT');
        console.log('\n¡Actualización completada exitosamente!');
        console.log('Los precios en el snapshot han sido modificados de forma permanente.');

    } catch (error) {
        console.error('\nError durante la actualización. Revirtiendo cambios...', error);
        try {
            await run('ROLLBACK');
            console.log('La transacción ha sido revertida. La base de datos no ha sido modificada.');
        } catch (rollbackErr) {
            console.error('¡Error fatal! No se pudo revertir la transacción.', rollbackErr);
        }
    } finally {
        databaseManager.closeAllConnections();
    }
}

applySnapshotModification();