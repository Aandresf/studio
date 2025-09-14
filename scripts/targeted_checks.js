const fetch = require('node-fetch');

const base = 'http://localhost:3001/api';

async function ok(res) {
  console.log('status', res.status);
  const t = await res.text();
  try { console.log(JSON.parse(t)); } catch(e) { console.log(t); }
}

(async () => {
  console.log('1) GET /products');
  await ok(await fetch(base + '/products'));

  console.log('\n2) GET /brands');
  await ok(await fetch(base + '/brands'));

  console.log('\n3) GET /departments');
  await ok(await fetch(base + '/departments'));

  console.log('\n4) GET /variants (via /products/:id/variants if exists)');
  const productsRes = await fetch(base + '/products');
  const products = await productsRes.json();
  const variantId = products[0] && products[0].variants && products[0].variants[0] ? products[0].variants[0].id : null;
  if (variantId) {
    await ok(await fetch(base + '/variants/' + variantId));
  } else {
    console.log('No variantId found in products response, listing /variants');
    await ok(await fetch(base + '/variants'));
  }

  console.log('\n5) POST create purchase (minimal)');
  const purchase = await fetch(base + '/purchases', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ transaction_date: new Date().toISOString(), entity_name: 'Test Buyer', entity_document: 'T-000', items: [{ variantId: variantId || 29, quantity: 1, unitCost: 100 }] })
  });
  await ok(purchase);

  console.log('\n6) POST create sale (minimal)');
  const sale = await fetch(base + '/sales', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ transaction_date: new Date().toISOString(), entity_document: 'C-000', items: [{ variantId: variantId || 29, quantity: 1, unitPrice: 150 }] })
  });
  await ok(sale);

})();
