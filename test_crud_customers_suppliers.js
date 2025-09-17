#!/usr/bin/env node

// Script para probar CRUD de customers y suppliers
const BASE_URL = 'http://localhost:8080/api';

// Función para hacer peticiones HTTP
async function makeRequest(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
    };
    
    // Agregar token de autenticación si está disponible
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(url, {
        headers,
        ...options
    });
    
    const result = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
    };
    
    try {
        const text = await response.text();
        if (text) {
            try {
                result.data = JSON.parse(text);
            } catch (parseError) {
                result.text = text;
            }
        }
    } catch (error) {
        // Si no se puede parsear como JSON, dejarlo como texto
        result.text = '';
    }
    
    return result;
}

// Función para imprimir resultados
function printResult(title, result) {
    console.log(`\n=== ${title} ===`);
    console.log(`Status: ${result.status} ${result.statusText}`);
    if (result.data) {
        console.log('Data:', JSON.stringify(result.data, null, 2));
    } else if (result.text) {
        console.log('Text:', result.text);
    }
}

// Variables para almacenar IDs creados y token de autenticación
let customerId = null;
let supplierId = null;
let authToken = null;

async function login() {
    console.log('🔐 Realizando login...');
    const loginData = {
        username: 'admin',
        password: 'admin'
    };
    
    const result = await makeRequest(`${BASE_URL}/auth/login`, {
        method: 'POST',
        body: JSON.stringify(loginData)
    });
    
    printResult('POST /auth/login - Login', result);
    
    if (result.status === 200 && result.data?.token) {
        authToken = result.data.token;
        console.log('✅ Login exitoso, token obtenido');
        return true;
    } else {
        console.log('❌ Login falló');
        console.log('Detalles del error:', result.data || result.text);
        return false;
    }
}

async function runTests() {
    console.log('🚀 Iniciando pruebas CRUD para Customers y Suppliers...');
    
    try {
        // Primero hacer login
        const loginSuccess = await login();
        if (!loginSuccess) {
            console.log('❌ No se pudo realizar login, abortando pruebas');
            return;
        }
        
        // ===== CUSTOMERS TESTS =====
        console.log('\n\n🔵 PROBANDO CUSTOMERS CRUD');
        
        // 1. GET /customers (listar todos)
        let result = await makeRequest(`${BASE_URL}/customers`);
        printResult('GET /customers - Listar todos los customers', result);
        
        // 2. POST /customers (crear nuevo)
        const newCustomer = {
            name: 'Cliente Test',
            document: '12345678-9',
            email: 'cliente@test.com',
            phone: '+56987654321',
            address: 'Dirección Test 123',
            notes: 'Cliente creado para pruebas'
        };
        
        result = await makeRequest(`${BASE_URL}/customers`, {
            method: 'POST',
            body: JSON.stringify(newCustomer)
        });
        printResult('POST /customers - Crear nuevo customer', result);
        
        if (result.status === 201 || result.status === 200) {
            customerId = result.data?.id;
            console.log(`✅ Customer creado con ID: ${customerId}`);
        }
        
        // 3. GET /customers/{id} (obtener por ID)
        if (customerId) {
            result = await makeRequest(`${BASE_URL}/customers/${customerId}`);
            printResult(`GET /customers/${customerId} - Obtener customer por ID`, result);
        }
        
        // 4. PUT /customers/{id} (actualizar)
        if (customerId) {
            const updateCustomer = {
                name: 'Cliente Test Actualizado',
                email: 'cliente.actualizado@test.com',
                notes: 'Customer actualizado en pruebas'
            };
            
            result = await makeRequest(`${BASE_URL}/customers/${customerId}`, {
                method: 'PUT',
                body: JSON.stringify(updateCustomer)
            });
            printResult(`PUT /customers/${customerId} - Actualizar customer`, result);
        }
        
        // 5. GET /customers?q=test (buscar)
        result = await makeRequest(`${BASE_URL}/customers?q=test`);
        printResult('GET /customers?q=test - Buscar customers', result);
        
        // ===== SUPPLIERS TESTS =====
        console.log('\n\n🟡 PROBANDO SUPPLIERS CRUD');
        
        // 1. GET /suppliers (listar todos)
        result = await makeRequest(`${BASE_URL}/suppliers`);
        printResult('GET /suppliers - Listar todos los suppliers', result);
        
        // 2. POST /suppliers (crear nuevo)
        const newSupplier = {
            name: 'Proveedor Test',
            document: '98765432-1',
            email: 'proveedor@test.com',
            phone: '+56912345678',
            address: 'Dirección Proveedor 456',
            notes: 'Proveedor creado para pruebas'
        };
        
        result = await makeRequest(`${BASE_URL}/suppliers`, {
            method: 'POST',
            body: JSON.stringify(newSupplier)
        });
        printResult('POST /suppliers - Crear nuevo supplier', result);
        
        if (result.status === 201 || result.status === 200) {
            supplierId = result.data?.id;
            console.log(`✅ Supplier creado con ID: ${supplierId}`);
        }
        
        // 3. GET /suppliers/{id} (obtener por ID)
        if (supplierId) {
            result = await makeRequest(`${BASE_URL}/suppliers/${supplierId}`);
            printResult(`GET /suppliers/${supplierId} - Obtener supplier por ID`, result);
        }
        
        // 4. PUT /suppliers/{id} (actualizar)
        if (supplierId) {
            const updateSupplier = {
                name: 'Proveedor Test Actualizado',
                email: 'proveedor.actualizado@test.com',
                notes: 'Supplier actualizado en pruebas'
            };
            
            result = await makeRequest(`${BASE_URL}/suppliers/${supplierId}`, {
                method: 'PUT',
                body: JSON.stringify(updateSupplier)
            });
            printResult(`PUT /suppliers/${supplierId} - Actualizar supplier`, result);
        }
        
        // 5. GET /suppliers?q=test (buscar)
        result = await makeRequest(`${BASE_URL}/suppliers?q=test`);
        printResult('GET /suppliers?q=test - Buscar suppliers', result);
        
        // ===== CLEANUP (opcional) =====
        console.log('\n\n🧹 LIMPIEZA OPCIONAL (comentado por seguridad)');
        
        // Uncomment these lines if you want to delete the test records
        /*
        if (customerId) {
            result = await makeRequest(`${BASE_URL}/customers/${customerId}`, {
                method: 'DELETE'
            });
            printResult(`DELETE /customers/${customerId} - Eliminar customer`, result);
        }
        
        if (supplierId) {
            result = await makeRequest(`${BASE_URL}/suppliers/${supplierId}`, {
                method: 'DELETE'
            });
            printResult(`DELETE /suppliers/${supplierId} - Eliminar supplier`, result);
        }
        */
        
        console.log('\n\n✅ PRUEBAS COMPLETADAS');
        console.log(`Customer ID creado: ${customerId}`);
        console.log(`Supplier ID creado: ${supplierId}`);
        console.log('\nNota: Los registros de prueba NO fueron eliminados. Puedes eliminarlos manualmente si lo deseas.');
        
    } catch (error) {
        console.error('\n❌ Error durante las pruebas:', error);
    }
}

// Ejecutar las pruebas
runTests();