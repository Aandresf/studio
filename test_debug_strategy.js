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

async function testDebugStrategy(token) {
    const headers = {
        'Authorization': `Bearer ${token}`
    };
    
    console.log('\n=== 🧪 TESTING DEBUG STRATEGY ===');
    console.log('Probando la estrategia de duplicación para aislar el problema...\n');
    
    // Test 1: customers original (baseline - should work)
    console.log('1. Testing GET /api/customers (baseline - debe funcionar)');
    const customersResponse = await makeRequest(`${BASE_URL}/customers`, {
        method: 'GET',
        headers
    });
    console.log('Status:', customersResponse.status);
    console.log('Success:', customersResponse.status === 200 ? '✅' : '❌');
    if (customersResponse.status === 200) {
        console.log('Data count:', Array.isArray(customersResponse.data) ? customersResponse.data.length : 'N/A');
    }
    
    // Test 2: suppliers_debug (should work identically to customers)
    console.log('\n2. Testing GET /api/customers (suppliers_debug - debería ser idéntico)');
    console.log('   NOTE: suppliers_debug usa la misma URL /api/customers por ahora');
    // Por ahora suppliers_debug usa /api/customers, así que es el mismo endpoint
    // Esto cambiará en el siguiente paso
    
    // Test 3: suppliers original (should fail)
    console.log('\n3. Testing GET /api/suppliers (original - debe fallar)');
    const suppliersResponse = await makeRequest(`${BASE_URL}/suppliers`, {
        method: 'GET',
        headers
    });
    console.log('Status:', suppliersResponse.status);
    console.log('Success:', suppliersResponse.status === 200 ? '✅' : '❌');
    
    // Test 4: suppliers-test provisional (should fail)
    console.log('\n4. Testing GET /api/suppliers-test (provisional - debe fallar)');
    const suppliersTestResponse = await makeRequest(`${BASE_URL}/suppliers-test`, {
        method: 'GET',
        headers
    });
    console.log('Status:', suppliersTestResponse.status);
    console.log('Success:', suppliersTestResponse.status === 200 ? '✅' : '❌');
    
    return {
        customers: customersResponse.status === 200,
        suppliers: suppliersResponse.status === 200,
        suppliersTest: suppliersTestResponse.status === 200
    };
}

async function main() {
    console.log('🔍 STRATEGY TEST: Duplicación de Customers para Debug');
    console.log('==================================================');
    console.log('Paso 1: Verificar que suppliers_debug se registró correctamente');
    console.log('Paso 2: Cambiar URL de suppliers_debug de /api/customers a /api/suppliers-debug');
    console.log('Paso 3: Cambiar funciones internas progresivamente');
    
    const token = await login();
    if (!token) return;
    
    const results = await testDebugStrategy(token);
    
    console.log('\n=== 📊 STRATEGY RESULTS ===');
    console.log(`Customers (baseline): ${results.customers ? '✅' : '❌'}`);
    console.log(`Suppliers (original): ${results.suppliers ? '✅' : '❌'}`);
    console.log(`Suppliers-test (provisional): ${results.suppliersTest ? '✅' : '❌'}`);
    
    console.log('\n=== 🎯 NEXT STEPS ===');
    if (!results.customers) {
        console.log('⚠️  CRITICAL: Baseline customers failed - check server connection');
    } else {
        console.log('✅ Baseline customers working');
        console.log('📝 READY FOR: Change suppliers_debug URL from /api/customers to /api/suppliers-debug');
        console.log('📝 STRATEGY: If suppliers_debug works with new URL, then route registration is NOT the issue');
        console.log('📝 STRATEGY: If suppliers_debug fails with new URL, then URL pattern might be the issue');
    }
}

main().catch(console.error);