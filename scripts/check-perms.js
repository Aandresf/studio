const fs = require('fs');
const path = require('path');
const dataPath = path.join(__dirname, '..', 'src-backend', 'data', 'users.json');
const id = 'F8a0MT2q'; // lector

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const user = data.users.find(u => u.id === id);
if (!user) { console.error('Usuario no encontrado'); process.exit(1); }
let perms = new Set();
if (user.roleId) {
  const role = data.roles.find(r => r.id === user.roleId);
  if (role && role.permissions) role.permissions.forEach(p => perms.add(p));
}
if (user.permissions) user.permissions.forEach(p => perms.add(p));
console.log('Usuario:', user.username, user.displayName);
console.log('Rol:', user.roleId);
console.log('Permisos efectivos:', Array.from(perms));

// Check sales:read
console.log('Tiene sales:read?', perms.has('*') || perms.has('sales:read'));
