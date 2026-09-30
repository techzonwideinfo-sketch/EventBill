const fs = require('fs');

function updateTemplate(p) {
  let content = fs.readFileSync(p, 'utf-8');
  content = content.replace(/<svg viewBox=[\s\S]*?<\/svg>/g, '<img src="${logoBase64}" alt="EventBill Logo" class="logo-img" />');
  content = content.replace(/<h1>Event<span style="color:#F2842F">Bill<\/span><\/h1>\s*<div class="tagline">Simple Bills for Special Moments<\/div>/g, '');
  if (!content.includes('logoBase64')) {
    content = "import { logoBase64 } from './logoBase64.js';\n" + content;
  }
  content = content.replace('.logo-mark {', '.logo-img { max-width: 100%; height: auto; }\n      .logo-mark {');
  // Adjust logo width inside the template to be 35-45mm wide. We will use 40mm for header and 25mm for signature.
  content = content.replace('width: 15mm;\n        margin: 0 auto 1mm auto;', 'width: 35mm;\n        margin: 0 auto 2mm auto;');
  content = content.replace('width: 12mm;\n        margin: 0 0 1mm auto;\n        opacity: 0.8;', 'width: 25mm;\n        margin: 0 0 1mm auto;');
  fs.writeFileSync(p, content);
}

updateTemplate('d:/project/Bill/client/src/utils/billTemplate.js');
updateTemplate('d:/project/Bill/server/src/templates/billTemplate.js');
