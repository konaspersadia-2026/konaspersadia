import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase, isSupabaseConfigured } from '../src/lib/supabase';
import { KATEGORI_PESERTA } from '../src/config';
import { 
  CheckCircle2, XCircle, Search, RefreshCw, QrCode, ShieldAlert, 
  ArrowLeft, CheckSquare, Square, LogOut, Flashlight, Volume2, 
  VolumeX, Camera, AlertTriangle, Clock, Calendar, Check, Stethoscope,
  Sparkles, UserCheck, ChevronRight, Edit3, User, Hash, Coffee, Shirt, Utensils,
  KeyRound, Eye, EyeOff
} from 'lucide-react';

interface Pendaftar {
  "Timestamp": string;
  "No. Registrasi": string;
  "Status Pembayaran": string;
  "Nama Lengkap": string;
  "Kategori Peserta": string;
  [key: string]: any;
}

export const CHECKPOINTS = [
  { id: "Registrasi_OnSite", label: "Registrasi On-Site", isMain: true }
];

// Audio synthesizer berbasis Web Audio API (Murni browser, bekerja di iOS Safari & Android)
const playScannerChime = (type: 'success' | 'error' | 'warning', soundEnabled: boolean = true) => {
  if (!soundEnabled) return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      // Dua nada harmonis naik ceria (880Hz -> 1320Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'error') {
      // Nada buzz tegas (220Hz -> 180Hz sawtooth)
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(180, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } else {
      // Warning chime
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(550, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (e) {
    console.warn("Audio playback not supported or blocked", e);
  }
};

const formatWaktu = (isoString?: string | null) => {
  if (!isoString) return "-";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d) + " WIB";
  } catch {
    return isoString;
  }
};

const formatTglIndo = (raw?: string | null) => {
  if (!raw || raw === "-" || raw === "null") return "Belum tercatat";
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const [y, m, d] = raw.split("-");
      const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      const monthName = months[parseInt(m, 10) - 1] || m;
      return `${parseInt(d, 10)} ${monthName} ${y}`;
    }
    return raw;
  } catch {
    return raw;
  }
};

function App() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [data, setData] = useState<Pendaftar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<Pendaftar | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  type ScannerMode = 'registrasi' | 'gala_dinner' | 'workshop' | 'snack' | 'makan_siang' | 'gula_darah' | 'baju';
  const [scannerMode, setScannerMode] = useState<ScannerMode | null>(null);

  // Pilihan Tanggal Kegiatan Acara (HANYA 2 PILIHAN: Hari 1 Novotel atau Hari 2 GOR Pakansari)
  type EventDate = '2026-11-07' | '2026-11-08';
  const [selectedDate, setSelectedDate] = useState<EventDate>(() => {
    const saved = localStorage.getItem('scanner_selected_date');
    if (saved === '2026-11-08') return '2026-11-08';
    return '2026-11-07';
  });

  // Layar pemilih tanggal saat login (hanya 2 pilihan)
  const [hasConfirmedDate, setHasConfirmedDate] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('scanner_date_confirmed') === 'true' && localStorage.getItem('scanner_selected_date'));
  });

  const handleDateChange = (newDate: EventDate) => {
    setSelectedDate(newDate);
    localStorage.setItem('scanner_selected_date', newDate);
    localStorage.setItem('scanner_date_confirmed', 'true');
    setHasConfirmedDate(true);
    setScannerMode(null); // Reset pos agar petugas memilih pos di hari tersebut
    setIsScanning(false);
    setSelectedUser(null);
  };

  const getAvailableModesForDate = (date: EventDate) => {
    if (date === '2026-11-07') {
      // 2 Pos Hari ke-1 Novotel Bogor Golf Resort
      return [
        { id: 'registrasi' as ScannerMode, label: 'Registrasi Onsite', sub: 'Lobby Novotel Bogor', icon: UserCheck },
        { id: 'gala_dinner' as ScannerMode, label: 'Akses Gala Dinner', sub: 'Grand Ballroom Novotel', icon: Utensils }
      ];
    } else {
      // 5 Pos Hari ke-2 GOR Pakansari
      return [
        { id: 'registrasi' as ScannerMode, label: 'Registrasi Onsite', sub: 'Pintu Masuk Stadion', icon: UserCheck },
        { id: 'snack' as ScannerMode, label: 'Pengambilan Snack', sub: 'Pos Snack Box', icon: Coffee },
        { id: 'makan_siang' as ScannerMode, label: 'Pengambilan Makan Siang', sub: 'Pos Konsumsi H2', icon: Utensils },
        { id: 'gula_darah' as ScannerMode, label: 'Pengambilan Gula Darah', sub: 'Meja Skrining Kesehatan', icon: Sparkles },
        { id: 'baju' as ScannerMode, label: 'Pengambilan Baju', sub: 'Pos Kaos & Goodie Bag', icon: Shirt }
      ];
    }
  };

  const currentModeItem = useMemo(() => {
    if (!scannerMode) return null;
    const modes = getAvailableModesForDate(selectedDate);
    return modes.find(m => m.id === scannerMode) || null;
  }, [scannerMode, selectedDate]);

  // Modal pencarian manual jika terdapat > 1 hasil
  const [candidateList, setCandidateList] = useState<Pendaftar[] | null>(null);

  // States perbaikan / edit identitas peserta
  const [isEditingIdentity, setIsEditingIdentity] = useState(false);
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);
  const [editNama, setEditNama] = useState("");
  const [editJK, setEditJK] = useState("Laki-laki");
  const [editTgl, setEditTgl] = useState("");
  const [editBln, setEditBln] = useState("");
  const [editThn, setEditThn] = useState("");
  const [editNik, setEditNik] = useState("");

  // Nomor Meja Pemeriksaan (disimpan otomatis di localStorage perangkat)
  const [nomorMeja, setNomorMeja] = useState<string>(() => {
    return localStorage.getItem('scanner_nomor_meja') || '';
  });
  const [isSettingMeja, setIsSettingMeja] = useState(false);

  // States form pemeriksaan fisik / gula darah
  const [tinggiBadan, setTinggiBadan] = useState("");
  const [beratBadan, setBeratBadan] = useState("");
  const [tensiSistolik, setTensiSistolik] = useState("");
  const [tensiDiastolik, setTensiDiastolik] = useState("");
  const [gulaDarah, setGulaDarah] = useState("");
  const [lingkarPerut, setLingkarPerut] = useState("");
  const [kesediaanData, setKesediaanData] = useState(false);
  const [gejalaNeuropati, setGejalaNeuropati] = useState(false);

  // States Pengaturan Kamera Scanner (Prioritas Normal 1x & Ganti Lensa)
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [currentCameraId, setCurrentCameraId] = useState<string>(() => {
    return localStorage.getItem('scanner_preferred_camera_id') || '';
  });
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);

  // Simpan data terbaru & instance scanner di ref
  const dataRef = useRef<Pendaftar[]>([]);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    if (selectedUser) {
      // Inisialisasi data pemeriksaan
      setTinggiBadan(selectedUser.tinggi_badan || "");
      setBeratBadan(selectedUser.berat_badan || "");
      const [sis, dia] = (selectedUser.tensi || "").split('/');
      setTensiSistolik(sis || "");
      setTensiDiastolik(dia || "");
      setGulaDarah(selectedUser.gula_darah || "");
      setLingkarPerut(selectedUser.lingkar_perut || "");
      setKesediaanData(selectedUser.kesediaan_data === 'Ya' || selectedUser.kesediaan_data === true);
      setGejalaNeuropati(selectedUser.gejala_neuropati === 'Ya' || selectedUser.gejala_neuropati === true);

      // Inisialisasi data edit identitas
      setEditNama(selectedUser["Nama Lengkap"] || selectedUser.nama_lengkap || "");
      setEditJK(selectedUser.jenis_kelamin && selectedUser.jenis_kelamin !== "-" ? selectedUser.jenis_kelamin : "Laki-laki");
      setEditNik(selectedUser.nik && selectedUser.nik !== "-" ? selectedUser.nik.replace(/\D/g, '') : "");
      
      const rawDob = selectedUser.tanggal_lahir || selectedUser["Tanggal Lahir"] || "";
      if (rawDob && /^\d{4}-\d{2}-\d{2}$/.test(rawDob)) {
        const [y, m, d] = rawDob.split("-");
        setEditThn(y);
        setEditBln(m);
        setEditTgl(d);
      } else {
        setEditThn("");
        setEditBln("");
        setEditTgl("");
      }

      const rawJk = selectedUser.jenis_kelamin || selectedUser["Jenis Kelamin"] || "";
      const isMissingDob = !rawDob || rawDob === "-" || rawDob === "null";
      const isMissingJk = !rawJk || rawJk === "-" || rawJk === "null";

      // Jika di pos gula darah dan ada data identitas yang belum lengkap, otomatis buka form edit identitas
      if ((scannerMode === 'gula_darah' || scannerMode === 'pesta_rakyat') && (isMissingDob || isMissingJk)) {
        setIsEditingIdentity(true);
      } else {
        setIsEditingIdentity(false);
      }
    } else {
      setTinggiBadan("");
      setBeratBadan("");
      setTensiSistolik("");
      setTensiDiastolik("");
      setGulaDarah("");
      setLingkarPerut("");
      setKesediaanData(false);
      setGejalaNeuropati(false);
      setIsEditingIdentity(false);
    }
  }, [selectedUser, scannerMode]);

  // Auth state (Sistem Passcode Cepat Petugas)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('persadia_scanner_auth') === 'true';
  });
  const [passcode, setPasscode] = useState("");
  const [loginNomorMeja, setLoginNomorMeja] = useState<string>(() => {
    return localStorage.getItem('scanner_nomor_meja') || '';
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    // 1. Cek apakah sudah terautentikasi lewat passcode di localStorage
    if (localStorage.getItem('persadia_scanner_auth') === 'true') {
      setIsAuthenticated(true);
      fetchData();
      return;
    }

    // 2. Kompatibilitas transisi: jika masih ada session aktif dari Supabase Auth
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          localStorage.setItem('persadia_scanner_auth', 'true');
          setIsAuthenticated(true);
          fetchData();
        }
      });
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setAuthLoading(true);

    try {
      const cleanInput = passcode.trim();
      if (!cleanInput) {
        throw new Error("Silakan masukkan passcode akses.");
      }

      if (!isSupabaseConfigured) {
        throw new Error("Koneksi Supabase belum terkonfigurasi. Tidak dapat memverifikasi passcode.");
      }

      // Ambil passcode dinamis resmi langsung dari tabel app_settings di Supabase
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'scanner_passcode')
        .maybeSingle();

      if (error) {
        console.error("Gagal mengambil scanner_passcode dari app_settings:", error);
        throw new Error("Gagal memverifikasi ke database: " + error.message);
      }

      if (!data || !data.value || !data.value.trim()) {
        throw new Error("Passcode belum diset di Supabase (tabel app_settings, key 'scanner_passcode'). Silakan hubungi Administrator.");
      }

      const validPasscode = data.value.trim();

      // Cocokkan passcode (case-insensitive)
      if (cleanInput.toLowerCase() !== validPasscode.toLowerCase()) {
        throw new Error("Passcode salah. Silakan tanyakan passcode resmi ke panitia / sekretariat.");
      }

      // Simpan nomor meja jika diisi oleh petugas saat login
      if (loginNomorMeja.trim()) {
        const cleanMeja = loginNomorMeja.trim();
        setNomorMeja(cleanMeja);
        localStorage.setItem('scanner_nomor_meja', cleanMeja);
      }

      // Simpan status otentikasi di localStorage agar tidak logout saat layar HP mati/refresh
      localStorage.setItem('persadia_scanner_auth', 'true');
      localStorage.setItem('persadia_scanner_auth_time', new Date().toISOString());
      setIsAuthenticated(true);
      setHasConfirmedDate(false); // Meminta pilihan tanggal saat pertama berhasil login
      fetchData();
    } catch (err: any) {
      console.error(err);
      setLoginError(err.message || "Gagal memverifikasi passcode.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('persadia_scanner_auth');
    localStorage.removeItem('persadia_scanner_auth_time');
    localStorage.removeItem('scanner_date_confirmed');
    if (isSupabaseConfigured) {
      await supabase.auth.signOut().catch(() => {});
    }
    setIsAuthenticated(false);
    setPasscode("");
    setData([]);
    setScanResult(null);
    setSelectedUser(null);
    setScannerMode(null);
    setIsScanning(false);
    setHasConfirmedDate(false);
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      setLoading(false);
      setError("Supabase tidak dikonfigurasi. Mode scanner memerlukan Supabase.");
      setData([]);
      return;
    }

    try {
      let allData: any[] = [];
      let hasMore = true;
      let page = 0;
      const pageSize = 1000;

      while (hasMore) {
        const { data: supabaseData, error: supabaseError } = await supabase
          .from('pendaftar')
          .select('*')
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (supabaseError) {
          throw supabaseError;
        }

        if (supabaseData && supabaseData.length > 0) {
          allData = [...allData, ...supabaseData];
          if (supabaseData.length < pageSize) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }

      if (allData) {
        const mappedData: Pendaftar[] = allData.map((row: any) => ({
          "Timestamp": row.timestamp || new Date().toISOString(),
          "No. Registrasi": row.no_registrasi || "-",
          "Status Pembayaran": row.status_pembayaran || "Menunggu Verifikasi",
          "Nama Lengkap": row.nama_lengkap || "-",
          "Kategori Peserta": row.kategori_peserta || "-",
          "Registrasi_OnSite": row.registrasi_onsite,
          "Akses_Gala_Dinner": row.akses_gala_dinner,
          "Kehadiran_Workshop": row.kehadiran_workshop,
          "Makan_Siang_Hari_1": row.makan_siang_hari_1,
          "Makan_Siang_Pesta_Rakyat": row.makan_siang_pesta_rakyat,
          "Pengambilan_Merchandise": row.pengambilan_merchandise,
          "Pengambilan_Baju": row.pengambilan_baju || row.pengambilan_merchandise,
          "Pengambilan_Snack": row.pengambilan_snack,
          "Cek_Gula_Darah": row.cek_gula_darah,
          ...row
        }));
        setData(mappedData);
      } else {
        setData([]);
      }
    } catch (err: any) {
      console.error(err);
      setError("Kesalahan saat memuat data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const extractIdFromScannedText = (text: string) => {
    let trimmed = (text || "").trim();
    try {
      const url = new URL(trimmed);
      const id = url.searchParams.get("id");
      if (id) return decodeURIComponent(id.trim());
    } catch {}
    
    const match = trimmed.match(/[?&]id=([^&]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1].trim());
    }
    
    const knsMatch = trimmed.match(/(KNS2026-[A-Z0-9]+)/i);
    if (knsMatch && knsMatch[1]) {
      return knsMatch[1].toUpperCase();
    }
    
    return trimmed;
  };

  // Helper pencarian di in-memory
  const searchCandidates = (rawQuery: string): Pendaftar[] => {
    if (!rawQuery || !rawQuery.trim()) return [];
    const cleanId = extractIdFromScannedText(rawQuery).toLowerCase().trim();
    const rawLower = rawQuery.toLowerCase().trim();
    const sourceList = dataRef.current.length > 0 ? dataRef.current : data;

    // 1. Coba pencocokan presisi no_registrasi
    const exact = sourceList.filter(d => {
      const reg = String(d["No. Registrasi"] || d.no_registrasi || "").toLowerCase().trim();
      return reg === cleanId || reg === rawLower;
    });
    if (exact.length > 0) return exact;

    // 2. Pencocokan fleksibel (No Reg, Nama, WA, Institusi, Cabang)
    return sourceList.filter(d => {
      const reg = String(d["No. Registrasi"] || d.no_registrasi || "").toLowerCase().trim();
      const name = String(d["Nama Lengkap"] || d.nama_lengkap || "").toLowerCase().trim();
      const wa = String(d.whatsapp || d["No. WhatsApp"] || "").toLowerCase().trim();
      const inst = String(d.institusi || d.cabang_persadia || "").toLowerCase().trim();

      return (
        (cleanId.length >= 3 && reg.includes(cleanId)) ||
        (rawLower.length >= 2 && name.includes(rawLower)) ||
        (cleanId.length >= 4 && wa.includes(cleanId)) ||
        (rawLower.length >= 3 && inst.includes(rawLower))
      );
    });
  };

  // Fetch single-row real-time dari Supabase saat scan
  const fetchLiveParticipant = async (targetId: string, fallbackUser?: Pendaftar | null) => {
    if (!isSupabaseConfigured || !targetId) return fallbackUser || null;
    
    try {
      const cleanReg = targetId.trim();
      const { data: freshRow, error } = await supabase
        .from('pendaftar')
        .select('*')
        .eq('no_registrasi', cleanReg)
        .maybeSingle();

      if (!error && freshRow) {
        const mappedFresh: Pendaftar = {
          "Timestamp": freshRow.timestamp || new Date().toISOString(),
          "No. Registrasi": freshRow.no_registrasi || "-",
          "Status Pembayaran": freshRow.status_pembayaran || "Menunggu Verifikasi",
          "Nama Lengkap": freshRow.nama_lengkap || "-",
          "Kategori Peserta": freshRow.kategori_peserta || "-",
          "Registrasi_OnSite": freshRow.registrasi_onsite,
          "Akses_Gala_Dinner": freshRow.akses_gala_dinner,
          "Kehadiran_Workshop": freshRow.kehadiran_workshop,
          "Makan_Siang_Hari_1": freshRow.makan_siang_hari_1,
          "Makan_Siang_Pesta_Rakyat": freshRow.makan_siang_pesta_rakyat,
          "Pengambilan_Merchandise": freshRow.pengambilan_merchandise,
          "Pengambilan_Baju": freshRow.pengambilan_baju || freshRow.pengambilan_merchandise,
          "Pengambilan_Snack": freshRow.pengambilan_snack,
          "Cek_Gula_Darah": freshRow.cek_gula_darah,
          ...freshRow
        };
        // Sinkronkan ke local state
        setData(prev => prev.map(d => d["No. Registrasi"] === mappedFresh["No. Registrasi"] ? mappedFresh : d));
        return mappedFresh;
      }
    } catch (err) {
      console.warn("Live fetch fallback to memory:", err);
    }
    return fallbackUser || null;
  };

  const handleSelectUser = async (user: Pendaftar | null, identifier: string) => {
    if (!user) {
      setSelectedUser(null);
      setError(`Data peserta dengan identitas "${identifier}" tidak ditemukan.`);
      playScannerChime('error', soundEnabled);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      return;
    }

    setError(null);
    setScanResult(user["No. Registrasi"] || user.no_registrasi || identifier);
    setSelectedUser(user);

    // Ambil data terbaru dari Supabase secara realtime
    const regNo = user["No. Registrasi"] || user.no_registrasi;
    if (regNo) {
      const liveData = await fetchLiveParticipant(regNo, user);
      if (liveData) {
        setSelectedUser(liveData);
      }
    }

    // Suara feedback
    const details = getParticipantDetails(user);
    if (details.isCancelled || ((details.isIlmiah || details.isDHF) && !details.isLunas)) {
      playScannerChime('error', soundEnabled);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    } else {
      playScannerChime('success', soundEnabled);
      if (navigator.vibrate) navigator.vibrate(150);
    }
  };

  // URL Parameter auto-scanner
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const scannedId = params.get("id");
    
    if (scannedId && data.length > 0 && isAuthenticated) {
      const candidates = searchCandidates(scannedId);
      if (candidates.length === 1) {
        handleSelectUser(candidates[0], scannedId);
      } else if (candidates.length > 1) {
        setCandidateList(candidates);
      } else {
        handleSelectUser(null, scannedId);
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [data, isAuthenticated]);

  // Helper pemilihan kamera normal (1x) & tolak sensor ultra-wide (0.5x / 0.6x)
  const selectNormalCamera = (cameras: Array<{ id: string; label: string }>) => {
    if (!cameras || cameras.length === 0) {
      return { selectedId: "", backCameras: [] };
    }

    // Filter keluar kamera depan
    const back = cameras.filter(c => {
      const lbl = (c.label || "").toLowerCase();
      return !lbl.includes('front') && !lbl.includes('user') && !lbl.includes('selfie') && !lbl.includes('depan');
    });

    const pool = back.length > 0 ? back : cameras;

    // Cek preferensi tersimpan di localStorage
    const saved = localStorage.getItem('scanner_preferred_camera_id');
    if (saved && pool.some(c => c.id === saved)) {
      return { selectedId: saved, backCameras: pool };
    }

    if (pool.length === 1) {
      return { selectedId: pool[0].id, backCameras: pool };
    }

    // Skoring kamera untuk prioritaskan normal (1x) dan tolak ultra-wide
    const scored = pool.map((cam, idx) => {
      const lbl = (cam.label || "").toLowerCase();
      let score = 50 - idx * 2;

      // Penalti keras untuk ultra-wide, super-wide, 0.5x, 0.6x, macro
      if (lbl.includes('ultra') || lbl.includes('wide-angle') || lbl.includes('wide angle') || lbl.includes('super wide')) {
        score -= 50;
      }
      if (lbl.includes('0.5') || lbl.includes('0.6') || lbl.includes('0,5') || lbl.includes('0,6')) {
        score -= 50;
      }
      if (lbl.includes('macro') || lbl.includes('depth') || lbl.includes('tele') || lbl.includes('zoom')) {
        score -= 25;
      }

      // Android Camera2 HAL: camera2 0 adalah sensor utama (1x), camera2 2 adalah ultra-wide
      if (lbl.includes('camera2 0') || lbl.includes('camera 0') || lbl.includes('id 0') || lbl.startsWith('0,')) {
        score += 40;
      }
      if (lbl.includes('camera2 2') || lbl.includes('camera 2')) {
        score -= 40;
      }

      // Bonus untuk main, utama, primary, normal, 1x
      if (lbl.includes('main') || lbl.includes('utama') || lbl.includes('primary') || lbl.includes('standard') || lbl.includes('normal')) {
        score += 35;
      }
      if (lbl.includes('1x') || lbl.includes('1.0x')) {
        score += 35;
      }
      if (lbl.includes('back') || lbl.includes('rear') || lbl.includes('belakang')) {
        score += 10;
      }

      return { cam, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return {
      selectedId: scored[0].cam.id,
      backCameras: pool
    };
  };

  const startScannerWithCamera = async (targetId?: string) => {
    try {
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;

      let cameraToUse: string | { facingMode: string } = targetId || currentCameraId;

      if (!cameraToUse) {
        try {
          const cams = await Html5Qrcode.getCameras();
          if (cams && cams.length > 0) {
            const { selectedId, backCameras } = selectNormalCamera(cams);
            setAvailableCameras(backCameras);
            if (selectedId) {
              cameraToUse = selectedId;
              setCurrentCameraId(selectedId);
            }
          }
        } catch (e) {
          console.warn("getCameras gagal, gunakan default environment", e);
        }
      }

      const finalConfig = cameraToUse || { facingMode: "environment" };

      await html5QrCode.start(
        finalConfig,
        {
          fps: 15,
          aspectRatio: 1.0, // Paksa frame 1:1 persegi sempurna
        },
        async (decodedText) => {
          const extractedId = extractIdFromScannedText(decodedText);
          setIsScanning(false);

          const candidates = searchCandidates(decodedText);
          if (candidates.length === 1) {
            await handleSelectUser(candidates[0], extractedId);
          } else if (candidates.length > 1) {
            setCandidateList(candidates);
          } else {
            await handleSelectUser(null, extractedId);
          }
        },
        () => {}
      );

      // Refresh list kamera jika belum terisi atau label kosong saat pemindaian awal
      try {
        const refreshed = await Html5Qrcode.getCameras();
        if (refreshed && refreshed.length > 0) {
          const { backCameras } = selectNormalCamera(refreshed);
          setAvailableCameras(backCameras);
        }
      } catch {}

      // Pastikan zoom normal 1.0 jika perangkat mendukung MediaTrackCapabilities zoom
      try {
        const caps = (html5QrCode as any).getRunningTrackCapabilities?.();
        if (caps && caps.zoom) {
          const minZoom = caps.zoom.min ?? 1;
          const maxZoom = caps.zoom.max ?? 1;
          if (minZoom < 1.0 && maxZoom >= 1.0) {
            await html5QrCode.applyVideoConstraints({
              advanced: [{ zoom: 1.0 } as any]
            });
          }
        }
      } catch {}

    } catch (err: any) {
      console.error("Gagal memulai scanner", err);
      setError("Gagal mengakses kamera. Pastikan Anda memberikan izin akses kamera.");
      playScannerChime('error', soundEnabled);
    }
  };

  const handleSwitchCamera = async () => {
    if (availableCameras.length <= 1 || isSwitchingCamera) return;
    setIsSwitchingCamera(true);

    try {
      const currentIndex = availableCameras.findIndex(c => c.id === currentCameraId);
      const nextIndex = (currentIndex + 1) % availableCameras.length;
      const nextCamera = availableCameras[nextIndex];

      // Hentikan instance berjalan
      if (scannerRef.current) {
        const inst = scannerRef.current;
        if (inst.isScanning) {
          await inst.stop();
        }
        try { inst.clear(); } catch {}
        scannerRef.current = null;
      }
      setTorchOn(false);

      // Simpan preferensi & set camera id
      localStorage.setItem('scanner_preferred_camera_id', nextCamera.id);
      setCurrentCameraId(nextCamera.id);

      // Beri sedikit jeda agar hardware stream terlepas
      await new Promise(r => setTimeout(r, 80));

      // Jalankan scanner dengan ID kamera baru
      await startScannerWithCamera(nextCamera.id);
    } catch (err) {
      console.error("Gagal berganti kamera", err);
      setError("Gagal berganti kamera.");
    } finally {
      setIsSwitchingCamera(false);
    }
  };

  // Efek kamera scanner
  useEffect(() => {
    if (isScanning) {
      startScannerWithCamera();
    }

    return () => {
      if (scannerRef.current) {
        const inst = scannerRef.current;
        if (inst.isScanning) {
          inst.stop().then(() => {
            try { inst.clear(); } catch {}
          }).catch(() => {});
        } else {
          try { inst.clear(); } catch {}
        }
        scannerRef.current = null;
      }
      setTorchOn(false);
    };
  }, [isScanning]);

  // Toggle Senter (Flashlight) yang benar menggunakan instance aktif
  const toggleTorch = async () => {
    if (!scannerRef.current || !isScanning) return;
    try {
      const nextTorch = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch } as any]
      });
      setTorchOn(nextTorch);
    } catch (e) {
      console.warn("Torch failed", e);
      alert("Lampu senter tidak didukung pada browser/kamera perangkat ini.");
    }
  };

  const handleManualSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchId = ((formData.get("searchId") as string) || "").trim();
    if (!searchId) return;

    const candidates = searchCandidates(searchId);
    if (candidates.length === 1) {
      handleSelectUser(candidates[0], searchId);
    } else if (candidates.length > 1) {
      setCandidateList(candidates);
    } else {
      handleSelectUser(null, searchId);
    }
  };

  const handleUpdateCheckpoint = async (checkpointId: string, currentValue: boolean, extraColumns: string[] = []) => {
    if (!selectedUser) return;
    
    if (!isSupabaseConfigured) {
      alert("Supabase tidak dikonfigurasi.");
      return;
    }

    const newValue = !currentValue;
    setActionLoading(checkpointId);
    const nowIso = new Date().toISOString();
    
    try {
      const updatePayload: Record<string, string | null> = {
        [checkpointId.toLowerCase()]: newValue ? "Ya" : null
      };

      if (checkpointId.toLowerCase() === 'registrasi_onsite') {
        updatePayload['waktu_registrasi_onsite'] = newValue ? nowIso : null;
      }
      if (checkpointId.toLowerCase() === 'akses_gala_dinner') {
        updatePayload['waktu_akses_gala_dinner'] = newValue ? nowIso : null;
        updatePayload['kehadiran_gala_dinner'] = newValue ? "Ya" : null;
        updatePayload['waktu_kehadiran_gala_dinner'] = newValue ? nowIso : null;
      }
      if (checkpointId.toLowerCase() === 'kehadiran_workshop') {
        updatePayload['waktu_kehadiran_workshop'] = newValue ? nowIso : null;
      }
      if (checkpointId.toLowerCase() === 'pengambilan_snack') {
        updatePayload['waktu_pengambilan_snack'] = newValue ? nowIso : null;
      }
      if (checkpointId.toLowerCase() === 'pengambilan_baju') {
        updatePayload['waktu_pengambilan_baju'] = newValue ? nowIso : null;
        updatePayload['pengambilan_merchandise'] = newValue ? "Ya" : null;
      }
      if (checkpointId.toLowerCase() === 'makan_siang_pesta_rakyat') {
        updatePayload['waktu_makan_siang_pesta_rakyat'] = newValue ? nowIso : null;
      }

      extraColumns.forEach(col => {
        updatePayload[col.toLowerCase()] = newValue ? "Ya" : null;
      });

      const { error: updateError } = await supabase
        .from('pendaftar')
        .update(updatePayload)
        .eq('no_registrasi', selectedUser["No. Registrasi"]);
        
      if (updateError) {
        if (updateError.message && (updateError.message.includes('akses_gala_dinner') || updateError.message.includes('hak_gala_dinner') || updateError.message.includes('kehadiran_gala_dinner'))) {
          alert("Kolom Gala Dinner belum ditambahkan di Supabase.\nSilakan jalankan skrip SQL 'supabase/add_gala_dinner_columns.sql' pada SQL Editor Supabase.");
        } else if (updateError.message && (updateError.message.includes('kehadiran_workshop') || updateError.message.includes('waktu_kehadiran_workshop'))) {
          alert("Kolom 'kehadiran_workshop' belum ditambahkan di Supabase.\nSilakan jalankan skrip SQL 'supabase/add_workshop_checkin_columns.sql' pada SQL Editor Supabase.");
        } else if (updateError.message && (updateError.message.includes('pengambilan_snack') || updateError.message.includes('pengambilan_baju') || updateError.message.includes('waktu_pengambilan_snack') || updateError.message.includes('waktu_pengambilan_baju'))) {
          alert("Kolom 'pengambilan_snack' atau 'pengambilan_baju' belum ditambahkan di Supabase.\nSilakan jalankan skrip SQL 'supabase/add_snack_and_baju_columns.sql' pada SQL Editor Supabase.");
        } else {
          throw updateError;
        }
      }
      
      const updatedUser: Pendaftar = { 
        ...selectedUser, 
        [checkpointId]: newValue ? "Ya" : null,
        [checkpointId.toLowerCase()]: newValue ? "Ya" : null,
        ...(checkpointId.toLowerCase() === 'registrasi_onsite' ? { waktu_registrasi_onsite: newValue ? nowIso : null } : {}),
        ...(checkpointId.toLowerCase() === 'akses_gala_dinner' ? { 
          waktu_akses_gala_dinner: newValue ? nowIso : null,
          kehadiran_gala_dinner: newValue ? "Ya" : null,
          Kehadiran_Gala_Dinner: newValue ? "Ya" : null,
          waktu_kehadiran_gala_dinner: newValue ? nowIso : null
        } : {}),
        ...(checkpointId.toLowerCase() === 'kehadiran_workshop' ? { waktu_kehadiran_workshop: newValue ? nowIso : null } : {}),
        ...(checkpointId.toLowerCase() === 'pengambilan_snack' ? { waktu_pengambilan_snack: newValue ? nowIso : null } : {}),
        ...(checkpointId.toLowerCase() === 'pengambilan_baju' ? { 
          waktu_pengambilan_baju: newValue ? nowIso : null,
          pengambilan_merchandise: newValue ? "Ya" : null,
          Pengambilan_Merchandise: newValue ? "Ya" : null
        } : {}),
        ...(checkpointId.toLowerCase() === 'makan_siang_pesta_rakyat' ? { waktu_makan_siang_pesta_rakyat: newValue ? nowIso : null } : {})
      };

      extraColumns.forEach(col => {
        updatedUser[col] = newValue ? "Ya" : null;
        updatedUser[col.toLowerCase()] = newValue ? "Ya" : null;
      });

      setSelectedUser(updatedUser);
      setData(prevData => prevData.map(d => 
        d["No. Registrasi"] === selectedUser["No. Registrasi"] ? updatedUser : d
      ));

      playScannerChime('success', soundEnabled);
    } catch (err: any) {
      console.error(err);
      playScannerChime('error', soundEnabled);
      alert("Kesalahan saat update checkpoint: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Handler Simpan Perbaikan Data Identitas (Nama, Jenis Kelamin, Tanggal Lahir 3 kolom angka, NIK)
  const handleSimpanIdentitas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    let formattedDob: string | null = null;
    if (editTgl || editBln || editThn) {
      const d = parseInt(editTgl, 10);
      const m = parseInt(editBln, 10);
      const y = parseInt(editThn, 10);

      if (isNaN(d) || d < 1 || d > 31) {
        alert("Tanggal lahir tidak valid. Masukkan angka tanggal antara 1 - 31.");
        return;
      }
      if (isNaN(m) || m < 1 || m > 12) {
        alert("Bulan lahir tidak valid. Masukkan angka bulan antara 1 - 12.");
        return;
      }
      if (isNaN(y) || y < 1920 || y > 2026) {
        alert("Tahun lahir tidak valid. Masukkan 4 digit angka tahun (antara 1920 - 2026).");
        return;
      }

      formattedDob = `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }

    const cleanNik = editNik.replace(/\D/g, "");
    if (cleanNik && cleanNik.length !== 16) {
      alert(`NIK harus terdiri dari tepat 16 digit angka (saat ini ${cleanNik.length} digit).`);
      return;
    }

    setIsSavingIdentity(true);
    try {
      const updatePayload: any = {
        nama_lengkap: editNama.trim() || selectedUser["Nama Lengkap"],
        jenis_kelamin: editJK,
        tanggal_lahir: formattedDob || selectedUser.tanggal_lahir || null
      };

      if (cleanNik) {
        updatePayload.nik = cleanNik;
      }

      const { error: errUpdate } = await supabase
        .from('pendaftar')
        .update(updatePayload)
        .eq('no_registrasi', selectedUser["No. Registrasi"]);

      if (errUpdate) throw errUpdate;

      const updatedUser: Pendaftar = {
        ...selectedUser,
        "Nama Lengkap": updatePayload.nama_lengkap,
        nama_lengkap: updatePayload.nama_lengkap,
        jenis_kelamin: updatePayload.jenis_kelamin,
        "Jenis Kelamin": updatePayload.jenis_kelamin,
        tanggal_lahir: updatePayload.tanggal_lahir,
        "Tanggal Lahir": updatePayload.tanggal_lahir,
        ...(cleanNik ? { nik: cleanNik, "NIK": cleanNik } : {})
      };

      setSelectedUser(updatedUser);
      setData(prevData => prevData.map(d => 
        d["No. Registrasi"] === selectedUser["No. Registrasi"] ? updatedUser : d
      ));

      setIsEditingIdentity(false);
      playScannerChime('success', soundEnabled);
      alert("Data identitas peserta berhasil diperbarui!");
    } catch (err: any) {
      console.error(err);
      playScannerChime('error', soundEnabled);
      alert("Gagal memperbarui data identitas: " + err.message);
    } finally {
      setIsSavingIdentity(false);
    }
  };

  const handleSimpanPemeriksaan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    // Verifikasi Kelengkapan Identitas (Tanggal Lahir dan Jenis Kelamin Wajib Ada)
    const currentDob = selectedUser.tanggal_lahir || selectedUser["Tanggal Lahir"] || "";
    const hasSavedDob = Boolean(currentDob && currentDob !== '-' && currentDob !== 'null' && currentDob.trim());
    
    const currentJk = selectedUser.jenis_kelamin || selectedUser["Jenis Kelamin"] || "";
    const hasSavedJk = Boolean(currentJk && currentJk !== '-' && currentJk !== 'null' && currentJk.trim());

    let formattedDob: string | null = null;
    if (editTgl && editBln && editThn) {
      const d = parseInt(editTgl, 10);
      const m = parseInt(editBln, 10);
      const y = parseInt(editThn, 10);
      if (!isNaN(d) && d >= 1 && d <= 31 && !isNaN(m) && m >= 1 && m <= 12 && !isNaN(y) && y >= 1920 && y <= 2026) {
        formattedDob = `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }

    const effectiveDob = formattedDob || (hasSavedDob ? currentDob : null);
    const effectiveJk = (editJK && editJK !== "-") ? editJK : (hasSavedJk ? currentJk : null);

    if (!effectiveDob || !effectiveJk) {
      playScannerChime('error', soundEnabled);
      alert("Tidak dapat mengirim data! Data peserta belum lengkap. Tanggal Lahir dan Jenis Kelamin wajib diverifikasi dan dilengkapi terlebih dahulu.");
      setIsEditingIdentity(true);
      return;
    }

    if (!gulaDarah || !gulaDarah.trim()) {
      playScannerChime('error', soundEnabled);
      alert("Tidak dapat mengirim data! Nilai pemeriksaan gula darah (mg/dL) belum diisi.");
      return;
    }

    setActionLoading('pemeriksaan');
    try {
      const cleanNik = editNik ? editNik.replace(/\D/g, "") : "";
      const updatePayload: any = {
        tinggi_badan: tinggiBadan ? parseFloat(tinggiBadan) : null,
        berat_badan: beratBadan ? parseFloat(beratBadan) : null,
        tensi: (tensiSistolik && tensiDiastolik) ? `${tensiSistolik}/${tensiDiastolik}` : '',
        gula_darah: gulaDarah.trim(),
        lingkar_perut: lingkarPerut,
        kesediaan_data: kesediaanData ? 'Ya' : 'Tidak',
        gejala_neuropati: gejalaNeuropati ? 'Ya' : 'Tidak',
        cek_gula_darah: 'Ya',
        // Lengkapi data identitas jika sebelumnya kosong atau sedang disunting
        nama_lengkap: (editNama && editNama.trim()) || selectedUser["Nama Lengkap"] || selectedUser.nama_lengkap,
        jenis_kelamin: effectiveJk,
        tanggal_lahir: effectiveDob
      };

      if (cleanNik && cleanNik.length === 16) {
        updatePayload.nik = cleanNik;
      }

      const { error: updateError } = await supabase
        .from('pendaftar')
        .update(updatePayload)
        .eq('no_registrasi', selectedUser["No. Registrasi"]);

      if (updateError) throw updateError;
      
      const updatedUser: Pendaftar = { 
        ...selectedUser, 
        ...updatePayload,
        "Nama Lengkap": updatePayload.nama_lengkap,
        "Jenis Kelamin": updatePayload.jenis_kelamin,
        "Tanggal Lahir": updatePayload.tanggal_lahir,
        ...(cleanNik && cleanNik.length === 16 ? { "NIK": cleanNik } : {}),
        "Cek_Gula_Darah": 'Ya'
      };
      setSelectedUser(updatedUser);
      setData(prevData => prevData.map(d => 
        d["No. Registrasi"] === selectedUser["No. Registrasi"] ? updatedUser : d
      ));
      
      setIsEditingIdentity(false);
      playScannerChime('success', soundEnabled);
      alert('Data identitas dan hasil pemeriksaan fisik & gula darah berhasil disimpan!');
    } catch (err: any) {
      console.error(err);
      playScannerChime('error', soundEnabled);
      alert('Gagal menyimpan data pemeriksaan: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const startNextScan = () => {
    setSelectedUser(null);
    setScanResult(null);
    setError(null);
    setCandidateList(null);
    setIsScanning(true);
  };

  // Helper Klasifikasi & Hak Akses
  const getParticipantDetails = (p: Pendaftar | null) => {
    if (!p) {
      return {
        kategori: "",
        pilihanKegiatan: "",
        statusBayar: "",
        isLunas: false,
        isCancelled: false,
        catObj: null,
        isIlmiah: false,
        isDHF: false,
        isPestaRakyat: false,
        isOnline: false,
        hasWorkshopTicket: false,
        bersediaAnggota: false,
        nik: "",
        institusi: "",
        cabang: "",
        tanggalLahir: "",
        jenisKelamin: "",
        totalTagihan: 0
      };
    }
    const kategori = String(p["Kategori Peserta"] || p.kategori_peserta || "").trim();
    const pilihanKegiatan = String(p["pilihan_kegiatan"] || p["Akses Kegiatan"] || p.pilihan_kegiatan || "").trim();
    const statusBayar = String(p["Status Pembayaran"] || p.status_pembayaran || "").trim();
    const totalTagihan = Number(p.total_tagihan || p["Total Tagihan"] || 0);
    
    const isLunas = statusBayar === "Lunas";
    const isCancelled = /batal|cancel/i.test(statusBayar);
    
    // Pencocokan cerdas dengan master data kategori
    const catObj = KATEGORI_PESERTA.find(k => 
      k.label.toLowerCase() === kategori.toLowerCase() ||
      k.id === kategori.toLowerCase() ||
      kategori.toLowerCase().includes(k.label.toLowerCase()) ||
      k.label.toLowerCase().includes(kategori.toLowerCase())
    );

    // Kategori Ilmiah: Dokter Spesialis, Dokter Umum, FKTP, Residen/PPDS, Perawat/Edukator, Mahasiswa S1
    const isIlmiah = catObj ? catObj.akses === "ilmiah" : (
      /dokter|spesialis|residen|ppds|perawat|gizi|edukator|mahasiswa/i.test(kategori)
    );

    // DHF (Diabetes Health Forum)
    const isDHF = catObj?.id === "diabetes_health_forum" || 
      /diabetes health forum|health forum|health talk/i.test(kategori) || 
      /health forum|health talk/i.test(pilihanKegiatan);

    // Pesta Rakyat
    const isPestaRakyat = (catObj?.akses === "pesta_rakyat" && !isDHF) || 
      /persadia|masyarakat umum|pesta rakyat/i.test(kategori);

    // Mode Kehadiran (Online vs Onsite)
    const rawMode = String(p.mode_kehadiran || p["Mode Kehadiran"] || (pilihanKegiatan.includes("Online") ? "Online" : "Onsite")).trim();
    const isOnline = rawMode.toLowerCase() === "online" || pilihanKegiatan.toLowerCase().includes("online");

    // Hak Workshop
    const isPerawat = catObj?.id === "perawat" || /perawat|edukator/i.test(kategori);
    const hasWorkshopTicket = isIlmiah && !isOnline && (
      isPerawat || 
      pilihanKegiatan.toLowerCase().includes("workshop") || 
      pilihanKegiatan.toLowerCase().includes("paket")
    );

    // Bersedia Anggota PERSADIA
    const bersediaAnggota = (
      p["bersedia_anggota_persadia"] === true || 
      p["bersedia_anggota_persadia"] === 'Ya' || 
      p["bersedia_anggota_persadia"] === 'true' || 
      p["Bersedia_Anggota_Persadia"] === 'Ya'
    );

    // Hak Akses Undangan Gala Dinner (Default false / ditolak, di-marking oleh Admin)
    const hasGalaDinnerInvite = (
      p.hak_gala_dinner === true || 
      p.hak_gala_dinner === 'true' || 
      p["Hak_Gala_Dinner"] === true || 
      p["Hak_Gala_Dinner"] === 'true' ||
      p.akses_gala_dinner === true ||
      p.akses_gala_dinner === 'true' ||
      p.akses_gala_dinner === 'Ya'
    );

    return {
      kategori,
      pilihanKegiatan,
      statusBayar,
      isLunas,
      isCancelled,
      catObj,
      isIlmiah,
      isDHF,
      isPestaRakyat,
      isOnline,
      hasWorkshopTicket,
      bersediaAnggota,
      hasGalaDinnerInvite,
      nik: p.nik || p["NIK"] || "",
      institusi: p.institusi || p["Institusi"] || "",
      cabang: p.cabang_persadia || p["Cabang PERSADIA"] || "",
      tanggalLahir: p.tanggal_lahir || p["Tanggal Lahir"] || "",
      jenisKelamin: p.jenis_kelamin || p["Jenis Kelamin"] || "",
      totalTagihan
    };
  };

  const details = getParticipantDetails(selectedUser);

  // Verifikasi kelengkapan data identitas (khususnya untuk pos pemeriksaan gula darah)
  const hasSavedDob = Boolean(details.tanggalLahir && details.tanggalLahir !== '-' && details.tanggalLahir !== 'null' && details.tanggalLahir.trim());
  const hasSavedJk = Boolean(details.jenisKelamin && details.jenisKelamin !== '-' && details.jenisKelamin !== 'null' && details.jenisKelamin.trim());

  let hasInputDob = false;
  if (editTgl && editBln && editThn) {
    const d = parseInt(editTgl, 10);
    const m = parseInt(editBln, 10);
    const y = parseInt(editThn, 10);
    if (!isNaN(d) && d >= 1 && d <= 31 && !isNaN(m) && m >= 1 && m <= 12 && !isNaN(y) && y >= 1920 && y <= 2026) {
      hasInputDob = true;
    }
  }
  const hasInputJk = editJK === 'Laki-laki' || editJK === 'Perempuan';

  const isTanggalLahirMissing = !hasSavedDob && !hasInputDob;
  const isJenisKelaminMissing = !hasSavedJk && !hasInputJk;
  const isNamaMissing = !(editNama || selectedUser?.["Nama Lengkap"] || selectedUser?.nama_lengkap || "").trim();

  const isIdentityIncomplete = isTanggalLahirMissing || isJenisKelaminMissing || isNamaMissing;
  const isGulaDarahEmpty = !gulaDarah || !gulaDarah.trim();

  // Tombol simpan terkunci jika di pos pemeriksaan gula darah dan data belum lengkap
  const isPemeriksaanDisabled = actionLoading === 'pemeriksaan' || isIdentityIncomplete || isGulaDarahEmpty;

  let hasAccess = false;
  let rejectionReason = "";

  if (selectedUser) {
    if (details.isCancelled) {
      hasAccess = false;
      rejectionReason = "PENDAFTARAN DIBATALKAN: Tiket ini telah dinonaktifkan oleh panitia dan tidak dapat digunakan.";
    } else if ((details.isIlmiah || details.isDHF) && !details.isLunas) {
      hasAccess = false;
      rejectionReason = "PEMBAYARAN BELUM LUNAS: Registrasi & rangkaian kegiatan belum dapat diikuti sebelum status pembayaran diverifikasi Lunas.";
    } else {
      // Validasi berdasarkan mode scanner & tanggal kegiatan
      if (scannerMode === 'registrasi') {
        if (details.isOnline) {
          hasAccess = false;
          rejectionReason = "TIKET KHUSUS ONLINE: Peserta terdaftar pada sesi daring (webinar) dan tidak perlu melakukan registrasi fisik di venue.";
        } else if (selectedDate === '2026-11-07' && details.isPestaRakyat && !details.isIlmiah && !details.isDHF) {
          hasAccess = false;
          rejectionReason = "PERHATIAN TANGGAL: Tiket peserta adalah Pesta Rakyat untuk Hari ke-2 (Minggu, 8 Nov 2026 di GOR Pakansari). Agenda Hari ke-1 di Novotel Bogor khusus Peserta Ilmiah & DHF.";
        } else {
          hasAccess = true;
        }
      } else if (scannerMode === 'gala_dinner') {
        if (selectedDate === '2026-11-08') {
          hasAccess = false;
          rejectionReason = "SELESAI: Gala Dinner / Malam Keakraban dilaksanakan pada Hari ke-1 (Sabtu malam, 7 Nov 2026 di Grand Ballroom Novotel Bogor).";
        } else if (details.isOnline) {
          hasAccess = false;
          rejectionReason = "TIKET KHUSUS ONLINE: Peserta terdaftar pada sesi daring (webinar) dan tidak termasuk undangan fisik Gala Dinner di Novotel Bogor.";
        } else if (!details.hasGalaDinnerInvite) {
          hasAccess = false;
          rejectionReason = "AKSES DITOLAK: Nama peserta TIDAK terdaftar dalam daftar undangan Gala Dinner. Silakan konfirmasi ke meja panitia/sekretariat.";
        } else {
          hasAccess = true;
        }
      } else if (scannerMode === 'workshop') {
        if (selectedDate === '2026-11-08') {
          hasAccess = false;
          rejectionReason = "SELESAI: Sesi Workshop Medis telah selesai dilaksanakan pada Hari ke-1 (Sabtu, 7 Nov 2026 di Novotel Bogor). Hari ini adalah agenda Pesta Rakyat di GOR Pakansari.";
        } else if (details.isOnline) {
          hasAccess = false;
          rejectionReason = "TIKET ONLINE: Sesi workshop medis ini khusus bagi peserta tatap muka (onsite).";
        } else if (details.hasWorkshopTicket) {
          hasAccess = true;
        } else if (details.isIlmiah) {
          hasAccess = false;
          rejectionReason = "AKSES DITOLAK: Tiket peserta adalah Simposium Saja (tidak termasuk Workshop Medis).";
        } else if (details.isDHF) {
          hasAccess = false;
          rejectionReason = "AKSES DITOLAK: Tiket peserta adalah Diabetes Health Forum (bukan Workshop Medis).";
        } else {
          hasAccess = false;
          rejectionReason = "AKSES DITOLAK: Peserta bukan kategori Sesi Ilmiah / Workshop.";
        }
      } else if (scannerMode === 'snack') {
        if (details.isOnline) {
          hasAccess = false;
          rejectionReason = "TIKET ONLINE: Peserta terdaftar pada sesi daring (tidak berhak atas pengambilan snack fisik di lokasi).";
        } else {
          hasAccess = true;
        }
      } else if (scannerMode === 'makan_siang') {
        if (details.isOnline) {
          hasAccess = false;
          rejectionReason = "TIKET ONLINE: Peserta terdaftar pada sesi daring (tidak berhak atas kupon konsumsi fisik di lokasi).";
        } else if (selectedDate === '2026-11-07' && !(details.isIlmiah || details.isDHF)) {
          hasAccess = false;
          rejectionReason = "HAK MAKAN SIANG HARI 1: Tiket peserta ini tidak termasuk makan siang Hari ke-1 di Novotel Bogor. Kupon makan siang peserta tersedia pada Hari ke-2 (Minggu, 8 Nov di GOR Pakansari).";
        } else {
          hasAccess = true;
        }
      } else if (scannerMode === 'gula_darah') {
        if (details.isOnline) {
          hasAccess = false;
          rejectionReason = "TIKET ONLINE: Sesi skrining & pemeriksaan gula darah dilaksanakan secara langsung di GOR Pakansari.";
        } else {
          hasAccess = true;
        }
      } else if (scannerMode === 'baju') {
        if (details.kategori === "Anggota PERSADIA" || details.bersediaAnggota) {
          hasAccess = true;
        } else if (details.isIlmiah || details.isDHF) {
          hasAccess = true;
        } else if (details.pilihanKegiatan.toLowerCase().includes('kaos') || details.totalTagihan >= 100000) {
          hasAccess = true;
        } else {
          hasAccess = false;
          rejectionReason = "AKSES DITOLAK: Tiket ini adalah Tiket Akses Masuk Gratis (tanpa paket kaos). Pengambilan baju hanya untuk Anggota PERSADIA atau peserta yang memesan Paket Kaos.";
        }
      }
    }
  }

  // Tampilan Login Petugas dengan Passcode Cepat
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-7 sm:p-8 rounded-3xl shadow-xl max-w-md w-full border border-slate-200/90 relative overflow-hidden">
          {/* Aksen Hiasan Atas */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />

          <div className="flex justify-center mb-5">
            <div className="h-16 w-16 bg-emerald-50 border-2 border-emerald-100 rounded-2xl flex items-center justify-center shadow-xs">
              <KeyRound className="h-8 w-8 text-emerald-600" />
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 text-center mb-1.5 tracking-tight">
            Scanner Petugas Panitia
          </h1>
          <p className="text-slate-500 text-center mb-6 text-xs sm:text-sm leading-relaxed">
            Masukkan passcode akses untuk membuka pemindai tiket QR &amp; verifikasi presensi.
          </p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Passcode Akses Petugas
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan passcode..."
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full pl-4 pr-11 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-sm font-medium"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  title={showPassword ? "Sembunyikan" : "Tampilkan"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Nomor Meja / Nama Petugas</span>
                <span className="text-[10px] text-slate-400 font-normal normal-case">(Opsional)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Contoh: Meja 03 / dr. Rina"
                  value={loginNomorMeja}
                  onChange={(e) => setLoginNomorMeja(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-sm"
                />
              </div>
            </div>

            {loginError && (
              <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
              disabled={authLoading || !passcode.trim()}
            >
              {authLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <KeyRound className="w-4 h-4 mr-2" />}
              {authLoading ? "Memverifikasi..." : "Akses Scanner"}
            </button>
          </form>
          
          <div className="mt-6 text-center border-t border-slate-100 pt-4">
            <a href="/" className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 transition-colors font-medium">
              <ArrowLeft className="h-3.5 w-3.5" />
              Kembali ke Beranda
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (loading && data.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-4" />
          <p className="text-slate-600 font-medium">Memuat data pendaftar...</p>
        </div>
      </div>
    );
  }

  // Layar Pemilihan Tanggal Acara Pasca Login (HANYA 2 PILIHAN: Hari 1 vs Hari 2)
  if (!hasConfirmedDate) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-6 sm:p-8 border border-slate-200">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 bg-emerald-50 text-emerald-600 rounded-2xl mb-3">
              <Calendar className="w-8 h-8" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800">Pilih Tanggal Kegiatan</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Silakan pilih tanggal acara tempat pos Anda bertugas:
            </p>
          </div>

          <div className="space-y-3.5">
            {/* Pilihan 1: Hari 1 Novotel */}
            <button
              onClick={() => handleDateChange('2026-11-07')}
              className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer group ${
                selectedDate === '2026-11-07'
                  ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-200 shadow-xs'
                  : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-100 text-indigo-800 tracking-wide uppercase">
                  Hari Ke-1 (H1)
                </span>
                <span className="text-xs font-semibold text-slate-400">Sabtu, 7 Nov 2026</span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                Novotel Bogor Golf Resort
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Sesi Ilmiah, Simposium, Rapat Organisasi & Malam Keakraban (Gala Dinner)
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-slate-200/60">
                <span className="text-[10px] px-2 py-0.5 bg-white border border-indigo-200 text-indigo-700 rounded-md font-bold">
                  ✓ Registrasi Onsite
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-white border border-indigo-200 text-indigo-700 rounded-md font-bold">
                  ✓ Akses Gala Dinner
                </span>
              </div>
            </button>

            {/* Pilihan 2: Hari 2 Pakansari */}
            <button
              onClick={() => handleDateChange('2026-11-08')}
              className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer group ${
                selectedDate === '2026-11-08'
                  ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-200 shadow-xs'
                  : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 tracking-wide uppercase">
                  Hari Ke-2 (H2)
                </span>
                <span className="text-xs font-semibold text-slate-400">Minggu, 8 Nov 2026</span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-base group-hover:text-emerald-600 transition-colors">
                GOR Stadion Pakansari Cibinong
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Pesta Rakyat, Senam Massal, Skrining & Cek Gula Darah, Pembagian Snack & Baju
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-slate-200/60">
                <span className="text-[10px] px-2 py-0.5 bg-white border border-emerald-200 text-emerald-700 rounded-md font-bold">
                  ✓ Registrasi Onsite
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-white border border-emerald-200 text-emerald-700 rounded-md font-bold">
                  ✓ Pengambilan Snack
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-white border border-emerald-200 text-emerald-700 rounded-md font-bold">
                  ✓ Pengambilan Makan Siang
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-white border border-emerald-200 text-emerald-700 rounded-md font-bold">
                  ✓ Pengambilan Gula Darah
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-white border border-emerald-200 text-emerald-700 rounded-md font-bold">
                  ✓ Pengambilan Baju
                </span>
              </div>
            </button>
          </div>

          <div className="mt-6 flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-100">
            <span>Petugas: <strong>{nomorMeja ? nomorMeja : 'Panitia Lapangan'}</strong></span>
            <button
              onClick={handleLogout}
              className="text-red-500 hover:text-red-700 font-semibold cursor-pointer"
            >
              Keluar Akses
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Header Bar */}
      <header className="bg-emerald-700 text-white p-4 shadow-md sticky top-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            {/* Tombol Back Panah Kiri untuk kembali ke laman sebelumnya / laman awal */}
            <button
              type="button"
              onClick={() => {
                if (selectedUser) {
                  setSelectedUser(null);
                  setIsScanning(true);
                } else if (scannerMode) {
                  setScannerMode(null);
                  setIsScanning(false);
                  setError(null);
                } else {
                  setHasConfirmedDate(false);
                  localStorage.removeItem('scanner_date_confirmed');
                }
              }}
              className="p-1.5 -ml-1 rounded-lg hover:bg-emerald-800 text-white transition-colors cursor-pointer shrink-0"
              title={
                selectedUser 
                  ? "Kembali ke Scanner" 
                  : scannerMode 
                  ? "Kembali ke Pilihan Pos" 
                  : "Kembali ke Pilihan Tanggal"
              }
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold truncate">
                {selectedUser 
                  ? (currentModeItem ? currentModeItem.label : "Data Peserta")
                  : scannerMode 
                  ? (currentModeItem ? currentModeItem.label : "Scanner Panitia")
                  : (selectedDate === '2026-11-07' ? 'Pos Hari 1 (Novotel)' : 'Pos Hari 2 (Pakansari)')}
              </h1>
            </div>
            
            {/* Badge Nomor Meja Petugas */}
            <div className="relative">
              <button
                onClick={() => setIsSettingMeja(!isSettingMeja)}
                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-800 hover:bg-emerald-900 text-emerald-100 border border-emerald-600/70 rounded-lg text-xs font-bold transition-all cursor-pointer"
                title="Klik untuk mengatur nomor meja / pos Anda"
              >
                <Hash className="w-3 h-3 text-emerald-300" />
                <span>{nomorMeja ? nomorMeja : "Meja"}</span>
              </button>

              {/* Popover Setting Nomor Meja */}
              {isSettingMeja && (
                <div className="absolute left-0 top-full mt-2 w-52 bg-white text-slate-800 p-3 rounded-xl shadow-xl border border-slate-200 z-30 animate-in fade-in zoom-in-95">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nomor Meja / Petugas:</label>
                  <input
                    type="text"
                    placeholder="Contoh: Meja 12"
                    value={nomorMeja}
                    onChange={(e) => {
                      setNomorMeja(e.target.value);
                      localStorage.setItem('scanner_nomor_meja', e.target.value);
                    }}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500 mb-2"
                    autoFocus
                  />
                  <div className="flex items-center justify-between gap-1.5">
                    <button
                      onClick={() => {
                        setNomorMeja('');
                        localStorage.removeItem('scanner_nomor_meja');
                        setIsSettingMeja(false);
                      }}
                      className="px-2 py-1 text-slate-500 hover:text-red-600 text-[10px]"
                    >
                      Hapus
                    </button>
                    <button
                      onClick={() => setIsSettingMeja(false)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-bold"
                    >
                      Selesai
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Toggle Suara */}
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-full transition-colors ${soundEnabled ? 'bg-emerald-800 hover:bg-emerald-900 text-emerald-200' : 'bg-red-800 text-red-200'}`}
              title={soundEnabled ? "Suara Aktif (Klik untuk Mute)" : "Suara Bisu (Klik untuk Bunyikan)"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>

            {/* Refresh Data */}
            <button 
              onClick={fetchData}
              disabled={loading}
              className="p-2 bg-emerald-800 hover:bg-emerald-900 rounded-full transition-colors disabled:opacity-50"
              title="Refresh Data Pendaftar"
            >
              <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Logout */}
            <button 
              onClick={handleLogout}
              className="p-2 bg-emerald-800 hover:bg-red-600 rounded-full transition-colors cursor-pointer"
              title="Keluar Akses Scanner"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 mt-3">
        {/* Pesan Error / Notifikasi */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start shadow-xs">
            <ShieldAlert className="w-5 h-5 text-red-600 mt-0.5 mr-3 shrink-0" />
            <div className="flex-1">
              <p className="text-red-800 text-sm font-medium">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 ml-2">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Modal Hasil Pencarian Ganda (Jika nama mirip ditemukan > 1 orang) */}
        {candidateList && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base">Pilih Peserta ({candidateList.length} Ditemukan)</h3>
                  <p className="text-xs text-slate-300">Pilih salah satu peserta yang sesuai identitasnya:</p>
                </div>
                <button 
                  onClick={() => setCandidateList(null)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="overflow-y-auto p-3 space-y-2 divide-y divide-slate-100 flex-1">
                {candidateList.map((item, idx) => {
                  const itemDet = getParticipantDetails(item);
                  return (
                    <div 
                      key={item["No. Registrasi"] || idx}
                      onClick={() => {
                        setCandidateList(null);
                        handleSelectUser(item, item["No. Registrasi"]);
                      }}
                      className="p-3 hover:bg-emerald-50/70 rounded-xl border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded">
                            {item["No. Registrasi"]}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            itemDet.isCancelled ? 'bg-rose-100 text-rose-800' :
                            itemDet.isLunas ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {itemDet.isCancelled ? 'Dibatalkan' : (item["Status Pembayaran"] || "Belum Lunas")}
                          </span>
                          {itemDet.isOnline && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-sky-100 text-sky-800 rounded">
                              Online
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 truncate">{item["Nama Lengkap"]}</h4>
                        <p className="text-xs text-slate-500 truncate">
                          {item["Kategori Peserta"]}
                          {item.institusi ? ` • ${item.institusi}` : ''}
                          {item.cabang_persadia ? ` • PERSADIA ${item.cabang_persadia}` : ''}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
                <button 
                  onClick={() => setCandidateList(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAMPILAN 1: PILIHAN POS SCANNER (Jika belum memilih pos) */}
        {/* ======================================================== */}
        {!selectedUser && !scannerMode && (
          <div className="space-y-4">
            {/* Banner Tanggal Kegiatan Aktif (Tanpa tombol ganti hari & tanpa statistik) */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${selectedDate === '2026-11-07' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
                    Tanggal Acara Bertugas
                  </span>
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">
                    {selectedDate === '2026-11-07' ? 'Hari 1 • Sabtu, 7 Nov 2026' : 'Hari 2 • Minggu, 8 Nov 2026'}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedDate === '2026-11-07' ? 'Novotel Bogor Golf Resort & Convention' : 'GOR Stadion Pakansari Cibinong'}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Tombol Pos Scanner */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 sm:p-5">
              <div className="mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                  Pilih Pos Scanner Anda
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pilih pos penugasan Anda untuk mengaktifkan pemindaian QR tiket atau pencarian manual peserta.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {getAvailableModesForDate(selectedDate).map((modeItem, idx) => {
                  const Icon = modeItem.icon;
                  return (
                    <button
                      key={modeItem.id + modeItem.label}
                      type="button"
                      onClick={() => {
                        setScannerMode(modeItem.id);
                        setError(null);
                      }}
                      className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 bg-slate-50/50 transition-all text-left flex items-center justify-between group cursor-pointer shadow-xs hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0 shadow-xs">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 group-hover:bg-emerald-200 group-hover:text-emerald-800">
                              Pos {idx + 1}
                            </span>
                            <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                              {modeItem.label}
                            </h3>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">
                            {modeItem.sub}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 shrink-0 ml-2 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAMPILAN 2: SCANNER POS AKTIF (Muncul setelah memilih pos) */}
        {/* ======================================================== */}
        {!selectedUser && scannerMode && (
          <div className="space-y-4">
            {/* Banner Pos Bertugas Aktif */}
            {currentModeItem && (
              <div className="bg-white rounded-2xl shadow-xs border border-emerald-200 p-4 sm:p-5 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <currentModeItem.icon className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        Pos Aktif
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {selectedDate === '2026-11-07' ? 'Hari 1 (Novotel)' : 'Hari 2 (Pakansari)'}
                      </span>
                    </div>
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">
                      {currentModeItem.label}
                    </h2>
                    <p className="text-xs text-slate-500 truncate">
                      {currentModeItem.sub}
                      {nomorMeja ? ` • Meja: ${nomorMeja}` : ''}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setScannerMode(null);
                    setIsScanning(false);
                    setError(null);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Ganti Pos</span>
                </button>
              </div>
            )}

            {/* Viewfinder Kamera Scanner Persegi (1:1 Square) */}
            <div className={`bg-white rounded-2xl shadow-md border border-slate-200 p-4 sm:p-5 overflow-hidden ${isScanning ? 'block' : 'hidden'}`}>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Kamera Scanner Aktif</h2>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                      Lensa Normal (1x)
                    </span>
                    {availableCameras.length > 1 && (
                      <span className="text-[11px] text-slate-500 font-medium">
                        (Sensor {availableCameras.findIndex(c => c.id === currentCameraId) + 1} dari {availableCameras.length})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {availableCameras.length > 1 && (
                    <button
                      type="button"
                      onClick={handleSwitchCamera}
                      disabled={isSwitchingCamera}
                      className="px-2.5 py-2 min-h-[40px] flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                      title="Ganti sensor kamera belakang"
                    >
                      <RefreshCw className={`w-4 h-4 text-slate-600 ${isSwitchingCamera ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">Ganti Lensa</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={toggleTorch}
                    className={`p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                      torchOn ? 'bg-amber-100 text-amber-700 font-bold' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                    title="Lampu Senter"
                  >
                    <Flashlight className="w-5 h-5" />
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsScanning(false)}
                    className="text-slate-600 hover:text-slate-900 text-xs font-bold px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center cursor-pointer min-h-[40px]"
                  >
                    Tutup Kamera
                  </button>
                </div>
              </div>
              
              {/* Frame Kamera Persegi (1:1 Square) */}
              <div className="relative w-full max-w-[340px] sm:max-w-[360px] aspect-square mx-auto rounded-2xl overflow-hidden shadow-inner bg-black border-2 border-slate-800">
                {/* Target DOM Html5Qrcode */}
                <div id="reader" className="w-full h-full" style={{ touchAction: 'pan-y' }}></div>

                {/* Square Viewfinder Reticle Overlay */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="w-[78%] aspect-square border-2 border-emerald-400/90 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.48)]">
                    <span className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl"></span>
                    <span className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl"></span>
                    <span className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl"></span>
                    <span className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl"></span>
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent absolute top-1/2 -translate-y-1/2 animate-pulse opacity-90 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                  </div>
                </div>
              </div>

              <p className="text-center text-xs text-slate-500 mt-3">
                Arahkan kotak bujur sangkar ke QR code e-ticket peserta. Pemindaian berlangsung otomatis.
              </p>
            </div>

            {/* Action Card Mulai Scan Kamera (Jika kamera sedang ditutup) */}
            {!isScanning && (
              <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                  <QrCode className="w-8 h-8" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Pindai QR E-Ticket</h2>
                <p className="text-slate-600 text-xs sm:text-sm mb-4 max-w-sm">
                  Arahkan kamera ke QR code tiket peserta untuk verifikasi dan penyaluran pos <strong className="text-emerald-700">{currentModeItem?.label}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => setIsScanning(true)}
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center cursor-pointer text-sm"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Mulai Scan Kamera
                </button>
              </div>
            )}

            {/* Pemisah "Atau Cari Manual" */}
            <div className="flex items-center space-x-3 pt-1">
              <div className="flex-1 h-px bg-slate-200"></div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Atau Cari Manual</span>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>

            {/* Form Pencarian Manual Peserta */}
            <form onSubmit={handleManualSearch} className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  name="searchId"
                  placeholder="Ketik No. Registrasi / Nama / WhatsApp..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all"
                />
                <button 
                  type="submit" 
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-colors flex items-center justify-center text-sm cursor-pointer shrink-0"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Cari Peserta
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tampilan Profil Peserta yang Dipindai */}
        {selectedUser && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
            {/* Navigasi Atas & Tombol Scan Cepat */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <button 
                onClick={() => {
                  setSelectedUser(null);
                  setScanResult(null);
                  setError(null);
                  setIsEditingIdentity(false);
                }}
                className="flex items-center text-slate-600 hover:text-slate-900 transition-colors text-xs font-bold py-1.5 px-3 bg-white border border-slate-200 rounded-lg shadow-2xs"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Kembali
              </button>

              <button 
                onClick={startNextScan}
                className="flex items-center gap-1.5 text-xs font-bold py-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer ml-auto"
              >
                <Camera className="w-4 h-4" />
                <span>Scan Peserta Berikutnya</span>
              </button>
            </div>

            {/* Banner Tanggal & Venue Aktif */}
            <div className="bg-white rounded-xl shadow-2xs border border-slate-200 p-3 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${selectedDate === '2026-11-07' ? 'bg-indigo-600' : 'bg-emerald-600'}`}></div>
                <div className="text-xs">
                  <span className="font-bold text-slate-800">
                    Hari Aktif: {selectedDate === '2026-11-07' ? 'Hari 1 (Sabtu, 7 Nov 2026)' : 'Hari 2 (Minggu, 8 Nov 2026)'}
                  </span>
                  <span className="text-slate-400 ml-1.5 hidden sm:inline">
                    ({selectedDate === '2026-11-07' ? 'Novotel Bogor' : 'GOR Pakansari'})
                  </span>
                </div>
              </div>
            </div>

            {/* Kartu Profil Peserta */}
            <div className={`bg-white rounded-2xl shadow-xs border p-4 sm:p-5 ${
              details.isCancelled 
                ? 'border-rose-400 bg-rose-50/20' 
                : details.isLunas 
                ? 'border-emerald-200' 
                : 'border-red-200 bg-red-50/10'
            }`}>
              <div className="space-y-3">
                {/* Header Tag Badges */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                    {selectedUser["No. Registrasi"]}
                  </span>

                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                    details.isCancelled
                      ? 'bg-rose-600 text-white font-black'
                      : details.isLunas
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {details.isCancelled ? 'Dibatalkan' : (selectedUser["Status Pembayaran"] || "Belum Lunas")}
                  </span>

                  {details.isOnline ? (
                    <span className="text-[11px] font-bold px-2 py-0.5 bg-sky-100 text-sky-800 border border-sky-300 rounded-md">
                      🌐 Peserta Daring (Online)
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md">
                      📍 Tatap Muka (Onsite)
                    </span>
                  )}

                  {details.hasWorkshopTicket && (
                    <span className="text-[11px] font-bold px-2 py-0.5 bg-purple-100 text-purple-800 border border-purple-300 rounded-md flex items-center gap-1">
                      🔬 Termasuk Workshop
                    </span>
                  )}

                  {details.hasGalaDinnerInvite && (
                    <span className="text-[11px] font-bold px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-300 rounded-md flex items-center gap-1">
                      🍽️ Undangan Gala Dinner
                    </span>
                  )}

                  {(selectedUser['Akses_Gala_Dinner'] === 'Ya' || selectedUser['akses_gala_dinner'] === 'Ya' || selectedUser['Kehadiran_Gala_Dinner'] === 'Ya' || selectedUser['kehadiran_gala_dinner'] === 'Ya') && (
                    <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md flex items-center gap-1">
                      ✓ Hadir Gala Dinner
                    </span>
                  )}
                </div>

                {/* Nama & Kategori */}
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                    {selectedUser["Nama Lengkap"]}
                  </h2>
                  <p className="text-xs sm:text-sm font-semibold text-emerald-800 mt-1">
                    {selectedUser["Kategori Peserta"]}
                  </p>
                </div>

                {/* Info Detail Grid */}
                <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {details.institusi && (
                    <div>
                      <span className="text-slate-400 block text-[11px]">Institusi / Tempat Bertugas</span>
                      <strong className="text-slate-800">{details.institusi}</strong>
                    </div>
                  )}

                  {details.cabang && (
                    <div>
                      <span className="text-slate-400 block text-[11px]">Cabang PERSADIA</span>
                      <strong className="text-slate-800">{details.cabang}</strong>
                    </div>
                  )}

                  <div>
                    <span className="text-slate-400 block text-[11px]">Tanggal Lahir</span>
                    {hasSavedDob ? (
                      <strong className="text-slate-800">{formatTglIndo(details.tanggalLahir)}</strong>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded mt-0.5">
                        <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                        <span>{(scannerMode === 'gula_darah' || scannerMode === 'pesta_rakyat') ? 'Belum Terisi (Wajib)' : 'Belum tercatat'}</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Jenis Kelamin</span>
                    {hasSavedJk ? (
                      <strong className="text-slate-800">{details.jenisKelamin}</strong>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded mt-0.5">
                        <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                        <span>{(scannerMode === 'gula_darah' || scannerMode === 'pesta_rakyat') ? 'Belum Terisi (Wajib)' : 'Belum tercatat'}</span>
                      </span>
                    )}
                  </div>

                  {selectedUser.whatsapp && (
                    <div>
                      <span className="text-slate-400 block text-[11px]">No. WhatsApp</span>
                      <strong className="text-slate-800 font-mono">{selectedUser.whatsapp}</strong>
                    </div>
                  )}

                  {selectedUser.email && (
                    <div>
                      <span className="text-slate-400 block text-[11px]">Email</span>
                      <strong className="text-slate-800">{selectedUser.email}</strong>
                    </div>
                  )}
                </div>

                {/* Baris NIK (SKP Kemenkes RI) */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="text-slate-500 font-medium">NIK (Kemenkes SKP):</span>
                    {details.nik && details.nik !== "-" ? (
                      <span className="font-mono font-bold text-slate-900 tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                        {details.nik}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Belum tercatat</span>
                    )}
                  </div>

                  {/* Peringatan NIK kosong khusus nakes ilmiah */}
                  {details.isIlmiah && details.catObj?.id !== "mahasiswa" && (!details.nik || details.nik === "-") && (
                    <div className="mt-1.5 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Perhatian SKP Kemenkes:</strong> NIK peserta belum tercatat. Mohon konfirmasi 16 digit NIK peserta untuk pelaporan SKP SatuSehat SDMK.
                      </div>
                    </div>
                  )}
                </div>

                {/* Tombol Buka Form Perbaikan Data Identitas */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs text-slate-500 font-medium">Ada kesalahan data identitas?</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingIdentity(!isEditingIdentity)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditingIdentity ? "Tutup Form Edit" : "Perbaiki / Lengkapi Identitas"}</span>
                  </button>
                </div>

                {/* Form Perbaikan Data Identitas (Ketik Angka Tanpa Picker) */}
                {isEditingIdentity && (
                  <form onSubmit={handleSimpanIdentitas} className="mt-3 p-4 bg-slate-50/90 rounded-xl border border-blue-200 space-y-3 animate-in fade-in zoom-in-98 duration-150 text-left">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        <span>Perbaiki Data Identitas Peserta</span>
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">{selectedUser["No. Registrasi"]}</span>
                    </div>

                    {/* Nama Lengkap */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                      <input
                        type="text"
                        value={editNama}
                        onChange={(e) => setEditNama(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Nama lengkap peserta"
                        required
                      />
                    </div>

                    {/* Jenis Kelamin */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setEditJK("Laki-laki")}
                          className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            editJK === "Laki-laki" 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs' 
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {editJK === "Laki-laki" && <Check className="w-3.5 h-3.5" />}
                          <span>Laki-laki</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditJK("Perempuan")}
                          className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            editJK === "Perempuan" 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs' 
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {editJK === "Perempuan" && <Check className="w-3.5 h-3.5" />}
                          <span>Perempuan</span>
                        </button>
                      </div>
                    </div>

                    {/* Tanggal Lahir (Ketik Angka Saja: Tanggal, Bulan, Tahun - Tanpa Picker) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-semibold text-slate-700">Tanggal Lahir (Ketik Angka Saja)</label>
                        <span className="text-[10px] text-slate-400">DD / MM / YYYY</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            placeholder="Tgl (DD)"
                            value={editTgl}
                            onChange={(e) => setEditTgl(e.target.value.replace(/\D/g, '').slice(0, 2))}
                            className="w-full text-center font-mono font-bold px-2 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                          <span className="text-[9px] text-slate-400 block text-center mt-0.5">1 - 31</span>
                        </div>
                        <div>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            placeholder="Bln (MM)"
                            value={editBln}
                            onChange={(e) => setEditBln(e.target.value.replace(/\D/g, '').slice(0, 2))}
                            className="w-full text-center font-mono font-bold px-2 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                          <span className="text-[9px] text-slate-400 block text-center mt-0.5">1 - 12</span>
                        </div>
                        <div>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={4}
                            placeholder="Thn (YYYY)"
                            value={editThn}
                            onChange={(e) => setEditThn(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            className="w-full text-center font-mono font-bold px-2 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                          <span className="text-[9px] text-slate-400 block text-center mt-0.5">Contoh: 1965</span>
                        </div>
                      </div>
                    </div>

                    {/* NIK (16 Digit) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-semibold text-slate-700">NIK (16 Digit - SKP Kemenkes)</label>
                        <span className="text-[10px] text-slate-400 font-mono">{editNik.length}/16</span>
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={16}
                        value={editNik}
                        onChange={(e) => setEditNik(e.target.value.replace(/\D/g, '').slice(0, 16))}
                        placeholder="16 digit NIK KTP peserta"
                        className="w-full font-mono text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    {/* Tombol Simpan / Batal */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setIsEditingIdentity(false)}
                        className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingIdentity}
                        className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors disabled:opacity-50"
                      >
                        {isSavingIdentity ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        <span>{isSavingIdentity ? "Menyimpan..." : "Simpan Perubahan Identitas"}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Hasil Keputusan Hak Akses */}
            {!hasAccess ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center shadow-xs">
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                <h3 className="text-base sm:text-lg font-bold text-red-800 mb-1">Akses Ditolak</h3>
                <p className="text-red-700 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">{rejectionReason}</p>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center shadow-xs">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                <h3 className="text-base sm:text-lg font-bold text-emerald-800 mb-1">Akses Diizinkan</h3>
                <p className="text-emerald-700 text-xs sm:text-sm mb-4">
                  Peserta berhak mengakses pos <strong>{
                    scannerMode === 'registrasi' ? (selectedDate === '2026-11-08' ? 'Registrasi Onsite (Pintu Masuk)' : 'Registrasi Onsite (Novotel)') :
                    scannerMode === 'gala_dinner' ? 'Akses Gala Dinner (Grand Ballroom Novotel)' :
                    scannerMode === 'workshop' ? 'Ruang Sesi Workshop' :
                    scannerMode === 'snack' ? 'Pengambilan Snack' :
                    scannerMode === 'makan_siang' ? (selectedDate === '2026-11-07' ? 'Makan Siang Hari 1 (Novotel)' : 'Pengambilan Makan Siang Hari 2 (Pakansari)') :
                    scannerMode === 'gula_darah' ? 'Pemeriksaan Kesehatan & Cek Gula Darah' :
                    'Pengambilan Baju'
                  }</strong>.
                </p>

                {/* Mode 1: Registrasi Onsite */}
                {scannerMode === 'registrasi' && (
                  <div className="space-y-2">
                    <button
                      disabled={actionLoading === 'Registrasi_OnSite' || selectedUser['Registrasi_OnSite'] === 'Ya' || selectedUser['registrasi_onsite'] === 'Ya'}
                      onClick={() => handleUpdateCheckpoint('Registrasi_OnSite', selectedUser['Registrasi_OnSite'] === 'Ya' || selectedUser['registrasi_onsite'] === 'Ya')}
                      className={`w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center transition-all cursor-pointer ${
                        (selectedUser['Registrasi_OnSite'] === 'Ya' || selectedUser['registrasi_onsite'] === 'Ya')
                          ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                      }`}
                    >
                      {actionLoading === 'Registrasi_OnSite' ? (
                        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                      ) : (selectedUser['Registrasi_OnSite'] === 'Ya' || selectedUser['registrasi_onsite'] === 'Ya') ? (
                        <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-700" />
                      ) : (
                        <CheckSquare className="w-5 h-5 mr-2" />
                      )}
                      {(selectedUser['Registrasi_OnSite'] === 'Ya' || selectedUser['registrasi_onsite'] === 'Ya') 
                        ? (selectedDate === '2026-11-08' ? 'Sudah Presensi Registrasi Onsite' : 'Sudah Registrasi Onsite') 
                        : (selectedDate === '2026-11-08' ? 'Verifikasi Registrasi Onsite' : 'Check-In Registrasi Onsite')}
                    </button>
                    {(selectedUser.waktu_registrasi_onsite || selectedUser['waktu_registrasi_onsite']) && (
                      <p className="text-[11px] text-slate-500">
                        Check-in pada: <strong>{formatWaktu(selectedUser.waktu_registrasi_onsite || selectedUser['waktu_registrasi_onsite'])}</strong>
                      </p>
                    )}
                  </div>
                )}

                {/* Mode: Akses Gala Dinner (Hari 1) */}
                {scannerMode === 'gala_dinner' && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      disabled={
                        actionLoading === 'Akses_Gala_Dinner' || 
                        selectedUser['Akses_Gala_Dinner'] === 'Ya' || 
                        selectedUser['akses_gala_dinner'] === 'Ya' ||
                        selectedUser['Kehadiran_Gala_Dinner'] === 'Ya' ||
                        selectedUser['kehadiran_gala_dinner'] === 'Ya'
                      }
                      onClick={() => handleUpdateCheckpoint(
                        'Akses_Gala_Dinner', 
                        selectedUser['Akses_Gala_Dinner'] === 'Ya' || 
                        selectedUser['akses_gala_dinner'] === 'Ya' ||
                        selectedUser['Kehadiran_Gala_Dinner'] === 'Ya' ||
                        selectedUser['kehadiran_gala_dinner'] === 'Ya'
                      )}
                      className={`w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center transition-all cursor-pointer ${
                        (selectedUser['Akses_Gala_Dinner'] === 'Ya' || selectedUser['akses_gala_dinner'] === 'Ya' || selectedUser['Kehadiran_Gala_Dinner'] === 'Ya' || selectedUser['kehadiran_gala_dinner'] === 'Ya')
                          ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                      }`}
                    >
                      {actionLoading === 'Akses_Gala_Dinner' ? (
                        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                      ) : (selectedUser['Akses_Gala_Dinner'] === 'Ya' || selectedUser['akses_gala_dinner'] === 'Ya' || selectedUser['Kehadiran_Gala_Dinner'] === 'Ya' || selectedUser['kehadiran_gala_dinner'] === 'Ya') ? (
                        <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-700" />
                      ) : (
                        <Utensils className="w-5 h-5 mr-2" />
                      )}
                      {(selectedUser['Akses_Gala_Dinner'] === 'Ya' || selectedUser['akses_gala_dinner'] === 'Ya' || selectedUser['Kehadiran_Gala_Dinner'] === 'Ya' || selectedUser['kehadiran_gala_dinner'] === 'Ya') 
                        ? 'Sudah Masuk Gala Dinner' 
                        : 'Verifikasi Masuk Gala Dinner'}
                    </button>
                    {(selectedUser.waktu_akses_gala_dinner || selectedUser['waktu_akses_gala_dinner'] || selectedUser.waktu_kehadiran_gala_dinner || selectedUser['waktu_kehadiran_gala_dinner']) && (
                      <p className="text-[11px] text-slate-500">
                        Masuk ballroom pada: <strong>{formatWaktu(selectedUser.waktu_akses_gala_dinner || selectedUser['waktu_akses_gala_dinner'] || selectedUser.waktu_kehadiran_gala_dinner || selectedUser['waktu_kehadiran_gala_dinner'])}</strong>
                      </p>
                    )}
                  </div>
                )}

                {/* Mode 2: Presensi Workshop */}
                {scannerMode === 'workshop' && (
                  <div className="space-y-2">
                    <button
                      disabled={actionLoading === 'Kehadiran_Workshop' || selectedUser['Kehadiran_Workshop'] === 'Ya' || selectedUser['kehadiran_workshop'] === 'Ya'}
                      onClick={() => handleUpdateCheckpoint('Kehadiran_Workshop', selectedUser['Kehadiran_Workshop'] === 'Ya' || selectedUser['kehadiran_workshop'] === 'Ya')}
                      className={`w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center transition-all cursor-pointer ${
                        (selectedUser['Kehadiran_Workshop'] === 'Ya' || selectedUser['kehadiran_workshop'] === 'Ya')
                          ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                      }`}
                    >
                      {actionLoading === 'Kehadiran_Workshop' ? (
                        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                      ) : (selectedUser['Kehadiran_Workshop'] === 'Ya' || selectedUser['kehadiran_workshop'] === 'Ya') ? (
                        <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-700" />
                      ) : (
                        <CheckSquare className="w-5 h-5 mr-2" />
                      )}
                      {(selectedUser['Kehadiran_Workshop'] === 'Ya' || selectedUser['kehadiran_workshop'] === 'Ya') 
                        ? 'Sudah Presensi Workshop' 
                        : 'Check-In Ruang Workshop'}
                    </button>
                    {(selectedUser.waktu_kehadiran_workshop || selectedUser['waktu_kehadiran_workshop']) && (
                      <p className="text-[11px] text-slate-500">
                        Presensi workshop pada: <strong>{formatWaktu(selectedUser.waktu_kehadiran_workshop || selectedUser['waktu_kehadiran_workshop'])}</strong>
                      </p>
                    )}
                  </div>
                )}

                {/* Mode 3 (Hari 2): Pengambilan Snack */}
                {scannerMode === 'snack' && (
                  <div className="space-y-2">
                    <button
                      disabled={actionLoading === 'Pengambilan_Snack' || selectedUser['Pengambilan_Snack'] === 'Ya' || selectedUser['pengambilan_snack'] === 'Ya'}
                      onClick={() => handleUpdateCheckpoint('Pengambilan_Snack', selectedUser['Pengambilan_Snack'] === 'Ya' || selectedUser['pengambilan_snack'] === 'Ya')}
                      className={`w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center transition-all cursor-pointer ${
                        (selectedUser['Pengambilan_Snack'] === 'Ya' || selectedUser['pengambilan_snack'] === 'Ya')
                          ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                      }`}
                    >
                      {actionLoading === 'Pengambilan_Snack' ? (
                        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                      ) : (selectedUser['Pengambilan_Snack'] === 'Ya' || selectedUser['pengambilan_snack'] === 'Ya') ? (
                        <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-700" />
                      ) : (
                        <Coffee className="w-5 h-5 mr-2" />
                      )}
                      {(selectedUser['Pengambilan_Snack'] === 'Ya' || selectedUser['pengambilan_snack'] === 'Ya') 
                        ? 'Sudah Mengambil Snack' 
                        : 'Verifikasi Pengambilan Snack'}
                    </button>
                    {(selectedUser.waktu_pengambilan_snack || selectedUser['waktu_pengambilan_snack']) && (
                      <p className="text-[11px] text-slate-500">
                        Diambil pada: <strong>{formatWaktu(selectedUser.waktu_pengambilan_snack || selectedUser['waktu_pengambilan_snack'])}</strong>
                      </p>
                    )}
                  </div>
                )}

                {/* Mode 4: Makan Siang */}
                {scannerMode === 'makan_siang' && (
                  <div className="space-y-2">
                    {selectedDate === '2026-11-07' ? (
                      <div>
                        {(details.isIlmiah || details.isDHF) ? (
                          <div className="space-y-2">
                            <button
                              disabled={actionLoading === 'Makan_Siang_Hari_1' || selectedUser['Makan_Siang_Hari_1'] === 'Ya' || selectedUser['makan_siang_hari_1'] === 'Ya'}
                              onClick={() => handleUpdateCheckpoint('Makan_Siang_Hari_1', selectedUser['Makan_Siang_Hari_1'] === 'Ya' || selectedUser['makan_siang_hari_1'] === 'Ya')}
                              className={`w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center transition-all cursor-pointer ${
                                (selectedUser['Makan_Siang_Hari_1'] === 'Ya' || selectedUser['makan_siang_hari_1'] === 'Ya')
                                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                              }`}
                            >
                              {actionLoading === 'Makan_Siang_Hari_1' ? (
                                <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                              ) : (selectedUser['Makan_Siang_Hari_1'] === 'Ya' || selectedUser['makan_siang_hari_1'] === 'Ya') ? (
                                <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-700" />
                              ) : (
                                <Utensils className="w-5 h-5 mr-2" />
                              )}
                              {(selectedUser['Makan_Siang_Hari_1'] === 'Ya' || selectedUser['makan_siang_hari_1'] === 'Ya') 
                                ? 'Sudah Ambil Makan Siang Hari 1' 
                                : 'Verifikasi Makan Siang Hari 1'}
                            </button>
                            {(selectedUser.waktu_makan_siang_hari_1 || selectedUser['waktu_makan_siang_hari_1']) && (
                              <p className="text-[11px] text-slate-500">
                                Diambil pada: <strong>{formatWaktu(selectedUser.waktu_makan_siang_hari_1 || selectedUser['waktu_makan_siang_hari_1'])}</strong>
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">Peserta kategori ini tidak memiliki hak makan siang Hari 1 di Novotel.</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <button
                          disabled={actionLoading === 'Makan_Siang_Pesta_Rakyat' || selectedUser['Makan_Siang_Pesta_Rakyat'] === 'Ya' || selectedUser['makan_siang_pesta_rakyat'] === 'Ya'}
                          onClick={() => handleUpdateCheckpoint('Makan_Siang_Pesta_Rakyat', selectedUser['Makan_Siang_Pesta_Rakyat'] === 'Ya' || selectedUser['makan_siang_pesta_rakyat'] === 'Ya')}
                          className={`w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center transition-all cursor-pointer ${
                            (selectedUser['Makan_Siang_Pesta_Rakyat'] === 'Ya' || selectedUser['makan_siang_pesta_rakyat'] === 'Ya')
                              ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                          }`}
                        >
                          {actionLoading === 'Makan_Siang_Pesta_Rakyat' ? (
                            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                          ) : (selectedUser['Makan_Siang_Pesta_Rakyat'] === 'Ya' || selectedUser['makan_siang_pesta_rakyat'] === 'Ya') ? (
                            <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-700" />
                          ) : (
                            <Utensils className="w-5 h-5 mr-2" />
                          )}
                          {(selectedUser['Makan_Siang_Pesta_Rakyat'] === 'Ya' || selectedUser['makan_siang_pesta_rakyat'] === 'Ya') 
                            ? 'Sudah Ambil Makan Siang Hari 2' 
                            : 'Verifikasi Pengambilan Makan Siang'}
                        </button>
                        {(selectedUser.waktu_makan_siang_pesta_rakyat || selectedUser['waktu_makan_siang_pesta_rakyat']) && (
                          <p className="text-[11px] text-slate-500">
                            Diambil pada: <strong>{formatWaktu(selectedUser.waktu_makan_siang_pesta_rakyat || selectedUser['waktu_makan_siang_pesta_rakyat'])}</strong>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Mode 5 (Hari 2): Pengambilan Baju */}
                {scannerMode === 'baju' && (
                  <div className="space-y-2">
                    <button
                      disabled={
                        actionLoading === 'Pengambilan_Baju' || 
                        selectedUser['Pengambilan_Baju'] === 'Ya' || selectedUser['pengambilan_baju'] === 'Ya' ||
                        selectedUser['Pengambilan_Merchandise'] === 'Ya' || selectedUser['pengambilan_merchandise'] === 'Ya'
                      }
                      onClick={() => handleUpdateCheckpoint('Pengambilan_Baju', (
                        selectedUser['Pengambilan_Baju'] === 'Ya' || selectedUser['pengambilan_baju'] === 'Ya' ||
                        selectedUser['Pengambilan_Merchandise'] === 'Ya' || selectedUser['pengambilan_merchandise'] === 'Ya'
                      ), ['Pengambilan_Merchandise'])}
                      className={`w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center transition-all cursor-pointer ${
                        (
                          selectedUser['Pengambilan_Baju'] === 'Ya' || selectedUser['pengambilan_baju'] === 'Ya' ||
                          selectedUser['Pengambilan_Merchandise'] === 'Ya' || selectedUser['pengambilan_merchandise'] === 'Ya'
                        )
                          ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                      }`}
                    >
                      {actionLoading === 'Pengambilan_Baju' ? (
                        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                      ) : (
                        selectedUser['Pengambilan_Baju'] === 'Ya' || selectedUser['pengambilan_baju'] === 'Ya' ||
                        selectedUser['Pengambilan_Merchandise'] === 'Ya' || selectedUser['pengambilan_merchandise'] === 'Ya'
                      ) ? (
                        <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-700" />
                      ) : (
                        <Shirt className="w-5 h-5 mr-2" />
                      )}
                      {(
                        selectedUser['Pengambilan_Baju'] === 'Ya' || selectedUser['pengambilan_baju'] === 'Ya' ||
                        selectedUser['Pengambilan_Merchandise'] === 'Ya' || selectedUser['pengambilan_merchandise'] === 'Ya'
                      ) ? 'Sudah Mengambil Baju' : 'Verifikasi Pengambilan Baju'}
                    </button>
                    {(selectedUser.waktu_pengambilan_baju || selectedUser['waktu_pengambilan_baju'] || selectedUser.waktu_pengambilan_merchandise) && (
                      <p className="text-[11px] text-slate-500">
                        Diambil pada: <strong>{formatWaktu(selectedUser.waktu_pengambilan_baju || selectedUser['waktu_pengambilan_baju'] || selectedUser.waktu_pengambilan_merchandise)}</strong>
                      </p>
                    )}
                  </div>
                )}

                {/* Mode 6 (Hari 2): Form Pemeriksaan Kesehatan & Gula Darah */}
                {(scannerMode === 'gula_darah' || scannerMode === 'pesta_rakyat') && (
                  <form onSubmit={handleSimpanPemeriksaan} className="bg-white p-4 rounded-xl border border-emerald-100 text-left space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h4 className="font-bold text-slate-800 text-sm">Form Pemeriksaan Kesehatan (Hari 2)</h4>
                      <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                        Pos Cek Gula Darah
                      </span>
                    </div>

                    {/* Banner Status Verifikasi Data Peserta */}
                    {isIdentityIncomplete ? (
                      <div className="p-3 bg-amber-50 border-2 border-amber-300 rounded-xl text-xs space-y-2">
                        <div className="flex items-center gap-2 text-amber-900 font-bold">
                          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Verifikasi: Data Peserta Belum Lengkap</span>
                        </div>
                        <p className="text-slate-700 text-[11px] leading-relaxed">
                          Tombol simpan <strong>terkunci</strong> karena data identitas peserta belum lengkap. Tanggal Lahir dan Jenis Kelamin wajib diverifikasi sebelum hasil pemeriksaan dapat dikirim:
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {isTanggalLahirMissing && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 font-bold rounded text-[11px]">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              Tanggal Lahir Kosong
                            </span>
                          )}
                          {isJenisKelaminMissing && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 font-bold rounded text-[11px]">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              Jenis Kelamin Kosong
                            </span>
                          )}
                        </div>
                        {!isEditingIdentity && (
                          <button
                            type="button"
                            onClick={() => setIsEditingIdentity(true)}
                            className="mt-1 w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Buka Form Edit Identitas di Atas</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Identitas peserta terverifikasi lengkap (Tanggal Lahir & Jenis Kelamin valid).</span>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1 truncate" title="Tinggi Badan (cm)">Tinggi (cm)</label>
                        <input type="number" value={tinggiBadan} onChange={e => setTinggiBadan(e.target.value)} className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-200 outline-none text-center" placeholder="165" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1 truncate" title="Berat Badan (kg)">Berat (kg)</label>
                        <input type="number" step="0.1" value={beratBadan} onChange={e => setBeratBadan(e.target.value)} className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-200 outline-none text-center" placeholder="60.5" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1 truncate" title="Lingkar Perut (cm)">L. Perut (cm)</label>
                        <input type="number" step="0.1" value={lingkarPerut} onChange={e => setLingkarPerut(e.target.value)} className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-200 outline-none text-center" placeholder="80" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-emerald-800 mb-1 truncate flex items-center justify-between" title="Gula Darah (mg/dL)">
                          <span>Gula Darah (mg/dL) *</span>
                          <span className="text-[10px] text-rose-500 font-bold">Wajib</span>
                        </label>
                        <input 
                          type="number" 
                          value={gulaDarah} 
                          onChange={e => setGulaDarah(e.target.value)} 
                          className={`w-full border-2 rounded-lg p-2 text-sm font-bold text-center outline-none ${
                            !gulaDarah.trim() 
                              ? 'border-amber-300 focus:ring-2 focus:ring-amber-200 bg-amber-50/20' 
                              : 'border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white'
                          }`} 
                          placeholder="Contoh: 110" 
                          required 
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[11px] font-medium text-slate-600 mb-1 truncate" title="Tensi (mmHg)">Tensi (mmHg)</label>
                        <div className="grid grid-cols-2 gap-3 relative items-center">
                          <input type="number" value={tensiSistolik} onChange={e => setTensiSistolik(e.target.value)} className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-200 outline-none text-center" placeholder="120" />
                          <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
                            <span className="text-slate-400 font-bold text-sm bg-white px-1">/</span>
                          </div>
                          <input type="number" value={tensiDiastolik} onChange={e => setTensiDiastolik(e.target.value)} className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-200 outline-none text-center" placeholder="80" />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <label htmlFor="kesediaan-data-cb" className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          id="kesediaan-data-cb"
                          type="checkbox"
                          checked={kesediaanData}
                          onChange={e => setKesediaanData(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                        />
                        <span className="text-xs text-slate-700 font-medium leading-tight">
                          Peserta bersedia datanya dicatat untuk rekam medis / pemantauan kesehatan.
                        </span>
                      </label>

                      <label htmlFor="gejala-neuropati-cb" className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          id="gejala-neuropati-cb"
                          type="checkbox"
                          checked={gejalaNeuropati}
                          onChange={e => setGejalaNeuropati(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                        />
                        <span className="text-xs text-slate-700 font-medium leading-tight">
                          Peserta mengalami gejala neuropati (kesemutan, kebas, atau nyeri pada kaki/tangan).
                        </span>
                      </label>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isPemeriksaanDisabled}
                      className={`w-full py-3 px-4 font-bold rounded-xl transition-all flex items-center justify-center text-sm shadow-xs ${
                        isPemeriksaanDisabled
                          ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed select-none'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-md'
                      }`}
                    >
                      {actionLoading === 'pemeriksaan' ? (
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      ) : isIdentityIncomplete ? (
                        <ShieldAlert className="w-4 h-4 mr-2 text-rose-500" />
                      ) : isGulaDarahEmpty ? (
                        <AlertTriangle className="w-4 h-4 mr-2 text-amber-500" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                      )}

                      {isTanggalLahirMissing && isJenisKelaminMissing ? (
                        'Tombol Terkunci: Lengkapi Tanggal Lahir & Jenis Kelamin'
                      ) : isTanggalLahirMissing ? (
                        'Tombol Terkunci: Lengkapi Tanggal Lahir'
                      ) : isJenisKelaminMissing ? (
                        'Tombol Terkunci: Lengkapi Jenis Kelamin'
                      ) : isGulaDarahEmpty ? (
                        'Masukkan Nilai Gula Darah'
                      ) : (!hasSavedDob || !hasSavedJk) ? (
                        'Simpan Identitas & Data Pemeriksaan'
                      ) : (selectedUser['Cek_Gula_Darah'] === 'Ya' || selectedUser['cek_gula_darah'] === 'Ya') ? (
                        'Update Data Pemeriksaan'
                      ) : (
                        'Simpan Data Pemeriksaan'
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Tombol Aksi Cepat Bawah */}
            <div className="pt-2">
              <button 
                onClick={startNextScan}
                className="w-full py-3.5 px-4 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center text-sm cursor-pointer"
              >
                <Camera className="w-5 h-5 mr-2 text-emerald-400" />
                <span>Pindai Peserta Berikutnya</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
