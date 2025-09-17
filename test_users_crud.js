const https = require('https');

// Desactivar verificación de certificados SSL para desarrollo
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const API_BASE = 'https://192.168.0.6:8443/api/users';
const LOGIN_URL = 'https://192.168.0.6:8443/api/auth/login';

class UserCRUDTester {
    constructor() {
        this.token = null;
        this.createdUsers = [];
    }

    async login() {
        console.log('🔐 Autenticando...');
        const loginData = {
            username: 'admin',
            password: 'admin'
        };

        try {
            const response = await this.makeRequest('POST', LOGIN_URL, loginData);
            this.token = response.token;
            console.log('✅ Autenticación exitosa');
            return true;
        } catch (error) {
            console.error('❌ Error de autenticación:', error.message);
            return false;
        }
    }

    async createUser(userData) {
        console.log(`\n📤 Creando usuario: ${userData.username}`);
        try {
            const response = await this.makeRequest('POST', API_BASE, userData);
            console.log('✅ Usuario creado:', response);
            this.createdUsers.push(response);
            return response;
        } catch (error) {
            console.error('❌ Error creando usuario:', error.message);
            throw error;
        }
    }

    async getUserById(userId) {
        console.log(`\n📥 Obteniendo usuario por ID: ${userId}`);
        try {
            const response = await this.makeRequest('GET', `${API_BASE}/${userId}`);
            console.log('✅ Usuario obtenido:', response);
            return response;
        } catch (error) {
            console.error('❌ Error obteniendo usuario:', error.message);
            throw error;
        }
    }

    async getAllUsers() {
        console.log('\n📋 Obteniendo todos los usuarios...');
        try {
            const response = await this.makeRequest('GET', API_BASE);
            console.log(`✅ Usuarios obtenidos (${response.length} usuarios):`);
            response.forEach((user, index) => {
                console.log(`   ${index + 1}. ${user.username} (${user.display_name}) - Rol: ${user.role_name}`);
            });
            return response;
        } catch (error) {
            console.error('❌ Error obteniendo usuarios:', error.message);
            throw error;
        }
    }

    async updateUser(userId, updateData) {
        console.log(`\n✏️ Actualizando usuario ID: ${userId}`);
        try {
            const response = await this.makeRequest('PUT', `${API_BASE}/${userId}`, updateData);
            console.log('✅ Usuario actualizado:', response);
            return response;
        } catch (error) {
            console.error('❌ Error actualizando usuario:', error.message);
            throw error;
        }
    }

    async deleteUser(userId) {
        console.log(`\n🗑️ Eliminando usuario ID: ${userId}`);
        try {
            await this.makeRequest('DELETE', `${API_BASE}/${userId}`);
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
                },
                rejectUnauthorized: false
            };

            if (this.token) {
                options.headers['Authorization'] = `Bearer ${this.token}`;
            }

            const req = https.request(options, (res) => {
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
        console.log('🚀 Iniciando pruebas de CRUD de usuarios\n');

        // Autenticar
        const loginSuccess = await this.login();
        if (!loginSuccess) {
            console.log('❌ No se pudo autenticar. Terminando pruebas.');
            return;
        }

        try {
            // Crear varios usuarios de prueba
            console.log('\n=== CREANDO USUARIOS DE PRUEBA ===');
            
            const usersToCreate = [
                {
                    username: 'carlos.ventas',
                    password: 'password123',
                    display_name: 'Carlos Vendedor',
                    role_id: 'sales_user',
                    is_active: true
                },
                {
                    username: 'ana.almacen',
                    password: 'password123',
                    display_name: 'Ana Almacén',
                    role_id: 'warehouse_user',
                    is_active: true
                },
                {
                    username: 'pedro.gerente',
                    password: 'password123',
                    display_name: 'Pedro Gerente',
                    role_id: 'manager',
                    is_active: true
                },
                {
                    username: 'lucia.admin',
                    password: 'password123',
                    display_name: 'Lucia Administradora',
                    role_id: 'admin',
                    is_active: true
                }
            ];

            for (const userData of usersToCreate) {
                await this.createUser(userData);
                await new Promise(resolve => setTimeout(resolve, 500)); // Pausa para no sobrecargar
            }

            // Actualizar algunos usuarios
            console.log('\n=== ACTUALIZANDO USUARIOS ===');
            if (this.createdUsers.length > 0) {
                const firstUser = this.createdUsers[0];
                await this.updateUser(firstUser.id, {
                    display_name: 'Carlos Vendedor Senior',
                    role_id: 'sales_manager'
                });

                if (this.createdUsers.length > 1) {
                    const secondUser = this.createdUsers[1];
                    await this.updateUser(secondUser.id, {
                        is_active: false
                    });
                }
            }

            // Eliminar algunos usuarios
            console.log('\n=== ELIMINANDO USUARIOS ===');
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

            // Listar todos los usuarios (al final como solicitaste)
            console.log('\n=== LISTADO FINAL DE USUARIOS ===');
            await this.getAllUsers();

            console.log('\n🎉 ¡Todas las pruebas de CRUD completadas exitosamente!');

        } catch (error) {
            console.error('\n💥 Error durante las pruebas:', error.message);
        }
    }
}

// Ejecutar las pruebas
const tester = new UserCRUDTester();
tester.runTests().catch(console.error);