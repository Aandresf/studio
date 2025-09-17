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

async function testFinalSolution(token) {
    const headers = {
        'Authorization': `Bearer ${token}`
    };
    
    console.log('🎯 FINAL TEST: Route Fix Verification');
    console.log('====================================');
    console.log('Testing if removing the extra /test route fixed suppliers...\n');
    
    // Test 1: customers (baseline)
    console.log('1. Testing /api/customers (baseline)');
    const customersResponse = await makeRequest(`${BASE_URL}/customers`, {
        method: 'GET',
        headers
    });
    console.log('Status:', customersResponse.status, customersResponse.status === 200 ? '✅' : '❌');
    console.log('Data count:', Array.isArray(customersResponse.data) ? customersResponse.data.length : 'N/A');
    
    // Test 2: suppliers-debug (confirmed working)
    console.log('\n2. Testing /api/suppliers-debug (confirmed working)');
    const suppliersDebugResponse = await makeRequest(`${BASE_URL}/suppliers-debug`, {
        method: 'GET',
        headers
    });
    console.log('Status:', suppliersDebugResponse.status, suppliersDebugResponse.status === 200 ? '✅' : '❌');
    console.log('Data count:', Array.isArray(suppliersDebugResponse.data) ? suppliersDebugResponse.data.length : 'N/A');
    
    // Test 3: suppliers original (THE FIX TEST)
    console.log('\n3. Testing /api/suppliers (THE FIX TEST - should now work!)');
    const suppliersResponse = await makeRequest(`${BASE_URL}/suppliers`, {
        method: 'GET',
        headers
    });
    console.log('Status:', suppliersResponse.status, suppliersResponse.status === 200 ? '✅' : '❌');
    
    if (suppliersResponse.status === 200) {
        console.log('Data count:', Array.isArray(suppliersResponse.data) ? suppliersResponse.data.length : 'N/A');
        console.log('🎉 SUCCESS: Suppliers endpoint is now working!');
        
        // Show that it returns the same data as customers (since they use same table)
        if (Array.isArray(suppliersResponse.data) && suppliersResponse.data.length > 0) {
            console.log('First supplier:', `ID: ${suppliersResponse.data[0].id}, Name: ${suppliersResponse.data[0].name}`);
        }
    } else {
        console.log('❌ Still failing. Error:', suppliersResponse.data);
    }
    
    // Test 4: suppliers-test (should still fail)
    console.log('\n4. Testing /api/suppliers-test (should still fail - different issue)');
    const suppliersTestResponse = await makeRequest(`${BASE_URL}/suppliers-test`, {
        method: 'GET',
        headers
    });
    console.log('Status:', suppliersTestResponse.status, suppliersTestResponse.status === 200 ? '✅' : '❌');
    
    console.log('\n=== 📊 FINAL RESULTS ===');
    console.log(`Customers (baseline):      ${customersResponse.status === 200 ? '✅' : '❌'}`);
    console.log(`Suppliers-debug (working): ${suppliersDebugResponse.status === 200 ? '✅' : '❌'}`);
    console.log(`Suppliers (FIXED?):        ${suppliersResponse.status === 200 ? '✅' : '❌'}`);
    console.log(`Suppliers-test (still?):   ${suppliersTestResponse.status === 200 ? '✅' : '❌'}`);
    
    if (suppliersResponse.status === 200) {
        console.log('\n🎉 SOLUTION CONFIRMED!');
        console.log('🔧 PROBLEM WAS: Extra /test route in suppliers.rs causing conflict');
        console.log('✅ SOLUTION: Remove the extra route to match customers.rs structure');
        console.log('📝 ROOT CAUSE: Route conflicts in Actix-web when improperly configured');
    }
    
    return {
        customers: customersResponse.status === 200,
        suppliersDebug: suppliersDebugResponse.status === 200,
        suppliers: suppliersResponse.status === 200,
        suppliersTest: suppliersTestResponse.status === 200
    };
}

async function main() {
    const token = await login();
    if (!token) {
        console.log('❌ Login failed');
        return;
    }
    
    await testFinalSolution(token);
}

main().catch(console.error);