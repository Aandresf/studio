#!/usr/bin/env node
/**
 * scripts/start-with-bind.js
 *
 * Usage:
 *   node scripts/start-with-bind.js <bind-ip>
 *   node scripts/start-with-bind.js            # reads existing src-backend/data/.env
 *
 * This script will:
 *  - read or create `src-backend/data/.env` with BIND_IP
 *  - spawn backend (npm run start-backend) and frontend (npm run dev) processes
 *    with environment variables so both bind/use the selected IP.
 *
 * On Windows (cmd.exe) it's safe because we spawn node child processes directly.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const backendDataDir = path.join(repoRoot, 'src-backend', 'data');
const envPath = path.join(backendDataDir, '.env');

function readBindIpFromEnv() {
  try {
    if (!fs.existsSync(envPath)) return null;
    const content = fs.readFileSync(envPath, 'utf8');
    const m = content.match(/BIND_IP=(.*)/);
    if (m) return m[1].trim();
    return null;
  } catch (e) {
    return null;
  }
}

function writeBindIpToEnv(ip) {
  if (!fs.existsSync(backendDataDir)) fs.mkdirSync(backendDataDir, { recursive: true });
  const content = `BIND_IP=${ip}\n`;
  fs.writeFileSync(envPath, content, 'utf8');
}

async function main() {
  const argIp = process.argv[2];
  let bindIp = argIp || readBindIpFromEnv();

  if (!bindIp) {
    console.error('Usage: node scripts/start-with-bind.js <bind-ip>');
    process.exit(1);
  }

  // persist
  writeBindIpToEnv(bindIp);
  console.log('Persisted BIND_IP=', bindIp, 'to', envPath);

  // Start backend (node src-backend/index.js) with HOST env override
  const backendEnv = Object.assign({}, process.env, { BIND_IP: bindIp });
  console.log('Starting backend with BIND_IP=' + bindIp);
  const backend = spawn(process.execPath, ['src-backend/index.js'], {
    cwd: repoRoot,
    env: backendEnv,
    stdio: 'inherit'
  });

  // helper: wait until backend reports healthy or server-info
  async function waitForBackend(ip, port = 3001, timeoutMs = 15000) {
    const base = `http://${ip}:${port}`;
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const res = await fetch(`${base}/api/health`, { method: 'GET' });
        if (res.ok) return true;
      } catch (e) {
        // ignore
      }
      try {
        const res2 = await fetch(`${base}/api/server-info`, { method: 'GET' });
        if (res2.ok) return true;
      } catch (e) {
        // ignore
      }
      await new Promise(r => setTimeout(r, 500));
    }
    return false;
  }

  // Start frontend (next dev) with NEXT_PUBLIC_API_URL and HOST
  // assume frontend dev runs on port 9002 as in package.json
  const frontendPort = process.env.FRONTEND_PORT || '9002';
  const frontendEnv = Object.assign({}, process.env, {
    HOST: bindIp,
    NEXT_PUBLIC_API_URL: `http://${bindIp}:3001`,
    PORT: frontendPort
  });

  console.log(`Starting frontend dev on ${bindIp}:${frontendPort} with NEXT_PUBLIC_API_URL=${frontendEnv.NEXT_PUBLIC_API_URL}`);
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  let frontend;
  try {
    // try with shell:true to be more robust on Windows environments
    // wait for backend to be ready before starting frontend
    const ready = await waitForBackend(bindIp, 3001, 20000);
    if (!ready) console.warn('Backend did not respond to /api/health or /api/server-info within timeout; starting frontend anyway');
    else console.log('Backend is responding; starting frontend');

    // pass hostname and port through to the underlying `next dev` command
    frontend = spawn(npmCmd, ['run', 'dev', '--', '--hostname', bindIp, '-p', String(frontendPort)], {
      cwd: repoRoot,
      env: frontendEnv,
      stdio: 'inherit',
      shell: true
    });
  } catch (err) {
    console.error('Failed to spawn frontend with npmCmd:', npmCmd, err && err.message);
    // fallback: on Windows try cmd /c npm run dev
    if (process.platform === 'win32') {
        try {
        frontend = spawn('cmd.exe', ['/c', 'npm', 'run', 'dev', '--', '--hostname', bindIp, '-p', String(frontendPort)], { cwd: repoRoot, env: frontendEnv, stdio: 'inherit' });
      } catch (err2) {
        console.error('Fallback spawn failed:', err2 && err2.message);
        throw err2;
      }
    } else {
      throw err;
    }
  }

  // Handle termination: kill both children when this script gets killed
  function stopAll() {
    try { backend.kill(); } catch (e) {}
    try { frontend.kill(); } catch (e) {}
    process.exit(0);
  }

  process.on('SIGINT', stopAll);
  process.on('SIGTERM', stopAll);
}

main().catch(err => {
  console.error('start-with-bind error:', err);
  process.exit(1);
});
