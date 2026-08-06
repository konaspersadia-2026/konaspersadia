const fs = require('fs');
let code = fs.readFileSync('src/components/Mengapa.tsx', 'utf8');

code = code.replace("Pemecahan Rekor Skrining", "Skrining Kesehatan Masal");
code = code.replace("pemeriksaan gula darah massal gratis untuk 10.000 orang dalam satu hari", "pemeriksaan gula darah massal gratis untuk 5.000 orang dalam satu hari");
code = code.replace("Target Rekor 10.000 peserta", "Target 5.000 peserta");

fs.writeFileSync('src/components/Mengapa.tsx', code);
