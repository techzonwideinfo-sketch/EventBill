const fs = require('fs');
function updateTemplate(p) {
  let content = fs.readFileSync(p, 'utf-8');
  content = content.replace(/<img src=""/g, '<img src="${logoUrl}"');
  content = content.replace("import { logoBase64 } from './logoBase64.js';\n", ""); // remove if it exists
  fs.writeFileSync(p, content);
}
updateTemplate('d:/project/Bill/client/src/utils/billTemplate.js');
updateTemplate('d:/project/Bill/server/src/templates/billTemplate.js');
