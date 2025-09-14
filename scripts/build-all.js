const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', shell: true, ...opts });
    p.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(' ')} exited with code ${code}`));
    });
    p.on('error', (err) => reject(err));
  });
}

async function main() {
  const projectRoot = path.join(__dirname, '..');
  const args = process.argv.slice(2);
  const doClean = args.includes('--clean');

  try {
    if (doClean) {
      console.log('Cleaning previous build artifacts...');
      const toRemove = [
        path.join(projectRoot, 'dist', 'backend'),
        path.join(projectRoot, 'dist', 'frontend'),
        path.join(projectRoot, 'dist', 'portable'),
        path.join(projectRoot, 'outpos'),
        path.join(projectRoot, 'PORTABLE_RELEASE'),
        path.join(projectRoot, 'PORTABLE_RELEASE_v2'),
        path.join(projectRoot, 'PORTABLE_RELEASE_v3')
      ];
      for (const p of toRemove) {
        if (fs.existsSync(p)) {
          console.log('Removing', p);
          try { fs.rmSync(p, { recursive: true, force: true }); } catch (e) { console.error('Could not remove', p, e.message); }
        }
      }
    }

    console.log('\n1) Compilando backend (pkg + copiar data)...');
    await run('npm', ['run', 'compile:backend']);

    console.log('\n2) Empaquetando portable (tauri build -> create-portable)...');
    // package:portable will call prepackage:portable (tauri build) via npm if defined
    await run('npm', ['run', 'package:portable']);

    console.log('\nBuild completo. Los artefactos resultantes están en dist/ y dist/portable (si todo fue exitoso).');
  } catch (err) {
    console.error('\nBuild fallido:', err && err.message);
    process.exit(1);
  }
}

main();
