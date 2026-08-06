const fs = require('fs');
let code = fs.readFileSync('src/components/RegistrationModal.tsx', 'utf8');

const regex = /<button\s*onClick=\{handleDownloadBadge\}[\s\S]*?Download\s*<\/button>/;
code = code.replace(regex, '');
fs.writeFileSync('src/components/RegistrationModal.tsx', code);
