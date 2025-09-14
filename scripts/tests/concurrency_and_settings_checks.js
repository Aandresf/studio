const http = require('http');

function requestRaw(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function getRaw(path) {
  return await requestRaw({ hostname: 'localhost', port: 3001, path, method: 'GET' });
}
async function postRaw(path, payload) {
  const body = JSON.stringify(payload);
  return await requestRaw({ hostname: 'localhost', port: 3001, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, body);
}
async function putRaw(path, payload) {
  const body = JSON.stringify(payload);
  return await requestRaw({ hostname: 'localhost', port: 3001, path, method: 'PUT', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, body);
}

(async () => {
  try {
    console.log('1) Obtener variantId');
    const v = await getRaw('/api/variants');
    console.log('GET /api/variants status', v.status);
    let variantList = [];
    try { variantList = JSON.parse(v.body); } catch(e) { console.error('parse error', e); process.exit(1); }
    const variantId = variantList[0] && variantList[0].id ? variantList[0].id : 1;
    console.log('Usando variantId=', variantId);

    console.log('\n2) Obtener stores y activeStoreId');
    const stores = await getRaw('/api/stores');
    console.log('GET /api/stores status', stores.status);
    let storesJson = {};
    try { storesJson = JSON.parse(stores.body); } catch(e) { console.error('stores parse error', e); process.exit(1); }
    const activeStoreId = storesJson.activeStoreId || (storesJson.stores && storesJson.stores[0] && storesJson.stores[0].id) || 'main';
    console.log('activeStoreId', activeStoreId);

    console.log('\n3) Establecer allowSellBelowCost = false');
    const put0 = await putRaw(`/api/stores/${activeStoreId}/details`, { advanced: { allowSellBelowCost: false } });
    console.log('PUT settings status', put0.status, put0.body);

    console.log('\n4) Intentar venta por debajo costo (cruda)');
    const variant = await getRaw('/api/variants/' + variantId);
    let cost = 0;
    try { cost = JSON.parse(variant.body).cost_price; } catch(e) { console.error('variant parse err', e); }
    console.log('variant cost_price', cost);
    const salePayload = { transaction_date: new Date().toISOString(), entity_document: 'C-CHK', items: [{ variantId, quantity: 1, unitPrice: Math.max(0, cost - 1) }] };
    const saleResp = await postRaw('/api/sales', salePayload).catch(err => ({ error: String(err) }));
    console.log('Sale under cost raw response:', saleResp && saleResp.status, saleResp && saleResp.body ? saleResp.body : saleResp.error);

    console.log('\n5) Habilitar allowSellBelowCost = true');
    const put1 = await putRaw(`/api/stores/${activeStoreId}/details`, { advanced: { allowSellBelowCost: true } });
    console.log('PUT settings status', put1.status, put1.body);

    console.log('\n6) Intentar venta por debajo costo (debe permitir)');
    const saleResp2 = await postRaw('/api/sales', salePayload).catch(err => ({ error: String(err) }));
    console.log('Sale under cost (allowed) raw response:', saleResp2 && saleResp2.status, saleResp2 && saleResp2.body ? saleResp2.body : saleResp2.error);

    console.log('\n7) Preparar stock para concurrencia (compra 50)');
    const prep = await postRaw('/api/purchases', { transaction_date: new Date().toISOString(), entity_name: 'PrepConcurrent', entity_document: 'P-CON', items: [{ variantId, quantity: 50, unitCost: 5 }] });
    console.log('Prep purchase status', prep.status);

    console.log('\n8) Concurrencia: lanzar 10 ventas simult\u00e1neas de 3 unidades cada una');
    const concurrent = [];
    for (let i=0;i<10;i++) {
      const pl = { transaction_date: new Date().toISOString(), entity_document: `CON-${i}`, items: [{ variantId, quantity: 3, unitPrice: cost + 10 }] };
      concurrent.push(postRaw('/api/sales', pl).catch(e => ({ error: String(e) })));
    }
    const results = await Promise.all(concurrent);
    results.forEach((r, idx) => console.log('concurrent', idx, 'status', r.status || 'ERR', r.body ? (r.body.length>100 ? r.body.slice(0,100)+'...' : r.body) : r.error));

    const variantFinal = await getRaw('/api/variants/' + variantId);
    console.log('\nVariant final raw:', variantFinal.status, variantFinal.body);

    console.log('\nConcurrencia completa');

  } catch (err) {
    console.error('Fatal in test:', err);
    process.exit(1);
  }
})();
