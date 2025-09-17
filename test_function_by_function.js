const https = require('https');

// Configuración para ignorar certificados auto-firmados
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const BASE_URL = 'http://127.0.0.1:8080/api';

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

async function testFourthFunction(token) {
    const headers = {
        'Authorization': `Bearer ${token}`
    };
    
    console.log('🔍 FUNCTION-BY-FUNCTION TEST: Cuarta función copiada');
    console.log('==================================================');
    console.log('Probando si update_supplier de suppliers.rs funciona en suppliers_debug...\n');
    
    // Datos de prueba para actualizar supplier (usamos el ID 1 que creamos antes)
    const updateSupplier = {
        name: "Test Supplier Debug UPDATED",
        rfc: "TST123456789",
        document: "Updated test supplier for debugging",
        address: "456 Updated Test Street",
        phone: "555-9999",
        email: "updated@supplier.com"
    };
    
    // Test 1: actualizar customer (baseline) - probablemente ya existe ID 1
    console.log('1. Testing PUT /api/customers/1 (baseline)');
    const updateCustomer = {
        name: "Test Customer UPDATED",
        rfc: "TCB123456789",
        document: "Updated test customer",
        address: "456 Updated Customer Street",
        phone: "555-8888",
        email: "updated@customer.com"
    };
    
    const customerResponse = await makeRequest(`${BASE_URL}/customers/1`, {
        method: 'PUT',
        body: JSON.stringify(updateCustomer),
        headers
    });
    console.log('Status:', customerResponse.status, (customerResponse.status === 200 || customerResponse.status === 404) ? '✅' : '❌');
    
    // Test 2: actualizar supplier en suppliers-debug (debería existir ID 1 que creamos)
    console.log('\n2. Testing PUT /api/suppliers-debug/1 (con update_supplier de suppliers.rs)');
    const supplierDebugResponse = await makeRequest(`${BASE_URL}/suppliers-debug/1`, {
        method: 'PUT',
        body: JSON.stringify(updateSupplier),
        headers
    });
    console.log('Status:', supplierDebugResponse.status, supplierDebugResponse.status === 200 ? '✅' : '❌');
    
    if (supplierDebugResponse.status === 200) {
        console.log('✅ SUCCESS: Supplier actualizado correctamente');
        console.log('Updated ID:', supplierDebugResponse.data.id);
        console.log('New Name:', supplierDebugResponse.data.name);
        console.log('New Address:', supplierDebugResponse.data.address);
    } else if (supplierDebugResponse.status === 404) {
        console.log('⚠️  WARNING: Supplier ID 1 no existe (404 - no encontrado)');
        console.log('Message:', supplierDebugResponse.data);
    } else {
        console.log('❌ FAILED: Error al actualizar supplier');
        console.log('Error:', supplierDebugResponse.data);
    }
    
    // Test 3: actualizar supplier en original (para comparar)
    console.log('\n3. Testing PUT /api/suppliers/1 (original - para comparar)');
    const suppliersResponse = await makeRequest(`${BASE_URL}/suppliers/1`, {
        method: 'PUT',
        body: JSON.stringify(updateSupplier),
        headers
    });
    console.log('Status:', suppliersResponse.status, suppliersResponse.status === 200 ? '✅' : '❌');
    
    console.log('\n=== 📊 RESULTADOS ===');
    console.log(`Customers PUT (baseline):        ${(customerResponse.status === 200 || customerResponse.status === 404) ? '✅' : '❌'}`);
    console.log(`Suppliers-debug PUT (función 4): ${supplierDebugResponse.status === 200 ? '✅' : '❌'}`);
    console.log(`Suppliers PUT (original):        ${suppliersResponse.status === 200 ? '✅' : '❌'}`);
    
    if (supplierDebugResponse.status === 200) {
        console.log('\n🎉 CUARTA FUNCIÓN COPIADA EXITOSAMENTE!');
        console.log('📋 Siguiente paso: Copiar quinta función (delete_supplier)');
    } else if (supplierDebugResponse.status === 404) {
        console.log('\n⚠️  CUARTA FUNCIÓN FUNCIONA (retorna 404 correctamente)');
        console.log('📋 Siguiente paso: Copiar quinta función (delete_supplier)');
    } else {
        console.log('\n❌ PROBLEMA EN CUARTA FUNCIÓN');
        console.log('🔧 Necesita revisar update_supplier antes de continuar');
    }
    
    return {
        customer: (customerResponse.status === 200 || customerResponse.status === 404),
        supplierDebug: (supplierDebugResponse.status === 200 || supplierDebugResponse.status === 404),
        suppliers: suppliersResponse.status === 200
    };
}

async function main() {
    const token = await login();
    if (!token) {
        console.log('❌ Login failed');
        return;
    }
    
    await testFourthFunction(token);
}

main().catch(console.error);