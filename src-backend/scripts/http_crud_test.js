const fetch = require('node-fetch');

const base = 'http://localhost:3001/api';

async function login() {
  const res = await fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'master', password: process.env.MASTER_PASSWORD || 'master' }), redirect: 'manual' });
  if (!res.ok) throw new Error('Login failed: ' + res.status);
  const cookies = res.headers.raw()['set-cookie'] || [];
  const sessionCookie = cookies.find(c => c.startsWith('session='));
  if (!sessionCookie) throw new Error('No session cookie found');
  const cookieValue = sessionCookie.split(';')[0];
  const body = await res.json();
  return { cookie: cookieValue, user: body };
}

async function run() {
  try {
    console.log('Logging in...');
    const { cookie } = await login();
    console.log('Cookie:', cookie);

    // Create customer
    const create = await fetch(base + '/customers', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Cookie': cookie }, body: JSON.stringify({ name: 'Cliente HTTP', document: 'V-123', email: 'c@local' }) });
    console.log('POST /customers status', create.status);
    const created = await create.json();
    console.log('Created customer:', created);
    const id = created.id;

    const get = await fetch(base + `/customers/${id}`, { headers: { 'Cookie': cookie } });
    console.log('/customers/:id', await get.json());

    await fetch(base + `/customers/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Cookie': cookie }, body: JSON.stringify({ phone: '5555' }) });
    console.log('Updated customer');

    await fetch(base + `/customers/${id}`, { method: 'DELETE', headers: { 'Cookie': cookie } });
    console.log('Deleted customer');

    // Repeat for supplier
    const createS = await fetch(base + '/suppliers', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Cookie': cookie }, body: JSON.stringify({ name: 'Proveedor HTTP', document: 'J-321', email: 's@local' }) });
    console.log('POST /suppliers status', createS.status);
    const createdS = await createS.json();
    console.log('Created supplier:', createdS);
    const idS = createdS.id;

    const getS = await fetch(base + `/suppliers/${idS}`, { headers: { 'Cookie': cookie } });
    console.log('/suppliers/:id', await getS.json());

    await fetch(base + `/suppliers/${idS}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Cookie': cookie }, body: JSON.stringify({ phone: '7777' }) });
    console.log('Updated supplier');

    await fetch(base + `/suppliers/${idS}`, { method: 'DELETE', headers: { 'Cookie': cookie } });
    console.log('Deleted supplier');

    console.log('HTTP CRUD tests completed');
  } catch (e) {
    console.error('HTTP CRUD test error:', e.message);
    process.exit(2);
  }
}

run();
