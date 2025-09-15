const express = require('express');
const router = express.Router();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Middleware para forzar HTTPS
router.use((req, res, next) => {
    if (!req.secure) {
        return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
});

router.post('/generate', async (req, res) => {
    try {
        // Leer la IP del .env
        const envPath = path.join(__dirname, '../data/.env');
        let BIND_IP = '192.168.0.6'; // default
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const match = envContent.match(/BIND_IP\s*=\s*(.+)/);
            if (match) BIND_IP = match[1].trim();
        }

        // Ejecutar el script de generación de certificados
        const scriptPath = path.join(__dirname, '../../generarCertificados.js');
        execSync(`node "${scriptPath}" "${BIND_IP}"`, {
            stdio: 'inherit'
        });

        res.json({ success: true, message: 'Certificados generados correctamente' });
    } catch (error) {
        console.error('Error al generar certificados:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al generar los certificados',
            error: error.message 
        });
    }
});

module.exports = router;