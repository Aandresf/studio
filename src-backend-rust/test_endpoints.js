// Test simple para verificar endpoints disponibles
const BASE_URL = 'http://127.0.0.1:8080/api';
const AUTH_URL = `${BASE_URL}/auth/login`;

let authToken = null;

async function authenticate() {
    try {
        const response = await fetch(AUTH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin' })
        });

        if (response.ok) {
            const data = await response.json();
            authToken = data.token;
            console.log('✅ Autenticación exitosa');
            return true;
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
    return false;
}

async function makeRequest(url, method = 'GET') {
    return await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    });
}

async function testEndpoints() {
    console.log('🔗 PROBANDO ENDPOINTS DISPONIBLES');
    console.log('='.repeat(50));
    
    if (!await authenticate()) {
        console.log('❌ No se pudo autenticar');
        return;
    }
    
    const endpoints = [
        '/api/users',
        '/api/admin/users', 
        '/api/roles',
        '/api/admin/roles',
        '/api/users/count',
        '/api/admin',
        '/api/dashboard',
        '/api/dashboard/stats'
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`\n🧪 Probando: ${endpoint}`);
            const response = await makeRequest(`http://127.0.0.1:8080${endpoint}`);
            
            console.log(`📊 Status: ${response.status}`);
            
            if (response.ok) {
                const data = await response.json();
                const preview = JSON.stringify(data).substring(0, 100);
                console.log(`📦 Response: ${preview}...`);
                console.log('✅ DISPONIBLE');
            } else if (response.status === 401) {
                console.log('🔒 REQUIERE AUTENTICACIÓN ESPECIAL');
            } else if (response.status === 403) {
                console.log('🚫 ACCESO DENEGADO - FALTAN PERMISOS');
            } else if (response.status === 404) {
                console.log('❌ NO ENCONTRADO');
            } else {
                console.log(`⚠️  ERROR: ${response.status}`);
            }
            
        } catch (error) {
            console.log(`❌ ERROR: ${error.message}`);
        }
    }
    
    console.log('\n' + '='.repeat(50));
}

testEndpoints().catch(console.error);