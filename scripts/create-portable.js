const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const { glob } = require('glob');

const projectRoot = path.join(__dirname, '..');
const releaseBaseDir = path.join(projectRoot, 'dist/portable');
const appDir = path.join(releaseBaseDir, 'app');
const resourcesDir = path.join(appDir, 'resources'); // Carpeta de recursos
const tauriTargetDir = path.join(projectRoot, 'src-tauri/target/release');
const backendSrcDir = path.join(projectRoot, 'src-backend');

async function createPortableRelease() {
    try {
        console.log('Iniciando la creación del paquete portable...');

        // 1. Limpiar y crear directorios base
        await fs.emptyDir(releaseBaseDir);
        await fs.ensureDir(appDir);
        await fs.ensureDir(resourcesDir); // Asegurar que la carpeta de recursos exista
        await fs.ensureDir(path.join(resourcesDir, 'data')); // Y la de datos dentro

        // 2. Copiar archivos de la aplicación
        console.log('Copiando archivos de la aplicación...');
        
        // El .exe principal va a la raíz de 'app'
        await fs.copy(
            path.join(tauriTargetDir, 'inventario-app.exe'),
            path.join(appDir, 'Inventario App.exe')
        );

        // El backend y sus dependencias van a 'app/resources'
        await fs.copy(
            path.join(backendSrcDir, '..', 'src-tauri', 'binaries', 'backend.exe'),
            path.join(resourcesDir, 'backend.exe')
        );
        const sqliteBindingPath = path.join(backendSrcDir, 'node_modules/sqlite3/build/Release/node_sqlite3.node');
        if (await fs.pathExists(sqliteBindingPath)) {
            await fs.copy(sqliteBindingPath, path.join(resourcesDir, 'node_sqlite3.node'));
        }
        await fs.copy(
            path.join(backendSrcDir, 'schema.sql'),
            path.join(resourcesDir, 'schema.sql')
        );

        // Buscar y copiar WebView2Loader.dll a la raíz de 'app'
        const dllPattern = path.join(tauriTargetDir, '/**/WebView2Loader.dll').replace(/\\/g, '/');
        const dllPaths = await glob(dllPattern);
        if (dllPaths.length > 0) {
            await fs.copy(dllPaths[0], path.join(appDir, 'WebView2Loader.dll'));
        }

        // 3. Crear el script lanzador
        const launcherScript = `@echo off
cd /d "%~dp0\\app"
start "" "Inventario App.exe"
`;
        await fs.writeFile(path.join(releaseBaseDir, 'Iniciar Inventario.bat'), launcherScript);

        // 4. Comprimir
        const packageVersion = (await fs.readJson(path.join(projectRoot, 'package.json'))).version;
        const zipName = `Inventario-App-Portable-v${packageVersion}.zip`;
        const zipPath = path.join(projectRoot, 'dist', zipName);
        
        console.log(`Comprimiendo en ${zipName}...`);
        await zipDirectory(releaseBaseDir, zipPath);

        console.log('¡Paquete portable creado con éxito!');
        console.log(`-> Archivo ZIP: ${zipPath}`);

    } catch (error) {
        console.error('Error creando el paquete portable:', error);
        process.exit(1);
    }
}

function zipDirectory(source, out) {
    const archive = archiver('zip', { zlib: { level: 9 }});
    const stream = fs.createWriteStream(out);
    return new Promise((resolve, reject) => {
        archive.directory(source, false).on('error', err => reject(err)).pipe(stream);
        stream.on('close', () => resolve());
        archive.finalize();
    });
}

createPortableRelease();