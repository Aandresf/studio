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
  try {
    const dash = await get('/api/dashboard/summary');
    console.log('DASHBOARD', dash.statusCode, dash.body);

    const deps = await get('/api/departments');
    console.log('DEPARTMENTS', deps.statusCode, deps.body);

    // try sku preview with dep/sub if available
    let depId = 0, subId = 0;
    try {
      const parsed = JSON.parse(deps.body || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) {
        depId = parsed[0].id;
        if (parsed[0].subdepartments && parsed[0].subdepartments.length > 0) subId = parsed[0].subdepartments[0].id;
      }
    } catch(e) {}

    const skuPath = `/api/sku/preview?depId=${depId || 1}&subId=${subId || 1}`;
    const sku = await get(skuPath);
    console.log('SKU_PREVIEW', sku.statusCode, sku.body);
  } catch (err) {
    console.error('ERROR', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
