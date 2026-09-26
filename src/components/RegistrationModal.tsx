import { useState, useEffect, useRef, DragEvent } from "react";
import { X, Calendar, User, Mail, Phone, CreditCard, Upload, Loader2, CheckCircle2, ChevronRight, ChevronLeft, Copy, Info, Download, ShieldCheck, Tag, AlertCircle, Clock, MessageCircle, Building2, Sparkles, FileText } from "lucide-react";
import { KATEGORI_PESERTA, EVENT_INFO, REKENING_PEMBAYARAN, SLOT_WAKTU_CEK_GULA, VOUCHER_DOKTER_UMUM_CONFIG, DIABETES_HEALTH_FORUM_CONFIG, HEALTH_TALK_CONFIG } from "../config";
import { RegistrationData } from "../types";
import { QRCodeSVG } from "qrcode.react";
import { toJpeg } from "html-to-image";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { Turnstile } from "@marsidev/react-turnstile";

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
  const [showAccommodationPopup, setShowAccommodationPopup] = useState(false);
  const [popupCountdown, setPopupCountdown] = useState(3);
  const [isDownloading, setIsDownloading] = useState(false);
  const [hasConfirmedPayment, setHasConfirmedPayment] = useState(false);
  const [hasClickedWa, setHasClickedWa] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  useEffect(() => {
    let timer: any;
    if (showAccommodationPopup && popupCountdown > 0) {
      timer = setTimeout(() => {
        setPopupCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [showAccommodationPopup, popupCountdown]);

  useEffect(() => {
    setHasConfirmedPayment(false);
  }, [step, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setTurnstileToken(null);
    }
  }, [isOpen]);

  // Form Fields
  const [kategoriId, setKategoriId] = useState(KATEGORI_PESERTA[0].id);
  const [pilihanKegiatan, setPilihanKegiatan] = useState<"Symposium" | "Symposium + Workshop" | "Workshop">("Symposium");
  const [namaLengkap, setNamaLengkap] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  
  // Custom conditional fields
  const [institusi, setInstitusi] = useState("");
  const [nim, setNim] = useState("");
  const [noKTP, setNoKTP] = useState("");
  const [cabangPersadia, setCabangPersadia] = useState("");
  const [namaKetuaCabang, setNamaKetuaCabang] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState("Laki-laki");
  const [setujuPenelitian, setSetujuPenelitian] = useState(false);
  const [slotWaktuCekGula, setSlotWaktuCekGula] = useState(SLOT_WAKTU_CEK_GULA[0]);
  
  // Health Talk / Diabetes Health Forum State
  const [ikutHealthTalk, setIkutHealthTalk] = useState(false);
  const [ikutPestaRakyatUmum, setIkutPestaRakyatUmum] = useState(true);
  const [tipePestaRakyatUmum, setTipePestaRakyatUmum] = useState<"gratis" | "berbayar">("gratis");
  const [ikutDhfUmum, setIkutDhfUmum] = useState(false);

  // General Public (Masyarakat Umum) -> Willing to become PERSADIA Member State
  const [bersediaAnggotaPersadia, setBersediaAnggotaPersadia] = useState(false);
  const [alamatLengkap, setAlamatLengkap] = useState("");
  const [kelurahan, setKelurahan] = useState("");
  const [kecamatan, setKecamatan] = useState("");
  const [kotaKabupaten, setKotaKabupaten] = useState("");
  const [provinsi, setProvinsi] = useState("");

  // Voucher Dokter Umum (FKTP) State
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<string | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState("");
  const [voucherSuccess, setVoucherSuccess] = useState("");

  const [isHealthTalkAvailable, setIsHealthTalkAvailable] = useState(true);

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'health_talk_enabled')
            .maybeSingle();
          
          if (!error && data) {
            setIsHealthTalkAvailable(data.value === 'true');
          }
        } catch (err) {
          console.error("Error fetching settings:", err);
          // Default true if table doesn't exist
        }
      }
    };
    
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

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

  // 1. Reset voucher & health talk on category change
  useEffect(() => {
    setAppliedVoucher(null);
    setVoucherInput("");
    setVoucherError("");
    setVoucherSuccess("");
    setIkutHealthTalk(false);
    setIkutPestaRakyatUmum(true);
    setTipePestaRakyatUmum("gratis");
    setIkutDhfUmum(false);
    setNamaKetuaCabang("");
    if (kategoriId === "perawat") {
      setPilihanKegiatan("Workshop");
    } else if (pilihanKegiatan === "Workshop") {
      setPilihanKegiatan("Symposium");
    }
  }, [kategoriId]);

  // Recalculate price when category, options, or voucher changes
  useEffect(() => {
    const isEB = isEarlyBirdActive();
    let price = 0;

    if (selectedKategori.akses === "ilmiah") {
      if (selectedKategori.id === "perawat") {
        const hargaObj = selectedKategori.hargaWorkshop || selectedKategori.hargaSymposiumWorkshop;
        if (hargaObj) {
          price = isEB ? hargaObj.earlyBird : hargaObj.onsite;
        }
      } else if (selectedKategori.id === "dokter_umum" && appliedVoucher) {
        price = pilihanKegiatan === "Symposium"
          ? VOUCHER_DOKTER_UMUM_CONFIG.hargaSymposium
          : VOUCHER_DOKTER_UMUM_CONFIG.hargaSymposiumWorkshop;
      } else {
        const hargaObj = pilihanKegiatan === "Symposium" ? selectedKategori.hargaSymposium : selectedKategori.hargaSymposiumWorkshop;
        if (hargaObj) {
          price = isEB ? hargaObj.earlyBird : hargaObj.onsite;
        }
      }
    } else if (selectedKategori.id === "persadia") {
      // Pesta Rakyat is free (Rp 0), DHF is Rp 200.000
      price = ikutHealthTalk ? DIABETES_HEALTH_FORUM_CONFIG.biaya : 0;
    } else if (selectedKategori.id === "umum") {
      // Pesta Rakyat: Gratis (Rp 0) or Berbayar + Kaos (Rp 100.000), DHF: Rp 200.000
      const hargaPesta = ikutPestaRakyatUmum ? (tipePestaRakyatUmum === "berbayar" ? 100000 : 0) : 0;
      const hargaDhf = ikutDhfUmum ? 200000 : 0;
      price = hargaPesta + hargaDhf;
    } else {
      price = isEB ? (selectedKategori.hargaEarlyBird || 0) : (selectedKategori.hargaReguler || 0);
    }

    setHargaDasar(price);
  }, [kategoriId, selectedKategori, pilihanKegiatan, ikutHealthTalk, ikutPestaRakyatUmum, tipePestaRakyatUmum, ikutDhfUmum, appliedVoucher]);

  const handleValidateVoucher = async () => {
    const cleanCode = voucherInput.trim().toUpperCase();
    if (!cleanCode) {
      setVoucherError("Silakan ketikkan kode voucher.");
      return;
    }

    if (selectedKategori.id !== "dokter_umum") {
      setVoucherError("Voucher hanya berlaku untuk kategori Dokter Umum (FKTP).");
      return;
    }

    setVoucherLoading(true);
    setVoucherError("");
    setVoucherSuccess("");

    if (!cleanCode.startsWith(VOUCHER_DOKTER_UMUM_CONFIG.prefix)) {
      setVoucherError(`Kode voucher Dokter Umum harus diawali dengan '${VOUCHER_DOKTER_UMUM_CONFIG.prefix}'`);
      setVoucherLoading(false);
      return;
    }

    try {
      if (isSupabaseConfigured) {
        const { data, error: rpcErr } = await supabase.rpc('validate_voucher', {
          p_code: cleanCode,
          p_kategori: selectedKategori.id
        });

        if (rpcErr) throw rpcErr;

        if (data && data.valid) {
          setAppliedVoucher(data.code);
          setVoucherSuccess(`Voucher ${data.code} berhasil diterapkan!`);
          setVoucherError("");
        } else {
          setVoucherError(data?.message || "Kode voucher tidak valid atau sudah pernah digunakan.");
        }
      } else {
        // Fallback testing local jika Supabase belum terkonfigurasi
        if (cleanCode.startsWith(VOUCHER_DOKTER_UMUM_CONFIG.prefix)) {
          setAppliedVoucher(cleanCode);
          setVoucherSuccess(`Voucher ${cleanCode} berhasil diterapkan (Mode Uji Coba).`);
          setVoucherError("");
        } else {
          setVoucherError(`Kode voucher harus diawali dengan '${VOUCHER_DOKTER_UMUM_CONFIG.prefix}'`);
        }
      }
    } catch (err: any) {
      console.error("Voucher validation error:", err);
      setVoucherError("Gagal memeriksa voucher: " + (err.message || "Koneksi bermasalah"));
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherInput("");
    setVoucherError("");
    setVoucherSuccess("");
  };

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

  // Generate 8-digit registration ID (4-digit millisecond timestamp + 4-digit random)
  const generateRegistrationId = () => {
    const timePart = Date.now().toString().slice(-4);
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `KNS2026-${timePart}${randomPart}`;
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
    if (fields.includes("namaKetuaCabang") && !namaKetuaCabang.trim()) return setError("Nama Ketua Cabang PERSADIA wajib diisi.");
    if (fields.includes("tanggalLahir") && !tanggalLahir.trim()) return setError("Tanggal lahir wajib diisi.");
    if (fields.includes("jenisKelamin") && !jenisKelamin.trim()) return setError("Jenis kelamin wajib dipilih.");
    
    // Validation for participants who agree to become a PERSADIA member
    if (selectedKategori.id !== "persadia" && bersediaAnggotaPersadia) {
      if (!alamatLengkap.trim()) return setError("Alamat lengkap (Jl / RT / RW / No) wajib diisi jika bersedia menjadi anggota PERSADIA.");
      if (!kelurahan.trim()) return setError("Kelurahan / Desa wajib diisi.");
      if (!kecamatan.trim()) return setError("Kecamatan wajib diisi.");
      if (!kotaKabupaten.trim()) return setError("Kota / Kabupaten wajib diisi.");
      if (!provinsi.trim()) return setError("Provinsi wajib diisi.");
    }

    // Validation for Umum category activities (must pick at least one)
    if (selectedKategori.id === "umum" && !ikutPestaRakyatUmum && !ikutDhfUmum) {
      return setError("Silakan pilih minimal salah satu kegiatan (Pesta Rakyat atau Diabetes Health Forum).");
    }

    if (!turnstileToken) {
      return setError("Mohon selesaikan verifikasi keamanan (Captcha) terlebih dahulu.");
    }

    setError("");
    
    let currentRegId = registrationId;
    if (!currentRegId) {
      currentRegId = generateRegistrationId();
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

    const activeRegId = actualPassedRegId || registrationId || generateRegistrationId();
    
    try {
      const isUmumDHF = selectedKategori.id === "umum" && ikutDhfUmum;
      const isPersadiaDHF = selectedKategori.id === "persadia" && ikutHealthTalk;
      const isAttendingHealthTalk = isPersadiaDHF || isUmumDHF;

      let namaPilihanKegiatan = "-";
      if (selectedKategori.akses === "ilmiah") {
        namaPilihanKegiatan = selectedKategori.id === "perawat" ? "Workshop" : pilihanKegiatan;
      } else if (selectedKategori.id === "persadia") {
        namaPilihanKegiatan = ikutHealthTalk ? "Pesta Rakyat + Diabetes Health Forum" : "Pesta Rakyat";
      } else if (selectedKategori.id === "umum") {
        const pestaLabel = tipePestaRakyatUmum === "berbayar" 
          ? "Pesta Rakyat (Paket Kaos)" 
          : "Pesta Rakyat (Gratis)";

        if (ikutPestaRakyatUmum && ikutDhfUmum) {
          namaPilihanKegiatan = `${pestaLabel} + Diabetes Health Forum`;
        } else if (ikutPestaRakyatUmum) {
          namaPilihanKegiatan = pestaLabel;
        } else if (ikutDhfUmum) {
          namaPilihanKegiatan = "Diabetes Health Forum";
        }
      }

      const cabangPersadiaVal = selectedKategori.fieldTambahan.includes("cabangPersadia") ? cabangPersadia.trim() : "-";
      const namaKetuaCabangVal = selectedKategori.fieldTambahan.includes("namaKetuaCabang") ? namaKetuaCabang.trim() : "-";

      const payloadToSupabase = {
        timestamp: new Date().toISOString(),
        no_registrasi: activeRegId,
        status_pembayaran: finalTotal === 0 ? "Lunas" : "Menunggu Verifikasi",
        nama_lengkap: namaLengkap,
        email: email,
        whatsapp: whatsapp,
        kategori_peserta: selectedKategori.label,
        pilihan_kegiatan: namaPilihanKegiatan,
        total_tagihan: finalTotal,
        ikut_health_talk: isAttendingHealthTalk,
        bersedia_anggota_persadia: selectedKategori.id !== "persadia" && bersediaAnggotaPersadia,
        alamat_lengkap: (selectedKategori.id !== "persadia" && bersediaAnggotaPersadia) ? alamatLengkap : "-",
        kelurahan: (selectedKategori.id !== "persadia" && bersediaAnggotaPersadia) ? kelurahan : "-",
        kecamatan: (selectedKategori.id !== "persadia" && bersediaAnggotaPersadia) ? kecamatan : "-",
        kota_kabupaten: (selectedKategori.id !== "persadia" && bersediaAnggotaPersadia) ? kotaKabupaten : "-",
        provinsi: (selectedKategori.id !== "persadia" && bersediaAnggotaPersadia) ? provinsi : "-",
        institusi: selectedKategori.fieldTambahan.includes("institusi") ? institusi : "-",
        nim: selectedKategori.fieldTambahan.includes("nim") ? nim : "-",
        cabang_persadia: cabangPersadiaVal,
        nama_ketua_cabang: namaKetuaCabangVal,
        tanggal_lahir: selectedKategori.fieldTambahan.includes("tanggalLahir") ? tanggalLahir : "-",
        jenis_kelamin: selectedKategori.fieldTambahan.includes("jenisKelamin") ? jenisKelamin : "-",
        kode_voucher: appliedVoucher || "-",
      };

      if (isSupabaseConfigured) {
        let { error: supabaseErr } = await supabase.from('pendaftar').insert([payloadToSupabase]);
        if (supabaseErr) {
          console.error("Gagal insert ke Supabase:", supabaseErr);
          throw new Error(`Peringatan Supabase: Gagal menyimpan ke database Supabase.\nPesan Error: ${supabaseErr.message}`);
        }

        // Claim voucher in database so it cannot be used again
        if (appliedVoucher) {
          try {
            await supabase.rpc('claim_voucher', {
              p_code: appliedVoucher,
              p_no_reg: activeRegId
            });
          } catch (claimErr) {
            console.warn("Gagal menandai voucher sebagai terpakai:", claimErr);
          }
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

      // Tampilkan popup iklan akomodasi khusus peserta berbayar ilmiah
      if (selectedKategori.akses === "ilmiah") {
        setPopupCountdown(3);
        setShowAccommodationPopup(true);
      }
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
    setNim("");
    setCabangPersadia("");
    setNamaKetuaCabang("");
    setIkutPestaRakyatUmum(true);
    setTipePestaRakyatUmum("gratis");
    setIkutDhfUmum(false);
    setTanggalLahir("");
    setJenisKelamin("Laki-laki");
    setShowThankYouPopup(false);
    setShowAccommodationPopup(false);
    setPopupCountdown(3);
    setHasClickedWa(false);
    setHasConfirmedPayment(false);
    setTurnstileToken(null);
    setIkutHealthTalk(false);
    setBersediaAnggotaPersadia(false);
    setAlamatLengkap("");
    setKelurahan("");
    setKecamatan("");
    setKotaKabupaten("");
    setProvinsi("");
    setAppliedVoucher(null);
    setVoucherInput("");
    setVoucherError("");
    setVoucherSuccess("");
  };

  const isPaidRegistration = Boolean(
    successData && (Number(successData.totalAkhir) > 0 || selectedKategori.akses === "ilmiah")
  );

  const handleSelesai = async () => {
    if (isPaidRegistration) {
      handleClose();
      return;
    }
    setIsDownloading(true);
    const badgeElement = document.getElementById('badge-print-area');
    if (badgeElement) {
      try {
        const imgData = await toJpeg(badgeElement, { 
          quality: 0.95, 
          pixelRatio: 2, 
          backgroundColor: '#ffffff',
          cacheBust: true
        });
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

  const handleDownloadTicketOnly = async () => {
    setIsDownloading(true);
    const badgeElement = document.getElementById('badge-print-area');
    if (badgeElement) {
      try {
        const imgData = await toJpeg(badgeElement, { 
          quality: 0.95, 
          pixelRatio: 2, 
          backgroundColor: '#ffffff',
          cacheBust: true
        });
        const link = document.createElement('a');
        link.download = `E-Ticket-${successData?.id}.jpg`;
        link.href = imgData;
        link.click();
      } catch (error) {
        console.error('Error generating JPG image', error);
      }
    }
    setIsDownloading(false);
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

    {/* Pop-up Iklan Penawaran Akomodasi Khusus Peserta Ilmiah dengan Timer 3 Detik */}
    {showAccommodationPopup && (
      <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
        <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-amber-300 flex flex-col my-auto animate-scaleIn">
          
          {/* Header Banner Pop-up */}
          <div className="bg-gradient-to-r from-[#0B3D5E] via-[#092c42] to-[#00B4AC] text-white p-5 sm:p-6 relative">
            {/* Top Right Countdown / Close Button */}
            <div className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-10">
              {popupCountdown > 0 ? (
                <div className="px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-md text-amber-300 text-[11px] font-bold border border-white/20 flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  <span>Tutup ({popupCountdown}s)</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAccommodationPopup(false)}
                  className="p-1.5 sm:p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition cursor-pointer shadow-md flex items-center justify-center animate-fadeIn"
                  title="Tutup Iklan"
                  aria-label="Tutup Iklan"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              )}
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[#C89A2E] border border-white/20 text-[10px] sm:text-xs font-black uppercase tracking-wider mb-2">
              <Sparkles className="h-3.5 w-3.5 text-[#C89A2E]" />
              Penawaran Spesial Peserta Ilmiah
            </div>

            <h3 className="text-lg sm:text-xl font-black tracking-tight leading-snug">
              Butuh Hotel Dekat Venue Acara?
            </h3>
            <p className="text-xs text-slate-200 mt-1 leading-relaxed">
              Dapatkan tarif kamar khusus di <strong>Novotel Bogor</strong> (Venue Hari 1) &amp; <strong>Ibis Styles</strong> (bersebelahan).
            </p>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-6 space-y-3.5">
            {/* Price Preview Cards */}
            <div className="bg-amber-50/70 rounded-2xl p-3.5 border border-amber-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-amber-200/60">
                <div>
                  <strong className="text-slate-800 block text-xs">Novotel Bogor Golf Resort</strong>
                  <span className="text-[10px] text-slate-500">Venue Sesi Ilmiah (Hari 1)</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-black text-[#0B3D5E] block">Klasik: Rp 1.500.000</span>
                  <span className="text-[11px] font-black text-[#0B3D5E] block">Modern: Rp 1.700.000</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-0.5">
                <div>
                  <strong className="text-slate-800 block text-xs">Ibis Styles Bogor Raya</strong>
                  <span className="text-[10px] text-slate-500">1 Menit Jalan Kaki ke Venue</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-emerald-700 block">Rp 800.000</span>
                  <span className="text-[9px] text-slate-400">/kamar/malam</span>
                </div>
              </div>
            </div>

            {/* Benefits Badges */}
            <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold text-slate-600">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Termasuk Sarapan 2 Orang
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Bebas Macet
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Kuota Terbatas
              </span>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              *Pendaftaran Anda telah tersimpan aman. Kuota kamar hotel khusus panitia bersifat terbatas (first-come, first-served).
            </p>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setShowAccommodationPopup(false);
                  onClose();
                  resetForm();
                  window.location.hash = "#akomodasi";
                }}
                className="w-full py-3 px-4 bg-gradient-to-r from-[#0B3D5E] to-[#00B4AC] hover:opacity-95 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:scale-[1.01]"
              >
                <Building2 className="h-4 w-4 text-[#C89A2E]" />
                Ya, Mau Lihat Foto Kamar &amp; Fasilitas Hotel
              </button>

              <a
                href={`https://wa.me/6285370716686?text=${encodeURIComponent(
                  `Halo Panitia KONAS PERSADIA 2026, saya baru saja mendaftar (No. Reg: ${successData?.id || ""}) atas nama ${namaLengkap} (${selectedKategori.label}). Saya berminat untuk reservasi kamar hotel (Novotel / Ibis Styles) tarif khusus panitia. Mohon informasi ketersediaannya. Terima kasih!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition text-center"
              >
                <MessageCircle className="h-4 w-4" />
                Hubungi Panitia via WA (0853-7071-6686)
              </a>

              {popupCountdown <= 0 && (
                <div className="pt-1 text-center animate-fadeIn">
                  <button
                    type="button"
                    onClick={() => setShowAccommodationPopup(false)}
                    className="text-[11px] text-slate-400 hover:text-slate-600 font-medium underline cursor-pointer transition"
                  >
                    Lewati &amp; Lihat Bukti Pendaftaran Saya
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
    <div
      id="registration-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
    >
      <div
        id="registration-modal-box"
        className="relative bg-white rounded-3xl shadow-2xl shadow-slate-950/40 max-w-xl w-full overflow-hidden border border-slate-100/80 flex flex-col max-h-[86vh] sm:max-h-[88vh] my-auto ring-1 ring-black/5"
      >
        {showThankYouPopup ? (
          <div className="p-6 sm:p-8 text-center space-y-6 flex-1 flex flex-col items-center justify-center bg-white min-h-[360px] sm:min-h-[400px]">
             <div className="p-4 bg-[#2D7A4F]/10 text-[#2D7A4F] rounded-full inline-block">
                <CheckCircle2 className="h-16 w-16" />
             </div>
             <h3 className="text-xl sm:text-2xl font-black text-slate-800">Terima Kasih!</h3>
             <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto">Pendaftaran Anda telah selesai dan gambar E-Ticket (.jpg) berhasil diunduh. Sampai jumpa di acara Konas Persadia 2026!</p>
             
             {(selectedKategori.id === "persadia" || selectedKategori.id === "umum") && (
               <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl mt-4 w-full max-w-sm">
                 <p className="text-xs sm:text-sm text-emerald-800 font-bold mb-3">Informasi Khusus Pesta Rakyat</p>
                 <a 
                   href="https://chat.whatsapp.com/JK6wDcnHh27GhJTx8kUKBY" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   onClick={() => setHasClickedWa(true)}
                   className="block w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 transition text-white rounded-lg font-bold text-xs sm:text-sm"
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
        <div className="bg-[#0B3D5E] text-white px-4 py-3.5 sm:p-6 flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-extrabold text-sm sm:text-lg leading-tight">Formulir Pendaftaran</h3>
            <p className="text-[11px] sm:text-xs text-[#F8FAFC]/90 mt-0.5">
              Kendala registrasi? WA: <strong className="text-[#C89A2E] font-bold tracking-wide">085370716686</strong>
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition text-white cursor-pointer"
            aria-label="Tutup Modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Dynamic Multi-Step Progress Tracker */}
        <div className="bg-slate-50 border-b border-slate-100 px-3 sm:px-6 py-2.5 sm:py-3.5 flex justify-between items-center text-[11px] sm:text-xs text-slate-500 font-bold shrink-0">
          <div className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? "bg-[#0B3D5E] text-white" : "bg-slate-200"}`}>1</span>
            <span className={step === 1 ? "text-slate-800" : ""}>Biodata</span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-300" />
          <div className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? "bg-[#0B3D5E] text-white" : "bg-slate-200"}`}>2</span>
            <span className={step === 2 ? "text-slate-800" : ""}>Pembayaran</span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-300" />
          <div className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? "bg-[#2D7A4F] text-white animate-pulse" : "bg-slate-200"}`}>3</span>
            <span className={step === 3 ? "text-[#2D7A4F]" : ""}>Selesai</span>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div 
          className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4"
        >
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
                  {selectedKategori.id === "perawat" ? (
                    <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#00B4AC]" />
                        Workshop
                      </span>
                      <span className="text-[11px] font-bold bg-[#00B4AC]/10 text-[#00B4AC] px-2.5 py-0.5 rounded-full border border-[#00B4AC]/20">
                        Khusus Perawat
                      </span>
                    </div>
                  ) : (
                    <select
                      value={pilihanKegiatan}
                      onChange={(e) => setPilihanKegiatan(e.target.value as any)}
                      className="w-full px-4 py-3 bg-[#F8FAFC]/40 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B4AC] text-sm text-slate-800 font-medium cursor-pointer"
                    >
                      <option value="Symposium">Symposium Saja</option>
                      <option value="Symposium + Workshop">Symposium + Workshop</option>
                    </select>
                  )}
                </div>
              )}

              {/* Voucher Khusus Dokter Umum (FKTP) */}
              {selectedKategori.id === "dokter_umum" && (
                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-amber-600" />
                      Penatalaksanaan Diabetes Melitus Faskes Tingkat I
                    </label>
                    {appliedVoucher && (
                      <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Voucher Aktif
                      </span>
                    )}
                  </div>

                  {!appliedVoucher ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Masukan Voucher Anda"
                        value={voucherInput}
                        onChange={(e) => {
                          setVoucherInput(e.target.value.toUpperCase());
                          setVoucherError("");
                        }}
                        className="flex-1 px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B4AC] text-xs font-mono font-bold text-slate-800 uppercase tracking-wider"
                      />
                      <button
                        type="button"
                        onClick={handleValidateVoucher}
                        disabled={voucherLoading || !voucherInput.trim()}
                        className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        {voucherLoading ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Memeriksa...
                          </>
                        ) : (
                          "Terapkan"
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-emerald-200 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                          <Tag className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 tracking-wider font-mono">{appliedVoucher}</p>
                          <p className="text-[11px] text-emerald-700 font-semibold">Harga paket khusus FKTP berhasil diterapkan!</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveVoucher}
                        className="text-xs text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer ml-2"
                      >
                        Hapus
                      </button>
                    </div>
                  )}

                  {voucherError && (
                    <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {voucherError}
                    </p>
                  )}
                  {voucherSuccess && !appliedVoucher && (
                    <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> {voucherSuccess}
                    </p>
                  )}
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
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Unit / Cabang PERSADIA <span className="text-rose-600">*</span></label>
                  <input
                    type="text"
                    placeholder="Contoh: PERSADIA Unit Bogor Barat"
                    value={cabangPersadia}
                    onChange={(e) => setCabangPersadia(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B4AC] text-sm"
                  />
                </div>
              )}

              {selectedKategori.fieldTambahan.includes("namaKetuaCabang") && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                    Nama Ketua Cabang PERSADIA <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: dr. H. Ahmad Fauzi, Sp.PD"
                    value={namaKetuaCabang}
                    onChange={(e) => setNamaKetuaCabang(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B4AC] text-sm"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    *Diperlukan sebagai verifikasi keabsahan keanggotaan PERSADIA Anda.
                  </p>
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

              {/* Sesi Diabetes Health Forum untuk Anggota PERSADIA */}
              {selectedKategori.id === "persadia" && (
                <div className="pt-2 border-t border-slate-200 mt-2">
                  <div className="p-4 bg-[#0B3D5E]/5 border border-[#0B3D5E]/20 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-[#0B3D5E]">
                        Diabetes Health Forum bersama 6 Tokoh (Opsional)
                      </h4>
                      <span className="text-[11px] font-bold bg-[#0B3D5E] text-white px-2.5 py-0.5 rounded-full">
                        Biaya: Rp 200.000
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">
                      Sesi diskusi kesehatan eksklusif di Novotel Bogor (Sabtu, 7 November 2026) bersama 6 tokoh suksesor diabetisi.
                    </p>

                    <label className={`flex items-start gap-3 cursor-pointer p-3 border rounded-xl transition-colors ${ikutHealthTalk ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200 hover:bg-slate-50'} ${!isHealthTalkAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <input
                        type="checkbox"
                        checked={ikutHealthTalk}
                        onChange={(e) => setIkutHealthTalk(e.target.checked)}
                        disabled={!isHealthTalkAvailable}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0 disabled:cursor-not-allowed"
                      />
                      <span className="text-xs text-slate-800 font-medium">
                        {!isHealthTalkAvailable ? 'Maaf, Kuota Diabetes Health Forum Sudah Penuh / Ditutup' : (
                          <>Ya, saya ingin mengikuti sesi <strong>Diabetes Health Forum (7 Nov 2026)</strong> (+ Rp 200.000).</>
                        )}
                      </span>
                    </label>

                    <p className="text-[11px] text-slate-500 italic">
                      *Keikutsertaan Pesta Rakyat (8 Nov 2026) di GOR Pakansari tetap <strong>Gratis (Rp 0)</strong> untuk Anggota PERSADIA.
                    </p>
                  </div>
                </div>
              )}

              {/* Pilihan Paket Kegiatan untuk Masyarakat Umum */}
              {selectedKategori.id === "umum" && (
                <div className="pt-2 border-t border-slate-200 mt-2 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Pilih Kegiatan yang Ingin Diikuti <span className="text-rose-600">*</span>
                    </label>
                    <p className="text-xs text-slate-500 mb-3">
                      Anda dapat memilih salah satu atau kedua kegiatan berikut (centang kegiatan yang ingin diikuti):
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Checkbox 1: Pesta Rakyat */}
                    <div
                      className={`p-3.5 rounded-xl border-2 transition ${
                        ikutPestaRakyatUmum
                          ? "border-[#00B4AC] bg-teal-50/40 shadow-sm"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={ikutPestaRakyatUmum}
                          onChange={(e) => setIkutPestaRakyatUmum(e.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-[#00B4AC] focus:ring-[#00B4AC] cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <h5 className="font-bold text-xs sm:text-sm text-slate-900">
                              Pesta Rakyat (Minggu, 8 Nov 2026)
                            </h5>
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${tipePestaRakyatUmum === "gratis" ? "text-[#2D7A4F] bg-[#E6F4EA]" : "text-slate-800 bg-amber-100"}`}>
                              {tipePestaRakyatUmum === "gratis" ? "Gratis (Rp 0)" : "Rp 100.000"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Akses ke GOR Pakansari Cibinong: panggung hiburan, senam massal, cek gula darah &amp; kesehatan gratis, festival UMKM.
                          </p>
                        </div>
                      </label>

                      {/* Sub-pilihan Paket Pesta Rakyat untuk Umum jika dicentang */}
                      {ikutPestaRakyatUmum && (
                        <div className="mt-3 pt-3 border-t border-teal-200/60 pl-2 sm:pl-7 space-y-2.5">
                          <span className="block text-[11px] font-bold text-slate-700">
                            Pilihan Paket Pesta Rakyat:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {/* Option 1: Gratis */}
                            <label
                              className={`p-2.5 rounded-xl border-2 cursor-pointer flex items-start gap-2.5 transition text-xs ${
                                tipePestaRakyatUmum === "gratis"
                                  ? "bg-white border-[#2D7A4F] shadow-sm"
                                  : "bg-slate-50/70 border-slate-200 text-slate-600 hover:border-slate-300"
                              }`}
                            >
                              <input
                                type="radio"
                                name="tipePestaRakyat"
                                checked={tipePestaRakyatUmum === "gratis"}
                                onChange={() => setTipePestaRakyatUmum("gratis")}
                                className="mt-0.5 text-[#2D7A4F] focus:ring-[#2D7A4F] cursor-pointer"
                              />
                              <div>
                                <span className="block font-bold text-[#2D7A4F]">Akses Gratis (Rp 0)</span>
                                <span className="text-[10px] text-slate-500 block mt-0.5">Senam massal, skrining gula darah gratis, &amp; hiburan panggung</span>
                              </div>
                            </label>

                            {/* Option 2: Berbayar + Kaos */}
                            <label
                              className={`p-2.5 rounded-xl border-2 cursor-pointer flex items-start gap-2.5 transition text-xs ${
                                tipePestaRakyatUmum === "berbayar"
                                  ? "bg-white border-amber-600 shadow-sm"
                                  : "bg-slate-50/70 border-slate-200 text-slate-600 hover:border-slate-300"
                              }`}
                            >
                              <input
                                type="radio"
                                name="tipePestaRakyat"
                                checked={tipePestaRakyatUmum === "berbayar"}
                                onChange={() => setTipePestaRakyatUmum("berbayar")}
                                className="mt-0.5 text-amber-600 focus:ring-amber-500 cursor-pointer"
                              />
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-amber-900">Paket Kaos (+ Rp 100.000)</span>
                                  <span className="text-[9px] bg-amber-500 text-white font-extrabold px-1.5 py-0.2 rounded">Kaos Eksklusif</span>
                                </div>
                                <span className="text-[10px] text-slate-500 block mt-0.5">Semua fasilitas gratis + Kaos Resmi KONAS, goodie bag &amp; snack</span>
                              </div>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Checkbox 2: Diabetes Health Forum */}
                    <label
                      className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex items-start gap-3 ${
                        !isHealthTalkAvailable
                          ? "opacity-50 cursor-not-allowed border-slate-200 bg-slate-50"
                          : ikutDhfUmum
                          ? "border-blue-500 bg-blue-50/50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={ikutDhfUmum}
                        onChange={(e) => {
                          if (!isHealthTalkAvailable) return;
                          setIkutDhfUmum(e.target.checked);
                        }}
                        disabled={!isHealthTalkAvailable}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <h5 className="font-bold text-xs sm:text-sm text-slate-900">
                            Diabetes Health Forum (Sabtu, 7 Nov 2026)
                          </h5>
                          <span className="text-xs font-black text-blue-900 bg-blue-100 px-2.5 py-0.5 rounded-md">
                            Rp 200.000
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {!isHealthTalkAvailable
                            ? "Maaf, kuota Diabetes Health Forum sudah penuh / ditutup."
                            : "Akses ke Novotel Bogor: diskusi interaktif eksklusif bersama dr. Boyke & 6 tokoh suksesor diabetisi."}
                        </p>
                      </div>
                    </label>
                  </div>

                  {ikutPestaRakyatUmum && ikutDhfUmum && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
                      <span className="font-medium">Total biaya 2 kegiatan (7 &amp; 8 Nov):</span>
                      <strong className="font-black text-emerald-900">
                        {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(
                          (tipePestaRakyatUmum === "berbayar" ? 100000 : 0) + 200000
                        )}
                      </strong>
                    </div>
                  )}
                </div>
              )}

              {selectedKategori.id !== "persadia" && (
                <div className="pt-2 border-t border-slate-200 mt-2">
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                    <label htmlFor="bersedia-persadia-checkbox" className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        id="bersedia-persadia-checkbox"
                        checked={bersediaAnggotaPersadia}
                        onChange={(e) => setBersediaAnggotaPersadia(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-emerald-300 text-[#2D7A4F] focus:ring-[#2D7A4F] cursor-pointer shrink-0"
                      />
                      <span className="text-xs text-slate-800 font-medium leading-relaxed">
                        <strong className="text-[#2D7A4F]">Bersedia Mendaftar sebagai Anggota PERSADIA</strong>
                        <span className="block text-slate-600 text-[11px] mt-0.5">
                          🎁 Dapatkan <strong>merchandise menarik</strong> saat acara berlangsung khusus bagi pendaftar yang bersedia menjadi anggota PERSADIA.
                          {selectedKategori.id === "umum" && (
                            <em className="block text-slate-500 not-italic mt-0.5">*(Jika tidak bersedia, Anda tetap diperbolehkan masuk dan mengikuti Pesta Rakyat).*</em>
                          )}
                        </span>
                      </span>
                    </label>

                    {bersediaAnggotaPersadia && (
                      <div className="pt-3 border-t border-emerald-200/80 space-y-3">
                        <p className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                          📍 Detail Alamat Keanggotaan PERSADIA:
                        </p>
                        
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                            Alamat Lengkap (Jl / RT / RW / No) <span className="text-rose-600">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Contoh: Jl. Pajajaran No. 45, RT 02/RW 05"
                            value={alamatLengkap}
                            onChange={(e) => setAlamatLengkap(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B4AC] text-xs text-slate-800"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                              Kelurahan / Desa <span className="text-rose-600">*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="Nama Kelurahan / Desa"
                              value={kelurahan}
                              onChange={(e) => setKelurahan(e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B4AC] text-xs text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                              Kecamatan <span className="text-rose-600">*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="Nama Kecamatan"
                              value={kecamatan}
                              onChange={(e) => setKecamatan(e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B4AC] text-xs text-slate-800"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                              Kota / Kabupaten <span className="text-rose-600">*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="Contoh: Kabupaten Bogor"
                              value={kotaKabupaten}
                              onChange={(e) => setKotaKabupaten(e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B4AC] text-xs text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                              Provinsi <span className="text-rose-600">*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="Contoh: Jawa Barat"
                              value={provinsi}
                              onChange={(e) => setProvinsi(e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B4AC] text-xs text-slate-800"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Cloudflare Turnstile Widget */}
              <div className="flex flex-col items-center justify-center bg-slate-50 p-3 rounded-2xl border border-slate-200 mt-4">
                <Turnstile
                  siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"}
                  onSuccess={(token) => {
                    setTurnstileToken(token);
                    setError("");
                  }}
                  onExpire={() => setTurnstileToken(null)}
                  onError={() => setTurnstileToken(null)}
                />
              </div>

            </div>
          )}

          {/* STEP 2: PAYMENT & UNIQUE CODE */}
          {step === 2 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-[#0B3D5E]/5 rounded-2xl p-4 border border-[#0B3D5E]/10">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black uppercase text-[#0B3D5E] tracking-wider">Kategori Dipilih</span>
                    <h4 className="font-extrabold text-slate-800 text-sm leading-tight mt-0.5">{selectedKategori.label}</h4>
                    {selectedKategori.akses === "ilmiah" && (
                      <span className="inline-block mt-1 text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md mr-1">
                        Kegiatan: {selectedKategori.id === "perawat" ? "Workshop" : pilihanKegiatan}
                      </span>
                    )}
                    {selectedKategori.id === "persadia" && (
                      <span className="inline-block mt-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md mr-1">
                        Kegiatan: {ikutHealthTalk ? "Pesta Rakyat + Diabetes Health Forum" : "Pesta Rakyat"}
                      </span>
                    )}
                    {selectedKategori.id === "umum" && (
                      <span className="inline-block mt-1 text-[11px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md mr-1">
                        Kegiatan: {
                          ikutPestaRakyatUmum && ikutDhfUmum 
                            ? `Pesta Rakyat (${tipePestaRakyatUmum === "berbayar" ? "Paket Kaos" : "Gratis"}) + DHF` 
                            : ikutPestaRakyatUmum 
                            ? `Pesta Rakyat (${tipePestaRakyatUmum === "berbayar" ? "Paket Kaos" : "Gratis"})` 
                            : "Diabetes Health Forum"
                        }
                      </span>
                    )}
                  </div>
                  {appliedVoucher && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md font-mono">
                      <Tag className="h-3 w-3 text-amber-700" /> {appliedVoucher}
                    </span>
                  )}
                </div>
              </div>

              {/* Payment Details Container */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/60 space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-500 font-bold uppercase">
                  <span>Biaya Registrasi {appliedVoucher && selectedKategori.id === "dokter_umum" ? "(Tarif Khusus FKTP)" : ""}</span>
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
              </div>

              <div className="pt-2 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer p-4 bg-blue-50/50 hover:bg-blue-50 border border-blue-200 rounded-xl transition-colors">
                  <input
                    type="checkbox"
                    checked={hasConfirmedPayment}
                    onChange={(e) => setHasConfirmedPayment(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-blue-300 text-[#0B3D5E] focus:ring-[#0B3D5E] cursor-pointer shrink-0"
                  />
                  <span className="text-xs text-slate-700 leading-relaxed font-medium">
                    Saya <strong>telah melakukan pembayaran</strong> ke rekening di atas sejumlah nominal tagihan.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS CONFIRMATION */}
          {step === 3 && successData && (
            <div className="text-center py-6 space-y-5 animate-scaleIn">
              {isPaidRegistration ? (
                /* Peserta Berbayar: Menunggu Verifikasi Pembayaran oleh Admin */
                <>
                  <div className="p-3.5 bg-amber-100 text-amber-600 rounded-full inline-block mx-auto">
                    <Clock className="h-10 w-10 sm:h-12 sm:w-12 animate-pulse" />
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-xl font-black text-slate-800">Pendaftaran Berhasil Dikirim!</h4>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 text-xs font-bold rounded-full border border-amber-200">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      Status: Menunggu Verifikasi Admin
                    </div>
                    <p className="text-xs text-slate-500 pt-1 max-w-sm mx-auto leading-relaxed">
                      Formulir dan konfirmasi pembayaran Anda telah tercatat. Tim admin/bendahara kami akan segera memverifikasi mutasi transfer Anda.
                    </p>
                  </div>

                  {/* Registration Code Display Box (Tanpa QR Code) */}
                  <div className="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-slate-200/70 inline-block w-full max-w-sm mx-auto">
                    <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider mb-1">
                      Nomor Registrasi Anda
                    </span>
                    <div className="flex items-center justify-center gap-2 my-2">
                      <strong className="text-xl sm:text-2xl font-mono font-black text-[#0B3D5E] tracking-widest">
                        {successData.id}
                      </strong>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(successData.id)}
                        className="p-1.5 hover:bg-slate-200 text-slate-500 rounded-lg transition"
                        title="Salin No. Registrasi"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Simpan nomor registrasi ini sebagai bukti pendaftaran & referensi konfirmasi.
                    </p>
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
                    {ikutHealthTalk && (
                      <div className="flex justify-between text-blue-900 bg-blue-50 px-2 py-1 rounded-md border border-blue-200">
                        <span>Sesi Tambahan:</span>
                        <strong className="font-semibold">Diabetes Health Forum</strong>
                      </div>
                    )}
                    {appliedVoucher && (
                      <div className="flex justify-between text-amber-900 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                        <span className="font-bold">{selectedKategori.id === "dokter_umum" ? "Voucher FKTP:" : "Kode Voucher:"}</span>
                        <strong className="font-mono">{appliedVoucher}</strong>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Akses Kegiatan:</span>
                      <strong className="text-slate-800 uppercase">
                        {selectedKategori.akses === "ilmiah"
                          ? (selectedKategori.id === "perawat" ? "Workshop (Novotel)" : "Sesi Ilmiah (Novotel)")
                          : selectedKategori.id === "persadia"
                            ? (ikutHealthTalk ? "Pesta Rakyat (GOR) + DHF (Novotel)" : "Pesta Rakyat (GOR Pakansari)")
                            : (ikutPestaRakyatUmum && ikutDhfUmum 
                                ? `Pesta Rakyat (${tipePestaRakyatUmum === "berbayar" ? "Paket Kaos" : "Gratis"}) + DHF (Novotel)` 
                                : ikutPestaRakyatUmum 
                                ? `Pesta Rakyat (${tipePestaRakyatUmum === "berbayar" ? "Paket Kaos" : "Gratis"})` 
                                : "Diabetes Health Forum (Novotel)")
                        }
                      </strong>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200 mt-1">
                      <span>Total Tagihan:</span>
                      <strong className="text-[#0B3D5E]">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(successData.totalAkhir)}</strong>
                    </div>
                    <div className="flex justify-between pt-1 text-amber-700">
                      <span>Status Pembayaran:</span>
                      <strong className="font-bold">Menunggu Verifikasi</strong>
                    </div>
                  </div>

                  {/* Petunjuk Verifikasi & Kontak Panitia */}
                  <div className="bg-blue-50/80 border border-blue-100 p-4 rounded-xl text-left max-w-sm mx-auto space-y-2 text-xs text-slate-700">
                    <div className="flex items-start gap-2 text-blue-900 font-bold">
                      <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
                      <span>Alur Penerbitan E-Tiket:</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-600">
                      E-Tiket resmi dengan QR Code Check-in akan diterbitkan setelah pembayaran Anda diverifikasi oleh bendahara panitia. E-Tiket akan dikirimkan langsung ke nomor WhatsApp Anda (<strong>{whatsapp}</strong>).
                    </p>
                    <div className="pt-2 border-t border-blue-100/60">
                      <a
                        href={`https://wa.me/6285370716686?text=${encodeURIComponent(
                          `Halo Panitia KONAS PERSADIA 2026, saya telah mendaftar dengan No. Registrasi: ${successData.id} atas nama: ${namaLengkap} (${selectedKategori.label}) sejumlah ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(successData.totalAkhir)}. Mohon bantuan verifikasi pembayarannya. Terima kasih.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Konfirmasi Bukti Transfer via WhatsApp
                      </a>

                      <a
                        href="/rundown-konas-persadia-2026.pdf"
                        download="Rundown-Acara-KONAS-PERSADIA-2026.pdf"
                        className="w-full py-2.5 px-3 bg-gradient-to-r from-[#0B3D5E] to-[#00B4AC] hover:opacity-95 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                      >
                        <Download className="h-4 w-4 text-amber-300" />
                        Download Rundown Acara (.pdf)
                      </a>
                    </div>
                  </div>

                  {/* Penawaran Khusus Akomodasi Hotel untuk Peserta Ilmiah Berbayar */}
                  {selectedKategori.akses === "ilmiah" && (
                    <div className="bg-gradient-to-br from-amber-50/90 via-amber-100/40 to-white border-2 border-amber-300/80 p-4 sm:p-5 rounded-2xl text-left max-w-sm mx-auto space-y-3 shadow-sm animate-fadeIn">
                      <div className="flex items-start gap-2.5">
                        <div className="p-2 bg-amber-500/10 text-amber-800 rounded-xl shrink-0 mt-0.5">
                          <Building2 className="h-5 w-5 text-amber-700" />
                        </div>
                        <div>
                          <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-md mb-1">
                            <Sparkles className="h-3 w-3" /> Penawaran Khusus Peserta
                          </div>
                          <h5 className="font-extrabold text-slate-900 text-sm leading-snug">
                            Butuh Kamar Hotel Dekat Venue Acara?
                          </h5>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Panitia bekerjasama menyediakan kuota kamar bertarif khusus di <strong>Novotel Bogor</strong> (Venue Hari 1) &amp; <strong>Ibis Styles Bogor Raya</strong> (tepat di samping venue):
                      </p>

                      <div className="bg-white/90 rounded-xl p-2.5 border border-amber-200/60 space-y-1.5 text-[11px]">
                        <div className="flex justify-between items-center text-slate-700">
                          <span>🏨 Novotel Klasik:</span>
                          <strong className="text-[#0B3D5E]">Rp 1.500.000 <span className="font-normal text-[10px] text-slate-400">/mlm</span></strong>
                        </div>
                        <div className="flex justify-between items-center text-slate-700">
                          <span>🏨 Novotel Modern:</span>
                          <strong className="text-[#0B3D5E]">Rp 1.700.000 <span className="font-normal text-[10px] text-slate-400">/mlm</span></strong>
                        </div>
                        <div className="flex justify-between items-center text-slate-700 pt-1 border-t border-slate-100">
                          <span>🏨 Ibis Styles:</span>
                          <strong className="text-emerald-700">Rp 800.000 <span className="font-normal text-[10px] text-slate-400">/mlm</span></strong>
                        </div>
                      </div>

                      <div className="pt-1 flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            resetForm();
                            window.location.hash = "#akomodasi";
                          }}
                          className="w-full py-2.5 px-3 bg-[#0B3D5E] hover:bg-[#00B4AC] text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                        >
                          <Building2 className="h-4 w-4" />
                          Ya, Mau Lihat Foto Kamar &amp; Fasilitas
                        </button>
                        <a
                          href={`https://wa.me/6285370716686?text=${encodeURIComponent(
                            `Halo Panitia KONAS PERSADIA 2026, saya telah mendaftar dengan No. Registrasi: ${successData.id} atas nama: ${namaLengkap} (${selectedKategori.label}). Saya berminat untuk reservasi kamar hotel (Novotel / Ibis Styles) tarif khusus panitia. Mohon informasi ketersediaannya. Terima kasih.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-200 transition text-center"
                        >
                          <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                          Tanya Booking via WA (0853-7071-6686)
                        </a>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Peserta Gratis (Rp 0 - Pesta Rakyat): E-Tiket Langsung Diterbitkan */
                <>
                  <div className="p-3 bg-[#2D7A4F] text-white rounded-full inline-block mx-auto">
                    <CheckCircle2 className="h-12 w-12" />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xl font-black text-slate-800">Registrasi Berhasil Terkirim!</h4>
                    <p className="text-xs text-slate-500">Formulir pendaftaran Anda telah tercatat di database kami.</p>
                  </div>

                  {/* Registration Code Display Box With QR Code */}
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
                      <strong className="text-slate-800 uppercase">
                        {selectedKategori.id === "umum" 
                          ? "Pesta Rakyat — Akses Gratis (GOR Pakansari)" 
                          : "Pesta Rakyat (GOR Pakansari)"}
                      </strong>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200 mt-1">
                      <span>Total:</span>
                      <strong className="text-[#2D7A4F]">Gratis</strong>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed px-4">
                    Silakan unduh E-Tiket Anda untuk ditunjukkan saat check-in di lokasi acara.
                  </p>

                  <div className="pt-2 flex flex-col sm:flex-row gap-2 max-w-sm mx-auto w-full">
                    <button
                      type="button"
                      onClick={handleDownloadTicketOnly}
                      disabled={isDownloading}
                      className="flex-1 py-2.5 px-3 bg-[#0B3D5E] hover:bg-[#1e40af] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer disabled:bg-slate-400"
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Mengunduh E-Ticket...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Download E-Tiket (.jpg)
                        </>
                      )}
                    </button>
                    <a
                      href="/rundown-konas-persadia-2026.pdf"
                      download="Rundown-Acara-KONAS-PERSADIA-2026.pdf"
                      className="flex-1 py-2.5 px-3 bg-gradient-to-r from-teal-600 to-[#00B4AC] hover:opacity-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                    >
                      <Download className="h-4 w-4" />
                      Download Rundown (.pdf)
                    </a>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-3.5 sm:p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0">
          {step === 1 && (
            <>
              <span className="text-[11px] sm:text-xs text-slate-400 font-bold leading-tight">{hargaDasar === 0 ? "Pendaftaran Gratis" : "Masa Early Bird Terbuka"}</span>
              <button
                id="btn-step1-next"
                onClick={handleNextStep1}
                disabled={isSubmitting}
                className={`px-4 sm:px-6 py-2.5 sm:py-3 ${hargaDasar === 0 ? 'bg-[#2D7A4F] hover:bg-[#1e603f]' : 'bg-[#0B3D5E] hover:bg-[#1e40af]'} disabled:bg-slate-300 text-white font-extrabold text-xs sm:text-sm rounded-full shadow transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    {hargaDasar === 0 ? "Kirim Pendaftaran" : "Lanjut ke Pembayaran"}
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
                className="px-2.5 sm:px-4 py-2 sm:py-3 text-[#0B3D5E] hover:text-[#1e40af] font-bold text-xs sm:text-sm flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                Kembali
              </button>
              <button
                id="btn-step2-next"
                onClick={handleSubmitRegistration}
                disabled={isSubmitting || !hasConfirmedPayment}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-[#0B3D5E] hover:bg-[#1e40af] disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-extrabold text-xs sm:text-sm rounded-full shadow flex items-center gap-1.5 transition-all duration-200 whitespace-nowrap"
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
              className="w-full py-3 sm:py-3.5 bg-[#0B3D5E] hover:bg-[#1e40af] text-white font-extrabold text-xs sm:text-sm rounded-xl text-center shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Selesai
            </button>
          )}
        </div>
        </>
        )}
      </div>
    </div>

    {/* Hidden Paperless E-Ticket Print/Image Area (Hanya untuk peserta gratis yang diterbitkan langsung) */}
      {successData && !isPaidRegistration && (
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
              style={{ backgroundColor: selectedKategori?.id === 'dokter_spesialis' ? '#0284c7' : selectedKategori?.id === 'dokter_umum' ? '#0d9488' : selectedKategori?.id === 'residen' ? '#4f46e5' : selectedKategori?.id === 'perawat' ? '#0891b2' : selectedKategori?.id === 'mahasiswa' ? '#059669' : selectedKategori?.id === 'persadia' ? '#ea580c' : '#0B3D5E' }}
            >
              <div className="flex justify-between items-center">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1 shadow-sm">
                     <img src={EVENT_INFO.eventLogoUrl} crossOrigin="anonymous" className="w-full h-full object-contain" alt="Logo" />
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
                    borderColor: selectedKategori?.id === 'dokter_spesialis' ? '#0284c7' : selectedKategori?.id === 'dokter_umum' ? '#0d9488' : selectedKategori?.id === 'residen' ? '#4f46e5' : selectedKategori?.id === 'perawat' ? '#0891b2' : selectedKategori?.id === 'mahasiswa' ? '#059669' : selectedKategori?.id === 'persadia' ? '#ea580c' : '#0B3D5E',
                    color: selectedKategori?.id === 'dokter_spesialis' ? '#0284c7' : selectedKategori?.id === 'dokter_umum' ? '#0d9488' : selectedKategori?.id === 'residen' ? '#4f46e5' : selectedKategori?.id === 'perawat' ? '#0891b2' : selectedKategori?.id === 'mahasiswa' ? '#059669' : selectedKategori?.id === 'persadia' ? '#ea580c' : '#0B3D5E',
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
