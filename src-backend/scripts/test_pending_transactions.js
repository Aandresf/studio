const http = require('http');

const base = 'http://localhost:3001/api/pending-transactions';

function get() {
  return new Promise((resolve) => {
    http.get(base, (res) => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve({ status: res.statusCode, body: b }));
    }).on('error', e => resolve({ err: e.message }));
  });
}

function post(data) {
  return new Promise((resolve) => {
    const d = JSON.stringify(data);
    const u = new URL(base);
    const opts = {
      method: 'POST', hostname: u.hostname, port: u.port, path: u.pathname,
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d) }
    };
    const req = http.request(opts, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve({ status: res.statusCode, body: b }));
    });
    req.on('error', e => resolve({ err: e.message }));
    req.write(d); req.end();
  });
}

function del(id) {
  return new Promise((resolve) => {
    const u = new URL(base + '/' + id);
    const opts = { method: 'DELETE', hostname: u.hostname, port: u.port, path: u.pathname };
    const req = http.request(opts, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve({ status: res.statusCode, body: b }));
    });
    req.on('error', e => resolve({ err: e.message }));
    req.end();
  });
}

(async () => {
  console.log('GET before:');
  console.log(await get());

  const newItem = { type: 'sale', payload: { id: 'pending-test-' + Date.now(), cart: [{ productId: 1, qty: 2 }], clientName: 'Test', date: new Date().toISOString() } };
  console.log('POST:');
  const p = await post(newItem);
  console.log(p);

  console.log('GET after add:');
  console.log(await get());

  let created;
  try {
    const parsed = JSON.parse(p.body);
    created = parsed.id || parsed.id || parsed.id;
  } catch (e) {}

  if (!created) {
    const g = await get();
    try {
      const parsed = JSON.parse(g.body);
      if (parsed.sales && parsed.sales.length) created = parsed.sales[0].id;
    } catch (e) {}
  }

  if (created) {
    console.log('DELETE:', created);
    console.log(await del(created));
  }

  console.log('GET final:');
  console.log(await get());
})();
