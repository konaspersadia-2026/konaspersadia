const fs = require('fs');
let code = fs.readFileSync('scanner/App.tsx', 'utf8');
code = code.replace(
  'if (isScanning) {\n      scanner = new Html5QrcodeScanner(',
  'let timeoutId: ReturnType<typeof setTimeout>;\n    \n    if (isScanning) {\n      timeoutId = setTimeout(() => {\n      scanner = new Html5QrcodeScanner('
);
code = code.replace(
  '// Ignored\n        }\n      );\n    }',
  '// Ignored\n        }\n      );\n      }, 100);\n    }'
);
code = code.replace(
  'return () => {\n      if (scanner) {',
  'return () => {\n      if (timeoutId) clearTimeout(timeoutId);\n      if (scanner) {'
);
fs.writeFileSync('scanner/App.tsx', code);
