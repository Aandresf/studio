const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../data/database_disveliz_diaz_studio_848V.db');
console.log('DB PATH:', dbPath);
const db = new sqlite3.Database(dbPath, (err) => { if (err) return console.error('OPEN ERR', err.message); });

const ids = ['sYO4RcUx','l4pLQ3Zc'];

function get(sql, params){return new Promise((res,rej)=>db.get(sql, params, (e,r)=>e?rej(e):res(r)));}
function all(sql, params){return new Promise((res,rej)=>db.all(sql, params, (e,r)=>e?rej(e):res(r)));}

(async ()=>{
  try{
    const fk = await all("PRAGMA foreign_keys;");
    console.log('PRAGMA foreign_keys:', fk);
    for(const id of ids){
      const u = await get('SELECT id, username, created_at FROM users WHERE id = ?', [id]);
      console.log('USER', id, '=>', u);
      const ups = await all('SELECT * FROM user_permissions WHERE user_id = ?', [id]);
      console.log('USER_PERMISSIONS for', id, ups);
    }
  }catch(err){
    console.error(err);
  }finally{ db.close(); }
})();
