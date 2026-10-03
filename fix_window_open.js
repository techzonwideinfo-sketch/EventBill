const fs = require('fs');
const files = [
  'client/src/pages/Dashboard.jsx',
  'client/src/pages/CreateBill.jsx',
  'client/src/pages/EditBill.jsx'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/window\.open\(\`\/bills\/\$\{([^}]+)\}\/print\`, '_blank'\)/g, 
    "window.open(window.location.protocol === 'app:' ? `app://index.html#/bills/${$1}/print` : `/bills/${$1}/print`, '_blank')");
  fs.writeFileSync(f, content);
  console.log('Fixed', f);
});
