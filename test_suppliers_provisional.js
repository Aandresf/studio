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
    console.log('Response:', response.data);
    
    if (response.data && response.data.token) {
        return response.data.token;
    }
    return null;
}

async function testSuppliersProvisional(token) {
    console.log('\n=== 🧪 TEST SUPPLIERS PROVISIONAL ENDPOINTS ===');
    
    const headers = {
        'Authorization': `Bearer ${token}`
    };
    
    // 1. Test endpoint de prueba
    console.log('\n1. Testing /api/suppliers-test/test');
    const testResponse = await makeRequest(`${BASE_URL}/suppliers-test/test`, {
        method: 'GET',
        headers
    });
    console.log('Status:', testResponse.status);
    console.log('Response:', testResponse.data);
    
    // 2. Get all suppliers (provisional)
    console.log('\n2. Testing GET /api/suppliers-test');
    const getAllResponse = await makeRequest(`${BASE_URL}/suppliers-test`, {
        method: 'GET',
        headers
    });
    console.log('Status:', getAllResponse.status);
    console.log('Response:', getAllResponse.data);
    
    return getAllResponse.status === 200;
}

async function testOriginalSuppliers(token) {
    console.log('\n=== 🔍 TEST ORIGINAL SUPPLIERS ENDPOINTS ===');
    
    const headers = {
        'Authorization': `Bearer ${token}`
    };
    
    // Test original suppliers endpoint
    console.log('\n1. Testing GET /api/suppliers (original)');
    const originalResponse = await makeRequest(`${BASE_URL}/suppliers`, {
        method: 'GET',
        headers
    });
    console.log('Status:', originalResponse.status);
    console.log('Response:', originalResponse.data);
    
    return originalResponse.status === 200;
}

async function main() {
    console.log('🚀 Testing Suppliers - Provisional vs Original Routes');
    console.log('================================================');
    
    // Login
    const token = await login();
    if (!token) {
        console.log('❌ Login failed');
        return;
    }
    console.log('✅ Login successful');
    
    // Test provisional routes
    const provisionalWorks = await testSuppliersProvisional(token);
    
    // Test original routes
    const originalWorks = await testOriginalSuppliers(token);
    
    // Summary
    console.log('\n=== 📊 SUMMARY ===');
    console.log(`Provisional routes (/api/suppliers-test): ${provisionalWorks ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`Original routes (/api/suppliers): ${originalWorks ? '✅ WORKING' : '❌ FAILED'}`);
    
    if (provisionalWorks && !originalWorks) {
        console.log('\n🔍 FINDING: Provisional routes work but original routes fail');
        console.log('This confirms the issue is in the original route registration, not the code logic');
    } else if (!provisionalWorks && !originalWorks) {
        console.log('\n🔍 FINDING: Both routes fail - the issue might be in the code logic');
    } else if (provisionalWorks && originalWorks) {
        console.log('\n🔍 FINDING: Both routes work - the issue has been resolved');
    }
}

main().catch(console.error);