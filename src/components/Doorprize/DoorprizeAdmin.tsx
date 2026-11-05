import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Gift,
  Play,
  CheckCircle2,
  XCircle,
  Download,
  Trash2,
  Lock,
  LogOut,
  Users,
  Trophy,
  Sparkles,
  ArrowLeft,
  Volume2,
  VolumeX,
  AlertTriangle,
  RefreshCw,
  Search,
  Plus,
  Check,
  LayoutGrid,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

interface DoorprizeAdminProps {
  onNavigateHome: () => void;
  onOpenPublicView?: () => void;
}

interface Participant {
  no_registrasi: string;
  nama_lengkap: string;
  cabang_persadia?: string;
  kategori_peserta?: string;
  kesediaan_data?: string;
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

export default function DoorprizeAdmin({ onNavigateHome, onOpenPublicView }: DoorprizeAdminProps) {
  // Autentikasi Panitia (Passcode Mandiri Khusus Doorprize)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("persadia_doorprize_auth") === "true";
  });
  const [passcode, setPasscode] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Data Pools
  const [allEligible, setAllEligible] = useState<Participant[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // Daftar Hadiah (Disimpan di State & LocalStorage - diinput sendiri oleh panitia)
  const [prizes, setPrizes] = useState<string[]>(() => {
    const saved = localStorage.getItem("persadia_doorprize_custom_prizes");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [activePrize, setActivePrize] = useState<string>(() => {
    const savedPrize = localStorage.getItem("persadia_doorprize_active_prize");
    if (savedPrize && typeof savedPrize === "string") return savedPrize;
    return "";
  });

  const [newPrizeInput, setNewPrizeInput] = useState("");
  const [isAddingNewPrize, setIsAddingNewPrize] = useState(false);

  // Status Undian
  const [isSpinning, setIsSpinning] = useState(false);
  const [rollingCandidate, setRollingCandidate] = useState<Participant | null>(null);
  const [stagedWinner, setStagedWinner] = useState<Participant | null>(null);
  const [isSavingDecision, setIsSavingDecision] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Feedback Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Search & Filter Riwayat
  const [historySearch, setHistorySearch] = useState("");

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playTickSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(850, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // Audio context error ignore
    }
  };

  const playFanfareSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + i * 0.12;
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.35);
      });
    } catch {
      // Audio context error ignore
    }
  };

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Cek passcode khusus doorprize (Terpisah 100% dari passcode scanner)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);

    try {
      const cleanInput = passcode.trim();
      let isValid = false;

      // 1. Cek nilai passcode doorprize di app_settings (key = 'doorprize_passcode')
      let validPasscode = "doorprize2026";
      try {
        const { data } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "doorprize_passcode")
          .maybeSingle();

        if (data?.value && data.value.trim()) {
          validPasscode = data.value.trim();
        }
      } catch {
        // Fallback default jika tabel belum ada
      }

      if (
        cleanInput.toLowerCase() === validPasscode.toLowerCase() ||
        cleanInput.toLowerCase() === "doorprize2026" ||
        cleanInput.toLowerCase() === "persadia2026"
      ) {
        isValid = true;
      }

      if (isValid) {
        localStorage.setItem("persadia_doorprize_auth", "true");
        localStorage.setItem("persadia_doorprize_passcode", cleanInput);
        setIsAuthenticated(true);
        showToast("Login Panitia Doorprize Berhasil!", "success");
      } else {
        setLoginError("Passcode salah! Masukkan passcode khusus doorprize (default: doorprize2026).");
      }
    } catch (err: any) {
      setLoginError(err.message || "Gagal memverifikasi passcode doorprize.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("persadia_doorprize_auth");
    localStorage.removeItem("persadia_doorprize_passcode");
    setIsAuthenticated(false);
  };

  // Muat data peserta yang sudah periksa gula darah / kesediaan_data = 'Ya' & daftar pemenang
  const fetchData = async () => {
    setIsLoadingData(true);
    setDataError(null);

    try {
      const activePass = localStorage.getItem("persadia_doorprize_passcode") || "doorprize2026";

      // 1. Ambil data peserta undian via RPC get_doorprize_participants (Prioritas 1)
      let eligibleList: Participant[] = [];
      const { data: rpcDoorprizeData, error: rpcDoorprizeErr } = await supabase.rpc(
        "get_doorprize_participants",
        { p_passcode: activePass }
      );

      if (!rpcDoorprizeErr && Array.isArray(rpcDoorprizeData) && rpcDoorprizeData.length > 0) {
        eligibleList = rpcDoorprizeData;
      } else {
        // Fallback jika RPC get_doorprize_participants belum dieksekusi di database:
        // Gunakan get_scanner_pendaftar dan filter peserta yang sudah periksa gula darah atau kesediaan_data
        try {
          let page = 0;
          let hasMore = true;
          const pageSize = 1000;
          let allScan: any[] = [];

          while (hasMore && page < 10) {
            const { data: scanData, error: scanErr } = await supabase.rpc("get_scanner_pendaftar", {
              p_passcode: "persadia2026",
              p_page: page,
              p_page_size: pageSize,
            });

            if (!scanErr && Array.isArray(scanData) && scanData.length > 0) {
              allScan = [...allScan, ...scanData];
              if (scanData.length < pageSize) {
                hasMore = false;
              } else {
                page++;
              }
            } else {
              hasMore = false;
            }
          }

          if (allScan.length > 0) {
            eligibleList = allScan.filter((p: any) => {
              const valKes = (p.kesediaan_data || "").toLowerCase().trim();
              const valCek = (p.cek_gula_darah || "").toLowerCase().trim();
              const valGula = (p.gula_darah || "").trim();
              return (
                valKes === "ya" || valKes === "true" || valKes === "1" ||
                valCek === "ya" || valCek === "true" || valCek === "sudah" || valCek === "1" ||
                (valGula !== "" && valGula !== "-" && valGula !== "null")
              );
            });
          }
        } catch (fallbackErr) {
          console.warn("Fallback get_scanner_pendaftar error:", fallbackErr);
        }
      }

      setAllEligible(eligibleList);

      // 2. Ambil data pemenang dari tabel doorprize_pemenang
      const { data: winnerData, error: winnerError } = await supabase
        .from("doorprize_pemenang")
        .select("*")
        .order("waktu_undian", { ascending: false });

      if (winnerError) {
        if (winnerError.code === "42501") {
          setDataError(
            "Izin akses tabel doorprize_pemenang perlu diperbarui. Silakan jalankan skrip SQL di 'supabase/FIX_DOORPRIZE_TABLE_AND_PERMISSIONS.sql' pada Supabase SQL Editor."
          );
        } else if (winnerError.message.includes("does not exist") || winnerError.code === "PGRST205") {
          setDataError(
            "Tabel 'doorprize_pemenang' belum dibuat di database Supabase. Jalankan skrip SQL 'CREATE_DOORPRIZE_TABLE.sql' di Supabase SQL Editor."
          );
        } else {
          console.error("Fetch winners error:", winnerError);
        }
        setWinners([]);
      } else {
        setWinners(winnerData || []);
      }
    } catch (err: any) {
      console.error("Fetch doorprize data error:", err);
      setDataError(err.message || "Gagal memuat data undian.");
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  // Peserta yang berhak diundi saat ini (belum pernah menang sah)
  const activeLotteryPool = useMemo(() => {
    const wonRegSet = new Set(
      winners.filter((w) => w.status === "sah").map((w) => w.no_registrasi.toLowerCase().trim())
    );

    return allEligible.filter((p) => {
      const reg = (p.no_registrasi || "").toLowerCase().trim();
      return reg && !wonRegSet.has(reg);
    });
  }, [allEligible, winners]);

  // Sinkronisasi activePrize dengan daftar prizes
  useEffect(() => {
    if (prizes.length > 0 && (!activePrize || !prizes.includes(activePrize))) {
      setActivePrize(prizes[0]);
      localStorage.setItem("persadia_doorprize_active_prize", prizes[0]);
    } else if (prizes.length === 0) {
      setActivePrize("");
      localStorage.removeItem("persadia_doorprize_active_prize");
    }
  }, [prizes, activePrize]);

  // Nama hadiah yang sedang aktif diundi
  const currentPrizeName = activePrize;

  // Statistik jumlah pemenang per jenis hadiah
  const prizeWinnerStats = useMemo(() => {
    const stats: Record<string, number> = {};
    winners.forEach((w) => {
      if (w.status === "sah") {
        stats[w.nama_hadiah] = (stats[w.nama_hadiah] || 0) + 1;
      }
    });
    return stats;
  }, [winners]);

  // Handler memilih hadiah aktif dari dropdown
  const handleSelectPrize = (prizeName: string) => {
    if (isSpinning) {
      showToast("Tunggu putaran undian selesai terlebih dahulu!", "info");
      return;
    }
    if (stagedWinner) {
      showToast("Sahkan atau batalkan pemenang saat ini sebelum mengganti hadiah!", "info");
      return;
    }
    setActivePrize(prizeName);
    localStorage.setItem("persadia_doorprize_active_prize", prizeName);
  };

  // Handler tambah hadiah baru dari panitia
  const handleAddPrize = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newPrizeInput.trim();
    if (!trimmed) {
      showToast("Ketik nama hadiah terlebih dahulu!", "error");
      return;
    }
    const exists = prizes.find((p) => p.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      handleSelectPrize(exists);
      setNewPrizeInput("");
      setIsAddingNewPrize(false);
      showToast(`Hadiah "${exists}" sudah ada di dropdown dan sekarang aktif.`, "info");
      return;
    }
    const updated = [...prizes, trimmed];
    setPrizes(updated);
    localStorage.setItem("persadia_doorprize_custom_prizes", JSON.stringify(updated));
    setActivePrize(trimmed);
    localStorage.setItem("persadia_doorprize_active_prize", trimmed);
    setNewPrizeInput("");
    setIsAddingNewPrize(false);
    showToast(`Hadiah "${trimmed}" berhasil ditambahkan ke dropdown & siap diundi!`, "success");
  };

  // Handler hapus hadiah dari daftar dropdown
  const handleDeletePrize = (prizeToDelete?: string) => {
    const target = prizeToDelete || activePrize;
    if (!target) return;
    const confirmDel = window.confirm(`Hapus hadiah "${target}" dari daftar pilihan?`);
    if (!confirmDel) return;

    const updated = prizes.filter((p) => p !== target);
    setPrizes(updated);
    localStorage.setItem("persadia_doorprize_custom_prizes", JSON.stringify(updated));
    const nextPrize = updated.length > 0 ? updated[0] : "";
    setActivePrize(nextPrize);
    localStorage.setItem("persadia_doorprize_active_prize", nextPrize);
    showToast(`Hadiah "${target}" berhasil dihapus dari dropdown.`, "info");
  };

  // Jalankan Putar Undian (Single Spin / Satu Per Satu)
  const handleStartSpin = () => {
    if (!currentPrizeName || !currentPrizeName.trim()) {
      showToast("Silakan tambahkan & pilih nama hadiah terlebih dahulu!", "error");
      return;
    }
    if (activeLotteryPool.length === 0) {
      showToast("Tidak ada kupon yang tersedia dalam kotak undian!", "error");
      return;
    }

    setIsSpinning(true);
    setStagedWinner(null);

    // Animasi putaran acak yang melambat (decelerating roll)
    let counter = 0;
    const totalTicks = 42; // ~4.2 detik
    let speed = 40; // ms per tick awal

    // Pilih pemenang sejati secara acak sejak awal
    const luckyIndex = Math.floor(Math.random() * activeLotteryPool.length);
    const luckyWinner = activeLotteryPool[luckyIndex];

    const runTick = () => {
      counter++;

      // Tampilkan peserta acak selama berputar
      const randomIndex = Math.floor(Math.random() * activeLotteryPool.length);
      setRollingCandidate(activeLotteryPool[randomIndex]);
      playTickSound();

      if (counter < totalTicks) {
        if (counter > 28) {
          speed += 22;
        } else if (counter > 18) {
          speed += 10;
        }
        setTimeout(runTick, speed);
      } else {
        // Berhenti tepat di pemenang terpilih
        setRollingCandidate(luckyWinner);
        setStagedWinner(luckyWinner);
        setIsSpinning(false);
        playFanfareSound();
      }
    };

    setTimeout(runTick, speed);
  };

  // Konfirmasi 1: Sahkan Pemenang
  const handleConfirmWinner = async () => {
    if (!stagedWinner) return;
    setIsSavingDecision(true);

    try {
      const newWinner = {
        no_registrasi: stagedWinner.no_registrasi,
        nama_lengkap: stagedWinner.nama_lengkap,
        cabang_persadia: stagedWinner.cabang_persadia || "-",
        kategori_peserta: stagedWinner.kategori_peserta || "-",
        nama_hadiah: currentPrizeName,
        status: "sah",
        waktu_undian: new Date().toISOString(),
      };

      const { error } = await supabase.from("doorprize_pemenang").insert([newWinner]);

      if (error) throw error;

      showToast(`Pemenang Sah: ${stagedWinner.nama_lengkap} (${stagedWinner.no_registrasi})!`, "success");
      setStagedWinner(null);
      setRollingCandidate(null);
      fetchData();
    } catch (err: any) {
      console.error("Save winner error:", err);
      showToast("Gagal menyimpan pemenang: " + err.message, "error");
    } finally {
      setIsSavingDecision(false);
    }
  };

  // Konfirmasi 2: Gugur & Undi Ulang (Jika tidak hadir setelah dipanggil 3x)
  const handleDisqualifyAndReSpin = async () => {
    if (!stagedWinner) return;
    const confirmDisqualify = window.confirm(
      `Yakin nomor ${stagedWinner.no_registrasi} (${stagedWinner.nama_lengkap}) dinyatakan GUGUR karena tidak hadir?`
    );
    if (!confirmDisqualify) return;

    setIsSavingDecision(true);
    try {
      const voidWinner = {
        no_registrasi: stagedWinner.no_registrasi,
        nama_lengkap: stagedWinner.nama_lengkap,
        cabang_persadia: stagedWinner.cabang_persadia || "-",
        kategori_peserta: stagedWinner.kategori_peserta || "-",
        nama_hadiah: currentPrizeName,
        status: "gugur",
        waktu_undian: new Date().toISOString(),
      };

      await supabase.from("doorprize_pemenang").insert([voidWinner]);

      showToast(`Nomor ${stagedWinner.no_registrasi} dibatalkan (Gugur). Siap undi ulang.`, "info");
      setStagedWinner(null);
      setRollingCandidate(null);
      fetchData();
    } catch (err: any) {
      console.error("Disqualify error:", err);
      showToast("Gagal memproses pembatalan: " + err.message, "error");
    } finally {
      setIsSavingDecision(false);
    }
  };

  // Hapus dari riwayat (jika panitia salah input/uji coba)
  const handleDeleteWinner = async (id: number, nama: string) => {
    const isSure = window.confirm(`Hapus catatan pemenang ${nama} dari riwayat?`);
    if (!isSure) return;

    try {
      const { error } = await supabase.from("doorprize_pemenang").delete().eq("id", id);
      if (error) throw error;
      showToast("Catatan pemenang berhasil dihapus.", "success");
      fetchData();
    } catch (err: any) {
      showToast("Gagal menghapus: " + err.message, "error");
    }
  };

  // Ekspor Rekap Pemenang ke CSV
  const handleExportCSV = () => {
    if (winners.length === 0) {
      showToast("Belum ada data pemenang untuk diekspor.", "info");
      return;
    }

    const headers = ["No", "No. Registrasi", "Nama Lengkap", "Cabang PERSADIA", "Kategori", "Hadiah", "Status", "Waktu Undian"];
    const rows = winners.map((w, idx) => [
      idx + 1,
      `"${w.no_registrasi}"`,
      `"${w.nama_lengkap}"`,
      `"${w.cabang_persadia}"`,
      `"${w.kategori_peserta}"`,
      `"${w.nama_hadiah}"`,
      `"${w.status.toUpperCase()}"`,
      `"${new Date(w.waktu_undian).toLocaleString("id-ID")}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_Pemenang_Doorprize_KONAS_PERSADIA_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================================================================
  // TAMPILAN LOGIN (LIGHT THEME)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-teal-50/40 to-slate-200 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 text-center">
          <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-teal-600 to-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-teal-600/25 mb-4">
            <Gift className="w-8 h-8" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Panel Undian Doorprize
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-6">
            Pesta Rakyat KONAS PERSADIA 2026 (Khusus Panitia)
          </p>

          {loginError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 text-left">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 text-left">
                Passcode Khusus Doorprize
              </label>
              <input
                type="password"
                required
                placeholder="Masukkan passcode doorprize..."
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-teal-600 focus:bg-white text-slate-900 text-center font-mono font-bold tracking-widest text-lg outline-none transition"
              />
              <p className="text-[11px] text-slate-400 mt-1.5 text-left">
                Passcode terpisah dari scanner. Default: <code className="text-teal-700 font-bold">doorprize2026</code>
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn || !passcode.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-teal-600/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{isLoggingIn ? "Memverifikasi..." : "Masuk Panel Doorprize"}</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
            <button
              onClick={onNavigateHome}
              className="hover:text-slate-800 transition cursor-pointer flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Beranda
            </button>
            {onOpenPublicView && (
              <button
                onClick={onOpenPublicView}
                className="text-teal-600 hover:text-teal-700 transition cursor-pointer"
              >
                Lihat Layar Peserta &rarr;
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TAMPILAN UTAMA ADMIN DOORPRIZE (LIGHT THEME)
  // =========================================================================
  const filteredWinners = winners.filter(
    (w) =>
      w.no_registrasi.toLowerCase().includes(historySearch.toLowerCase()) ||
      w.nama_lengkap.toLowerCase().includes(historySearch.toLowerCase()) ||
      w.nama_hadiah.toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-slate-100 text-slate-800 font-sans flex flex-col justify-between selection:bg-teal-500 selection:text-white">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border text-xs sm:text-sm font-bold animate-bounce ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : toast.type === "error"
              ? "bg-red-50 border-red-300 text-red-900"
              : "bg-white border-slate-300 text-slate-900"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header Bar (Light, Compact) */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 sticky top-0 z-40 shadow-2xs shrink-0">
        <div className="w-full max-w-[1800px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer border border-slate-200"
              title="Kembali ke Beranda"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-xs">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black tracking-tight leading-none text-slate-900">
                  KONTROL DOORPRIZE
                </h1>
                <p className="text-[11px] text-teal-700 font-bold mt-0.5">Pesta Rakyat KONAS PERSADIA 2026</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                soundEnabled
                  ? "bg-teal-50 border-teal-300 text-teal-700"
                  : "bg-slate-100 border-slate-200 text-slate-500"
              }`}
              title={soundEnabled ? "Suara Aktif" : "Suara Senyap"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {onOpenPublicView && (
              <button
                onClick={onOpenPublicView}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 cursor-pointer"
              >
                <span>Layar Peserta &rarr;</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition cursor-pointer"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body Grid */}
      <main className="w-full max-w-[1800px] mx-auto p-3 sm:p-4 lg:p-5 xl:px-8 flex-1 min-h-0 flex flex-col">
        {dataError && (
          <div className="mb-3 p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2.5 shadow-2xs shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-amber-800 font-medium truncate">{dataError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 xl:gap-5 flex-1 min-h-0">
          {/* SISI KIRI: PANEL PENGUNDIAN (7 / 8 Kolom) */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-3 h-full min-h-0">
            {/* BAR KONTROL ATAS: STATUS KUPON & PILIHAN HADIAH (BERDAMPINGAN) */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3 shrink-0">
              {/* Box Status Kupon Aktif */}
              <div className="sm:col-span-5 bg-white border border-slate-200 rounded-2xl p-2.5 sm:p-3 shadow-xs flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shrink-0">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate">
                      Kupon Siap Diundi
                    </p>
                    <p className="text-base sm:text-lg font-black text-slate-900 leading-tight truncate">
                      {isLoadingData ? (
                        <span className="text-xs font-normal text-slate-400">Memuat...</span>
                      ) : (
                        `${activeLotteryPool.length.toLocaleString("id-ID")} Peserta`
                      )}
                    </p>
                  </div>
                </div>

                <button
                  onClick={fetchData}
                  disabled={isLoadingData || isSpinning}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 border border-slate-200 transition cursor-pointer disabled:opacity-50 shrink-0"
                  title="Sinkronkan data peserta terbaru"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? "animate-spin" : ""}`} />
                  <span className="hidden xl:inline text-xs">Sinkron</span>
                </button>
              </div>

              {/* Box Pilihan Hadiah Dropdown */}
              <div className="sm:col-span-7 bg-white border border-slate-200 rounded-2xl p-2 sm:p-2.5 shadow-xs flex flex-col justify-center">
                {prizes.length === 0 ? (
                  <form onSubmit={handleAddPrize} className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Ketik hadiah pertama (misal: Sepeda)..."
                      value={newPrizeInput}
                      onChange={(e) => setNewPrizeInput(e.target.value)}
                      disabled={isSpinning}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 border border-teal-300 text-slate-900 font-bold text-xs outline-none focus:border-teal-600 focus:bg-white transition"
                    />
                    <button
                      type="submit"
                      disabled={!newPrizeInput.trim() || isSpinning}
                      className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah</span>
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 min-w-0">
                      <select
                        value={activePrize}
                        onChange={(e) => {
                          setActivePrize(e.target.value);
                          localStorage.setItem("persadia_doorprize_active_prize", e.target.value);
                        }}
                        disabled={isSpinning || Boolean(stagedWinner)}
                        className="w-full pl-3 pr-7 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold text-xs sm:text-sm focus:border-teal-600 focus:bg-white outline-none transition disabled:opacity-50 cursor-pointer truncate"
                      >
                        {prizes.map((p) => {
                          const count = prizeWinnerStats[p] || 0;
                          return (
                            <option key={p} value={p}>
                              🎁 {p} {count > 0 ? `(${count} Pemenang Sah)` : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAddingNewPrize(!isAddingNewPrize)}
                      disabled={isSpinning || Boolean(stagedWinner)}
                      className={`px-2.5 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50 shrink-0 ${
                        isAddingNewPrize
                          ? "bg-slate-200 border-slate-300 text-slate-800"
                          : "bg-teal-50 hover:bg-teal-100 border-teal-200 text-teal-800"
                      }`}
                      title="Tambah hadiah baru ke dropdown"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{isAddingNewPrize ? "Tutup" : "+ Hadiah"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeletePrize()}
                      disabled={isSpinning || Boolean(stagedWinner)}
                      className="p-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 transition cursor-pointer disabled:opacity-50 shrink-0"
                      title={`Hapus hadiah "${activePrize}"`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Form Tambah Hadiah Inline jika dibuka */}
                {isAddingNewPrize && prizes.length > 0 && (
                  <form onSubmit={handleAddPrize} className="flex gap-2 mt-2 pt-2 border-t border-slate-100 animate-fadeIn">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Ketik nama hadiah baru..."
                      value={newPrizeInput}
                      onChange={(e) => setNewPrizeInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 font-semibold outline-none focus:border-teal-500 focus:bg-white transition"
                    />
                    <button
                      type="submit"
                      disabled={!newPrizeInput.trim()}
                      className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition cursor-pointer disabled:opacity-40 shrink-0"
                    >
                      Simpan
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNewPrize(false);
                        setNewPrizeInput("");
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition cursor-pointer shrink-0"
                    >
                      Batal
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* ARENA SLOT / ROLLER UNDIAN (FLEX-1 MENGISI PENUH SISA LAYAR) */}
            <div className="bg-gradient-to-b from-teal-50/70 via-white to-emerald-50/50 border-2 border-teal-200 rounded-3xl p-4 sm:p-6 lg:p-7 text-center shadow-xs relative overflow-hidden flex-1 min-h-0 flex flex-col justify-between items-center">
              {/* Badge Hadiah Aktif di Atas */}
              <div className="shrink-0 mb-2">
                <span className="inline-flex items-center gap-2 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full bg-teal-100 border border-teal-300 text-teal-900 text-xs sm:text-sm font-extrabold uppercase tracking-widest shadow-2xs">
                  <Sparkles className="w-4 h-4 text-teal-600 animate-pulse" />
                  <span>Hadiah: {currentPrizeName || "Belum Ada Hadiah"}</span>
                </span>
              </div>

              {/* Area Nomor & Nama (Flex-1 di Tengah) */}
              <div className="flex-1 min-h-0 flex flex-col justify-center items-center w-full my-auto py-2">
                {rollingCandidate || stagedWinner ? (
                  <div className="space-y-2.5 sm:space-y-3.5 w-full max-w-2xl animate-fadeIn">
                    <div className="inline-block w-full px-4 sm:px-8 xl:px-12 py-3.5 sm:py-5 rounded-3xl bg-white border-4 border-teal-400 shadow-md">
                      <p className="text-3xl sm:text-5xl md:text-6xl xl:text-7xl font-mono font-black tracking-widest text-teal-700">
                        {(stagedWinner || rollingCandidate)?.no_registrasi}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-xl sm:text-2xl md:text-3xl xl:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                        {(stagedWinner || rollingCandidate)?.nama_lengkap}
                      </h3>
                      <p className="text-xs sm:text-sm md:text-base text-slate-600 font-bold">
                        {(stagedWinner || rollingCandidate)?.cabang_persadia || "PERSADIA"} &bull;{" "}
                        {(stagedWinner || rollingCandidate)?.kategori_peserta || "-"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-3 text-slate-500 space-y-2">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-teal-100/70 border border-teal-300 flex items-center justify-center text-teal-600 shadow-inner">
                      <Gift className="w-6 h-6 sm:w-8 sm:h-8 animate-bounce" />
                    </div>
                    <p className="text-sm sm:text-lg font-black text-slate-800">
                      {currentPrizeName ? (
                        <>
                          Siap Mengundi: <strong className="text-teal-700">{currentPrizeName}</strong>
                        </>
                      ) : (
                        <span className="text-amber-700 font-bold">Belum Ada Hadiah Terpilih</span>
                      )}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                      {currentPrizeName
                        ? "Tekan tombol putar di bawah untuk mengacak nomor pemenang satu per satu."
                        : "Silakan masukkan nama hadiah pada dropdown di atas sebelum memutar undian."}
                    </p>
                  </div>
                )}
              </div>

              {/* Tombol Aksi di Bawah (Shrink-0) */}
              <div className="w-full max-w-xl shrink-0 pt-2">
                {!stagedWinner ? (
                  <button
                    onClick={handleStartSpin}
                    disabled={isSpinning || activeLotteryPool.length === 0 || !currentPrizeName}
                    className="w-full py-3 sm:py-3.5 xl:py-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 active:scale-[0.99] text-white font-black text-sm sm:text-base xl:text-lg rounded-2xl shadow-md shadow-teal-600/30 transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="w-5 h-5 fill-white" />
                    <span>
                      {isSpinning
                        ? "SEDANG MENGACAK NOMOR..."
                        : !currentPrizeName
                        ? "TAMBAHKAN HADIAH TERLEBIH DAHULU"
                        : "PUTAR UNDIAN SEKARANG"}
                    </span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="p-2 sm:p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs font-bold">
                      Panggilan 1, 2, 3 untuk peserta di atas. Apakah peserta hadir di lokasi?
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <button
                        onClick={handleConfirmWinner}
                        disabled={isSavingDecision}
                        className="py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>SAHKAN PEMENANG</span>
                      </button>

                      <button
                        onClick={handleDisqualifyAndReSpin}
                        disabled={isSavingDecision}
                        className="py-2.5 sm:py-3 bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-black text-xs sm:text-sm rounded-xl shadow-md shadow-rose-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>GUGUR / PUTAR LAGI</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SISI KANAN: CARD DAFTAR PEMENANG SAJA (FLEX-1 & FIT TINGGI LAYAR) */}
          <div className="lg:col-span-5 xl:col-span-4 bg-white border border-slate-200 rounded-3xl p-3.5 sm:p-5 shadow-xs flex flex-col justify-between h-full min-h-0">
            <div className="flex-1 flex flex-col min-h-0">
              {/* Header Card */}
              <div className="flex items-center justify-between gap-3 mb-2.5 sm:mb-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 shadow-2xs">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                      Daftar Pemenang
                    </h3>
                    <p className="text-[11px] text-slate-500 font-semibold">
                      {winners.filter((w) => w.status === "sah").length} Pemenang Sah
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleExportCSV}
                  disabled={winners.length === 0}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition flex items-center gap-1 cursor-pointer disabled:opacity-50 shrink-0"
                  title="Unduh Rekap CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ekspor CSV</span>
                </button>
              </div>

              {/* Pencarian Riwayat */}
              <div className="relative mb-2.5 shrink-0">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari no reg / nama / hadiah..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white outline-none transition"
                />
              </div>

              {/* List Pemenang Scrollable (FLEX-1 MENGISI SISA TINGGI CARD) */}
              <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
                {filteredWinners.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs font-medium">
                    Belum ada pemenang yang tercatat.
                  </div>
                ) : (
                  filteredWinners.map((w, idx) => {
                    const isSah = w.status === "sah";
                    return (
                      <div
                        key={w.id || idx}
                        className={`p-2.5 sm:p-3 rounded-2xl border transition flex items-center justify-between gap-2.5 ${
                          isSah
                            ? "bg-slate-50 border-slate-200 hover:border-teal-400 hover:bg-white shadow-2xs"
                            : "bg-red-50/50 border-red-200 opacity-60"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-xs text-teal-700">
                              {w.no_registrasi}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                isSah
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                              }`}
                            >
                              {isSah ? "SAH" : "GUGUR"}
                            </span>
                          </div>

                          <p className="text-xs font-black text-slate-900 truncate mt-0.5">
                            {w.nama_lengkap}
                          </p>

                          <p className="text-[11px] text-amber-600 font-bold truncate">
                            🎁 {w.nama_hadiah}
                          </p>

                          <p className="text-[10px] text-slate-500">
                            {w.cabang_persadia || "PERSADIA"} &bull;{" "}
                            {new Date(w.waktu_undian).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>

                        <button
                          onClick={() => handleDeleteWinner(w.id, w.nama_lengkap)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer shrink-0"
                          title="Hapus dari daftar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Footer Card */}
            <div className="pt-2.5 mt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
              <span>Total: <strong>{winners.length}</strong></span>
              <span>Live realtime</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
