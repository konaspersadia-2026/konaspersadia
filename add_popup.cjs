const fs = require('fs');
let code = fs.readFileSync('src/components/RegistrationModal.tsx', 'utf8');

const regex = /\{(\/\*\s*Header Block\s*\*\/)/;

const replacement = `{showThankYouPopup ? (
          <div className="p-8 text-center space-y-6 flex-1 flex flex-col items-center justify-center bg-white min-h-[400px]">
             <div className="p-4 bg-[#2D7A4F]/10 text-[#2D7A4F] rounded-full inline-block">
                <CheckCircle2 className="h-16 w-16" />
             </div>
             <h3 className="text-2xl font-black text-slate-800">Terima Kasih!</h3>
             <p className="text-sm text-slate-600 max-w-sm mx-auto">Pendaftaran Anda telah selesai dan tiket berhasil diunduh. Sampai jumpa di acara Konas Persadia 2026!</p>
             <button onClick={handleClose} className="mt-4 px-8 py-3 bg-[#00B4AC] hover:bg-[#00968f] text-white font-bold rounded-full w-full max-w-xs shadow-lg transition-transform hover:scale-105">Oke</button>
          </div>
        ) : (
          <>
        $1`;

code = code.replace(regex, replacement);

const regexEnd = /\{isDownloading \? \([\s\S]*?"Selesai"[\s\S]*?<\/button>\s*\)\}\s*<\/div>/;
code = code.replace(regexEnd, (match) => {
  return match + '\n        </>\n        )}';
});

fs.writeFileSync('src/components/RegistrationModal.tsx', code);
