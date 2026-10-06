import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { EVENT_INFO } from '../../config';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Users, DollarSign, CheckCircle, Clock, Search, ChevronLeft, ChevronRight, ShieldAlert,
  Loader2, LogOut, CheckSquare, XCircle, MessageCircle, Activity, X,
  Ticket, Copy, Check, Plus, RefreshCw, Share2, Sparkles, Trash2, Filter,
  Download, Eye, ExternalLink, Calendar, MapPin, Building, CreditCard,
  UserCheck, RotateCcw, AlertTriangle
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
  tanggal_lahir?: string;
  jenis_kelamin?: string;
  registrasi_onsite?: string | null;
  waktu_registrasi_onsite?: string | null;
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
}

const COLORS = ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'];

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filters & Table Controls
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [kategoriFilter, setKategoriFilter] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // Participant Detail Modal
  const [selectedParticipant, setSelectedParticipant] = useState<Pendaftar | null>(null);

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
  }, [searchQuery, statusFilter, kategoriFilter, pageSize]);

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

        // Map to existing Pendaftar interface format
        const mappedData: Pendaftar[] = allData.map((row: any) => ({
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
          tanggal_lahir: row.tanggal_lahir || "-",
          jenis_kelamin: row.jenis_kelamin || "-",
          registrasi_onsite: row.registrasi_onsite || null,
          waktu_registrasi_onsite: row.waktu_registrasi_onsite || null,
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
        }));

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
      showToast(`Pendaftaran Diabetes Health Forum berhasil ${newValue ? 'dibuka' : 'ditutup'}`);
    } catch (err: any) {
      alert("Gagal mengubah status Diabetes Health Forum: " + err.message);
    } finally {
      setIsTogglingHT(false);
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

  const handleSendWhatsapp = (participant: Pendaftar) => {
    const rawWa = participant["No. WhatsApp"] || "";
    const waNum = rawWa.replace(/\D/g, '').replace(/^0/, '62');

    let message = "";

    if (participant["Status Pembayaran"] === "Lunas") {
      const scannerUrl = `${window.location.origin}/scanner.html?id=${encodeURIComponent(participant["No. Registrasi"])}`;
      const qrImageUrl = `https://quickchart.io/qr?text=${encodeURIComponent(scannerUrl)}&size=400&ecLevel=H`;

      message = `Yth. *${participant["Nama Lengkap"]}*,

Berikut adalah E-Ticket digital/QR Code resmi untuk *${EVENT_INFO.namaAcara}*:

📌 *No. Registrasi:* ${participant["No. Registrasi"]}
👤 *Nama:* ${participant["Nama Lengkap"]}
🏷️ *Kategori:* ${participant["Kategori Peserta"]}
🏛️ *Institusi:* ${participant.Institusi || '-'}
🎟️ *Akses Kegiatan:* ${participant["Akses Kegiatan"]}
✅ *Status Pembayaran:* ${participant["Status Pembayaran"]}

🖼️ *QR Code:*
${qrImageUrl}

*Petunjuk Check-in:*
1. Tunjukkan QR Code saat check-in registrasi di lokasi acara.
2. Anda dapat membuka link gambar QR Code di atas lalu menyimpannya langsung ke galeri HP.

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

  const isVoucherActuallyUsed = (v: VoucherItem) => {
    if (v.is_used) return true;
    const codeClean = (v.code || '').trim().toUpperCase();
    return data.some(d => (d.KodeVoucher || d.kode_voucher || '').trim().toUpperCase() === codeClean);
  };

  const getUsedVoucherRegistrant = (v: VoucherItem): Pendaftar | undefined => {
    const codeClean = (v.code || '').trim().toUpperCase();
    return data.find(d => (d.KodeVoucher || d.kode_voucher || '').trim().toUpperCase() === codeClean);
  };

  const getVoucherWaMessage = (code: string) => {
    const portalUrl = `${window.location.origin}/#pendaftaran`;
    return `Yth. Dokter,

Berikut adalah *Kode Voucher Khusus FKTP (Dokter Umum)* untuk pendaftaran *${EVENT_INFO.namaAcara}*:

🎟️ *Kode Voucher:* \`${code}\`
📍 *Link Pendaftaran:* ${portalUrl}

*Petunjuk Penggunaan:*
1. Buka link pendaftaran di atas.
2. Pilih Kategori: *Dokter Umum (FKTP)*.
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
      "Email",
      "No. WhatsApp",
      "Kategori Peserta",
      "Akses Kegiatan",
      "Total Bayar",
      "Status Pembayaran",
      "Institusi",
      "NIM",
      "Kode Voucher",
      "Cabang Persadia",
      "Kota/Kabupaten",
      "Provinsi",
      "Registrasi Onsite",
      "Waktu Check-in"
    ];

    const rows = filteredData.map(d => [
      `"${d["No. Registrasi"]}"`,
      `"${d.Timestamp}"`,
      `"${(d["Nama Lengkap"] || "").replace(/"/g, '""')}"`,
      `"${d.Email || ""}"`,
      `"'${d["No. WhatsApp"] || ""}"`,
      `"${(d["Kategori Peserta"] || "").replace(/"/g, '""')}"`,
      `"${(d["Akses Kegiatan"] || "").replace(/"/g, '""')}"`,
      d["Total Bayar"],
      `"${d["Status Pembayaran"]}"`,
      `"${(d.Institusi || "").replace(/"/g, '""')}"`,
      `"${d.nim || ""}"`,
      `"${d.KodeVoucher || d.kode_voucher || ""}"`,
      `"${(d.CabangPersadia || "").replace(/"/g, '""')}"`,
      `"${(d.kota_kabupaten || "").replace(/"/g, '""')}"`,
      `"${(d.provinsi || "").replace(/"/g, '""')}"`,
      `"${d.registrasi_onsite || "Belum"}"`,
      `"${d.waktu_registrasi_onsite || ""}"`
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

  // Voucher filtering
  const availableFktpVouchers = vouchers.filter(v =>
    (v.kategori_target === 'dokter_umum' || !v.kategori_target) &&
    !isVoucherActuallyUsed(v)
  );
  const usedFktpVouchers = vouchers.filter(v => isVoucherActuallyUsed(v));

  const filteredVouchers = vouchers.filter(v => {
    const isUsed = isVoucherActuallyUsed(v);
    if (voucherTab === 'fktp_tersedia' && isUsed) return false;
    if (voucherTab === 'terpakai' && !isUsed) return false;

    const q = voucherSearch.toLowerCase().trim();
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

  // Calculate stats
  const totalPendaftar = data.length;
  const totalLunas = data.filter(d => d["Status Pembayaran"] === "Lunas").length;
  const totalMenunggu = data.filter(d => d["Status Pembayaran"] === "Menunggu Verifikasi").length;
  const totalBatal = data.filter(d => d["Status Pembayaran"] === "Dibatalkan").length;

  let totalDana = 0;
  data.forEach(d => {
    if (d["Status Pembayaran"] === "Lunas") {
      const val = typeof d["Total Bayar"] === 'number'
        ? d["Total Bayar"]
        : parseInt(d["Total Bayar"] || '0', 10);
      if (!isNaN(val)) totalDana += val;
    }
  });

  const kategoriList = Array.from(new Set(data.map(d => d["Kategori Peserta"]).filter(Boolean)));

  const kategoriCount: Record<string, number> = {};
  data.forEach(d => {
    const k = d["Kategori Peserta"] || "Lainnya";
    kategoriCount[k] = (kategoriCount[k] || 0) + 1;
  });

  const pieData = Object.keys(kategoriCount).map(key => ({
    name: key,
    value: kategoriCount[key]
  }));

  const statusBarData = [
    { name: 'Menunggu', jumlah: totalMenunggu, fill: '#f59e0b' },
    { name: 'Lunas', jumlah: totalLunas, fill: '#10b981' },
    { name: 'Dibatalkan', jumlah: totalBatal, fill: '#ef4444' },
  ];

  // Filtered data for table
  const filteredData = data.filter(item => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (item["Nama Lengkap"] || "").toLowerCase().includes(q) ||
      (item["No. Registrasi"] || "").toLowerCase().includes(q) ||
      (item.Email || "").toLowerCase().includes(q) ||
      (item["No. WhatsApp"] || "").toLowerCase().includes(q) ||
      (item.Institusi || "").toLowerCase().includes(q) ||
      (item.KodeVoucher || item.kode_voucher || "").toLowerCase().includes(q) ||
      (item.CabangPersadia || "").toLowerCase().includes(q) ||
      (item.NamaKetuaCabang || "").toLowerCase().includes(q) ||
      (item["Kategori Peserta"] || "").toLowerCase().includes(q) ||
      (item.nim || "").toLowerCase().includes(q) ||
      (item.kota_kabupaten || "").toLowerCase().includes(q) ||
      (item.provinsi || "").toLowerCase().includes(q);

    const matchesStatus = statusFilter === "Semua" ? true : item["Status Pembayaran"] === statusFilter;
    const matchesKategori = kategoriFilter === "Semua" ? true : item["Kategori Peserta"] === kategoriFilter;

    return matchesSearch && matchesStatus && matchesKategori;
  });

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
                        <Search className="h-4 w-4 text-slate-400" />
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
                        {kategoriList.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>

                      {/* Export CSV */}
                      <button
                        onClick={handleExportCSV}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition-colors cursor-pointer"
                        title="Unduh Data Saat Ini ke Excel (CSV)"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-500" />
                        <span>Export CSV</span>
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
                                    {(row.KodeVoucher || row.kode_voucher) && (row.KodeVoucher !== '-' && row.kode_voucher !== '-') && (
                                      <span className="px-1.5 py-0.2 bg-amber-50 text-amber-800 border border-amber-300 rounded font-mono text-[10px] font-bold">
                                        🎟️ {row.KodeVoucher || row.kode_voucher}
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
                <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-xs">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base leading-tight">Detail Lengkap Peserta</h3>
                  <span className="font-mono text-xs text-blue-700 font-bold">{selectedParticipant["No. Registrasi"]}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedParticipant(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
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
                    <span className="text-slate-700 font-medium">{selectedParticipant["Akses Kegiatan"]}</span>
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

              {/* Data Onsite & Kesehatan (Jika ada) */}
              {(selectedParticipant.registrasi_onsite || selectedParticipant.cek_gula_darah || selectedParticipant.gula_darah || selectedParticipant.tensi) && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Pemeriksaan Onsite & Pesta Rakyat</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 text-xs block">Check-in Onsite</span>
                      <strong className="text-slate-800">{selectedParticipant.registrasi_onsite || 'Belum'}</strong>
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
            </div>

            {/* Modal Footer Actions */}
            <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
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
                onClick={() => setSelectedParticipant(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
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
