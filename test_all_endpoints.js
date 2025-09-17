const http = require('http');

async function testAllEndpoints() {
    // Primero autenticar
    console.log('🔐 Autenticando...');
    const loginResponse = await makeRequest('POST', 'http://127.0.0.1:8080/api/auth/login', {
        username: 'admin',
        password: 'admin'
    });
    
    const token = loginResponse.token;
    console.log('✅ Token obtenido\n');
    
    const endpoints = [
        { name: 'usuarios', url: '/api/usuarios' },
        { name: 'users', url: '/api/users' },
        { name: 'suppliers', url: '/api/suppliers' },
        { name: 'customers', url: '/api/customers' },
        { name: 'dashboard', url: '/api/dashboard/stats' }
    ];
    
    for (const endpoint of endpoints) {
        console.log(`📊 Probando GET ${endpoint.url}...`);
        try {
            const response = await makeRequest('GET', `http://127.0.0.1:8080${endpoint.url}`, null, {
                'Authorization': `Bearer ${token}`
            });
            
            let resultInfo = '';
            if (Array.isArray(response)) {
                resultInfo = `${response.length} registros`;
            } else if (response.message) {
                resultInfo = response.message;
            } else {
                resultInfo = 'datos recibidos';
            }
            
            console.log(`✅ ${endpoint.name}: ${resultInfo}`);
        } catch (error) {
            console.error(`❌ ${endpoint.name}: ${error.message}`);
        }
    }
    
    console.log('\n🎯 Resumen de pruebas completado');
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

testAllEndpoints().catch(console.error);