const http = require('http');
const https = require('https');
const urls = [
  'https://127.0.0.1:3001/',
  'https://127.0.0.1:3001/index.html',
  'https://127.0.0.1:3001/sw.js',
  'https://192.168.0.6:3001/',
  'https://192.168.0.6:3001/index.html',
  'https://192.168.0.6:3001/api/server-info',
  'https://192.168.0.6:3001/api/health',
  'https://192.168.0.6:3001/api/qr?data=https://192.168.0.6:3001/'
];

function fetchUrl(u, timeout = 8000) {
  return new Promise((resolve) => {
    try {
      const lib = u.startsWith('https') ? https : http;
      const req = lib.get(u, (res) => {
        const { statusCode, headers } = res;
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (c) => {
          if (body.length < 2000) body += c;
        });
        res.on('end', () => {
          resolve({ url: u, statusCode, headers, body });
        });
      });
      req.on('error', (err) => resolve({ url: u, error: err.message }));
      req.setTimeout(timeout, () => {
        req.abort();
        resolve({ url: u, error: 'timeout' });
      });
    } catch (e) {
      resolve({ url: u, error: e.message });
    }
  });
}

(async () => {
  for (const u of urls) {
    console.log('\n--- ' + u + ' ---');
    const r = await fetchUrl(u);
    if (r.error) {
      console.log('ERROR:', r.error);
      continue;
    }
    console.log('STATUS:', r.statusCode);
    console.log('CONTENT-TYPE:', r.headers['content-type']);
    if (r.headers['content-length']) console.log('CONTENT-LENGTH:', r.headers['content-length']);
    if (r.body) {
      console.log('BODY (first 800 chars):\n', r.body.slice(0, 800));
    } else {
      console.log('NO BODY');
    }
  }
})();
