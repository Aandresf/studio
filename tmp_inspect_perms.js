const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'src-backend', 'data', 'database_disveliz_diaz_studio_848V.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err)=>{
  if(err) { console.error('DB open error', err.message); process.exit(1); }
});
function q(sql, params=[]) { return new Promise((res,rej)=> db.all(sql, params, (e,r)=> e?rej(e):res(r))); }
(async ()=>{
  try{
    const users = await q('SELECT id, username, role_id, display_name FROM users WHERE username = ?', ['master']);
    console.log('users:', users);
    if(users.length===0){
      const byRole = await q('SELECT id, username, role_id, display_name FROM users WHERE role_id = ?', ['master']);
      console.log('users by role master:', byRole);
    }
    const allPerms = await q('SELECT id, key, description FROM permissions');
    console.log('permissions count:', allPerms.length);
    const userPerms = await q('SELECT up.user_id, p.key FROM user_permissions up JOIN permissions p ON up.permission_id = p.id');
    console.log('user_permissions sample (first 20):', userPerms.slice(0,20));
    const rolePerms = await q('SELECT rp.role_id, p.key FROM role_permissions rp JOIN permissions p ON rp.permission_id = p.id WHERE rp.role_id = ?', ['master']);
    console.log('role_permissions for master:', rolePerms);

    // Also inspect effective permissions for any user with username 'master'
    if(users.length>0){
      const uid = users[0].id;
      const direct = await q('SELECT p.key FROM permissions p JOIN user_permissions up ON p.id = up.permission_id WHERE up.user_id = ?', [uid]);
      const roleId = users[0].role_id;
      const rolePermsAll = roleId ? await q('SELECT p.key FROM permissions p JOIN role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id = ?', [roleId]) : [];
      console.log('direct perms for user:', direct.map(r=>r.key));
      console.log('role perms for user role:', rolePermsAll.map(r=>r.key));
    }
  }catch(e){console.error(e)}finally{db.close(()=>{});} 
})();
