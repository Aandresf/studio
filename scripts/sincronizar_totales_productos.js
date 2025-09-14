

const util = require('util');
const databaseManager = require('../src-backend/database-manager');

async function resyncProductTotals() {
    console.log('Iniciando la resincronización de los totales de productos...');
    const db = databaseManager.getActiveDb();
    const all = util.promisify(db.all.bind(db));
    const run = util.promisify(db.run.bind(db));

    try {
        await run('BEGIN TRANSACTION');

        const products = await all("SELECT id FROM products");
        console.log(`Se encontraron ${products.length} productos para sincronizar.`);

        for (const product of products) {
            const movements = await all(
                `SELECT type, quantity, unit_cost 
                 FROM inventory_movements 
                 WHERE product_id = ? AND status = 'Activo'
                 ORDER BY transaction_date ASC, created_at ASC`,
                [product.id]
            );

            let currentStock = 0;
            let avgCost = 0;

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

            // Actualizar la tabla de productos con los valores recalculados
            await run(
                'UPDATE products SET current_stock = ?, average_cost = ? WHERE id = ?',
                [currentStock, avgCost, product.id]
            );
            console.log(`  - Producto ID ${product.id} sincronizado: Stock=${currentStock.toFixed(2)}, CostoPromedio=${avgCost.toFixed(2)}`);
        }

        await run('COMMIT');
        console.log('\n¡Sincronización completada exitosamente!');
        console.log(`Se actualizaron los totales para ${products.length} productos.`);

    } catch (error) {
        console.error('\nError durante la sincronización. Revirtiendo cambios...', error);
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

resyncProductTotals();

