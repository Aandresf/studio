const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.join(__dirname, '..');
const outputDir = path.join(projectRoot, 'dist');
const assetsDir = path.join(outputDir, 'backend');
const backendSrcDir = path.join(projectRoot, 'src-backend');

async function prepareInstallerFiles() {
    try {
        console.log('Iniciando la preparación de archivos para el instalador...');

        // 1. Limpiar y crear directorio de assets
        console.log('Limpiando y creando estructura de directorios...');
        await fs.emptyDir(assetsDir);
        await fs.ensureDir(path.join(assetsDir, 'data'));

        // 2. Compilar el backend directamente a la carpeta de resources
        console.log('Compilando el backend...');
        const outputPath = path.join(assetsDir, 'backend.exe');
        execSync(`npx pkg . -t node18-win-x64 -o "${outputPath}"`, {
            cwd: backendSrcDir,
            stdio: 'inherit'
        });
        console.log(`Backend compilado en: ${outputPath}`);

        // 3. Copiar las dependencias restantes
        console.log('Copiando dependencias...');
        const sqliteBindingPath = path.join(backendSrcDir, 'node_modules/sqlite3/build/Release/node_sqlite3.node');
        if (await fs.pathExists(sqliteBindingPath)) {
            await fs.copy(sqliteBindingPath, path.join(assetsDir, 'node_sqlite3.node'));
            console.log('Binding de SQLite3 copiado.');
        } else {
            throw new Error('¡Error crítico! No se encontró el binding de SQLite3.');
        }

        await fs.copy(
            path.join(backendSrcDir, 'schema.sql'),
            path.join(assetsDir, 'schema.sql')
        );
        console.log('Schema.sql copiado.');

        console.log('¡Archivos para el instalador preparados con éxito!');

    } catch (error) {
        console.error('Error preparando los archivos del instalador:', error);
        process.exit(1);
    }
}

prepareInstallerFiles();