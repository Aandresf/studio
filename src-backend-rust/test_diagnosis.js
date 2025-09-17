// Test de diagnóstico para comparar endpoints
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
            return true;
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
    return false;
}

async function testComparison() {
    console.log('🔍 COMPARANDO ENDPOINTS FUNCIONANDO VS NO FUNCIONANDO');
    console.log('='.repeat(60));
    
    if (!await authenticate()) {
        console.log('❌ No se pudo autenticar');
        return;
    }
    
    const workingEndpoints = [
        '/api/customers',
        '/api/suppliers',
        '/api/dashboard'
    ];
    
    const notWorkingEndpoints = [
        '/api/users'
    ];
    
    console.log('\n✅ ENDPOINTS QUE FUNCIONAN:');
    console.log('-'.repeat(30));
    
    for (const endpoint of workingEndpoints) {
        try {
            const response = await fetch(`http://127.0.0.1:8080${endpoint}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            
            console.log(`${endpoint}: ${response.status} ${response.status === 200 ? '✅' : '⚠️'}`);
            
        } catch (error) {
            console.log(`${endpoint}: ERROR - ${error.message}`);
        }
    }
    
    console.log('\n❌ ENDPOINTS QUE NO FUNCIONAN:');
    console.log('-'.repeat(30));
    
    for (const endpoint of notWorkingEndpoints) {
        try {
            const response = await fetch(`http://127.0.0.1:8080${endpoint}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            
            console.log(`${endpoint}: ${response.status} ${response.status === 200 ? '✅' : '❌'}`);
            
            if (!response.ok) {
                const text = await response.text();
                console.log(`   Error detail: ${text.substring(0, 100)}`);
            }
            
        } catch (error) {
            console.log(`${endpoint}: ERROR - ${error.message}`);
        }
    }
    
    console.log('\n🔧 DIAGNÓSTICO:');
    console.log('Los endpoints de customers y suppliers usan web::Data<Arc<DatabaseManager>>');
    console.log('El endpoint de users usa web::Data<DbPool>');
    console.log('Esto podría ser la causa del problema 404.');
    
    console.log('\n💡 SUGERENCIA:');
    console.log('Modifica users.rs para usar el mismo patrón que suppliers.rs');
}

testComparison().catch(console.error);