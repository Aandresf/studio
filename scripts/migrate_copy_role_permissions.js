const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'src-backend', 'data');
const USERS_FILE = path.join(dataDir, 'users.json');

function readUsersData() {
  if (!fs.existsSync(USERS_FILE)) {
    throw new Error(`No se encuentra ${USERS_FILE}`);
  }
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

function writeUsersData(data) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

function backup(filePath) {
  const dest = filePath + '.bak.' + new Date().toISOString().replace(/[:.]/g, '-')
  fs.copyFileSync(filePath, dest);
  return dest;
}

function migrate() {
  console.log('Leyendo datos de usuarios...');
  const data = readUsersData();
  const roles = data.roles || [];
  const users = data.users || [];

  const backupPath = backup(USERS_FILE);
  console.log('Backup creado en:', backupPath);

  let changed = 0;
  users.forEach(u => {
    const role = roles.find(r => r.id === u.roleId);
    const rolePerms = Array.isArray(role?.permissions) ? role.permissions : [];
    const userPerms = Array.isArray(u.permissions) ? u.permissions : [];
    // union
    const union = Array.from(new Set([...(userPerms || []), ...(rolePerms || [])]));
    // si hay diferencia, actualizamos
    const equal = union.length === userPerms.length && union.every(v => userPerms.includes(v));
    if (!equal) {
      u.permissions = union;
      changed++;
      console.log(`Usuario ${u.username} (${u.id}) actualizado. Permisos ahora: [${u.permissions.join(',')}]`);
    }
  });

  if (changed > 0) {
    writeUsersData(data);
    console.log(`Migración completa. Usuarios actualizados: ${changed}`);
  } else {
    console.log('No se detectaron cambios necesarios.');
  }
}

try {
  migrate();
} catch (err) {
  console.error('Error durante migración:', err.message);
  process.exit(1);
}
