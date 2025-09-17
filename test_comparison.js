const http = require('http');

async function testEndpoints() {
    // Primero autenticar
    console.log('🔐 Autenticando...');
    const loginResponse = await makeRequest('POST', 'http://127.0.0.1:8080/api/auth/login', {
        username: 'admin',
        password: 'admin'
    });
    
    const token = loginResponse.token;
    console.log('✅ Token obtenido');
    
    // Probar endpoint de suppliers (que sabemos funciona)
    console.log('📊 Probando GET /api/suppliers...');
    try {
        const suppliersResponse = await makeRequest('GET', 'http://127.0.0.1:8080/api/suppliers', null, {
            'Authorization': `Bearer ${token}`
        });
        console.log('✅ ¡Endpoint suppliers funciona!', suppliersResponse.length, 'registros');
    } catch (error) {
        console.error('❌ Error en suppliers:', error.message);
    }
    
    // Probar endpoint de usuarios
    console.log('📊 Probando GET /api/usuarios...');
    try {
        const usuariosResponse = await makeRequest('GET', 'http://127.0.0.1:8080/api/usuarios', null, {
            'Authorization': `Bearer ${token}`
        });
        console.log('✅ ¡Endpoint usuarios funciona!');
        console.log('Respuesta:', JSON.stringify(usuariosResponse, null, 2));
    } catch (error) {
        console.error('❌ Error en usuarios:', error.message);
    }
}

function makeRequest(method, url, data = null, extraHeaders = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...extraHeaders
            }
        };

        const req = http.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                console.log(`Status: ${res.statusCode}`);
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const parsedData = responseData ? JSON.parse(responseData) : {};
                        resolve(parsedData);
                    } catch (e) {
                        resolve(responseData);
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

testEndpoints().catch(console.error);