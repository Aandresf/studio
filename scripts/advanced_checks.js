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

async function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

(async () => {
  try {
    console.log('1) Preparar: obtener una variante con stock >=2 o crear compra si hace falta');
    let variants = await jsonGet('/api/variants');
    if (!variants.body || variants.body.length === 0) throw new Error('No hay variantes');
    const variantId = variants.body[0].id;
    console.log('Usando variant', variantId);

    let variant = await jsonGet('/api/variants/' + variantId);
    console.log('Stock inicial', variant.body.current_stock);

    if (variant.body.current_stock < 2) {
      console.log('Aumentando stock con compra de 5');
      const p = await jsonPost('/api/purchases', { transaction_date: new Date().toISOString(), entity_name: 'Prep', entity_document: 'P-ADV', items: [{ variantId, quantity: 5, unitCost: 50 }] });
      console.log('Compra prep', p.status, p.body);
      await sleep(200);
      variant = await jsonGet('/api/variants/' + variantId);
      console.log('Stock ahora', variant.body.current_stock);
    }

    console.log('\n2) Validación: intentar vender por debajo del costo (debería fallar a menos allowSellBelowCost true)');
    // read settings of active store
    const stores = await jsonGet('/api/stores');
    const activeStoreId = stores.body && stores.body.stores && stores.body.stores.length ? stores.body.stores[0].id : stores.body.activeStoreId;
    console.log('activeStoreId', activeStoreId);

    // set allowSellBelowCost = false
    await jsonPut(`/api/stores/${activeStoreId}/details`, { advanced: { allowSellBelowCost: false } });
    await sleep(100);

    // get current variant cost
    variant = await jsonGet('/api/variants/' + variantId);
    const cost = variant.body.cost_price;
    console.log('cost_price', cost);

    const saleUnderCost = await jsonPost('/api/sales', { transaction_date: new Date().toISOString(), entity_document: 'C-ADV', items: [{ variantId, quantity: 1, unitPrice: cost - 1 }] });
    console.log('Venta por debajo costo (esperado fallo):', saleUnderCost.status, saleUnderCost.body);

    console.log('\n3) Habilitar allowSellBelowCost y volver a intentar (debería pasar)');
    await jsonPut(`/api/stores/${activeStoreId}/details`, { advanced: { allowSellBelowCost: true } });
    await sleep(100);
    const saleAllowed = await jsonPost('/api/sales', { transaction_date: new Date().toISOString(), entity_document: 'C-ADV', items: [{ variantId, quantity: 1, unitPrice: cost - 1 }] });
    console.log('Venta por debajo costo con permiso:', saleAllowed.status, saleAllowed.body);

    console.log('\n4) Prueba de concurrencia: disparar 5 ventas simultáneas de 2 unidades cada una sobre la misma variante');
    // prepare stock so tests are meaningful
    const prep = await jsonPost('/api/purchases', { transaction_date: new Date().toISOString(), entity_name: 'Prep Multi', entity_document: 'P-M', items: [{ variantId, quantity: 20, unitCost: 10 }] });
    console.log('Compra prep multi', prep.status);
    await sleep(200);

    const concurrentRequests = [];
    for (let i=0;i<5;i++) {
      concurrentRequests.push(jsonPost('/api/sales', { transaction_date: new Date().toISOString(), entity_document: `CC-${i}`, items: [{ variantId, quantity: 2, unitPrice: cost + 10 }] }));
    }
    const results = await Promise.all(concurrentRequests);
    results.forEach((r, i) => console.log(`concurrent ${i}:`, r.status, r.body));

    const variantAfterConcurrent = await jsonGet('/api/variants/' + variantId);
    console.log('Variant after concurrent sales', variantAfterConcurrent.body.current_stock);

    console.log('\nAdvanced checks completed');

  } catch (err) {
    console.error('Error in advanced checks:', err.message || err);
    process.exit(1);
  }
})();
