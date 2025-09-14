

const path = require('path');
const util = require('util');
const databaseManager = require('../src-backend/database-manager');

// Función para calcular el valor total del inventario en una fecha específica
async function calculateInventoryValueAtDate(targetDate) {
    try {
        const db = databaseManager.getActiveDb();
        const all = util.promisify(db.all.bind(db));

        const products = await all("SELECT id FROM products");
        let totalInventoryValue = 0;

        for (const product of products) {
            const movements = await all(
                `SELECT type, quantity, unit_cost 
                 FROM inventory_movements 
                 WHERE product_id = ? AND status = 'Activo' AND date(transaction_date) <= ?
                 ORDER BY transaction_date ASC, created_at ASC`,
                [product.id, targetDate]
            );

            let currentStock = 0;
            let avgCost = 0;

            for (const move of movements) {
                if (move.type === 'ENTRADA') {
                    const currentTotalValue = currentStock * avgCost;
                    const entryValue = move.quantity * (move.unit_cost || 0);
                    currentStock += move.quantity;
                    avgCost = currentStock > 0 ? (currentTotalValue + entryValue) / currentStock : 0;
                } else { // SALIDA, RETIRO, AUTO-CONSUMO
                    currentStock -= move.quantity;
                }
            }
            
            if (currentStock > 0) {
                totalInventoryValue += currentStock * avgCost;
            }
        }
        return totalInventoryValue;
    } catch (error) {
        console.error(`Error calculando para la fecha ${targetDate}:`, error);
        return 0;
    }
}

// Función para obtener el valor actual directamente de la tabla de productos
async function getCurrentInventoryValue() {
    try {
        const db = databaseManager.getActiveDb();
        const get = util.promisify(db.get.bind(db));
        const result = await get("SELECT SUM(current_stock * average_cost) as totalValue FROM products WHERE status = 'Activo'");
        return result.totalValue || 0;
    } catch (error) {
        console.error('Error obteniendo el valor actual:', error);
        return 0;
    }
}


async function runAnalysis() {
    console.log('Iniciando análisis histórico del valor del inventario...');

    const initialValue = await calculateInventoryValueAtDate('1999-12-31');
    console.log(`\nValor del Inventario Inicial (a 31-12-1999): \t$${initialValue.toFixed(2)}`);

    const end2023Value = await calculateInventoryValueAtDate('2023-12-31');
    console.log(`Valor del Inventario (a 31-12-2023): \t\t$${end2023Value.toFixed(2)}`);
    
    const end2024Value = await calculateInventoryValueAtDate('2024-12-31');
    console.log(`Valor del Inventario (a 31-12-2024): \t\t$${end2024Value.toFixed(2)}`);

    const currentValue = await getCurrentInventoryValue();
    console.log(`Valor del Inventario (Actual, desde tabla products): \t$${currentValue.toFixed(2)}`);
    
    databaseManager.closeAllConnections();
}

runAnalysis();

