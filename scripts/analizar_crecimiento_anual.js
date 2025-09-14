

const util = require('util');
const databaseManager = require('../src-backend/database-manager');

// --- Función de Cálculo Genérica ---
// Esta función puede calcular el valor usando ambos métodos.
async function calculateInventoryValueAtDate(db, targetDate, useSnapshotOptimization) {
    const get = util.promisify(db.get.bind(db));
    const all = util.promisify(db.all.bind(db));

    const products = await all("SELECT id FROM products");
    let grandTotalValue = 0;

    for (const product of products) {
        let currentStock = 0;
        let avgCost = 0;
        let calculationStartDate = '1970-01-01';

        if (useSnapshotOptimization) {
            const latestSnapshot = await get(
                `SELECT snapshot_date, closing_stock, closing_average_cost 
                 FROM inventory_snapshots
                 WHERE product_id = ? AND date(snapshot_date) <= ?
                 ORDER BY snapshot_date DESC
                 LIMIT 1`,
                [product.id, targetDate]
            );
            if (latestSnapshot) {
                currentStock = latestSnapshot.closing_stock;
                avgCost = latestSnapshot.closing_average_cost;
                calculationStartDate = latestSnapshot.snapshot_date;
            }
        }

        const movements = await all(
            `SELECT type, quantity, unit_cost 
             FROM inventory_movements 
             WHERE product_id = ? AND status = 'Activo' AND date(transaction_date) > ? AND date(transaction_date) <= ?
             ORDER BY transaction_date ASC, created_at ASC`,
            [product.id, calculationStartDate, targetDate]
        );

        for (const move of movements) {
            if (move.type === 'ENTRADA') {
                const currentTotalValue = currentStock * avgCost;
                const entryValue = move.quantity * (move.unit_cost || 0);
                currentStock += move.quantity;
                avgCost = currentStock > 0 ? (currentTotalValue + entryValue) / currentStock : 0;
            } else {
                currentStock -= move.quantity;
            }
        }
        
        if (currentStock > 0) {
            grandTotalValue += currentStock * avgCost;
        }
    }
    return grandTotalValue;
}

async function runAnalysis() {
    console.log('--- Iniciando análisis de crecimiento anual y verificación de métodos ---');
    const db = databaseManager.getActiveDb();

    try {
        // --- Fechas Clave ---
        const EOY_2022 = '2022-12-31';
        const EOY_2023 = '2023-12-31';
        const EOY_2024 = '2024-12-31';

        // --- Cálculos para 2023 ---
        console.log(`\nCalculando valor a final de 2023 (${EOY_2023})...`);
        const val2023_hist = await calculateInventoryValueAtDate(db, EOY_2023, false);
        const val2023_snap = await calculateInventoryValueAtDate(db, EOY_2023, true);
        
        console.log(`  - Valor (Cálculo Histórico): \t$${val2023_hist.toFixed(2)}`);
        console.log(`  - Valor (Desde Snapshot): \t$${val2023_snap.toFixed(2)}`);
        console.log(`  - Verificación: \t\t\t${Math.abs(val2023_hist - val2023_snap) < 0.01 ? 'OK' : 'FALLÓ'}`);

        // --- Cálculos para 2024 ---
        console.log(`\nCalculando valor a final de 2024 (${EOY_2024})...`);
        const val2024_hist = await calculateInventoryValueAtDate(db, EOY_2024, false);
        const val2024_snap = await calculateInventoryValueAtDate(db, EOY_2024, true);

        console.log(`  - Valor (Cálculo Histórico): \t$${val2024_hist.toFixed(2)}`);
        console.log(`  - Valor (Desde Snapshot): \t$${val2024_snap.toFixed(2)}`);
        console.log(`  - Verificación: \t\t\t${Math.abs(val2024_hist - val2024_snap) < 0.01 ? 'OK' : 'FALLÓ'}`);

        // --- Análisis de Crecimiento ---
        console.log('\n--- Resumen de Crecimiento Anual ---');
        const val2022 = await calculateInventoryValueAtDate(db, EOY_2022, true); // Usamos el optimizado que ya verificamos
        
        const increase2023 = val2023_snap - val2022;
        const increase2024 = val2024_snap - val2023_snap;

        console.log(`Valor a final de 2022: \t\t$${val2022.toFixed(2)}`);
        console.log(`Valor a final de 2023: \t\t$${val2023_snap.toFixed(2)}`);
        console.log(`Valor a final de 2024: \t\t$${val2024_snap.toFixed(2)}`);
        console.log('------------------------------------------');
        console.log(`Aumento de valor durante 2023: \t$${increase2023.toFixed(2)}`);
        console.log(`Aumento de valor durante 2024: \t$${increase2024.toFixed(2)}`);
        
    } catch (error) {
        console.error('\nError durante el análisis:', error);
    } finally {
        databaseManager.closeAllConnections();
    }
}

runAnalysis();
