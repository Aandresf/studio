const path = require('path');

const isPackaged = !!process.pkg;

// Directorio base: el del .exe si está empaquetado, o el del script si es desarrollo.
const baseDir = isPackaged ? path.dirname(process.execPath) : __dirname;

// Directorio de datos: siempre una subcarpeta 'data'.
const dataDir = path.join(baseDir, 'data');

// Ruta al schema: siempre junto al ejecutable o script principal.
const schemaPath = path.join(baseDir, 'schema.sql');

module.exports = {
    isPackaged,
    baseDir,
    dataDir,
    schemaPath
};
