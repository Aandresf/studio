const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'src-backend', 'data', 'out');
const target = path.join(__dirname, '..', 'src-backend', 'embedded_pwa.js');

function walk(dir, base = '') {
  const entries = [];
  if (!fs.existsSync(dir)) return entries;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = path.join(base, name).replace(/\\/g, '/');
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      entries.push(...walk(full, rel));
    } else {
      entries.push({ full, rel });
    }
  }
  return entries;
}

function shouldEmbed(rel) {
  // embed pwa.html, sw.js, manifest.json, icons, pwa/* and _next/*
  if (rel === 'pwa.html' || rel === 'sw.js' || rel === 'manifest.json' || rel.startsWith('pwa/') || rel.startsWith('_next/') || rel.startsWith('icons/')) return true;
  return false;
}

function main() {
  const files = walk(outDir);
  const toEmbed = files.filter(f => shouldEmbed(f.rel));

  const parts = [];
  parts.push('// generated file - embedded pwa assets as base64 map');
  parts.push('module.exports = {');
  for (const f of toEmbed) {
    const buf = fs.readFileSync(f.full);
    const b64 = buf.toString('base64');
    parts.push(`  ${JSON.stringify('/' + f.rel)}: { b64: ${JSON.stringify(b64)}, mime: ${JSON.stringify(getMime(f.rel))} },`);
  }
  parts.push('};');

  fs.writeFileSync(target, parts.join('\n'), 'utf8');
  console.log('Wrote', target, 'with', toEmbed.length, 'entries');
}

function getMime(rel) {
  if (rel.endsWith('.html')) return 'text/html; charset=utf-8';
  if (rel.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (rel.endsWith('.css')) return 'text/css; charset=utf-8';
  if (rel.endsWith('.json')) return 'application/json; charset=utf-8';
  if (rel.endsWith('.png')) return 'image/png';
  if (rel.endsWith('.jpg') || rel.endsWith('.jpeg')) return 'image/jpeg';
  if (rel.endsWith('.svg')) return 'image/svg+xml';
  if (rel.endsWith('.webmanifest')) return 'application/manifest+json';
  return 'application/octet-stream';
}

if (require.main === module) main();
