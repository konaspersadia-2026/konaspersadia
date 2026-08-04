import { useState, useEffect, useRef, DragEvent } from "react";
import { X, Calendar, User, Mail, Phone, CreditCard, Upload, Loader2, CheckCircle2, ChevronRight, ChevronLeft, Copy, Info, Download } from "lucide-react";
import { KATEGORI_PESERTA, EVENT_INFO, REKENING_PEMBAYARAN, SLOT_WAKTU_CEK_GULA } from "../config";
import { RegistrationData } from "../types";
import { QRCodeSVG } from "qrcode.react";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";
import { supabase } from "../lib/supabase";

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RegistrationModal({ isOpen, onClose }: RegistrationModalProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<{ id: string; totalAkhir: number; data: any } | null>(null);

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
    if (fields.includes("noKTP") && (!noKTP.trim() || noKTP.length < 16)) return setError("Nomor KTP (16 digit) wajib diisi.");
    if (fields.includes("cabangPersadia") && !cabangPersadia.trim()) return setError("Cabang PERSADIA wajib diisi.");

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
        status_pembayaran: "Menunggu Verifikasi",
        nama_lengkap: namaLengkap,
        email: email,
        whatsapp: whatsapp,
        kategori_peserta: selectedKategori.label,
        pilihan_kegiatan: selectedKategori.akses === "ilmiah" ? pilihanKegiatan : "-",
        total_tagihan: finalTotal,
        institusi: selectedKategori.fieldTambahan.includes("institusi") ? institusi : "-",
        nim: selectedKategori.fieldTambahan.includes("nim") ? nim : "-",
        no_ktp: selectedKategori.fieldTambahan.includes("noKTP") ? noKTP : "-",
        cabang_persadia: selectedKategori.fieldTambahan.includes("cabangPersadia") ? cabangPersadia : "-",
        slot_waktu_cek_gula: selectedKategori.fieldTambahan.includes("slotWaktuCekGula") ? slotWaktuCekGula : "-",
      };

      let { error: supabaseErr } = await supabase.from('pendaftar').insert([payloadToSupabase]);
      if (supabaseErr) {
        console.error("Gagal insert ke Supabase:", supabaseErr);
        throw new Error(`Peringatan Supabase: Gagal menyimpan ke database Supabase.\nPesan Error: ${supabaseErr.message}`);
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
  };

  const handleDownloadBadge = async () => {
    const badgeElement = document.getElementById('badge-print-area');
    if (!badgeElement) return;

    try {
      // Create image from the badge element
      const imgData = await toPng(badgeElement, { pixelRatio: 3, backgroundColor: '#ffffff' });
      
      // A6 size in portrait is 105 x 148 mm
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a6'
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 105, 148);
      pdf.save(`Badge-${successData?.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF', error);
    }
  };

  const handleClose = () => {
    if (step === 3) {
      resetForm();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
    <div
      id="registration-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        id="registration-modal-box"
        className="relative bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
      >
        {/* Header Block */}
        <div className="bg-[#0B3D5E] text-white p-6 flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-extrabold text-base sm:text-lg leading-tight">Formulir Pendaftaran</h3>
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

        {/* Dynamic Multi-Step Progress Tracker */}
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

        {/* Scrollable Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 font-semibold rounded-xl text-xs flex items-start gap-2">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

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

              {selectedKategori.fieldTambahan.includes("noKTP") && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">No. KTP / NIK (16 digit)</label>
                  <input
                    type="text"
                    maxLength={16}
                    placeholder="Masukkan 16 digit Nomor NIK KTP Anda"
                    value={noKTP}
                    onChange={(e) => setNoKTP(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B4AC] text-sm"
                  />
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

              {selectedKategori.fieldTambahan.includes("slotWaktuCekGula") && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Pilih Slot Waktu Cek Gula Darah Gratis</label>
                  <select
                    value={slotWaktuCekGula}
                    onChange={(e) => setSlotWaktuCekGula(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B4AC] text-sm cursor-pointer"
                  >
                    {SLOT_WAKTU_CEK_GULA.map((slot, idx) => (
                      <option key={idx} value={slot}>{slot}</option>
                    ))}
                  </select>
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
                  PERINGATAN PENTING:
                </p>
                <p className="leading-relaxed">
                  Mohon transfer <strong>PERSIS PAS</strong> sejumlah <strong className="text-sm bg-amber-100 px-1.5 py-0.5 rounded">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(totalAkhir)}</strong> (termasuk 3 digit kode unik di akhir) agar tim bendahara kami dapat memverifikasi pembayaran Anda secara cepat dan otomatis. 
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
                  <button
                    onClick={handleDownloadBadge}
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#00B4AC] hover:bg-[#00968f] text-white rounded-xl font-bold text-sm transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
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
        </div>

        {/* Modal Actions Footer */}
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
                className="px-6 py-3 bg-[#0B3D5E] hover:bg-[#1e40af] disabled:bg-slate-300 text-white font-extrabold text-sm rounded-full shadow transition-all flex items-center gap-1.5 cursor-pointer"
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
              onClick={handleClose}
              className="w-full py-3 bg-[#0B3D5E] hover:bg-[#1e40af] text-white font-extrabold text-sm rounded-xl text-center shadow transition cursor-pointer"
            >
              Selesai
            </button>
          )}
        </div>
      </div>
    </div>

    {/* Hidden A6 Print Area for Badge */}
      {successData && (
        <div 
          id="badge-print-area" 
          className="absolute bg-[#ffffff]"
          style={{ 
            width: '396px', // ~105mm at 96dpi
            height: '559px', // ~148mm at 96dpi
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
          <div className="h-full w-full rounded-2xl overflow-hidden flex flex-col border-2 border-[#e2e8f0] bg-[#ffffff]" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            
            {/* Header Band */}
            <div 
              className="px-5 pt-5 pb-5 text-white" 
              style={{ backgroundColor: selectedKategori?.id === 'dokter_spesialis' ? '#0284c7' : selectedKategori?.id === 'dokter_umum' ? '#0d9488' : selectedKategori?.id === 'residen' ? '#4f46e5' : selectedKategori?.id === 'mahasiswa' ? '#059669' : selectedKategori?.id === 'persadia' ? '#ea580c' : '#475569' }}
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-2.5 items-center">
                  <div className="w-9 h-9 bg-[#ffffff] rounded-md flex items-center justify-center p-1 shadow-sm">
                     <img src={EVENT_INFO.eventLogoUrl} className="w-full h-full object-contain" alt="Logo" />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-black tracking-wider leading-tight">KNS 2026</h2>
                    <p className="text-[9px] opacity-90 uppercase tracking-widest mt-0.5">Bogor, Indonesia</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold">7-8 Nov</p>
                  <p className="text-[11px] font-bold">2026</p>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 px-6 py-6 flex flex-col bg-[#ffffff]">
              
              {/* Name (Dominant) */}
              <div className="mb-6 text-left">
                <h3 className="text-[26px] font-black text-[#0f172a] leading-[1.1] tracking-tight uppercase break-words">
                  {namaLengkap}
                </h3>
                <p className="text-[13px] font-bold text-[#64748b] mt-2 uppercase tracking-wide">
                  {institusi || "Peserta"}
                </p>
              </div>

              {/* Different shape for Category and Access */}
              <div className="space-y-4 mb-auto text-left">
                {/* Category: Pill Shape */}
                <div className="inline-block">
                   <div 
                    className="px-3.5 py-1.5 rounded-full border" 
                    style={{ 
                      borderColor: selectedKategori?.id === 'dokter_spesialis' ? '#0284c7' : selectedKategori?.id === 'dokter_umum' ? '#0d9488' : selectedKategori?.id === 'residen' ? '#4f46e5' : selectedKategori?.id === 'mahasiswa' ? '#059669' : selectedKategori?.id === 'persadia' ? '#ea580c' : '#475569',
                      backgroundColor: (selectedKategori?.id === 'dokter_spesialis' ? '#0284c7' : selectedKategori?.id === 'dokter_umum' ? '#0d9488' : selectedKategori?.id === 'residen' ? '#4f46e5' : selectedKategori?.id === 'mahasiswa' ? '#059669' : selectedKategori?.id === 'persadia' ? '#ea580c' : '#475569') + '15'
                    }}
                   >
                     <span 
                      className="text-[11px] font-bold uppercase tracking-wider" 
                      style={{ color: selectedKategori?.id === 'dokter_spesialis' ? '#0284c7' : selectedKategori?.id === 'dokter_umum' ? '#0d9488' : selectedKategori?.id === 'residen' ? '#4f46e5' : selectedKategori?.id === 'mahasiswa' ? '#059669' : selectedKategori?.id === 'persadia' ? '#ea580c' : '#475569' }}
                     >
                       {selectedKategori?.label}
                     </span>
                   </div>
                </div>

                {/* Access: Panel Shape with Icon */}
                <div className="flex items-center gap-3 p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg">
                  <div className="w-8 h-8 rounded bg-[#ffffff] shadow-sm flex items-center justify-center shrink-0 border border-[#e2e8f0]">
                    <Calendar className="w-4 h-4 text-[#475569]" />
                  </div>
                  <div className="text-left">
                    <span className="text-[9px] font-bold text-[#94a3b8] uppercase tracking-wider block">Akses Acara</span>
                    <strong className="text-[11px] text-[#334155] block leading-tight mt-0.5">
                      {selectedKategori?.akses === "ilmiah" ? "Sesi Ilmiah (Novotel)" : "Pesta Rakyat (GOR Pakansari)"}
                    </strong>
                  </div>
                </div>
              </div>
              
            </div>

            {/* Footer Area with QR */}
            <div className="bg-[#f8fafc] px-6 py-4 flex items-center justify-between border-t border-[#e2e8f0]">
               <div className="text-left">
                 <span className="text-[9px] font-black text-[#94a3b8] tracking-widest uppercase block mb-1">ID Peserta</span>
                 <span className="text-sm font-mono font-bold text-[#1e293b]">{successData.id}</span>
               </div>
               <div className="p-1.5 bg-[#ffffff] rounded-lg shadow-sm border border-[#e2e8f0]">
                <QRCodeSVG 
                  value={`${window.location.origin}/scanner.html?id=${successData.id}`} 
                  size={60} 
                  level="H" 
                />
               </div>
            </div>

            {/* Note Area */}
            <div className="bg-[#f1f5f9] px-4 py-2.5 text-center border-t border-[#e2e8f0]">
              <p className="text-[8px] text-[#64748b] font-medium leading-tight">
                Simpan file PDF ini di HP Anda — tunjukkan QR Code ini saat check-in di lokasi acara.
              </p>
            </div>
          </div>
        </div>
      )}
    
    </>
  );
}
