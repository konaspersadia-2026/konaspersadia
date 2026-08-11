import { useState, useEffect, useRef, DragEvent } from "react";
import { X, Calendar, User, Mail, Phone, CreditCard, Upload, Loader2, CheckCircle2, ChevronRight, ChevronLeft, Copy, Info, Download, Search } from "lucide-react";
import { KATEGORI_PESERTA, EVENT_INFO, REKENING_PEMBAYARAN, SLOT_WAKTU_CEK_GULA } from "../config";
import { RegistrationData } from "../types";
import { QRCodeSVG } from "qrcode.react";
import { toJpeg } from "html-to-image";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RegistrationModal({ isOpen, onClose }: RegistrationModalProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<{ id: string; totalAkhir: number; data: any } | null>(null);
  const [showThankYouPopup, setShowThankYouPopup] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(1);
  const [hasClickedWa, setHasClickedWa] = useState(false);

  // Search/Redownload Mode States
  const [mode, setMode] = useState<'daftar' | 'download'>('daftar');
  const [searchKey, setSearchKey] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [foundParticipant, setFoundParticipant] = useState<any>(null);

  useEffect(() => {
    setScrollProgress(step === 2 ? 0 : 1);
  }, [step, isOpen]);

  // Form Fields
  const [kategoriId, setKategoriId] = useState(KATEGORI_PESERTA[0].id);
  const [pilihanKegiatan, setPilihanKegiatan] = useState<"Symposium" | "Symposium + Workshop">("Symposium");
  const [namaLengkap, setNamaLengkap] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  
  // Custom conditional fields
  const [institusi, setInstitusi] = useState("");
  const [nim, setNim] = useState("");
  const [noKTP, setNoKTP] = useState("");
  const [cabangPersadia, setCabangPersadia] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState("Laki-laki");
  const [setujuPenelitian, setSetujuPenelitian] = useState(false);
  const [slotWaktuCekGula, setSlotWaktuCekGula] = useState(SLOT_WAKTU_CEK_GULA[0]);
  


  // Calculated Fees
  const [hargaDasar, setHargaDasar] = useState(0);
  const [kodeUnik, setKodeUnik] = useState(0);
  const [totalAkhir, setTotalAkhir] = useState(0);
  const [registrationId, setRegistrationId] = useState("");



  const selectedKategori = KATEGORI_PESERTA.find((k) => k.id === kategoriId) || KATEGORI_PESERTA[0];

  // Helper to determine if Early Bird is active
  const isEarlyBirdActive = () => {
    const deadline = new Date(`${EVENT_INFO.batasEarlyBird}T23:59:59+07:00`).getTime();
    const now = new Date().getTime();
    return now <= deadline;
  };

  // Helper to determine if Onsite pricing is active
  const isOnsiteActive = () => {
    const deadline = new Date(`${EVENT_INFO.batasOnsite}T00:00:00+07:00`).getTime();
    const now = new Date().getTime();
    return now >= deadline;
  };

  // 1. Recalculate price when category or pilihanKegiatan changes
  useEffect(() => {
    const isEB = isEarlyBirdActive();
    const isOnsite = isOnsiteActive();
    let price = 0;

    if (selectedKategori.akses === "ilmiah") {
      const hargaObj = pilihanKegiatan === "Symposium" ? selectedKategori.hargaSymposium : selectedKategori.hargaSymposiumWorkshop;
      if (hargaObj) {
        price = isOnsite ? hargaObj.onsite : (isEB ? hargaObj.earlyBird : hargaObj.onsite); // If it's between EB and Onsite, what should it be? Let's use onsite price if it's after early bird, or maybe early bird? The prompt says "early bird (s.d 31 mei), onsite (mulai 1 agustus)". Let's assume regular price is onsite price if there's no intermediate price.
        // Actually, the prompt says "early bird (s.d 31 mei), onsite (mulai 1 agustus)". There is a gap between June and July. I'll just use Onsite for anything after Early Bird as there's no middle price defined.
        price = isEB ? hargaObj.earlyBird : hargaObj.onsite;
      }
    } else {
      price = isEB ? (selectedKategori.hargaEarlyBird || 0) : (selectedKategori.hargaReguler || 0);
    }
    setHargaDasar(price);
  }, [kategoriId, selectedKategori, pilihanKegiatan]);

  // 2. Generate unique code 100-999 once when proceeding to step 2
  const generateUniqueCode = (basePrice: number) => {
    if (basePrice === 0) {
      setKodeUnik(0);
      setTotalAkhir(0);
      return;
    }
    let code = Math.floor(100 + Math.random() * 900);
    setKodeUnik(code);
    setTotalAkhir(basePrice + code);
  };

  // Navigation Logic
  const handleNextStep1 = () => {
    // Validation
    if (!namaLengkap.trim()) return setError("Nama lengkap wajib diisi.");
    if (!email.trim() || !email.includes("@")) return setError("Email valid wajib diisi.");
    if (!whatsapp.trim() || whatsapp.length < 9) return setError("Nomor WhatsApp valid wajib diisi.");
    const fields = selectedKategori.fieldTambahan;
    if (fields.includes("institusi") && !institusi.trim()) return setError("Institusi wajib diisi.");
    if (fields.includes("nim") && !nim.trim()) return setError("Nomor Induk Mahasiswa (NIM) wajib diisi.");
    if (fields.includes("cabangPersadia") && !cabangPersadia.trim()) return setError("Cabang PERSADIA wajib diisi.");
    if (fields.includes("tanggalLahir") && !tanggalLahir.trim()) return setError("Tanggal lahir wajib diisi.");
    if (fields.includes("jenisKelamin") && !jenisKelamin.trim()) return setError("Jenis kelamin wajib dipilih.");
    if ((selectedKategori.id === "persadia" || selectedKategori.id === "umum") && !setujuPenelitian) {
      return setError("Mohon centang persetujuan penggunaan data hasil pemeriksaan gula darah.");
    }

    setError("");
    
    let currentRegId = registrationId;
    if (!currentRegId) {
      currentRegId = `KNS2026-${Math.floor(10000 + Math.random() * 90000)}`;
      setRegistrationId(currentRegId);
    }

    generateUniqueCode(hargaDasar);

    if (hargaDasar === 0) {
      handleSubmitRegistration(currentRegId);
    } else {
      setStep(2);
    }
  };



  const handleSubmitRegistration = async (passedRegId?: any) => {
    const actualPassedRegId = typeof passedRegId === "string" ? passedRegId : undefined;
    setIsSubmitting(true);
    setError("");

    const finalTotal = hargaDasar === 0 ? 0 : hargaDasar + kodeUnik;

    const activeRegId = actualPassedRegId || registrationId || `KNS2026-${Math.floor(10000 + Math.random() * 90000)}`;
    
    try {
      const payloadToSupabase = {
        timestamp: new Date().toISOString(),
        no_registrasi: activeRegId,
        status_pembayaran: finalTotal === 0 ? "Lunas" : "Menunggu Verifikasi",
        nama_lengkap: namaLengkap,
        email: email,
        whatsapp: whatsapp,
        kategori_peserta: selectedKategori.label,
        pilihan_kegiatan: selectedKategori.akses === "ilmiah" ? pilihanKegiatan : "-",
        total_tagihan: finalTotal,
        institusi: selectedKategori.fieldTambahan.includes("institusi") ? institusi : "-",
        nim: selectedKategori.fieldTambahan.includes("nim") ? nim : "-",
        cabang_persadia: selectedKategori.fieldTambahan.includes("cabangPersadia") ? cabangPersadia : "-",
        tanggal_lahir: selectedKategori.fieldTambahan.includes("tanggalLahir") ? tanggalLahir : "-",
        jenis_kelamin: selectedKategori.fieldTambahan.includes("jenisKelamin") ? jenisKelamin : "-",
      };

      if (isSupabaseConfigured) {
        let { error: supabaseErr } = await supabase.from('pendaftar').insert([payloadToSupabase]);
        if (supabaseErr) {
          console.error("Gagal insert ke Supabase:", supabaseErr);
          throw new Error(`Peringatan Supabase: Gagal menyimpan ke database Supabase.\nPesan Error: ${supabaseErr.message}`);
        }
      } else {
        console.warn("Supabase tidak dikonfigurasi. Data registrasi hanya disimpan di lokal/mock.");
      }

      setSuccessData({
        id: activeRegId,
        totalAkhir: finalTotal,
        data: payloadToSupabase
      });
      setStep(3);
    } catch (err: any) {
      console.error("Submission error:", err);
      setError(err.message || "Koneksi server terputus. Pendaftaran gagal dikirim.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectParticipant = (participant: any) => {
    setFoundParticipant(participant);
    setSuccessData({
      id: participant.no_registrasi,
      totalAkhir: participant.total_tagihan || 0,
      data: participant
    });
    setNamaLengkap(participant.nama_lengkap || "");
    setInstitusi(participant.institusi !== "-" ? (participant.institusi || "") : "");
    
    const cat = KATEGORI_PESERTA.find(k => k.label.toLowerCase() === (participant.kategori_peserta || "").toLowerCase());
    if (cat) {
      setKategoriId(cat.id);
    }
  };

  const handleSearchTicket = async () => {
    const rawKey = searchKey.trim();
    if (!rawKey) {
      setSearchError("Masukkan No. Registrasi, Email, atau No. WhatsApp dengan tepat.");
      return;
    }
    setIsSearching(true);
    setSearchError("");
    setFoundParticipant(null);

    const cleanKey = rawKey.toLowerCase();
    const digits = rawKey.replace(/\D/g, '');

    // Formulate strict exact match conditions
    const conditions: string[] = [
      `no_registrasi.eq.${rawKey}`,
      `email.eq.${cleanKey}`
    ];

    if (digits.length >= 8) {
      conditions.push(`whatsapp.eq.${digits}`);
      if (digits.startsWith('0')) {
        conditions.push(`whatsapp.eq.62${digits.slice(1)}`);
      } else if (digits.startsWith('62')) {
        conditions.push(`whatsapp.eq.0${digits.slice(2)}`);
      }
    }

    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('pendaftar')
          .select('*')
          .or(conditions.join(','));

        if (error) {
          throw error;
        }

        // Strict verification in JS to ensure 100% exact equality
        const exactMatch = data?.find(item => {
          const itemReg = (item.no_registrasi || '').trim().toLowerCase();
          const itemEmail = (item.email || '').trim().toLowerCase();
          const itemPhone = (item.whatsapp || '').replace(/\D/g, '');

          if (itemReg === cleanKey) return true;
          if (itemEmail === cleanKey) return true;
          if (digits.length >= 8 && itemPhone === digits) return true;
          if (digits.length >= 8 && digits.startsWith('0') && itemPhone === '62' + digits.slice(1)) return true;
          if (digits.length >= 8 && digits.startsWith('62') && itemPhone === '0' + digits.slice(2)) return true;

          return false;
        });

        if (exactMatch) {
          selectParticipant(exactMatch);
        } else {
          setSearchError("Data tidak ditemukan. Pastikan No. Registrasi, Email, atau No. WhatsApp yang Anda masukkan sudah tepat.");
        }
      } else {
        setSearchError("Database Supabase tidak terhubung.");
      }
    } catch (err: any) {
      console.error(err);
      setSearchError("Gagal mencari data: " + (err.message || "Terjadi kesalahan koneksi"));
    } finally {
      setIsSearching(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Berhasil disalin: " + text);
  };

  const resetForm = () => {
    setStep(1);
    setError("");
    setSuccessData(null);
    setRegistrationId("");
    setNamaLengkap("");
    setEmail("");
    setWhatsapp("");
    setInstitusi("");
    setNoKTP("");
    setCabangPersadia("");
    setTanggalLahir("");
    setJenisKelamin("Laki-laki");
    setShowThankYouPopup(false);
    setHasClickedWa(false);
    setMode("daftar");
    setSearchKey("");
    setSearchError("");
    setFoundParticipant(null);
  };

  const handleSelesai = async () => {
    setIsDownloading(true);
    const badgeElement = document.getElementById('badge-print-area');
    if (badgeElement) {
      try {
        const imgData = await toJpeg(badgeElement, { quality: 0.95, pixelRatio: 3, backgroundColor: '#ffffff' });
        const link = document.createElement('a');
        link.download = `E-Ticket-${successData?.id}.jpg`;
        link.href = imgData;
        link.click();
      } catch (error) {
        console.error('Error generating JPG image', error);
      }
    }
    setIsDownloading(false);
    setShowThankYouPopup(true);
  };

  const handleClose = () => {
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
  };

  if (!isOpen) return null;

  return (
    <>
    {showConfirmClose && (
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
      id="registration-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        id="registration-modal-box"
        className="relative bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
      >
        {showThankYouPopup ? (
          <div className="p-8 text-center space-y-6 flex-1 flex flex-col items-center justify-center bg-white min-h-[400px]">
             <div className="p-4 bg-[#2D7A4F]/10 text-[#2D7A4F] rounded-full inline-block">
                <CheckCircle2 className="h-16 w-16" />
             </div>
             <h3 className="text-2xl font-black text-slate-800">Terima Kasih!</h3>
             <p className="text-sm text-slate-600 max-w-sm mx-auto">Pendaftaran Anda telah selesai dan gambar E-Ticket (.jpg) berhasil diunduh. Sampai jumpa di acara Konas Persadia 2026!</p>
             
             {(selectedKategori.id === "persadia" || selectedKategori.id === "umum") && (
               <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl mt-4 w-full max-w-sm">
                 <p className="text-sm text-emerald-800 font-bold mb-3">Informasi Khusus Pesta Rakyat</p>
                 <a 
                   href="https://chat.whatsapp.com/JK6wDcnHh27GhJTx8kUKBY" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   onClick={() => setHasClickedWa(true)}
                   className="block w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 transition text-white rounded-lg font-bold text-sm"
                 >
                   Masuk Komunitas WhatsApp
                 </a>
               </div>
             )}

             <button 
                onClick={handleClose} 
                disabled={(selectedKategori.id === "persadia" || selectedKategori.id === "umum") ? !hasClickedWa : false}
                className={`mt-4 px-8 py-3 rounded-full w-full max-w-xs shadow-lg transition-transform ${(selectedKategori.id === "persadia" || selectedKategori.id === "umum") && !hasClickedWa ? "bg-slate-300 text-slate-500 cursor-not-allowed" : "bg-[#00B4AC] hover:bg-[#00968f] text-white font-bold hover:scale-105"}`}
              >
                Oke
              </button>
          </div>
        ) : (
          <>
        {/* Header Block */}
        <div className="bg-[#0B3D5E] text-white p-6 flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-extrabold text-base sm:text-lg leading-tight">
              {mode === 'daftar' ? 'Formulir Pendaftaran' : 'Cek Status & E-Ticket'}
            </h3>
            <p className="text-xs text-[#F8FAFC]/95 mt-0.5">Konas Persadia 2026 Online Portal</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition text-white"
            aria-label="Tutup Modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-100 p-1.5 gap-1 shrink-0">
          <button
            onClick={() => { setMode('daftar'); setError(''); }}
            className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'daftar' 
                ? 'bg-white text-[#0B3D5E] shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="h-4 w-4" />
            Pendaftaran Baru
          </button>
          <button
            onClick={() => { setMode('download'); setSearchError(''); }}
            className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'download' 
                ? 'bg-white text-[#00B4AC] shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="h-4 w-4" />
            Cek Status & E-Ticket
          </button>
        </div>

        {/* Dynamic Multi-Step Progress Tracker (Only in 'daftar' mode) */}
        {mode === 'daftar' && (
          <div className="bg-slate-50 border-b border-slate-100 px-6 py-3.5 flex justify-between items-center text-xs text-slate-500 font-bold shrink-0">
            <div className="flex items-center gap-1.5">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? "bg-[#0B3D5E] text-white" : "bg-slate-200"}`}>1</span>
              <span className={step === 1 ? "text-slate-800" : ""}>Biodata</span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300" />
            <div className="flex items-center gap-1.5">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? "bg-[#0B3D5E] text-white" : "bg-slate-200"}`}>2</span>
              <span className={step === 2 ? "text-slate-800" : ""}>Pembayaran</span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300" />
            <div className="flex items-center gap-1.5">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? "bg-[#2D7A4F] text-white animate-pulse" : "bg-slate-200"}`}>3</span>
              <span className={step === 3 ? "text-[#2D7A4F]" : ""}>Selesai</span>
            </div>
          </div>
        )}

        {/* Scrollable Modal Content */}
        <div 
          className="p-6 overflow-y-auto flex-1 space-y-4"
          onScroll={(e) => {
            if (step === 2 && mode === 'daftar') {
              const target = e.currentTarget;
              const scrollMax = target.scrollHeight - target.clientHeight;
              if (scrollMax > 5) {
                const progress = Math.min(Math.max(target.scrollTop / scrollMax, 0), 1);
                setScrollProgress(progress);
              } else {
                setScrollProgress(1);
              }
            }
          }}
        >
          {error && mode === 'daftar' && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 font-semibold rounded-xl text-xs flex items-start gap-2">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* MODE DOWNLOAD / CEK E-TICKET */}
          {mode === 'download' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-[#00B4AC]/5 border border-[#00B4AC]/20 p-4 rounded-2xl">
                <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <Download className="h-4 w-4 text-[#00B4AC]" />
                  Cek Status & Unduh E-Ticket
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Masukkan No. Registrasi, Alamat Email, atau Nomor WhatsApp yang Anda gunakan saat mendaftar.
                </p>
              </div>

              {/* Search Input Box */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-600 uppercase">Kata Kunci Pencarian</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="No. Registrasi / Email / No. WA"
                      value={searchKey}
                      onChange={(e) => setSearchKey(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchTicket()}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B4AC] text-sm text-slate-800"
                    />
                  </div>
                  <button
                    onClick={handleSearchTicket}
                    disabled={isSearching}
                    className="px-5 py-2.5 bg-[#00B4AC] hover:bg-[#00968f] disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Mencari...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4" />
                        Cari Data
                      </>
                    )}
                  </button>
                </div>
                {searchError && (
                  <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-100 flex items-center gap-1.5">
                    <Info className="h-4 w-4 shrink-0" />
                    {searchError}
                  </p>
                )}
              </div>

              {/* Search Results Display */}
              {foundParticipant && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 animate-scaleIn">
                  {/* Header Status Badge */}
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">No. Registrasi</span>
                      <strong className="text-lg font-black text-[#0B3D5E] tracking-widest">{foundParticipant.no_registrasi}</strong>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                      foundParticipant.status_pembayaran === 'Lunas' 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {foundParticipant.status_pembayaran}
                    </span>
                  </div>

                  {/* Participant Detail Summary */}
                  <div className="text-xs space-y-1.5 text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Nama Lengkap:</span>
                      <strong className="text-slate-900 font-bold">{foundParticipant.nama_lengkap}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Kategori:</span>
                      <strong className="text-slate-900 font-bold">{foundParticipant.kategori_peserta}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">WhatsApp / Email:</span>
                      <span className="text-slate-800 font-medium">{foundParticipant.whatsapp} / {foundParticipant.email}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200 mt-1">
                      <span className="text-slate-500">Total Tagihan:</span>
                      <strong className="text-[#0B3D5E]">
                        {foundParticipant.total_tagihan === 0 ? 'Gratis' : new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(foundParticipant.total_tagihan)}
                      </strong>
                    </div>
                  </div>

                  {/* IF LUNAS: SHOW QR CODE & DOWNLOAD BUTTON */}
                  {foundParticipant.status_pembayaran === 'Lunas' ? (
                    <div className="space-y-4 text-center pt-2">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block">
                        <QRCodeSVG 
                          value={`${window.location.origin}/scanner.html?id=${foundParticipant.no_registrasi}`} 
                          size={140} 
                          level="H" 
                          includeMargin={true}
                        />
                        <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-wider">E-Ticket QR Code Valid</p>
                      </div>

                      <button
                        onClick={handleSelesai}
                        disabled={isDownloading}
                        className="w-full py-3.5 bg-[#0B3D5E] hover:bg-[#1e40af] text-white font-extrabold text-sm rounded-xl text-center shadow-lg transition cursor-pointer flex items-center justify-center gap-2 disabled:bg-slate-400"
                      >
                        {isDownloading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Mengunduh E-Ticket (.jpg)...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            Download E-Ticket (.jpg)
                          </>
                        )}
                      </button>

                      {(foundParticipant.kategori_peserta?.includes("PERSADIA") || foundParticipant.kategori_peserta?.includes("Masyarakat Umum")) && (
                        <a 
                          href="https://chat.whatsapp.com/GezzqQzSYPuHTiCBRGbela" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="block w-full py-3 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-xs rounded-xl transition text-center shadow-sm"
                        >
                          Grup Komunitas WhatsApp
                        </a>
                      )}
                    </div>
                  ) : (
                    /* IF MENUNGGU VERIFIKASI / BELUM LUNAS */
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                      <div className="flex items-start gap-2">
                        <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <h5 className="text-xs font-bold text-amber-900">Pembayaran Menunggu Verifikasi</h5>
                          <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                            Status pembayaran Anda belum Lunas. E-Ticket akan dapat diunduh secara otomatis setelah pembayaran Anda diverifikasi oleh tim panitia.
                          </p>
                        </div>
                      </div>

                      <div className="bg-white p-3.5 rounded-lg border border-amber-200/80 text-xs space-y-1.5">
                        <div className="flex justify-between font-bold text-slate-800">
                          <span>Bank Tujuan:</span>
                          <span>{REKENING_PEMBAYARAN.bank}</span>
                        </div>
                        <div className="flex justify-between font-bold text-slate-800">
                          <span>No. Rekening:</span>
                          <span className="text-[#0B3D5E]">{REKENING_PEMBAYARAN.nomorRekening}</span>
                        </div>
                        <div className="flex justify-between font-bold text-slate-800">
                          <span>Atas Nama:</span>
                          <span>{REKENING_PEMBAYARAN.atasNama}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* MODE DAFTAR */}
          {mode === 'daftar' && (
            <>
              {/* STEP 1: BIODATA & CATEGORY SELECTION */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Category Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Kategori Pendaftaran</label>
                <select
                  value={kategoriId}
                  onChange={(e) => setKategoriId(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F8FAFC]/40 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B4AC] text-sm text-slate-800 font-medium cursor-pointer"
                >
                  {KATEGORI_PESERTA.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.label} ({k.akses === "ilmiah" ? "Sesi Ilmiah" : "Pesta Rakyat"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Pilihan Kegiatan Dropdown for Ilmiah */}
              {selectedKategori.akses === "ilmiah" && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Pilihan Kegiatan</label>
                  <select
                    value={pilihanKegiatan}
                    onChange={(e) => setPilihanKegiatan(e.target.value as any)}
                    className="w-full px-4 py-3 bg-[#F8FAFC]/40 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B4AC] text-sm text-slate-800 font-medium cursor-pointer"
                  >
                    <option value="Symposium">Symposium Saja</option>
                    <option value="Symposium + Workshop">Symposium + Workshop</option>
                  </select>
                </div>
              )}

              {/* General Personal Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Nama Lengkap</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Contoh: Budi Setiawan"
                      value={namaLengkap}
                      onChange={(e) => setNamaLengkap(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B4AC] text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Alamat Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="Contoh: budi@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B4AC] text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">No. WhatsApp Aktif</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="Contoh: 081234567890"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B4AC] text-sm"
                  />
                </div>
              </div>

              {/* Conditional Additional Fields based on selectedKategori */}
              {selectedKategori.fieldTambahan.includes("institusi") && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Asal Institusi / Universitas / Rumah Sakit / Puskesmas</label>
                  <input
                    type="text"
                    placeholder="Contoh: Universitas Indonesia"
                    value={institusi}
                    onChange={(e) => setInstitusi(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B4AC] text-sm"
                  />
                </div>
              )}

              {selectedKategori.fieldTambahan.includes("nim") && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Nomor Induk Mahasiswa (NIM)</label>
                  <input
                    type="text"
                    placeholder="Contoh: 123456789"
                    value={nim}
                    onChange={(e) => setNim(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B4AC] text-sm mb-2"
                  />
                  <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-100 flex gap-2 items-start mt-2 font-medium">
                    <span className="mt-0.5">⚠️</span> 
                    Catatan: Harap membawa kartu mahasiswa asli Anda untuk pencocokan data saat registrasi ulang di lokasi acara.
                  </p>
                </div>
              )}

              {selectedKategori.fieldTambahan.includes("cabangPersadia") && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Unit / Cabang PERSADIA</label>
                  <input
                    type="text"
                    placeholder="Contoh: PERSADIA Unit Bogor Barat"
                    value={cabangPersadia}
                    onChange={(e) => setCabangPersadia(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B4AC] text-sm"
                  />
                </div>
              )}

              {selectedKategori.fieldTambahan.includes("tanggalLahir") && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={tanggalLahir}
                    onChange={(e) => setTanggalLahir(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B4AC] text-sm text-slate-800"
                  />
                </div>
              )}

              {selectedKategori.fieldTambahan.includes("jenisKelamin") && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Jenis Kelamin</label>
                  <select
                    value={jenisKelamin}
                    onChange={(e) => setJenisKelamin(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B4AC] text-sm text-slate-800 font-medium cursor-pointer"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
              )}

              {(selectedKategori.id === "persadia" || selectedKategori.id === "umum") && (
                <div className="pt-2 border-t border-slate-200 mt-2">
                  <label className="flex items-start gap-3 cursor-pointer p-3.5 bg-amber-50/80 hover:bg-amber-50 border border-amber-200 rounded-xl transition-colors">
                    <input
                      type="checkbox"
                      checked={setujuPenelitian}
                      onChange={(e) => setSetujuPenelitian(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-amber-300 text-[#00B4AC] focus:ring-[#00B4AC] cursor-pointer shrink-0"
                    />
                    <span className="text-xs text-slate-700 leading-relaxed font-medium">
                      Saya menyetujui penggunaan data ini untuk kepentingan penelitian. <span className="text-rose-600 font-bold">*</span>
                    </span>
                  </label>
                </div>
              )}

            </div>
          )}

          {/* STEP 2: PAYMENT & UNIQUE CODE */}
          {step === 2 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-[#0B3D5E]/5 rounded-2xl p-4 border border-[#0B3D5E]/10">
                <span className="text-[10px] font-black uppercase text-[#0B3D5E] tracking-wider">Kategori Dipilih</span>
                <h4 className="font-extrabold text-slate-800 text-sm leading-tight mt-0.5">{selectedKategori.label}</h4>
              </div>

              {/* Payment Details Container */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/60 space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-500 font-bold uppercase">
                  <span>Biaya Registrasi</span>
                  <span>
                    {hargaDasar === 0 ? "Gratis" : new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(hargaDasar)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500 font-bold uppercase pb-3 border-b border-dashed border-slate-200">
                  <span className="flex items-center gap-1">
                    Kode Unik Acak
                    <span className="bg-[#0B3D5E]/10 text-[#0B3D5E] px-1 py-0.5 rounded text-[9px]">Sistem</span>
                  </span>
                  <span className="text-[#0B3D5E]">+{kodeUnik}</span>
                </div>
                <div className="flex justify-between items-center pt-1.5">
                  <span className="text-xs font-black text-slate-700 uppercase">Total Akhir Transfer</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-slate-900">
                      {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(totalAkhir)}
                    </span>
                    <button
                      onClick={() => copyToClipboard(totalAkhir.toString())}
                      className="p-1 rounded hover:bg-slate-200 text-[#00B4AC]"
                      title="Salin Nominal"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Registration ID Display */}
              <div className="bg-[#F8FAFC] rounded-2xl p-5 border border-slate-200/60 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">No. Registrasi Anda</span>
                    <div className="flex items-center gap-2 mt-1">
                      <strong className="text-lg font-black text-[#0B3D5E] tracking-widest">{registrationId}</strong>
                      <button
                        onClick={() => copyToClipboard(registrationId)}
                        className="p-1.5 rounded hover:bg-slate-200 text-[#00B4AC]"
                        title="Salin No Registrasi"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-xs text-blue-800 leading-relaxed font-medium">
                    Mohon salin No. Registrasi di atas dan tempelkan pada kolom <strong>Keterangan / Berita Transfer</strong> saat Anda melakukan pembayaran. Hal ini memudahkan panitia memverifikasi pembayaran Anda secara cepat.
                  </p>
                </div>
              </div>

              {/* Banking Transfer Details */}
              <div className="bg-white rounded-2xl p-5 border border-[#00B4AC]/30 shadow-sm space-y-4">
                <h5 className="text-xs font-black text-[#0B3D5E] uppercase flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4" />
                  Rekening Tujuan Pembayaran
                </h5>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Bank</span>
                    <strong className="text-slate-800 text-sm">{REKENING_PEMBAYARAN.bank}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Atas Nama</span>
                    <strong className="text-slate-800 text-xs">{REKENING_PEMBAYARAN.atasNama}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Nomor Rekening</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <strong className="text-[#0B3D5E] text-base font-black tracking-wider">{REKENING_PEMBAYARAN.nomorRekening}</strong>
                      <button
                        onClick={() => copyToClipboard(REKENING_PEMBAYARAN.nomorRekening)}
                        className="p-1 rounded hover:bg-slate-100 text-[#00B4AC]"
                        title="Salin No Rekening"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-100 text-amber-800 rounded-2xl text-xs space-y-2">
                <p className="font-extrabold flex items-center gap-1">
                  <Info className="h-4 w-4 shrink-0 text-amber-600" />
                  PERINGATAN PENTING & CATATAN:
                </p>
                <p className="leading-relaxed">
                  Mohon transfer <strong>PERSIS PAS</strong> sejumlah <strong className="text-sm bg-amber-100 px-1.5 py-0.5 rounded">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(totalAkhir)}</strong> (termasuk 3 digit kode unik di akhir) agar tim bendahara kami dapat memverifikasi pembayaran Anda secara cepat dan otomatis. 
                </p>
                <p className="font-bold text-rose-700 pt-1 border-t border-amber-200/60">
                  ⚠️ Catatan: Jangan tekan tombol kirim belum melakukan pembayaran.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS CONFIRMATION */}
          {step === 3 && successData && (
            <div className="text-center py-6 space-y-6 animate-scaleIn">
              <div className="p-3 bg-[#2D7A4F] text-white rounded-full inline-block mx-auto">
                <CheckCircle2 className="h-12 w-12" />
              </div>

              <div className="space-y-1">
                <h4 className="text-xl font-black text-slate-800">Registrasi Berhasil Terkirim!</h4>
                <p className="text-xs text-slate-500">Formulir pendaftaran Anda telah tercatat di database kami.</p>
              </div>

              {/* Registration Code Display Box */}
              <div className="bg-[#F8FAFC] p-5 rounded-2xl border border-slate-200/70 inline-block w-full max-w-sm">
                <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">No. Registrasi</span>
                <div className="flex flex-col items-center justify-center gap-4 mt-3 mb-2">
                  <QRCodeSVG 
                    value={`${window.location.origin}/scanner.html?id=${successData.id}`} 
                    size={120} 
                    level="H" 
                    includeMargin={true}
                  />
                  <strong className="text-xl font-black text-[#0B3D5E] tracking-widest">{successData.id}</strong>
                  
                </div>
              </div>

              {/* Summary details */}
              <div className="text-xs text-slate-600 space-y-1 max-w-sm mx-auto text-left bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between">
                  <span>Nama Lengkap:</span>
                  <strong className="text-slate-800">{namaLengkap}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Kategori Tiket:</span>
                  <strong className="text-slate-800">{selectedKategori.label}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Akses Tiket:</span>
                  <strong className="text-slate-800 uppercase">{selectedKategori.akses === "ilmiah" ? "Sesi Ilmiah (Novotel)" : "Pesta Rakyat (GOR Pakansari)"}</strong>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 mt-1">
                  <span>Total Transfer:</span>
                  <strong className="text-[#0B3D5E]">{successData.totalAkhir === 0 ? "Gratis" : new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(successData.totalAkhir)}</strong>
                </div>
              </div>

              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed px-4">
                Terima kasih atas partisipasi Anda.
              </p>
            </div>
          )}
          </>
          )}
        </div>

        {/* Modal Actions Footer */}
        {mode === 'download' ? (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-full transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        ) : (
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
          {step === 1 && (
            <>
              <span className="text-xs text-slate-400 font-bold">{hargaDasar === 0 ? "Pendaftaran Gratis" : "Masa Early Bird Terbuka"}</span>
              <button
                id="btn-step1-next"
                onClick={handleNextStep1}
                disabled={isSubmitting}
                className={`px-6 py-3 ${hargaDasar === 0 ? 'bg-[#2D7A4F] hover:bg-[#1e603f]' : 'bg-[#0B3D5E] hover:bg-[#1e40af]'} disabled:bg-slate-300 text-white font-extrabold text-sm rounded-full shadow transition-all flex items-center gap-1.5 cursor-pointer`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    {hargaDasar === 0 ? "Kirim Pendaftaran" : "Lanjutkan ke Pembayaran"}
                    {hargaDasar === 0 ? <CheckCircle2 className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </>
                )}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button
                onClick={() => setStep(1)}
                className="px-4 py-3 text-[#0B3D5E] hover:text-[#1e40af] font-bold text-sm flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                Kembali
              </button>
              <button
                id="btn-step2-next"
                onClick={handleSubmitRegistration}
                disabled={isSubmitting}
                style={step === 2 ? {
                  opacity: scrollProgress,
                  transform: `translateY(${((1 - scrollProgress) * 12)}px)`,
                  pointerEvents: scrollProgress < 0.2 ? 'none' : 'auto'
                } : undefined}
                className="px-6 py-3 bg-[#0B3D5E] hover:bg-[#1e40af] disabled:bg-slate-300 text-white font-extrabold text-sm rounded-full shadow flex items-center gap-1.5 cursor-pointer transition-transform duration-75"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    Sudah Bayar, Kirim
                    <CheckCircle2 className="h-4 w-4" />
                  </>
                )}
              </button>
            </>
          )}

          {step === 3 && (
            <button
              onClick={handleSelesai}
              disabled={isDownloading}
              className="w-full py-3.5 bg-[#0B3D5E] hover:bg-[#1e40af] text-white font-extrabold text-sm rounded-xl text-center shadow-lg transition cursor-pointer flex items-center justify-center gap-2 disabled:bg-slate-400"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mengunduh E-Ticket (.jpg)...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download E-Ticket
                </>
              )}
            </button>
          )}
        </div>
        )}
        </>
        )}
      </div>
    </div>

    {/* Hidden Paperless E-Ticket Print/Image Area */}
      {successData && (
        <div 
          id="badge-print-area" 
          className="absolute bg-[#ffffff]"
          style={{ 
            width: '450px',
            height: '720px',
            position: 'fixed',
            top: '0',
            left: '0',
            zIndex: -50,
            pointerEvents: 'none',
            backgroundColor: '#ffffff',
            padding: '20px',
            boxSizing: 'border-box'
          }}
        >
          <div className="h-full w-full rounded-2xl overflow-hidden flex flex-col border-2 border-slate-200 bg-white" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
            
            {/* Header Band */}
            <div 
              className="px-6 pt-5 pb-5 text-white" 
              style={{ backgroundColor: selectedKategori?.id === 'dokter_spesialis' ? '#0284c7' : selectedKategori?.id === 'dokter_umum' ? '#0d9488' : selectedKategori?.id === 'residen' ? '#4f46e5' : selectedKategori?.id === 'mahasiswa' ? '#059669' : selectedKategori?.id === 'persadia' ? '#ea580c' : '#0B3D5E' }}
            >
              <div className="flex justify-between items-center">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1 shadow-sm">
                     <img src={EVENT_INFO.eventLogoUrl} className="w-full h-full object-contain" alt="Logo" />
                  </div>
                  <div>
                    <h2 className="text-base font-black tracking-wider leading-tight">KNS PERSADIA 2026</h2>
                    <p className="text-[10px] opacity-90 uppercase tracking-widest mt-0.5">Bogor, Indonesia • 7-8 Nov 2026</p>
                  </div>
                </div>
                <div className="bg-white/15 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border border-white/20">
                  E-TICKET PASS
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 px-6 pt-5 pb-4 flex flex-col bg-white text-center items-center">
              
              {/* Participant Name */}
              <div className="mb-3 text-center w-full">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">NAMA PESERTA</span>
                <h3 className="text-2xl font-black text-slate-900 leading-tight uppercase break-words">
                  {namaLengkap}
                </h3>
                {institusi && (
                  <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wide">
                    {institusi}
                  </p>
                )}
              </div>

              {/* Category & Access Badges */}
              <div className="flex flex-wrap justify-center gap-2 mb-4 w-full">
                <div 
                  className="px-3.5 py-1 rounded-full border text-[11px] font-black uppercase tracking-wider"
                  style={{ 
                    borderColor: selectedKategori?.id === 'dokter_spesialis' ? '#0284c7' : selectedKategori?.id === 'dokter_umum' ? '#0d9488' : selectedKategori?.id === 'residen' ? '#4f46e5' : selectedKategori?.id === 'mahasiswa' ? '#059669' : selectedKategori?.id === 'persadia' ? '#ea580c' : '#0B3D5E',
                    color: selectedKategori?.id === 'dokter_spesialis' ? '#0284c7' : selectedKategori?.id === 'dokter_umum' ? '#0d9488' : selectedKategori?.id === 'residen' ? '#4f46e5' : selectedKategori?.id === 'mahasiswa' ? '#059669' : selectedKategori?.id === 'persadia' ? '#ea580c' : '#0B3D5E',
                    backgroundColor: '#F8FAFC'
                  }}
                >
                  {selectedKategori?.label}
                </div>
                <div className="px-3.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-wider">
                  {selectedKategori?.akses === "ilmiah" ? "Sesi Ilmiah (Novotel)" : "Pesta Rakyat (GOR Pakansari)"}
                </div>
              </div>

              {/* LARGE HIGH-CONTRAST SCANNER-FRIENDLY QR CODE CONTAINER */}
              <div className="my-auto p-4 bg-white rounded-2xl border-2 border-slate-900 shadow-lg flex flex-col items-center justify-center w-full max-w-[270px]">
                <div className="bg-white p-2 rounded-xl">
                  <QRCodeSVG 
                    value={`${window.location.origin}/scanner.html?id=${successData.id}`} 
                    size={200} 
                    level="H" 
                    includeMargin={true}
                  />
                </div>
                <div className="mt-2 text-center border-t border-slate-200 pt-2 w-full">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">ID REGISTRASI</span>
                  <strong className="text-base font-mono font-black text-slate-900 tracking-widest">{successData.id}</strong>
                </div>
              </div>

            </div>

            {/* Footer Area with Paperless Instructions */}
            <div className="bg-slate-900 text-white px-5 py-4 text-center border-t border-slate-800 flex items-center justify-center">
              <p className="text-[10px] font-bold tracking-wider text-amber-400 uppercase leading-none">
                Simpan E-Ticket ini di galeri HP Anda.
              </p>
            </div>
          </div>
        </div>
      )}
    
    </>
  );
}
