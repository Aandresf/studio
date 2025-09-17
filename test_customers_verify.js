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

async function testEndpoints(token) {
    const headers = {
        'Authorization': `Bearer ${token}`
    };
    
    console.log('\n=== 🧪 TESTING ENDPOINTS ===');
    
    // Test customers (should work)
    console.log('\n1. Testing GET /api/customers (known working)');
    const customersResponse = await makeRequest(`${BASE_URL}/customers`, {
        method: 'GET',
        headers
    });
    console.log('Status:', customersResponse.status);
    console.log('Response type:', typeof customersResponse.data);
    console.log('Has data:', Array.isArray(customersResponse.data));
    
    // Test suppliers original (should fail)
    console.log('\n2. Testing GET /api/suppliers (original - failing)');
    const suppliersResponse = await makeRequest(`${BASE_URL}/suppliers`, {
        method: 'GET',
        headers
    });
    console.log('Status:', suppliersResponse.status);
    console.log('Response:', suppliersResponse.data);
    
    // Test suppliers provisional (testing)
    console.log('\n3. Testing GET /api/suppliers-test (provisional)');
    const suppliersTestResponse = await makeRequest(`${BASE_URL}/suppliers-test`, {
        method: 'GET',
        headers
    });
    console.log('Status:', suppliersTestResponse.status);
    console.log('Response:', suppliersTestResponse.data);
    
    // Test suppliers test endpoint specifically
    console.log('\n4. Testing GET /api/suppliers-test/test (test endpoint)');
    const testResponse = await makeRequest(`${BASE_URL}/suppliers-test/test`, {
        method: 'GET',
        headers
    });
    console.log('Status:', testResponse.status);
    console.log('Response:', testResponse.data);
    
    return {
        customers: customersResponse.status === 200,
        suppliers: suppliersResponse.status === 200,
        suppliersTest: suppliersTestResponse.status === 200,
        testEndpoint: testResponse.status === 200
    };
}

async function main() {
    console.log('🔍 Verificando estado de endpoints específicos');
    console.log('============================================');
    
    const token = await login();
    if (!token) return;
    
    const results = await testEndpoints(token);
    
    console.log('\n=== 📊 RESULTS ===');
    console.log(`Customers (working baseline): ${results.customers ? '✅' : '❌'}`);
    console.log(`Suppliers (original): ${results.suppliers ? '✅' : '❌'}`);
    console.log(`Suppliers-test (provisional): ${results.suppliersTest ? '✅' : '❌'}`);
    console.log(`Test endpoint: ${results.testEndpoint ? '✅' : '❌'}`);
    
    if (!results.customers) {
        console.log('\n⚠️  WARNING: Even customers endpoint failed - check server connection');
    } else if (!results.suppliersTest && !results.suppliers) {
        console.log('\n🔍 Both suppliers endpoints fail - check route registration');
    } else if (results.suppliersTest && !results.suppliers) {
        console.log('\n✅ Provisional routes work - issue is in original suppliers.rs');
    }
}

main().catch(console.error);