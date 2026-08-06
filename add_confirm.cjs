const fs = require('fs');
let code = fs.readFileSync('src/components/RegistrationModal.tsx', 'utf8');

// 1. Add state
const stateRegex = /const \[showThankYouPopup, setShowThankYouPopup\] = useState\(false\);/;
code = code.replace(stateRegex, 'const [showThankYouPopup, setShowThankYouPopup] = useState(false);\n  const [showConfirmClose, setShowConfirmClose] = useState(false);');

// 2. Modify handleClose and add handlers
const handleCloseRegex = /const handleClose = \(\) => \{[\s\S]*?onClose\(\);\s*\};/;
const newHandleClose = `const handleClose = () => {
    if (step === 3 || showThankYouPopup) {
      resetForm();
      onClose();
    } else {
      setShowConfirmClose(true);
    }
  };

  const confirmClose = () => {
    setShowConfirmClose(false);
    resetForm();
    onClose();
  };

  const cancelClose = () => {
    setShowConfirmClose(false);
  };`;
code = code.replace(handleCloseRegex, newHandleClose);

// 3. Add modal UI
const uiRegex = /<div\s+id="registration-modal-overlay"/;
const newUI = `{showConfirmClose && (
      <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center animate-scaleIn">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <Info className="h-6 w-6 text-amber-600" />
          </div>
          <h4 className="text-lg font-black text-slate-800 mb-2">Batalkan Pendaftaran?</h4>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Data yang telah Anda isi akan hilang dan tidak tersimpan. Yakin ingin menutup formulir?
          </p>
          <div className="flex gap-3">
            <button
              onClick={cancelClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
            >
              Lanjutkan
            </button>
            <button
              onClick={confirmClose}
              className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition"
            >
              Ya, Tutup
            </button>
          </div>
        </div>
      </div>
    )}
    <div
      id="registration-modal-overlay"`;
code = code.replace(uiRegex, newUI);

fs.writeFileSync('src/components/RegistrationModal.tsx', code);
