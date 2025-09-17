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

async function testProviderEndpoints(token) {
    const headers = {
        'Authorization': `Bearer ${token}`
    };
    
    console.log('🔍 PROVIDER ENDPOINTS TEST');
    console.log('==========================');
    console.log('Probando todos los endpoints de /api/provider...\n');
    
    let results = {};
    
    // Test 1: GET /api/provider (listar todos)
    console.log('1. Testing GET /api/provider (listar todos)');
    const listResponse = await makeRequest(`${BASE_URL}/provider`, {
        method: 'GET',
        headers
    });
    results.list = listResponse.status === 200;
    console.log('Status:', listResponse.status, results.list ? '✅' : '❌');
    if (results.list) {
        console.log('Data count:', Array.isArray(listResponse.data) ? listResponse.data.length : 'N/A');
    }
    
    // Test 2: POST /api/provider (crear nuevo)
    console.log('\n2. Testing POST /api/provider (crear nuevo)');
    const newProvider = {
        name: "Provider Test Company",
        rfc: "PTC123456789",
        document: "Test provider via renamed endpoint",
        address: "123 Provider Street",
        phone: "555-PROVIDER",
        email: "test@provider.com"
    };
    
    const createResponse = await makeRequest(`${BASE_URL}/provider`, {
        method: 'POST',
        body: JSON.stringify(newProvider),
        headers
    });
    results.create = createResponse.status === 201;
    console.log('Status:', createResponse.status, results.create ? '✅' : '❌');
    let providerId = null;
    if (results.create) {
        providerId = createResponse.data.id;
        console.log('Created ID:', providerId);
        console.log('Name:', createResponse.data.name);
    }
    
    // Test 3: GET /api/provider/{id} (obtener por ID)
    if (providerId) {
        console.log(`\n3. Testing GET /api/provider/${providerId} (obtener por ID)`);
        const getResponse = await makeRequest(`${BASE_URL}/provider/${providerId}`, {
            method: 'GET',
            headers
        });
        results.getById = getResponse.status === 200;
        console.log('Status:', getResponse.status, results.getById ? '✅' : '❌');
        if (results.getById) {
            console.log('Name:', getResponse.data.name);
            console.log('RFC:', getResponse.data.rfc);
        }
    } else {
        console.log('\n3. Skipping GET by ID (no provider created)');
        results.getById = false;
    }
    
    // Test 4: PUT /api/provider/{id} (actualizar)
    if (providerId) {
        console.log(`\n4. Testing PUT /api/provider/${providerId} (actualizar)`);
        const updateProvider = {
            name: "Provider Test Company UPDATED",
            rfc: "PTC123456789",
            document: "Updated test provider via renamed endpoint",
            address: "456 Updated Provider Street",
            phone: "555-UPDATED",
            email: "updated@provider.com"
        };
        
        const updateResponse = await makeRequest(`${BASE_URL}/provider/${providerId}`, {
            method: 'PUT',
            body: JSON.stringify(updateProvider),
            headers
        });
        results.update = updateResponse.status === 200;
        console.log('Status:', updateResponse.status, results.update ? '✅' : '❌');
        if (results.update) {
            console.log('Updated Name:', updateResponse.data.name);
            console.log('Updated Phone:', updateResponse.data.phone);
        }
    } else {
        console.log('\n4. Skipping PUT (no provider created)');
        results.update = false;
    }
    
    // Test 5: DELETE /api/provider/{id} (eliminar)
    if (providerId) {
        console.log(`\n5. Testing DELETE /api/provider/${providerId} (eliminar)`);
        const deleteResponse = await makeRequest(`${BASE_URL}/provider/${providerId}`, {
            method: 'DELETE',
            headers
        });
        results.delete = deleteResponse.status === 200 || deleteResponse.status === 204;
        console.log('Status:', deleteResponse.status, results.delete ? '✅' : '❌');
    } else {
        console.log('\n5. Skipping DELETE (no provider created)');
        results.delete = false;
    }
    
    // Test 6: GET /api/provider/search/{name} (buscar por nombre)
    console.log('\n6. Testing GET /api/provider/search/Test (buscar por nombre)');
    const searchResponse = await makeRequest(`${BASE_URL}/provider/search/Test`, {
        method: 'GET',
        headers
    });
    results.search = searchResponse.status === 200;
    console.log('Status:', searchResponse.status, results.search ? '✅' : '❌');
    if (results.search) {
        console.log('Search results:', Array.isArray(searchResponse.data) ? searchResponse.data.length : 'N/A');
    }
    
    console.log('\n=== 📊 RESULTADOS PROVIDER ===');
    console.log(`GET /api/provider (list):      ${results.list ? '✅' : '❌'}`);
    console.log(`POST /api/provider (create):   ${results.create ? '✅' : '❌'}`);
    console.log(`GET /api/provider/id (getById):${results.getById ? '✅' : '❌'}`);
    console.log(`PUT /api/provider/id (update): ${results.update ? '✅' : '❌'}`);
    console.log(`DELETE /api/provider/id (del): ${results.delete ? '✅' : '❌'}`);
    console.log(`GET /api/provider/search/name: ${results.search ? '✅' : '❌'}`);
    
    const totalFunctions = Object.keys(results).length;
    const workingFunctions = Object.values(results).filter(r => r).length;
    
    if (workingFunctions === totalFunctions) {
        console.log('\n🎉 ¡TODOS LOS ENDPOINTS DE PROVIDER FUNCIONAN!');
        console.log('✨ Renombrar a provider fue exitoso');
        console.log('📋 Listo para copiar las 2 últimas funciones de suppliers.rs');
    } else {
        console.log(`\n⚠️  ${workingFunctions}/${totalFunctions} endpoints funcionando`);
        console.log('🔧 Revisar los endpoints que fallan antes de continuar');
    }
    
    return results;
}

async function main() {
    const token = await login();
    if (!token) {
        console.log('❌ Login failed');
        return;
    }
    
    await testProviderEndpoints(token);
}

main().catch(console.error);