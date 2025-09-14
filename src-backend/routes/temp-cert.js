const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

// Leer la IP del .env
const envPath = path.join(__dirname, '../data/.env');
let BIND_IP = '192.168.0.6'; // default
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/BIND_IP\s*=\s*(.+)/);
    if (match) BIND_IP = match[1].trim();
}

router.get('/certs', (req, res) => {
    res.send(`
        <html>
        <head>
            <title>Certificados SSL</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 40px auto;
                    padding: 20px;
                    background: #f5f5f5;
                }
                .container {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                h1 { color: #333; }
                .file-list {
                    list-style: none;
                    padding: 0;
                }
                .file-item {
                    padding: 15px;
                    margin: 10px 0;
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 4px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .download-btn {
                    background: #007bff;
                    color: white;
                    padding: 8px 16px;
                    border-radius: 4px;
                    text-decoration: none;
                }
                .download-btn:hover {
                    background: #0056b3;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Certificados SSL para ${BIND_IP}</h1>
                <ul class="file-list">
                    <li class="file-item">
                        <span>Certificado y Clave (.p12)</span>
                        <a href="/temp/download-p12" class="download-btn">Descargar</a>
                        <small style="display:block;color:#666;margin-top:5px">Contraseña: temporal123</small>
                    </li>
                    <li class="file-item">
                        <span>Certificado (cert.pem)</span>
                        <a href="/temp/download-cert" class="download-btn">Descargar</a>
                    </li>
                    <li class="file-item">
                        <span>Clave Privada (key.pem)</span>
                        <a href="/temp/download-key" class="download-btn">Descargar</a>
                    </li>
                </ul>
            </div>
        </body>
        </html>
    `);
});

router.get('/download-cert', (req, res) => {
    const certPath = path.join(__dirname, '../data/.certs/cert.pem');
    try {
        const cert = fs.readFileSync(certPath);
        res.set('Content-Type', 'application/x-x509-ca-cert');
        res.set('Content-Disposition', 'attachment; filename="' + BIND_IP + '-cert.pem"');
        res.send(cert);
    } catch (error) {
        res.status(500).send('Error al leer el certificado');
    }
});

router.get('/download-key', (req, res) => {
    const keyPath = path.join(__dirname, '../data/.certs/key.pem');
    try {
        const key = fs.readFileSync(keyPath);
        res.set('Content-Type', 'application/x-pem-file');
        res.set('Content-Disposition', 'attachment; filename="' + BIND_IP + '-key.pem"');
        res.send(key);
    } catch (error) {
        res.status(500).send('Error al leer la clave privada');
    }
});

router.get('/download-p12', (req, res) => {
    const p12Path = path.join(__dirname, '../data/.certs/cert.p12');
    try {
        const p12 = fs.readFileSync(p12Path);
        res.set('Content-Type', 'application/x-pkcs12');
        res.set('Content-Disposition', 'attachment; filename="' + BIND_IP + '.p12"');
        res.send(p12);
    } catch (error) {
        res.status(500).send('Error al leer el archivo .p12');
    }
});

router.get('/cert-qr', async (req, res) => {
    const certsUrl = 'https://' + BIND_IP + ':3001/temp/certs';
    // Generar QR como PNG en lugar de HTML
    const qrBuffer = await QRCode.toBuffer(certsUrl, {
        errorCorrectionLevel: 'H',
        scale: 10,
        margin: 2,
        type: 'png'
    });
    res.type('png');
    res.send(qrBuffer);
});

module.exports = router;