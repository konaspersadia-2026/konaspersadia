import React, { useState, useEffect, useMemo } from "react";
import {
  Gift,
  Trophy,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
  RefreshCw,
  QrCode,
  PartyPopper,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";

interface DoorprizeViewProps {
  onNavigateHome: () => void;
  onOpenTicket?: () => void;
}

interface Winner {
  id: number;
  no_registrasi: string;
  nama_lengkap: string;
  cabang_persadia: string;
  kategori_peserta: string;
  nama_hadiah: string;
  status: "sah" | "gugur";
  waktu_undian: string;
}

interface CheckResult {
  status: "winner" | "eligible" | "ineligible" | "not_found";
  no_registrasi?: string;
  nama_lengkap?: string;
  cabang_persadia?: string;
  nama_hadiah?: string;
  message?: string;
}

export default function DoorprizeView({ onNavigateHome, onOpenTicket }: DoorprizeViewProps) {
  // Data Pemenang
  const [winners, setWinners] = useState<Winner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Cek Status Kupon Saya
  const [checkInput, setCheckInput] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);

  // Pencarian Daftar Pemenang
  const [searchFilter, setSearchFilter] = useState("");

  // Ambil data pemenang yang berstatus 'sah'
  const fetchWinners = async () => {
    try {
      const { data, error } = await supabase
        .from("doorprize_pemenang")
        .select("*")
        .eq("status", "sah")
        .order("waktu_undian", { ascending: false });

      if (!error && data) {
        setWinners(data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Error fetching doorprize winners:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWinners();

    // 1. Supabase Realtime Listener
    let channel: any = null;
    if (isSupabaseConfigured) {
      channel = supabase
        .channel("public-doorprize-updates")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "doorprize_pemenang" },
          () => {
            fetchWinners();
          }
        )
        .subscribe();
    }

    // 2. Fallback polling setiap 6 detik (aman saat sinyal lapangan berfluktuasi)
    const interval = setInterval(() => {
      fetchWinners();
    }, 6000);

    return () => {
      if (channel) supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  // Pemenang paling terakhir / terkini
  const latestWinner = useMemo(() => {
    return winners.length > 0 ? winners[0] : null;
  }, [winners]);

  // Handler Pengecekan Kupon Mandiri oleh Peserta
  const handleCheckKupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = checkInput.trim();
    if (!query || query.length < 3) {
      alert("Masukkan minimal 3 karakter nomor registrasi atau nomor WhatsApp Anda.");
      return;
    }

    setIsChecking(true);
    setCheckResult(null);

    try {
      const queryLower = query.toLowerCase();

      // 1. Cek apakah nomor ini sudah ada di daftar pemenang yang SAH
      const winningMatch = winners.find(
        (w) =>
          w.no_registrasi.toLowerCase() === queryLower ||
          w.nama_lengkap.toLowerCase().includes(queryLower)
      );

      if (winningMatch) {
        setCheckResult({
          status: "winner",
          no_registrasi: winningMatch.no_registrasi,
          nama_lengkap: winningMatch.nama_lengkap,
          cabang_persadia: winningMatch.cabang_persadia,
          nama_hadiah: winningMatch.nama_hadiah,
        });
        setIsChecking(false);
        return;
      }

      // 2. Cek status keaktifan kupon lewat RPC cek_kupon_doorprize
      try {
        const { data: kuponData, error: kuponErr } = await supabase.rpc("cek_kupon_doorprize", {
          p_no_registrasi: query,
        });

        if (!kuponErr && Array.isArray(kuponData) && kuponData.length > 0) {
          const row = kuponData[0];
          const isAktif = Boolean(row.kupon_aktif ?? row.kesediaan_rekam_medis);
          if (isAktif) {
            setCheckResult({
              status: "eligible",
              no_registrasi: row.no_registrasi,
              nama_lengkap: row.nama_lengkap,
              cabang_persadia: row.cabang_persadia,
            });
          } else {
            setCheckResult({
              status: "ineligible",
              no_registrasi: row.no_registrasi,
              nama_lengkap: row.nama_lengkap,
              cabang_persadia: row.cabang_persadia,
            });
          }
          setIsChecking(false);
          return;
        }
      } catch {
        // Fallback jika RPC cek_kupon_doorprize belum ada
      }

      // 3. Fallback lewat cari_tiket_peserta
      const { data: ticketData, error: ticketErr } = await supabase.rpc("cari_tiket_peserta", {
        p_keyword: query,
        p_nama: "",
      });

      if (!ticketErr && Array.isArray(ticketData) && ticketData.length > 0) {
        const p = ticketData[0];
        setCheckResult({
          status: "eligible",
          no_registrasi: p.no_registrasi,
          nama_lengkap: p.nama_lengkap,
          cabang_persadia: p.cabang_persadia,
          message:
            "Nomor registrasi terdaftar. Pastikan Anda telah melakukan pemeriksaan di pos kesehatan agar nomor Anda sah masuk undian.",
        });
      } else {
        setCheckResult({
          status: "not_found",
          message:
            "Nomor registrasi tidak ditemukan. Pastikan nomor yang dimasukkan sudah sesuai dengan e-tiket Anda.",
        });
      }
    } catch (err: any) {
      console.error("Check kupon error:", err);
      setCheckResult({
        status: "not_found",
        message: "Terjadi gangguan jaringan saat memverifikasi kupon. Silakan coba lagi.",
      });
    } finally {
      setIsChecking(false);
    }
  };

  // Filter list pemenang
  const filteredWinners = winners.filter(
    (w) =>
      w.no_registrasi.toLowerCase().includes(searchFilter.toLowerCase()) ||
      w.nama_lengkap.toLowerCase().includes(searchFilter.toLowerCase()) ||
      w.cabang_persadia.toLowerCase().includes(searchFilter.toLowerCase()) ||
      w.nama_hadiah.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between selection:bg-teal-500 selection:text-white">
      {/* Top Navbar Header (Light Theme) */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3.5 sticky top-0 z-40 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={onNavigateHome}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold border border-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Beranda</span>
          </button>

          <div className="flex items-center gap-2 text-center">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0">
              <Gift className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-900 leading-none">
                DOORPRIZE PESTA RAKYAT
              </h1>
              <p className="text-[10px] text-teal-700 font-bold mt-0.5">
                KONAS PERSADIA 2026 &bull; Stadion Pakansari
              </p>
            </div>
          </div>

          {onOpenTicket && (
            <button
              onClick={onOpenTicket}
              className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold border border-teal-200 transition flex items-center gap-1 cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">E-Tiket</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto w-full p-4 sm:p-6 flex-1 space-y-6">
        {/* BANNER UTAMA / PEMENANG TERAKHIR (LIGHT THEME) */}
        {latestWinner ? (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-white border-2 border-amber-300 p-5 sm:p-7 shadow-xl text-center">
            <div className="absolute top-0 right-0 p-3 opacity-15 pointer-events-none">
              <PartyPopper className="w-24 h-24 text-amber-500" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-xs font-extrabold uppercase tracking-wider mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-spin" />
              Pemenang Terbaru Disahkan
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              {latestWinner.nama_lengkap}
            </h2>

            <div className="inline-block my-2 px-5 py-1.5 rounded-xl bg-white border-2 border-amber-300 shadow-xs font-mono font-black text-amber-700 text-lg sm:text-xl tracking-widest">
              {latestWinner.no_registrasi}
            </div>

            <p className="text-sm sm:text-base font-extrabold text-teal-800 mt-1">
              🎁 Memenangkan: <strong className="text-teal-700">{latestWinner.nama_hadiah}</strong>
            </p>

            <p className="text-xs text-slate-500 mt-1">
              Kontingen: <strong>{latestWinner.cabang_persadia || "PERSADIA"}</strong> &bull;{" "}
              {new Date(latestWinner.waktu_undian).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              WIB
            </p>

            <div className="mt-3.5 pt-3 border-t border-amber-200 text-[11px] text-amber-900 font-semibold">
              Silakan pemenang segera menuju meja panitia panggung utama dengan membawa e-tiket &amp; identitas.
            </div>
          </div>
        ) : (
          <div className="rounded-3xl bg-white border border-slate-200 p-6 text-center space-y-2 shadow-sm">
            <Gift className="w-12 h-12 mx-auto text-teal-600 animate-bounce" />
            <h3 className="text-lg font-bold text-slate-900">Sesi Pengundian Doorprize</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Pengundian doorprize satu per satu dilakukan langsung dari panggung utama. Seluruh nomor
              pemenang yang disahkan akan otomatis muncul di halaman ini secara *realtime*.
            </p>
          </div>
        )}

        {/* KOTAK CEK STATUS KUPON SAYA (LIGHT THEME) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shrink-0">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                Cek Status Kupon Doorprize Saya
              </h3>
              <p className="text-[11px] text-slate-500">
                Ketik Nomor Registrasi Anda untuk mengetahui apakah kupon Anda sudah aktif / menang
              </p>
            </div>
          </div>

          <form onSubmit={handleCheckKupon} className="flex flex-col sm:flex-row gap-2.5 mt-3">
            <input
              type="text"
              required
              placeholder="Contoh: PR-0123 atau KNS2026-..."
              value={checkInput}
              onChange={(e) => setCheckInput(e.target.value)}
              className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-300 text-slate-900 font-mono font-bold text-sm focus:border-teal-600 focus:bg-white outline-none uppercase placeholder:font-sans placeholder:normal-case placeholder:text-slate-400 transition"
            />
            <button
              type="submit"
              disabled={isChecking || !checkInput.trim()}
              className="px-5 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white font-black text-xs sm:text-sm shadow-md shadow-teal-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              <span>{isChecking ? "Memeriksa..." : "Cek Kupon"}</span>
            </button>
          </form>

          {/* HASIL PENGECEKAN KUPON (LIGHT THEME) */}
          {checkResult && (
            <div className="mt-4 animate-fadeIn">
              {checkResult.status === "winner" && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-100/80 via-orange-50 to-amber-50 border-2 border-amber-400 text-center space-y-1.5 shadow-md">
                  <span className="text-3xl">🎉</span>
                  <h4 className="text-lg font-black text-amber-900">
                    SELAMAT! ANDA MEMENANGKAN DOORPRIZE!
                  </h4>
                  <p className="text-sm font-bold text-slate-900">{checkResult.nama_lengkap}</p>
                  <p className="text-xs font-mono font-bold text-amber-800">
                    No. Registrasi: {checkResult.no_registrasi}
                  </p>
                  <div className="inline-block px-4 py-1.5 bg-amber-500 text-white font-black text-sm rounded-xl my-1 shadow-xs">
                    🎁 {checkResult.nama_hadiah}
                  </div>
                  <p className="text-xs text-amber-950 font-semibold pt-1">
                    Silakan segera tunjukkan layar HP ini dan e-tiket Anda ke meja panitia di panggung utama untuk klaim hadiah!
                  </p>
                </div>
              )}

              {checkResult.status === "eligible" && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                      Kupon Doorprize Anda: AKTIF &amp; SAH
                    </h4>
                    <p className="text-xs text-slate-900 font-bold mt-0.5">
                      {checkResult.nama_lengkap} ({checkResult.no_registrasi}) &bull;{" "}
                      {checkResult.cabang_persadia || "PERSADIA"}
                    </p>
                    <p className="text-xs text-emerald-800 mt-1">
                      Persetujuan rekam medis di pos pemeriksaan kesehatan telah tercatat. Nomor Anda sudah
                      masuk dalam kotak undian. Semoga beruntung!
                    </p>
                  </div>
                </div>
              )}

              {checkResult.status === "ineligible" && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                      Kupon Belum Aktif
                    </h4>
                    <p className="text-xs text-slate-900 font-bold mt-0.5">
                      {checkResult.nama_lengkap} ({checkResult.no_registrasi})
                    </p>
                    <p className="text-xs text-amber-900 mt-1">
                      Anda belum melakukan pemeriksaan kesehatan atau belum menyetujui pernyataan rekam medis di pos scanner.
                      <strong> Segera kunjungi tenda pos skrining kesehatan</strong> agar kupon doorprize Anda aktif dan berhak ikut diundi!
                    </p>
                  </div>
                </div>
              )}

              {checkResult.status === "not_found" && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{checkResult.message}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* DAFTAR SELURUH PEMENANG SAH (LIGHT THEME) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-black text-slate-900">Daftar Pemenang Sah</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-xs font-bold">
                {winners.length} Pemenang
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchWinners}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer border border-slate-200"
                title="Perbarui daftar"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              </button>
              <span className="text-[10px] text-slate-400 font-semibold">
                Update: {lastUpdated.toLocaleTimeString("id-ID")}
              </span>
            </div>
          </div>

          {/* Kotak Filter */}
          <div className="relative mb-3.5">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari nama pemenang / no registrasi / hadiah..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:bg-white outline-none transition"
            />
          </div>

          {/* Tabel / Kartu Pemenang */}
          {filteredWinners.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs font-medium">
              {winners.length === 0
                ? "Belum ada pemenang yang disahkan. Pantau terus panggung utama!"
                : "Tidak ada pemenang yang cocok dengan pencarian."}
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredWinners.map((w, idx) => (
                <div
                  key={w.id || idx}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-300 hover:bg-white transition flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-teal-700">
                        {w.no_registrasi}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        &bull; {w.cabang_persadia || "PERSADIA"}
                      </span>
                    </div>
                    <p className="text-sm font-black text-slate-900 truncate mt-0.5">
                      {w.nama_lengkap}
                    </p>
                  </div>

                  <div className="sm:text-right shrink-0">
                    <div className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      <span>🎁 {w.nama_hadiah}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                      {new Date(w.waktu_undian).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      WIB
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer Info (Light) */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-400">
        <p>&copy; 2026 Panitia Pelaksana KONAS PERSADIA 2026. Seluruh hak cipta dilindungi.</p>
      </footer>
    </div>
  );
}
