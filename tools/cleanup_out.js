const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'src-backend', 'data');
const outDir = path.join(dataDir, 'out');

function readIfExists(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch(e) { return ''; }
}

function collectReferences() {
  const refs = new Set();
  const pwaHtml = path.join(outDir, 'pwa.html');
  const sw = path.join(outDir, 'sw.js');
  const manifest = path.join(outDir, 'manifest.json');

  [pwaHtml, sw, manifest].forEach(f => {
    const content = readIfExists(f);
    content.replace(/src=["']([^"']+)["']/g, (_, m) => refs.add(m));
    content.replace(/href=["']([^"']+)["']/g, (_, m) => refs.add(m));
    content.replace(/import\(['"`]([^"`]+)['"`]\)/g, (_, m) => refs.add(m));
    content.replace(/fetch\(['"`]([^"`]+)['"`]\)/g, (_, m) => refs.add(m));
  });

  // Always keep known runtime assets
  ['/sw.js', '/manifest.json', '/pwa.html', '/pwa/'].forEach(r => refs.add(r));
  // keep _next and icons
  refs.add('/_next/');
  refs.add('/icons/');
  return Array.from(refs).map(r => r.replace(/^\//, ''));
}

function backupUnused(keepList) {
  if (!fs.existsSync(outDir) || !fs.statSync(outDir).isDirectory()) {
    console.error('out directory missing:', outDir);
    process.exit(1);
  }

  const all = fs.readdirSync(outDir);
  // Normalize keep items: strip trailing slashes so '_next/' -> '_next'
  const keepSet = new Set(keepList.filter(Boolean).map(k => k.replace(/\/+$/,'')).filter(Boolean));

  const timestamp = new Date().toISOString().replace(/[:.]/g,'-');
  const backupDir = path.join(outDir, `unused-backup-${timestamp}`);
  fs.mkdirSync(backupDir);

  const moved = [];
  all.forEach(name => {
    if (keepSet.has(name) || [...keepSet].some(k => name.startsWith(k))) return;
    // Move to backup (try rename, fallback to copy+remove)
    const src = path.join(outDir, name);
    const dst = path.join(backupDir, name);
    try {
      fs.renameSync(src, dst);
    } catch (err) {
      // fallback: copy then try to remove
      try {
        const stat = fs.statSync(src);
        if (stat.isDirectory()) {
          fs.cpSync(src, dst, { recursive: true });
          fs.rmSync(src, { recursive: true, force: true });
        } else {
          fs.copyFileSync(src, dst);
          fs.unlinkSync(src);
        }
      } catch (err2) {
        console.error('Failed to move', src, '->', dst, err2 && err2.message);
        return;
      }
    }
    moved.push(name);
  });

  return { backupDir, moved };
}

function main() {
  const keep = collectReferences();
  console.log('Keeping references (relative to out/):', keep);
  const { backupDir, moved } = backupUnused(keep);
  console.log('Moved', moved.length, 'items to', backupDir);
  moved.forEach(m => console.log('  -', m));
}

if (require.main === module) main();
