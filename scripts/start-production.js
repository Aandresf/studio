#!/usr/bin/env node
/**
 * scripts/start-production.js
 *
 * Usage:
 *   node scripts/start-production.js 192.168.0.6
 *
 * What it does:
 *  - writes `src-backend/data/.env` with BIND_IP=<ip>
 *  - writes `.env.production` in project root with NEXT_PUBLIC_API_URL=http://<ip>:3001
 *  - runs `npm run compile:frontend` (next build) to bake NEXT_PUBLIC_API_URL into the build
 *  - starts backend (npm run start-backend) and frontend (npm run start) as child processes
 *
 * Notes:
 *  - In production you likely want a process manager (pm2/systemd/container) instead of this script.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const backendDataDir = path.join(repoRoot, 'src-backend', 'data');
const backendEnvPath = path.join(backendDataDir, '.env');
const rootEnvProduction = path.join(repoRoot, '.env.production');

function writeBackendEnv(ip) {
  if (!fs.existsSync(backendDataDir)) fs.mkdirSync(backendDataDir, { recursive: true });
  fs.writeFileSync(backendEnvPath, `BIND_IP=${ip}\n`, 'utf8');
}

function writeFrontendEnvProduction(ip) {
  const content = `NEXT_PUBLIC_API_URL=http://${ip}:3001\n`;
  fs.writeFileSync(rootEnvProduction, content, 'utf8');
}

async function runCmd(cmd, args, opts={}){
  return new Promise((resolve, reject)=>{
    const child = spawn(cmd, args, Object.assign({ stdio: 'inherit', cwd: repoRoot, env: process.env }, opts));
    child.on('exit', code => code===0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} exited ${code}`)) );
    child.on('error', reject);
  });
}

async function main(){
  const ip = process.argv[2];
  if (!ip) {
    console.error('Usage: node scripts/start-production.js <bind-ip>');
    process.exit(1);
  }

  console.log('Writing backend env...');
  writeBackendEnv(ip);
  console.log('Writing frontend .env.production with NEXT_PUBLIC_API_URL...');
  writeFrontendEnvProduction(ip);

  try {
    console.log('Building frontend (next build)...');
    await runCmd(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'compile:frontend']);
  } catch (err) {
    console.error('Frontend build failed:', err.message);
    process.exit(1);
  }

  // Start backend and frontend in parallel
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

  const backend = spawn(npmCmd, ['run', 'start-backend'], { cwd: repoRoot, env: Object.assign({}, process.env, { BIND_IP: ip }), stdio: 'inherit' });

  const frontend = spawn(npmCmd, ['run', 'start'], { cwd: repoRoot, env: Object.assign({}, process.env), stdio: 'inherit' });

  function stopAll(){
    try{ backend.kill(); } catch(e){}
    try{ frontend.kill(); } catch(e){}
    process.exit(0);
  }
  process.on('SIGINT', stopAll);
  process.on('SIGTERM', stopAll);
}

main().catch(err => {
  console.error('start-production error:', err && err.message);
  process.exit(1);
});
