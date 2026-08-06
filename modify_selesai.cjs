const fs = require('fs');
let code = fs.readFileSync('src/components/RegistrationModal.tsx', 'utf8');

const regex = /\{step === 3 && \([\s\S]*?Selesai\s*<\/button>\s*\)\}/;

const replacement = `{step === 3 && (
            <button
              onClick={handleSelesai}
              disabled={isDownloading}
              className="w-full py-3 bg-[#0B3D5E] hover:bg-[#1e40af] text-white font-extrabold text-sm rounded-xl text-center shadow transition cursor-pointer flex items-center justify-center gap-2 disabled:bg-slate-400"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mengunduh Tiket...
                </>
              ) : (
                "Selesai"
              )}
            </button>
          )}`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/RegistrationModal.tsx', code);
