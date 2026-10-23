import React, { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { EVENT_INFO, KATEGORI_PESERTA } from '../../config';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Users, DollarSign, CheckCircle, Clock, Search, ChevronLeft, ChevronRight, ShieldAlert,
  Loader2, LogOut, CheckSquare, XCircle, MessageCircle, Activity, X,
  Ticket, Copy, Check, Plus, RefreshCw, Share2, Sparkles, Trash2, Filter,
  Download, Eye, ExternalLink, Calendar, MapPin, Building, CreditCard,
  UserCheck, RotateCcw, AlertTriangle, SlidersHorizontal, Power, AlertCircle, Video,
  Pencil, Save, UserPlus, UtensilsCrossed
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateHome: () => void;
}

interface VoucherItem {
  id?: number | string;
  code: string;
  kategori_target?: string | null;
  is_used: boolean;
  used_by?: string | null;
  used_at?: string | null;
  created_at?: string | null;
}

interface Pendaftar {
  id?: number;
  Timestamp: string;
  "No. Registrasi": string;
  "Status Pembayaran": string;
  "Nama Lengkap": string;
  Email: string;
  "No. WhatsApp": string;
  "Kategori Peserta": string;
  "Akses Kegiatan": string;
  "Total Bayar": number | string;
  Institusi: string;
  nim?: string;
  nik?: string;
  tanggal_lahir?: string;
  jenis_kelamin?: string;
  registrasi_onsite?: string | null;
  waktu_registrasi_onsite?: string | null;
  kehadiran_workshop?: string | null;
  waktu_kehadiran_workshop?: string | null;
  hak_gala_dinner?: boolean | null;
  kehadiran_gala_dinner?: string | null;
  waktu_kehadiran_gala_dinner?: string | null;
  akses_gala_dinner?: string | null;
  waktu_akses_gala_dinner?: string | null;
  tinggi_badan?: number | null;
  berat_badan?: number | null;
  tensi?: string | null;
  lingkar_perut?: string | null;
  cek_gula_darah?: string | null;
  gula_darah?: string | null;
  makan_siang_pesta_rakyat?: string | null;
  ikut_health_talk?: boolean | null;
  bersedia_anggota_persadia?: boolean | null;
  alamat_lengkap?: string | null;
  kelurahan?: string | null;
  kecamatan?: string | null;
  kota_kabupaten?: string | null;
  provinsi?: string | null;
  kesediaan_data?: string | null;
  gejala_neuropati?: string | null;
  pengambilan_merchandise?: string | null;
  kode_voucher?: string | null;
  makan_siang_hari_1?: string | null;
  nama_ketua_cabang?: string | null;
  mode_kehadiran?: string | null;
  // Aliases for compatibility
  KodeVoucher?: string;
  CabangPersadia?: string;
  NamaKetuaCabang?: string;
  BersediaAnggota?: boolean;
  AlamatLengkap?: string;
  Kelurahan?: string;
  Kecamatan?: string;
  KotaKabupaten?: string;
  Provinsi?: string;
  _searchIndex?: string;
}

const COLORS = ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'];

// Helper pencocokan kategori pendaftar (termasuk variasi data masa lalu di database) dengan kategori resmi form pendaftaran
const matchesCategory = (rowCategory: string, targetCategory: string): boolean => {
  if (!rowCategory || !targetCategory) return false;
  if (targetCategory === "Semua") return true;
  if (rowCategory === targetCategory) return true;

  const rowLower = rowCategory.toLowerCase();
  const targetLower = targetCategory.toLowerCase();

  // 0. Kategori Pesta Rakyat (Gabungan Anggota PERSADIA & Masyarakat Umum)
  if (targetCategory === "Pesta Rakyat") {
    return (
      rowCategory.startsWith("Anggota PERSADIA") ||
      rowCategory.startsWith("Masyarakat Umum") ||
      rowLower.includes("pesta rakyat")
    );
  }

  // 1. Kategori Dokter Layanan Primer (FKTP)
  if (targetLower.includes("fktp") || targetLower.includes("layanan primer")) {
    return (
      rowLower.includes("fktp") ||
      rowLower.includes("layanan primer") ||
      rowLower.includes("puskesmas") ||
      rowLower.includes("klinik")
    );
  }

  // 2. Kategori Dokter Umum (murni tanpa FKTP/Puskesmas/Klinik)
  if (targetCategory === "Dokter Umum") {
    if (
      rowLower.includes("fktp") ||
      rowLower.includes("layanan primer") ||
      rowLower.includes("puskesmas") ||
      rowLower.includes("klinik")
    ) {
      return false;
    }
    return rowLower.startsWith("dokter umum");
  }

  // 3. Kategori Diabetes Health Forum
  if (targetCategory === "Diabetes Health Forum") {
    return (
      rowCategory === "Diabetes Health Forum" ||
      rowLower.includes("health forum") ||
      rowLower.includes("health talk")
    );
  }

  // Normalisasi variasi data masa lalu ke kategori resmi form
  if (targetCategory.startsWith("Dokter Spesialis") && rowCategory.startsWith("Dokter Spesialis")) return true;
  if (targetCategory.startsWith("Residen") && rowCategory.startsWith("Residen")) return true;
  if (targetCategory.startsWith("Perawat") && rowCategory.startsWith("Perawat")) return true;
  if (targetCategory.startsWith("Mahasiswa") && rowCategory.startsWith("Mahasiswa")) return true;
  if (targetCategory.startsWith("Anggota PERSADIA") && rowCategory.startsWith("Anggota PERSADIA")) return true;
  if (targetCategory.startsWith("Masyarakat Umum") && rowCategory.startsWith("Masyarakat Umum")) return true;

  return false;
};

// Helper: Memastikan HANYA peserta Simposium + Workshop Onsite yang berhak mendapat akses Gala Dinner
export const isEligibleForGalaDinner = (participant: Pendaftar | null | undefined): boolean => {
  if (!participant) return false;

  const keg = (participant["Akses Kegiatan"] || (participant as any).pilihan_kegiatan || "").toLowerCase();
  const kat = (participant["Kategori Peserta"] || (participant as any).kategori_peserta || "").toLowerCase();
  const mode = (participant.mode_kehadiran || "").toLowerCase();

  // 1. Bukan peserta Online (kegiatan Gala Dinner diadakan secara fisik di Ballroom Novotel)
  if (mode === "online" || keg.includes("online")) {
    return false;
  }

  // 2. Bukan Pesta Rakyat / Masyarakat Umum / Anggota Persadia / DHF
  if (
    kat.includes("persadia") ||
    kat.includes("masyarakat") ||
    kat.includes("umum") ||
    kat.includes("diabetes health forum") ||
    keg.includes("pesta rakyat") ||
    keg.includes("health forum")
  ) {
    return false;
  }

  // 3. Harus Kategori Ilmiah Onsite
  const isIlmiah =
    kat.includes("dokter") ||
    kat.includes("spesialis") ||
    kat.includes("residen") ||
    kat.includes("ppds") ||
    kat.includes("perawat") ||
    kat.includes("edukator") ||
    kat.includes("gizi") ||
    kat.includes("mahasiswa") ||
    kat.includes("fktp") ||
    keg.includes("simposium") ||
    keg.includes("symposium") ||
    keg.includes("workshop");

  if (!isIlmiah) return false;

  // 4. Khusus paket Simposium + Workshop (Workshop Medis Terapan)
  // Peserta yang HANYA mengambil Simposium saja (tanpa workshop) TIDAK berhak
  const hasWorkshop = keg.includes("workshop") || kat.includes("perawat") || kat.includes("edukator");

  return hasWorkshop;
};

export default function AdminDashboard({ onNavigateHome }: AdminDashboardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  // Tab Navigation: Operational-first
  const [activeTab, setActiveTab] = useState<'pendaftar' | 'voucher' | 'statistik'>('pendaftar');

  const [data, setData] = useState<Pendaftar[]>([]);
  const [healthTalkCount, setHealthTalkCount] = useState(0);
  const [isHealthTalkEnabled, setIsHealthTalkEnabled] = useState(true);
  const [isTogglingHT, setIsTogglingHT] = useState(false);
  const [closedCategories, setClosedCategories] = useState<string[]>([]);
  const [isUpdatingCategoryStatus, setIsUpdatingCategoryStatus] = useState<string | null>(null);
  const [showCategorySettings, setShowCategorySettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filters & Table Controls
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [kategoriFilter, setKategoriFilter] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // Participant Detail Modal
  const [selectedParticipant, setSelectedParticipant] = useState<Pendaftar | null>(null);
  const [isEditingParticipant, setIsEditingParticipant] = useState(false);
  const [editFormData, setEditFormData] = useState({
    namaLengkap: "",
    nik: "",
    whatsapp: "",
    jenisKelamin: "Laki-laki",
    tanggalLahir: "",
    institusi: "",
    cabangPersadia: "",
    email: ""
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Add Participant Modal State (Hak Akses Admin)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSavingNewParticipant, setIsSavingNewParticipant] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addFormData, setAddFormData] = useState({
    kategoriId: "persadia",
    namaLengkap: "",
    nik: "",
    whatsapp: "",
    email: "",
    jenisKelamin: "Laki-laki",
    tanggalLahir: "",
    institusi: "",
    cabangPersadia: "",
    namaKetuaCabang: "",
    nim: "",
    alamatLengkap: "",
    kelurahan: "",
    kecamatan: "",
    kotaKabupaten: "",
    provinsi: "",
    ikutDhf: false,
    tipePestaRakyatUmum: "gratis" as "gratis" | "berbayar",
    ikutPestaRakyatUmum: true,
    modeFktp: "onsite" as "onsite" | "online",
    pilihanIlmiah: "Simposium & Workshop",
    statusPembayaran: "Lunas",
    totalTagihan: 0,
    manualTotalOverride: false,
  });

  // Status Action & Dialogs
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    id: string;
    status: string;
    currentStatus?: string;
    nama?: string;
    totalBayar?: number | string;
  }>({
    isOpen: false,
    id: "",
    status: ""
  });

  // Gala Dinner Management State
  const [galaFilter, setGalaFilter] = useState<"Semua" | "Granted" | "NotGranted" | "Eligible" | "CheckedIn">("Semua");
  const [isGalaModalOpen, setIsGalaModalOpen] = useState(false);
  const [galaLoadingId, setGalaLoadingId] = useState<string | null>(null);
  const [isBatchGalaLoading, setIsBatchGalaLoading] = useState(false);

  // Voucher Management State
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [voucherSearch, setVoucherSearch] = useState("");
  const [voucherTab, setVoucherTab] = useState<"fktp_tersedia" | "terpakai" | "semua">("fktp_tersedia");
  const [newVoucherInput, setNewVoucherInput] = useState("FKTP-");
  const [isAddingVoucher, setIsAddingVoucher] = useState(false);
  const [voucherActionMsg, setVoucherActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
        setCurrentUserEmail(session.user?.email || null);
        fetchData();
        fetchVouchers();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthenticated(true);
        setCurrentUserEmail(session.user?.email || null);
      } else {
        setIsAuthenticated(false);
        setCurrentUserEmail(null);
        setData([]);
        setVouchers([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchQuery, statusFilter, kategoriFilter, pageSize]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsLoggingIn(true);

    if (!isSupabaseConfigured) {
      setAuthError("Supabase tidak dikonfigurasi.");
      setIsLoggingIn(false);
      return;
    }

    try {
      const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setAuthError(loginError.message === "Invalid login credentials"
          ? "Email atau password yang Anda masukkan salah."
          : loginError.message);
      } else if (authData.session) {
        setIsAuthenticated(true);
        setCurrentUserEmail(authData.session.user?.email || null);
        fetchData();
        fetchVouchers();
      }
    } catch (err: any) {
      setAuthError("Terjadi kesalahan saat login: " + err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setIsAuthenticated(false);
    setCurrentUserEmail(null);
    setEmail("");
    setPassword("");
    setData([]);
    setVouchers([]);
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");

    if (!isSupabaseConfigured) {
      setLoading(false);
      setError("Supabase tidak dikonfigurasi. Menggunakan mock data lokal dinonaktifkan untuk dashboard ini.");
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
          .order('timestamp', { ascending: false })
          .order('id', { ascending: true })
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

      // Safeguard against any pagination drift: deduplicate by id or no_registrasi
      const seenIds = new Set<string | number>();
      allData = allData.filter((row: any) => {
        const key = row.id ?? row.no_registrasi;
        if (!key || seenIds.has(key)) return false;
        seenIds.add(key);
        return true;
      });

      if (allData) {
        let htCount = 0;
        allData.forEach(row => {
          if (row.status_pembayaran !== 'Dibatalkan' && (row.ikut_health_talk === true || (row.pilihan_kegiatan && (row.pilihan_kegiatan.includes('Diabetes Health Forum') || row.pilihan_kegiatan.includes('Health Talk'))))) {
            htCount++;
          }
        });
        setHealthTalkCount(htCount);

        const { data: settingData } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'health_talk_enabled')
          .maybeSingle();
        if (settingData) {
          setIsHealthTalkEnabled(settingData.value === 'true');
        }

        const { data: catSettingData } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'closed_categories')
          .maybeSingle();
        if (catSettingData && catSettingData.value) {
          try {
            const parsed = JSON.parse(catSettingData.value);
            if (Array.isArray(parsed)) {
              setClosedCategories(parsed);
            }
          } catch (e) {
            console.error("Error parsing closed_categories:", e);
          }
        }

        // Map to existing Pendaftar interface format with precomputed search index
        const mappedData: Pendaftar[] = allData.map((row: any) => {
          const searchTerms = [
            row.nama_lengkap,
            row.no_registrasi,
            row.whatsapp,
            row.email,
            row.institusi,
            row.cabang_persadia,
            row.nama_ketua_cabang,
            row.kode_voucher,
            row.kategori_peserta,
            row.nim,
            row.nik,
            row.kota_kabupaten,
            row.provinsi,
            row.pilihan_kegiatan,
            row.hak_gala_dinner ? "gala dinner galadinner" : "",
          ];
          const searchIndex = searchTerms.filter(Boolean).join(" ").toLowerCase();

          return {
            id: row.id,
            Timestamp: row.timestamp || new Date().toISOString(),
            "No. Registrasi": row.no_registrasi || "-",
            "Status Pembayaran": row.status_pembayaran || "Menunggu Verifikasi",
            "Nama Lengkap": row.nama_lengkap || "-",
            Email: row.email || "-",
            "No. WhatsApp": row.whatsapp || "-",
            "Kategori Peserta": row.kategori_peserta || "-",
            "Akses Kegiatan": row.pilihan_kegiatan || "-",
            "Total Bayar": row.total_tagihan || 0,
            Institusi: row.institusi || "-",
            CabangPersadia: row.cabang_persadia || "-",
            NamaKetuaCabang: row.nama_ketua_cabang || "-",
            KodeVoucher: row.kode_voucher || "-",
            BersediaAnggota: row.bersedia_anggota_persadia === true || row.bersedia_anggota_persadia === 'true' || row.bersedia_anggota_persadia === 'Ya',
            AlamatLengkap: row.alamat_lengkap || "-",
            Kelurahan: row.kelurahan || "-",
            Kecamatan: row.kecamatan || "-",
            KotaKabupaten: row.kota_kabupaten || "-",
            Provinsi: row.provinsi || "-",
            nim: row.nim || "-",
            nik: row.nik || "-",
            tanggal_lahir: row.tanggal_lahir || "-",
            jenis_kelamin: row.jenis_kelamin || "-",
            registrasi_onsite: row.registrasi_onsite || null,
            waktu_registrasi_onsite: row.waktu_registrasi_onsite || null,
            kehadiran_workshop: row.kehadiran_workshop || null,
            waktu_kehadiran_workshop: row.waktu_kehadiran_workshop || null,
            hak_gala_dinner: row.hak_gala_dinner === true,
            kehadiran_gala_dinner: row.kehadiran_gala_dinner || row.akses_gala_dinner || null,
            waktu_kehadiran_gala_dinner: row.waktu_kehadiran_gala_dinner || row.waktu_akses_gala_dinner || null,
            akses_gala_dinner: row.akses_gala_dinner || null,
            waktu_akses_gala_dinner: row.waktu_akses_gala_dinner || null,
            tinggi_badan: row.tinggi_badan,
            berat_badan: row.berat_badan,
            tensi: row.tensi,
            lingkar_perut: row.lingkar_perut,
            cek_gula_darah: row.cek_gula_darah,
            gula_darah: row.gula_darah,
            makan_siang_pesta_rakyat: row.makan_siang_pesta_rakyat,
            ikut_health_talk: row.ikut_health_talk,
            kesediaan_data: row.kesediaan_data,
            gejala_neuropati: row.gejala_neuropati,
            pengambilan_merchandise: row.pengambilan_merchandise,
            kode_voucher: row.kode_voucher || "-",
            makan_siang_hari_1: row.makan_siang_hari_1,
            nama_ketua_cabang: row.nama_ketua_cabang || "-",
            mode_kehadiran: row.mode_kehadiran || (row.pilihan_kegiatan && row.pilihan_kegiatan.includes("Online") ? "Online" : "Onsite"),
            _searchIndex: searchIndex,
          };
        });

        setData(mappedData);
      } else {
        setData([]);
      }
      fetchVouchers();
    } catch (err: any) {
      console.error(err);
      setError("Terjadi kesalahan saat mengambil data dari Supabase: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleHealthTalk = async () => {
    setIsTogglingHT(true);
    try {
      const newValue = !isHealthTalkEnabled;
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key: 'health_talk_enabled', value: newValue.toString() }, { onConflict: 'key' });

      if (error) throw error;
      setIsHealthTalkEnabled(newValue);

      // Sinkronkan juga ke closed_categories agar form registrasi langsung menyesuaikan
      const isCurrentlyClosed = closedCategories.includes("diabetes_health_forum");
      if (newValue && isCurrentlyClosed) {
        const updated = closedCategories.filter(id => id !== "diabetes_health_forum");
        setClosedCategories(updated);
        await supabase.from('app_settings').upsert({ key: 'closed_categories', value: JSON.stringify(updated) }, { onConflict: 'key' });
      } else if (!newValue && !isCurrentlyClosed) {
        const updated = [...closedCategories, "diabetes_health_forum"];
        setClosedCategories(updated);
        await supabase.from('app_settings').upsert({ key: 'closed_categories', value: JSON.stringify(updated) }, { onConflict: 'key' });
      }

      showToast(`Pendaftaran Diabetes Health Forum berhasil ${newValue ? 'dibuka' : 'ditutup'}`);
    } catch (err: any) {
      alert("Gagal mengubah status Diabetes Health Forum: " + err.message);
    } finally {
      setIsTogglingHT(false);
    }
  };

  const handleToggleCategory = async (categoryId: string) => {
    if (!isSupabaseConfigured) {
      alert("Supabase belum terkonfigurasi.");
      return;
    }

    const isClosed = closedCategories.includes(categoryId);
    const updated = isClosed
      ? closedCategories.filter(id => id !== categoryId)
      : [...closedCategories, categoryId];

    setIsUpdatingCategoryStatus(categoryId);
    setClosedCategories(updated);

    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert(
          { key: 'closed_categories', value: JSON.stringify(updated) },
          { onConflict: 'key' }
        );

      if (error) throw error;

      if (categoryId === "fktp_online") {
        showToast(
          isClosed
            ? "Jalur Online FKTP berhasil DIBUKA (Tampil di formulir registrasi)"
            : "Jalur Online FKTP berhasil DISEMBUNYIKAN (Form difokuskan ke Onsite)"
        );
      } else {
        const catObj = KATEGORI_PESERTA.find(k => k.id === categoryId);
        const label = catObj ? catObj.label : categoryId;
        if (categoryId === "diabetes_health_forum") {
          setIsHealthTalkEnabled(isClosed);
          await supabase.from('app_settings').upsert({ key: 'health_talk_enabled', value: isClosed.toString() }, { onConflict: 'key' });
        }
        showToast(`Pendaftaran ${label} berhasil ${isClosed ? 'DIBUKA' : 'DITUTUP'}`);
      }
    } catch (err: any) {
      setClosedCategories(closedCategories);
      alert("Gagal mengubah status pendaftaran kategori: " + err.message);
    } finally {
      setIsUpdatingCategoryStatus(null);
    }
  };

  const handleTogglePestaRakyatBatch = async (closeAll: boolean) => {
    if (!isSupabaseConfigured) {
      alert("Supabase belum terkonfigurasi.");
      return;
    }

    const pestaRakyatIds = ["persadia", "umum"];
    let updated: string[];
    if (closeAll) {
      updated = Array.from(new Set([...closedCategories, ...pestaRakyatIds]));
    } else {
      updated = closedCategories.filter(id => !pestaRakyatIds.includes(id));
    }

    setIsUpdatingCategoryStatus("pesta_rakyat_batch");
    setClosedCategories(updated);

    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert(
          { key: 'closed_categories', value: JSON.stringify(updated) },
          { onConflict: 'key' }
        );

      if (error) throw error;
      showToast(`Pendaftaran Pesta Rakyat berhasil ${closeAll ? 'DITUTUP SEMUA' : 'DIBUKA SEMUA'}`);
    } catch (err: any) {
      setClosedCategories(closedCategories);
      alert("Gagal memperbarui status Pesta Rakyat: " + err.message);
    } finally {
      setIsUpdatingCategoryStatus(null);
    }
  };

  const executeUpdateStatus = async () => {
    const { id, status, currentStatus } = confirmDialog;
    setConfirmDialog({ isOpen: false, id: "", status: "" });
    setActionError(null);
    setActionLoadingId(id);

    if (!isSupabaseConfigured) {
      setActionLoadingId(null);
      setActionError("Supabase tidak dikonfigurasi.");
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from('pendaftar')
        .update({ status_pembayaran: status })
        .eq('no_registrasi', id);

      if (updateError) {
        throw updateError;
      }

      // Update local state directly and sync healthTalkCount
      setData(prev => {
        const updated = prev.map(item =>
          item["No. Registrasi"] === id ? { ...item, "Status Pembayaran": status } : item
        );
        const newHtCount = updated.filter(item =>
          item["Status Pembayaran"] !== 'Dibatalkan' &&
          (item.ikut_health_talk === true || (item["Akses Kegiatan"] && (item["Akses Kegiatan"].includes('Diabetes Health Forum') || item["Akses Kegiatan"].includes('Health Talk'))))
        ).length;
        setHealthTalkCount(newHtCount);
        return updated;
      });

      if (selectedParticipant && selectedParticipant["No. Registrasi"] === id) {
        setSelectedParticipant(prev => prev ? { ...prev, "Status Pembayaran": status } : null);
      }

      showToast(`Status ${id} berhasil diubah menjadi ${status}`);

      // Auto-open WhatsApp only when freshly verifying a pending registration to Lunas
      if (status === "Lunas" && currentStatus === "Menunggu Verifikasi") {
        const participant = data.find(item => item["No. Registrasi"] === id);
        const rawWa = participant ? (participant["No. WhatsApp"] || "") : "";
        const waNum = rawWa.replace(/\D/g, '').replace(/^0/, '62');
        const message = `Halo ${participant ? participant["Nama Lengkap"] : "Peserta"},\n\nPembayaran Anda untuk acara Konas Persadia 2026 telah diverifikasi (LUNAS).\n\nSilakan bergabung ke dalam grup WhatsApp Komunitas melalui link undangan berikut:\nhttps://chat.whatsapp.com/GezzqQzSYPuHTiCBRGbela\n\nTerima kasih,\nPanitia Konas Persadia 2026`;

        const waUrl = waNum
          ? `https://wa.me/${waNum}?text=${encodeURIComponent(message)}`
          : `https://wa.me/?text=${encodeURIComponent(message)}`;

        window.open(waUrl, "_blank");
      }
    } catch (err: any) {
      console.error(err);
      setActionError("Terjadi kesalahan jaringan saat update status: " + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // ==============================================================================
  // GALA DINNER ACCESS CONTROLS (Khusus Simposium + Workshop Onsite)
  // ==============================================================================
  const handleToggleGalaDinner = async (participant: Pendaftar, grant: boolean) => {
    // Validasi ketat: Hanya boleh jika peserta adalah Simposium + Workshop
    if (!isEligibleForGalaDinner(participant)) {
      alert("Akses Gala Dinner HANYA diperuntukkan bagi peserta kategori Simposium & Workshop Onsite.");
      return;
    }

    const regId = participant["No. Registrasi"];
    setGalaLoadingId(regId);
    try {
      const updatePayload: Record<string, any> = {
        hak_gala_dinner: grant,
      };
      if (!grant) {
        // Jika hak akses dicabut, reset juga status kehadiran ballroom
        updatePayload.kehadiran_gala_dinner = null;
        updatePayload.waktu_kehadiran_gala_dinner = null;
        updatePayload.akses_gala_dinner = null;
        updatePayload.waktu_akses_gala_dinner = null;
      }

      const { error } = await supabase
        .from('pendaftar')
        .update(updatePayload)
        .eq('no_registrasi', regId);

      if (error) throw error;

      // Update state lokal
      setData(prev => prev.map(item => {
        if (item["No. Registrasi"] === regId) {
          const updatedSearch = (item._searchIndex || "")
            .replace(/gala dinner galadinner/g, "")
            + (grant ? " gala dinner galadinner" : "");
          return {
            ...item,
            hak_gala_dinner: grant,
            ...(grant ? {} : { kehadiran_gala_dinner: null, waktu_kehadiran_gala_dinner: null }),
            _searchIndex: updatedSearch
          };
        }
        return item;
      }));

      // Update selectedParticipant jika sedang dibuka
      setSelectedParticipant(prev => {
        if (!prev || prev["No. Registrasi"] !== regId) return prev;
        return {
          ...prev,
          hak_gala_dinner: grant,
          ...(grant ? {} : { kehadiran_gala_dinner: null, waktu_kehadiran_gala_dinner: null })
        };
      });

      showToast(grant
        ? `Akses Gala Dinner diberikan ke ${participant["Nama Lengkap"]}!`
        : `Akses Gala Dinner untuk ${participant["Nama Lengkap"]} telah dicabut.`
      );
    } catch (err: any) {
      console.error("Gagal update Gala Dinner:", err);
      alert("Gagal memperbarui akses Gala Dinner: " + err.message);
    } finally {
      setGalaLoadingId(null);
    }
  };

  const handleBatchGrantGalaDinner = async () => {
    const candidates = data.filter(
      p => isEligibleForGalaDinner(p) && p["Status Pembayaran"] === "Lunas" && !p.hak_gala_dinner
    );

    if (candidates.length === 0) {
      alert("Tidak ada peserta Simposium + Workshop (Lunas) baru yang belum memiliki akses Gala Dinner.");
      return;
    }

    const confirmMsg = `Konfirmasi Pemberian Hak Akses Gala Dinner:\n\n` +
      `Apakah Anda yakin ingin memberikan hak akses Gala Dinner kepada ${candidates.length} peserta Simposium + Workshop (Status: Lunas)?\n\n` +
      `Peserta ini akan diizinkan masuk oleh scanner pos Gala Dinner di Novotel.`;

    if (!window.confirm(confirmMsg)) return;

    setIsBatchGalaLoading(true);
    try {
      const regIds = candidates.map(c => c["No. Registrasi"]);
      const chunkSize = 100;
      for (let i = 0; i < regIds.length; i += chunkSize) {
        const chunk = regIds.slice(i, i + chunkSize);
        const { error } = await supabase
          .from('pendaftar')
          .update({ hak_gala_dinner: true })
          .in('no_registrasi', chunk);
        if (error) throw error;
      }

      // Update state lokal
      const idSet = new Set(regIds);
      setData(prev => prev.map(item => {
        if (idSet.has(item["No. Registrasi"])) {
          const updatedSearch = (item._searchIndex || "").replace(/gala dinner galadinner/g, "") + " gala dinner galadinner";
          return {
            ...item,
            hak_gala_dinner: true,
            _searchIndex: updatedSearch
          };
        }
        return item;
      }));

      // Update selectedParticipant jika termasuk
      setSelectedParticipant(prev => {
        if (!prev || !idSet.has(prev["No. Registrasi"])) return prev;
        return {
          ...prev,
          hak_gala_dinner: true
        };
      });

      showToast(`Berhasil memberikan hak akses Gala Dinner ke ${regIds.length} peserta Simposium + Workshop!`);
      setIsGalaModalOpen(false);
    } catch (err: any) {
      console.error("Gagal batch update Gala Dinner:", err);
      alert("Terjadi kesalahan saat memproses batch update: " + err.message);
    } finally {
      setIsBatchGalaLoading(false);
    }
  };

  const handleBatchRevokeGalaDinner = async () => {
    const granted = data.filter(p => isEligibleForGalaDinner(p) && p.hak_gala_dinner);

    if (granted.length === 0) {
      alert("Saat ini belum ada peserta yang memiliki akses Gala Dinner.");
      return;
    }

    const confirmMsg = `PERINGATAN CABUT AKSES GALA DINNER:\n\n` +
      `Apakah Anda yakin ingin mencabut hak akses Gala Dinner untuk SELURUH ${granted.length} peserta?\n` +
      `Tindakan ini akan membuat seluruh peserta ditolak saat scan di pintu Ballroom Novotel.`;

    if (!window.confirm(confirmMsg)) return;

    setIsBatchGalaLoading(true);
    try {
      const regIds = granted.map(c => c["No. Registrasi"]);
      const chunkSize = 100;
      for (let i = 0; i < regIds.length; i += chunkSize) {
        const chunk = regIds.slice(i, i + chunkSize);
        const { error } = await supabase
          .from('pendaftar')
          .update({
            hak_gala_dinner: false,
            kehadiran_gala_dinner: null,
            waktu_kehadiran_gala_dinner: null,
            akses_gala_dinner: null,
            waktu_akses_gala_dinner: null
          })
          .in('no_registrasi', chunk);
        if (error) throw error;
      }

      const idSet = new Set(regIds);
      setData(prev => prev.map(item => {
        if (idSet.has(item["No. Registrasi"])) {
          return {
            ...item,
            hak_gala_dinner: false,
            kehadiran_gala_dinner: null,
            waktu_kehadiran_gala_dinner: null,
            _searchIndex: (item._searchIndex || "").replace(/gala dinner galadinner/g, "")
          };
        }
        return item;
      }));

      setSelectedParticipant(prev => {
        if (!prev || !idSet.has(prev["No. Registrasi"])) return prev;
        return {
          ...prev,
          hak_gala_dinner: false,
          kehadiran_gala_dinner: null,
          waktu_kehadiran_gala_dinner: null
        };
      });

      showToast(`Seluruh akses Gala Dinner (${regIds.length} peserta) berhasil dicabut.`);
      setIsGalaModalOpen(false);
    } catch (err: any) {
      console.error("Gagal cabut akses massal:", err);
      alert("Terjadi kesalahan: " + err.message);
    } finally {
      setIsBatchGalaLoading(false);
    }
  };

  const handleStartEdit = (p: Pendaftar) => {
    let tgl = p.tanggal_lahir || "";
    if (tgl === "-" || !/^\d{4}-\d{2}-\d{2}$/.test(tgl)) {
      tgl = "";
    }

    setEditFormData({
      namaLengkap: p["Nama Lengkap"] === "-" ? "" : p["Nama Lengkap"],
      nik: (p.nik && p.nik !== "-") ? p.nik.replace(/\D/g, "") : "",
      whatsapp: (p["No. WhatsApp"] && p["No. WhatsApp"] !== "-") ? p["No. WhatsApp"].replace(/\D/g, "") : "",
      jenisKelamin: p.jenis_kelamin && p.jenis_kelamin !== "-" ? p.jenis_kelamin : "Laki-laki",
      tanggalLahir: tgl,
      institusi: p.Institusi && p.Institusi !== "-" ? p.Institusi : "",
      cabangPersadia: p.CabangPersadia && p.CabangPersadia !== "-" ? p.CabangPersadia : "",
      email: p.Email && p.Email !== "-" ? p.Email : ""
    });
    setEditError(null);
    setIsEditingParticipant(true);
  };

  const handleCancelEdit = () => {
    setIsEditingParticipant(false);
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!selectedParticipant) return;
    const regId = selectedParticipant["No. Registrasi"];

    // 1. Validasi Nama
    const cleanNama = editFormData.namaLengkap.trim();
    if (!cleanNama) {
      setEditError("Nama lengkap peserta wajib diisi.");
      return;
    }

    // 2. Validasi & Sanitasi Nomor WhatsApp
    let rawDigits = editFormData.whatsapp.replace(/\D/g, "");
    if (!rawDigits) {
      setEditError("Nomor WhatsApp peserta wajib diisi.");
      return;
    }
    if (rawDigits.startsWith("62")) {
      rawDigits = "0" + rawDigits.slice(2);
    }
    if (!rawDigits.startsWith("08")) {
      setEditError("Nomor WhatsApp harus berawalan 08 atau 62.");
      return;
    }
    if (rawDigits.length < 9 || rawDigits.length > 15) {
      setEditError("Nomor WhatsApp harus terdiri dari 9 hingga 15 digit angka.");
      return;
    }

    // 3. Validasi NIK jika peserta ilmiah non-mahasiswa atau jika NIK diisi
    const cleanNik = editFormData.nik.replace(/\D/g, "");
    const katName = (selectedParticipant["Kategori Peserta"] || "").toLowerCase();
    const isIlmiahNonMhs =
      !katName.includes("mahasiswa") &&
      !katName.includes("persadia") &&
      !katName.includes("umum") &&
      !katName.includes("diabetes health forum");

    if (isIlmiahNonMhs && !cleanNik) {
      setEditError("NIK (16 digit) wajib diisi untuk peserta kegiatan ilmiah (SKP Kemenkes).");
      return;
    }
    if (cleanNik && cleanNik.length !== 16) {
      setEditError(`NIK harus terdiri dari tepat 16 digit angka (saat ini ${cleanNik.length} digit).`);
      return;
    }

    // 4. Validasi Email jika peserta kegiatan ilmiah / seminar atau jika diisi
    const isEditEmailRequired =
      !katName.includes("persadia") &&
      !katName.includes("umum");

    if (isEditEmailRequired) {
      if (!editFormData.email.trim()) {
        setEditError("Alamat email wajib diisi untuk peserta kegiatan ilmiah / seminar (E-Ticket & materi).");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email.trim())) {
        setEditError("Format email tidak valid (contoh: nama@domain.com).");
        return;
      }
    } else if (editFormData.email.trim() && !editFormData.email.includes("@")) {
      setEditError("Format email tidak valid.");
      return;
    }

    setIsSavingEdit(true);
    setEditError(null);

    try {
      const updatePayload: Record<string, any> = {
        nama_lengkap: cleanNama,
        nik: cleanNik || "-",
        whatsapp: rawDigits,
        jenis_kelamin: editFormData.jenisKelamin,
        tanggal_lahir: editFormData.tanggalLahir || null,
        institusi: editFormData.institusi.trim() || "-",
        cabang_persadia: editFormData.cabangPersadia.trim() || "-",
        email: editFormData.email.trim() || "-"
      };

      const { error: updateError } = await supabase
        .from('pendaftar')
        .update(updatePayload)
        .eq('no_registrasi', regId);

      if (updateError) {
        if (updateError.message && updateError.message.includes("nik")) {
          const fallbackPayload = { ...updatePayload };
          delete fallbackPayload.nik;
          const { error: retryError } = await supabase
            .from('pendaftar')
            .update(fallbackPayload)
            .eq('no_registrasi', regId);
          if (retryError) throw retryError;
        } else {
          throw updateError;
        }
      }

      // 3. Update data state lokal & search index
      setData(prev => prev.map(item => {
        if (item["No. Registrasi"] !== regId) return item;

        const searchTerms = [
          regId,
          cleanNama,
          updatePayload.email,
          rawDigits,
          cleanNik,
          updatePayload.institusi,
          updatePayload.cabang_persadia,
          item.NamaKetuaCabang,
          item.KodeVoucher,
          item["Kategori Peserta"],
          item.nim,
          item.KotaKabupaten,
          item.Provinsi,
          item["Akses Kegiatan"]
        ];
        const searchIndex = searchTerms.filter(Boolean).join(" ").toLowerCase();

        return {
          ...item,
          "Nama Lengkap": cleanNama,
          "No. WhatsApp": rawDigits,
          nik: cleanNik || item.nik || "-",
          jenis_kelamin: editFormData.jenisKelamin,
          tanggal_lahir: editFormData.tanggalLahir || "-",
          Institusi: updatePayload.institusi,
          CabangPersadia: updatePayload.cabang_persadia,
          Email: updatePayload.email,
          _searchIndex: searchIndex
        };
      }));

      // Update selectedParticipant di modal agar langsung sinkron
      setSelectedParticipant(prev => {
        if (!prev || prev["No. Registrasi"] !== regId) return prev;
        return {
          ...prev,
          "Nama Lengkap": cleanNama,
          "No. WhatsApp": rawDigits,
          nik: cleanNik || prev.nik || "-",
          jenis_kelamin: editFormData.jenisKelamin,
          tanggal_lahir: editFormData.tanggalLahir || "-",
          Institusi: updatePayload.institusi,
          CabangPersadia: updatePayload.cabang_persadia,
          Email: updatePayload.email
        };
      });

      setIsEditingParticipant(false);
      showToast(`Data peserta ${cleanNama} (${regId}) berhasil diperbarui!`);
    } catch (err: any) {
      console.error("Gagal update data peserta:", err);
      setEditError("Gagal menyimpan perubahan: " + err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const computeCategoryPrice = (
    catId: string,
    ikutDhf: boolean,
    tipeUmum: "gratis" | "berbayar",
    ikutPestaUmum: boolean,
    modeFktp: "onsite" | "online"
  ): number => {
    if (catId === "persadia") {
      return ikutDhf ? 200000 : 0;
    }
    if (catId === "umum") {
      let sum = 0;
      if (ikutPestaUmum && tipeUmum === "berbayar") sum += 100000;
      if (ikutDhf) sum += 200000;
      return sum;
    }
    if (catId === "diabetes_health_forum") {
      return 200000;
    }
    if (catId === "dokter_fktp") {
      return modeFktp === "online" ? 300000 : 600000;
    }
    if (catId === "dokter_umum") {
      return 1500000;
    }
    if (catId === "dokter_spesialis") {
      return 2500000;
    }
    if (catId === "residen") {
      return 1000000;
    }
    if (catId === "perawat") {
      return 400000;
    }
    if (catId === "mahasiswa") {
      return 400000;
    }
    return 0;
  };

  const handleOpenAddModal = (presetCategory?: string) => {
    let targetCat = "persadia";
    if (presetCategory) {
      targetCat = presetCategory;
    } else if (kategoriFilter === "Anggota PERSADIA") {
      targetCat = "persadia";
    } else if (kategoriFilter === "Masyarakat Umum") {
      targetCat = "umum";
    } else if (kategoriFilter === "Pesta Rakyat") {
      targetCat = "persadia";
    } else if (kategoriFilter === "Diabetes Health Forum") {
      targetCat = "diabetes_health_forum";
    } else {
      const found = KATEGORI_PESERTA.find(k => k.label === kategoriFilter);
      if (found) targetCat = found.id;
    }

    const defaultPrice = computeCategoryPrice(targetCat, false, "gratis", true, "onsite");

    setAddFormData({
      kategoriId: targetCat,
      namaLengkap: "",
      nik: "",
      whatsapp: "",
      email: "",
      jenisKelamin: "Laki-laki",
      tanggalLahir: "",
      institusi: "",
      cabangPersadia: "",
      namaKetuaCabang: "",
      nim: "",
      alamatLengkap: "",
      kelurahan: "",
      kecamatan: "",
      kotaKabupaten: "",
      provinsi: "",
      ikutDhf: false,
      tipePestaRakyatUmum: "gratis",
      ikutPestaRakyatUmum: true,
      modeFktp: "onsite",
      pilihanIlmiah: "Simposium & Workshop",
      statusPembayaran: "Lunas",
      totalTagihan: defaultPrice,
      manualTotalOverride: false,
    });
    setAddError(null);
    setIsAddModalOpen(true);
  };

  const handleSubmitNewParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setAddError("Supabase tidak dikonfigurasi.");
      return;
    }

    const cleanNama = addFormData.namaLengkap.trim();
    if (!cleanNama) {
      setAddError("Nama lengkap peserta wajib diisi.");
      return;
    }

    let rawDigits = addFormData.whatsapp.replace(/\D/g, "");
    if (rawDigits.startsWith("62")) {
      rawDigits = "0" + rawDigits.slice(2);
    }
    if (!rawDigits.startsWith("08")) {
      setAddError("Nomor WhatsApp harus diawali 08 atau 62.");
      return;
    }
    if (rawDigits.length < 9 || rawDigits.length > 15) {
      setAddError("Nomor WhatsApp harus terdiri dari 9 hingga 15 digit angka.");
      return;
    }

    const selectedCat = KATEGORI_PESERTA.find(k => k.id === addFormData.kategoriId) || KATEGORI_PESERTA[0];

    // Validasi NIK untuk kategori ilmiah selain mahasiswa
    const cleanNik = addFormData.nik.replace(/\D/g, "");
    if (selectedCat.akses === "ilmiah" && selectedCat.id !== "mahasiswa") {
      if (!cleanNik) {
        setAddError("NIK (16 digit) wajib diisi untuk kategori ilmiah (SKP Kemenkes).");
        return;
      }
      if (cleanNik.length !== 16) {
        setAddError(`NIK harus terdiri dari tepat 16 digit angka (saat ini ${cleanNik.length} digit).`);
        return;
      }
    }

    if (selectedCat.akses === "ilmiah" || selectedCat.id === "diabetes_health_forum") {
      if (!addFormData.email.trim()) {
        setAddError("Alamat email wajib diisi untuk kategori ilmiah / forum.");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addFormData.email.trim())) {
        setAddError("Format alamat email tidak valid (contoh: nama@domain.com).");
        return;
      }
    } else if (addFormData.email.trim() && !addFormData.email.includes("@")) {
      setAddError("Format alamat email tidak valid.");
      return;
    }

    if (selectedCat.akses === "ilmiah" && selectedCat.id !== "dokter_fktp" && !addFormData.institusi.trim()) {
      setAddError("Institusi / Rumah Sakit / Instansi wajib diisi untuk kategori ilmiah.");
      return;
    }
    if (selectedCat.id === "dokter_fktp" && !addFormData.institusi.trim()) {
      setAddError("Institusi / Puskesmas / Klinik wajib diisi untuk kategori Dokter FKTP.");
      return;
    }
    if (selectedCat.id === "mahasiswa" && !addFormData.nim.trim()) {
      setAddError("NIM (Nomor Induk Mahasiswa) wajib diisi untuk kategori mahasiswa.");
      return;
    }

    setIsSavingNewParticipant(true);
    setAddError(null);

    try {
      // Generate Unique Registration ID
      const existingIds = new Set(data.map(d => d["No. Registrasi"]));
      let regId = "";
      let attempts = 0;
      do {
        regId = `KNS2026-${Date.now().toString().slice(-4)}${Math.floor(1000 + Math.random() * 9000)}`;
        attempts++;
      } while (existingIds.has(regId) && attempts < 20);

      const nowIso = new Date().toISOString();

      // Tentukan pilihan kegiatan
      let kegiatan = "-";
      if (selectedCat.akses === "ilmiah") {
        if (selectedCat.id === "dokter_fktp") {
          kegiatan = addFormData.modeFktp === "online" ? "Sesi Ilmiah FKTP (Online)" : "Simposium & Workshop FKTP (Onsite)";
        } else if (selectedCat.id === "perawat") {
          kegiatan = "Workshop";
        } else {
          kegiatan = addFormData.pilihanIlmiah;
        }
      } else if (selectedCat.id === "diabetes_health_forum") {
        kegiatan = "Diabetes Health Forum";
      } else if (selectedCat.id === "persadia") {
        kegiatan = addFormData.ikutDhf ? "Pesta Rakyat + Diabetes Health Forum" : "Pesta Rakyat";
      } else if (selectedCat.id === "umum") {
        const pesta = addFormData.tipePestaRakyatUmum === "berbayar" ? "Pesta Rakyat (Paket Kaos)" : "Pesta Rakyat (Gratis)";
        if (addFormData.ikutPestaRakyatUmum && addFormData.ikutDhf) {
          kegiatan = `${pesta} + Diabetes Health Forum`;
        } else if (addFormData.ikutPestaRakyatUmum) {
          kegiatan = pesta;
        } else if (addFormData.ikutDhf) {
          kegiatan = "Diabetes Health Forum";
        }
      }

      const basePayload: any = {
        timestamp: nowIso,
        no_registrasi: regId,
        status_pembayaran: addFormData.statusPembayaran,
        nama_lengkap: cleanNama,
        nik: cleanNik || "-",
        email: addFormData.email.trim() || "-",
        whatsapp: rawDigits,
        kategori_peserta: selectedCat.label,
        pilihan_kegiatan: kegiatan,
        total_tagihan: Number(addFormData.totalTagihan) || 0,
        ikut_health_talk: (selectedCat.id === "persadia" && addFormData.ikutDhf) || (selectedCat.id === "umum" && addFormData.ikutDhf),
        bersedia_anggota_persadia: selectedCat.id === "persadia" || !!addFormData.alamatLengkap.trim(),
        alamat_lengkap: addFormData.alamatLengkap.trim() || "-",
        kelurahan: addFormData.kelurahan.trim() || "-",
        kecamatan: addFormData.kecamatan.trim() || "-",
        kota_kabupaten: addFormData.kotaKabupaten.trim() || "-",
        provinsi: addFormData.provinsi.trim() || "-",
        institusi: addFormData.institusi.trim() || "-",
        nim: addFormData.nim.trim() || "-",
        cabang_persadia: addFormData.cabangPersadia.trim() || "-",
        nama_ketua_cabang: addFormData.namaKetuaCabang.trim() || "-",
        tanggal_lahir: addFormData.tanggalLahir || "-",
        jenis_kelamin: addFormData.jenisKelamin || "-",
        kode_voucher: "-",
      };

      const payloadWithMode = {
        ...basePayload,
        mode_kehadiran: selectedCat.id === "dokter_fktp" && addFormData.modeFktp === "online" ? "Online" : "Onsite"
      };

      let insertError: any = null;
      let insertedResult: any[] | null = null;

      const { data: insertedRows, error: errWithMode } = await supabase
        .from('pendaftar')
        .insert([payloadWithMode])
        .select();

      if (errWithMode) {
        if (errWithMode.message && (errWithMode.message.includes("mode_kehadiran") || errWithMode.message.includes("nik"))) {
          const fallbackPayload = { ...payloadWithMode };
          if (errWithMode.message.includes("mode_kehadiran")) delete fallbackPayload.mode_kehadiran;
          if (errWithMode.message.includes("nik")) delete fallbackPayload.nik;

          const { data: fallbackRows, error: fallbackErr } = await supabase
            .from('pendaftar')
            .insert([fallbackPayload])
            .select();
          if (fallbackErr) {
            if (fallbackErr.message && (fallbackErr.message.includes("mode_kehadiran") || fallbackErr.message.includes("nik"))) {
              delete fallbackPayload.mode_kehadiran;
              delete fallbackPayload.nik;
              const { data: finalRows, error: finalErr } = await supabase
                .from('pendaftar')
                .insert([fallbackPayload])
                .select();
              if (finalErr) insertError = finalErr;
              else insertedResult = finalRows;
            } else {
              insertError = fallbackErr;
            }
          } else {
            insertedResult = fallbackRows;
          }
        } else {
          insertError = errWithMode;
        }
      } else {
        insertedResult = insertedRows;
      }

      if (insertError && insertError.message && insertError.message.includes("pendaftar_pkey")) {
        try {
          const { data: syncRes, error: rpcErr } = await supabase.rpc("sync_pendaftar_id_sequence");
          if (!rpcErr && syncRes) {
            const { data: retryRows, error: retryErr } = await supabase
              .from('pendaftar')
              .insert([payloadWithMode])
              .select();
            if (!retryErr && retryRows) {
              insertedResult = retryRows;
              insertError = null;
            }
          }
        } catch (e) {
          console.warn("Auto-sync sequence failed:", e);
        }

        if (insertError) {
          try {
            const { data: nextId, error: nextIdErr } = await supabase.rpc("get_next_pendaftar_id");
            if (!nextIdErr && nextId) {
              const { data: retryIdRows, error: retryIdErr } = await supabase
                .from('pendaftar')
                .insert([{ ...payloadWithMode, id: Number(nextId) }])
                .select();
              if (!retryIdErr && retryIdRows) {
                insertedResult = retryIdRows;
                insertError = null;
              }
            }
          } catch (e) {
            console.warn("Auto get_next_pendaftar_id failed:", e);
          }
        }
      }

      if (insertError) {
        if (insertError.message && insertError.message.includes("pendaftar_pkey")) {
          throw new Error(`Gagal menyimpan: Sequence ID Supabase perlu disinkronkan. Silakan jalankan script supabase/fix_pendaftar_id_sequence.sql di SQL Editor Supabase.`);
        }
        throw insertError;
      }

      // Build search index
      const searchTerms = [
        regId,
        cleanNama,
        basePayload.email,
        rawDigits,
        basePayload.nik,
        basePayload.institusi,
        basePayload.cabang_persadia,
        basePayload.nama_ketua_cabang,
        basePayload.kode_voucher,
        selectedCat.label,
        basePayload.nim,
        basePayload.kota_kabupaten,
        basePayload.provinsi,
        kegiatan
      ];
      const searchIndex = searchTerms.filter(Boolean).join(" ").toLowerCase();

      const newParticipant: Pendaftar = {
        id: insertedResult?.[0]?.id,
        Timestamp: nowIso,
        "No. Registrasi": regId,
        "Status Pembayaran": addFormData.statusPembayaran,
        "Nama Lengkap": cleanNama,
        Email: basePayload.email,
        "No. WhatsApp": rawDigits,
        "Kategori Peserta": selectedCat.label,
        "Akses Kegiatan": kegiatan,
        "Total Bayar": basePayload.total_tagihan,
        Institusi: basePayload.institusi,
        CabangPersadia: basePayload.cabang_persadia,
        NamaKetuaCabang: basePayload.nama_ketua_cabang,
        KodeVoucher: "-",
        BersediaAnggota: basePayload.bersedia_anggota_persadia,
        AlamatLengkap: basePayload.alamat_lengkap,
        Kelurahan: basePayload.kelurahan,
        Kecamatan: basePayload.kecamatan,
        KotaKabupaten: basePayload.kota_kabupaten,
        Provinsi: basePayload.provinsi,
        nim: basePayload.nim,
        nik: basePayload.nik,
        tanggal_lahir: basePayload.tanggal_lahir,
        jenis_kelamin: basePayload.jenis_kelamin,
        mode_kehadiran: payloadWithMode.mode_kehadiran,
        ikut_health_talk: basePayload.ikut_health_talk,
        _searchIndex: searchIndex
      };

      // Update local state (prepend so it's at the top of the table)
      setData(prev => [newParticipant, ...prev]);
      setIsAddModalOpen(false);
      showToast(`Peserta ${cleanNama} (${regId}) berhasil ditambahkan ke kategori ${selectedCat.label}!`);

      // Reset search query to the new participant so admin can inspect or verify immediately
      setSearchQuery(regId);
    } catch (err: any) {
      console.error("Gagal menambahkan peserta baru:", err);
      setAddError(err.message || "Gagal menyimpan peserta baru.");
    } finally {
      setIsSavingNewParticipant(false);
    }
  };

  const getDaftarKegiatanWa = (p: Pendaftar, hasGalaDinner: boolean): string => {
    const keg = (p["Akses Kegiatan"] || (p as any).pilihan_kegiatan || "").toLowerCase();
    const kat = (p["Kategori Peserta"] || (p as any).kategori_peserta || "").toLowerCase();
    const mode = (p.mode_kehadiran || "").toLowerCase();
    const isOnline = mode === "online" || keg.includes("online");
    const isDHF = kat.includes("health forum") || keg.includes("health forum") || keg.includes("health talk") || p.ikut_health_talk === true;
    const isPestaRakyat = kat.includes("persadia") || kat.includes("umum") || keg.includes("pesta rakyat");

    if (isOnline) {
      return `1. 💻 *Sesi Ilmiah FKTP Daring (Online)*
   📅 Sabtu, 7 November 2026 (08.00 WIB - Selesai)
   📍 Live Zoom Webinar (Tautan siaran daring resmi akan dikirimkan panitia)`;
    }

    if (isDHF) {
      return `1. 💬 *Diabetes Health Forum (DHF)*
   📅 Sabtu, 7 November 2026 (08.00 WIB - Selesai)
   📍 Ballroom 2, Novotel Bogor Golf Resort & Convention Center
   ✨ *Talkshow Interaktif Eksklusif bersama dr. Boyke Dian Nugraha, SpOG*
2. 🏃‍♂️ *Pesta Rakyat WDD & HKN 2026* (Akses Bebas Hari Ke-2)
   📅 Minggu, 8 November 2026 (06.00 WIB - Selesai)
   📍 Stadion Pakansari, Cibinong, Kab. Bogor`;
    }

    if (isPestaRakyat) {
      return `1. 🏃‍♂️ *Pesta Rakyat World Diabetes Day & Hari Kesehatan Nasional 2026*
   📅 Minggu, 8 November 2026 (06.00 WIB - Selesai)
   📍 Stadion Pakansari, Cibinong, Kab. Bogor
   ✨ *Agenda:* Senam Massal Diabetes, Edukasi Medis Pola Hidup, Skrining Kesehatan & Cek Gula Darah Gratis, Bazar UMKM, serta Panggung Hiburan Musik`;
    }

    // Sesi Ilmiah Onsite (Dokter Spesialis, Dokter Umum, FKTP Onsite, Residen, Perawat, Mahasiswa)
    const isWorkshop = keg.includes("workshop") || kat.includes("perawat") || kat.includes("edukator");
    const namaSesiIlmiah = isWorkshop ? "Simposium & Workshop Ilmiah" : "Simposium Ilmiah";

    let list = `1. 🩺 *${namaSesiIlmiah}*
   📅 Sabtu, 7 November 2026 (07.30 - 17.00 WIB)
   📍 Novotel Bogor Golf Resort & Convention Center`;

    if (hasGalaDinner) {
      list += `\n2. 🍽️ *Malam Keakraban / Gala Dinner*
   📅 Sabtu, 7 November 2026 (18.30 - 21.00 WIB)
   📍 Grand Ballroom Novotel Bogor Golf Resort`;
    }

    const nextNum = hasGalaDinner ? 3 : 2;
    list += `\n${nextNum}. 🏃‍♂️ *Pesta Rakyat WDD & HKN 2026* (Akses Bebas Hari Ke-2)
   📅 Minggu, 8 November 2026 (06.00 WIB - Selesai)
   📍 Stadion Pakansari, Cibinong, Kab. Bogor`;

    return list;
  };

  const handleSendWhatsapp = (participant: Pendaftar) => {
    const rawWa = participant["No. WhatsApp"] || "";
    const waNum = rawWa.replace(/\D/g, '').replace(/^0/, '62');

    let message = "";

    if (participant["Status Pembayaran"] === "Lunas") {
      const scannerUrl = `${window.location.origin}/scanner.html?id=${encodeURIComponent(participant["No. Registrasi"])}`;
      const qrImageUrl = `https://quickchart.io/qr?text=${encodeURIComponent(scannerUrl)}&size=400&ecLevel=H`;

      const hasGala = Boolean(
        participant.hak_gala_dinner === true ||
        (participant as any).hak_gala_dinner === 'true' ||
        (participant as any).Hak_Gala_Dinner === true ||
        (participant as any).akses_gala_dinner === true
      );

      const isIlmiah = Boolean(
        (participant["Kategori Peserta"] || "").toLowerCase().includes("dokter") ||
        (participant["Kategori Peserta"] || "").toLowerCase().includes("spesialis") ||
        (participant["Kategori Peserta"] || "").toLowerCase().includes("perawat") ||
        (participant["Kategori Peserta"] || "").toLowerCase().includes("fktp") ||
        (participant["Kategori Peserta"] || "").toLowerCase().includes("mahasiswa") ||
        (participant["Akses Kegiatan"] || "").toLowerCase().includes("symposium") ||
        (participant["Akses Kegiatan"] || "").toLowerCase().includes("simposium") ||
        (participant["Akses Kegiatan"] || "").toLowerCase().includes("workshop")
      );

      const ticketWebUrl = isIlmiah
        ? `${window.location.origin}/#tiket-simposium?id=${encodeURIComponent(participant["No. Registrasi"])}`
        : `${window.location.origin}/#tiket-pesta-rakyat?wa=${encodeURIComponent(rawWa || "")}`;

      const aksesKegiatanLabel = hasGala
        ? `${participant["Akses Kegiatan"]} (+ Akses Gala Dinner)`
        : participant["Akses Kegiatan"];

      const keteranganKegiatan = getDaftarKegiatanWa(participant, hasGala);

      message = `Yth. *${participant["Nama Lengkap"]}*,

Berikut adalah E-Ticket digital/QR Code resmi untuk *${EVENT_INFO.namaAcara}*:

📌 *No. Registrasi:* ${participant["No. Registrasi"]}
👤 *Nama:* ${participant["Nama Lengkap"]}
🏷️ *Kategori:* ${participant["Kategori Peserta"]}
🏛️ *Institusi:* ${participant.Institusi || '-'}
🎟️ *Akses Kegiatan:* ${aksesKegiatanLabel}
✅ *Status Pembayaran:* ${participant["Status Pembayaran"]}

📋 *Keterangan Kegiatan yang Dapat Diikuti:*
${keteranganKegiatan}

🌐 *Link Unduh E-Ticket Mandiri:*
${ticketWebUrl}

🖼️ *QR Code:*
${qrImageUrl}

*Petunjuk Check-in:*
1. Tunjukkan QR Code saat check-in registrasi di lokasi acara.
2. Anda dapat membuka link gambar QR Code di atas lalu menyimpannya langsung ke galeri HP.
3. Anda juga dapat membuka link E-Ticket mandiri di atas untuk mengunduh tiket berkualitas tinggi.

Sampai jumpa di Bogor!
_Panitia KONAS PERSADIA 2026_`;
    } else if (participant["Status Pembayaran"] === "Dibatalkan") {
      message = `Halo *${participant["Nama Lengkap"]}*,

Kami menginformasikan bahwa pendaftaran Anda dengan No. Registrasi *${participant["No. Registrasi"]}* untuk acara *${EVENT_INFO.namaAcara}* telah dibatalkan (misal: pendaftaran ganda/duplikat).

Jika ada pertanyaan atau kekeliruan, silakan balas pesan ini.

Terima kasih,
_Panitia KONAS PERSADIA 2026_`;
    } else {
      message = `Yth. *${participant["Nama Lengkap"]}*,

Terima kasih telah mendaftar di acara *${EVENT_INFO.namaAcara}*.

Terkait pendaftaran Anda dengan No. Registrasi *${participant["No. Registrasi"]}*, kami belum menemukan data pembayaran Anda di mutasi rekening kami.

Mohon bantuannya untuk mengirimkan *Bukti Transfer* pembayaran secara manual dengan membalas pesan ini agar pendaftaran Anda dapat segera kami verifikasi (Lunas).

Terima kasih atas kerja samanya.
_Panitia KONAS PERSADIA 2026_`;
    }

    const waUrl = waNum
      ? `https://wa.me/${waNum}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(waUrl, "_blank");
  };

  const fetchVouchers = async () => {
    if (!isSupabaseConfigured) return;
    setLoadingVouchers(true);
    try {
      // 1. Coba lewat RPC get_vouchers terlebih dahulu (SECURITY DEFINER)
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_vouchers');
      if (!rpcError && rpcData && Array.isArray(rpcData)) {
        setVouchers(rpcData);
        return;
      }

      // 2. Fallback ke query tabel langsung
      const { data: voucherData, error: voucherError } = await supabase
        .from('vouchers')
        .select('*')
        .order('created_at', { ascending: false });

      if (voucherError) {
        console.error('Error fetching vouchers:', voucherError);
        if (voucherError.code === '42501' || voucherError.message?.toLowerCase().includes('permission')) {
          setVoucherActionMsg({
            type: 'error',
            text: 'Izin akses tabel vouchers ditolak. Silakan jalankan script supabase/fix_vouchers_permission.sql di SQL Editor Supabase.'
          });
        }
        return;
      }

      if (voucherData) {
        setVouchers(voucherData);
      }
    } catch (err: any) {
      console.error('Catch error fetching vouchers:', err);
    } finally {
      setLoadingVouchers(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Memoized fast lookups for vouchers across all 5,000+ registrants
  const usedVoucherCodesSet = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < data.length; i++) {
      const code = (data[i].KodeVoucher || data[i].kode_voucher || "").trim().toUpperCase();
      if (code) set.add(code);
    }
    return set;
  }, [data]);

  const voucherRegistrantMap = useMemo(() => {
    const map = new Map<string, Pendaftar>();
    for (let i = 0; i < data.length; i++) {
      const code = (data[i].KodeVoucher || data[i].kode_voucher || "").trim().toUpperCase();
      if (code && !map.has(code)) map.set(code, data[i]);
    }
    return map;
  }, [data]);

  const isVoucherActuallyUsed = (v: VoucherItem) => {
    if (v.is_used) return true;
    const codeClean = (v.code || '').trim().toUpperCase();
    return usedVoucherCodesSet.has(codeClean);
  };

  const getUsedVoucherRegistrant = (v: VoucherItem): Pendaftar | undefined => {
    const codeClean = (v.code || '').trim().toUpperCase();
    return voucherRegistrantMap.get(codeClean);
  };

  const getVoucherWaMessage = (code: string) => {
    const portalUrl = `${window.location.origin}/#pendaftaran`;
    return `Yth. Dokter,

Berikut adalah *Kode Voucher Khusus FKTP (Dokter Umum)* untuk pendaftaran *${EVENT_INFO.namaAcara}*:

🎟️ *Kode Voucher:* \`${code}\`
📍 *Link Pendaftaran:* ${portalUrl}

*Petunjuk Penggunaan:*
1. Buka link pendaftaran di atas.
2. Pilih Kategori: *Dokter Umum*.
3. Masukkan Kode Voucher di atas pada kolom yang tersedia, lalu klik tombol *"Terapkan"*.
4. Biaya pendaftaran Simposium & Workshop akan otomatis disesuaikan dengan subsidi khusus FKTP.

_Harap kode voucher ini tidak dibagikan ke pihak lain karena hanya berlaku untuk 1 kali pendaftaran._

Terima kasih,
_Panitia KONAS PERSADIA 2026_`;
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(code);
    showToast(`Kode ${code} berhasil disalin!`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleCopyWaMessage = (code: string) => {
    const msg = getVoucherWaMessage(code);
    navigator.clipboard.writeText(msg);
    setCopiedKey(`wa_${code}`);
    showToast(`Template pesan WhatsApp untuk ${code} berhasil disalin!`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleShareWa = (code: string) => {
    const msg = getVoucherWaMessage(code);
    const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  const handleAddVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = newVoucherInput.trim().toUpperCase();
    if (!cleanCode) return;

    setIsAddingVoucher(true);
    setVoucherActionMsg(null);

    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc('create_voucher', {
        p_code: cleanCode,
        p_kategori: 'dokter_umum',
      });

      if (!rpcErr && rpcData) {
        const newV = Array.isArray(rpcData) ? rpcData[0] : rpcData;
        if (newV) {
          setVouchers(prev => [newV, ...prev]);
        } else {
          await fetchVouchers();
        }
        setVoucherActionMsg({ type: 'success', text: `Voucher ${cleanCode} berhasil dibuat!` });
        setNewVoucherInput('FKTP-');
        showToast(`Voucher ${cleanCode} berhasil dibuat!`);
        return;
      }

      const { data: newV, error: insertError } = await supabase
        .from('vouchers')
        .insert([
          {
            code: cleanCode,
            kategori_target: 'dokter_umum',
            is_used: false,
          }
        ])
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '42501' || insertError.message?.toLowerCase().includes('permission')) {
          throw new Error('Izin ditolak (Permission denied) di Supabase. Silakan jalankan script supabase/fix_vouchers_permission.sql di SQL Editor Supabase.');
        }
        throw insertError;
      }

      if (newV) {
        setVouchers(prev => [newV, ...prev]);
      } else {
        await fetchVouchers();
      }
      setVoucherActionMsg({ type: 'success', text: `Voucher ${cleanCode} berhasil dibuat!` });
      setNewVoucherInput('FKTP-');
      showToast(`Voucher ${cleanCode} berhasil dibuat!`);
    } catch (err: any) {
      setVoucherActionMsg({ type: 'error', text: `Gagal membuat voucher: ${err.message}` });
    } finally {
      setIsAddingVoucher(false);
    }
  };

  const generateRandomSuffix = (len = 6) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = '';
    for (let i = 0; i < len; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  const handleBatchGenerate = async (count: number) => {
    setIsGeneratingBatch(true);
    setVoucherActionMsg(null);

    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc('generate_fktp_vouchers', {
        p_count: count
      });

      if (!rpcErr && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
        setVouchers(prev => [...rpcData, ...prev]);
        setVoucherActionMsg({ type: 'success', text: `Berhasil generate ${rpcData.length} voucher FKTP baru!` });
        showToast(`${rpcData.length} Voucher FKTP baru berhasil dibuat!`);
        return;
      }

      const existingCodes = new Set(vouchers.map(v => (v.code || '').toUpperCase().trim()));
      const newItems = [];

      for (let i = 0; i < count; i++) {
        let code = '';
        let attempts = 0;
        do {
          code = `FKTP-${generateRandomSuffix(6)}`;
          attempts++;
        } while (existingCodes.has(code) && attempts < 25);

        existingCodes.add(code);
        newItems.push({
          code,
          kategori_target: 'dokter_umum',
          is_used: false,
        });
      }

      const { data: insertedData, error: batchError } = await supabase
        .from('vouchers')
        .insert(newItems)
        .select();

      if (batchError) {
        if (batchError.code === '42501' || batchError.message?.toLowerCase().includes('permission')) {
          throw new Error('Izin ditolak (Permission denied) di Supabase. Silakan jalankan script supabase/fix_vouchers_permission.sql di SQL Editor Supabase.');
        }
        throw batchError;
      }

      if (insertedData) {
        setVouchers(prev => [...insertedData, ...prev]);
        setVoucherActionMsg({ type: 'success', text: `Berhasil membuat ${insertedData.length} voucher FKTP baru!` });
        showToast(`${insertedData.length} Voucher FKTP baru berhasil dibuat!`);
      } else {
        await fetchVouchers();
      }
    } catch (err: any) {
      setVoucherActionMsg({ type: 'error', text: `Gagal membuat voucher batch: ${err.message}` });
    } finally {
      setIsGeneratingBatch(false);
    }
  };

  const handleDeleteVoucher = async (code: string) => {
    if (!window.confirm(`Yakin ingin menghapus voucher ${code}?`)) return;

    try {
      const { error: delErr } = await supabase
        .from('vouchers')
        .delete()
        .eq('code', code);

      if (delErr) {
        if (delErr.code === '42501' || delErr.message?.toLowerCase().includes('permission')) {
          throw new Error('Izin hapus ditolak. Jalankan fix_vouchers_permission.sql.');
        }
        throw delErr;
      }

      setVouchers(prev => prev.filter(v => v.code !== code));
      showToast(`Voucher ${code} berhasil dihapus.`);
    } catch (err: any) {
      alert(`Gagal menghapus voucher: ${err.message}`);
    }
  };

  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      alert("Tidak ada data untuk diexport.");
      return;
    }

    const headers = [
      "No. Registrasi",
      "Tanggal",
      "Nama Lengkap",
      "NIK (Kemenkes)",
      "Email",
      "No. WhatsApp",
      "Kategori Peserta",
      "Akses Kegiatan",
      "Mode Kehadiran",
      "Total Bayar",
      "Status Pembayaran",
      "Institusi",
      "NIM",
      "Kode Voucher",
      "Cabang Persadia",
      "Kota/Kabupaten",
      "Provinsi",
      "Registrasi Onsite",
      "Waktu Check-in",
      "Presensi Workshop",
      "Waktu Workshop",
      "Hak Gala Dinner",
      "Presensi Gala Dinner",
      "Waktu Masuk Gala Dinner"
    ];

    const rows = filteredData.map(d => [
      `"${d["No. Registrasi"]}"`,
      `"${d.Timestamp}"`,
      `"${(d["Nama Lengkap"] || "").replace(/"/g, '""')}"`,
      `"'${d.nik || ""}"`,
      `"${d.Email || ""}"`,
      `"'${d["No. WhatsApp"] || ""}"`,
      `"${(d["Kategori Peserta"] || "").replace(/"/g, '""')}"`,
      `"${(d["Akses Kegiatan"] || "").replace(/"/g, '""')}"`,
      `"${d.mode_kehadiran || (d["Akses Kegiatan"] && d["Akses Kegiatan"].includes("Online") ? "Online" : "Onsite")}"`,
      d["Total Bayar"],
      `"${d["Status Pembayaran"]}"`,
      `"${(d.Institusi || "").replace(/"/g, '""')}"`,
      `"${d.nim || ""}"`,
      `"${d.KodeVoucher || d.kode_voucher || ""}"`,
      `"${(d.CabangPersadia || "").replace(/"/g, '""')}"`,
      `"${(d.kota_kabupaten || "").replace(/"/g, '""')}"`,
      `"${(d.provinsi || "").replace(/"/g, '""')}"`,
      `"${d.registrasi_onsite || "Belum"}"`,
      `"${d.waktu_registrasi_onsite || ""}"`,
      `"${d.kehadiran_workshop || "Belum"}"`,
      `"${d.waktu_kehadiran_workshop || ""}"`,
      `"${d.hak_gala_dinner ? "Ya (Diundang)" : "Tidak"}"`,
      `"${d.kehadiran_gala_dinner || "Belum"}"`,
      `"${d.waktu_kehadiran_gala_dinner || ""}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Data_Pendaftar_KONAS_PERSADIA_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Data pendaftar berhasil diunduh sebagai file CSV!");
  };

  // Voucher filtering (memoized)
  const availableFktpVouchers = useMemo(() => {
    return vouchers.filter(v =>
      (v.kategori_target === 'dokter_umum' || !v.kategori_target) &&
      !isVoucherActuallyUsed(v)
    );
  }, [vouchers, usedVoucherCodesSet]);

  const usedFktpVouchers = useMemo(() => {
    return vouchers.filter(v => isVoucherActuallyUsed(v));
  }, [vouchers, usedVoucherCodesSet]);

  const filteredVouchers = useMemo(() => {
    const isUsedMap = new Map<string, boolean>();
    vouchers.forEach(v => {
      isUsedMap.set(v.code, isVoucherActuallyUsed(v));
    });

    const q = voucherSearch.toLowerCase().trim();

    return vouchers.filter(v => {
      const isUsed = isUsedMap.get(v.code) ?? isVoucherActuallyUsed(v);
      if (voucherTab === 'fktp_tersedia' && isUsed) return false;
      if (voucherTab === 'terpakai' && !isUsed) return false;

      if (!q) return true;

      const codeMatch = (v.code || '').toLowerCase().includes(q);
      const targetMatch = (v.kategori_target || '').toLowerCase().includes(q);
      const usedByMatch = (v.used_by || '').toLowerCase().includes(q);

      const registrant = getUsedVoucherRegistrant(v);
      const regNameMatch = registrant ? (registrant["Nama Lengkap"] || '').toLowerCase().includes(q) : false;
      const regInstMatch = registrant ? (registrant.Institusi || '').toLowerCase().includes(q) : false;
      const regNoMatch = registrant ? (registrant["No. Registrasi"] || '').toLowerCase().includes(q) : false;

      return codeMatch || targetMatch || usedByMatch || regNameMatch || regInstMatch || regNoMatch;
    });
  }, [vouchers, voucherTab, voucherSearch, usedVoucherCodesSet, voucherRegistrantMap]);

  // General KPIs (memoized in a single fast loop)
  const { totalPendaftar, totalLunas, totalMenunggu, totalBatal, totalDana } = useMemo(() => {
    let lunas = 0;
    let menunggu = 0;
    let batal = 0;
    let dana = 0;

    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      const status = d["Status Pembayaran"];
      if (status === "Lunas") {
        lunas++;
        const val = typeof d["Total Bayar"] === 'number'
          ? d["Total Bayar"]
          : parseInt(d["Total Bayar"] || '0', 10);
        if (!isNaN(val)) dana += val;
      } else if (status === "Menunggu Verifikasi") {
        menunggu++;
      } else if (status === "Dibatalkan") {
        batal++;
      }
    }

    return {
      totalPendaftar: data.length,
      totalLunas: lunas,
      totalMenunggu: menunggu,
      totalBatal: batal,
      totalDana: dana,
    };
  }, [data]);

  // Category summaries & chart datasets (memoized)
  const { categoryCardData, pieData, statusBarData } = useMemo(() => {
    const scientificCardData = KATEGORI_PESERTA.filter((k) => k.akses === "ilmiah").map((k) => {
      const items = data.filter((d) => matchesCategory(d["Kategori Peserta"] || "", k.label));
      const total = items.length;
      const lunas = items.filter((d) => d["Status Pembayaran"] === "Lunas").length;
      const menunggu = items.filter((d) => d["Status Pembayaran"] === "Menunggu Verifikasi").length;
      const batal = items.filter((d) => d["Status Pembayaran"] === "Dibatalkan").length;
      const onsite = items.filter((d) => d.mode_kehadiran === "Onsite" || (d["Akses Kegiatan"] && d["Akses Kegiatan"].includes("Onsite"))).length;
      const online = items.filter((d) => d.mode_kehadiran === "Online" || (d["Akses Kegiatan"] && d["Akses Kegiatan"].includes("Online"))).length;

      return {
        id: k.id,
        name: k.label,
        total,
        lunas,
        menunggu,
        batal,
        onsite,
        online,
        anggota: 0,
        umum: 0,
        isClosed: closedCategories.includes(k.id),
        isPartiallyClosed: false,
      };
    });

    const pestaRakyatItems = data.filter((d) => matchesCategory(d["Kategori Peserta"] || "", "Pesta Rakyat"));
    const anggotaItems = data.filter((d) => matchesCategory(d["Kategori Peserta"] || "", "Anggota PERSADIA"));
    const umumItems = data.filter((d) => matchesCategory(d["Kategori Peserta"] || "", "Masyarakat Umum"));

    const isPersadiaClosed = closedCategories.includes("persadia");
    const isUmumClosed = closedCategories.includes("umum");
    const isAllPestaClosed = isPersadiaClosed && isUmumClosed;
    const isAnyPestaClosed = isPersadiaClosed || isUmumClosed;

    const pestaRakyatCard = {
      id: "pesta_rakyat",
      name: "Pesta Rakyat",
      total: pestaRakyatItems.length,
      lunas: pestaRakyatItems.filter((d) => d["Status Pembayaran"] === "Lunas").length,
      menunggu: pestaRakyatItems.filter((d) => d["Status Pembayaran"] === "Menunggu Verifikasi").length,
      batal: pestaRakyatItems.filter((d) => d["Status Pembayaran"] === "Dibatalkan").length,
      onsite: 0,
      online: 0,
      anggota: anggotaItems.length,
      umum: umumItems.length,
      isClosed: isAllPestaClosed,
      isPartiallyClosed: isAnyPestaClosed && !isAllPestaClosed,
    };

    const dhfItems = data.filter((d) => 
      matchesCategory(d["Kategori Peserta"] || "", "Diabetes Health Forum") ||
      (d["Akses Kegiatan"] && (d["Akses Kegiatan"].includes("Health Forum") || d["Akses Kegiatan"].includes("Health Talk"))) ||
      (d.ikut_health_talk === true)
    );

    const dhfAnggota = dhfItems.filter((d) => matchesCategory(d["Kategori Peserta"] || "", "Anggota PERSADIA")).length;
    const dhfUmum = dhfItems.filter((d) => matchesCategory(d["Kategori Peserta"] || "", "Masyarakat Umum")).length;

    const dhfCard = {
      id: "diabetes_health_forum",
      name: "Diabetes Health Forum",
      total: dhfItems.length,
      lunas: dhfItems.filter((d) => d["Status Pembayaran"] === "Lunas").length,
      menunggu: dhfItems.filter((d) => d["Status Pembayaran"] === "Menunggu Verifikasi").length,
      batal: dhfItems.filter((d) => d["Status Pembayaran"] === "Dibatalkan").length,
      onsite: dhfItems.length,
      online: 0,
      anggota: dhfAnggota,
      umum: dhfUmum,
      isClosed: closedCategories.includes("diabetes_health_forum"),
      isPartiallyClosed: false,
    };

    const cardData = [...scientificCardData, dhfCard, pestaRakyatCard];

    const pData = cardData
      .filter((cat) => cat.total > 0)
      .map((cat) => ({
        name: cat.name,
        value: cat.total,
      }));

    const sBarData = [
      { name: 'Menunggu', jumlah: totalMenunggu, fill: '#f59e0b' },
      { name: 'Lunas', jumlah: totalLunas, fill: '#10b981' },
      { name: 'Dibatalkan', jumlah: totalBatal, fill: '#ef4444' },
    ];

    return {
      categoryCardData: cardData,
      pieData: pData,
      statusBarData: sBarData,
    };
  }, [data, closedCategories, totalMenunggu, totalLunas, totalBatal]);

  // Fast category participant count lookup map
  const categoryCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    categoryCardData.forEach((c) => {
      map[c.id] = c.total;
    });
    return map;
  }, [categoryCardData]);

  // Memoized Gala Dinner statistics
  const galaStats = useMemo(() => {
    let eligibleTotal = 0;
    let eligibleLunas = 0;
    let grantedTotal = 0;
    let checkedInTotal = 0;

    data.forEach(p => {
      const eligible = isEligibleForGalaDinner(p);
      if (eligible) {
        eligibleTotal++;
        if (p["Status Pembayaran"] === "Lunas") {
          eligibleLunas++;
        }
      }
      if (p.hak_gala_dinner) {
        grantedTotal++;
      }
      if (p.kehadiran_gala_dinner === "Ya") {
        checkedInTotal++;
      }
    });

    const pendingGrant = data.filter(p => isEligibleForGalaDinner(p) && p["Status Pembayaran"] === "Lunas" && !p.hak_gala_dinner).length;

    return {
      eligibleTotal,
      eligibleLunas,
      grantedTotal,
      checkedInTotal,
      pendingGrant
    };
  }, [data]);

  // Ultra-fast search and filter for 5,600+ registrants using pre-computed search index and deferred value
  const filteredData = useMemo(() => {
    const q = deferredSearchQuery.toLowerCase().trim();
    const queryTerms = q ? q.split(/\s+/).filter(Boolean) : [];

    return data.filter((item) => {
      // 1. Fast path: check status filter
      if (statusFilter !== "Semua" && item["Status Pembayaran"] !== statusFilter) {
        return false;
      }

      // 2. Fast path: check category filter
      if (kategoriFilter !== "Semua") {
        if (kategoriFilter === "Diabetes Health Forum") {
          const isDhf =
            matchesCategory(item["Kategori Peserta"] || "", "Diabetes Health Forum") ||
            (item["Akses Kegiatan"] && (item["Akses Kegiatan"].includes("Health Forum") || item["Akses Kegiatan"].includes("Health Talk"))) ||
            item.ikut_health_talk === true;
          if (!isDhf) return false;
        } else if (!matchesCategory(item["Kategori Peserta"] || "", kategoriFilter)) {
          return false;
        }
      }

      // 2.1 Fast path: check Gala Dinner filter
      if (galaFilter !== "Semua") {
        if (galaFilter === "Granted" && !item.hak_gala_dinner) return false;
        if (galaFilter === "NotGranted" && (!isEligibleForGalaDinner(item) || item.hak_gala_dinner)) return false;
        if (galaFilter === "Eligible" && !isEligibleForGalaDinner(item)) return false;
        if (galaFilter === "CheckedIn" && item.kehadiran_gala_dinner !== "Ya") return false;
      }

      // 3. Search query: match all terms against pre-computed lowercase search index
      if (queryTerms.length === 0) return true;

      const idx = item._searchIndex || "";
      return queryTerms.every((term) => idx.includes(term));
    });
  }, [data, deferredSearchQuery, statusFilter, kategoriFilter, galaFilter]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-100">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center">
              <ShieldAlert className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 text-center mb-2">Admin Login</h1>
          <p className="text-slate-500 text-center text-sm mb-6">
            Masuk dengan akun admin Supabase untuk mengelola data pendaftaran.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email Admin</label>
              <input
                type="email"
                required
                placeholder="admin@konaspersadia.or.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm transition-all"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm transition-all"
              />
            </div>

            {authError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Masuk Dashboard"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={onNavigateHome} className="text-sm text-slate-500 hover:text-slate-800 flex items-center justify-center mx-auto cursor-pointer">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pagination calculation
  const totalRows = filteredData.length;
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(totalRows / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = pageSize === -1 ? 0 : (safeCurrentPage - 1) * pageSize;
  const endIndex = pageSize === -1 ? totalRows : Math.min(startIndex + pageSize, totalRows);
  const paginatedData = pageSize === -1 ? filteredData : filteredData.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Sticky Main Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          {/* Left: Branding & Return Button */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onNavigateHome}
              className="p-2 -ml-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
              title="Kembali ke Beranda Web"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center mr-2.5 shadow-xs">
                <ShieldAlert className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-base sm:text-lg text-slate-800 leading-tight">KONAS Admin</h1>
                {currentUserEmail && (
                  <span className="text-[10px] text-slate-400 font-medium block truncate max-w-[140px] sm:max-w-xs">{currentUserEmail}</span>
                )}
              </div>
            </div>
          </div>

          {/* Center: Simplified Operational Tabs */}
          <nav className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setActiveTab('pendaftar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'pendaftar'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Pendaftar</span>
              {totalMenunggu > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold animate-pulse">
                  {totalMenunggu}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('voucher')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'voucher'
                  ? 'bg-white text-amber-700 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Ticket className="w-3.5 h-3.5 text-amber-600" />
              <span>Voucher FKTP</span>
              <span className="ml-0.5 px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">
                {availableFktpVouchers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('statistik')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'statistik'
                  ? 'bg-white text-purple-700 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Statistik</span>
            </button>
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                fetchData();
                fetchVouchers();
              }}
              disabled={loading || loadingVouchers}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Refresh Data Terbaru"
            >
              <RefreshCw className={`h-4 w-4 ${(loading || loadingVouchers) ? 'animate-spin text-blue-600' : ''}`} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Keluar dari Akun Admin"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        {loading && data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
            <p className="text-slate-600 font-medium">Memuat data pendaftar dari Supabase...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center justify-between">
            <p>{error}</p>
            <button onClick={fetchData} className="font-semibold underline hover:text-red-800">Coba Lagi</button>
          </div>
        ) : (
          <>
            {/* ============================================================== */}
            {/* TAB 1: PENDAFTAR & VERIFIKASI (OPERASIONAL UTAMA) */}
            {/* ============================================================== */}
            {activeTab === 'pendaftar' && (
              <div className="space-y-3.5">
                {/* Compact Interactive Stat Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div
                    onClick={() => { setStatusFilter("Semua"); setKategoriFilter("Semua"); }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      statusFilter === "Semua" ? "bg-white border-blue-500 ring-2 ring-blue-100 shadow-xs" : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Pendaftar</p>
                      <h4 className="text-lg font-bold text-slate-800">{totalPendaftar}</h4>
                    </div>
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>

                  <div
                    onClick={() => setStatusFilter("Menunggu Verifikasi")}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      statusFilter === "Menunggu Verifikasi" ? "bg-amber-50/50 border-amber-500 ring-2 ring-amber-100 shadow-xs" : "bg-white border-slate-200 hover:border-amber-300"
                    }`}
                  >
                    <div>
                      <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Perlu Verifikasi</p>
                      <h4 className="text-lg font-bold text-amber-600">{totalMenunggu}</h4>
                    </div>
                    <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>

                  <div
                    onClick={() => setStatusFilter("Lunas")}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      statusFilter === "Lunas" ? "bg-emerald-50/50 border-emerald-500 ring-2 ring-emerald-100 shadow-xs" : "bg-white border-slate-200 hover:border-emerald-300"
                    }`}
                  >
                    <div>
                      <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Terverifikasi (Lunas)</p>
                      <h4 className="text-lg font-bold text-emerald-600">{totalLunas}</h4>
                    </div>
                    <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border bg-white border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Dana Terverifikasi</p>
                      <h4 className="text-lg font-bold text-slate-800">Rp {totalDana.toLocaleString('id-ID')}</h4>
                    </div>
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Category Breakdown Cards */}
                <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                          Jumlah Peserta per Kategori
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Klik kartu untuk memfilter daftar pendaftar di bawah secara instan
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowCategorySettings(prev => !prev)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                          showCategorySettings
                            ? "bg-[#0B3D5E] text-white border-[#0B3D5E]"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-2xs"
                        }`}
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Kelola Buka/Tutup Pendaftaran</span>
                        {closedCategories.length > 0 && (
                          <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] rounded-full font-bold animate-pulse">
                            {closedCategories.length} Ditutup
                          </span>
                        )}
                      </button>

                      {kategoriFilter !== "Semua" && (
                        <button
                          onClick={() => setKategoriFilter("Semua")}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset Filter Kategori ({kategoriFilter})</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expandable Category Access Management Panel */}
                  {showCategorySettings && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-in fade-in duration-150">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                            <Power className="w-4 h-4 text-[#0B3D5E]" />
                            Pengaturan Buka / Tutup Pendaftaran per Kategori
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Matikan pendaftaran jika kuota kategori tertentu (terutama Pesta Rakyat) sudah penuh.
                          </p>
                        </div>

                        {/* Batch Pesta Rakyat Actions */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleTogglePestaRakyatBatch(true)}
                            disabled={isUpdatingCategoryStatus !== null}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold shadow-2xs transition cursor-pointer disabled:opacity-50"
                          >
                            🚫 Tutup Semua Pesta Rakyat
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTogglePestaRakyatBatch(false)}
                            disabled={isUpdatingCategoryStatus !== null}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-2xs transition cursor-pointer disabled:opacity-50"
                          >
                            ✅ Buka Semua Pesta Rakyat
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenAddModal("persadia")}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold shadow-2xs transition cursor-pointer flex items-center gap-1"
                            title="Tambah peserta Pesta Rakyat secara manual dengan hak akses admin"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>+ Tambah Peserta Manual</span>
                          </button>
                        </div>
                      </div>

                      {/* Kontrol Khusus Jalur Online FKTP */}
                      {(() => {
                        const isFktpOnlineHidden = closedCategories.includes("fktp_online");
                        const fktpStats = categoryCardData.find((c) => c.id === "dokter_fktp");

                        return (
                          <div className="p-3 sm:p-3.5 bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-indigo-50/70 border border-blue-200/90 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-[#0B3D5E] flex items-center gap-1.5">
                                  <Video className="w-4 h-4 text-blue-600" />
                                  Kontrol Khusus Jalur Online FKTP (Zoom Webinar - Rp 300.000)
                                </span>
                                {isFktpOnlineHidden ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    🚫 DISEMBUNYIKAN (Fokus Onsite)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    ✅ DIBUKA &amp; TAMPIL DI FORM
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-600 leading-relaxed max-w-2xl">
                                {isFktpOnlineHidden
                                  ? "Jalur online saat ini DISEMBUNYIKAN dari form registrasi. Calon pendaftar FKTP hanya dapat mendaftar paket Onsite Novotel (Rp 600.000) guna memprioritaskan kuota onsite terlebih dahulu."
                                  : "Jalur online saat ini DIBUKA di form registrasi. Calon pendaftar FKTP bebas memilih opsi Onsite (Rp 600.000) atau Daring Zoom (Rp 300.000)."}
                              </p>
                              {fktpStats && (
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium pt-0.5">
                                  <span>Data Pendaftar FKTP:</span>
                                  <span className="font-bold text-slate-700">{fktpStats.total} Total</span>
                                  <span>•</span>
                                  <span className="font-semibold text-blue-700">🏛️ {fktpStats.onsite} Onsite</span>
                                  <span>•</span>
                                  <span className="font-semibold text-indigo-700">💻 {fktpStats.online} Online</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
                              <button
                                type="button"
                                onClick={() => handleToggleCategory("fktp_online")}
                                disabled={isUpdatingCategoryStatus !== null}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50 ${
                                  isFktpOnlineHidden
                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                    : "bg-amber-600 hover:bg-amber-700 text-white"
                                }`}
                              >
                                {isFktpOnlineHidden ? "🔓 Buka Jalur Online" : "🔒 Sembunyikan Jalur Online"}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleCategory("fktp_online")}
                                disabled={isUpdatingCategoryStatus !== null}
                                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
                                  !isFktpOnlineHidden ? "bg-emerald-500" : "bg-slate-300"
                                }`}
                                title={isFktpOnlineHidden ? "Klik untuk MEMBUKA jalur online di form" : "Klik untuk MENYEMBUNYIKAN jalur online di form"}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-xs ${
                                    !isFktpOnlineHidden ? "translate-x-6" : "translate-x-1"
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {/* List of individual category toggles */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                        {KATEGORI_PESERTA.map((k) => {
                          const isClosed = closedCategories.includes(k.id);
                          const isFktpOnlineHidden = closedCategories.includes("fktp_online");
                          const totalPeserta = categoryCountMap[k.id] ?? 0;

                          return (
                            <div
                              key={k.id}
                              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition ${
                                isClosed
                                  ? "bg-rose-50/60 border-rose-200"
                                  : "bg-white border-slate-200"
                              }`}
                            >
                              <div className="min-w-0 pr-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-bold text-slate-800 truncate block" title={k.label}>
                                    {k.label}
                                  </span>
                                  {k.id === "dokter_fktp" && isFktpOnlineHidden && (
                                    <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded font-bold text-[9px]">
                                      Online Tersembunyi
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                                  <span>{totalPeserta} pendaftar</span>
                                  <span>•</span>
                                  <span className={isClosed ? "text-rose-700 font-bold" : "text-emerald-700 font-bold"}>
                                    {isClosed ? "DITUTUP" : "DIBUKA"}
                                  </span>
                                  {k.id === "diabetes_health_forum" ? (
                                    <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded font-semibold text-[9px]">
                                      Novotel Ballroom
                                    </span>
                                  ) : k.akses === "pesta_rakyat" ? (
                                    <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded font-semibold text-[9px]">
                                      Pesta Rakyat
                                    </span>
                                  ) : null}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleToggleCategory(k.id)}
                                disabled={isUpdatingCategoryStatus !== null}
                                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
                                  !isClosed ? "bg-emerald-500" : "bg-slate-300"
                                }`}
                                title={isClosed ? "Klik untuk MEMBUKA pendaftaran" : "Klik untuk MENUTUP pendaftaran"}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-xs ${
                                    !isClosed ? "translate-x-6" : "translate-x-1"
                                  }`}
                                />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-2 sm:gap-2.5">
                    {categoryCardData.map((cat) => {
                      const isSelected = kategoriFilter === cat.name;
                      const isClosed = cat.isClosed;
                      const isPartiallyClosed = cat.isPartiallyClosed;
                      return (
                        <div
                          key={cat.name}
                          onClick={() => setKategoriFilter(isSelected ? "Semua" : cat.name)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                            isSelected
                              ? "bg-blue-50/70 border-blue-500 ring-2 ring-blue-100 shadow-xs"
                              : isClosed
                                ? "bg-rose-50/40 hover:bg-white border-rose-200 hover:border-rose-300"
                                : isPartiallyClosed
                                  ? "bg-amber-50/40 hover:bg-white border-amber-200 hover:border-amber-300"
                                  : "bg-slate-50/60 hover:bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs"
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-1 mb-2">
                              <span
                                className={`text-xs font-bold leading-snug line-clamp-2 ${
                                  isSelected ? "text-blue-900" : "text-slate-700"
                                }`}
                                title={cat.name}
                              >
                                {cat.name}
                              </span>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                {isClosed ? (
                                  <span className="px-1.5 py-0.2 bg-rose-600 text-white text-[9px] font-bold rounded-full">
                                    Ditutup
                                  </span>
                                ) : isPartiallyClosed ? (
                                  <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[9px] font-bold rounded-full" title="Sebagian kategori Pesta Rakyat ditutup">
                                    1 Tutup
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded-full">
                                    Dibuka
                                  </span>
                                )}
                                {cat.id === "dokter_fktp" && closedCategories.includes("fktp_online") && (
                                  <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[9px] font-bold rounded-full" title="Jalur Online disembunyikan di form pendaftaran">
                                    Online Hide
                                  </span>
                                )}
                                {isSelected && (
                                  <span className="px-1.5 py-0.2 bg-blue-600 text-white text-[9px] font-bold rounded-full">
                                    Aktif
                                  </span>
                                )}
                              </div>
                            </div>
                            <div>
                              <div className={`text-xl font-black leading-none mb-1.5 ${
                                isSelected ? "text-blue-900" : "text-slate-900"
                              }`}>
                                {cat.total}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-1.5 text-[10px] font-medium leading-tight">
                                <span className="text-emerald-700 font-semibold">{cat.lunas} Lunas</span>
                                {cat.menunggu > 0 && (
                                  <span className="text-amber-700 font-semibold">• {cat.menunggu} Menunggu</span>
                                )}
                              </div>

                              {/* FKTP breakdown (Onsite vs Online) */}
                              {cat.id === "dokter_fktp" && (
                                <div className="flex items-center gap-1.5 text-[9px] font-medium text-slate-600 mt-1.5 flex-wrap">
                                  <span className="px-1.5 py-0.5 bg-blue-50 text-blue-800 rounded font-bold border border-blue-100">
                                    🏛️ {cat.onsite} Onsite
                                  </span>
                                  <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-800 rounded font-bold border border-indigo-100">
                                    💻 {cat.online} Online
                                  </span>
                                </div>
                              )}

                              {/* DHF breakdown (Anggota PERSADIA vs Umum) */}
                              {cat.id === "diabetes_health_forum" && (
                                <div className="flex items-center gap-1.5 text-[9px] font-medium text-slate-600 mt-1.5 flex-wrap">
                                  <span className="px-1.5 py-0.5 bg-purple-50 text-purple-800 rounded font-bold border border-purple-200">
                                    🏅 {cat.anggota} Anggota
                                  </span>
                                  <span className="px-1.5 py-0.5 bg-amber-50 text-amber-800 rounded font-bold border border-amber-200">
                                    👥 {cat.umum} Umum
                                  </span>
                                </div>
                              )}

                              {/* Pesta Rakyat breakdown (Anggota PERSADIA vs Umum) */}
                              {cat.id === "pesta_rakyat" && (
                                <div className="flex items-center gap-1.5 text-[9px] font-medium text-slate-600 mt-1.5 flex-wrap">
                                  <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded font-bold border border-emerald-200">
                                    🏅 {cat.anggota} Anggota
                                  </span>
                                  <span className="px-1.5 py-0.5 bg-amber-50 text-amber-800 rounded font-bold border border-amber-200">
                                    👥 {cat.umum} Umum
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quick Toggle switch on card footer */}
                          <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                            <span className="text-slate-400 font-medium">Akses:</span>
                            <div className="flex items-center gap-1.5">
                              {cat.id === "pesta_rakyat" && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenAddModal("persadia");
                                  }}
                                  className="px-1.5 py-0.5 rounded font-bold text-[9px] bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition cursor-pointer flex items-center gap-0.5"
                                  title="Tambah peserta susulan Pesta Rakyat (Admin)"
                                >
                                  <UserPlus className="w-2.5 h-2.5" />
                                  <span>+ Peserta</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (cat.id === "pesta_rakyat") {
                                    handleTogglePestaRakyatBatch(!isClosed);
                                  } else {
                                    handleToggleCategory(cat.id);
                                  }
                                }}
                                disabled={isUpdatingCategoryStatus !== null}
                                className={`px-2 py-0.5 rounded font-bold transition cursor-pointer disabled:opacity-50 ${
                                  isClosed
                                    ? "bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-200"
                                    : isPartiallyClosed
                                      ? "bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-200"
                                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                                }`}
                                title={
                                  isClosed
                                    ? "Klik untuk MEMBUKA pendaftaran"
                                    : isPartiallyClosed
                                      ? "Klik untuk MENUTUP SEMUA pendaftaran Pesta Rakyat"
                                      : "Klik untuk MENUTUP pendaftaran"
                                }
                              >
                                {isClosed ? "Buka" : isPartiallyClosed ? "Tutup Semua" : "Tutup"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Table Card */}
                <div className="bg-white rounded-2xl shadow-xs border border-slate-200">
                  {/* Clean Search & Filter Control Bar (Sticky) */}
                  <div 
                    style={{ position: 'sticky', top: '4rem' }}
                    className="sticky top-16 z-20 p-3.5 sm:p-4 border-b border-slate-200 bg-white rounded-t-2xl shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3"
                  >
                    {/* Left: Search input */}
                    <div className="relative flex-1 max-w-lg">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {deferredSearchQuery !== searchQuery ? (
                          <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Cari nama, No. Reg, WhatsApp, instansi, voucher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-8 py-2 w-full rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs sm:text-sm bg-white"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Right: Quick Status Pills & Category & Export */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Status Pills */}
                      <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-xs font-semibold">
                        {(["Semua", "Menunggu Verifikasi", "Lunas", "Dibatalkan"] as const).map((status) => (
                          <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                              statusFilter === status
                                ? "bg-white text-slate-900 shadow-xs"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            {status === "Menunggu Verifikasi" ? "Menunggu" : status}
                          </button>
                        ))}
                      </div>

                      {/* Category Filter */}
                      <select
                        value={kategoriFilter}
                        onChange={(e) => setKategoriFilter(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value="Semua">Semua Kategori</option>
                        <option value="Pesta Rakyat">🎪 Pesta Rakyat (Semua)</option>
                        <option value="Anggota PERSADIA">　↳ Anggota PERSADIA</option>
                        <option value="Masyarakat Umum">　↳ Masyarakat Umum</option>
                        <option value="Diabetes Health Forum">🩺 Diabetes Health Forum</option>
                        {KATEGORI_PESERTA.filter(k => k.akses !== "pesta_rakyat" && k.id !== "diabetes_health_forum").map((k) => (
                          <option key={k.id} value={k.label}>{k.label}</option>
                        ))}
                      </select>

                      {/* Gala Dinner Filter */}
                      <select
                        value={galaFilter}
                        onChange={(e) => setGalaFilter(e.target.value as any)}
                        className="px-2.5 py-1.5 rounded-lg border border-purple-200 bg-purple-50/50 text-xs font-semibold text-purple-900 outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                        title="Filter berdasarkan hak akses Gala Dinner"
                      >
                        <option value="Semua">Semua Akses Gala</option>
                        <option value="Granted">🍽️ Diundang Gala ({galaStats.grantedTotal})</option>
                        <option value="NotGranted">⏳ Belum Diundang ({galaStats.pendingGrant})</option>
                        <option value="Eligible">🎯 Simposium + Workshop ({galaStats.eligibleTotal})</option>
                        <option value="CheckedIn">✅ Hadir Ballroom ({galaStats.checkedInTotal})</option>
                      </select>

                      {/* Kelola Hak Akses Gala Dinner */}
                      <button
                        onClick={() => setIsGalaModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-300 bg-purple-50 hover:bg-purple-100 text-xs font-semibold text-purple-800 shadow-xs transition-colors cursor-pointer"
                        title="Kelola & Berikan Akses Gala Dinner untuk Peserta Simposium + Workshop"
                      >
                        <UtensilsCrossed className="w-3.5 h-3.5 text-purple-600" />
                        <span>Gala Dinner</span>
                        {galaStats.pendingGrant > 0 && (
                          <span className="px-1.5 py-0.2 bg-purple-700 text-white text-[10px] rounded-full font-bold">
                            +{galaStats.pendingGrant}
                          </span>
                        )}
                      </button>

                      {/* Export CSV */}
                      <button
                        onClick={handleExportCSV}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition-colors cursor-pointer"
                        title="Unduh Data Saat Ini ke Excel (CSV)"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-500" />
                        <span>Export CSV</span>
                      </button>

                      {/* Tambah Peserta Baru */}
                      <button
                        onClick={() => handleOpenAddModal()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                        title="Tambah Peserta Baru (Hak Akses Admin)"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Tambah Peserta</span>
                      </button>
                    </div>
                  </div>

                  {/* Action Error Banner if any */}
                  {actionError && (
                    <div className="bg-red-50 border-b border-red-200 text-red-700 px-4 py-2.5 text-xs flex items-center justify-between">
                      <div className="flex items-center">
                        <ShieldAlert className="h-4 w-4 mr-2" />
                        {actionError}
                      </div>
                      <button onClick={() => setActionError(null)} className="text-red-500 hover:text-red-700">
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* Clean Responsive Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="px-4 py-3">No. Reg & Waktu</th>
                          <th className="px-4 py-3">Peserta & Kontak</th>
                          <th className="px-4 py-3">Kategori & Tagihan</th>
                          <th className="px-4 py-3 text-center">Status</th>
                          <th className="px-4 py-3 text-right">Aksi Operasional</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paginatedData.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-16 text-center text-slate-400">
                              <p className="font-medium text-sm">Tidak ada pendaftar yang cocok dengan filter pencarian.</p>
                              {(searchQuery || statusFilter !== "Semua" || kategoriFilter !== "Semua") && (
                                <button
                                  onClick={() => { setSearchQuery(""); setStatusFilter("Semua"); setKategoriFilter("Semua"); }}
                                  className="mt-2 text-xs text-blue-600 hover:underline cursor-pointer"
                                >
                                  Reset Semua Filter
                                </button>
                              )}
                            </td>
                          </tr>
                        ) : (
                          paginatedData.map((row, idx) => {
                            const isMenunggu = row["Status Pembayaran"] === "Menunggu Verifikasi";
                            const isLunas = row["Status Pembayaran"] === "Lunas";
                            const isDibatalkan = row["Status Pembayaran"] === "Dibatalkan";

                            return (
                              <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                {/* 1. No Reg & Tanggal */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs border border-slate-200/60">
                                    {row["No. Registrasi"]}
                                  </span>
                                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(row.Timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </td>

                                {/* 2. Peserta & Kontak */}
                                <td className="px-4 py-3">
                                  <div className="font-semibold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                                    <span>{row["Nama Lengkap"]}</span>
                                    {row.registrasi_onsite === 'Ya' && (
                                      <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold" title="Check-in Onsite Selesai">
                                        Onsite
                                      </span>
                                    )}
                                  </div>

                                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                                    {row.Institusi && row.Institusi !== '-' && (
                                      <span className="truncate max-w-[160px] text-[11px] text-slate-600 font-medium" title={row.Institusi}>
                                        🏛️ {row.Institusi}
                                      </span>
                                    )}
                                    {row["No. WhatsApp"] && row["No. WhatsApp"] !== "-" && (
                                      <a
                                        href={`https://wa.me/${row["No. WhatsApp"].replace(/\D/g, '').replace(/^0/, '62')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center text-[#128C7E] hover:underline text-[11px] font-medium"
                                        title="Kirim pesan WhatsApp"
                                      >
                                        <MessageCircle className="w-3 h-3 mr-0.5" />
                                        {row["No. WhatsApp"]}
                                      </a>
                                    )}
                                  </div>
                                </td>

                                {/* 3. Kategori & Tagihan */}
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-medium text-slate-800 text-xs">{row["Kategori Peserta"]}</span>
                                    {row["Akses Kegiatan"] && row["Akses Kegiatan"].includes("Online") && (
                                      <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold" title="Partisipasi Daring via Zoom">
                                        💻 Online
                                      </span>
                                    )}
                                    {row["Akses Kegiatan"] && row["Akses Kegiatan"].includes("Onsite") && (
                                      <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-medium" title="Hadir Langsung di Novotel">
                                        🏛️ Onsite
                                      </span>
                                    )}
                                    {(row.ikut_health_talk === true || (row["Akses Kegiatan"] && (row["Akses Kegiatan"].includes("Health Forum") || row["Akses Kegiatan"].includes("Health Talk")))) && (
                                      <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 border border-purple-200 rounded text-[10px] font-bold" title="Peserta Sesi Diabetes Health Forum Novotel">
                                        🩺 Health Forum
                                      </span>
                                    )}
                                    {(row.KodeVoucher || row.kode_voucher) && (row.KodeVoucher !== '-' && row.kode_voucher !== '-') && (
                                      <span className="px-1.5 py-0.2 bg-amber-50 text-amber-800 border border-amber-300 rounded font-mono text-[10px] font-bold">
                                        🎟️ {row.KodeVoucher || row.kode_voucher}
                                      </span>
                                    )}
                                    {row.hak_gala_dinner && (
                                      <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 border border-purple-200 rounded text-[10px] font-bold inline-flex items-center gap-1" title="Mendapatkan Undangan Gala Dinner Novotel">
                                        🍽️ Gala Dinner
                                      </span>
                                    )}
                                    {row.kehadiran_gala_dinner === 'Ya' && (
                                      <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold inline-flex items-center gap-0.5" title="Presensi Masuk Ballroom Novotel Selesai">
                                        ✅ Hadir Ballroom
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs font-semibold text-slate-700 mt-0.5">
                                    Rp {typeof row["Total Bayar"] === 'number'
                                      ? row["Total Bayar"].toLocaleString('id-ID')
                                      : parseInt(row["Total Bayar"] as string || '0', 10).toLocaleString('id-ID')}
                                  </div>
                                </td>

                                {/* 4. Status Badge */}
                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    isLunas
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      : row["Status Pembayaran"] === 'Dibatalkan'
                                      ? 'bg-red-100 text-red-800 border border-red-200'
                                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                                  }`}>
                                    {isLunas && <CheckCircle className="w-3 h-3 mr-1" />}
                                    {row["Status Pembayaran"] === 'Dibatalkan' && <XCircle className="w-3 h-3 mr-1" />}
                                    {isMenunggu && <Clock className="w-3 h-3 mr-1" />}
                                    {row["Status Pembayaran"]}
                                  </span>
                                </td>

                                {/* 5. Action Buttons */}
                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {/* Action: Quick Status Buttons */}
                                    {isMenunggu && (
                                      <>
                                        <button
                                          onClick={() => setConfirmDialog({
                                            isOpen: true,
                                            id: row["No. Registrasi"],
                                            status: "Lunas",
                                            currentStatus: row["Status Pembayaran"],
                                            nama: row["Nama Lengkap"],
                                            totalBayar: row["Total Bayar"]
                                          })}
                                          disabled={actionLoadingId === row["No. Registrasi"]}
                                          className="inline-flex items-center px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                                          title="Set Lunas & Berikan E-Tiket"
                                        >
                                          {actionLoadingId === row["No. Registrasi"] ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                          ) : (
                                            <Check className="w-3 h-3 mr-1" />
                                          )}
                                          Lunas
                                        </button>

                                        <button
                                          onClick={() => setConfirmDialog({
                                            isOpen: true,
                                            id: row["No. Registrasi"],
                                            status: "Dibatalkan",
                                            currentStatus: row["Status Pembayaran"],
                                            nama: row["Nama Lengkap"],
                                            totalBayar: row["Total Bayar"]
                                          })}
                                          disabled={actionLoadingId === row["No. Registrasi"]}
                                          className="inline-flex items-center px-2 py-1 bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                          title="Batalkan Pendaftaran"
                                        >
                                          Batal
                                        </button>
                                      </>
                                    )}

                                    {/* For Lunas: Option to Cancel (safe for duplicates) */}
                                    {isLunas && (
                                      <button
                                        onClick={() => setConfirmDialog({
                                          isOpen: true,
                                          id: row["No. Registrasi"],
                                          status: "Dibatalkan",
                                          currentStatus: row["Status Pembayaran"],
                                          nama: row["Nama Lengkap"],
                                          totalBayar: row["Total Bayar"]
                                        })}
                                        disabled={actionLoadingId === row["No. Registrasi"]}
                                        className="inline-flex items-center px-2 py-1 bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                        title="Batalkan Pendaftaran (misal: pendaftar ganda / duplikat)"
                                      >
                                        Batal
                                      </button>
                                    )}

                                    {/* For Dibatalkan: Option to Restore */}
                                    {isDibatalkan && (
                                      <button
                                        onClick={() => setConfirmDialog({
                                          isOpen: true,
                                          id: row["No. Registrasi"],
                                          status: "Lunas",
                                          currentStatus: row["Status Pembayaran"],
                                          nama: row["Nama Lengkap"],
                                          totalBayar: row["Total Bayar"]
                                        })}
                                        disabled={actionLoadingId === row["No. Registrasi"]}
                                        className="inline-flex items-center px-2 py-1 bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                        title="Pulihkan status pendaftaran ke Lunas"
                                      >
                                        <RotateCcw className="w-3 h-3 mr-1" />
                                        Pulihkan
                                      </button>
                                    )}

                                    {/* Action: Toggle Gala Dinner (Khusus Simposium + Workshop) */}
                                    {isEligibleForGalaDinner(row) && (
                                      <button
                                        onClick={() => handleToggleGalaDinner(row, !row.hak_gala_dinner)}
                                        disabled={galaLoadingId === row["No. Registrasi"]}
                                        className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer disabled:opacity-50 ${
                                          row.hak_gala_dinner
                                            ? "bg-purple-100 hover:bg-purple-200 text-purple-800 border-purple-300"
                                            : "bg-white hover:bg-purple-50 text-slate-600 hover:text-purple-700 border-slate-200"
                                        }`}
                                        title={
                                          row.hak_gala_dinner
                                            ? "Akses Gala Dinner Aktif. Klik untuk mencabut hak akses."
                                            : "Klik untuk memberikan hak akses Gala Dinner (Khusus Simposium + Workshop)"
                                        }
                                      >
                                        {galaLoadingId === row["No. Registrasi"] ? (
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                          <UtensilsCrossed className="w-3 h-3 mr-1 text-purple-600" />
                                        )}
                                        {row.hak_gala_dinner ? "Gala: Ya" : "+Gala"}
                                      </button>
                                    )}

                                    {/* Action: WhatsApp Notif */}
                                    <button
                                      onClick={() => handleSendWhatsapp(row)}
                                      className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                                        isLunas
                                          ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                                          : isDibatalkan
                                          ? "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                                          : "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                                      }`}
                                      title={isLunas ? "Kirim E-Tiket via WhatsApp" : isDibatalkan ? "Kirim Pesan WhatsApp" : "Kirim Pengingat Transfer via WhatsApp"}
                                    >
                                      <MessageCircle className="w-3 h-3 mr-1" />
                                      {isLunas ? "E-Tiket WA" : isDibatalkan ? "Chat WA" : "Tagih WA"}
                                    </button>

                                    {/* Action: Quick Edit */}
                                    <button
                                      onClick={() => {
                                        setSelectedParticipant(row);
                                        handleStartEdit(row);
                                      }}
                                      className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                      title="Edit Data Peserta (Nama, No HP, dll)"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>

                                    {/* Action: Detail Modal */}
                                    <button
                                      onClick={() => setSelectedParticipant(row)}
                                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                      title="Lihat Data Lengkap Peserta"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Clean Pagination Footer */}
                  <div className="px-4 sm:px-6 py-3 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 rounded-b-2xl">
                    <div className="flex items-center gap-3">
                      <span>
                        Menampilkan <strong>{totalRows === 0 ? 0 : startIndex + 1}</strong>–<strong>{endIndex}</strong> dari <strong>{totalRows}</strong> pendaftar
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">| Per hal:</span>
                        <select
                          value={pageSize}
                          onChange={(e) => setPageSize(Number(e.target.value))}
                          className="bg-white border border-slate-200 text-slate-700 text-xs rounded-md px-1.5 py-0.5 cursor-pointer outline-none"
                        >
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                          <option value={-1}>Semua</option>
                        </select>
                      </div>
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={safeCurrentPage === 1}
                          className="px-2 py-1 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                        >
                          Prev
                        </button>
                        <span className="px-2 font-semibold text-slate-700">
                          {safeCurrentPage} / {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={safeCurrentPage === totalPages}
                          className="px-2 py-1 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 2: MANAJEMEN VOUCHER FKTP */}
            {/* ============================================================== */}
            {activeTab === 'voucher' && (
              <div className="space-y-4">
                {/* Header Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Voucher Siap Pakai</p>
                      <h3 className="text-2xl font-bold text-amber-600">{availableFktpVouchers.length}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Dapat dibagikan ke dokter FKTP</p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                      <Ticket className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sudah Digunakan</p>
                      <h3 className="text-2xl font-bold text-slate-800">{usedFktpVouchers.length}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Telah diklaim oleh pendaftar</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl text-slate-600">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Voucher</p>
                      <h3 className="text-2xl font-bold text-slate-800">{vouchers.length}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Tercatat di sistem Supabase</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                      <CreditCard className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                {/* Generator & Quick Action Bar */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">Operasi Pembuatan Voucher</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Generate batch instan atau input kode kustom sesuai kebutuhan panitia.</p>
                    </div>

                    {/* Batch Generate Buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleBatchGenerate(5)}
                        disabled={isGeneratingBatch}
                        className="inline-flex items-center px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isGeneratingBatch ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
                        + Buat 5 Voucher
                      </button>

                      <button
                        onClick={() => handleBatchGenerate(10)}
                        disabled={isGeneratingBatch}
                        className="inline-flex items-center px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        + Buat 10 Voucher
                      </button>

                      <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="inline-flex items-center px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                      >
                        {showAddForm ? 'Tutup Input Manual' : '+ Input Kode Khusus'}
                      </button>
                    </div>
                  </div>

                  {/* Manual Add Input Box */}
                  {showAddForm && (
                    <form onSubmit={handleAddVoucher} className="pt-3 border-t border-slate-100 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Contoh: FKTP-BOGOR01"
                        value={newVoucherInput}
                        onChange={(e) => setNewVoucherInput(e.target.value.toUpperCase())}
                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none max-w-xs"
                      />
                      <button
                        type="submit"
                        disabled={isAddingVoucher}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isAddingVoucher ? 'Menyimpan...' : 'Simpan Voucher'}
                      </button>
                    </form>
                  )}

                  {voucherActionMsg && (
                    <div className={`p-2.5 rounded-xl text-xs font-medium ${voucherActionMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      {voucherActionMsg.text}
                    </div>
                  )}
                </div>

                {/* Voucher Filter & Cards Grid */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
                  <div 
                    style={{ position: 'sticky', top: '4rem' }}
                    className="sticky top-16 z-20 p-4 border-b border-slate-200 bg-white rounded-t-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-xs font-semibold">
                      <button
                        onClick={() => setVoucherTab("fktp_tersedia")}
                        className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                          voucherTab === "fktp_tersedia" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Siap Pakai ({availableFktpVouchers.length})
                      </button>
                      <button
                        onClick={() => setVoucherTab("terpakai")}
                        className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                          voucherTab === "terpakai" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Sudah Digunakan ({usedFktpVouchers.length})
                      </button>
                      <button
                        onClick={() => setVoucherTab("semua")}
                        className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                          voucherTab === "semua" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Semua ({vouchers.length})
                      </button>
                    </div>

                    <div className="relative w-full sm:w-64">
                      <input
                        type="text"
                        placeholder="Cari kode atau nama pengguna..."
                        value={voucherSearch}
                        onChange={(e) => setVoucherSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 w-full rounded-xl border border-slate-200 text-xs bg-white focus:border-amber-500 outline-none"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    </div>
                  </div>

                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredVouchers.length === 0 ? (
                      <div className="col-span-full py-12 text-center text-slate-400 text-sm">
                        Tidak ada voucher pada kategori ini.
                      </div>
                    ) : (
                      filteredVouchers.map((v, i) => {
                        const isUsed = isVoucherActuallyUsed(v);
                        const registrant = getUsedVoucherRegistrant(v);

                        return (
                          <div
                            key={v.id || v.code || i}
                            className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                              isUsed
                                ? 'bg-slate-50 border-slate-200'
                                : 'bg-white border-amber-200 hover:border-amber-400 shadow-xs'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-mono font-bold text-sm text-slate-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg select-all">
                                  {v.code}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isUsed ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {isUsed ? 'Digunakan' : 'Siap Pakai'}
                                </span>
                              </div>

                              {isUsed ? (
                                <div className="mt-2 text-xs text-slate-600 space-y-0.5 bg-white p-2 rounded-lg border border-slate-200">
                                  <div className="font-semibold text-slate-800 truncate">
                                    👤 {registrant ? registrant["Nama Lengkap"] : (v.used_by || "Peserta")}
                                  </div>
                                  {registrant?.Institusi && (
                                    <div className="text-[11px] text-slate-500 truncate">🏛️ {registrant.Institusi}</div>
                                  )}
                                  {registrant?.["No. WhatsApp"] && (
                                    <div className="text-[11px] text-[#128C7E] font-medium">📱 {registrant["No. WhatsApp"]}</div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-[11px] text-slate-500 mt-2">
                                  Target: Dokter Umum (FKTP). Potongan subsidi pendaftaran langsung.
                                </p>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1">
                              {!isUsed ? (
                                <>
                                  <button
                                    onClick={() => handleCopyCode(v.code)}
                                    className="flex-1 py-1.5 px-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    {copiedKey === v.code ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    <span>Salin</span>
                                  </button>
                                  <button
                                    onClick={() => handleShareWa(v.code)}
                                    className="p-1.5 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-lg text-xs transition-colors cursor-pointer"
                                    title="Bagikan via WhatsApp"
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteVoucher(v.code)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    title="Hapus Voucher"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                registrant?.["No. WhatsApp"] && (
                                  <a
                                    href={`https://wa.me/${registrant["No. WhatsApp"].replace(/\D/g, '').replace(/^0/, '62')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium text-center flex items-center justify-center gap-1"
                                  >
                                    <MessageCircle className="w-3 h-3 text-[#128C7E]" />
                                    <span>Hubungi Peserta</span>
                                  </a>
                                )
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 3: STATISTIK & ANALISIS */}
            {/* ============================================================== */}
            {activeTab === 'statistik' && (
              <div className="space-y-4">
                {/* Control Panel: Diabetes Health Forum Quota Switch */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                      <Activity className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm sm:text-base">Pengaturan Kuota Diabetes Health Forum</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Saat ini terdaftar: <strong className="text-purple-700">{healthTalkCount} orang</strong>. Buka atau tutup akses pendaftaran talkshow ini di form registrasi umum.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className={`text-xs font-bold ${isHealthTalkEnabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {isHealthTalkEnabled ? 'Status: DIBUKA' : 'Status: DITUTUP'}
                    </span>
                    <button
                      onClick={handleToggleHealthTalk}
                      disabled={isTogglingHT}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                        isHealthTalkEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                      } ${isTogglingHT ? 'opacity-50 cursor-wait' : ''}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-xs ${
                          isHealthTalkEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Category Pie Chart */}
                  <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-800 mb-4">Distribusi Kategori Peserta</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {pieData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            formatter={(value: any) => [`${value} peserta`, 'Jumlah']}
                            contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                          />
                          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Payment Status Bar Chart */}
                  <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-slate-800">Status Pembayaran Peserta</h3>
                      <a
                        href="https://chat.whatsapp.com/GezzqQzSYPuHTiCBRGbela"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-2.5 py-1 bg-[#25D366] hover:bg-[#128C7E] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                      >
                        <MessageCircle className="h-3.5 w-3.5 mr-1" />
                        Grup WA Peserta
                      </a>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={statusBarData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                          <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                          <RechartsTooltip
                            cursor={{ fill: '#f1f5f9' }}
                            contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                          />
                          <Bar dataKey="jumlah" radius={[6, 6, 0, 0]} maxBarSize={45}>
                            {statusBarData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ============================================================== */}
      {/* PARTICIPANT DETAIL MODAL (MODAL RINCIAN PESERTA) */}
      {/* ============================================================== */}
      {selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className={`h-9 w-9 ${isEditingParticipant ? 'bg-amber-600' : 'bg-blue-600'} rounded-xl flex items-center justify-center text-white shadow-xs transition-colors`}>
                  {isEditingParticipant ? <Pencil className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base leading-tight">
                    {isEditingParticipant ? "Edit Data Peserta" : "Detail Lengkap Peserta"}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs text-blue-700 font-bold">{selectedParticipant["No. Registrasi"]}</span>
                    {isEditingParticipant && (
                      <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">
                        Mode Edit
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedParticipant(null);
                  setIsEditingParticipant(false);
                  setEditError(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
              {isEditingParticipant ? (
                /* FORM EDIT PESERTA */
                <div className="space-y-4">
                  {/* Alert Error jika ada */}
                  {editError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                      <span>{editError}</span>
                    </div>
                  )}

                  {/* Info Box */}
                  <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-800 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-semibold">Informasi Pengubahan Data</p>
                      <p className="text-blue-700 text-[11px] mt-0.5">
                        Nomor Registrasi, Kategori, dan Status Pembayaran terkunci demi integritas tiket dan transaksi.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Nama Lengkap */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nama Lengkap Peserta <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editFormData.namaLengkap}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, namaLengkap: e.target.value }))}
                        placeholder="Contoh: dr. John Doe, Sp.PD"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>

                    {/* Nomor WhatsApp */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nomor WhatsApp <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={editFormData.whatsapp}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, whatsapp: e.target.value.replace(/\D/g, '') }))}
                        placeholder="Contoh: 081234567890"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
                      />
                      <span className="text-[10px] text-slate-500 block mt-0.5">Hanya angka (format 08... atau 62...)</span>
                    </div>

                    {/* Jenis Kelamin */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Jenis Kelamin
                      </label>
                      <select
                        value={editFormData.jenisKelamin}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, jenisKelamin: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white cursor-pointer"
                      >
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>

                    {/* Tanggal Lahir */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Tanggal Lahir
                      </label>
                      <input
                        type="date"
                        value={editFormData.tanggalLahir}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, tanggalLahir: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Alamat Email {selectedParticipant && (() => {
                          const k = (selectedParticipant["Kategori Peserta"] || "").toLowerCase();
                          return !k.includes("persadia") && !k.includes("umum");
                        })() ? <span className="text-red-500">*</span> : <span className="text-slate-400 font-normal">(Opsional)</span>}
                      </label>
                      <input
                        type="email"
                        value={editFormData.email}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Contoh: nama@domain.com"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>

                    {/* NIK (SKP Kemenkes) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        NIK (16 Digit - SKP Kemenkes)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={16}
                          value={editFormData.nik}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, nik: e.target.value.replace(/\D/g, '') }))}
                          placeholder="16 digit NIK KTP"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
                        />
                        <span className="absolute right-3 top-2 text-[10px] text-slate-400 font-mono">
                          {editFormData.nik.length}/16
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Syarat pelaporan SKP Kemenkes RI</span>
                    </div>

                    {/* Institusi / RS */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Institusi / Rumah Sakit
                      </label>
                      <input
                        type="text"
                        value={editFormData.institusi}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, institusi: e.target.value }))}
                        placeholder="Contoh: RSUD Cibinong / Puskesmas"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>

                    {/* Cabang PERSADIA */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Cabang PERSADIA
                      </label>
                      <input
                        type="text"
                        value={editFormData.cabangPersadia}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, cabangPersadia: e.target.value }))}
                        placeholder="Contoh: PERSADIA Cabang Bogor"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Status Header Chip */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-bold block">Status Pembayaran</span>
                  <span className={`inline-flex items-center font-bold text-sm ${
                    selectedParticipant["Status Pembayaran"] === 'Lunas' ? 'text-emerald-600' : selectedParticipant["Status Pembayaran"] === 'Dibatalkan' ? 'text-red-600' : 'text-amber-600'
                  }`}>
                    {selectedParticipant["Status Pembayaran"]}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 uppercase font-bold block">Total Tagihan</span>
                  <span className="text-base font-bold text-slate-800">
                    Rp {typeof selectedParticipant["Total Bayar"] === 'number'
                      ? selectedParticipant["Total Bayar"].toLocaleString('id-ID')
                      : parseInt(selectedParticipant["Total Bayar"] as string || '0', 10).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Data Diri */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Identitas & Kontak</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 text-xs block">Nama Lengkap</span>
                    <strong className="text-slate-800">{selectedParticipant["Nama Lengkap"]}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block">Institusi / Rumah Sakit</span>
                    <strong className="text-slate-800">{selectedParticipant.Institusi || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block">Nomor WhatsApp</span>
                    <strong className="text-slate-800">{selectedParticipant["No. WhatsApp"]}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block">Email</span>
                    <strong className="text-slate-800">{selectedParticipant.Email}</strong>
                  </div>
                  {selectedParticipant.nik && selectedParticipant.nik !== '-' && (
                    <div>
                      <span className="text-slate-400 text-xs block">NIK (SKP Kemenkes)</span>
                      <strong className="text-slate-800 font-mono tracking-wider">{selectedParticipant.nik}</strong>
                    </div>
                  )}
                  {selectedParticipant.nim && selectedParticipant.nim !== '-' && (
                    <div>
                      <span className="text-slate-400 text-xs block">NIM Mahasiswa</span>
                      <strong className="text-slate-800 font-mono">{selectedParticipant.nim}</strong>
                    </div>
                  )}
                  {selectedParticipant.jenis_kelamin && selectedParticipant.jenis_kelamin !== '-' && (
                    <div>
                      <span className="text-slate-400 text-xs block">Jenis Kelamin</span>
                      <strong className="text-slate-800">{selectedParticipant.jenis_kelamin}</strong>
                    </div>
                  )}
                  {selectedParticipant.tanggal_lahir && selectedParticipant.tanggal_lahir !== '-' && (
                    <div>
                      <span className="text-slate-400 text-xs block">Tanggal Lahir</span>
                      <strong className="text-slate-800">{selectedParticipant.tanggal_lahir}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Paket & Akses Kegiatan */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Paket & Akses Acara</h4>
                <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 space-y-1.5">
                  <div>
                    <span className="text-slate-400 text-xs block">Kategori Peserta:</span>
                    <strong className="text-slate-800">{selectedParticipant["Kategori Peserta"]}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block">Akses Kegiatan / Sesi Terdaftar:</span>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-slate-700 font-medium">{selectedParticipant["Akses Kegiatan"]}</span>
                      {selectedParticipant["Akses Kegiatan"] && selectedParticipant["Akses Kegiatan"].includes("Online") && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-bold">
                          💻 Daring / Online Zoom
                        </span>
                      )}
                      {selectedParticipant["Akses Kegiatan"] && selectedParticipant["Akses Kegiatan"].includes("Onsite") && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-xs font-medium">
                          🏛️ Hadir Onsite (Novotel)
                        </span>
                      )}
                      {(selectedParticipant.ikut_health_talk === true || (selectedParticipant["Akses Kegiatan"] && (selectedParticipant["Akses Kegiatan"].includes("Health Forum") || selectedParticipant["Akses Kegiatan"].includes("Health Talk")))) && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 border border-purple-200 rounded text-xs font-bold">
                          🩺 Diabetes Health Forum (Novotel)
                        </span>
                      )}
                    </div>
                  </div>
                  {(selectedParticipant.KodeVoucher || selectedParticipant.kode_voucher) && (
                    <div className="pt-1">
                      <span className="text-slate-400 text-xs block">Voucher Digunakan:</span>
                      <span className="font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {selectedParticipant.KodeVoucher || selectedParticipant.kode_voucher}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Alamat & Cabang PERSADIA (Jika ada) */}
              {(selectedParticipant.CabangPersadia || selectedParticipant.AlamatLengkap || selectedParticipant.BersediaAnggota) && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Keanggotaan PERSADIA</h4>
                  <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 space-y-1.5">
                    {selectedParticipant.CabangPersadia && selectedParticipant.CabangPersadia !== '-' && (
                      <div>
                        <span className="text-slate-400 text-xs block">Cabang PERSADIA:</span>
                        <strong className="text-slate-800">{selectedParticipant.CabangPersadia}</strong>
                        {selectedParticipant.NamaKetuaCabang && selectedParticipant.NamaKetuaCabang !== '-' && (
                          <span className="text-slate-500 block text-xs">Ketua Cabang: {selectedParticipant.NamaKetuaCabang}</span>
                        )}
                      </div>
                    )}
                    {selectedParticipant.AlamatLengkap && selectedParticipant.AlamatLengkap !== '-' && (
                      <div>
                        <span className="text-slate-400 text-xs block">Alamat Domisili:</span>
                        <span className="text-slate-700">{selectedParticipant.AlamatLengkap}, {selectedParticipant.Kelurahan}, {selectedParticipant.Kecamatan}, {selectedParticipant.KotaKabupaten}, {selectedParticipant.Provinsi}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Hak Akses Gala Dinner Section */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Hak Akses Gala Dinner (Novotel Ballroom)</h4>
                <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isEligibleForGalaDinner(selectedParticipant)
                    ? selectedParticipant.hak_gala_dinner
                      ? "bg-purple-50/70 border-purple-200"
                      : "bg-amber-50/70 border-amber-200"
                    : "bg-slate-50 border-slate-200 opacity-80"
                }`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <UtensilsCrossed className={`w-4 h-4 ${
                        isEligibleForGalaDinner(selectedParticipant)
                          ? selectedParticipant.hak_gala_dinner ? "text-purple-700" : "text-amber-700"
                          : "text-slate-400"
                      }`} />
                      <span className="font-bold text-xs sm:text-sm text-slate-800">
                        {!isEligibleForGalaDinner(selectedParticipant)
                          ? "Tidak Berhak Mendapatkan Akses Gala Dinner"
                          : selectedParticipant.hak_gala_dinner
                          ? "Undangan Gala Dinner: DIBERIKAN (Boleh Masuk)"
                          : "Undangan Gala Dinner: BELUM DIBERIKAN (Ditolak Masuk)"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      {!isEligibleForGalaDinner(selectedParticipant)
                        ? "Akses Gala Dinner dibatasi ketat khusus untuk peserta kategori Simposium & Workshop Onsite."
                        : selectedParticipant.hak_gala_dinner
                        ? `Peserta diizinkan masuk ke Ballroom Novotel Bogor. ${selectedParticipant.kehadiran_gala_dinner === 'Ya' ? `Sudah presensi masuk (${selectedParticipant.waktu_kehadiran_gala_dinner ? new Date(selectedParticipant.waktu_kehadiran_gala_dinner).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Ya'}).` : 'Belum tiba / belum presensi di pos pintu masuk.'}`
                        : "Peserta memenuhi kriteria (Simposium & Workshop), namun hak akses Gala Dinner belum diaktifkan."}
                    </p>
                  </div>

                  {isEligibleForGalaDinner(selectedParticipant) && (
                    <div className="shrink-0">
                      <button
                        onClick={() => handleToggleGalaDinner(selectedParticipant, !selectedParticipant.hak_gala_dinner)}
                        disabled={galaLoadingId === selectedParticipant["No. Registrasi"]}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 ${
                          selectedParticipant.hak_gala_dinner
                            ? "bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300"
                            : "bg-purple-700 hover:bg-purple-800 text-white shadow-xs"
                        }`}
                      >
                        {galaLoadingId === selectedParticipant["No. Registrasi"] ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <UtensilsCrossed className="w-3.5 h-3.5" />
                        )}
                        <span>{selectedParticipant.hak_gala_dinner ? "Cabut Hak Akses" : "Beri Hak Akses Gala Dinner"}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Data Onsite & Kesehatan (Jika ada) */}
              {(selectedParticipant.registrasi_onsite || selectedParticipant.kehadiran_workshop || selectedParticipant.kehadiran_gala_dinner || selectedParticipant.cek_gula_darah || selectedParticipant.gula_darah || selectedParticipant.tensi) && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Presensi & Pemeriksaan Onsite</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 text-xs block">Check-in Onsite</span>
                      <strong className="text-slate-800">{selectedParticipant.registrasi_onsite || 'Belum'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs block">Presensi Workshop</span>
                      <strong className="text-slate-800">{selectedParticipant.kehadiran_workshop || 'Belum'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs block">Gala Dinner</span>
                      <strong className="text-slate-800">{selectedParticipant.kehadiran_gala_dinner || 'Belum'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs block">Gula Darah</span>
                      <strong className="text-slate-800">{selectedParticipant.gula_darah || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs block">Tensi</span>
                      <strong className="text-slate-800">{selectedParticipant.tensi || '-'}</strong>
                    </div>
                  </div>
                </div>
              )}
                </>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2 flex-wrap">
              {isEditingParticipant ? (
                <>
                  <button
                    onClick={handleCancelEdit}
                    disabled={isSavingEdit}
                    className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Batal
                  </button>

                  <button
                    onClick={handleSaveEdit}
                    disabled={isSavingEdit}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSavingEdit ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Simpan Perubahan</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleStartEdit(selectedParticipant)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
                      title="Perbaiki identitas, nomor WhatsApp, atau tanggal lahir peserta"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit Data
                    </button>

                    {selectedParticipant["Status Pembayaran"] === 'Menunggu Verifikasi' && (
                      <>
                        <button
                          onClick={() => {
                            const p = selectedParticipant;
                            setSelectedParticipant(null);
                            setConfirmDialog({
                              isOpen: true,
                              id: p["No. Registrasi"],
                              status: "Lunas",
                              currentStatus: p["Status Pembayaran"],
                              nama: p["Nama Lengkap"],
                              totalBayar: p["Total Bayar"]
                            });
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                        >
                          Set Lunas
                        </button>
                        <button
                          onClick={() => {
                            const p = selectedParticipant;
                            setSelectedParticipant(null);
                            setConfirmDialog({
                              isOpen: true,
                              id: p["No. Registrasi"],
                              status: "Dibatalkan",
                              currentStatus: p["Status Pembayaran"],
                              nama: p["Nama Lengkap"],
                              totalBayar: p["Total Bayar"]
                            });
                          }}
                          className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-300 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                        >
                          Batalkan
                        </button>
                      </>
                    )}

                    {selectedParticipant["Status Pembayaran"] === 'Lunas' && (
                      <button
                        onClick={() => {
                          const p = selectedParticipant;
                          setSelectedParticipant(null);
                          setConfirmDialog({
                            isOpen: true,
                            id: p["No. Registrasi"],
                            status: "Dibatalkan",
                            currentStatus: p["Status Pembayaran"],
                            nama: p["Nama Lengkap"],
                            totalBayar: p["Total Bayar"]
                          });
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-300 rounded-lg font-medium text-xs transition-colors cursor-pointer"
                        title="Batalkan Pendaftaran (misal: pendaftar ganda / duplikat)"
                      >
                        Batalkan Pendaftaran
                      </button>
                    )}

                    {selectedParticipant["Status Pembayaran"] === 'Dibatalkan' && (
                      <button
                        onClick={() => {
                          const p = selectedParticipant;
                          setSelectedParticipant(null);
                          setConfirmDialog({
                            isOpen: true,
                            id: p["No. Registrasi"],
                            status: "Lunas",
                            currentStatus: p["Status Pembayaran"],
                            nama: p["Nama Lengkap"],
                            totalBayar: p["Total Bayar"]
                          });
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded-lg font-medium text-xs transition-colors cursor-pointer flex items-center gap-1"
                        title="Pulihkan status ke Lunas"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Pulihkan ke Lunas
                      </button>
                    )}

                    <button
                      onClick={() => handleSendWhatsapp(selectedParticipant)}
                      className="px-3 py-1.5 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-lg font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Kirim WhatsApp
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedParticipant(null);
                      setIsEditingParticipant(false);
                      setEditError(null);
                    }}
                    className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Participant Modal (Hak Akses Admin) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 via-blue-50/40 to-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-xs">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base leading-tight">
                    Tambah Peserta Baru
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[10px] tracking-wide">
                      Hak Akses Admin Panitia
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Bypass batasan kuota &amp; kategori ditutup
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!isSavingNewParticipant) {
                    setIsAddModalOpen(false);
                    setAddError(null);
                  }
                }}
                disabled={isSavingNewParticipant}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitNewParticipant} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm flex-1">
              {/* Alert Error jika ada */}
              {addError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{addError}</span>
                </div>
              )}

              {/* Info Hak Akses Admin */}
              <div className="p-3 bg-amber-50/80 border border-amber-200/90 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-bold">Akses Penuh Admin Aktif</p>
                  <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                    Anda dapat menambahkan peserta untuk <strong>semua kategori</strong>, termasuk kategori <strong>Pesta Rakyat (Anggota PERSADIA &amp; Umum)</strong> yang saat ini ditutup untuk publik. Peserta yang ditambahkan akan langsung menerima nomor registrasi resmi.
                  </p>
                </div>
              </div>

              {/* 1. Pilih Kategori Peserta */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Kategori Peserta <span className="text-red-500">*</span>
                </label>
                <select
                  value={addFormData.kategoriId}
                  onChange={(e) => {
                    const newCatId = e.target.value;
                    const newPrice = computeCategoryPrice(
                      newCatId,
                      addFormData.ikutDhf,
                      addFormData.tipePestaRakyatUmum,
                      addFormData.ikutPestaRakyatUmum,
                      addFormData.modeFktp
                    );
                    setAddFormData(prev => ({
                      ...prev,
                      kategoriId: newCatId,
                      totalTagihan: newPrice,
                      manualTotalOverride: false
                    }));
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <optgroup label="🎪 PESTA RAKYAT (Minggu, 8 Nov 2026 - Stadion Pakansari)">
                    <option value="persadia">🏅 Anggota PERSADIA (Pesta Rakyat) — Rp 0</option>
                    <option value="umum">👥 Masyarakat Umum (Pesta Rakyat) — Rp 0 / Rp 100.000</option>
                  </optgroup>
                  <optgroup label="🩺 DIABETES HEALTH FORUM (Sabtu, 7 Nov 2026 - Ballroom Novotel)">
                    <option value="diabetes_health_forum">🏛️ Diabetes Health Forum — Rp 200.000</option>
                  </optgroup>
                  <optgroup label="📚 SIMPOSIUM &amp; WORKSHOP ILMIAH (7–8 Nov 2026 - Novotel Bogor)">
                    <option value="dokter_fktp">🩺 Dokter Layanan Primer (FKTP) — Onsite Rp 600rb / Online Rp 300rb</option>
                    <option value="dokter_umum">🩺 Dokter Umum — Rp 1.500.000</option>
                    <option value="dokter_spesialis">🩺 Dokter Spesialis (Sp.PD, Sp.PD-KEMD) — Rp 2.500.000</option>
                    <option value="residen">🩺 Residen / PPDS — Rp 1.000.000</option>
                    <option value="perawat">🩺 Perawat, Ahli Gizi &amp; Edukator Diabetes — Rp 400.000</option>
                    <option value="mahasiswa">🎓 Mahasiswa Kedokteran S1 — Rp 400.000</option>
                  </optgroup>
                </select>
              </div>

              {/* Data Diri Peserta */}
              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Identitas Peserta
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Nama Lengkap */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Lengkap Peserta <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={addFormData.namaLengkap}
                      onChange={(e) => setAddFormData(prev => ({ ...prev, namaLengkap: e.target.value }))}
                      placeholder="Nama lengkap beserta gelar (jika ada)"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    />
                  </div>

                  {/* NIK jika kategori ilmiah non-mahasiswa */}
                  {["dokter_spesialis", "dokter_umum", "dokter_fktp", "residen", "perawat"].includes(addFormData.kategoriId) && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        NIK (Nomor Induk Kependudukan - 16 Digit) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={16}
                          required
                          value={addFormData.nik}
                          onChange={(e) => setAddFormData(prev => ({ ...prev, nik: e.target.value.replace(/\D/g, '') }))}
                          placeholder="16 digit NIK KTP (SKP Kemenkes)"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono bg-white"
                        />
                        <span className="absolute right-3 top-2 text-[10px] text-slate-400 font-mono">
                          {addFormData.nik.length}/16
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Syarat wajib pelaporan SKP Kemenkes RI (Plataran Sehat)</span>
                    </div>
                  )}

                  {/* Nomor WhatsApp */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nomor WhatsApp <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={addFormData.whatsapp}
                      onChange={(e) => setAddFormData(prev => ({ ...prev, whatsapp: e.target.value.replace(/\D/g, '') }))}
                      placeholder="08123456789"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono bg-white"
                    />
                    <span className="text-[10px] text-slate-500 block mt-0.5">Format angka berawalan 08...</span>
                  </div>

                  {/* Jenis Kelamin */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Jenis Kelamin
                    </label>
                    <select
                      value={addFormData.jenisKelamin}
                      onChange={(e) => setAddFormData(prev => ({ ...prev, jenisKelamin: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white cursor-pointer"
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>

                  {/* Tanggal Lahir */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tanggal Lahir
                    </label>
                    <input
                      type="date"
                      value={addFormData.tanggalLahir}
                      onChange={(e) => setAddFormData(prev => ({ ...prev, tanggalLahir: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Alamat Email {["dokter_spesialis", "dokter_umum", "dokter_fktp", "residen", "perawat", "mahasiswa", "diabetes_health_forum"].includes(addFormData.kategoriId) ? <span className="text-red-500">*</span> : <span className="text-slate-400 font-normal">(Opsional)</span>}
                    </label>
                    <input
                      type="email"
                      required={["dokter_spesialis", "dokter_umum", "dokter_fktp", "residen", "perawat", "mahasiswa", "diabetes_health_forum"].includes(addFormData.kategoriId)}
                      value={addFormData.email}
                      onChange={(e) => setAddFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@domain.com"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Field Spesifik Kategori */}
              {addFormData.kategoriId === "persadia" && (
                <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200/80 space-y-3">
                  <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
                    Data Khusus Anggota PERSADIA
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Cabang PERSADIA
                      </label>
                      <input
                        type="text"
                        value={addFormData.cabangPersadia}
                        onChange={(e) => setAddFormData(prev => ({ ...prev, cabangPersadia: e.target.value }))}
                        placeholder="Contoh: PERSADIA Cabang Ciamis / Bogor"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nama Ketua Cabang (Opsional)
                      </label>
                      <input
                        type="text"
                        value={addFormData.namaKetuaCabang}
                        onChange={(e) => setAddFormData(prev => ({ ...prev, namaKetuaCabang: e.target.value }))}
                        placeholder="Nama Ketua Cabang"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                      />
                    </div>
                  </div>

                  {/* Add-on DHF */}
                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white border border-emerald-200/90 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addFormData.ikutDhf}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const newPrice = computeCategoryPrice(
                          addFormData.kategoriId,
                          checked,
                          addFormData.tipePestaRakyatUmum,
                          addFormData.ikutPestaRakyatUmum,
                          addFormData.modeFktp
                        );
                        setAddFormData(prev => ({
                          ...prev,
                          ikutDhf: checked,
                          totalTagihan: prev.manualTotalOverride ? prev.totalTagihan : newPrice
                        }));
                      }}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Ikut Sesi Diabetes Health Forum (Novotel Bogor, 7 Nov 2026) (+Rp 200.000)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Termasuk Talkshow bersama dr. Boyke Dian Nugraha, Sp.OG, jamuan makan Novotel, dan goodie bag.
                      </span>
                    </div>
                  </label>
                </div>
              )}

              {addFormData.kategoriId === "umum" && (
                <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/80 space-y-3">
                  <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                    Pilihan Paket Pesta Rakyat (Masyarakat Umum)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2 ${
                      addFormData.tipePestaRakyatUmum === 'gratis' ? 'bg-amber-100/70 border-amber-400 font-bold' : 'bg-white border-slate-200'
                    }`}>
                      <input
                        type="radio"
                        name="tipePestaRakyatUmum"
                        checked={addFormData.tipePestaRakyatUmum === 'gratis'}
                        onChange={() => {
                          const newPrice = computeCategoryPrice("umum", addFormData.ikutDhf, "gratis", true, addFormData.modeFktp);
                          setAddFormData(prev => ({
                            ...prev,
                            tipePestaRakyatUmum: "gratis",
                            totalTagihan: prev.manualTotalOverride ? prev.totalTagihan : newPrice
                          }));
                        }}
                        className="text-amber-600"
                      />
                      <span className="text-xs">Pesta Rakyat Gratis (Rp 0)</span>
                    </label>

                    <label className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2 ${
                      addFormData.tipePestaRakyatUmum === 'berbayar' ? 'bg-amber-100/70 border-amber-400 font-bold' : 'bg-white border-slate-200'
                    }`}>
                      <input
                        type="radio"
                        name="tipePestaRakyatUmum"
                        checked={addFormData.tipePestaRakyatUmum === 'berbayar'}
                        onChange={() => {
                          const newPrice = computeCategoryPrice("umum", addFormData.ikutDhf, "berbayar", true, addFormData.modeFktp);
                          setAddFormData(prev => ({
                            ...prev,
                            tipePestaRakyatUmum: "berbayar",
                            totalTagihan: prev.manualTotalOverride ? prev.totalTagihan : newPrice
                          }));
                        }}
                        className="text-amber-600"
                      />
                      <span className="text-xs">Paket Kaos Pesta Rakyat (Rp 100.000)</span>
                    </label>
                  </div>

                  {/* Add-on DHF */}
                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white border border-amber-200/90 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addFormData.ikutDhf}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const newPrice = computeCategoryPrice("umum", checked, addFormData.tipePestaRakyatUmum, true, addFormData.modeFktp);
                        setAddFormData(prev => ({
                          ...prev,
                          ikutDhf: checked,
                          totalTagihan: prev.manualTotalOverride ? prev.totalTagihan : newPrice
                        }));
                      }}
                      className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Ikut Sesi Diabetes Health Forum (Novotel Bogor, 7 Nov 2026) (+Rp 200.000)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Termasuk Talkshow bersama dr. Boyke Dian Nugraha, Sp.OG di Ballroom Novotel.
                      </span>
                    </div>
                  </label>
                </div>
              )}

              {addFormData.kategoriId === "dokter_fktp" && (
                <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200/80 space-y-3">
                  <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block">
                    Pilihan Mode Kehadiran Dokter Layanan Primer (FKTP)
                  </span>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Institusi / Puskesmas / Klinik <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={addFormData.institusi}
                      onChange={(e) => setAddFormData(prev => ({ ...prev, institusi: e.target.value }))}
                      placeholder="Contoh: Puskesmas Cibinong / Klinik Pratama Sehat"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <label className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2 ${
                      addFormData.modeFktp === 'onsite' ? 'bg-blue-100/70 border-blue-400 font-bold' : 'bg-white border-slate-200'
                    }`}>
                      <input
                        type="radio"
                        name="modeFktp"
                        checked={addFormData.modeFktp === 'onsite'}
                        onChange={() => {
                          const newPrice = computeCategoryPrice("dokter_fktp", false, "gratis", true, "onsite");
                          setAddFormData(prev => ({
                            ...prev,
                            modeFktp: "onsite",
                            totalTagihan: prev.manualTotalOverride ? prev.totalTagihan : newPrice
                          }));
                        }}
                        className="text-blue-600"
                      />
                      <span className="text-xs">🏛️ Onsite Novotel (Rp 600.000)</span>
                    </label>

                    <label className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2 ${
                      addFormData.modeFktp === 'online' ? 'bg-blue-100/70 border-blue-400 font-bold' : 'bg-white border-slate-200'
                    }`}>
                      <input
                        type="radio"
                        name="modeFktp"
                        checked={addFormData.modeFktp === 'online'}
                        onChange={() => {
                          const newPrice = computeCategoryPrice("dokter_fktp", false, "gratis", true, "online");
                          setAddFormData(prev => ({
                            ...prev,
                            modeFktp: "online",
                            totalTagihan: prev.manualTotalOverride ? prev.totalTagihan : newPrice
                          }));
                        }}
                        className="text-blue-600"
                      />
                      <span className="text-xs">💻 Online Live Zoom (Rp 300.000)</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Field Institusi untuk kategori Ilmiah lainnya & DHF */}
              {(addFormData.kategoriId === "dokter_umum" ||
                addFormData.kategoriId === "dokter_spesialis" ||
                addFormData.kategoriId === "residen" ||
                addFormData.kategoriId === "perawat" ||
                addFormData.kategoriId === "mahasiswa" ||
                addFormData.kategoriId === "diabetes_health_forum") && (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Institusi / Rumah Sakit / Instansi {addFormData.kategoriId !== "diabetes_health_forum" && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      required={addFormData.kategoriId !== "diabetes_health_forum"}
                      value={addFormData.institusi}
                      onChange={(e) => setAddFormData(prev => ({ ...prev, institusi: e.target.value }))}
                      placeholder="Contoh: RSUP Dr. Kariadi / FKUI / Sobat Diabet"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    />
                  </div>

                  {addFormData.kategoriId === "mahasiswa" && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        NIM (Nomor Induk Mahasiswa) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={addFormData.nim}
                        onChange={(e) => setAddFormData(prev => ({ ...prev, nim: e.target.value }))}
                        placeholder="Contoh: 010112345"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-mono"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Status Pembayaran & Tagihan */}
              <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-200/80 space-y-3">
                <span className="text-[11px] font-bold text-blue-950 uppercase tracking-wider block">
                  Status &amp; Pembayaran Transaksi
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Status Pembayaran <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={addFormData.statusPembayaran}
                      onChange={(e) => setAddFormData(prev => ({ ...prev, statusPembayaran: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer font-semibold"
                    >
                      <option value="Lunas">✅ Lunas (Langsung Aktifkan E-Ticket)</option>
                      <option value="Menunggu Verifikasi">⏳ Menunggu Verifikasi</option>
                      <option value="Dibatalkan">❌ Dibatalkan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Total Tagihan (Rp)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={addFormData.totalTagihan}
                        onChange={(e) => setAddFormData(prev => ({
                          ...prev,
                          totalTagihan: Number(e.target.value),
                          manualTotalOverride: true
                        }))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold text-slate-900"
                      />
                      {addFormData.manualTotalOverride && (
                        <button
                          type="button"
                          onClick={() => {
                            const stdPrice = computeCategoryPrice(
                              addFormData.kategoriId,
                              addFormData.ikutDhf,
                              addFormData.tipePestaRakyatUmum,
                              addFormData.ikutPestaRakyatUmum,
                              addFormData.modeFktp
                            );
                            setAddFormData(prev => ({
                              ...prev,
                              totalTagihan: stdPrice,
                              manualTotalOverride: false
                            }));
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-blue-600 hover:underline font-semibold cursor-pointer"
                        >
                          Reset Standar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSavingNewParticipant}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingNewParticipant}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSavingNewParticipant ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan Peserta...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Simpan &amp; Tambahkan Peserta</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gala Dinner Management Modal */}
      {isGalaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-200 border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Manajemen Hak Akses Gala Dinner</h3>
                  <p className="text-xs text-slate-500">Khusus Peserta Kategori Simposium + Workshop Onsite</p>
                </div>
              </div>
              <button
                onClick={() => setIsGalaModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stats Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-semibold text-slate-500 uppercase block">Simposium+Workshop</span>
                <span className="text-lg font-bold text-slate-800">{galaStats.eligibleTotal}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Total Terdaftar</span>
              </div>
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/80">
                <span className="text-[10px] font-semibold text-blue-700 uppercase block">Status Lunas</span>
                <span className="text-lg font-bold text-blue-700">{galaStats.eligibleLunas}</span>
                <span className="text-[10px] text-blue-500 block mt-0.5">Siap Diundang</span>
              </div>
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                <span className="text-[10px] font-semibold text-purple-700 uppercase block">Akses Diberikan</span>
                <span className="text-lg font-bold text-purple-800">{galaStats.grantedTotal}</span>
                <span className="text-[10px] text-purple-500 block mt-0.5">Undangan Aktif</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] font-semibold text-emerald-700 uppercase block">Hadir Ballroom</span>
                <span className="text-lg font-bold text-emerald-800">{galaStats.checkedInTotal}</span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">Presensi Masuk</span>
              </div>
            </div>

            {/* Information Notice */}
            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Ketentuan Akses Gala Dinner Novotel:</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Secara default semua akses masuk ditolak. Hanya peserta yang telah <strong>di-marking (hak_gala_dinner = true)</strong> yang akan diizinkan masuk oleh scanner di pos Ballroom. Sesuai ketentuan, penambahan hak akses ini <strong>HANYA berlaku bagi peserta Simposium + Workshop Onsite</strong>.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleBatchGrantGalaDinner}
                disabled={isBatchGalaLoading || galaStats.pendingGrant === 0}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBatchGalaLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses Pemberian Akses...</span>
                  </>
                ) : (
                  <>
                    <UtensilsCrossed className="w-4 h-4" />
                    <span>
                      Beri Akses ke Semua Peserta Simposium + Workshop Lunas ({galaStats.pendingGrant} Peserta)
                    </span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleBatchRevokeGalaDinner}
                  disabled={isBatchGalaLoading || galaStats.grantedTotal === 0}
                  className="text-xs text-red-600 hover:text-red-800 hover:underline cursor-pointer disabled:opacity-40 disabled:no-underline font-medium"
                >
                  Cabut Semua Akses Gala Dinner ({galaStats.grantedTotal})
                </button>

                <button
                  onClick={() => setIsGalaModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className="flex items-center gap-2.5 mb-3">
              {confirmDialog.status === "Dibatalkan" ? (
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <CheckCircle className="w-4 h-4" />
                </div>
              )}
              <h3 className="text-base font-bold text-slate-800">
                {confirmDialog.status === "Dibatalkan"
                  ? confirmDialog.currentStatus === "Lunas"
                    ? "Batalkan Pendaftar Lunas"
                    : "Konfirmasi Pembatalan"
                  : confirmDialog.currentStatus === "Dibatalkan"
                  ? "Pulihkan Status Pendaftar"
                  : "Verifikasi Pembayaran"}
              </h3>
            </div>

            {/* Target participant summary info */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 mb-3 text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">No. Registrasi:</span>
                <span className="font-mono font-bold text-slate-800">{confirmDialog.id}</span>
              </div>
              {confirmDialog.nama && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Nama:</span>
                  <span className="font-semibold text-slate-800 text-right truncate max-w-[180px]">{confirmDialog.nama}</span>
                </div>
              )}
              {confirmDialog.currentStatus && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Status Saat Ini:</span>
                  <span className={`font-semibold ${
                    confirmDialog.currentStatus === 'Lunas' ? 'text-emerald-600' :
                    confirmDialog.currentStatus === 'Dibatalkan' ? 'text-red-600' : 'text-amber-600'
                  }`}>
                    {confirmDialog.currentStatus}
                  </span>
                </div>
              )}
            </div>

            {/* Warning or explanation */}
            {confirmDialog.status === "Dibatalkan" && confirmDialog.currentStatus === "Lunas" ? (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs mb-5 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <span>⚠️ Pendaftar Berstatus Lunas</span>
                </p>
                <p className="text-amber-800 leading-relaxed">
                  Tindakan ini aman digunakan untuk <strong>pembatalan pendaftar ganda (duplikat)</strong>. Kuota Diabetes Health Forum (jika ada) akan otomatis dibebaskan kembali. Data tidak akan terhapus dari database.
                </p>
              </div>
            ) : confirmDialog.status === "Dibatalkan" ? (
              <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                Apakah Anda yakin ingin membatalkan pendaftaran ini? Status akan ditandai sebagai <strong>Dibatalkan</strong>.
              </p>
            ) : confirmDialog.currentStatus === "Dibatalkan" ? (
              <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                Apakah Anda yakin ingin memulihkan status pendaftar ini kembali menjadi <strong className="text-emerald-600">Lunas</strong>?
              </p>
            ) : (
              <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                Ubah status pembayaran menjadi <strong className="text-emerald-600">Lunas</strong> untuk membuka akses e-tiket peserta?
              </p>
            )}

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setConfirmDialog({ isOpen: false, id: "", status: "" })}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Kembali
              </button>
              <button
                onClick={executeUpdateStatus}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-xl transition-colors cursor-pointer ${
                  confirmDialog.status === "Lunas"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {confirmDialog.status === "Lunas"
                  ? confirmDialog.currentStatus === "Dibatalkan"
                    ? "Ya, Pulihkan ke Lunas"
                    : "Ya, Verifikasi Lunas"
                  : "Ya, Batalkan Pendaftaran"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs sm:text-sm font-medium px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200 border border-slate-800">
          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
