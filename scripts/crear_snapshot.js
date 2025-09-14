

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001/api';
const SNAPSHOT_DATE = '2023-12-31';

async function createSnapshot() {
    console.log(`Creando snapshot para la fecha: ${SNAPSHOT_DATE}...`);
    try {
        const response = await fetch(`${API_BASE_URL}/inventory/create-snapshot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ snapshot_date: SNAPSHOT_DATE }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Error desconocido al crear el snapshot.');
        }

        console.log('\n¡Snapshot creado exitosamente!');
        console.log(JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('\nError al crear el snapshot:', error.message);
    }
}

createSnapshot();

