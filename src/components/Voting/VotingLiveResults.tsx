import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  Vote, Award, Users, CheckCircle, Clock, ShieldCheck,
  Maximize2, Minimize2, RefreshCw, ArrowLeft, Sparkles, Loader2,
  Scale
} from 'lucide-react';

interface VotingLiveResultsProps {
  onBackToAdmin: () => void;
}

interface CandidateResult {
  id: number;
  nomor_urut: number;
  nama_kandidat: string;
  gelar?: string | null;
  institusi?: string | null;
  foto_url?: string | null;
  cv_url?: string | null;
  ringkasan_cv?: string | null;
  total_suara: number;
  persentase: number;
}

interface RekapData {
  total_dpt: number;
  total_suara_masuk: number;
  belum_memilih: number;
  persentase_partisipasi: number;
  status_pemilihan: 'draft' | 'open' | 'closed';
  tampilkan_quick_count: boolean;
  putaran_voting?: string;
  kandidat_putaran_2?: number[];
  kandidat: CandidateResult[];
}

export default function VotingLiveResults({ onBackToAdmin }: VotingLiveResultsProps) {
  const [rekap, setRekap] = useState<RekapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchLiveResults = async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase.rpc('get_voting_rekapitulasi');
      if (!error && data) {
        setRekap(data);
        setLastRefreshed(new Date());
      }
    } catch (err: any) {
      console.error("Gagal refresh live results:", err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh setiap 4 detik untuk update proyektor otomatis
  useEffect(() => {
    fetchLiveResults();
    const interval = setInterval(fetchLiveResults, 4000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Deteksi hasil suara terbanyak dan suara seri (Draw / Tie)
  const sortedCandidates = rekap?.kandidat && rekap.kandidat.length > 0
    ? [...rekap.kandidat].sort((a, b) => b.total_suara - a.total_suara)
    : [];

  const highestVotes = sortedCandidates.length > 0 ? sortedCandidates[0].total_suara : 0;
  const topTiedCandidates = sortedCandidates.filter(c => c.total_suara === highestVotes && c.total_suara > 0);
  const isTie = topTiedCandidates.length >= 2;
  const isClosed = rekap?.status_pemilihan === 'closed';
  const isWinnerDecided = isClosed && !isTie && highestVotes > 0;
  const winnerCandidate = isWinnerDecided ? sortedCandidates[0] : null;
  const isRound2 = rekap?.putaran_voting === '2';

  // Penyesuaian ukuran responsif otomatis berdasarkan jumlah kandidat & ukuran layar
  const candidateCount = rekap?.kandidat?.length || 0;

  const getResponsiveStyles = () => {
    if (candidateCount <= 1) {
      return {
        gridContainer: "flex flex-wrap justify-center items-center gap-6 sm:gap-8 w-full max-h-full",
        card: "w-full max-w-[380px] lg:max-w-[420px] p-5 sm:p-6 lg:p-7 space-y-3.5 sm:space-y-4 shadow-xl",
        photoBox: "w-36 h-44 sm:w-44 sm:h-52",
        photoIcon: "w-16 h-16",
        badgeNumber: "w-10 h-10 sm:w-11 sm:h-11 text-sm sm:text-base -top-2.5 -left-2.5 sm:-top-3 sm:-left-3",
        nameText: "text-base sm:text-xl font-black",
        gelarText: "text-xs sm:text-sm",
        institusiText: "text-xs",
        voteCountText: "text-4xl sm:text-5xl",
        voteLabelText: "text-xs",
        percentBadge: "px-3.5 py-1 text-xs sm:text-sm",
        voteBoxPadding: "p-3.5 sm:p-4 lg:p-5 space-y-2",
        progressBarHeight: "h-3.5",
      };
    }
    if (candidateCount === 2) {
      return {
        gridContainer: "flex flex-wrap justify-center items-center gap-4 sm:gap-6 lg:gap-8 w-full max-h-full",
        card: "flex-1 min-w-[260px] max-w-[340px] lg:max-w-[390px] p-4 sm:p-5 lg:p-6 space-y-3 sm:space-y-4 shadow-lg",
        photoBox: "w-32 h-40 sm:w-36 sm:h-44 lg:w-40 lg:h-48",
        photoIcon: "w-14 h-14",
        badgeNumber: "w-9 h-9 sm:w-10 sm:h-10 text-xs sm:text-sm -top-2 -left-2 sm:-top-2.5 sm:-left-2.5",
        nameText: "text-sm sm:text-lg font-black",
        gelarText: "text-xs sm:text-sm",
        institusiText: "text-xs",
        voteCountText: "text-3xl sm:text-4xl lg:text-5xl",
        voteLabelText: "text-xs",
        percentBadge: "px-3 py-0.5 text-xs sm:text-sm",
        voteBoxPadding: "p-3 sm:p-4 space-y-1.5 sm:space-y-2",
        progressBarHeight: "h-3",
      };
    }
    if (candidateCount === 3) {
      return {
        gridContainer: "flex flex-wrap justify-center items-center gap-3 sm:gap-4 lg:gap-6 w-full max-h-full",
        card: "flex-1 min-w-[200px] max-w-[280px] lg:max-w-[320px] p-3 sm:p-4 space-y-2.5 shadow-md",
        photoBox: "w-24 h-32 sm:w-28 sm:h-36 lg:w-30 lg:h-40",
        photoIcon: "w-10 h-10",
        badgeNumber: "w-7 h-7 sm:w-8 sm:h-8 text-xs -top-1.5 -left-1.5 sm:-top-2 sm:-left-2",
        nameText: "text-xs sm:text-sm lg:text-base font-black",
        gelarText: "text-[11px] sm:text-xs",
        institusiText: "text-[10px]",
        voteCountText: "text-2xl sm:text-3xl lg:text-4xl",
        voteLabelText: "text-[10px] sm:text-xs",
        percentBadge: "px-2.5 py-0.5 text-[11px] sm:text-xs",
        voteBoxPadding: "p-2.5 sm:p-3 space-y-1 sm:space-y-1.5",
        progressBarHeight: "h-2.5",
      };
    }
    if (candidateCount === 4) {
      return {
        gridContainer: "flex flex-wrap justify-center items-center gap-2 sm:gap-3 lg:gap-4 w-full max-h-full",
        card: "flex-1 min-w-[170px] max-w-[230px] lg:max-w-[260px] p-2.5 sm:p-3 space-y-2 shadow-sm",
        photoBox: "w-20 h-26 sm:w-22 sm:h-30 lg:w-24 lg:h-34",
        photoIcon: "w-8 h-8",
        badgeNumber: "w-6 h-6 sm:w-7 sm:h-7 text-[11px] -top-1.5 -left-1.5",
        nameText: "text-xs sm:text-sm font-black",
        gelarText: "text-[10px] sm:text-[11px]",
        institusiText: "text-[9px]",
        voteCountText: "text-xl sm:text-2xl lg:text-3xl",
        voteLabelText: "text-[9px] sm:text-[10px]",
        percentBadge: "px-2 py-0.5 text-[10px] sm:text-[11px]",
        voteBoxPadding: "p-2 sm:p-2.5 space-y-1",
        progressBarHeight: "h-2",
      };
    }
    // 5 kandidat atau lebih
    return {
      gridContainer: "flex flex-wrap justify-center items-center gap-2 sm:gap-2.5 w-full max-h-full",
      card: "flex-1 min-w-[140px] max-w-[190px] lg:max-w-[220px] p-2 sm:p-2.5 space-y-1.5 shadow-sm",
      photoBox: "w-16 h-20 sm:w-18 sm:h-24 lg:w-20 lg:h-28",
      photoIcon: "w-6 h-6",
      badgeNumber: "w-6 h-6 text-[10px] -top-1 -left-1",
      nameText: "text-[11px] sm:text-xs font-black",
      gelarText: "text-[9px] sm:text-[10px]",
      institusiText: "text-[8px]",
      voteCountText: "text-lg sm:text-xl lg:text-2xl",
      voteLabelText: "text-[8px] sm:text-[9px]",
      percentBadge: "px-1.5 py-0.5 text-[9px] sm:text-[10px]",
      voteBoxPadding: "p-1.5 sm:p-2 space-y-0.5",
      progressBarHeight: "h-1.5",
    };
  };

  const sz = getResponsiveStyles();

  return (
    <div className="h-screen max-h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 flex flex-col font-sans relative select-none">
      {/* Background Subtle Gradient & Mesh */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40 z-0" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-100/40 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-100/40 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Bar Proyektor Kompak (Light Theme) */}
      <header className="px-4 sm:px-6 py-2.5 sm:py-3 border-b border-slate-200/90 bg-white/95 backdrop-blur-md relative z-10 shadow-xs shrink-0">
        <div className="w-full flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToAdmin}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer shadow-2xs"
              title="Kembali ke Dashboard Admin"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                  Sidang Pleno KONAS PERSADIA 2026
                </span>
                {isRound2 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase tracking-wider shadow-2xs animate-pulse inline-flex items-center gap-1">
                    <Scale className="w-3 h-3 text-amber-700" />
                    <span>PUTARAN KEDUA (RUN-OFF)</span>
                  </span>
                )}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                  rekap?.status_pemilihan === 'open' ? 'bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse' :
                  rekap?.status_pemilihan === 'closed' ? 'bg-red-100 text-red-800 border-red-300' :
                  'bg-slate-100 text-slate-700 border-slate-300'
                }`}>
                  {rekap?.status_pemilihan === 'open' ? '🟢 SESI LIVE (DIBUKA)' :
                   rekap?.status_pemilihan === 'closed' ? '🔴 PEMILIHAN DITUTUP' : '⚪ PERSIAPAN'}
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-snug mt-0.5">
                {isRound2 ? "Hasil Pemilihan Putaran Kedua (Run-Off) Ketua PB PERSADIA" : "Hasil Rekapitulasi Pemilihan Ketua PB PERSADIA Periode 2029–2032"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:block text-right text-xs font-mono leading-tight">
              <span className="block text-slate-900 font-bold">{lastRefreshed.toLocaleTimeString('id-ID')} WIB</span>
              <span className="text-[10px] text-emerald-700 font-semibold">Auto-Sync 4s</span>
            </div>

            <button
              onClick={fetchLiveResults}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer shadow-2xs"
              title="Segarkan data proyektor"
            >
              <RefreshCw className="w-4 h-4 text-emerald-600" />
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition cursor-pointer shadow-sm shadow-emerald-600/30"
              title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh Proyektor"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Viewport Container (Zero Scroll, Two Columns) */}
      <main className="flex-1 w-full p-3 sm:p-5 flex flex-col md:flex-row gap-4 sm:gap-6 overflow-hidden min-h-0 relative z-10">

        {/* ============================================================== */}
        {/* KOLOM KIRI: STATISTIK PARTISIPASI & KUORUM SIDANG */}
        {/* ============================================================== */}
        <aside className="w-full md:w-72 lg:w-80 shrink-0 bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col justify-between overflow-hidden">
          <div className="space-y-4">
            {/* Judul Panel */}
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
                  Rekapitulasi Sidang
                </span>
                <h2 className="text-sm font-black text-slate-900 tracking-tight">
                  Statistik Partisipasi
                </h2>
              </div>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Vote className="w-4 h-4" />
              </div>
            </div>

            {/* 4 Card Metrik Tersusun Rapi */}
            <div className="space-y-2.5">
              {/* Total DPT */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-200/70 text-slate-700 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total DPT</span>
                    <span className="text-xs text-slate-600 font-medium">Utusan Delegasi Sah</span>
                  </div>
                </div>
                <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {rekap?.total_dpt ?? 0}
                </span>
              </div>

              {/* Suara Masuk */}
              <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Suara Masuk</span>
                    <span className="text-xs text-emerald-800/80 font-medium">Surat Suara Sah</span>
                  </div>
                </div>
                <span className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight">
                  {rekap?.total_suara_masuk ?? 0}
                </span>
              </div>

              {/* Belum Memilih */}
              <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Belum Memilih</span>
                    <span className="text-xs text-amber-800/80 font-medium">Menunggu Hak Suara</span>
                  </div>
                </div>
                <span className="text-xl sm:text-2xl font-black text-amber-700 tracking-tight">
                  {rekap?.belum_memilih ?? 0}
                </span>
              </div>

              {/* Tingkat Partisipasi & Progress Bar */}
              <div className="p-3.5 rounded-2xl bg-teal-50/50 border border-teal-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block">
                    Tingkat Partisipasi
                  </span>
                  <span className="text-lg sm:text-xl font-black text-teal-700 tracking-tight">
                    {rekap?.persentase_partisipasi ?? 0}%
                  </span>
                </div>
                <div className="w-full bg-slate-200/80 h-3 rounded-full overflow-hidden p-0.5">
                  <div
                    className="bg-gradient-to-r from-emerald-600 to-teal-500 h-full rounded-full transition-all duration-700"
                    style={{ width: `${rekap?.persentase_partisipasi ?? 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-teal-800/80 font-medium">
                  <span>Kuorum Pemilihan Sah</span>
                  <span>{rekap?.total_suara_masuk ?? 0} / {rekap?.total_dpt ?? 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Asas Pemilihan di Bawah Sidebar */}
          <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="leading-tight">
              Asas LUBER: Langsung, Umum, Bebas, Rahasia, Jujur &amp; Adil.
            </span>
          </div>
        </aside>

        {/* ============================================================== */}
        {/* KOLOM KANAN: PANGGUNG UTAMA KANDIDAT KETUA UMUM */}
        {/* ============================================================== */}
        <section className="flex-1 flex flex-col justify-center items-center overflow-hidden min-h-0 relative">
          {!rekap?.tampilkan_quick_count && rekap?.status_pemilihan === 'open' ? (
            // Jika Quick Count disembunyikan saat pemilihan berlangsung
            <div className="p-8 sm:p-12 rounded-3xl bg-white border-2 border-slate-200 text-center space-y-4 shadow-lg max-w-lg mx-auto">
              <div className="w-16 h-16 bg-emerald-50 border-2 border-emerald-200 rounded-3xl mx-auto flex items-center justify-center text-emerald-600 shadow-sm">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-black text-slate-900">Kotak Suara Elektronik Terkunci</h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Suara dari delegasi cabang sedang dihimpun secara aman dan terenkripsi. Sesuai tata tertib pleno, perolehan suara akan dibuka setelah sesi resmi ditutup oleh Presidium Sidang.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Sistem Aktif Menerima Suara Delegasi</span>
              </div>
            </div>
          ) : (
            // Tampilkan Hasil Suara Kandidat (Quick Count Aktif atau Sesi Ditutup)
            <div className="w-full h-full flex flex-col justify-center items-center space-y-3 sm:space-y-4 overflow-hidden">
              {isClosed && isTie && (
                <div className="px-4 py-2.5 rounded-2xl bg-amber-50 border-2 border-amber-300 shadow-xs flex items-center gap-3 max-w-2xl text-left shrink-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-amber-950">
                      Hasil Seri (Draw): Perolehan Suara Tertinggi Seimbang ({highestVotes} Suara)
                    </h3>
                    <p className="text-[11px] text-amber-900/80">
                      Menunggu arahan Presidium Sidang untuk pembukaan Putaran Kedua (Run-off).
                    </p>
                  </div>
                </div>
              )}

              <div className={`${sz.gridContainer} overflow-hidden`}>
                {rekap?.kandidat.map((cand) => {
                  const isWinner = isWinnerDecided && winnerCandidate?.id === cand.id;
                  const isTopTied = isClosed && isTie && topTiedCandidates.some(t => t.id === cand.id);

                  return (
                    <div
                      key={cand.id}
                      className={`rounded-3xl transition-all relative overflow-hidden flex flex-col justify-between items-center text-center border-2 max-h-[82vh] ${sz.card} ${
                        isWinner
                          ? "bg-gradient-to-b from-amber-50/70 via-white to-white border-amber-400 ring-4 ring-amber-300/30 shadow-2xl"
                          : isTopTied
                          ? "bg-gradient-to-b from-amber-50/40 via-white to-white border-amber-300 ring-2 ring-amber-200/50 shadow-xl"
                          : "bg-white border-slate-200/90 shadow-md hover:shadow-lg"
                      }`}
                    >
                      {isWinner && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-md animate-bounce z-10">
                          <Award className="w-3.5 h-3.5 text-amber-950" />
                          <span>Ketua Terpilih</span>
                        </div>
                      )}

                      {isTopTied && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 font-black text-[10px] uppercase tracking-wider shadow-xs z-10">
                          <Scale className="w-3.5 h-3.5 text-amber-700" />
                          <span>Suara Seri</span>
                        </div>
                      )}

                      {/* Foto Kandidat di Bagian Atas */}
                      <div className="flex flex-col items-center w-full space-y-2">
                        <div className="relative mx-auto">
                          {cand.foto_url ? (
                            <img
                              src={cand.foto_url}
                              alt={cand.nama_kandidat}
                              className={`${sz.photoBox} rounded-2xl object-cover border-4 border-slate-100 shadow-md bg-slate-100 mx-auto`}
                            />
                          ) : (
                            <div className={`${sz.photoBox} rounded-2xl bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center mx-auto shadow-sm`}>
                              <Vote className={`${sz.photoIcon} text-emerald-600`} />
                            </div>
                          )}

                          <span className={`absolute ${sz.badgeNumber} rounded-xl bg-emerald-600 text-white font-mono font-black flex items-center justify-center shadow-md border-2 border-white`}>
                            {cand.nomor_urut}
                          </span>
                        </div>

                        {/* Identitas Kandidat Rata Tengah */}
                        <div className="space-y-0.5 text-center w-full px-1">
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono font-bold text-[10px] uppercase tracking-wider">
                            Calon No. {cand.nomor_urut}
                          </span>
                          <h3 className={`${sz.nameText} text-slate-900 leading-snug line-clamp-1`}>
                            {cand.nama_kandidat}
                          </h3>
                          {cand.gelar && (
                            <p className={`${sz.gelarText} text-emerald-800 font-bold line-clamp-1`}>{cand.gelar}</p>
                          )}
                          {cand.institusi && (
                            <p className={`${sz.institusiText} text-slate-500 line-clamp-1`}>{cand.institusi}</p>
                          )}
                        </div>
                      </div>

                      {/* Card Perolehan Suara di Bagian Bawah Foto */}
                      <div className="w-full space-y-2 pt-2">
                        <div className={`rounded-2xl bg-slate-50 border border-slate-200/90 text-center shadow-2xs ${sz.voteBoxPadding}`}>
                          <span className={`${sz.voteLabelText} font-bold text-slate-500 uppercase tracking-wider block`}>
                            Perolehan Suara
                          </span>
                          <div className="flex items-baseline justify-center gap-1.5">
                            <span className={`${sz.voteCountText} font-black text-slate-900 tracking-tight`}>
                              {cand.total_suara}
                            </span>
                            <span className={`${sz.voteLabelText} font-semibold text-slate-500`}>Suara</span>
                          </div>

                          {/* Persentase Badge */}
                          <div className="flex justify-center">
                            <span className={`inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 font-black ${sz.percentBadge}`}>
                              <span>{cand.persentase}%</span>
                              <span className="text-[9px] font-semibold text-emerald-700">suara sah</span>
                            </span>
                          </div>

                          {/* Progress Bar Persentase */}
                          <div className={`w-full bg-slate-200 ${sz.progressBarHeight} rounded-full overflow-hidden p-0.5 mt-1`}>
                            <div
                              className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 h-full rounded-full transition-all duration-700"
                              style={{ width: `${cand.persentase}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
