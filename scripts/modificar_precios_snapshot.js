

const util = require('util');
const databaseManager = require('../src-backend/database-manager');

const SNAPSHOT_DATE = '2023-12-31';
const PERCENTAGE_INCREASE = 0.0217286205; // 2.17286205%

async function calculateSnapshotModification() {
    console.log(`--- FASE DE CÁLCULO (SIMULACIÓN) ---`);
    console.log(`Objetivo: Modificar precios del snapshot del ${SNAPSHOT_DATE}`);
    console.log(`Aumento porcentual a aplicar: ${(PERCENTAGE_INCREASE * 100).toFixed(8)}%`);
    
    const db = databaseManager.getActiveDb();
    const all = util.promisify(db.all.bind(db));

    try {
        const snapshotEntries = await all(
            `SELECT product_id, closing_stock, closing_average_cost 
             FROM inventory_snapshots 
             WHERE snapshot_date = ?`,
            [SNAPSHOT_DATE]
        );

        if (snapshotEntries.length === 0) {
            console.log(`\nNo se encontró ningún snapshot para la fecha ${SNAPSHOT_DATE}. No se puede continuar.`);
            return;
        }

        let originalTotalValue = 0;
        let newTotalValue = 0;

        for (const entry of snapshotEntries) {
            originalTotalValue += entry.closing_stock * entry.closing_average_cost;
            
            const new_cost = entry.closing_average_cost * (1 + PERCENTAGE_INCREASE);
            newTotalValue += entry.closing_stock * new_cost;
        }

        console.log(`\n--- Resultados de la Simulación ---`);
        console.log(`Productos encontrados en el snapshot: \t${snapshotEntries.length}`);
        console.log(`Valor Total Original del Snapshot: \t$${originalTotalValue.toLocaleString('es-VE', { minimumFractionDigits: 5, maximumFractionDigits: 5 })}`);
        console.log(`Nuevo Valor Total Calculado: \t\t$${newTotalValue.toLocaleString('es-VE', { minimumFractionDigits: 5, maximumFractionDigits: 5 })}`);
        console.log(`Valor Objetivo del Usuario: \t\t$39.548,77`);
        
        const difference = newTotalValue - 39548.77;
        console.log(`\nDiferencia con el objetivo: \t\t$${difference.toFixed(5)}`);
        console.log(`------------------------------------`);

        if (Math.abs(difference) < 0.01) {
            console.log("\nEl cálculo es correcto y coincide con el objetivo. El script está listo para aplicar los cambios.");
        } else {
            console.log("\nADVERTENCIA: El cálculo no coincide exactamente con el objetivo. Revisa el porcentaje antes de aplicar cambios.");
        }

    } catch (error) {
        console.error('\nError durante la fase de cálculo:', error);
    } finally {
        databaseManager.closeAllConnections();
    }
}

calculateSnapshotModification();

