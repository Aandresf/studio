const http = require('http');

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
  const endpoints = ['/api/products','/api/inventory/latest-snapshot','/api/purchases','/api/sales','/api/reports'];
  for (const ep of endpoints) {
    try {
      const r = await get(ep);
      console.log(ep, r.statusCode, r.body ? r.body.substring(0,1000) : '');
    } catch (e) {
      console.error(ep, 'ERROR', e.message);
    }
  }
})();
