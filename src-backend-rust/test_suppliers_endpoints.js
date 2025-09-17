// Test para verificar que todos los endpoints de suppliers funcionan correctamente
const SUPPLIERS_BASE_URL = 'http://127.0.0.1:8080/api/suppliers';

async function testSuppliers() {
    console.log('🧪 INICIANDO PRUEBAS DE SUPPLIERS ENDPOINTS');
    console.log('='.repeat(60));

    const tests = [
        {
            name: 'GET /api/suppliers (listar)',
            url: SUPPLIERS_BASE_URL,
            method: 'GET'
        },
        {
            name: 'GET /api/suppliers/1 (por ID existente)',
            url: `${SUPPLIERS_BASE_URL}/1`,
            method: 'GET'
        },
        {
            name: 'GET /api/suppliers/999 (ID no existente)',
            url: `${SUPPLIERS_BASE_URL}/999`,
            method: 'GET',
            expectedStatus: 404
        },
        {
            name: 'GET /api/suppliers/search/Test (búsqueda)',
            url: `${SUPPLIERS_BASE_URL}/search/Test`,
            method: 'GET'
        },
        {
            name: 'GET /api/suppliers/search/NonExistent (búsqueda vacía)',
            url: `${SUPPLIERS_BASE_URL}/search/NonExistent`,
            method: 'GET'
        }
    ];

    let passedTests = 0;
    let totalTests = tests.length;

    for (const test of tests) {
        try {
            console.log(`\n📋 Probando: ${test.name}`);
            console.log(`🔗 URL: ${test.url}`);
            
            const response = await fetch(test.url, {
                method: test.method,
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const expectedStatus = test.expectedStatus || 200;
            const statusOk = response.status === expectedStatus;
            
            console.log(`📊 Status: ${response.status} ${statusOk ? '✅' : '❌'}`);
            
            if (statusOk) {
                const data = await response.json();
                console.log(`📦 Response: ${JSON.stringify(data).substring(0, 100)}...`);
                console.log('✅ ÉXITO');
                passedTests++;
            } else {
                console.log(`❌ FALLÓ - Esperado: ${expectedStatus}, Recibido: ${response.status}`);
            }
            
        } catch (error) {
            console.log(`❌ ERROR: ${error.message}`);
        }
        
        console.log('-'.repeat(40));
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📈 RESUMEN: ${passedTests}/${totalTests} pruebas exitosas`);
    
    if (passedTests === totalTests) {
        console.log('🎉 ¡TODOS LOS ENDPOINTS DE SUPPLIERS FUNCIONAN PERFECTAMENTE!');
    } else {
        console.log(`⚠️  ${totalTests - passedTests} pruebas fallaron`);
    }
    
    console.log('='.repeat(60));
}

// Ejecutar las pruebas
testSuppliers().catch(console.error);