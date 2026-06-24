const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'index.css');
let css = fs.readFileSync(cssPath, 'utf8');

// Add --bg-translucent
css = css.replace(/--radius-btn:\s*14px;\n\}/, '--radius-btn: 14px;\n  --bg-translucent: rgba(245,245,247,0.85);\n}');
css = css.replace(/--brand-hov:\s*#3B9FFF;\n\}/, '--brand-hov: #3B9FFF;\n  --bg-translucent: rgba(0,0,0,0.85);\n}');

// Replace hardcoded dark transparent backgrounds
css = css.replace(/background:\s*rgba\(15,12,41,0\.85\);/g, 'background: var(--bg-translucent);');
css = css.replace(/background:\s*rgba\(15,12,41,0\.8\);/g, 'background: var(--bg-translucent);');

fs.writeFileSync(cssPath, css, 'utf8');
console.log("Headers updated.");
