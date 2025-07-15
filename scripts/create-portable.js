const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const { glob } = require('glob');

const projectRoot = path.join(__dirname, '..');
const releaseBaseDir = path.join(projectRoot, 'PORTABLE_RELEASE_v2');
const appDir = path.join(releaseBaseDir, 'app');
const dataDir = path.join(appDir, 'data');
const tauriTargetDir = path.join(projectRoot, 'src-tauri/target/release');
const backendSrcDir = path.join(projectRoot, 'src-backend');

async function createPortableRelease() {
    try {
        console.log('Iniciando la creación del paquete portable...');

        // 1. Limpiar y crear directorios base
        console.log('Limpiando y creando estructura de directorios...');
        await fs.emptyDir(releaseBaseDir);
        await fs.ensureDir(appDir);
        await fs.ensureDir(dataDir);

        // 2. Copiar archivos de la aplicación a la carpeta 'app'
        console.log('Copiando archivos de la aplicación...');
        await fs.copy(
            path.join(tauriTargetDir, 'inventario-app.exe'),
            path.join(appDir, 'Inventario App.exe')
        );
        await fs.copy(
            path.join(projectRoot, 'src-tauri/binaries/backend.exe'),
            path.join(appDir, 'backend.exe')
        );

        // Búsqueda y copia dinámica de WebView2Loader.dll
        const dllPattern = path.join(tauriTargetDir, '/**/WebView2Loader.dll').replace(/\\/g, '/');
        const dllPaths = await glob(dllPattern);
        if (dllPaths.length > 0) {
            await fs.copy(dllPaths[0], path.join(appDir, 'WebView2Loader.dll'));
            console.log(`WebView2Loader.dll copiado desde ${dllPaths[0]}`);
        } else {
            console.warn('Advertencia: No se encontró WebView2Loader.dll. La aplicación podría no funcionar en sistemas sin el runtime preinstalado.');
        }

        // Copia el binding binario de SQLite3 que no se empaqueta automáticamente
        const sqliteBindingPath = path.join(backendSrcDir, 'node_modules/sqlite3/build/Release/node_sqlite3.node');
        if (await fs.pathExists(sqliteBindingPath)) {
            await fs.copy(sqliteBindingPath, path.join(appDir, 'node_sqlite3.node'));
            console.log('Binding de SQLite3 copiado.');
        } else {
            console.warn('Advertencia: No se encontró el binding de SQLite3. La base de datos podría fallar.');
        }

        // 3. Colocar archivos de datos limpios en la carpeta 'app/data'
        console.log('Copiando schema y creando configuración de tienda en blanco...');
        await fs.copy(
            path.join(backendSrcDir, 'schema.sql'),
            path.join(dataDir, 'schema.sql')
        );
        await fs.writeJson(path.join(dataDir, 'stores.json'), {
            stores: [],
            activeStoreId: null
        }, { spaces: 2 });

        // 4. Crear el script lanzador en la raíz
        console.log('Creando script lanzador...');
        const launcherScript = `@echo off
echo Lanzando el backend y la aplicacion...
cd /d "%~dp0\\app"

echo Abriendo consola del backend...
start "Backend Console" cmd /k "backend.exe"

echo Esperando 2 segundos para que el backend inicie...
timeout /t 2 /nobreak > nul

echo Lanzando aplicacion principal...
start "" "Inventario App.exe"
`;
        await fs.writeFile(path.join(releaseBaseDir, 'Iniciar Inventario.bat'), launcherScript);

        // 5. Comprimir la carpeta en un archivo .zip
        const packageVersion = (await fs.readJson(path.join(projectRoot, 'package.json'))).version;
        const zipName = `Inventario-App-Portable-v${packageVersion}.zip`;
        const zipPath = path.join(projectRoot, zipName);
        
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
        archive
            .directory(source, false)
            .on('error', err => reject(err))
            .pipe(stream);

        stream.on('close', () => resolve());
        archive.finalize();
    });
}

createPortableRelease();
