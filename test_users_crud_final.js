const http = require('http');

class UserCRUDTester {
    constructor() {
        this.token = null;
        this.createdUsers = [];
        this.availableRoles = [];
    }

    async login() {
        console.log('🔐 Autenticando...');
        try {
            const response = await this.makeRequest('POST', 'http://127.0.0.1:8080/api/auth/login', {
                username: 'admin',
                password: 'admin'
            });
            this.token = response.token;
            console.log('✅ Autenticación exitosa');
            return true;
        } catch (error) {
            console.error('❌ Error de autenticación:', error.message);
            return false;
        }
    }

    async getUsersAndRoles() {
        console.log('📋 Obteniendo usuarios y roles...');
        try {
            const response = await this.makeRequest('GET', 'http://127.0.0.1:8080/api/users');
            this.availableRoles = response.roles || [];
            console.log(`✅ ${this.availableRoles.length} roles disponibles`);
            console.log(`✅ ${response.users.length} usuarios existentes`);
            return response;
        } catch (error) {
            console.error('❌ Error obteniendo datos:', error.message);
            throw error;
        }
    }

    async createUser(userData) {
        console.log(`📤 Creando usuario: ${userData.username}`);
        try {
            const response = await this.makeRequest('POST', 'http://127.0.0.1:8080/api/users', userData);
            console.log('✅ Usuario creado:', response);
            this.createdUsers.push(response);
            return response;
        } catch (error) {
            console.error('❌ Error creando usuario:', error.message);
            console.error('❌ Detalles:', error);
            throw error;
        }
    }

    async getUserById(userId) {
        console.log(`📥 Obteniendo usuario por ID: ${userId}`);
        try {
            const response = await this.makeRequest('GET', `http://127.0.0.1:8080/api/users/${userId}`);
            console.log('✅ Usuario obtenido:', response);
            return response;
        } catch (error) {
            console.error('❌ Error obteniendo usuario:', error.message);
            throw error;
        }
    }

    async updateUser(userId, updateData) {
        console.log(`✏️ Actualizando usuario ID: ${userId}`);
        try {
            const response = await this.makeRequest('PUT', `http://127.0.0.1:8080/api/users/${userId}`, updateData);
            console.log('✅ Usuario actualizado:', response);
            return response;
        } catch (error) {
            console.error('❌ Error actualizando usuario:', error.message);
            throw error;
        }
    }

    async deleteUser(userId) {
        console.log(`🗑️ Eliminando usuario ID: ${userId}`);
        try {
            await this.makeRequest('DELETE', `http://127.0.0.1:8080/api/users/${userId}`);
            console.log('✅ Usuario eliminado');
            return true;
        } catch (error) {
            console.error('❌ Error eliminando usuario:', error.message);
            throw error;
        }
    }

    async makeRequest(method, url, data = null) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port,
                path: urlObj.pathname + urlObj.search,
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            if (this.token) {
                options.headers['Authorization'] = `Bearer ${this.token}`;
            }

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

    async runTests() {
        console.log('🚀 Iniciando pruebas CRUD de usuarios\n');

        // Autenticar
        const loginSuccess = await this.login();
        if (!loginSuccess) {
            console.log('❌ No se pudo autenticar. Terminando pruebas.');
            return;
        }

        try {
            // Obtener estado inicial
            console.log('\n=== ESTADO INICIAL ===');
            await this.getUsersAndRoles();

            // Crear varios usuarios de prueba
            console.log('\n=== CREANDO USUARIOS DE PRUEBA ===');
            
            const usersToCreate = [
                {
                    username: 'carlos.ventas',
                    password: 'password123',
                    display_name: 'Carlos Vendedor',
                    email: 'carlos@tienda.com',
                    role_id: 'sales'
                },
                {
                    username: 'ana.almacen',
                    password: 'password123', 
                    display_name: 'Ana Almacén',
                    email: 'ana@tienda.com',
                    role_id: 'warehouse'
                },
                {
                    username: 'pedro.gerente',
                    password: 'password123',
                    display_name: 'Pedro Gerente', 
                    email: 'pedro@tienda.com',
                    role_id: 'manager'
                }
            ];

            for (const userData of usersToCreate) {
                await this.createUser(userData);
                await new Promise(resolve => setTimeout(resolve, 500)); // Pausa
            }

            // Actualizar usuarios
            console.log('\n=== ACTUALIZANDO USUARIOS ===');
            if (this.createdUsers.length > 0) {
                const firstUser = this.createdUsers[0];
                await this.updateUser(firstUser.id, {
                    display_name: 'Carlos Vendedor Senior',
                    role_id: 'manager'
                });
            }

            // Eliminar un usuario
            console.log('\n=== ELIMINANDO USUARIO ===');
            if (this.createdUsers.length > 2) {
                const userToDelete = this.createdUsers[2];
                await this.deleteUser(userToDelete.id);
            }

            // Obtener usuarios individuales
            console.log('\n=== OBTENIENDO USUARIOS INDIVIDUALES ===');
            if (this.createdUsers.length > 0) {
                await this.getUserById(this.createdUsers[0].id);
                if (this.createdUsers.length > 1) {
                    await this.getUserById(this.createdUsers[1].id);
                }
            }

            // Listado final (al final como solicitaste)
            console.log('\n=== LISTADO FINAL DE USUARIOS ===');
            await this.getUsersAndRoles();

            console.log('\n🎉 ¡Todas las pruebas CRUD completadas exitosamente!');

        } catch (error) {
            console.error('\n💥 Error durante las pruebas:', error.message);
        }
    }
}

// Ejecutar las pruebas
const tester = new UserCRUDTester();
tester.runTests().catch(console.error);