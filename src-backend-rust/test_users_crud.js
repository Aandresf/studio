// Test CRUD completo para usuarios
const BASE_URL = 'http://127.0.0.1:8080/api';
const AUTH_URL = `${BASE_URL}/auth/login`;

let authToken = null;

// Datos de prueba para usuarios
const testUsers = [
    {
        username: "vendedor1",
        display_name: "Carlos Vendedor",
        email: "carlos.vendedor@studio.com",
        password: "password123",
        role_id: null, // Se asignará después de obtener roles
        status: "Activo"
    },
    {
        username: "cajero1", 
        display_name: "Ana Cajera",
        email: "ana.cajera@studio.com",
        password: "password123",
        role_id: null,
        status: "Activo"
    },
    {
        username: "inventario1",
        display_name: "Luis Inventario", 
        email: "luis.inventario@studio.com",
        password: "password123",
        role_id: null,
        status: "Activo"
    },
    {
        username: "gerente1",
        display_name: "María Gerente",
        email: "maria.gerente@studio.com", 
        password: "password123",
        role_id: null,
        status: "Activo"
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

async function getRoles() {
    console.log('📋 OBTENIENDO ROLES DISPONIBLES...');
    try {
        // Buscar endpoint de roles - puede estar en /api/roles o /api/admin/roles
        let response = await makeRequest(`${BASE_URL}/roles`);
        if (!response.ok) {
            response = await makeRequest(`${BASE_URL}/admin/roles`);
        }
        
        if (response.ok) {
            const roles = await response.json();
            console.log(`✅ Roles encontrados: ${roles.length}`);
            roles.forEach(role => {
                console.log(`   - ${role.id}: ${role.name} (${role.description || 'Sin descripción'})`);
            });
            return roles;
        } else {
            console.log(`⚠️  No se pudieron obtener roles: ${response.status}`);
            return [];
        }
    } catch (error) {
        console.log(`❌ Error obteniendo roles: ${error.message}`);
        return [];
    }
}

async function testUsersCRUD() {
    console.log('\n🧪 INICIANDO TESTS CRUD DE USUARIOS');
    console.log('='.repeat(60));
    
    // Autenticar primero
    if (!await authenticate()) {
        console.log('❌ No se pudo autenticar. Cancelando tests.');
        return;
    }
    
    // Obtener roles disponibles
    const roles = await getRoles();
    let defaultRoleId = null;
    
    if (roles.length > 0) {
        // Usar el primer rol como default
        defaultRoleId = roles[0].id;
        console.log(`✅ Usando rol por defecto: ${defaultRoleId}`);
        
        // Asignar role_id a todos los usuarios de prueba
        testUsers.forEach(user => {
            user.role_id = defaultRoleId;
        });
    } else {
        console.log('⚠️  No hay roles disponibles, creando usuarios sin rol');
    }
    
    let createdUsers = [];
    
    // ========== CREAR USUARIOS ==========
    console.log('\n👥 CREANDO USUARIOS...');
    console.log('-'.repeat(40));
    
    for (let i = 0; i < testUsers.length; i++) {
        const user = testUsers[i];
        console.log(`\n${i + 1}. Creando: ${user.display_name} (${user.username})`);
        
        try {
            const response = await makeRequest(`${BASE_URL}/users`, 'POST', user);
            
            if (response.ok) {
                const created = await response.json();
                createdUsers.push(created);
                console.log(`✅ Usuario creado - ID: ${created.id || created.user_id || 'Sin ID'}`);
                console.log(`   Username: ${created.username}`);
                console.log(`   Email: ${created.email || 'Sin email'}`);
                console.log(`   Role: ${created.role_id || 'Sin rol'}`);
            } else {
                console.log(`❌ Error creando usuario: ${response.status}`);
                const error = await response.text();
                console.log(`📄 Error: ${error.substring(0, 200)}`);
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }
    
    // ========== UPDATE TESTS ==========
    console.log('\n🔄 PROBANDO UPDATES...');
    console.log('-'.repeat(40));
    
    // Update primer usuario
    if (createdUsers.length > 0) {
        const user = createdUsers[0];
        const userId = user.id || user.user_id;
        
        const updateData = {
            display_name: "Carlos Vendedor ACTUALIZADO",
            email: "carlos.updated@studio.com",
            status: "Activo"
        };
        
        console.log(`\n🔄 Actualizando Usuario ID: ${userId}`);
        try {
            const response = await makeRequest(`${BASE_URL}/users/${userId}`, 'PUT', updateData);
            
            if (response.ok) {
                console.log('✅ Usuario actualizado exitosamente');
                const updated = await response.json();
                console.log(`   Display Name: ${updated.display_name}`);
                console.log(`   Email: ${updated.email}`);
            } else {
                console.log(`❌ Error actualizando usuario: ${response.status}`);
                const error = await response.text();
                console.log(`📄 Error: ${error.substring(0, 200)}`);
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }
    
    // ========== DELETE TESTS ==========
    console.log('\n🗑️  PROBANDO DELETES...');
    console.log('-'.repeat(40));
    
    // Delete último usuario
    if (createdUsers.length > 1) {
        const user = createdUsers[createdUsers.length - 1];
        const userId = user.id || user.user_id;
        
        console.log(`\n🗑️  Eliminando Usuario ID: ${userId}`);
        
        try {
            const response = await makeRequest(`${BASE_URL}/users/${userId}`, 'DELETE');
            
            if (response.ok) {
                console.log('✅ Usuario eliminado exitosamente');
            } else {
                console.log(`❌ Error eliminando usuario: ${response.status}`);
                const error = await response.text();
                console.log(`📄 Error: ${error.substring(0, 200)}`);
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }
    
    // ========== VERIFICACIÓN FINAL CON GETS ==========
    console.log('\n📊 VERIFICACIÓN FINAL - LISTANDO TODOS LOS USUARIOS');
    console.log('='.repeat(60));
    
    // GET All Users
    console.log('\n👥 USUARIOS:');
    try {
        const response = await makeRequest(`${BASE_URL}/users`);
        if (response.ok) {
            const users = await response.json();
            console.log(`✅ Total usuarios: ${users.length}`);
            users.forEach((user, index) => {
                const userId = user.id || user.user_id || 'Sin ID';
                const displayName = user.display_name || user.name || 'Sin nombre';
                const email = user.email || 'Sin email';
                const status = user.status || 'Sin status';
                const role = user.role_id || user.role || 'Sin rol';
                
                console.log(`  ${index + 1}. ID:${userId} - ${displayName}`);
                console.log(`     Username: ${user.username}, Email: ${email}`);
                console.log(`     Status: ${status}, Role: ${role}`);
                console.log('     ---');
            });
        } else {
            console.log(`❌ Error obteniendo usuarios: ${response.status}`);
            const error = await response.text();
            console.log(`📄 Error: ${error.substring(0, 200)}`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
    
    // GET User Count
    console.log('\n📊 CONTEO DE USUARIOS:');
    try {
        const response = await makeRequest(`${BASE_URL}/users/count`);
        if (response.ok) {
            const count = await response.json();
            console.log(`✅ Total usuarios en sistema: ${count.total || count.count || count}`);
        } else {
            console.log(`⚠️  No se pudo obtener conteo: ${response.status}`);
        }
    } catch (error) {
        console.log(`❌ Error obteniendo conteo: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ¡TESTS CRUD DE USUARIOS FINALIZADOS!');
    console.log('='.repeat(60));
}

// Ejecutar los tests
testUsersCRUD().catch(console.error);