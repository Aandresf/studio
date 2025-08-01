const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.join(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const backendOutputDir = path.join(distDir, 'backend');
const payloadDir = path.join(projectRoot, 'src-tauri/resources');

async function prepareInstallerFiles() {
    try {
        console.log('Iniciando la preparación de archivos para el instalador...');

        // 1. Limpiar directorios
        console.log('Limpiando directorios de compilación...');
        await fs.emptyDir(backendOutputDir);
        await fs.emptyDir(payloadDir);
        await fs.ensureDir(path.join(backendOutputDir, 'data')); // Recrear data en la salida del back

        // 2. Compilar el backend a su carpeta de salida
        console.log('Compilando el backend...');
        const backendExePath = path.join(backendOutputDir, 'backend.exe');
        execSync(`npx pkg . -t node18-win-x64 -o "${backendExePath}"`, {
            cwd: path.join(projectRoot, 'src-backend'),
            stdio: 'inherit'
        });
        console.log(`Backend compilado en: ${backendExePath}`);

        // 3. Copiar dependencias a la carpeta de salida del backend
        console.log('Copiando dependencias del backend...');
        const sqliteBindingPath = path.join(projectRoot, 'src-backend/node_modules/sqlite3/build/Release/node_sqlite3.node');
        if (await fs.pathExists(sqliteBindingPath)) {
            await fs.copy(sqliteBindingPath, path.join(backendOutputDir, 'node_sqlite3.node'));
        } else {
            throw new Error('¡Error crítico! No se encontró el binding de SQLite3.');
        }
        await fs.copy(path.join(projectRoot, 'src-backend/schema.sql'), path.join(backendOutputDir, 'schema.sql'));
        
        // 4. Crear el payload final para Tauri (la parte clave)
        console.log('Creando payload final aplanado para el instalador...');
        await fs.copy(backendOutputDir, payloadDir);
        console.log(`Payload final creado en: ${payloadDir}`);

        console.log('¡Archivos para el instalador preparados con éxito!');

    } catch (error) {
        console.error('Error preparando los archivos del instalador:', error);
        process.exit(1);
    }
}

prepareInstallerFiles();
