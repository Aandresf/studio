const API_BASE = process.env.API_BASE || 'http://localhost:3001/api';

(async () => {
  try {
    const loginRes = await fetch(API_BASE + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'master', password: 'master' })
    });
    if (!loginRes.ok) { console.error('login failed', await loginRes.text()); return; }
    const cookie = loginRes.headers.get('set-cookie') || loginRes.headers.get('Set-Cookie');

    const payload = {
      name: 'cdcdcdcd',
      description: undefined,
      brand_id: 9,
      department_id: 3,
      subdepartment_id: 10,
      status: 'Activo',
      variants: [
        { sku: 'CAL-CAB-001-vla-vlu', cost_price: 100, sale_price: 120, current_stock: 12, attribute_values: [ { id: 20 }, { id: 22 } ] },
        { sku: 'CAL-CAB-001-vla-vlu', cost_price: 120, sale_price: 140, current_stock: 13, attribute_values: [] }
      ]
    };

    const headers = { 'Content-Type': 'application/json' };
    if (cookie) headers['Cookie'] = cookie;

    const res = await fetch(API_BASE + '/products', { method: 'POST', headers, body: JSON.stringify(payload) });
    console.log('Status', res.status);
    console.log('Body', await res.text());
  } catch (err) {
    console.error(err);
  }
})();
