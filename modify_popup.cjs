const fs = require('fs');
let code = fs.readFileSync('src/components/RegistrationModal.tsx', 'utf8');

const regex = /\{([^}]*)\/\*\s*Header Block\s*\*\/[\s\S]*?\{step === 3 && \([\s\S]*?<\/button>\s*\)\}\s*<\/div>\s*<\/div>\s*<\/div>/;

// I'll manually replace from `<div id="registration-modal-box"` down to its closing `</div>`

