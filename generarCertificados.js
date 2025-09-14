const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Obtener la IP desde los argumentos de la línea de comandos
const ip = process.argv[2] || '127.0.0.1';
// Usaremos la IP como Common Name para mayor claridad en certificados de LAN
const domain = process.argv[3] || 'localhost'; // opcional: permitir pasar un dominio (fallback localhost)

const certDir = path.join(__dirname, 'certs');

// Verificar si el directorio 'certs' existe, si no, crearlo.
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir);
  console.log(`Directorio '${certDir}' creado.`);
}

// 1. Crear el archivo de configuración para OpenSSL
const confContent = `
[ req ]
default_bits       = 2048
prompt             = no
distinguished_name = dn
req_extensions     = req_ext
x509_extensions    = req_ext

[ dn ]
CN = ${ip}

[ req_ext ]
subjectAltName = @alt_names

[ alt_names ]
DNS.1 = ${domain}
IP.1 = ${ip}
`;

const confFilePath = path.join(certDir, `cert_${ip}.conf`);
fs.writeFileSync(confFilePath, confContent);
console.log(`Archivo de configuración '${confFilePath}' creado.`);

// 2. Generar la clave privada y el certificado autofirmado
const keyPath = path.join(certDir, `${ip}.key`);
const certPath = path.join(certDir, `${ip}.crt`);

try {
  console.log('Generando la clave privada...');
  execSync(`openssl genpkey -algorithm RSA -out ${keyPath} -pkeyopt rsa_keygen_bits:2048`);

  console.log(`Generando el certificado autofirmado para ${ip} (incluye SAN)...`);
  // Nota: pasamos -extensions req_ext y también x509_extensions para asegurar que SAN se incluya
  execSync(`openssl req -new -key ${keyPath} -out ${path.join(certDir, `${ip}.csr`)} -config ${confFilePath}`);
  execSync(`openssl x509 -req -in ${path.join(certDir, `${ip}.csr`)} -signkey ${keyPath} -sha256 -days 365 -out ${certPath} -extensions req_ext -extfile ${confFilePath}`);

  // Además crear copias en formato .pem (nombres esperados por el servidor)
  const pemKeyPath = path.join(__dirname, 'src-backend', 'data', '.certs', 'key.pem');
  const pemCertPath = path.join(__dirname, 'src-backend', 'data', '.certs', 'cert.pem');
  // asegurar directorio destino
  const destDir = path.dirname(pemKeyPath);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(keyPath, pemKeyPath);
  fs.copyFileSync(certPath, pemCertPath);
  console.log(`Copiadas claves a: ${pemKeyPath} y ${pemCertPath}`);

  console.log('\n✅ ¡Certificado y clave generados con éxito!');
  console.log(`- Clave privada: ${keyPath}`);
  console.log(`- Certificado: ${certPath}`);
  console.log('\nAhora puedes configurar tu servidor web para usar estos archivos.');

} catch (error) {
  console.error('❌ Error al generar el certificado:', error.message);
  console.error('Asegúrate de que OpenSSL está instalado y accesible en tu PATH.');
  fs.unlinkSync(confFilePath); // Eliminar el archivo de configuración si falla el proceso.
  if (fs.existsSync(keyPath)) fs.unlinkSync(keyPath);
  if (fs.existsSync(certPath)) fs.unlinkSync(certPath);
}