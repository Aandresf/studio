// Script de prueba: POST /api/products
// Ejecutar con: node tools\test_create_product.js

const API_BASE = process.env.API_BASE || 'http://localhost:3001/api';

(async () => {
  try {
    // 1) Login con master/master
    const loginRes = await fetch(API_BASE + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'master', password: 'master' })
    });

    const loginText = await loginRes.text();
    let loginBody;
    try { loginBody = JSON.parse(loginText); } catch (e) { loginBody = loginText; }
    console.log('Login status:', loginRes.status, 'body:', loginBody);

    if (!loginRes.ok) {
      console.error('Login failed, aborting test.');
      return;
    }

    // Obtener cookie de sesión del header Set-Cookie
    const cookie = loginRes.headers.get('set-cookie') || loginRes.headers.get('Set-Cookie');
    if (!cookie) console.warn('No se recibió Set-Cookie en la respuesta de login. Intentando continuar sin cookie.');

    // 2) Crear producto con cookie de sesión (si existe)
    const payload = {
      name: 'PRUEBA GPT ' + Date.now(),
      description: 'Producto creado por test script',
      brand_id: null,
      department_id: 1,
      subdepartment_id: 1,
      status: 'Activo',
      variants: [
        {
          sku: 'TESTSKU-' + Math.floor(Math.random()*10000),
          cost_price: 10.0,
          sale_price: 20.0,
          current_stock: 5,
          attribute_values: []
        },
        {
          sku: 'TESTSKU-' + Math.floor(Math.random()*10000),
          cost_price: 15.0,
          sale_price: 30.0,
          current_stock: 2,
          attribute_values: []
        },
        {
          sku: 'TESTSKU-' + Math.floor(Math.random()*10000),
          cost_price: 8.5,
          sale_price: 17.0,
          current_stock: 10,
          attribute_values: []
        }
      ]
    };

    const headers = { 'Content-Type': 'application/json' };
    if (cookie) headers['Cookie'] = cookie;

    console.log('POST', API_BASE + '/products');
    const res = await fetch(API_BASE + '/products', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let body;
    try { body = JSON.parse(text); } catch (e) { body = text; }

    console.log('Status:', res.status);
    console.log('Body:', body);
  } catch (err) {
    console.error('Request failed:', err);
  }
})();
