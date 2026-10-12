import { useState, useEffect, type FormEvent } from "react";
import { ArrowLeft, Search, Download, Copy, Check, Loader2, AlertCircle, HelpCircle, QrCode, Stethoscope, Sparkles } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toJpeg } from "html-to-image";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { EVENT_INFO, KONTAK_PANITIA } from "../config";

interface TicketDownloadPageProps {
  onNavigateHome: () => void;
}

interface ParticipantData {
  id: string | number;
  no_registrasi: string;
  nama_lengkap: string;
  whatsapp: string;
  email?: string;
  kategori_peserta: string;
  pilihan_kegiatan: string;
  cabang_persadia?: string;
  institusi?: string;
  status_pembayaran: string;
  total_tagihan?: number | string;
  timestamp?: string;
}

export default function TicketDownloadPage({ onNavigateHome }: TicketDownloadPageProps) {
  // Mode tab: "simposium" (Ilmiah: Simposium + Workshop) atau "pesta_rakyat"
  const [activeTab, setActiveTab] = useState<"simposium" | "pesta_rakyat">("simposium");

  // Form states untuk Simposium (Cukup No. Registrasi)
  const [regInput, setRegInput] = useState("");

  // Form states untuk Pesta Rakyat (No. WA + Sebagian Nama)
  const [whatsappInput, setWhatsappInput] = useState("");
  const [nameInput, setNameInput] = useState("");

  // Search states
  const [isSearching, setIsSearching] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantData | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Normalisasi nomor telepon
  const normalizePhone = (phone: string): string => {
    let clean = phone.replace(/\D/g, "");
    if (clean.startsWith("62")) {
      clean = "0" + clean.slice(2);
    }
    return clean;
  };

  const isIlmiahParticipant = (row: any): boolean => {
    const kat = (row.kategori_peserta || "").toLowerCase();
    const keg = (row.pilihan_kegiatan || "").toLowerCase();
    return (
      kat.includes("dokter") ||
      kat.includes("spesialis") ||
      kat.includes("perawat") ||
      kat.includes("fktp") ||
      kat.includes("mahasiswa") ||
      keg.includes("symposium") ||
      keg.includes("simposium") ||
      keg.includes("workshop")
    );
  };

  const isPestaRakyatParticipant = (row: any): boolean => {
    const kat = (row.kategori_peserta || "").toLowerCase();
    const keg = (row.pilihan_kegiatan || "").toLowerCase();
    return (
      kat.includes("pesta rakyat") ||
      kat.includes("persadia") ||
      kat.includes("umum") ||
      keg.includes("pesta rakyat")
    );
  };

  // Cek parameter dari URL dan hash saat inisialisasi
  useEffect(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes("pesta-rakyat") || hash.includes("pesta_rakyat")) {
      setActiveTab("pesta_rakyat");
    } else if (hash.includes("simposium") || hash.includes("ilmiah") || hash.includes("workshop")) {
      setActiveTab("simposium");
    }

    let searchParamsStr = window.location.search;
    if (!searchParamsStr && window.location.hash.includes("?")) {
      searchParamsStr = window.location.hash.substring(window.location.hash.indexOf("?"));
    }
    const urlParams = new URLSearchParams(searchParamsStr);
    const regParam = urlParams.get("id") || urlParams.get("noreg") || urlParams.get("no_registrasi");
    const waParam = urlParams.get("wa") || urlParams.get("whatsapp");
    const nameParam = urlParams.get("nama") || urlParams.get("name");

    if (regParam) {
      setActiveTab("simposium");
      setRegInput(regParam);
      searchSimposiumByRegistrationId(regParam);
    } else if (waParam) {
      setActiveTab("pesta_rakyat");
      setWhatsappInput(waParam);
      if (nameParam) setNameInput(nameParam);
      searchPestaRakyat(waParam, nameParam || "");
    }
  }, []);

  // 1. Pencarian Simposium & Workshop (HANYA NO REGISTRASI)
  const searchSimposiumByRegistrationId = async (queryReg: string) => {
    const cleanReg = queryReg.trim();
    if (!cleanReg || cleanReg.length < 3) {
      setSearchError("Harap masukkan Nomor Registrasi yang valid (contoh: KNS2026-xxxxx).");
      return;
    }

    if (!isSupabaseConfigured) {
      setSearchError("Layanan database belum terhubung. Silakan hubungi panitia.");
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchAttempted(true);
    setSelectedParticipant(null);

    try {
      const { data, error } = await supabase
        .from("pendaftar")
        .select("*")
        .ilike("no_registrasi", `%${cleanReg}%`)
        .limit(10);

      if (error) throw error;

      if (!data || data.length === 0) {
        setParticipants([]);
        return;
      }

      setParticipants(data);
      if (data.length === 1) {
        setSelectedParticipant(data[0]);
      }
    } catch (err: any) {
      setSearchError(err.message || "Terjadi kesalahan saat mencari tiket Simposium.");
    } finally {
      setIsSearching(false);
    }
  };

  // 2. Pencarian Pesta Rakyat (NO WHATSAPP + SEBAGIAN NAMA)
  const searchPestaRakyat = async (waQuery: string, nameQuery: string) => {
    const cleanWa = normalizePhone(waQuery);
    if (!cleanWa || cleanWa.length < 8) {
      setSearchError("Harap masukkan nomor WhatsApp yang valid (minimal 8 angka).");
      return;
    }

    if (!isSupabaseConfigured) {
      setSearchError("Layanan database belum terhubung. Silakan hubungi panitia.");
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchAttempted(true);
    setSelectedParticipant(null);

    try {
      const coreWa = cleanWa.length > 8 ? cleanWa.slice(-8) : cleanWa;

      const { data, error } = await supabase
        .from("pendaftar")
        .select("*")
        .or(`whatsapp.ilike.%${cleanWa}%,whatsapp.ilike.%${coreWa}%`);

      if (error) throw error;

      if (!data || data.length === 0) {
        setParticipants([]);
        return;
      }

      let results = data.filter(isPestaRakyatParticipant);

      const cleanPartialName = nameQuery.trim().toLowerCase();
      if (cleanPartialName.length > 0) {
        results = results.filter((p) =>
          (p.nama_lengkap || "").toLowerCase().includes(cleanPartialName)
        );
      }

      setParticipants(results);
      if (results.length === 1) {
        setSelectedParticipant(results[0]);
      }
    } catch (err: any) {
      setSearchError(err.message || "Terjadi kesalahan saat mencari tiket Pesta Rakyat.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSimposiumSubmit = (e: FormEvent) => {
    e.preventDefault();
    searchSimposiumByRegistrationId(regInput);
  };

  const handlePestaRakyatSubmit = (e: FormEvent) => {
    e.preventDefault();
    searchPestaRakyat(whatsappInput, nameInput);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const downloadTicketImage = async () => {
    if (!selectedParticipant) return;
    setIsDownloading(true);
    try {
      const el = document.getElementById("universal-badge-print-area");
      if (el) {
        const dataUrl = await toJpeg(el, {
          quality: 0.95,
          pixelRatio: 2,
          backgroundColor: "#ffffff",
          cacheBust: true,
        });
        const link = document.createElement("a");
        const safeName = (selectedParticipant.nama_lengkap || "Peserta")
          .replace(/[^a-zA-Z0-9]/g, "_")
          .slice(0, 30);
        const prefix = isIlmiahParticipant(selectedParticipant) ? "E-Ticket-Ilmiah" : "E-Ticket-PestaRakyat";
        link.download = `${prefix}-${selectedParticipant.no_registrasi}-${safeName}.jpg`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error("Gagal mengunduh tiket:", err);
      alert("Gagal mengunduh gambar tiket. Anda juga dapat mengambil tangkapan layar (screenshot) tiket ini.");
    } finally {
      setIsDownloading(false);
    }
  };

  const isCurrentIlmiah = selectedParticipant ? isIlmiahParticipant(selectedParticipant) : activeTab === "simposium";

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col justify-between">
      {/* Top Header */}
      <header className="bg-[#0B3D5E] text-white py-4 px-4 sm:px-6 shadow-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={onNavigateHome}
            className="inline-flex items-center gap-2 text-white/90 hover:text-white text-xs sm:text-sm font-semibold transition cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Beranda</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[11px] sm:text-xs font-bold text-emerald-300 uppercase tracking-wider">
              Portal E-Ticket Resmi
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12">
        {/* Banner Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 text-[#0B3D5E] rounded-2xl mb-3 shadow-xs">
            <QrCode className="h-8 w-8 text-[#0B3D5E]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
            Unduh E-Ticket &amp; QR Code Mandiri
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            KONAS PERSADIA, KONKER PERKENI, DAN KONKER PEDI 2026 • Bogor, 7–8 November 2026
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="max-w-xl mx-auto mb-6">
          <div className="bg-slate-200/80 p-1.5 rounded-2xl flex gap-1 shadow-inner">
            <button
              onClick={() => {
                setActiveTab("simposium");
                setSearchError(null);
                setSearchAttempted(false);
                setSelectedParticipant(null);
                setParticipants([]);
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "simposium"
                  ? "bg-[#0B3D5E] text-white shadow-md"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-300/60"
              }`}
            >
              <Stethoscope className="h-4 w-4" />
              <span>Simposium &amp; Workshop</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("pesta_rakyat");
                setSearchError(null);
                setSearchAttempted(false);
                setSelectedParticipant(null);
                setParticipants([]);
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "pesta_rakyat"
                  ? "bg-[#ea580c] text-white shadow-md"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-300/60"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>Pesta Rakyat</span>
            </button>
          </div>
        </div>

        {/* Search Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-8 shadow-xl max-w-xl mx-auto mb-8">
          {activeTab === "simposium" ? (
            /* TAB 1: SIMPOSIUM & WORKSHOP (HANYA NO REGISTRASI) */
            <form onSubmit={handleSimposiumSubmit} className="space-y-4">
              <div className="border-b border-slate-100 pb-3 mb-2">
                <span className="inline-block text-[11px] font-black uppercase tracking-wider text-[#0B3D5E] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full mb-1">
                  🩺 Sesi Ilmiah (Novotel Bogor)
                </span>
                <p className="text-xs text-slate-500">
                  Untuk Dokter Spesialis, Dokter Umum (FKTP), Perawat, Mahasiswa, &amp; Tenaga Kesehatan.
                </p>
              </div>

              <div>
                <label htmlFor="reg-input" className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                  Nomor Registrasi <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="reg-input"
                    type="text"
                    value={regInput}
                    onChange={(e) => setRegInput(e.target.value)}
                    placeholder="Contoh: KNS2026-35263407"
                    className="w-full px-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-[#0B3D5E] focus:bg-white transition"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Cukup masukkan Nomor Registrasi resmi yang Anda terima saat mendaftar atau dari panitia.
                </p>
              </div>

              {searchError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{searchError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSearching}
                className="w-full py-3.5 bg-gradient-to-r from-[#0B3D5E] to-[#00B4AC] hover:from-[#082d46] hover:to-[#009b94] text-white text-sm font-extrabold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Mencari Tiket Simposium...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    <span>Cari E-Ticket Simposium</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* TAB 2: PESTA RAKYAT (NO WHATSAPP + SEBAGIAN NAMA) */
            <form onSubmit={handlePestaRakyatSubmit} className="space-y-4">
              <div className="border-b border-slate-100 pb-3 mb-2">
                <span className="inline-block text-[11px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full mb-1">
                  🎪 Kegiatan Publik (Stadion Pakansari)
                </span>
                <p className="text-xs text-slate-500">
                  Untuk Anggota PERSADIA &amp; Peserta Pesta Rakyat Umum.
                </p>
              </div>

              <div>
                <label htmlFor="wa-input" className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                  Nomor WhatsApp Pendaftaran <span className="text-red-500">*</span>
                </label>
                <input
                  id="wa-input"
                  type="tel"
                  value={whatsappInput}
                  onChange={(e) => setWhatsappInput(e.target.value)}
                  placeholder="Contoh: 08123456789 atau 628123456789"
                  className="w-full px-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ea580c] focus:bg-white transition"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Masukkan nomor WhatsApp yang digunakan saat mendaftar.
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="name-input" className="block text-xs sm:text-sm font-bold text-slate-700">
                    Nama atau Sebagian Nama
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400">Opsional</span>
                </div>
                <input
                  id="name-input"
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Contoh: siti, yuyun, budi, dll."
                  className="w-full px-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ea580c] focus:bg-white transition"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Bisa diketik kata depan saja, atau <strong>dikosongkan</strong> untuk melihat seluruh tiket rombongan pada nomor ini.
                </p>
              </div>

              {searchError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{searchError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSearching}
                className="w-full py-3.5 bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:from-[#c2410c] hover:to-[#ea580c] text-white text-sm font-extrabold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Mencari Data Tiket...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    <span>Cari E-Ticket Pesta Rakyat</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Results Area */}
        {searchAttempted && !isSearching && (
          <div className="max-w-xl mx-auto">
            {participants.length === 0 ? (
              /* Not Found Alert */
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-3 shadow-sm">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-700">
                  <HelpCircle className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {activeTab === "simposium"
                    ? "Nomor Registrasi Tidak Ditemukan"
                    : "Data Tiket Pesta Rakyat Tidak Ditemukan"}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                  {activeTab === "simposium"
                    ? `Nomor registrasi "${regInput}" belum tercatat atau salah ketik. Pastikan format penulisan sudah sesuai (contoh: KNS2026-xxxxx).`
                    : "Pastikan nomor WhatsApp yang Anda masukkan sudah sama persis saat mendaftar. Jika Anda mendaftar melalui koordinator rombongan, tanyakan nomor WhatsApp koordinator Anda."}
                </p>
                <div className="pt-2 flex flex-col sm:flex-row justify-center gap-2">
                  <a
                    href={`https://wa.me/${KONTAK_PANITIA.whatsapp.replace(/\D/g, "").replace(/^0/, "62")}?text=${encodeURIComponent(
                      `Halo Panitia KONAS PERSADIA 2026, saya ingin menanyakan E-Ticket atas nama ${
                        activeTab === "simposium" ? `No. Reg: ${regInput}` : `${nameInput || "Peserta"} (No. WA: ${whatsappInput})`
                      }. Mohon bantuannya.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition"
                  >
                    <span>Hubungi Bantuan Panitia via WA</span>
                  </a>
                </div>
              </div>
            ) : participants.length > 1 && !selectedParticipant ? (
              /* Multiple Participants Selection List */
              <div className="space-y-4">
                <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200 text-center">
                  <p className="text-xs sm:text-sm font-bold text-slate-800">
                    Ditemukan <span className="text-[#0B3D5E] font-black">{participants.length} tiket</span>:
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Silakan klik salah satu tiket untuk melihat dan mengunduh QR Code:
                  </p>
                </div>

                <div className="space-y-3">
                  {participants.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="bg-white border border-slate-200 hover:border-[#00B4AC] rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 bg-slate-100 rounded-full text-[10px] font-bold text-slate-600 flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <h4 className="font-black text-sm sm:text-base text-slate-900 uppercase">
                            {p.nama_lengkap}
                          </h4>
                        </div>
                        <div className="flex flex-wrap gap-1.5 text-[11px]">
                          <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                            {p.no_registrasi}
                          </span>
                          <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-semibold">
                            {p.kategori_peserta}
                          </span>
                          {p.institusi && p.institusi !== "-" && (
                            <span className="bg-slate-50 text-slate-600 px-2 py-0.5 rounded font-medium">
                              {p.institusi}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedParticipant(p)}
                        className="w-full sm:w-auto px-4 py-2 bg-[#0B3D5E] hover:bg-[#082d46] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <QrCode className="h-3.5 w-3.5" />
                        <span>Buka Tiket</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : selectedParticipant ? (
              /* Single Selected Participant Ticket Display */
              <div className="space-y-4 animate-in fade-in duration-200">
                {participants.length > 1 && (
                  <button
                    onClick={() => setSelectedParticipant(null)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B3D5E] hover:underline cursor-pointer mb-1"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Kembali ke daftar tiket</span>
                  </button>
                )}

                {/* E-Ticket Card Preview */}
                <div className="bg-white rounded-3xl border-2 border-slate-900 overflow-hidden shadow-2xl">
                  {/* Ticket Header */}
                  <div
                    className="text-white px-6 py-5"
                    style={{
                      background: isIlmiahParticipant(selectedParticipant)
                        ? "linear-gradient(135deg, #0B3D5E 0%, #00B4AC 100%)"
                        : "linear-gradient(135deg, #ea580c 0%, #f97316 100%)",
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1 shadow-xs">
                          <img
                            src={EVENT_INFO.eventLogoUrl}
                            crossOrigin="anonymous"
                            className="w-full h-full object-contain"
                            alt="Logo KONAS"
                          />
                        </div>
                        <div>
                          <h2 className="text-base font-black tracking-wider leading-tight">KONAS PERSADIA 2026</h2>
                          <p className="text-[10px] text-white/90 uppercase tracking-widest mt-0.5 font-bold">
                            {isIlmiahParticipant(selectedParticipant)
                              ? "Simposium & Workshop • Novotel Bogor"
                              : "Pesta Rakyat • Stadion Pakansari Bogor"}
                          </p>
                        </div>
                      </div>
                      <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border border-white/30">
                        {isIlmiahParticipant(selectedParticipant) ? "E-TICKET ILMIAH" : "E-TICKET PESTA RAKYAT"}
                      </div>
                    </div>
                  </div>

                  {/* Ticket Body */}
                  <div className="p-6 sm:p-8 flex flex-col items-center text-center space-y-4">
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                        NAMA PESERTA
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight uppercase">
                        {selectedParticipant.nama_lengkap}
                      </h3>
                      {selectedParticipant.institusi && selectedParticipant.institusi !== "-" && (
                        <p className="text-xs font-bold text-slate-600 mt-1 uppercase tracking-wide">
                          {selectedParticipant.institusi}
                        </p>
                      )}
                      {selectedParticipant.cabang_persadia && selectedParticipant.cabang_persadia !== "-" && (
                        <p className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full inline-block mt-2">
                          Cabang / Unit: {selectedParticipant.cabang_persadia}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap justify-center gap-2">
                      <div className="px-3 py-1 rounded-full border border-slate-300 text-[11px] font-black uppercase tracking-wider text-slate-700 bg-slate-50">
                        {selectedParticipant.kategori_peserta}
                      </div>
                      <div className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-wider">
                        {isIlmiahParticipant(selectedParticipant)
                          ? "Sesi Ilmiah (Novotel)"
                          : "Pesta Rakyat (Pakansari)"}
                      </div>
                      <div className="px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[11px] font-black uppercase tracking-wider">
                        {selectedParticipant.status_pembayaran || "Terverifikasi Lunas"}
                      </div>
                    </div>

                    {/* QR Code Container */}
                    <div className="p-4 bg-white rounded-2xl border-2 border-slate-900 flex flex-col items-center w-full max-w-[260px] shadow-sm my-2">
                      <QRCodeSVG
                        value={`${window.location.origin}/scanner.html?id=${selectedParticipant.no_registrasi}`}
                        size={190}
                        level="H"
                        includeMargin
                      />
                      <div className="mt-3 text-center border-t border-slate-200 pt-2 w-full">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                          NOMOR REGISTRASI
                        </span>
                        <div className="flex items-center justify-center gap-1.5 mt-0.5">
                          <strong className="text-base font-mono font-black text-slate-900 tracking-wider">
                            {selectedParticipant.no_registrasi}
                          </strong>
                          <button
                            onClick={() => copyToClipboard(selectedParticipant.no_registrasi)}
                            className="p-1 text-slate-400 hover:text-slate-800 transition cursor-pointer"
                            title="Salin Nomor Registrasi"
                          >
                            {copiedId === selectedParticipant.no_registrasi ? (
                              <Check className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 max-w-sm leading-relaxed">
                      {isIlmiahParticipant(selectedParticipant) ? (
                        <>
                          📅 <strong>Sabtu, 7 November 2026</strong> (07.30 WIB - Selesai)
                          <br />
                          📍 <strong>Novotel Bogor Golf Resort &amp; Convention Center</strong>
                          <br />
                          <span className="text-[11px] text-emerald-600 font-semibold block mt-1">
                            *Termasuk Akses Bebas ke Hari Ke-2 (Pesta Rakyat Stadion Pakansari • 8 Nov 2026)
                          </span>
                        </>
                      ) : (
                        <>
                          📅 <strong>Minggu, 8 November 2026</strong> (06.00 WIB - Selesai)
                          <br />
                          📍 <strong>Stadion Pakansari</strong>, Cibinong, Kabupaten Bogor
                        </>
                      )}
                    </div>
                  </div>

                  {/* Ticket Footer Action Bar */}
                  <div className="bg-slate-900 text-white p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-[11px] text-amber-400 font-bold text-center sm:text-left">
                      💡 Simpan gambar e-tiket ini di galeri HP Anda dan tunjukkan saat registrasi ulang.
                    </p>
                    <button
                      onClick={downloadTicketImage}
                      disabled={isDownloading}
                      className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-black rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 whitespace-nowrap"
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Menyiapkan Gambar...</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          <span>Unduh Gambar Tiket (JPG)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-500 space-y-2">
        <p>
          Butuh bantuan registrasi atau verifikasi tiket? Hubungi Panitia via WhatsApp:{" "}
          <a
            href={`https://wa.me/${KONTAK_PANITIA.whatsapp.replace(/\D/g, "").replace(/^0/, "62")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-[#0B3D5E] underline underline-offset-2"
          >
            {KONTAK_PANITIA.whatsapp}
          </a>
        </p>
        <p className="text-[11px] text-slate-400">
          © 2026 Panitia Pelaksana KONAS PERSADIA, KONKER PEDI, &amp; KONKER PERKENI.
        </p>
      </footer>

      {/* Hidden Render Container for High-Resolution Image Export (html-to-image) */}
      {selectedParticipant && (
        <div
          id="universal-badge-print-area"
          style={{
            width: 450,
            height: 720,
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: -100,
            pointerEvents: "none",
            backgroundColor: "#ffffff",
            padding: 20,
            boxSizing: "border-box",
          }}
        >
          <div className="h-full w-full rounded-2xl overflow-hidden flex flex-col border-2 border-slate-900 bg-white">
            <div
              className="px-6 py-5 text-white"
              style={{
                backgroundColor: isIlmiahParticipant(selectedParticipant) ? "#0B3D5E" : "#ea580c",
              }}
            >
              <div className="flex justify-between items-center">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1">
                    <img
                      src={EVENT_INFO.eventLogoUrl}
                      crossOrigin="anonymous"
                      className="w-full h-full object-contain"
                      alt="Logo"
                    />
                  </div>
                  <div>
                    <h2 className="text-base font-black tracking-wider leading-tight">KONAS PERSADIA 2026</h2>
                    <p className="text-[10px] opacity-90 uppercase tracking-widest mt-0.5">
                      {isIlmiahParticipant(selectedParticipant)
                        ? "Simposium & Workshop • Novotel Bogor"
                        : "Pesta Rakyat • Stadion Pakansari Bogor"}
                    </p>
                  </div>
                </div>
                <div className="bg-white/20 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border border-white/30">
                  {isIlmiahParticipant(selectedParticipant) ? "E-TICKET ILMIAH" : "E-TICKET PESTA RAKYAT"}
                </div>
              </div>
            </div>
            <div className="flex-1 px-6 pt-5 pb-4 flex flex-col bg-white text-center items-center justify-between">
              <div className="mb-2 w-full">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                  NAMA PESERTA
                </span>
                <h3 className="text-2xl font-black text-slate-900 leading-tight uppercase break-words">
                  {selectedParticipant.nama_lengkap}
                </h3>
                {selectedParticipant.institusi && selectedParticipant.institusi !== "-" && (
                  <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wide">
                    {selectedParticipant.institusi}
                  </p>
                )}
                {selectedParticipant.cabang_persadia && selectedParticipant.cabang_persadia !== "-" && (
                  <p className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full inline-block mt-1.5">
                    Cabang / Unit: {selectedParticipant.cabang_persadia}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap justify-center gap-2 mb-2 w-full">
                <div className="px-3.5 py-1 rounded-full border border-slate-300 text-[11px] font-black uppercase tracking-wider text-slate-700 bg-slate-50">
                  {selectedParticipant.kategori_peserta}
                </div>
                <div className="px-3.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-wider">
                  {isIlmiahParticipant(selectedParticipant)
                    ? "Sesi Ilmiah (Novotel)"
                    : "Pesta Rakyat (Pakansari)"}
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border-2 border-slate-900 flex flex-col items-center w-full max-w-[270px]">
                <QRCodeSVG
                  value={`${window.location.origin}/scanner.html?id=${selectedParticipant.no_registrasi}`}
                  size={200}
                  level="H"
                  includeMargin
                />
                <div className="mt-2 text-center border-t border-slate-200 pt-2 w-full">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    ID REGISTRASI
                  </span>
                  <strong className="text-base font-mono font-black text-slate-900 tracking-widest">
                    {selectedParticipant.no_registrasi}
                  </strong>
                </div>
              </div>

              <div className="text-[11px] text-slate-500">
                {isIlmiahParticipant(selectedParticipant)
                  ? "Sabtu, 7 November 2026 • Novotel Bogor Golf Resort"
                  : "Minggu, 8 November 2026 • Stadion Pakansari Cibinong"}
              </div>
            </div>
            <div className="bg-slate-900 text-white px-5 py-3 text-center">
              <p className="text-[10px] font-bold tracking-wider text-amber-400 uppercase">
                Simpan e-tiket ini di galeri HP Anda &amp; bawa saat acara.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
