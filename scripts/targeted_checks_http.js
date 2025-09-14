const http = require('http');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

(async () => {
  try {
    console.log('1) GET /api/products');
    let r = await request({ hostname: 'localhost', port: 3001, path: '/api/products', method: 'GET' });
    console.log('status', r.status);

    console.log('\n2) GET /api/brands');
    r = await request({ hostname: 'localhost', port: 3001, path: '/api/brands', method: 'GET' });
    console.log('status', r.status);

    console.log('\n3) GET /api/departments');
    r = await request({ hostname: 'localhost', port: 3001, path: '/api/departments', method: 'GET' });
    console.log('status', r.status);

    console.log('\n4) GET /api/variants');
    r = await request({ hostname: 'localhost', port: 3001, path: '/api/variants', method: 'GET' });
    console.log('status', r.status);

    console.log('\n5) POST /api/purchases (minimal)');
    const purchasePayload = JSON.stringify({ transaction_date: new Date().toISOString(), entity_name: 'Test Buyer', entity_document: 'T-000', items: [{ variantId: 29, quantity: 1, unitCost: 100 }] });
    r = await request({ hostname: 'localhost', port: 3001, path: '/api/purchases', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(purchasePayload) } }, purchasePayload);
    console.log('status', r.status, r.body);

    console.log('\n6) POST /api/sales (minimal)');
    const salePayload = JSON.stringify({ transaction_date: new Date().toISOString(), entity_document: 'C-000', items: [{ variantId: 29, quantity: 1, unitPrice: 150 }] });
    r = await request({ hostname: 'localhost', port: 3001, path: '/api/sales', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(salePayload) } }, salePayload);
    console.log('status', r.status, r.body);

  } catch (err) {
    console.error('Error running checks', err.message || err);
    process.exit(1);
  }
})();
