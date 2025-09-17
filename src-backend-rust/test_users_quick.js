// Test rápido para verificar si users-test funciona
const AUTH_URL = 'http://127.0.0.1:8080/api/auth/login';
const USERS_URL = 'http://127.0.0.1:8080/api/users-test';

async function quickTest() {
    console.log('🔧 PROBANDO ENDPOINT USERS-TEST');
    
    // Autenticar
    const authResponse = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin' })
    });
    
    if (!authResponse.ok) {
        console.log('❌ Error de autenticación');
        return;
    }
    
    const authData = await authResponse.json();
    const token = authData.token;
    console.log('✅ Autenticación exitosa');
    
    // Probar users-test
    const usersResponse = await fetch(USERS_URL, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(`📊 Status /api/users-test: ${usersResponse.status}`);
    
    if (usersResponse.ok) {
        const data = await usersResponse.json();
        console.log('✅ ¡USERS-TEST FUNCIONA!');
        console.log(`📦 Response: ${JSON.stringify(data).substring(0, 200)}...`);
    } else {
        console.log('❌ users-test también falla');
    }
}

quickTest().catch(console.error);