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
        
        // 3.b Copiar la carpeta data del backend (contiene DB, settings y permissions.json)
        const backendDataSrc = path.join(projectRoot, 'src-backend', 'data');
        if (await fs.pathExists(backendDataSrc)) {
            console.log('Copiando carpeta data del backend al output...');
            await fs.copy(backendDataSrc, path.join(backendOutputDir, 'data'));
        } else {
            // Fallback: si no existe, intentar copiar permissions.json desde el frontend src/lib
            const permSrc = path.join(projectRoot, 'src', 'lib', 'permissions.json');
            if (await fs.pathExists(permSrc)) {
                console.log('No se encontró data/ en src-backend, copiando permissions.json desde src/lib como fallback...');
                await fs.ensureDir(path.join(backendOutputDir, 'data'));
                await fs.copy(permSrc, path.join(backendOutputDir, 'data', 'permissions.json'));
            } else {
                console.log('No hay carpeta data ni permissions.json en src/lib; asegúrate de incluir los archivos runtime necesarios manualmente.');
            }
        }
        
        // 4. Crear el payload final para Tauri (la parte clave)
        console.log('Creando payload final aplanado para el instalador...');
        // Antes de copiar el backend al payload, intentar incluir la carpeta frontend exportada (out)
        // Buscar rutas candidatas donde pueda estar la exportación estática:
        const frontendCandidates = [
            path.join(projectRoot, 'src-backend', 'data', 'out'),
            path.join(projectRoot, 'dist', 'frontend', 'out'),
            path.join(projectRoot, 'dist', 'frontend'),
            path.join(projectRoot, 'dist', 'out'),
            path.join(projectRoot, 'src', 'frontend', 'out')
        ];
        let foundFrontend = null;
        for (const p of frontendCandidates) {
            if (await fs.pathExists(p)) {
                foundFrontend = p;
                break;
            }
        }
        if (foundFrontend) {
            const dest = path.join(backendOutputDir, 'data', 'out');
            console.log(`Incluyendo carpeta frontend exportada en el payload desde: ${foundFrontend} -> ${dest}`);
            await fs.ensureDir(path.dirname(dest));
            await fs.remove(dest).catch(() => {}); // limpiar destino previo si existe
            await fs.copy(foundFrontend, dest);
        } else {
            console.log('No se encontró la carpeta frontend exportada (out) en las rutas candidatas. Si quieres incluirla, construye el frontend y colócala en src-backend/data/out.');
        }

    await fs.copy(backendOutputDir, payloadDir);
        console.log(`Payload final creado en: ${payloadDir}`);

        console.log('¡Archivos para el instalador preparados con éxito!');

    } catch (error) {
        console.error('Error preparando los archivos del instalador:', error);
        process.exit(1);
    }
}

prepareInstallerFiles();
