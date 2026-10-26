import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  Vote, CheckCircle, Clock, ShieldCheck, AlertCircle, ArrowLeft,
  Lock, Check, Loader2, Sparkles, ChevronRight, UserCheck, Eye, ExternalLink,
  FileText, Building2, MapPin, KeyRound, RefreshCw, Scale
} from 'lucide-react';

interface VotingPageProps {
  initialToken?: string;
  onNavigateHome: () => void;
}

interface Candidate {
  id: number;
  nomor_urut: number;
  nama_kandidat: string;
  gelar?: string | null;
  institusi?: string | null;
  foto_url?: string | null;
  visi?: string | null;
  misi?: string | null;
  cv_url?: string | null;
  ringkasan_cv?: string | null;
}

interface VoterInfo {
  nama: string;
  cabang: string;
  token: string;
  status_pemilihan: 'draft' | 'open' | 'closed';
}

export default function VotingPage({ initialToken, onNavigateHome }: VotingPageProps) {
  // Input Token States (Tanpa nomor WA lagi)
  const [inputToken, setInputToken] = useState(initialToken || "");
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  const [voterInfo, setVoterInfo] = useState<VoterInfo | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Candidates & Selection
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [voteSuccess, setVoteSuccess] = useState(false);
  const [voteTimestamp, setVoteTimestamp] = useState<string | null>(null);
  const [putaranVoting, setPutaranVoting] = useState<string>('1');
  const [kandidatPutaran2, setKandidatPutaran2] = useState<number[]>([]);

  // Modal Detail Profil, Visi, Misi, CV
  const [viewingCandidate, setViewingCandidate] = useState<Candidate | null>(null);

  // Parse Token dari URL jika ada (?token=... atau #voting-bilik?token=... atau #vote?token=...)
  useEffect(() => {
    let tokenFromUrl = "";
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("token")) {
      tokenFromUrl = searchParams.get("token") || "";
    } else if (window.location.hash.includes("token=")) {
      const hashQuery = window.location.hash.split("?")[1];
      if (hashQuery) {
        const hashParams = new URLSearchParams(hashQuery);
        tokenFromUrl = hashParams.get("token") || "";
      }
    }

    const tokenToTest = (tokenFromUrl || initialToken || "").trim().toUpperCase();
    if (tokenToTest) {
      setInputToken(tokenToTest);
      validateToken(tokenToTest);
    }
  }, [initialToken]);

  // Real-time synchronization untuk status sesi sidang & putaran pemilihan (auto-sync 3.5s)
  useEffect(() => {
    if (!voterInfo || voteSuccess || !isSupabaseConfigured) return;

    const syncSession = async () => {
      try {
        const { data: configData } = await supabase
          .from('voting_config')
          .select('*');

        if (configData) {
          const statusObj = configData.find(c => c.key === 'status_pemilihan');
          const roundObj = configData.find(c => c.key === 'putaran_voting');
          const k2Obj = configData.find(c => c.key === 'kandidat_putaran_2');

          if (statusObj && statusObj.value !== voterInfo.status_pemilihan) {
            setVoterInfo(prev => prev ? { ...prev, status_pemilihan: statusObj.value as any } : null);
          }

          const newRound = roundObj ? roundObj.value : '1';
          let newK2: number[] = [];
          if (k2Obj) {
            try { newK2 = JSON.parse(k2Obj.value); } catch { newK2 = []; }
          }

          if (newRound !== putaranVoting || JSON.stringify(newK2) !== JSON.stringify(kandidatPutaran2)) {
            setPutaranVoting(newRound);
            setKandidatPutaran2(newK2);
            fetchCandidates();
          }
        }
      } catch {
        // Abaikan kegagalan jaringan saat background sync
      }
    };

    const interval = setInterval(syncSession, 3500);
    return () => clearInterval(interval);
  }, [voterInfo, voteSuccess, putaranVoting, kandidatPutaran2]);

  // Fetch daftar kandidat calon presiden (dan filter jika putaran ke-2)
  const fetchCandidates = async () => {
    try {
      setLoadingCandidates(true);

      // Cek status putaran pemilihan dari voting_config
      let currentRound = '1';
      let round2Ids: number[] = [];

      const { data: configData } = await supabase
        .from('voting_config')
        .select('*');

      if (configData) {
        const roundObj = configData.find(c => c.key === 'putaran_voting');
        const k2Obj = configData.find(c => c.key === 'kandidat_putaran_2');
        if (roundObj) currentRound = roundObj.value;
        if (k2Obj) {
          try {
            round2Ids = JSON.parse(k2Obj.value);
          } catch {
            round2Ids = [];
          }
        }
      }

      setPutaranVoting(currentRound);
      setKandidatPutaran2(round2Ids);

      const { data, error } = await supabase
        .from('voting_kandidat')
        .select('*')
        .order('nomor_urut', { ascending: true });

      if (error) throw error;

      let list = data || [];
      if (currentRound === '2' && round2Ids.length > 0) {
        list = list.filter(c => round2Ids.includes(c.id));
      }

      setCandidates(list);
    } catch (err: any) {
      console.error("Gagal memuat kandidat:", err);
    } finally {
      setLoadingCandidates(false);
    }
  };

  // Validasi Token Rahasia Pemilih
  const validateToken = async (tokenToTest?: string) => {
    const token = (tokenToTest || inputToken).trim().toUpperCase();

    if (!token) {
      setTokenError("Mohon masukkan kode token pemilih Anda.");
      return;
    }

    if (!isSupabaseConfigured) {
      setTokenError("Koneksi Supabase belum terkonfigurasi.");
      return;
    }

    setIsValidatingToken(true);
    setTokenError(null);

    try {
      const { data, error } = await supabase.rpc('validate_voter_token', {
        p_token: token,
        p_whatsapp: null
      });

      if (error) throw error;

      if (!data.valid) {
        if (data.reason === 'ALREADY_VOTED') {
          setTokenError(`Hak suara untuk token ini sudah pernah digunakan oleh ${data.nama || 'pemilih'} (${data.cabang || 'Cabang'}).`);
        } else if (data.reason === 'TOKEN_NOT_FOUND') {
          setTokenError("Kode token tidak terdaftar dalam DPT Sidang Pleno. Pastikan huruf dan angka sesuai.");
        } else {
          setTokenError(data.message || "Token tidak valid.");
        }
        setVoterInfo(null);
        return;
      }

      const validatedToken = (data.token || token).trim().toUpperCase();
      // Validasi berhasil
      setVoterInfo({
        nama: data.nama,
        cabang: data.cabang,
        token: validatedToken,
        status_pemilihan: data.status_pemilihan
      });

      fetchCandidates();
    } catch (err: any) {
      console.error("Validasi gagal:", err);
      setTokenError("Terjadi kesalahan saat memverifikasi token. Pastikan koneksi internet stabil.");
    } finally {
      setIsValidatingToken(false);
    }
  };

  // Submit Coblosan Suara
  const handleVoteSubmit = async () => {
    const finalToken = (voterInfo?.token || inputToken).trim().toUpperCase();

    if (!selectedCandidate) {
      alert("Silakan tentukan kandidat pilihan Anda terlebih dahulu.");
      return;
    }

    if (!finalToken) {
      alert("Kode token pemilih tidak ditemukan. Silakan verifikasi ulang token Anda di bilik suara.");
      setIsConfirmModalOpen(false);
      setVoterInfo(null);
      return;
    }

    setIsSubmittingVote(true);
    try {
      const { data, error } = await supabase.rpc('submit_voting_ballot', {
        p_token: finalToken,
        p_kandidat_id: selectedCandidate.id
      });

      if (error) throw error;

      if (!data.success) {
        if (data.reason === 'SESSION_NOT_OPEN') {
          alert("Pemilihan belum dibuka oleh Presidium Sidang Pleno. Silakan tunggu aba-aba pembukaan sidang.");
        } else if (data.reason === 'ALREADY_VOTED') {
          alert("Hak suara untuk token ini telah digunakan sebelumnya.");
        } else {
          alert(data.message || "Gagal mengirimkan suara.");
        }
        setIsConfirmModalOpen(false);
        return;
      }

      // Berhasil
      setVoteSuccess(true);
      setVoteTimestamp(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setIsConfirmModalOpen(false);
    } catch (err: any) {
      alert("Terjadi kesalahan sistem saat mengirimkan suara: " + err.message);
    } finally {
      setIsSubmittingVote(false);
    }
  };

  const handleResetForNextVoter = () => {
    if (window.location.search.includes("token=") || window.location.hash.includes("token=")) {
      window.history.replaceState(null, "", window.location.pathname + "#voting-bilik");
    }
    setInputToken("");
    setVoterInfo(null);
    setSelectedCandidate(null);
    setVoteSuccess(false);
    setTokenError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between selection:bg-emerald-500 selection:text-white relative">
      {/* Background Decorative Mesh Pattern */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] opacity-40 z-0" />

      {/* ==================================================================== */}
      {/* HEADER NAVBAR (LIGHT THEME) */}
      {/* ==================================================================== */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
                  BILIK SUARA ELEKTRONIK
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  LUBER
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Kongres Nasional PERSADIA 2026 &bull; Pemilihan Presiden PB 2029–2032
              </p>
            </div>
          </div>

          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kembali ke Beranda</span>
          </button>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* MAIN CONTAINER */}
      {/* ==================================================================== */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full relative z-10 flex flex-col justify-center">

        {/* ------------------------------------------------------------------ */}
        {/* VIEW 1: FORM INPUT TOKEN PEMILIH (SEGAR & BERSIH) */}
        {/* ------------------------------------------------------------------ */}
        {!voterInfo && !voteSuccess && (
          <div className="max-w-md w-full mx-auto space-y-6">
            <div className="bg-white border border-slate-200/90 rounded-3xl p-7 sm:p-9 shadow-xl shadow-slate-200/50 space-y-6 text-center">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
                <KeyRound className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-xl font-black text-slate-900">
                  Verifikasi Hak Suara
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Masukkan kode token rahasia yang tercetak pada kartu suara delegasi atau yang diberikan oleh Panitia Pemilihan (Panlih).
                </p>
              </div>

              {/* Alert Error */}
              {tokenError && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5 text-left">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{tokenError}</span>
                </div>
              )}

              {/* Form Input Token */}
              <form onSubmit={(e) => { e.preventDefault(); validateToken(); }} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Kode Token Pemilih
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="CONTOH: KNAS-JKT01"
                    value={inputToken}
                    onChange={(e) => setInputToken(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-emerald-600 focus:bg-white text-slate-900 text-center font-mono font-black tracking-widest text-xl uppercase transition-all shadow-inner outline-none placeholder:text-slate-400 placeholder:tracking-normal placeholder:font-sans placeholder:text-xs"
                  />
                  <p className="text-[11px] text-slate-400 mt-2 text-center">
                    Satu token hanya dapat digunakan <strong>1 (satu) kali</strong> dan akan hangus otomatis setelah suara masuk.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isValidatingToken || !inputToken.trim()}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isValidatingToken ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memverifikasi Token...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Masuk ke Bilik Suara</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Jaminan Rahasia & Aman */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Sistem Suara Tertutup &bull; Kerahasiaan Pilihan Dijamin 100%</span>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* VIEW 2: BILIK SUARA KANDIDAT (SETELAH TOKEN VALID) */}
        {/* ------------------------------------------------------------------ */}
        {voterInfo && !voteSuccess && (
          <div className="space-y-6">
            {/* Kartu Profil Delegasi */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-base shrink-0 border border-emerald-200">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      Delegasi Sah
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      Token: {voterInfo.token}
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-slate-900 mt-0.5">
                    {voterInfo.nama}
                  </h2>
                  <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{voterInfo.cabang}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setVoterInfo(null);
                    setInputToken("");
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Ganti Token
                </button>
              </div>
            </div>

            {/* Banner Status Sesi Sidang */}
            {voterInfo.status_pemilihan !== 'open' && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-3 shadow-xs">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 animate-spin" />
                <div>
                  <strong className="block text-sm font-bold text-amber-950">Sesi Pemilihan Belum Dibuka</strong>
                  <span>
                    Presidium Sidang belum mengetuk palu pembukaan pemungutan suara. Anda dapat mempelajari visi, misi, dan CV kandidat terlebih dahulu.
                  </span>
                </div>
              </div>
            )}

            {/* Intro Teks */}
            <div className="text-center max-w-2xl mx-auto space-y-2">
              {putaranVoting === '2' && (
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 font-black text-xs uppercase tracking-wider shadow-xs">
                  <Scale className="w-4 h-4 text-amber-700" />
                  <span>PEMILIHAN PUTARAN KEDUA (RUN-OFF)</span>
                </div>
              )}
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {putaranVoting === '2'
                  ? 'Surat Suara Putaran Kedua Calon Presiden PB PERSADIA'
                  : 'Surat Suara Calon Presiden PB PERSADIA'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                {putaranVoting === '2'
                  ? 'Pemilihan penentuan di antara calon dengan perolehan suara seri tertinggi pada putaran pertama. Silakan tentukan pilihan Anda.'
                  : <>Silakan pelajari visi, misi, dan rekam jejak (CV) kandidat. Klik tombol <strong>"PILIH KANDIDAT"</strong> pada calon yang Anda percayai.</>}
              </p>
            </div>

            {/* Grid Kartu Kandidat */}
            {loadingCandidates ? (
              <div className="text-center py-16 space-y-3">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-500 font-medium">Memuat data calon presiden...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {candidates.map((cand) => (
                  <div
                    key={cand.id}
                    className="bg-white border-2 border-slate-200/90 hover:border-emerald-500 rounded-3xl p-4 sm:p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                  >
                    <div className="space-y-3.5 sm:space-y-4">
                      {/* Header Kartu: Foto & Nomor Urut */}
                      <div className="flex items-center sm:items-start gap-3 sm:gap-4">
                        {cand.foto_url ? (
                          <img
                            src={cand.foto_url}
                            alt={cand.nama_kandidat}
                            className="w-16 h-20 sm:w-20 sm:h-24 rounded-2xl object-cover border-2 border-slate-100 shadow-sm shrink-0 bg-slate-100"
                          />
                        ) : (
                          <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center shrink-0">
                            <Vote className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600" />
                          </div>
                        )}

                        <div className="space-y-1 min-w-0 flex-1">
                          <span className="inline-block px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white font-mono font-bold text-xs tracking-wider shadow-xs">
                            NOMOR {cand.nomor_urut}
                          </span>
                          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-emerald-700 transition leading-snug">
                            {cand.nama_kandidat}
                          </h3>
                          {cand.gelar && (
                            <p className="text-xs text-emerald-700 font-semibold">{cand.gelar}</p>
                          )}
                          {cand.institusi && (
                            <p className="text-[11px] text-slate-500 line-clamp-2">{cand.institusi}</p>
                          )}
                        </div>
                      </div>

                      {/* Ringkasan Visi */}
                      {cand.visi && (
                        <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1">
                          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                            Visi Utama:
                          </span>
                          <p className="italic text-[11px] leading-relaxed line-clamp-3">
                            "{cand.visi}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Tombol Aksi */}
                    <div className="space-y-2 pt-3.5 sm:pt-4 border-t border-slate-100 mt-3.5 sm:mt-4">
                      <button
                        type="button"
                        onClick={() => setViewingCandidate(cand)}
                        className="w-full py-2.5 text-center text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50/80 font-semibold transition rounded-xl flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-100"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Lihat Profil, Visi, Misi &amp; CV Lengkap &rarr;</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCandidate(cand);
                          setIsConfirmModalOpen(true);
                        }}
                        disabled={voterInfo.status_pemilihan !== 'open'}
                        className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] text-white font-bold text-sm rounded-2xl shadow-md shadow-emerald-600/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Vote className="w-4 h-4" />
                        <span>PILIH KANDIDAT NO. {cand.nomor_urut}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* VIEW 3: TANDA TERIMA / SUKSES VOTING (KUITANSI DIGITAL) */}
        {/* ------------------------------------------------------------------ */}
        {voteSuccess && (
          <div className="max-w-md w-full mx-auto space-y-6">
            <div className="bg-white border-2 border-emerald-500 rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6 relative overflow-hidden">
              <div className="w-20 h-20 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center mx-auto text-emerald-600 shadow-md">
                <CheckCircle className="w-10 h-10" />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 inline-block">
                    SUARA SAH TERCATAT
                  </span>
                  {putaranVoting === '2' && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 inline-block font-mono">
                      PUTARAN KE-2
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-black text-slate-900">
                  Terima Kasih Atas Partisipasi Anda
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Hak suara Anda dalam Pemilihan Presiden PB PERSADIA Periode 2029–2032 telah berhasil dimasukkan ke dalam kotak suara secara sah, langsung, dan rahasia.
                </p>
              </div>

              {/* Rincian Kuitansi */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Nama Delegasi:</span>
                  <strong className="text-slate-800">{voterInfo?.nama}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Cabang PERSADIA:</span>
                  <strong className="text-slate-800">{voterInfo?.cabang}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Status Token:</span>
                  <span className="text-red-600 font-bold font-mono">HANGUS (Single-Use Burned)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Waktu Coblos:</span>
                  <strong className="text-slate-800 font-mono">{voteTimestamp} WIB</strong>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleResetForNextVoter}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] text-white font-bold text-sm rounded-2xl transition shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Selesai &amp; Masukkan Token Baru (Bilik Suara)</span>
                </button>

                <button
                  type="button"
                  onClick={onNavigateHome}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-2xl transition cursor-pointer"
                >
                  Kembali ke Beranda Kongres
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ==================================================================== */}
      {/* MODAL KONFIRMASI PEMILIHAN (DOUBLE CONFIRMATION) */}
      {/* ==================================================================== */}
      {isConfirmModalOpen && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 max-w-md w-full shadow-2xl space-y-4 sm:space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Konfirmasi Pilihan Suara</h3>
                <p className="text-xs text-slate-500">Pastikan pilihan Anda sudah mantap</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
              <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-mono font-bold text-xs inline-block">
                KANDIDAT NO. URUT {selectedCandidate.nomor_urut}
              </span>
              <h4 className="text-base font-extrabold text-slate-900">
                {selectedCandidate.nama_kandidat}
              </h4>
              {selectedCandidate.gelar && (
                <p className="text-xs text-emerald-800 font-semibold">{selectedCandidate.gelar}</p>
              )}
              {selectedCandidate.institusi && (
                <p className="text-[11px] text-slate-600">{selectedCandidate.institusi}</p>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed font-medium">
              ⚠️ Peringatan: Pilihan suara <strong>TIDAK DAPAT DIUBAH ATAU DIBATALKAN</strong> setelah dikirimkan. Token pemilih Anda akan hangus seketika.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isSubmittingVote}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Batal / Cek Lagi
              </button>

              <button
                type="button"
                onClick={handleVoteSubmit}
                disabled={isSubmittingVote}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingVote ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Mencatat Suara...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>YA, SAYA YAKIN MEMILIH</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL DETAIL PROFIL, VISI, MISI & CV KANDIDAT */}
      {/* ==================================================================== */}
      {viewingCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white font-mono font-bold text-xs inline-block shadow-xs">
                  NOMOR URUT {viewingCandidate.nomor_urut}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1.5">{viewingCandidate.nama_kandidat}</h3>
                {viewingCandidate.gelar && (
                  <p className="text-xs text-emerald-700 font-semibold">{viewingCandidate.gelar}</p>
                )}
                {viewingCandidate.institusi && (
                  <p className="text-xs text-slate-500">{viewingCandidate.institusi}</p>
                )}
              </div>
              <button
                onClick={() => setViewingCandidate(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Visi */}
            {viewingCandidate.visi && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">Visi:</span>
                <p className="text-xs text-slate-700 italic bg-slate-50 p-3.5 rounded-2xl border border-slate-200 leading-relaxed">
                  "{viewingCandidate.visi}"
                </p>
              </div>
            )}

            {/* Misi */}
            {viewingCandidate.misi && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">Misi:</span>
                <div className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 whitespace-pre-line leading-relaxed">
                  {viewingCandidate.misi}
                </div>
              </div>
            )}

            {/* Rekam Jejak / Riwayat Hidup */}
            {viewingCandidate.ringkasan_cv && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">Riwayat Hidup &amp; Rekam Jejak (CV):</span>
                <div className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 whitespace-pre-line leading-relaxed">
                  {viewingCandidate.ringkasan_cv}
                </div>
              </div>
            )}

            {/* Dokumen CV Link */}
            {viewingCandidate.cv_url && (
              <div className="pt-2">
                <a
                  href={viewingCandidate.cv_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-2xl transition shadow-xs w-full justify-center"
                >
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span>Buka Dokumen CV Lengkap (PDF / Berkas)</span>
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                </a>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewingCandidate(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* FOOTER */}
      {/* ==================================================================== */}
      <footer className="bg-white border-t border-slate-200/80 py-4 text-center text-xs text-slate-400 relative z-10">
        <p>&copy; 2026 Panitia Kongres Nasional PERSADIA. Seluruh Hak Cipta Dilindungi.</p>
      </footer>
    </div>
  );
}
