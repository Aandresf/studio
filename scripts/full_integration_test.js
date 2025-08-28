const http = require('http');

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: 'localhost', port: 3001, path, method, headers: {} };
    let data = null;
    if (body) {
      const s = JSON.stringify(body);
      opts.headers['Content-Type'] = 'application/json';
      opts.headers['Content-Length'] = Buffer.byteLength(s);
      data = s;
    }
    const req = http.request(opts, (res) => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        const contentType = res.headers['content-type'] || '';
        let parsed = buf;
        try { if (contentType.includes('application/json') || buf.trim().startsWith('{') || buf.trim().startsWith('[')) parsed = JSON.parse(buf); } catch (e) {}
        resolve({ statusCode: res.statusCode, body: parsed, raw: buf });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  try {
    console.log('\n1) Obtener productos');
    const prod = await request('GET', '/api/products');
    console.log('status', prod.statusCode);
    if (!prod.body || !Array.isArray(prod.body) || prod.body.length === 0) {
      console.error('No hay productos para probar.');
      return process.exit(1);
    }

    const firstProduct = prod.body[0];
    const firstVariant = (firstProduct.variants && firstProduct.variants[0]) || null;
    if (!firstVariant) { console.error('Producto no tiene variantes.'); return process.exit(1); }

    console.log('Usando variantId', firstVariant.id, 'stock', firstVariant.current_stock, 'cost', firstVariant.cost_price, 'sale', firstVariant.sale_price);

    // 2) Crear compra para incrementar stock
    console.log('\n2) Crear compra (POST /api/purchases)');
    const purchasePayload = {
      transaction_date: new Date().toISOString(),
      entity_name: 'Test Buyer',
      entity_document: 'T-000',
      items: [{ variantId: firstVariant.id, quantity: 2, unitCost: firstVariant.cost_price || 10, description: 'Compra test' }]
    };
    const puResp = await request('POST', '/api/purchases', purchasePayload);
    console.log('purchase', puResp.statusCode, puResp.body);
    const purchaseId = puResp.body && puResp.body.transaction_id;

    // 3) Crear venta (POST /api/sales)
    console.log('\n3) Crear venta (POST /api/sales)');
    const salePayload = {
      transaction_date: new Date().toISOString(),
      entity_name: 'Test Customer',
      entity_document: 'C-000',
      items: [{ variantId: firstVariant.id, quantity: 1, unitPrice: firstVariant.sale_price || (firstVariant.cost_price || 10) }]
    };
    const saResp = await request('POST', '/api/sales', salePayload);
    console.log('sale', saResp.statusCode, saResp.body);
    const saleId = saResp.body && saResp.body.transaction_id;

    // 4) Obtener detalle de compra y venta
    console.log('\n4) Obtener detalles (GET /api/purchases/details?id=...)');
    if (purchaseId) {
      const pd = await request('GET', `/api/purchases/details?id=${purchaseId}`);
      console.log('purchase details', pd.statusCode, pd.body);
    }
    if (saleId) {
      const sd = await request('GET', `/api/sales/details?id=${saleId}`);
      console.log('sale details', sd.statusCode, sd.body);
    }

    // 5) Anular venta (DELETE /api/transactions/sales/:id)
    if (saleId) {
      console.log('\n5) Anular venta (DELETE)');
      const delSale = await request('DELETE', `/api/transactions/sales/${saleId}`);
      console.log('delete sale', delSale.statusCode, delSale.body);
    }

    // 6) Anular compra (DELETE /api/transactions/purchases/:id)
    if (purchaseId) {
      console.log('\n6) Anular compra (DELETE)');
      const delPurchase = await request('DELETE', `/api/transactions/purchases/${purchaseId}`);
      console.log('delete purchase', delPurchase.statusCode, delPurchase.body);
    }

    // 7) Crear snapshot (POST /api/inventory/create-snapshot)
    console.log('\n7) Crear snapshot');
    const snapResp = await request('POST', '/api/inventory/create-snapshot', { snapshot_date: new Date().toISOString().slice(0,10) });
    console.log('snapshot', snapResp.statusCode, snapResp.body);

    // 8) Reportes: historical-summary
    console.log('\n8) Reporte histórico (POST /api/reports/historical-summary)');
    const hist = await request('POST', '/api/reports/historical-summary', { date: new Date().toISOString().slice(0,10) });
    console.log('historical-summary', hist.statusCode, hist.body);

    // 9) Reporte por tipo (POST /api/reports/SALES)
    console.log('\n9) Reporte SALES (POST /api/reports/SALES)');
    const rpt = await request('POST', '/api/reports/SALES', { startDate: '1970-01-01', endDate: new Date().toISOString().slice(0,10) });
    console.log('report sales', rpt.statusCode, Array.isArray(rpt.body) ? `rows:${rpt.body.length}` : rpt.body);

    console.log('\nIntegración completa finalizada');
  } catch (err) {
    console.error('ERROR TEST', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
