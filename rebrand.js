const fs = require('fs');
const path = require('path');

const targetDirs = [
  'client/src',
  'client/public',
  'server/src/controllers',
  'server/src/services',
  'client/electron'
];
const fileExtensions = ['.js', '.jsx', '.html', '.json', '.md'];

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== 'node_modules' && f !== '.git' && f !== 'dist') {
        walkDir(dirPath, callback);
      }
    } else {
      if (fileExtensions.includes(path.extname(f))) {
        callback(dirPath);
      }
    }
  });
}

// Special files that should definitely be checked outside src
const extraFiles = ['client/index.html', 'client/package.json', 'README.md', 'FINAL_PRODUCTION_RELEASE_REPORT.md'];

let allFiles = [...extraFiles];
targetDirs.forEach(dir => walkDir(dir, (f) => allFiles.push(f)));

let changedCount = 0;

allFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // We want to replace user-facing text but not technical IDs.
  // Avoid replacing: 'com.eventbill.app', 'demo@eventbill.local', 'mongodb://localhost:27017/eventbill', 'https://eventbill1.onrender.com'
  
  if (file.endsWith('package.json') && file.includes('client')) {
    // Only update productName and shortcutName
    content = content.replace(/"productName":\s*"EventBill"/g, '"productName": "MOI BILL"');
    content = content.replace(/"shortcutName":\s*"EventBill"/g, '"shortcutName": "MOI BILL"');
  } else if (file.endsWith('capacitor.config.json')) {
    content = content.replace(/"appName":\s*"EventBill"/g, '"appName": "MOI BILL"');
  } else {
    // General replacements for user-facing text
    // Replace 'EventBill' -> 'MOI BILL'
    // Replace 'Event Bill' -> 'MOI BILL'
    // Replace 'EVENTBILL' -> 'MOI BILL'
    
    // We will do precise replacements to avoid breaking urls or emails.
    content = content.replace(/EventBill(?!\.local|\.app|1\.onrender|1\.herokuapp|-)/g, 'MOI BILL');
    content = content.replace(/EVENTBILL/g, 'MOI BILL');
    content = content.replace(/Event Bill(?!ing|s)/gi, 'MOI BILL');
  }

  // specific fixes for cases where it replaced things it shouldn't have:
  // (if we know any)
  
  // Update PDF filenames
  content = content.replace(/MOI BILL-(.*?)\.pdf/g, 'MOI-BILL-$1.pdf'); // fix any weird formatting
  content = content.replace(/EventBill-(.*?)\.pdf/g, 'MOI-BILL-$1.pdf');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
    console.log(`Updated: ${file}`);
  }
});

console.log(`Rebranding complete. Updated ${changedCount} files.`);
