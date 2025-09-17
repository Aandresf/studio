// Test CRUD completo para customers y suppliers
const BASE_URL = 'http://127.0.0.1:8080/api';
const AUTH_URL = `${BASE_URL}/auth/login`;

let authToken = null;

// Datos de prueba para customers
const testCustomers = [
    {
        name: "Juan Pérez",
        email: "juan.perez@email.com",
        phone: "555-1001",
        address: "Calle 1 #123",
        document: "12345678"
    },
    {
        name: "María García",
        email: "maria.garcia@email.com", 
        phone: "555-1002",
        address: "Calle 2 #456",
        document: "87654321"
    },
    {
        name: "Carlos López",
        email: "carlos.lopez@email.com",
        phone: "555-1003", 
        address: "Calle 3 #789",
        document: "11223344"
    },
    {
        name: "Ana Martínez",
        email: "ana.martinez@email.com",
        phone: "555-1004",
        address: "Calle 4 #012",
        document: "44332211"
    }
];

// Datos de prueba para suppliers
const testSuppliers = [
    {
        name: "Distribuidora Central",
        email: "ventas@distribuidora.com",
        phone: "555-2001",
        address: "Zona Industrial #100",
        document: "900123456"
    },
    {
        name: "Proveedores Unidos",
        email: "info@proveedores.com",
        phone: "555-2002", 
        address: "Zona Industrial #200",
        document: "900654321"
    },
    {
        name: "Suministros Express",
        email: "pedidos@express.com",
        phone: "555-2003",
        address: "Zona Industrial #300", 
        document: "900111222"
    }
];

async function authenticate() {
    console.log('🔐 AUTENTICANDO...');
    console.log('='.repeat(60));
    
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
        } else {
            console.log(`❌ Error de autenticación: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Error de conexión: ${error.message}`);
        return false;
    }
}

async function makeRequest(url, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    return await fetch(url, options);
}

async function testCRUD() {
    console.log('\n🧪 INICIANDO TESTS CRUD COMPLETOS');
    console.log('='.repeat(60));
    
    // Autenticar primero
    if (!await authenticate()) {
        console.log('❌ No se pudo autenticar. Cancelando tests.');
        return;
    }
    
    let createdCustomers = [];
    let createdSuppliers = [];
    
    // ========== CREAR CUSTOMERS ==========
    console.log('\n📝 CREANDO CUSTOMERS...');
    console.log('-'.repeat(40));
    
    for (let i = 0; i < testCustomers.length; i++) {
        const customer = testCustomers[i];
        console.log(`\n${i + 1}. Creando: ${customer.name}`);
        
        try {
            const response = await makeRequest(`${BASE_URL}/customers`, 'POST', customer);
            
            if (response.ok) {
                const created = await response.json();
                createdCustomers.push(created);
                console.log(`✅ Customer creado - ID: ${created.id}`);
            } else {
                console.log(`❌ Error creando customer: ${response.status}`);
                const error = await response.text();
                console.log(`📄 Error: ${error.substring(0, 100)}`);
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }
    
    // ========== CREAR SUPPLIERS ==========
    console.log('\n📦 CREANDO SUPPLIERS...');
    console.log('-'.repeat(40));
    
    for (let i = 0; i < testSuppliers.length; i++) {
        const supplier = testSuppliers[i];
        console.log(`\n${i + 1}. Creando: ${supplier.name}`);
        
        try {
            const response = await makeRequest(`${BASE_URL}/suppliers`, 'POST', supplier);
            
            if (response.ok) {
                const created = await response.json();
                createdSuppliers.push(created);
                console.log(`✅ Supplier creado - ID: ${created.id}`);
            } else {
                console.log(`❌ Error creando supplier: ${response.status}`);
                const error = await response.text();
                console.log(`📄 Error: ${error.substring(0, 100)}`);
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }
    
    // ========== UPDATE TESTS ==========
    console.log('\n🔄 PROBANDO UPDATES...');
    console.log('-'.repeat(40));
    
    // Update primer customer
    if (createdCustomers.length > 0) {
        const customerId = createdCustomers[0].id;
        const updateData = {
            name: "Juan Pérez ACTUALIZADO",
            email: "juan.updated@email.com",
            phone: "555-9999",
            address: "Nueva Dirección #999",
            document: "12345678"
        };
        
        console.log(`\n🔄 Actualizando Customer ID: ${customerId}`);
        try {
            const response = await makeRequest(`${BASE_URL}/customers/${customerId}`, 'PUT', updateData);
            
            if (response.ok) {
                console.log('✅ Customer actualizado exitosamente');
            } else {
                console.log(`❌ Error actualizando customer: ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }
    
    // Update primer supplier
    if (createdSuppliers.length > 0) {
        const supplierId = createdSuppliers[0].id;
        const updateData = {
            name: "Distribuidora Central ACTUALIZADA",
            email: "ventas.new@distribuidora.com",
            phone: "555-8888",
            address: "Nueva Zona Industrial #999",
            document: "900123456"
        };
        
        console.log(`\n🔄 Actualizando Supplier ID: ${supplierId}`);
        try {
            const response = await makeRequest(`${BASE_URL}/suppliers/${supplierId}`, 'PUT', updateData);
            
            if (response.ok) {
                console.log('✅ Supplier actualizado exitosamente');
            } else {
                console.log(`❌ Error actualizando supplier: ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }
    
    // ========== DELETE TESTS ==========
    console.log('\n🗑️  PROBANDO DELETES...');
    console.log('-'.repeat(40));
    
    // Delete último customer
    if (createdCustomers.length > 1) {
        const customerId = createdCustomers[createdCustomers.length - 1].id;
        console.log(`\n🗑️  Eliminando Customer ID: ${customerId}`);
        
        try {
            const response = await makeRequest(`${BASE_URL}/customers/${customerId}`, 'DELETE');
            
            if (response.ok) {
                console.log('✅ Customer eliminado exitosamente');
            } else {
                console.log(`❌ Error eliminando customer: ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }
    
    // Delete último supplier
    if (createdSuppliers.length > 1) {
        const supplierId = createdSuppliers[createdSuppliers.length - 1].id;
        console.log(`\n🗑️  Eliminando Supplier ID: ${supplierId}`);
        
        try {
            const response = await makeRequest(`${BASE_URL}/suppliers/${supplierId}`, 'DELETE');
            
            if (response.ok) {
                console.log('✅ Supplier eliminado exitosamente');
            } else {
                console.log(`❌ Error eliminando supplier: ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }
    
    // ========== VERIFICACIÓN FINAL CON GETS ==========
    console.log('\n📊 VERIFICACIÓN FINAL - LISTANDO TODOS LOS REGISTROS');
    console.log('='.repeat(60));
    
    // GET All Customers
    console.log('\n👥 CUSTOMERS:');
    try {
        const response = await makeRequest(`${BASE_URL}/customers`);
        if (response.ok) {
            const customers = await response.json();
            console.log(`✅ Total customers: ${customers.length}`);
            customers.forEach((customer, index) => {
                console.log(`  ${index + 1}. ID:${customer.id} - ${customer.name} (${customer.email})`);
            });
        } else {
            console.log(`❌ Error obteniendo customers: ${response.status}`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
    
    // GET All Suppliers
    console.log('\n📦 SUPPLIERS:');
    try {
        const response = await makeRequest(`${BASE_URL}/suppliers`);
        if (response.ok) {
            const suppliers = await response.json();
            console.log(`✅ Total suppliers: ${suppliers.length}`);
            suppliers.forEach((supplier, index) => {
                console.log(`  ${index + 1}. ID:${supplier.id} - ${supplier.name} (${supplier.email})`);
            });
        } else {
            console.log(`❌ Error obteniendo suppliers: ${response.status}`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ¡TESTS CRUD COMPLETOS FINALIZADOS!');
    console.log('='.repeat(60));
}

// Ejecutar los tests
testCRUD().catch(console.error);