import { useState, useEffect, type ReactNode } from "react";
import { ArrowLeft, ChevronRight, Copy, Download, Loader2, CheckCircle2, Clock, AlertCircle, X, MessageCircle } from "lucide-react";
import {
  KATEGORI_PESERTA, EVENT_INFO, REKENING_PEMBAYARAN,
  VOUCHER_DOKTER_UMUM_CONFIG, DIABETES_HEALTH_FORUM_CONFIG, KONTAK_PANITIA
} from "../config";
import { QRCodeSVG } from "qrcode.react";
import { toJpeg } from "html-to-image";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { Turnstile } from "@marsidev/react-turnstile";

interface RegistrationPageProps {
  onNavigateHome: () => void;
}

const rupiah = (n: number) =>
  n === 0 ? "Gratis" : new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const inputCls =
  "w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B3D5E] focus:border-[#0B3D5E]";

function Field({ label, children, required, optional }: { label: string; children: ReactNode; required?: boolean; optional?: boolean }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {required && <span className="text-rose-500 font-bold ml-1" title="Wajib diisi">*</span>}
        {optional && <span className="text-xs text-slate-400 font-normal ml-1.5">(opsional)</span>}
      </span>
      {children}
    </label>
  );
}

function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer text-sm text-slate-700">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#0B3D5E]" />
      <span>{children}</span>
    </label>
  );
}

export default function RegistrationPage({ onNavigateHome }: RegistrationPageProps) {
  // 0 = pilih kategori ("Mendaftar sebagai apa?"), 1 = data diri, 2 = pembayaran, 3 = selesai
  const [step, setStep] = useState<number>(0);
  const [kategoriId, setKategoriId] = useState<string>(KATEGORI_PESERTA[0].id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<{ id: string; totalAkhir: number } | null>(null);
  const [hasConfirmedPayment, setHasConfirmedPayment] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // Status kategori yang ditutup oleh panitia dari app_settings
  const [closedCategories, setClosedCategories] = useState<string[]>([]);
  const [closedModalCategory, setClosedModalCategory] = useState<typeof KATEGORI_PESERTA[number] | null>(null);

  const [pilihanKegiatan, setPilihanKegiatan] = useState<"Symposium" | "Symposium + Workshop" | "Workshop">("Symposium + Workshop");
  const [namaLengkap, setNamaLengkap] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [institusi, setInstitusi] = useState("");
  const [nim, setNim] = useState("");
  const [cabangPersadia, setCabangPersadia] = useState("");
  const [namaKetuaCabang, setNamaKetuaCabang] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState("Laki-laki");

  const [ikutHealthTalk, setIkutHealthTalk] = useState(false);
  const [ikutPestaRakyatUmum, setIkutPestaRakyatUmum] = useState(true);
  const [tipePestaRakyatUmum, setTipePestaRakyatUmum] = useState<"gratis" | "berbayar">("gratis");
  const [ikutDhfUmum, setIkutDhfUmum] = useState(false);

  const [bersediaAnggotaPersadia, setBersediaAnggotaPersadia] = useState(false);
  const [alamatLengkap, setAlamatLengkap] = useState("");
  const [kelurahan, setKelurahan] = useState("");
  const [kecamatan, setKecamatan] = useState("");
  const [kotaKabupaten, setKotaKabupaten] = useState("");
  const [provinsi, setProvinsi] = useState("");

  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<string | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState("");

  const [hargaDasar, setHargaDasar] = useState(0);
  const [kodeUnik, setKodeUnik] = useState(0);
  const [totalAkhir, setTotalAkhir] = useState(0);
  const [registrationId, setRegistrationId] = useState("");

  const kat = KATEGORI_PESERTA.find((k) => k.id === kategoriId) || KATEGORI_PESERTA[0];

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  // Ambil pengaturan kategori yang ditutup dari Supabase app_settings
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const fetchClosedCategories = async () => {
      try {
        const { data } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "closed_categories")
          .maybeSingle();
        if (data && data.value) {
          const parsed = JSON.parse(data.value);
          if (Array.isArray(parsed)) {
            setClosedCategories(parsed);
          }
        }
      } catch (e) {
        console.warn("Gagal memuat status kategori tertutup:", e);
      }
    };

    fetchClosedCategories();

    // Dengarkan perubahan realtime bila status diubah dari admin dashboard
    const channel = supabase
      .channel("app_settings_closed_categories_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_settings", filter: "key=eq.closed_categories" },
        (payload: any) => {
          if (payload.new && payload.new.value) {
            try {
              const parsed = JSON.parse(payload.new.value);
              if (Array.isArray(parsed)) {
                setClosedCategories(parsed);
              }
            } catch (err) {
              console.error(err);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Pantau perubahan hash URL (misal browser back dari form ke kategori)
  useEffect(() => {
    const handleHashSync = () => {
      const hash = window.location.hash;
      if (hash === "#pendaftaran" || hash === "#register" || hash === "" || !hash.includes("?kategori=")) {
        setStep(0);
      }
    };
    window.addEventListener("hashchange", handleHashSync);
    return () => window.removeEventListener("hashchange", handleHashSync);
  }, []);

  // Reset pilihan ketika kategori berganti
  useEffect(() => {
    setAppliedVoucher(null);
    setVoucherInput("");
    setVoucherError("");
    setIkutHealthTalk(false);
    setIkutPestaRakyatUmum(true);
    setTipePestaRakyatUmum("gratis");
    setIkutDhfUmum(false);
    setNamaKetuaCabang("");
    setPilihanKegiatan(kategoriId === "perawat" ? "Workshop" : "Symposium + Workshop");
  }, [kategoriId]);

  const isEarlyBird = () => Date.now() <= new Date(`${EVENT_INFO.batasEarlyBird}T23:59:59+07:00`).getTime();

  useEffect(() => {
    const eb = isEarlyBird();
    let price = 0;
    if (kat.akses === "ilmiah") {
      if (kat.id === "perawat") {
        const h = kat.hargaWorkshop || kat.hargaSymposiumWorkshop;
        if (h) price = eb ? h.earlyBird : h.onsite;
      } else if (kat.id === "dokter_umum" && appliedVoucher) {
        price = pilihanKegiatan === "Symposium" ? VOUCHER_DOKTER_UMUM_CONFIG.hargaSymposium : VOUCHER_DOKTER_UMUM_CONFIG.hargaSymposiumWorkshop;
      } else {
        const h = pilihanKegiatan === "Symposium" ? kat.hargaSymposium : kat.hargaSymposiumWorkshop;
        if (h) price = eb ? h.earlyBird : h.onsite;
      }
    } else if (kat.id === "persadia") {
      price = ikutHealthTalk ? DIABETES_HEALTH_FORUM_CONFIG.biaya : 0;
    } else if (kat.id === "umum") {
      price = (ikutPestaRakyatUmum && tipePestaRakyatUmum === "berbayar" ? 100000 : 0) + (ikutDhfUmum ? 200000 : 0);
    }
    setHargaDasar(price);
  }, [kat, pilihanKegiatan, ikutHealthTalk, ikutPestaRakyatUmum, tipePestaRakyatUmum, ikutDhfUmum, appliedVoucher]);

  const pilihKategori = (id: string) => {
    if (closedCategories.includes(id)) {
      const selectedCat = KATEGORI_PESERTA.find((k) => k.id === id);
      if (selectedCat) {
        setClosedModalCategory(selectedCat);
      }
      return;
    }
    setKategoriId(id);
    setStep(1);
    setError("");
    window.location.hash = `#pendaftaran?kategori=${id}`;
  };

  const gantiKategori = () => {
    setStep(0);
    setError("");
    window.location.hash = "#pendaftaran";
  };

  const validateVoucher = async () => {
    const code = voucherInput.trim().toUpperCase();
    setVoucherError("");
    if (!code) return setVoucherError("Masukkan kode voucher.");
    if (!code.startsWith(VOUCHER_DOKTER_UMUM_CONFIG.prefix)) {
      return setVoucherError(`Kode voucher harus diawali '${VOUCHER_DOKTER_UMUM_CONFIG.prefix}'.`);
    }
    setVoucherLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { data, error: rpcErr } = await supabase.rpc("validate_voucher", { p_code: code, p_kategori: kat.id });
        if (rpcErr) throw rpcErr;
        if (data && data.valid) setAppliedVoucher(data.code);
        else setVoucherError(data?.message || "Kode voucher tidak valid atau sudah digunakan.");
      } else {
        setAppliedVoucher(code);
      }
    } catch (err: any) {
      setVoucherError("Gagal memeriksa voucher: " + (err.message || "koneksi bermasalah"));
    } finally {
      setVoucherLoading(false);
    }
  };

  const newRegId = () => `KNS2026-${Date.now().toString().slice(-4)}${Math.floor(1000 + Math.random() * 9000)}`;

  const lanjutDariDataDiri = () => {
    if (closedCategories.includes(kat.id)) {
      return setError(`Mohon maaf, pendaftaran untuk kategori "${kat.label}" saat ini telah ditutup karena kuota kapasitas telah terpenuhi.`);
    }
    if (!namaLengkap.trim()) return setError("Nama lengkap wajib diisi.");
    if (email.trim() && !email.includes("@")) return setError("Format email tidak valid.");
    if (!whatsapp.trim() || whatsapp.length < 9) return setError("Nomor WhatsApp yang valid wajib diisi.");
    const f = kat.fieldTambahan;
    if (f.includes("institusi") && !institusi.trim()) return setError("Institusi wajib diisi.");
    if (f.includes("nim") && !nim.trim()) return setError("NIM wajib diisi.");
    if (f.includes("cabangPersadia") && !cabangPersadia.trim()) return setError("Cabang PERSADIA wajib diisi.");
    if (f.includes("namaKetuaCabang") && !namaKetuaCabang.trim()) return setError("Nama Ketua Cabang wajib diisi.");
    if (f.includes("tanggalLahir") && !tanggalLahir.trim()) return setError("Tanggal lahir wajib diisi.");
    if (kat.id !== "persadia" && bersediaAnggotaPersadia) {
      if (!alamatLengkap.trim() || !kelurahan.trim() || !kecamatan.trim() || !kotaKabupaten.trim() || !provinsi.trim()) {
        return setError("Lengkapi alamat jika bersedia menjadi anggota PERSADIA.");
      }
    }
    if (kat.id === "umum" && !ikutPestaRakyatUmum && !ikutDhfUmum) {
      return setError("Pilih minimal satu kegiatan.");
    }
    if (!turnstileToken) return setError("Selesaikan verifikasi keamanan terlebih dahulu.");

    setError("");
    const id = registrationId || newRegId();
    setRegistrationId(id);

    if (hargaDasar === 0) {
      setKodeUnik(0);
      setTotalAkhir(0);
      kirim(id, 0);
    } else {
      const code = Math.floor(100 + Math.random() * 900);
      setKodeUnik(code);
      setTotalAkhir(hargaDasar + code);
      setStep(2);
    }
  };

  const kirim = async (idArg?: string, totalArg?: number) => {
    if (closedCategories.includes(kat.id)) {
      setError(`Mohon maaf, pendaftaran untuk kategori "${kat.label}" saat ini telah ditutup.`);
      return;
    }
    setIsSubmitting(true);
    setError("");
    const total = totalArg ?? totalAkhir;
    const id = idArg || registrationId || newRegId();
    try {
      let kegiatan = "-";
      if (kat.akses === "ilmiah") {
        kegiatan = kat.id === "perawat" ? "Workshop" : pilihanKegiatan;
      } else if (kat.id === "persadia") {
        kegiatan = ikutHealthTalk ? "Pesta Rakyat + Diabetes Health Forum" : "Pesta Rakyat";
      } else if (kat.id === "umum") {
        const pesta = tipePestaRakyatUmum === "berbayar" ? "Pesta Rakyat (Paket Kaos)" : "Pesta Rakyat (Gratis)";
        if (ikutPestaRakyatUmum && ikutDhfUmum) kegiatan = `${pesta} + Diabetes Health Forum`;
        else if (ikutPestaRakyatUmum) kegiatan = pesta;
        else if (ikutDhfUmum) kegiatan = "Diabetes Health Forum";
      }
      const anggota = kat.id !== "persadia" && bersediaAnggotaPersadia;
      const f = kat.fieldTambahan;

      const payload = {
        timestamp: new Date().toISOString(),
        no_registrasi: id,
        status_pembayaran: total === 0 ? "Lunas" : "Menunggu Verifikasi",
        nama_lengkap: namaLengkap,
        email: email.trim() || "-",
        whatsapp,
        kategori_peserta: kat.label,
        pilihan_kegiatan: kegiatan,
        total_tagihan: total,
        ikut_health_talk: (kat.id === "persadia" && ikutHealthTalk) || (kat.id === "umum" && ikutDhfUmum),
        bersedia_anggota_persadia: anggota,
        alamat_lengkap: anggota ? alamatLengkap : "-",
        kelurahan: anggota ? kelurahan : "-",
        kecamatan: anggota ? kecamatan : "-",
        kota_kabupaten: anggota ? kotaKabupaten : "-",
        provinsi: anggota ? provinsi : "-",
        institusi: f.includes("institusi") ? institusi : "-",
        nim: f.includes("nim") ? nim : "-",
        cabang_persadia: f.includes("cabangPersadia") ? cabangPersadia.trim() : "-",
        nama_ketua_cabang: f.includes("namaKetuaCabang") ? namaKetuaCabang.trim() : "-",
        tanggal_lahir: f.includes("tanggalLahir") ? tanggalLahir : "-",
        jenis_kelamin: f.includes("jenisKelamin") ? jenisKelamin : "-",
        kode_voucher: appliedVoucher || "-",
      };

      if (isSupabaseConfigured) {
        const { error: err } = await supabase.from("pendaftar").insert([payload]);
        if (err) throw new Error(`Gagal menyimpan pendaftaran: ${err.message}`);
        if (appliedVoucher) {
          try {
            await supabase.rpc("claim_voucher", { p_code: appliedVoucher, p_no_reg: id });
          } catch (e) {
            console.warn("Gagal menandai voucher terpakai:", e);
          }
        }
      }
      setSuccessData({ id, totalAkhir: total });
      setStep(3);
    } catch (err: any) {
      setError(err.message || "Koneksi terputus. Pendaftaran gagal dikirim.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const salin = (t: string) => {
    navigator.clipboard.writeText(t);
  };

  const downloadTicket = async () => {
    setIsDownloading(true);
    const el = document.getElementById("badge-print-area");
    if (el) {
      try {
        const img = await toJpeg(el, { quality: 0.95, pixelRatio: 2, backgroundColor: "#ffffff", cacheBust: true });
        const a = document.createElement("a");
        a.download = `E-Ticket-${successData?.id}.jpg`;
        a.href = img;
        a.click();
      } catch (e) {
        console.error(e);
      }
    }
    setIsDownloading(false);
  };

  const daftarLagi = () => {
    setSuccessData(null);
    setRegistrationId("");
    setNamaLengkap(""); setEmail(""); setWhatsapp("");
    setInstitusi(""); setNim(""); setCabangPersadia(""); setNamaKetuaCabang("");
    setTanggalLahir(""); setJenisKelamin("Laki-laki");
    setBersediaAnggotaPersadia(false);
    setAlamatLengkap(""); setKelurahan(""); setKecamatan(""); setKotaKabupaten(""); setProvinsi("");
    setHasConfirmedPayment(false);
    setTurnstileToken(null);
    setAppliedVoucher(null);
    setVoucherInput("");
    gantiKategori();
  };

  const isPaid = Boolean(successData && (successData.totalAkhir > 0 || kat.akses === "ilmiah"));
  const hargaTampil = (k: typeof KATEGORI_PESERTA[number]) => {
    if (k.akses === "pesta_rakyat") return k.id === "persadia" ? "Gratis" : "Mulai Gratis";
    const h = k.id === "perawat" ? k.hargaWorkshop || k.hargaSymposiumWorkshop : k.hargaSymposiumWorkshop || k.hargaSymposium;
    return h ? rupiah(h.earlyBird) : "";
  };

  const isPestaRakyatClosed = closedCategories.includes("persadia") || closedCategories.includes("umum");
  const cleanWa = KONTAK_PANITIA.whatsapp.replace(/\D/g, "").replace(/^0/, "62");

  const kategoriRow = (k: typeof KATEGORI_PESERTA[number]) => {
    const isClosed = closedCategories.includes(k.id);

    return (
      <button
        key={k.id}
        type="button"
        onClick={() => {
          if (isClosed) {
            setClosedModalCategory(k);
          } else {
            pilihKategori(k.id);
          }
        }}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl text-left transition-all shadow-xs group cursor-pointer border ${
          isClosed
            ? "bg-slate-50/90 border-slate-200 hover:border-rose-300 hover:bg-rose-50/20"
            : "bg-white border-slate-200 hover:border-[#0B3D5E] hover:bg-slate-50 hover:shadow-sm"
        }`}
      >
        <div className="min-w-0 pr-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-sm font-semibold transition-colors block ${
                isClosed ? "text-slate-700" : "text-slate-900 group-hover:text-[#0B3D5E]"
              }`}
            >
              {k.label}
            </span>
            {isClosed && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                Ditutup
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500 block mt-0.5">
            {k.akses === "ilmiah"
              ? (k.id === "perawat" ? "Khusus workshop medis terapan" : "Akses simposium & workshop ilmiah")
              : (k.id === "persadia" ? "Gratis bagi anggota cabang PERSADIA" : "Pesta Rakyat & Diabetes Health Forum")}
          </span>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {isClosed ? (
            <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200/80">
              Kuota Penuh
            </span>
          ) : (
            <span className="flex items-center gap-2 text-sm font-bold text-[#0B3D5E]">
              {hargaTampil(k)}
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#0B3D5E] group-hover:translate-x-0.5 transition-all" />
            </span>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={onNavigateHome} className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer">
            <ArrowLeft className="h-4 w-4" /> Beranda
          </button>
          <span className="text-sm font-bold text-[#0B3D5E]">Pendaftaran KONAS PERSADIA 2026</span>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8">
        {/* ============ STEP 0: PILIH KATEGORI ============ */}
        {step === 0 && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#0B3D5E] bg-[#0B3D5E]/10 px-2.5 py-0.5 rounded-full mb-2">
                Formulir Pendaftaran
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mendaftar sebagai apa?</h1>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Silakan pilih salah satu kategori kepesertaan di bawah ini untuk melanjutkan pendaftaran Anda.
              </p>
            </div>

            {/* Banner Peringatan jika Pesta Rakyat ditutup */}
            {isPestaRakyatClosed && (
              <div className="bg-amber-50/90 border border-amber-300/80 rounded-xl p-4 text-amber-900 shadow-xs flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <div className="flex items-center gap-2">
                    <strong className="text-amber-950 font-semibold">Pemberitahuan Kuota Pesta Rakyat</strong>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-amber-200/80 text-amber-900 rounded-md">
                      Kapasitas Penuh
                    </span>
                  </div>
                  <p className="text-amber-800 text-xs mt-1 leading-relaxed">
                    Pendaftaran untuk kegiatan <strong>Pesta Rakyat (Stadion Pakansari)</strong> saat ini telah ditutup karena jumlah pendaftar telah melampaui kapasitas kuota yang disediakan panitia.
                  </p>
                  <p className="text-amber-700 text-xs mt-1.5">
                    Bagi peserta rombongan cabang atau pertanyaan seputar kuota khusus, silakan hubungi{" "}
                    <a
                      href={`https://wa.me/${cleanWa}?text=${encodeURIComponent("Halo Panitia KONAS PERSADIA 2026, saya ingin menanyakan perihal kuota pendaftaran Pesta Rakyat.")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold underline text-amber-900 hover:text-amber-950"
                    >
                      Panitia via WhatsApp ({KONTAK_PANITIA.whatsapp})
                    </a>.
                  </p>
                </div>
              </div>
            )}

            <section className="space-y-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                1. Simposium &amp; Workshop (Medis &amp; Ilmiah) · Novotel Bogor
              </h2>
              {KATEGORI_PESERTA.filter((k) => k.akses === "ilmiah").map(kategoriRow)}
            </section>

            <section className="space-y-2.5 pt-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                2. Pesta Rakyat &amp; Diabetes Health Forum · Stadion Pakansari
              </h2>
              {KATEGORI_PESERTA.filter((k) => k.akses === "pesta_rakyat").map(kategoriRow)}
            </section>
          </div>
        )}

        {/* ============ STEP 1: DATA DIRI ============ */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <button onClick={gantiKategori} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 cursor-pointer mb-3">
                <ArrowLeft className="h-4 w-4" /> Ganti kategori
              </button>
              <h1 className="text-xl font-bold text-slate-900">{kat.label}</h1>
              <p className="text-xs text-slate-500 mt-1"><span className="text-rose-500 font-bold">*</span> Bidang bertanda bintang wajib diisi</p>
            </div>

            {closedCategories.includes(kat.id) && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-sm space-y-2">
                <div className="flex items-center gap-2 font-bold text-rose-800">
                  <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                  Pendaftaran Kategori {kat.label} Telah Ditutup
                </div>
                <p className="text-xs text-rose-700 leading-relaxed">
                  Mohon maaf, kuota kapasitas untuk kategori ini telah terpenuhi sehingga formulir pendaftaran saat ini ditutup. Anda dapat memilih kategori lain atau menghubungi panitia melalui WhatsApp.
                </p>
                <div className="pt-1 flex flex-wrap gap-2">
                  <button
                    onClick={gantiKategori}
                    className="px-3 py-1.5 bg-white border border-rose-300 text-rose-800 text-xs font-semibold rounded-lg hover:bg-rose-100/50 cursor-pointer"
                  >
                    ← Pilih Kategori Lain
                  </button>
                  <a
                    href={`https://wa.me/${cleanWa}?text=${encodeURIComponent(`Halo Panitia KONAS PERSADIA 2026, saya ingin menanyakan kuota pendaftaran untuk kategori: ${kat.label}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> Hubungi Panitia
                  </a>
                </div>
              </div>
            )}

            {error && <div className="px-3.5 py-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">{error}</div>}

            <div className="space-y-4">
              <Field label="Nama lengkap (beserta gelar)" required>
                <input className={inputCls} value={namaLengkap} onChange={(e) => setNamaLengkap(e.target.value)} />
              </Field>
              <Field label="Email" optional>
                <input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" />
              </Field>
              <Field label="Nomor WhatsApp" required>
                <input type="tel" className={inputCls} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="08xxxxxxxxxx" />
              </Field>

              {kat.fieldTambahan.includes("institusi") && (
                <Field label="Institusi / tempat bertugas" required>
                  <input className={inputCls} value={institusi} onChange={(e) => setInstitusi(e.target.value)} />
                </Field>
              )}
              {kat.fieldTambahan.includes("nim") && (
                <Field label="NIM" required>
                  <input className={inputCls} value={nim} onChange={(e) => setNim(e.target.value)} />
                </Field>
              )}
              {kat.fieldTambahan.includes("cabangPersadia") && (
                <Field label="Cabang PERSADIA" required>
                  <input className={inputCls} value={cabangPersadia} onChange={(e) => setCabangPersadia(e.target.value)} />
                </Field>
              )}
              {kat.fieldTambahan.includes("namaKetuaCabang") && (
                <Field label="Nama Ketua Cabang PERSADIA" required>
                  <input className={inputCls} value={namaKetuaCabang} onChange={(e) => setNamaKetuaCabang(e.target.value)} />
                </Field>
              )}
              {kat.fieldTambahan.includes("tanggalLahir") && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tanggal lahir" required>
                    <input type="date" className={inputCls} value={tanggalLahir} onChange={(e) => setTanggalLahir(e.target.value)} />
                  </Field>
                  <Field label="Jenis kelamin" required>
                    <select className={inputCls} value={jenisKelamin} onChange={(e) => setJenisKelamin(e.target.value)}>
                      <option>Laki-laki</option>
                      <option>Perempuan</option>
                    </select>
                  </Field>
                </div>
              )}
            </div>

            {/* Pilihan khusus per kategori */}
            {kat.akses === "ilmiah" && kat.id !== "perawat" && (
              <Field label="Paket kegiatan">
                <select className={inputCls} value={pilihanKegiatan} onChange={(e) => setPilihanKegiatan(e.target.value as any)}>
                  <option value="Symposium + Workshop">Simposium + Workshop</option>
                </select>
              </Field>
            )}

            {kat.id === "dokter_umum" && (
              <div className="space-y-1.5">
                <span className="block text-sm font-medium text-slate-700">Kode voucher instansi (jika ada)</span>
                {appliedVoucher ? (
                  <div className="flex items-center justify-between px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-sm">
                    <span className="font-mono text-emerald-800">{appliedVoucher} · {rupiah(VOUCHER_DOKTER_UMUM_CONFIG.hargaSymposiumWorkshop)}</span>
                    <button onClick={() => { setAppliedVoucher(null); setVoucherInput(""); }} className="text-rose-600 text-xs cursor-pointer">Hapus</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input className={`${inputCls} font-mono uppercase`} placeholder="FKTP-xxxxxx" value={voucherInput} onChange={(e) => setVoucherInput(e.target.value.toUpperCase())} />
                    <button onClick={validateVoucher} disabled={voucherLoading} className="px-4 text-sm font-medium bg-slate-800 text-white rounded-lg disabled:opacity-50 cursor-pointer">
                      {voucherLoading ? "..." : "Terapkan"}
                    </button>
                  </div>
                )}
                {voucherError && <p className="text-xs text-rose-600">{voucherError}</p>}
              </div>
            )}

            {kat.id === "persadia" && (
              <Check checked={ikutHealthTalk} onChange={setIkutHealthTalk}>
                Ikut Diabetes Health Forum, 7 Nov di Novotel (+ {rupiah(DIABETES_HEALTH_FORUM_CONFIG.biaya)})
              </Check>
            )}

            {kat.id === "umum" && (
              <div className="space-y-3">
                <span className="block text-sm font-medium text-slate-700">Kegiatan yang diikuti <span className="text-rose-500 font-bold">*</span></span>
                <Check checked={ikutPestaRakyatUmum} onChange={setIkutPestaRakyatUmum}>Pesta Rakyat, 8 Nov di Stadion Pakansari</Check>
                {ikutPestaRakyatUmum && (
                  <div className="ml-6 space-y-2 text-sm text-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="tipePesta" checked={tipePestaRakyatUmum === "gratis"} onChange={() => setTipePestaRakyatUmum("gratis")} className="accent-[#0B3D5E]" />
                      Gratis
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="tipePesta" checked={tipePestaRakyatUmum === "berbayar"} onChange={() => setTipePestaRakyatUmum("berbayar")} className="accent-[#0B3D5E]" />
                      Paket kaos, goodie bag &amp; snack box (Rp 100.000)
                    </label>
                  </div>
                )}
                <Check checked={ikutDhfUmum} onChange={setIkutDhfUmum}>
                  Diabetes Health Forum, 7 Nov di Novotel (+ {rupiah(DIABETES_HEALTH_FORUM_CONFIG.biaya)})
                </Check>
              </div>
            )}

            {kat.id !== "persadia" && (
              <div className="space-y-3">
                <Check checked={bersediaAnggotaPersadia} onChange={setBersediaAnggotaPersadia}>
                  Saya bersedia didata sebagai anggota PERSADIA
                </Check>
                {bersediaAnggotaPersadia && (
                  <div className="space-y-3 pl-6">
                    <Field label="Alamat lengkap" required>
                      <input className={inputCls} value={alamatLengkap} onChange={(e) => setAlamatLengkap(e.target.value)} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Kelurahan / Desa" required><input className={inputCls} value={kelurahan} onChange={(e) => setKelurahan(e.target.value)} /></Field>
                      <Field label="Kecamatan" required><input className={inputCls} value={kecamatan} onChange={(e) => setKecamatan(e.target.value)} /></Field>
                      <Field label="Kota / Kabupaten" required><input className={inputCls} value={kotaKabupaten} onChange={(e) => setKotaKabupaten(e.target.value)} /></Field>
                      <Field label="Provinsi" required><input className={inputCls} value={provinsi} onChange={(e) => setProvinsi(e.target.value)} /></Field>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-center">
              <Turnstile
                siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"}
                onSuccess={(t) => { setTurnstileToken(t); setError(""); }}
                onExpire={() => setTurnstileToken(null)}
                onError={() => setTurnstileToken(null)}
              />
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs text-slate-500">Total biaya</div>
                <div className="text-lg font-bold text-slate-900">{rupiah(hargaDasar)}</div>
              </div>
              <button
                onClick={lanjutDariDataDiri}
                disabled={isSubmitting || closedCategories.includes(kat.id)}
                className="px-6 py-2.5 bg-[#0B3D5E] hover:bg-[#093450] text-white text-sm font-semibold rounded-lg flex items-center gap-2 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {hargaDasar === 0 ? "Daftar" : "Lanjut ke pembayaran"}
              </button>
            </div>
          </div>
        )}

        {/* ============ STEP 2: PEMBAYARAN ============ */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 cursor-pointer mb-3">
                <ArrowLeft className="h-4 w-4" /> Kembali
              </button>
              <h1 className="text-xl font-bold text-slate-900">Pembayaran</h1>
            </div>

            {error && <div className="px-3.5 py-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">{error}</div>}

            <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200 text-sm">
              <div className="flex justify-between px-4 py-3"><span className="text-slate-500">Biaya</span><span>{rupiah(hargaDasar)}</span></div>
              <div className="flex justify-between px-4 py-3"><span className="text-slate-500">Kode unik</span><span>+{kodeUnik}</span></div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="font-medium">Total transfer</span>
                <span className="flex items-center gap-2 text-base font-bold">
                  {rupiah(totalAkhir)}
                  <button onClick={() => salin(String(totalAkhir))} title="Salin" className="text-slate-400 hover:text-slate-700 cursor-pointer"><Copy className="h-4 w-4" /></button>
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm space-y-1">
              <div className="text-slate-500">Transfer ke</div>
              <div className="font-medium">{REKENING_PEMBAYARAN.bank} · a.n. {REKENING_PEMBAYARAN.atasNama}</div>
              <div className="flex items-center gap-2 font-mono text-base font-bold">
                {REKENING_PEMBAYARAN.nomorRekening}
                <button onClick={() => salin(REKENING_PEMBAYARAN.nomorRekening)} title="Salin" className="text-slate-400 hover:text-slate-700 cursor-pointer"><Copy className="h-4 w-4" /></button>
              </div>
              <div className="pt-2 text-slate-500">
                Cantumkan nomor registrasi <span className="font-mono font-semibold text-slate-800">{registrationId}</span> pada berita transfer.
              </div>
            </div>

            <Check checked={hasConfirmedPayment} onChange={setHasConfirmedPayment}>
              Saya sudah mentransfer sesuai nominal di atas.
            </Check>

            <button
              onClick={() => kirim()}
              disabled={isSubmitting || !hasConfirmedPayment}
              className="w-full py-2.5 bg-[#0B3D5E] hover:bg-[#093450] text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Kirim pendaftaran
            </button>
          </div>
        )}

        {/* ============ STEP 3: SELESAI ============ */}
        {step === 3 && successData && (
          <div className="space-y-5 text-center">
            {isPaid ? (
              <Clock className="h-10 w-10 text-amber-500 mx-auto" />
            ) : (
              <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {isPaid ? "Pendaftaran diterima" : "Pendaftaran berhasil"}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {isPaid
                  ? "Pembayaran Anda akan diverifikasi panitia. E-tiket dikirim ke WhatsApp Anda setelah terverifikasi."
                  : "Simpan e-tiket di bawah ini dan tunjukkan saat registrasi ulang."}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg px-4 py-4 inline-block">
              <div className="text-xs text-slate-500">Nomor registrasi</div>
              <div className="flex items-center justify-center gap-2 font-mono text-xl font-bold text-slate-900">
                {successData.id}
                <button onClick={() => salin(successData.id)} title="Salin" className="text-slate-400 hover:text-slate-700 cursor-pointer"><Copy className="h-4 w-4" /></button>
              </div>
            </div>

            {!isPaid && (
              <div className="space-y-3">
                <div className="inline-block p-3 bg-white border border-slate-200 rounded-lg">
                  <QRCodeSVG value={`${window.location.origin}/scanner.html?id=${successData.id}`} size={180} level="H" includeMargin />
                </div>
                <div>
                  <button onClick={downloadTicket} disabled={isDownloading} className="px-5 py-2.5 bg-[#0B3D5E] text-white text-sm font-semibold rounded-lg inline-flex items-center gap-2 disabled:opacity-60 cursor-pointer">
                    {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Unduh e-tiket
                  </button>
                </div>
              </div>
            )}

            {isPaid && (
              <a
                href={`https://wa.me/${KONTAK_PANITIA.whatsapp.replace(/\D/g, "").replace(/^0/, "62")}?text=${encodeURIComponent(`Halo Panitia KONAS PERSADIA 2026, saya sudah mendaftar dengan No. Registrasi ${successData.id} a.n. ${namaLengkap}. Berikut bukti transfer saya.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg"
              >
                Kirim bukti transfer via WhatsApp
              </a>
            )}

            <div className="pt-4 border-t border-slate-200 flex justify-center gap-4 text-sm">
              <button onClick={daftarLagi} className="text-slate-600 hover:text-slate-900 cursor-pointer">Daftarkan peserta lain</button>
              <button onClick={onNavigateHome} className="text-slate-600 hover:text-slate-900 cursor-pointer">Kembali ke beranda</button>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-xl mx-auto px-4 pb-8 text-center text-sm text-slate-500">
        Bantuan WhatsApp:{" "}
        <a
          href={`https://wa.me/${KONTAK_PANITIA.whatsapp.replace(/\D/g, "").replace(/^0/, "62")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-slate-600 hover:text-slate-900 underline underline-offset-2 transition"
        >
          {KONTAK_PANITIA.whatsapp}
        </a>
      </footer>

      {/* E-tiket tersembunyi untuk diunduh sebagai gambar (peserta gratis) */}
      {successData && !isPaid && (
        <div
          id="badge-print-area"
          style={{ width: 450, height: 720, position: "fixed", top: 0, left: 0, zIndex: -50, pointerEvents: "none", backgroundColor: "#ffffff", padding: 20, boxSizing: "border-box" }}
        >
          <div className="h-full w-full rounded-2xl overflow-hidden flex flex-col border-2 border-slate-200 bg-white">
            <div className="px-6 py-5 text-white" style={{ backgroundColor: kat.id === "persadia" ? "#ea580c" : "#0B3D5E" }}>
              <div className="flex justify-between items-center">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1">
                    <img src={EVENT_INFO.eventLogoUrl} crossOrigin="anonymous" className="w-full h-full object-contain" alt="Logo" />
                  </div>
                  <div>
                    <h2 className="text-base font-black tracking-wider leading-tight">KNS PERSADIA 2026</h2>
                    <p className="text-[10px] opacity-90 uppercase tracking-widest mt-0.5">Bogor, Indonesia • 7-8 Nov 2026</p>
                  </div>
                </div>
                <div className="bg-white/15 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border border-white/20">E-TICKET</div>
              </div>
            </div>
            <div className="flex-1 px-6 pt-5 pb-4 flex flex-col bg-white text-center items-center">
              <div className="mb-3 w-full">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">NAMA PESERTA</span>
                <h3 className="text-2xl font-black text-slate-900 leading-tight uppercase break-words">{namaLengkap}</h3>
                {institusi && <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wide">{institusi}</p>}
              </div>
              <div className="flex flex-wrap justify-center gap-2 mb-4 w-full">
                <div className="px-3.5 py-1 rounded-full border border-slate-300 text-[11px] font-black uppercase tracking-wider text-slate-700 bg-slate-50">{kat.label}</div>
                <div className="px-3.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-wider">
                  {kat.akses === "ilmiah" ? "Sesi Ilmiah (Novotel)" : "Pesta Rakyat (Pakansari)"}
                </div>
              </div>
              <div className="my-auto p-4 bg-white rounded-2xl border-2 border-slate-900 flex flex-col items-center w-full max-w-[270px]">
                <QRCodeSVG value={`${window.location.origin}/scanner.html?id=${successData.id}`} size={200} level="H" includeMargin />
                <div className="mt-2 text-center border-t border-slate-200 pt-2 w-full">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">ID REGISTRASI</span>
                  <strong className="text-base font-mono font-black text-slate-900 tracking-widest">{successData.id}</strong>
                </div>
              </div>
            </div>
            <div className="bg-slate-900 text-white px-5 py-4 text-center">
              <p className="text-[10px] font-bold tracking-wider text-amber-400 uppercase">Simpan e-tiket ini di galeri HP Anda.</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog Informasi Pendaftaran Kategori Ditutup */}
      {closedModalCategory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setClosedModalCategory(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden text-left"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-rose-50 border-b border-rose-100 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-950">Pendaftaran Ditutup</h3>
                  <p className="text-[11px] text-rose-700 font-medium">Kuota Kapasitas Terpenuhi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setClosedModalCategory(null)}
                className="p-1.5 rounded-lg text-rose-400 hover:text-rose-700 hover:bg-rose-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="text-sm text-slate-600 space-y-2.5 leading-relaxed">
                <p>
                  Mohon maaf, pendaftaran untuk kategori{" "}
                  <strong className="text-slate-900">{closedModalCategory.label}</strong> saat ini telah resmi ditutup karena jumlah pendaftar telah mencapai batas kapasitas kuota maksimal yang disediakan panitia.
                </p>
                {closedModalCategory.akses === "pesta_rakyat" ? (
                  <div className="text-xs text-slate-600 bg-amber-50/70 p-3 rounded-xl border border-amber-200/80 leading-relaxed">
                    🎉 <strong className="text-amber-950">Antusiasme Luar Biasa:</strong> Banyaknya peserta yang mendaftar pada <strong>Pesta Rakyat di Stadion Pakansari</strong> membuat kuota terisi dengan sangat cepat. Panitia saat ini membatasi pendaftaran baru demi menjaga kenyamanan, keamanan, dan kelancaran seluruh peserta.
                  </div>
                ) : (
                  <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                    🏛️ Kapasitas ruang simposium dan workshop ilmiah di <strong>Novotel Bogor Golf Resort</strong> telah mencapai kuota maksimal.
                  </div>
                )}
              </div>

              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 space-y-2.5">
                <p className="text-xs text-emerald-950 font-bold flex items-center gap-1.5">
                  <MessageCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  Butuh Informasi Tambahan / Rombongan Cabang?
                </p>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Bagi pendaftar rombongan cabang PERSADIA atau pertanyaan seputar ketersediaan kuota susulan, silakan hubungi tim Sekretariat Panitia langsung melalui WhatsApp:
                </p>
                <a
                  href={`https://wa.me/${cleanWa}?text=${encodeURIComponent(`Halo Panitia KONAS PERSADIA 2026, saya ingin menanyakan perihal kuota pendaftaran kategori: ${closedModalCategory.label}. Apakah masih memungkinkan untuk mendaftar?`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <MessageCircle className="h-4 w-4" /> Hubungi Panitia ({KONTAK_PANITIA.whatsapp})
                </a>
              </div>
            </div>

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setClosedModalCategory(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Tutup &amp; Pilih Kategori Lain
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
