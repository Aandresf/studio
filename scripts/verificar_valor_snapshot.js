

const util = require('util');
const databaseManager = require('../src-backend/database-manager');

const SNAPSHOT_DATE = '2023-11-30';

async function verifySnapshotValue() {
    console.log(`--- Verificando el valor total del snapshot para la fecha: ${SNAPSHOT_DATE} ---`);
    
    const db = databaseManager.getActiveDb();
    const all = util.promisify(db.all.bind(db));

    try {
        const snapshotEntries = await all(
            `SELECT closing_stock, closing_average_cost 
             FROM inventory_snapshots 
             WHERE snapshot_date = ?`,
            [SNAPSHOT_DATE]
        );

        if (snapshotEntries.length === 0) {
            console.log(`No se encontró ningún snapshot para la fecha ${SNAPSHOT_DATE}.`);
            return;
        }

        let totalValue = 0;
        for (const entry of snapshotEntries) {
            totalValue += entry.closing_stock * entry.closing_average_cost;
        }

        console.log(`\nVerificación completada:`);
        console.log(`El valor total del snapshot del ${SNAPSHOT_DATE} es ahora: $${totalValue.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        console.log(`Valor objetivo: $39.548,77`);

    } catch (error) {
        console.error('\nError durante la verificación:', error);
    } finally {
        databaseManager.closeAllConnections();
    }
}

verifySnapshotValue();

