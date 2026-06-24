const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'index.css');
let css = fs.readFileSync(cssPath, 'utf8');

// 1. Replace variables
const newRoot = `:root {
  --font: 'Inter', system-ui, sans-serif;
  --bg: #f5f5f7;
  --surface: #ffffff;
  --surface-hov: #f0f0f0;
  --border: rgba(0,0,0,0.08);
  --text-primary: #1d1d1f;
  --text-secondary: #86868b;
  --text-muted: rgba(0,0,0,0.3);
  --brand: #0071e3;
  --brand-hov: #0077ED;
  --radius-card: 28px;
  --radius-btn: 14px;
}

html.dark {
  --bg: #000000;
  --surface: #1c1c1e;
  --surface-hov: #2c2c2e;
  --border: rgba(255,255,255,0.15);
  --text-primary: #f5f5f7;
  --text-secondary: #86868b;
  --text-muted: rgba(255,255,255,0.3);
  --brand: #2997ff;
  --brand-hov: #3B9FFF;
}`;

css = css.replace(/:root\s*\{[\s\S]*?--radius-btn:\s*14px;\n\}/, newRoot);

// 2. Fix body
css = css.replace(/body\s*\{\s*background:\s*#0f0c29;\s*background:\s*linear-gradient\([^)]+\);\s*min-height:\s*100vh;\s*color:\s*var\(--text-primary\);\s*\}/, 
`body {
  background: var(--bg);
  min-height: 100vh;
  color: var(--text-primary);
}`);

// 3. Remove blobs
css = css.replace(/\/\* ─── Shared background blobs ──[\s\S]*?\/\* ─── Cards ──/g, '/* ─── Cards ──');

// 4. Update Cards
css = css.replace(/background:\s*rgba\(255,255,255,0\.07\);/g, 'background: var(--surface); box-shadow: 0 4px 24px rgba(0,0,0,0.04);');
css = css.replace(/border:\s*1px\s*solid\s*rgba\(255,255,255,0\.1\);/g, 'border: 1px solid var(--border);');
css = css.replace(/backdrop-filter:\s*blur\(32px\);/g, ''); // Apple cards are usually solid

// 5. Titles (remove gradients)
css = css.replace(/background:\s*linear-gradient[^;]+;\s*-webkit-background-clip:\s*text;\s*-webkit-text-fill-color:\s*transparent;\s*background-clip:\s*text;/g, 'color: var(--text-primary);');

// 6. Sidebar
css = css.replace(/background:\s*rgba\(255,255,255,0\.03\);/g, 'background: var(--surface);');

// 7. Gradients to Solid Brand
css = css.replace(/background:\s*linear-gradient\(135deg,\s*var\(--grad-start\),\s*var\(--grad-end\)\);/g, 'background: var(--brand); color: white;');
css = css.replace(/background:\s*linear-gradient\(135deg,\s*var\(--grad-start\),\s*var\(--grad-mid\)\);/g, 'background: var(--brand); color: white;');
css = css.replace(/box-shadow:\s*0\s*8px\s*24px\s*rgba\(99,102,241,0\.35\);/g, 'box-shadow: 0 4px 12px rgba(0,113,227,0.3);');

// 8. Buttons
css = css.replace(/\.btn-primary:hover\s*\{\s*transform:\s*translateY\(-2px\);\s*box-shadow:\s*0\s*12px\s*28px\s*rgba\(99,102,241,0\.45\);\s*\}/, 
`.btn-primary:hover {
  background: var(--brand-hov);
  transform: scale(0.98);
}`);

css = css.replace(/\.btn:active\s*\{\s*transform:\s*translateY\(0\)\s*scale\(0\.98\);\s*\}/, 
`.btn:active {
  transform: scale(0.96);
}`);

// 9. Input borders
css = css.replace(/border:\s*1px\s*solid\s*var\(--border\);\s*background:\s*var\(--surface\);/g, 'border: 1px solid var(--border); background: var(--bg);');

// 10. Modals / Bottom Sheets (Glassmorphism)
css = css.replace(/\.modal-content,\s*\.bottom-sheet-content\s*\{\s*background:\s*rgba\(20,\s*20,\s*25,\s*0\.85\);\s*backdrop-filter:\s*blur\(40px\);/g, 
`.modal-content, .bottom-sheet-content {
  background: var(--surface);
  box-shadow: 0 24px 48px rgba(0,0,0,0.1);`);

fs.writeFileSync(cssPath, css, 'utf8');
console.log("CSS updated successfully!");
