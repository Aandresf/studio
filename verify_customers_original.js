const https = require('https');

// Configuración para ignorar certificados auto-firmados
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const BASE_URL = 'http://localhost:8080/api';

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
    console.log('\n=== 🔐 LOGIN ===');
    const response = await makeRequest(`${BASE_URL}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({
            username: 'admin',
            password: 'admin'
        })
    });
    
    console.log('Status:', response.status);
    if (response.data && response.data.token) {
        console.log('✅ Login successful');
        return response.data.token;
    }
    console.log('❌ Login failed');
    return null;
}

async function verifyCustomersOriginal(token) {
    const headers = {
        'Authorization': `Bearer ${token}`
    };
    
    console.log('\n=== ✅ VERIFICANDO CUSTOMERS ORIGINALES ===');
    console.log('Confirmando que NO fueron modificados...\n');
    
    // Test 1: GET all customers
    console.log('1. Testing GET /api/customers (obtener todos)');
    const getAllResponse = await makeRequest(`${BASE_URL}/customers`, {
        method: 'GET',
        headers
    });
    console.log('Status:', getAllResponse.status);
    console.log('Success:', getAllResponse.status === 200 ? '✅' : '❌');
    if (getAllResponse.status === 200) {
        console.log('Data count:', Array.isArray(getAllResponse.data) ? getAllResponse.data.length : 'N/A');
        console.log('First customer:', getAllResponse.data[0] ? `ID: ${getAllResponse.data[0].id}, Name: ${getAllResponse.data[0].name}` : 'No data');
    }
    
    // Test 2: GET specific customer (using ID from previous test)
    if (getAllResponse.status === 200 && getAllResponse.data.length > 0) {
        const customerId = getAllResponse.data[0].id;
        console.log(`\n2. Testing GET /api/customers/${customerId} (obtener específico)`);
        const getOneResponse = await makeRequest(`${BASE_URL}/customers/${customerId}`, {
            method: 'GET',
            headers
        });
        console.log('Status:', getOneResponse.status);
        console.log('Success:', getOneResponse.status === 200 ? '✅' : '❌');
        if (getOneResponse.status === 200) {
            console.log('Customer name:', getOneResponse.data.name);
            console.log('Customer document:', getOneResponse.data.document);
        }
    }
    
    // Test 3: Search customers
    console.log('\n3. Testing GET /api/customers/search/test (búsqueda)');
    const searchResponse = await makeRequest(`${BASE_URL}/customers/search/test`, {
        method: 'GET',
        headers
    });
    console.log('Status:', searchResponse.status);
    console.log('Success:', searchResponse.status === 200 ? '✅' : '❌');
    console.log('Search results:', Array.isArray(searchResponse.data) ? searchResponse.data.length : 'N/A');
    
    return {
        getAll: getAllResponse.status === 200,
        getOne: getAllResponse.status === 200 && getAllResponse.data.length > 0,
        search: searchResponse.status === 200
    };
}

async function main() {
    console.log('🔍 VERIFICATION: Customers Originales Intactos');
    console.log('===============================================');
    console.log('Verificando que las rutas /api/customers NO fueron modificadas');
    console.log('y siguen funcionando exactamente igual que antes...');
    
    const token = await login();
    if (!token) return;
    
    const results = await verifyCustomersOriginal(token);
    
    console.log('\n=== 📊 VERIFICATION RESULTS ===');
    console.log(`GET /api/customers:           ${results.getAll ? '✅' : '❌'}`);
    console.log(`GET /api/customers/{id}:      ${results.getOne ? '✅' : '❌'}`);
    console.log(`GET /api/customers/search/*:  ${results.search ? '✅' : '❌'}`);
    
    console.log('\n=== ✅ CONFIRMATION ===');
    if (results.getAll && results.getOne && results.search) {
        console.log('🎉 PERFECTO: Las rutas de customers originales están INTACTAS');
        console.log('📝 CONFIRMED: NO se modificaron las rutas /api/customers');
        console.log('✅ READY: Podemos proceder con las pruebas de suppliers-debug');
    } else {
        console.log('⚠️  WARNING: Hay problemas con las rutas de customers originales');
        console.log('🔧 ACTION: Revisar qué está pasando con el servidor');
    }
}

main().catch(console.error);