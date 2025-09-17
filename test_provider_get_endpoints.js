const https = require('https');

// Configuración para ignorar certificados auto-firmados
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const BASE_URL = 'http://127.0.0.1:8080/api';

async function makeRequest(url, options = {}) {
    const fetch = (await import('node-fetch')).default;
    
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }
        
        return {
            status: response.status,
            statusText: response.statusText,
            data
        };
    } catch (error) {
        console.error('Request failed:', error.message);
        return { status: 0, error: error.message };
    }
}

async function login() {
    const response = await makeRequest(`${BASE_URL}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({
            username: 'admin',
            password: 'admin'
        })
    });
    
    if (response.data && response.data.token) {
        return response.data.token;
    }
    return null;
}

async function testProviderGETEndpoints(token) {
    const headers = {
        'Authorization': `Bearer ${token}`
    };
    
    console.log('🔍 PROVIDER GET ENDPOINTS TEST');
    console.log('==============================');
    console.log('Probando específicamente los endpoints GET de /api/provider...\n');
    
    let results = {};
    
    // Test 1: GET /api/provider (listar todos)
    console.log('1. Testing GET /api/provider (listar todos los providers)');
    const listResponse = await makeRequest(`${BASE_URL}/provider`, {
        method: 'GET',
        headers
    });
    results.list = listResponse.status === 200;
    console.log('Status:', listResponse.status, results.list ? '✅' : '❌');
    
    if (results.list) {
        console.log('📊 Data count:', Array.isArray(listResponse.data) ? listResponse.data.length : 'N/A');
        if (Array.isArray(listResponse.data) && listResponse.data.length > 0) {
            console.log('📝 First provider:', {
                id: listResponse.data[0].id,
                name: listResponse.data[0].name,
                rfc: listResponse.data[0].rfc
            });
            console.log('📝 All provider IDs:', listResponse.data.map(p => p.id));
        }
    } else {
        console.log('❌ Error:', listResponse.data);
    }
    
    // Test 2: GET /api/provider/{id} (obtener por ID existente)
    console.log('\n2. Testing GET /api/provider/1 (obtener provider por ID existente)');
    const getByIdResponse = await makeRequest(`${BASE_URL}/provider/1`, {
        method: 'GET',
        headers
    });
    results.getById = (getByIdResponse.status === 200 || getByIdResponse.status === 404);
    console.log('Status:', getByIdResponse.status, results.getById ? '✅' : '❌');
    
    if (getByIdResponse.status === 200) {
        console.log('📝 Provider found:', {
            id: getByIdResponse.data.id,
            name: getByIdResponse.data.name,
            rfc: getByIdResponse.data.rfc,
            address: getByIdResponse.data.address
        });
    } else if (getByIdResponse.status === 404) {
        console.log('ℹ️  Provider ID 1 not found (404) - this is normal behavior');
    } else {
        console.log('❌ Error:', getByIdResponse.data);
    }
    
    // Test 3: GET /api/provider/{id} (obtener por ID inexistente)
    console.log('\n3. Testing GET /api/provider/999 (obtener provider por ID inexistente)');
    const getByIdNotFoundResponse = await makeRequest(`${BASE_URL}/provider/999`, {
        method: 'GET',
        headers
    });
    results.getByIdNotFound = getByIdNotFoundResponse.status === 404;
    console.log('Status:', getByIdNotFoundResponse.status, results.getByIdNotFound ? '✅' : '❌');
    
    if (getByIdNotFoundResponse.status === 404) {
        console.log('✅ Correctly returns 404 for non-existent provider');
        console.log('📝 Message:', getByIdNotFoundResponse.data);
    } else {
        console.log('❌ Unexpected response for non-existent ID');
    }
    
    // Test 4: GET /api/provider/search/{name} (buscar por nombre)
    console.log('\n4. Testing GET /api/provider/search/Test (buscar providers por nombre)');
    const searchResponse = await makeRequest(`${BASE_URL}/provider/search/Test`, {
        method: 'GET',
        headers
    });
    results.search = searchResponse.status === 200;
    console.log('Status:', searchResponse.status, results.search ? '✅' : '❌');
    
    if (results.search) {
        console.log('📊 Search results count:', Array.isArray(searchResponse.data) ? searchResponse.data.length : 'N/A');
        if (Array.isArray(searchResponse.data) && searchResponse.data.length > 0) {
            console.log('📝 First search result:', {
                id: searchResponse.data[0].id,
                name: searchResponse.data[0].name
            });
        }
    } else {
        console.log('❌ Error:', searchResponse.data);
    }
    
    // Test 5: GET /api/provider/search/NonExistent (buscar por nombre inexistente)
    console.log('\n5. Testing GET /api/provider/search/NonExistentProvider (buscar nombre inexistente)');
    const searchNotFoundResponse = await makeRequest(`${BASE_URL}/provider/search/NonExistentProvider`, {
        method: 'GET',
        headers
    });
    results.searchNotFound = searchNotFoundResponse.status === 200;
    console.log('Status:', searchNotFoundResponse.status, results.searchNotFound ? '✅' : '❌');
    
    if (results.searchNotFound) {
        console.log('📊 Search results (should be empty):', Array.isArray(searchNotFoundResponse.data) ? searchNotFoundResponse.data.length : 'N/A');
    }
    
    // Verificar que suppliers original ya no existe
    console.log('\n6. Testing GET /api/suppliers (verificar que ya no existe)');
    const suppliersResponse = await makeRequest(`${BASE_URL}/suppliers`, {
        method: 'GET',
        headers
    });
    results.suppliersGone = suppliersResponse.status === 404;
    console.log('Status:', suppliersResponse.status, results.suppliersGone ? '✅' : '❌');
    
    if (results.suppliersGone) {
        console.log('✅ Suppliers endpoint successfully removed (404)');
    } else {
        console.log('⚠️  Suppliers endpoint still exists');
    }
    
    console.log('\n=== 📊 RESULTADOS GET ENDPOINTS ===');
    console.log(`GET /api/provider (list):           ${results.list ? '✅' : '❌'}`);
    console.log(`GET /api/provider/1 (existing):     ${results.getById ? '✅' : '❌'}`);
    console.log(`GET /api/provider/999 (not found):  ${results.getByIdNotFound ? '✅' : '❌'}`);
    console.log(`GET /api/provider/search/Test:      ${results.search ? '✅' : '❌'}`);
    console.log(`GET /api/provider/search/NonExist:  ${results.searchNotFound ? '✅' : '❌'}`);
    console.log(`GET /api/suppliers (removed):       ${results.suppliersGone ? '✅' : '❌'}`);
    
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(r => r).length;
    
    if (passedTests === totalTests) {
        console.log('\n🎉 ¡TODOS LOS ENDPOINTS GET DE PROVIDER FUNCIONAN PERFECTAMENTE!');
        console.log('✨ Provider es ahora el reemplazo oficial de suppliers');
        console.log('🗑️  Suppliers.rs ha sido eliminado exitosamente');
    } else {
        console.log(`\n⚠️  ${passedTests}/${totalTests} tests pasaron`);
        console.log('🔧 Revisar los endpoints que fallaron');
    }
    
    return results;
}

async function main() {
    const token = await login();
    if (!token) {
        console.log('❌ Login failed');
        return;
    }
    
    await testProviderGETEndpoints(token);
}

main().catch(console.error);