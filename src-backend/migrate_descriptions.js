// migrate_descriptions.js
// Script de un solo uso para migrar datos desde el campo `description`
// a las nuevas columnas estructuradas en la tabla `inventory_movements`.

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { nanoid } = require('nanoid');

const DB_FILE = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(DB_FILE, (err) => {
    if (err) {
        console.error('Error al abrir la base de datos', err.message);
        return;
    }
    console.log(`Conectado a la base de datos SQLite: ${DB_FILE}`);
    runMigration();
});

// Expresiones regulares mejoradas para parsear el campo `description`
const saleRegex = /Venta a (.*?)\s?\(DNI: (.*?)\)\.\s?Factura:\s?(.*)/i;
const purchaseRegex = /Compra a (.*?)\s?\(RIF: (.*?)\)\.\s?Factura:\s?(.*)/i;
const simplePurchaseRegex = /Compra a (.*?)\.\s?Factura:\s?(.*)/i;

async function runMigration() {
    console.log('Iniciando migración de datos de descripción (v2)...');

    // --- Añadir la nueva columna si no existe ---
    const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
        db.run(sql, params, function(err) { err ? reject(err) : resolve(this) });
    });
    const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
    });

    try {
        const columns = await dbAll("PRAGMA table_info(inventory_movements)");
        const hasDocNumber = columns.some(col => col.name === 'document_number');
        if (!hasDocNumber) {
            console.log("Añadiendo columna 'document_number' a la tabla inventory_movements...");
            await dbRun("ALTER TABLE inventory_movements ADD COLUMN document_number TEXT;");
            console.log("Columna 'document_number' añadida.");
        }
    } catch (e) {
        console.error("Error al añadir la columna:", e.message);
        db.close();
        return;
    }
    // --- Fin de la adición de columna ---


    console.log('Procediendo a rellenar los datos faltantes...');

    try {
        const descriptions = await dbAll(
            `SELECT DISTINCT description, created_at FROM inventory_movements 
             WHERE (transaction_id IS NULL OR document_number IS NULL) AND (type = 'ENTRADA' OR type = 'SALIDA')`
        );

        if (descriptions.length === 0) {
            console.log('No hay descripciones para migrar. La base de datos parece estar actualizada.');
            return;
        }

        console.log(`Se encontraron ${descriptions.length} transacciones únicas para migrar.`);

        let updatedRows = 0;

        for (const { description, created_at } of descriptions) {
            if (!description) continue;

            const transaction_id = nanoid();
            let entity_name = null;
            let entity_document = null;
            let document_number = null;
            
            let match = description.match(saleRegex) || description.match(purchaseRegex) || description.match(simplePurchaseRegex);
            
            if (match) {
                if (match.length === 4) { // Venta o Compra con RIF/DNI
                    entity_name = match[1].trim();
                    entity_document = match[2].trim().replace(')', '');
                    document_number = match[3].trim();
                } else if (match.length === 3) { // Compra simple
                    entity_name = match[1].trim();
                    document_number = match[2].trim();
                }
            }
            
            if (entity_document === 'N/A') entity_document = null;
            if (document_number === 'N/A') document_number = null;

            const result = await dbRun(
                `UPDATE inventory_movements 
                 SET 
                    transaction_id = COALESCE(transaction_id, ?),
                    transaction_date = COALESCE(transaction_date, ?),
                    entity_name = COALESCE(entity_name, ?),
                    entity_document = COALESCE(entity_document, ?),
                    document_number = COALESCE(document_number, ?)
                 WHERE 
                    description = ?`,
                [transaction_id, created_at, entity_name, entity_document, document_number, description]
            );
            
            console.log(` -> Transacción '${description.substring(0, 30)}...' migrada. Filas afectadas: ${result.changes}`);
            updatedRows += result.changes;
        }

        console.log(`\nMigración completada. Total de filas actualizadas: ${updatedRows}.`);

    } catch (err) {
        console.error('\nOcurrió un error durante la migración:', err.message);
    } finally {
        db.close((err) => {
            if (err) console.error('Error al cerrar la base de datos.', err.message);
            else console.log('Conexión con la base de datos cerrada.');
        });
    }
}