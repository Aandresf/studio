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

async function testPatternIssue(token) {
    const headers = {
        'Authorization': `Bearer ${token}`
    };
    
    console.log('🔍 TESTING PATTERN ISSUE');
    console.log('========================');
    console.log('Testing if the word "suppliers" in URL is causing the issue...\n');
    
    // Test customers (baseline)
    console.log('1. Testing /api/customers (baseline)');
    const customersResponse = await makeRequest(`${BASE_URL}/customers`, {
        method: 'GET',
        headers
    });
    console.log('Status:', customersResponse.status, customersResponse.status === 200 ? '✅' : '❌');
    
    // Test the new test-debug endpoint
    console.log('\n2. Testing /api/test-debug (same functions, non-suppliers URL)');
    const testDebugResponse = await makeRequest(`${BASE_URL}/test-debug`, {
        method: 'GET',
        headers
    });
    console.log('Status:', testDebugResponse.status, testDebugResponse.status === 200 ? '✅' : '❌');
    if (testDebugResponse.status === 200) {
        console.log('Data count:', Array.isArray(testDebugResponse.data) ? testDebugResponse.data.length : 'N/A');
    }
    
    // Test suppliers pattern
    console.log('\n3. Testing /api/suppliers (original suppliers pattern)');
    const suppliersResponse = await makeRequest(`${BASE_URL}/suppliers`, {
        method: 'GET',
        headers
    });
    console.log('Status:', suppliersResponse.status, suppliersResponse.status === 200 ? '✅' : '❌');
    
    console.log('\n=== 🎯 PATTERN ANALYSIS ===');
    
    if (customersResponse.status === 200 && testDebugResponse.status === 200) {
        console.log('✅ SUCCESS: Non-suppliers URL works with same functions!');
        console.log('📝 CONCLUSION: The issue IS specifically with "suppliers" URL pattern');
        console.log('🔧 THEORY: There might be a route conflict or middleware issue with suppliers paths');
    } else if (customersResponse.status === 200 && testDebugResponse.status !== 200) {
        console.log('⚠️  FINDING: Even non-suppliers URL fails');
        console.log('📝 CONCLUSION: The issue might be with route registration order or server restart');
    } else {
        console.log('❌ CRITICAL: Even baseline customers failed');
    }
    
    return {
        customers: customersResponse.status === 200,
        testDebug: testDebugResponse.status === 200,
        suppliers: suppliersResponse.status === 200
    };
}

async function main() {
    const token = await login();
    if (!token) {
        console.log('❌ Login failed');
        return;
    }
    
    await testPatternIssue(token);
}

main().catch(console.error);