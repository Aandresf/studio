const fs = require('fs');
const path = require('path');
const glob = require('glob');

function readJSON(p) {
  try { return JSON.parse(fs.readFileSync(p,'utf8')); } catch(e){ return null; }
}

const projectRoot = path.resolve(__dirname, '..');
const permissionsPath = path.join(projectRoot, 'src', 'lib', 'permissions.json');
const permissions = readJSON(permissionsPath)?.permissions || [];
const permKeys = permissions.map(p => p.key).filter(Boolean);

// Simple mapping heuristics: folder or filename tokens -> permission to check
const heuristics = [
  { token: '/customers/', guess: 'customers:edit' },
  { token: '/suppliers/', guess: 'suppliers:edit' },
  { token: '/products/', guess: 'products:edit' },
  { token: '/sales/', guess: 'sales:edit' },
  { token: '/purchases/', guess: 'purchases:edit' },
  { token: '/users/', guess: 'users:edit' },
  { token: '/catalog/', guess: 'catalog:manage' },
  { token: '/settings/', guess: 'settings:edit' }
];

const searchPatterns = [
  "setOpenDialog(true)",
  "setOpenDialog(false)",
  "setOpenDetail(true)",
  "setOpenReceipt(true)",
  "onEdit(() =>",
  "onEdit()",
  "onClick={() => setOpenDialog(true)",
  "onClick={() => { setOpenDialog(true)",
  "onClick={() => onEdit()",
  "onClick={() => { onEdit(); }",
  "handleCreate(",
  "handleEdit(",
  "setOpenDialog(true);",
  "setOpenDetail(true);",
];

// tokens that indicate a guard is already present on the same line or nearby
const guardTokens = ['useCurrentUser', 'isReadOnly', 'canEdit', 'canCreate', 'if (!isReadOnly', "if (!canEdit", 'permissions?.includes', "if (!canCreate", 'canManage', 'canManageAttributes'];

const files = glob.sync('src/**/*.tsx', { cwd: projectRoot, absolute: true });
const suggestions = [];

files.forEach(file => {
  const content = fs.readFileSync(file,'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    searchPatterns.forEach(pat => {
      if (line.includes(pat)) {
  // quick guard detection: skip if line or previous/next 2 lines contain guard tokens
  const contextWindow = [lines[Math.max(0, idx-2)], lines[Math.max(0, idx-1)], line, lines[idx+1], lines[idx+2]].filter(Boolean).join('\n');
  const hasGuard = guardTokens.some(tok => contextWindow.includes(tok));
  if (hasGuard) return;
        // determine heuristic permission
        const rel = path.relative(projectRoot, file).replace(/\\/g,'/');
        let guess = null;
        for (const h of heuristics) if (rel.includes(h.token.replace(/\/$/,''))) { guess = h.guess; break; }
        // fallback: infer from nearby words
        if (!guess) {
          if (rel.includes('customer')) guess = 'customers:edit';
          else if (rel.includes('supplier')) guess = 'suppliers:edit';
          else if (rel.includes('product')) guess = 'products:edit';
          else if (rel.includes('sale')) guess = 'sales:edit';
          else guess = null;
        }

        suggestions.push({ file: rel, line: idx+1, match: pat, context: line.trim(), suggestedPermission: guess, note: 'Review and add guard: useCurrentUser() and check permission before opening dialog or calling edit.' });
      }
    });
  });
});

const outPath = path.join(projectRoot, 'tools', 'permission_guard_suggestions.json');
fs.writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), suggestions }, null, 2), 'utf8');
console.log('Scanned', files.length, 'files. Suggestions:', suggestions.length);
console.log('Wrote', outPath);
