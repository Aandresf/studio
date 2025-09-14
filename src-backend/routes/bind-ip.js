const fs = require('fs');
const path = require('path');
const os = require('os');
const { dataDir } = require('../config');

// Use dataDir from config (handles packaged vs dev) and ensure folder exists
const DATA_DIR = dataDir || path.join(__dirname, '..', 'data');
const ENV_PATH = path.join(DATA_DIR, '.env');

function writeBindIp(ip) {
  // ensure data dir exists and is writable
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.error('Error creating data dir for bind-ip:', e && e.message);
    throw e;
  }
  // read existing file
  let content = '';
  if (fs.existsSync(ENV_PATH)) content = fs.readFileSync(ENV_PATH, 'utf8');
  const lines = content.split(/\r?\n/).filter(Boolean).filter(l => !l.trim().startsWith('BIND_IP='));
  if (ip) lines.push(`BIND_IP=${ip}`);
  fs.writeFileSync(ENV_PATH, lines.join('\n') + (lines.length ? '\n' : ''), 'utf8');
}

function ipExistsOnHost(ip) {
  if (!ip) return false;
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface && iface.address && iface.address === ip) return true;
      // also accept IPv4-mapped IPv6 like ::ffff:192.168.0.5
      if (iface && iface.address && iface.address.includes(ip)) return true;
    }
  }
  return false;
}

module.exports = async function (req, res) {
  try {
    const ip = String(req.body && req.body.bind_ip || '').trim() || null;
    if (ip) {
      if (!ipExistsOnHost(ip)) {
        return res.status(400).json({ ok: false, error: 'ip_not_found_on_host' });
      }
    }
    writeBindIp(ip);
    res.json({ ok: true, bind_ip: ip });
  } catch (err) {
    console.error('Error writing bind ip:', err && err.message);
    res.status(500).json({ error: 'error writing bind ip' });
  }
};
