const http = require('http');
const fs = require('fs');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: 'localhost', port: 3001, path, agent: false }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

(async () => {
  const out = {};
  try {
    out.dashboard = await get('/api/dashboard/summary');
  } catch (e) { out.dashboard = { error: e.message } }

  try {
    out.departments = await get('/api/departments');
  } catch (e) { out.departments = { error: e.message } }

  // attempt sku preview using first department/subdepartment if available
  try {
    let depId = 1, subId = 1;
    try {
      const deps = JSON.parse(out.departments.body || '[]');
      if (Array.isArray(deps) && deps.length > 0) {
        depId = deps[0].id || 1;
        if (deps[0].subdepartments && deps[0].subdepartments.length > 0) subId = deps[0].subdepartments[0].id || 1;
      }
    } catch(e) {}
    out.sku = await get(`/api/sku/preview?depId=${depId}&subId=${subId}`);
  } catch (e) { out.sku = { error: e.message } }

  fs.writeFileSync('scripts/smoke_output.json', JSON.stringify(out, null, 2));
  console.log('Smoke test complete, wrote scripts/smoke_output.json');
})();
