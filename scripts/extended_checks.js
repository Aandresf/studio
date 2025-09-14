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

async function jsonGet(path) {
  const r = await request({ hostname: 'localhost', port: 3001, path, method: 'GET' });
  return { status: r.status, body: r.body && r.body.length ? JSON.parse(r.body) : null };
}

async function jsonPost(path, payload) {
  const body = JSON.stringify(payload);
  const r = await request({ hostname: 'localhost', port: 3001, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, body);
  return { status: r.status, body: r.body && r.body.length ? JSON.parse(r.body) : null };
}

async function jsonPut(path, payload) {
  const body = JSON.stringify(payload);
  const r = await request({ hostname: 'localhost', port: 3001, path, method: 'PUT', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, body);
  return { status: r.status, body: r.body && r.body.length ? JSON.parse(r.body) : null };
}

async function jsonDelete(path, payload) {
  const body = payload ? JSON.stringify(payload) : '';
  const headers = payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } : {};
  const r = await request({ hostname: 'localhost', port: 3001, path, method: 'DELETE', headers }, body);
  return { status: r.status, body: r.body && r.body.length ? JSON.parse(r.body) : null };
}

(async () => {
  try {
    console.log('A) Obtener primeros recursos');
    const products = await jsonGet('/api/products');
    console.log('GET /api/products', products.status);

    const variantsList = await jsonGet('/api/variants');
    console.log('GET /api/variants', variantsList.status);

    const variantId = variantsList.body && variantsList.body.length ? variantsList.body[0].id : 29;
    console.log('Usando variantId =', variantId);

    const variantBefore = await jsonGet('/api/variants/' + variantId);
    console.log('Variant before - status', variantBefore.status, 'body', variantBefore.body ? { current_stock: variantBefore.body.current_stock, cost_price: variantBefore.body.cost_price } : null);

    console.log('\nB) Crear compra de 2 unidades');
    const purchase = await jsonPost('/api/purchases', { transaction_date: new Date().toISOString(), entity_name: 'Test Buyer', entity_document: 'T-001', items: [{ variantId, quantity: 2, unitCost: 100 }] });
    console.log('POST /api/purchases', purchase.status, purchase.body);
    const purchaseId = purchase.body && purchase.body.transaction_id;

    const variantAfterPurchase = await jsonGet('/api/variants/' + variantId);
    console.log('Variant after purchase', variantAfterPurchase.status, variantAfterPurchase.body ? { current_stock: variantAfterPurchase.body.current_stock } : null);

    console.log('\nC) Crear venta de 1 unidad');
    const sale = await jsonPost('/api/sales', { transaction_date: new Date().toISOString(), entity_document: 'C-001', items: [{ variantId, quantity: 1, unitPrice: 150 }] });
    console.log('POST /api/sales', sale.status, sale.body);
    const saleId = sale.body && sale.body.transaction_id;

    const variantAfterSale = await jsonGet('/api/variants/' + variantId);
    console.log('Variant after sale', variantAfterSale.status, variantAfterSale.body ? { current_stock: variantAfterSale.body.current_stock } : null);

    console.log('\nD) Obtener detalles de compra y venta');
    const pDetails = await jsonGet('/api/purchases/details?id=' + purchaseId);
    console.log('GET purchase details', pDetails.status, pDetails.body ? { items: pDetails.body.items } : null);
    const sDetails = await jsonGet('/api/sales/details?id=' + saleId);
    console.log('GET sale details', sDetails.status, sDetails.body ? { items: sDetails.body.items } : null);

    console.log('\nE) Anular venta (DELETE /api/sales/:id)');
    const annulSale = await jsonDelete('/api/sales/' + saleId);
    console.log('DELETE sale by id', annulSale.status, annulSale.body);

    const variantAfterAnnulSale = await jsonGet('/api/variants/' + variantId);
    console.log('Variant after annul sale', variantAfterAnnulSale.status, variantAfterAnnulSale.body ? { current_stock: variantAfterAnnulSale.body.current_stock } : null);

    console.log('\nF) Anular compra (DELETE /api/purchases/:id)');
    const annulPurchase = await jsonDelete('/api/purchases/' + purchaseId);
    console.log('DELETE purchase by id', annulPurchase.status, annulPurchase.body);

    const variantAfterAnnulPurchase = await jsonGet('/api/variants/' + variantId);
    console.log('Variant after annul purchase', variantAfterAnnulPurchase.status, variantAfterAnnulPurchase.body ? { current_stock: variantAfterAnnulPurchase.body.current_stock } : null);

    console.log('\nChecks completos');

  } catch (err) {
    console.error('Error en extended checks:', err.message || err);
    process.exit(1);
  }
})();
