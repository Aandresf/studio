const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: 'localhost', port: 3001, path, agent: false }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

(async function(){
  try {
    const users = await get('/api/users');
    if (users.status !== 200) throw new Error('GET /api/users failed: ' + users.status);
    const parsed = JSON.parse(users.body);
    if (!Array.isArray(parsed.users)) throw new Error('users is not array');
    if (!Array.isArray(parsed.roles)) throw new Error('roles is not array');
    if (!Array.isArray(parsed.permissionsList)) throw new Error('permissionsList is not array');
    console.log('API /api/users OK. users:', parsed.users.length, 'roles:', parsed.roles.length);

    const uid = parsed.users[0] && parsed.users[0].id;
    if (!uid) throw new Error('No users to test further');
    const perms = await get('/api/users/' + uid + '/permissions');
    if (perms.status !== 200) throw new Error('/api/users/:id/permissions failed');
    const p = JSON.parse(perms.body);
    if (!Array.isArray(p.permissions)) throw new Error('permissions not array');
    console.log('User permissions OK. Count:', p.permissions.length);
    process.exit(0);
  } catch (e) {
    console.error('Test failed:', e.message);
    process.exit(2);
  }
})();
