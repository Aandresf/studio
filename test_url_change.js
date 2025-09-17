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

async function testUrlChangeStrategy(token) {
    const headers = {
        'Authorization': `Bearer ${token}`
    };
    
    console.log('\n=== 🧪 TESTING URL CHANGE STRATEGY ===');
    console.log('Probando si el problema está en la URL o en las funciones...\n');
    
    // Test 1: customers original (baseline - should work)
    console.log('1. Testing GET /api/customers (baseline original)');
    const customersResponse = await makeRequest(`${BASE_URL}/customers`, {
        method: 'GET',
        headers
    });
    console.log('Status:', customersResponse.status);
    console.log('Success:', customersResponse.status === 200 ? '✅' : '❌');
    if (customersResponse.status === 200) {
        console.log('Data count:', Array.isArray(customersResponse.data) ? customersResponse.data.length : 'N/A');
    }
    
    // Test 2: suppliers-debug (same functions, different URL)
    console.log('\n2. Testing GET /api/suppliers-debug (same functions, new URL)');
    const suppliersDebugResponse = await makeRequest(`${BASE_URL}/suppliers-debug`, {
        method: 'GET',
        headers
    });
    console.log('Status:', suppliersDebugResponse.status);
    console.log('Success:', suppliersDebugResponse.status === 200 ? '✅' : '❌');
    if (suppliersDebugResponse.status === 200) {
        console.log('Data count:', Array.isArray(suppliersDebugResponse.data) ? suppliersDebugResponse.data.length : 'N/A');
        console.log('First item:', suppliersDebugResponse.data[0] ? JSON.stringify(suppliersDebugResponse.data[0], null, 2) : 'No data');
    }
    
    // Test 3: suppliers original (should fail)
    console.log('\n3. Testing GET /api/suppliers (original - should fail)');
    const suppliersResponse = await makeRequest(`${BASE_URL}/suppliers`, {
        method: 'GET',
        headers
    });
    console.log('Status:', suppliersResponse.status);
    console.log('Success:', suppliersResponse.status === 200 ? '✅' : '❌');
    
    // Test 4: suppliers-test provisional (should fail)
    console.log('\n4. Testing GET /api/suppliers-test (provisional - should fail)');
    const suppliersTestResponse = await makeRequest(`${BASE_URL}/suppliers-test`, {
        method: 'GET',
        headers
    });
    console.log('Status:', suppliersTestResponse.status);
    console.log('Success:', suppliersTestResponse.status === 200 ? '✅' : '❌');
    
    return {
        customers: customersResponse.status === 200,
        suppliersDebug: suppliersDebugResponse.status === 200,
        suppliers: suppliersResponse.status === 200,
        suppliersTest: suppliersTestResponse.status === 200
    };
}

async function main() {
    console.log('🔍 STRATEGY TEST: URL Change Analysis');
    console.log('====================================');
    console.log('HYPOTHESIS: If suppliers-debug works, then route registration is NOT the issue');
    console.log('             If suppliers-debug fails, then there might be an URL pattern issue');
    
    const token = await login();
    if (!token) return;
    
    const results = await testUrlChangeStrategy(token);
    
    console.log('\n=== 📊 URL CHANGE RESULTS ===');
    console.log(`Customers (baseline):        ${results.customers ? '✅' : '❌'}`);
    console.log(`Suppliers-debug (new URL):   ${results.suppliersDebug ? '✅' : '❌'}`);
    console.log(`Suppliers (original):        ${results.suppliers ? '✅' : '❌'}`);
    console.log(`Suppliers-test (provisional): ${results.suppliersTest ? '✅' : '❌'}`);
    
    console.log('\n=== 🎯 ANALYSIS ===');
    
    if (results.customers && results.suppliersDebug) {
        console.log('✅ SUCCESS: suppliers-debug works with same functions but different URL');
        console.log('📝 CONCLUSION: Route registration and URL patterns are NOT the issue');
        console.log('📝 NEXT STEP: The problem is specifically in the original suppliers.rs functions');
        console.log('🔧 STRATEGY: Now we can progressively change suppliers-debug functions to suppliers functions');
    } else if (results.customers && !results.suppliersDebug) {
        console.log('⚠️  FINDING: suppliers-debug fails even with same functions');
        console.log('📝 CONCLUSION: There might be an issue with URL patterns or route registration');
        console.log('🔧 STRATEGY: Need to investigate route registration more deeply');
    } else if (!results.customers) {
        console.log('❌ CRITICAL: Baseline customers failed - check server connection');
    }
    
    if (!results.suppliers && !results.suppliersTest) {
        console.log('📝 CONFIRMED: Both original suppliers endpoints still fail');
    }
}

main().catch(console.error);