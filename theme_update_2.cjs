const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'index.css');
let css = fs.readFileSync(cssPath, 'utf8');

css = css.replace(/background:\s*linear-gradient\(135deg,\s*rgba\(99,102,241,0\.2\),\s*rgba\(139,92,246,0\.15\)\);/g, 'background: var(--surface);');
css = css.replace(/border:\s*1px\s*solid\s*rgba\(99,102,241,0\.25\);/g, 'border: 1px solid var(--border);');

css = css.replace(/background:\s*linear-gradient\(135deg,\s*rgba\(99,102,241,0\.15\),\s*rgba\(139,92,246,0\.1\)\);/g, 'background: var(--surface);');
css = css.replace(/border-color:\s*rgba\(99,102,241,0\.25\);/g, 'border-color: var(--border);');

css = css.replace(/background:\s*linear-gradient\(135deg,\s*rgba\(236,72,153,0\.12\),\s*rgba\(139,92,246,0\.1\)\);/g, 'background: var(--surface);');
css = css.replace(/border-color:\s*rgba\(236,72,153,0\.25\);/g, 'border-color: var(--border);');

css = css.replace(/background:\s*linear-gradient\(135deg,\s*rgba\(99,102,241,0\.12\),\s*rgba\(139,92,246,0\.08\)\);/g, 'background: var(--surface);');
css = css.replace(/border:\s*1px\s*solid\s*rgba\(99,102,241,0\.2\);/g, 'border: 1px solid var(--border);');

// Hide glow
css = css.replace(/\.balance-summary-glow\s*\{/g, '.balance-summary-glow { display: none;');

// Change text colors for balance labels from purple to primary/muted
css = css.replace(/color:\s*rgba\(165,180,252,0\.8\);/g, 'color: var(--text-muted);');
css = css.replace(/color:\s*rgba\(165,180,252,0\.6\);/g, 'color: var(--text-muted);');
css = css.replace(/color:\s*rgba\(165,180,252,0\.7\);/g, 'color: var(--text-muted);');

fs.writeFileSync(cssPath, css, 'utf8');
console.log("Card gradients removed.");
