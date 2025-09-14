#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function extractMetadataKeys(tsPath) {
  const content = fs.readFileSync(tsPath, 'utf8');
  const marker = 'const METADATA_MAP';
  const idx = content.indexOf(marker);
  if (idx === -1) return null;
  const sub = content.slice(idx);
  const end = sub.indexOf('};');
  if (end === -1) return null;
  const mapBody = sub.slice(0, end + 2);
  const re = /['"]([^'"]+)['"]\s*:/g;
  const keys = [];
  let m;
  while ((m = re.exec(mapBody)) !== null) {
    keys.push(m[1]);
  }
  return keys;
}

async function main() {
  const repoRoot = path.join(__dirname, '..', '..');
  const pjPath = path.join(repoRoot, 'src', 'lib', 'permissions.json');
  const pmPath = path.join(repoRoot, 'src', 'lib', 'permissionsMeta.ts');
  if (!fs.existsSync(pjPath)) {
    console.error('permissions.json not found at', pjPath);
    process.exit(2);
  }
  if (!fs.existsSync(pmPath)) {
    console.error('permissionsMeta.ts not found at', pmPath);
    process.exit(2);
  }

  const pj = readJson(pjPath);
  const jsonKeys = (pj.permissions || []).map(p => p.key).filter(Boolean).sort();
  const metaKeys = extractMetadataKeys(pmPath) || [];
  metaKeys.sort();

  const inJsonNotMeta = jsonKeys.filter(k => !metaKeys.includes(k));
  const inMetaNotJson = metaKeys.filter(k => !jsonKeys.includes(k));

  console.log('permissions.json keys:', jsonKeys.length);
  console.log('METADATA_MAP keys:', metaKeys.length);
  console.log('');
  if (inJsonNotMeta.length === 0 && inMetaNotJson.length === 0) {
    console.log('OK: permissions.json and METADATA_MAP están sincronizados (mismo set de claves).');
    process.exit(0);
  }

  if (inJsonNotMeta.length) {
    console.log('Claves en permissions.json pero NO en METADATA_MAP:');
    for (const k of inJsonNotMeta) console.log('  +', k);
  }
  if (inMetaNotJson.length) {
    console.log('Claves en METADATA_MAP pero NO en permissions.json:');
    for (const k of inMetaNotJson) console.log('  -', k);
  }

  process.exit(1);
}

main().catch(e => { console.error(e); process.exit(2); });
