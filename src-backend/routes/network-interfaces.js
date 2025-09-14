const os = require('os');
const { execSync } = require('child_process');

function detectDefaultGateway() {
  try {
    const platform = process.platform;
    if (platform === 'win32') {
      const out = execSync('route PRINT', { encoding: 'utf8' });
      const m = out.match(/\b0\.0\.0\.0\s+0\.0\.0\.0\s+([0-9\.]+)/m);
      if (m && m[1]) return m[1];
    } else {
      const out = execSync('ip route', { encoding: 'utf8' });
      const m = out.match(/default via ([0-9\.]+)/);
      if (m && m[1]) return m[1];
    }
  } catch (e) {
    // ignore
  }
  return null;
}

function listInterfaces() {
  const ifaces = os.networkInterfaces();
  const gw = detectDefaultGateway();
  const list = [];
  Object.keys(ifaces).forEach(name => {
    (ifaces[name] || []).forEach(addr => {
      if (addr.family === 'IPv4' && !addr.internal) {
        const lname = name.toLowerCase();
        const type = /wi|wlan|wireless|wifi/.test(lname) ? 'wifi' : 'ethernet';
        list.push({ name, ip: addr.address, gateway: gw || null, type });
      }
    });
  });
  return list;
}

module.exports = function (req, res) {
  try {
    const list = listInterfaces();
    res.json(list);
  } catch (err) {
    console.error('Error listing network interfaces', err && err.message);
    res.status(500).json({ error: 'Error listing network interfaces' });
  }
};
