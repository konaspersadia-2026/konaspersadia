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
  Ticket, Copy, Check, Plus, RefreshCw, Share2, Sparkles, Trash2, Filter
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

  const [data, setData] = useState<Pendaftar[]>([]);
  const [healthTalkCount, setHealthTalkCount] = useState(0);
  const [isHealthTalkEnabled, setIsHealthTalkEnabled] = useState(true);
  const [isTogglingHT, setIsTogglingHT] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(50);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean; id: string; status: string}>({ isOpen: false, id: "", status: "" });

  // Voucher management state
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
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
  }, [searchQuery, statusFilter, pageSize]);

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
          if (row.ikut_health_talk === true || (row.pilihan_kegiatan && (row.pilihan_kegiatan.includes('Diabetes Health Forum') || row.pilihan_kegiatan.includes('Health Talk')))) {
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
    } catch (err: any) {
      alert("Gagal mengubah status Diabetes Health Forum: " + err.message);
    } finally {
      setIsTogglingHT(false);
    }
  };

  const executeUpdateStatus = async () => {
    const { id, status } = confirmDialog;
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

      // Update local state directly
      setData(prev => prev.map(item =>
      item["No. Registrasi"] === id ? { ...item, "Status Pembayaran": status } : item
      ));

      if (status === "Lunas") {
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
            text: 'Izin akses tabel vouchers ditolak di Supabase. Silakan jalankan script SQL supabase/fix_vouchers_permission.sql di SQL Editor.'
          });
        }
      } else if (voucherData) {
        setVouchers(voucherData);
      }
    } catch (err: any) {
      console.error('Failed to load vouchers:', err);
    } finally {
      setLoadingVouchers(false);
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const isFktpVoucher = (v: VoucherItem) => {
    const code = (v.code || '').trim().toUpperCase();
    const target = (v.kategori_target || '').trim().toLowerCase();
    return code.startsWith('FKTP-') || target === 'dokter_umum' || target === 'fktp';
  };

  const isVoucherActuallyUsed = (v: VoucherItem) => {
    if (v.is_used) return true;
    const code = (v.code || '').trim().toUpperCase();
    return data.some(p => p.KodeVoucher && p.KodeVoucher !== '-' && p.KodeVoucher.trim().toUpperCase() === code);
  };

  const availableFktpVouchers = vouchers.filter(v => isFktpVoucher(v) && !isVoucherActuallyUsed(v));
  const usedFktpVouchers = vouchers.filter(v => isFktpVoucher(v) && isVoucherActuallyUsed(v));
  const nextAvailableFktpVoucher = availableFktpVouchers.length > 0 ? availableFktpVouchers[0] : null;

  const getUsedVoucherRegistrant = (voucher: VoucherItem) => {
    const code = (voucher.code || '').trim().toUpperCase();
    const byReg = voucher.used_by ? voucher.used_by.trim() : '';

    return data.find(p => 
      (p.KodeVoucher && p.KodeVoucher.trim().toUpperCase() === code) ||
      (byReg && p["No. Registrasi"] && p["No. Registrasi"].trim() === byReg)
    ) || null;
  };

  const getVoucherWaMessage = (code: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://konaspersadia.com';
    return `Yth. Dokter,\n\nBerikut kami sampaikan kode voucher khusus Dokter Umum (FKTP) untuk pendaftaran *${EVENT_INFO.namaAcara}*:\n\n🎟️ Kode Voucher: *${code}*\n\nSilakan gunakan kode voucher di atas saat mengisi formulir pendaftaran kategori *Dokter Umum (FKTP)* melalui website resmi:\n${origin}\n\n*Catatan:* Kode voucher ini bersifat unik dan hanya berlaku untuk 1 kali pendaftaran.\n\nSalam hangat,\n_Panitia KONAS PERSADIA 2026_`;
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
      // 1. Coba RPC create_voucher terlebih dahulu (SECURITY DEFINER)
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

      // 2. Fallback insert langsung ke tabel
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
      // 1. Coba RPC generate_fktp_vouchers terlebih dahulu (SECURITY DEFINER)
      const { data: rpcData, error: rpcErr } = await supabase.rpc('generate_fktp_vouchers', {
        p_count: count
      });

      if (!rpcErr && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
        setVouchers(prev => [...rpcData, ...prev]);
        setVoucherActionMsg({ type: 'success', text: `Berhasil generate ${rpcData.length} voucher FKTP baru!` });
        showToast(`${rpcData.length} Voucher FKTP baru berhasil dibuat!`);
        return;
      }

      // 2. Fallback ke insert batch langsung
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
      setVoucherActionMsg({ type: 'error', text: `Gagal generate voucher: ${err.message}` });
    } finally {
      setIsGeneratingBatch(false);
    }
  };

  const handleDeleteVoucher = async (code: string) => {
    if (!window.confirm(`Hapus voucher ${code}? Tindakan ini tidak dapat dibatalkan.`)) return;

    try {
      // 1. Coba RPC delete_voucher terlebih dahulu (SECURITY DEFINER)
      const { error: rpcErr } = await supabase.rpc('delete_voucher', { p_code: code });
      if (!rpcErr) {
        setVouchers(prev => prev.filter(v => v.code !== code));
        showToast(`Voucher ${code} berhasil dihapus.`);
        return;
      }

      // 2. Fallback ke delete langsung tabel
      const { error: delError } = await supabase
        .from('vouchers')
        .delete()
        .eq('code', code);

      if (delError) {
        if (delError.code === '42501' || delError.message?.toLowerCase().includes('permission')) {
          throw new Error('Izin ditolak (Permission denied) di Supabase. Silakan jalankan script supabase/fix_vouchers_permission.sql di SQL Editor Supabase.');
        }
        throw delError;
      }

      setVouchers(prev => prev.filter(v => v.code !== code));
      showToast(`Voucher ${code} berhasil dihapus.`);
    } catch (err: any) {
      alert(`Gagal menghapus voucher: ${err.message}`);
    }
  };

  const filteredVouchers = vouchers.filter(v => {
    const isUsed = isVoucherActuallyUsed(v);
    if (voucherTab === 'fktp_tersedia') {
      if (!isFktpVoucher(v) || isUsed) return false;
    } else if (voucherTab === 'terpakai') {
      if (!isUsed) return false;
    }

    if (!voucherSearch.trim()) return true;
    const q = voucherSearch.toLowerCase();
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

  let totalDana = 0;
  data.forEach(d => {
    if (d["Status Pembayaran"] === "Lunas") {
      const nominal = typeof d["Total Bayar"] === 'number' ? d["Total Bayar"] : parseInt(d["Total Bayar"] as string || '0', 10);
      totalDana += isNaN(nominal) ? 0 : nominal;
    }
  });

  // Prepare chart data
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
    { name: 'Dibatalkan', jumlah: data.filter(d => d["Status Pembayaran"] === "Dibatalkan").length, fill: '#ef4444' },
  ];

  // Filtered data for table (newest first as ordered by Supabase)
  const filteredData = data.filter(item => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (item["Nama Lengkap"] || "").toLowerCase().includes(q) ||
      (item["No. Registrasi"] || "").toLowerCase().includes(q) ||
      (item.Email || "").toLowerCase().includes(q) ||
      (item["No. WhatsApp"] || "").toLowerCase().includes(q) ||
      (item.Institusi || "").toLowerCase().includes(q) ||
      (item.KodeVoucher || "").toLowerCase().includes(q) ||
      (item.CabangPersadia || "").toLowerCase().includes(q) ||
      (item.NamaKetuaCabang || "").toLowerCase().includes(q) ||
      (item["Kategori Peserta"] || "").toLowerCase().includes(q) ||
      (item.nim || "").toLowerCase().includes(q) ||
      (item.kota_kabupaten || "").toLowerCase().includes(q) ||
      (item.provinsi || "").toLowerCase().includes(q);

    const matchesStatus = statusFilter === "Semua" ? true : item["Status Pembayaran"] === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination calculation
  const totalRows = filteredData.length;
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(totalRows / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = pageSize === -1 ? 0 : (safeCurrentPage - 1) * pageSize;
  const endIndex = pageSize === -1 ? totalRows : Math.min(startIndex + pageSize, totalRows);
  const paginatedData = pageSize === -1 ? filteredData : filteredData.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
    {/* Admin Header */}
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 h-16 flex items-center justify-between">
    <div className="flex items-center space-x-4">
    <button
    onClick={onNavigateHome}
    className="p-2 -ml-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
    title="Kembali ke Beranda"
    >
    <ChevronLeft className="h-5 w-5" />
    </button>
    <div className="flex items-center">
    <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
    <ShieldAlert className="h-4 w-4 text-white" />
    </div>
    <div>
    <h1 className="font-bold text-xl text-slate-800 tracking-tight leading-none">Konas Admin</h1>
    {currentUserEmail && (
      <span className="text-[11px] text-slate-400 font-normal block mt-0.5">{currentUserEmail}</span>
    )}
    </div>
    </div>
    </div>
    <div className="flex items-center space-x-2.5 sm:space-x-4">
      <button
        onClick={() => setIsVoucherModalOpen(true)}
        className="inline-flex items-center px-2.5 sm:px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
        title="Kelola & Salin Voucher FKTP"
      >
        <Ticket className="h-4 w-4 mr-1.5 text-amber-600" />
        <span className="hidden sm:inline">Voucher FKTP</span>
        <span className="sm:hidden">FKTP</span>
        <span className="ml-1.5 px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded-full text-[10px] font-bold">
          {availableFktpVouchers.length}
        </span>
      </button>

      <button
        onClick={() => {
          fetchData();
          fetchVouchers();
        }}
        className="text-xs sm:text-sm font-medium text-slate-600 hover:text-blue-600 flex items-center cursor-pointer"
      >
        {(loading || loadingVouchers) && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
        Refresh Data
      </button>
      <button
        onClick={handleLogout}
        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
        title="Keluar"
      >
        <LogOut className="h-5 w-5" />
      </button>
    </div>
    </div>
    </header>

    <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-4 sm:py-6">
    {loading && data.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
      <p className="text-slate-500">Memuat data dari Supabase...</p>
      </div>
    ) : error ? (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center justify-between">
      <p>{error}</p>
      <button onClick={fetchData} className="font-medium underline hover:text-red-800">Coba Lagi</button>
      </div>
    ) : (
      <div className="space-y-4 sm:space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Stats Row - 5 Compact Unified Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
      <StatCard
        title="Total Pendaftar"
        value={totalPendaftar.toString()}
        icon={<Users className="h-4 w-4 sm:h-5 sm:w-5" />}
        trend="+3 hari ini"
        color="blue"
      />
      <StatCard
        title="Dana Terverifikasi"
        value={`Rp ${totalDana.toLocaleString('id-ID')}`}
        icon={<DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />}
        trend="Lunas"
        color="emerald"
      />
      <StatCard
        title="Menunggu Verifikasi"
        value={totalMenunggu.toString()}
        icon={<Clock className="h-4 w-4 sm:h-5 sm:w-5" />}
        trend="Perlu tindakan"
        color="amber"
      />
      <StatCard
        title="Terverifikasi"
        value={totalLunas.toString()}
        icon={<CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />}
        trend="Selesai"
        color="indigo"
      />
      <StatCard
        title="Pendaftaran Diabetes Health Forum"
        value={`${healthTalkCount} orang`}
        icon={<Activity className="h-4 w-4 sm:h-5 sm:w-5" />}
        color="purple"
        trend={
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-bold ${isHealthTalkEnabled ? 'text-emerald-600' : 'text-slate-400'}`}>
              {isHealthTalkEnabled ? 'Dibuka' : 'Ditutup'}
            </span>
            <button
              onClick={handleToggleHealthTalk}
              disabled={isTogglingHT}
              title={isHealthTalkEnabled ? 'Klik untuk menutup pendaftaran Diabetes Health Forum' : 'Klik untuk membuka pendaftaran Diabetes Health Forum'}
              className={`relative inline-flex h-4.5 w-8 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                isHealthTalkEnabled ? 'bg-emerald-500' : 'bg-slate-300'
              } ${isTogglingHT ? 'opacity-50 cursor-wait' : ''}`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform shadow-xs ${
                  isHealthTalkEnabled ? 'translate-x-4' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        }
      />
      </div>

      {/* Charts Row - Compact Sizing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4">
      {/* Kategori Pie Chart */}
      <div className="bg-white p-4 sm:p-5 rounded-xl shadow-xs border border-slate-200">
      <h3 className="text-sm font-bold text-slate-800 mb-3">Distribusi Kategori Peserta</h3>
      <div className="h-48 sm:h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
      <PieChart>
      <Pie
      data={pieData}
      cx="50%"
      cy="50%"
      innerRadius={50}
      outerRadius={75}
      paddingAngle={4}
      dataKey="value"
      >
      {pieData.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
      ))}
      </Pie>
      <RechartsTooltip
      formatter={(value: number) => [`${value} peserta`, 'Jumlah']}
      contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
      />
      <Legend verticalAlign="bottom" height={32} wrapperStyle={{ fontSize: '11px' }} />
      </PieChart>
      </ResponsiveContainer>
      </div>
      </div>

      {/* Status Bar Chart */}
      <div className="bg-white p-4 sm:p-5 rounded-xl shadow-xs border border-slate-200">
      <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-bold text-slate-800">Status Pembayaran</h3>
      <a
      href="https://chat.whatsapp.com/GezzqQzSYPuHTiCBRGbela"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center px-2.5 py-1 bg-[#25D366] hover:bg-[#128C7E] text-white text-xs font-medium rounded-lg transition-colors shadow-xs"
      >
      <MessageCircle className="h-3.5 w-3.5 mr-1" />
      Grup WA
      </a>
      </div>
      <div className="h-48 sm:h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
      <BarChart data={statusBarData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
      <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
      <RechartsTooltip
      cursor={{fill: '#f1f5f9'}}
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

      {/* Quick Action: Voucher FKTP Bar */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-blue-500/5 border border-amber-200/90 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Info */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Ticket className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-slate-800 text-base sm:text-lg">Voucher Khusus FKTP (Dokter Umum)</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  {availableFktpVouchers.length} Siap Pakai
                </span>
                {usedFktpVouchers.length > 0 && (
                  <span className="text-xs text-slate-500 font-medium">
                    ({usedFktpVouchers.length} sudah digunakan)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Salin dan berikan kode voucher aktif ini kepada dokter FKTP untuk mendapatkan tarif khusus registrasi.
              </p>
            </div>
          </div>

          {/* Right: Quick Copy & Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {nextAvailableFktpVoucher ? (
              <div className="flex flex-wrap items-center gap-2 bg-white/90 backdrop-blur-xs p-1.5 sm:p-2 rounded-xl border border-amber-200 shadow-xs">
                <div className="px-2.5 sm:px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-100 flex items-center gap-1.5 sm:gap-2">
                  <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">Voucher:</span>
                  <span className="font-mono font-bold text-sm sm:text-base text-amber-900 tracking-wider select-all">
                    {nextAvailableFktpVoucher.code}
                  </span>
                </div>

                <button
                  onClick={() => handleCopyCode(nextAvailableFktpVoucher.code)}
                  className="inline-flex items-center px-3 py-1.5 sm:py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
                  title="Salin Kode Voucher ke Clipboard"
                >
                  {copiedKey === nextAvailableFktpVoucher.code ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1.5 text-white" />
                      Tersalin!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1.5" />
                      Salin Kode
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleCopyWaMessage(nextAvailableFktpVoucher.code)}
                  className="inline-flex items-center px-3 py-1.5 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  title="Salin Template Teks WhatsApp Lengkap"
                >
                  {copiedKey === `wa_${nextAvailableFktpVoucher.code}` ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                      Pesan Tersalin!
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
                      Salin Pesan WA
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleShareWa(nextAvailableFktpVoucher.code)}
                  className="inline-flex items-center px-3 py-1.5 sm:py-2 bg-[#25D366] hover:bg-[#128C7E] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
                  title="Buka WhatsApp untuk kirim kode voucher langsung"
                >
                  <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                  Kirim WA
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500 italic bg-white px-3 py-2 rounded-lg border border-slate-200">
                  {vouchers.length === 0 ? "Belum ada voucher FKTP di database." : "Semua voucher FKTP telah digunakan."}
                </span>
                <button
                  onClick={() => handleBatchGenerate(5)}
                  disabled={isGeneratingBatch}
                  className="inline-flex items-center px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingBatch ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  + Buat 5 Voucher FKTP
                </button>
              </div>
            )}

            <button
              onClick={() => setIsVoucherModalOpen(true)}
              className="inline-flex items-center px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer ml-auto lg:ml-0"
              title="Buka Panel Lengkap Manajemen Voucher"
            >
              <Ticket className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
              Kelola Voucher ({vouchers.length})
            </button>
          </div>
        </div>
      </div>

      {/* Table Section - Frozen Toolbar & Header */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 flex flex-col">
      {/* Sticky Toolbar: Daftar Pendaftar + Search + Filter */}
      <div className="sticky top-16 z-20 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-t-xl sm:rounded-t-2xl shadow-xs">
      <div className="flex items-center gap-2">
      <h3 className="text-base sm:text-lg font-bold text-slate-800">Daftar Pendaftar</h3>
      <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
        {filteredData.length}
      </span>
      </div>
      <div className="flex flex-col sm:flex-row gap-2.5">
      <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <Search className="h-3.5 w-3.5 text-slate-400" />
      </div>
      <input
      type="text"
      placeholder="Cari nama, cabang, no. reg..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="pl-9 pr-3 py-1.5 w-full sm:w-60 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-xs sm:text-sm bg-white"
      />
      </div>
      <select
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
      className="px-3 py-1.5 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-xs sm:text-sm bg-white w-full sm:w-auto cursor-pointer"
      >
      <option value="Semua">Semua Status</option>
      <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
      <option value="Lunas">Lunas</option>
      <option value="Dibatalkan">Dibatalkan</option>
      </select>
      </div>
      </div>

      {actionError && (
        <div className="bg-red-50 border-b border-red-200 text-red-700 px-6 py-3 text-sm flex items-center justify-between">
        <div className="flex items-center">
        <ShieldAlert className="h-4 w-4 mr-2" />
        {actionError}
        </div>
        <button onClick={() => setActionError(null)} className="text-red-500 hover:text-red-700">
        <XCircle className="h-4 w-4" />
        </button>
        </div>
      )}

      {/* Scrollable Table Viewport with Sticky Header */}
      <div className="overflow-x-auto max-h-[60vh] sm:max-h-[65vh] overflow-y-auto">
      <table className="w-full text-left border-collapse">
      <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 shadow-xs">
      <tr>
      <th className="px-4 sm:px-6 py-3 font-semibold bg-slate-50">No. Registrasi</th>
      <th className="px-4 sm:px-6 py-3 font-semibold bg-slate-50">Peserta</th>
      <th className="px-4 sm:px-6 py-3 font-semibold bg-slate-50">Kategori & Akses</th>
      <th className="px-4 sm:px-6 py-3 font-semibold bg-slate-50">Total Bayar</th>
      <th className="px-4 sm:px-6 py-3 font-semibold bg-slate-50">Status</th>
      <th className="px-4 sm:px-6 py-3 font-semibold bg-slate-50 text-right">Aksi</th>
      </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 text-sm">
      {filteredData.length === 0 ? (
        <tr>
        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
        Tidak ada data pendaftar yang cocok dengan filter.
        </td>
        </tr>
      ) : (
        paginatedData.map((row, idx) => (
          <tr key={idx} className="hover:bg-slate-50 transition-colors">
          <td className="px-4 sm:px-6 py-2.5 sm:py-3 whitespace-nowrap">
          <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-xs">
          {row["No. Registrasi"]}
          </span>
          <div className="text-[11px] text-slate-400 mt-0.5">
          {new Date(row.Timestamp).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}
          </div>
          </td>
          <td className="px-4 sm:px-6 py-2.5 sm:py-3">
          <div className="font-medium text-slate-800 text-xs sm:text-sm">{row["Nama Lengkap"]}</div>
          {row.Institusi && row.Institusi !== '-' && (
            <div className="text-[11px] text-slate-500 font-medium truncate max-w-[200px]" title={row.Institusi}>
              🏛️ {row.Institusi}
            </div>
          )}
          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
          {row["No. WhatsApp"]}
          {row["No. WhatsApp"] && row["No. WhatsApp"] !== "-" && (
            <a
            href={`https://wa.me/${row["No. WhatsApp"].replace(/\D/g, '').replace(/^0/, '62')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center p-1 bg-[#25D366]/10 text-[#128C7E] rounded hover:bg-[#25D366]/20 transition-colors"
            title="Chat WhatsApp"
            >
            <MessageCircle className="h-3 w-3" />
            </a>
          )}
          {row.nim && row.nim !== '-' && (
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono border border-slate-200">
              NIM: {row.nim}
            </span>
          )}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[200px]">{row.Email}</div>
          </td>
          <td className="px-4 sm:px-6 py-2.5 sm:py-3">
            <div className="text-slate-800 font-semibold text-xs sm:text-sm">{row["Kategori Peserta"]}</div>
            <div className="text-xs text-slate-500 mt-0.5 max-w-[220px] truncate" title={row["Akses Kegiatan"]}>
              {row["Akses Kegiatan"]}
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {row.KodeVoucher && row.KodeVoucher !== '-' && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 text-amber-900 border border-amber-300 rounded text-[10px] font-mono font-bold" title={`Kode Voucher: ${row.KodeVoucher}`}>
                  🎟️ {row.KodeVoucher}
                </span>
              )}
              {row.CabangPersadia && row.CabangPersadia !== '-' && (
                <span 
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded text-[10px] font-medium"
                  title={`Cabang PERSADIA: ${row.CabangPersadia}${row.NamaKetuaCabang && row.NamaKetuaCabang !== '-' ? ` | Ketua: ${row.NamaKetuaCabang}` : ''}`}
                >
                  🏢 {row.CabangPersadia}
                  {row.NamaKetuaCabang && row.NamaKetuaCabang !== '-' && (
                    <span className="text-blue-600 font-normal"> ({row.NamaKetuaCabang})</span>
                  )}
                </span>
              )}
              {row.BersediaAnggota && (
                <span 
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded text-[10px] font-semibold cursor-help"
                  title={row.AlamatLengkap && row.AlamatLengkap !== '-' ? `Alamat: ${row.AlamatLengkap}, ${row.Kelurahan}, ${row.Kecamatan}, ${row.KotaKabupaten}, ${row.Provinsi}` : 'Bersedia mendaftar anggota PERSADIA'}
                >
                  🎁 Anggota PERSADIA
                </span>
              )}
              {row.registrasi_onsite === 'Ya' && (
                <span 
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded text-[10px] font-bold"
                  title={row.waktu_registrasi_onsite ? `Check-in: ${new Date(row.waktu_registrasi_onsite).toLocaleString('id-ID')}` : 'Check-in Onsite'}
                >
                  ✅ Onsite
                </span>
              )}
              {row.cek_gula_darah === 'Ya' && (
                <span 
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-purple-50 text-purple-800 border border-purple-300 rounded text-[10px] font-medium"
                  title={`Gula Darah: ${row.gula_darah || '-'} | Tensi: ${row.tensi || '-'}`}
                >
                  🩸 Cek Gula: {row.gula_darah || 'Ya'}
                </span>
              )}
              {row.pengambilan_merchandise === 'Ya' && (
                <span 
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-300 rounded text-[10px] font-medium"
                  title="Merchandise sudah diambil"
                >
                  🎁 Merchandise
                </span>
              )}
            </div>
          </td>
          <td className="px-4 sm:px-6 py-2.5 sm:py-3 whitespace-nowrap font-medium text-slate-700 text-xs sm:text-sm">
          Rp {typeof row["Total Bayar"] === 'number'
            ? row["Total Bayar"].toLocaleString('id-ID')
            : parseInt(row["Total Bayar"] as string || '0', 10).toLocaleString('id-ID')}
            </td>
            <td className="px-4 sm:px-6 py-2.5 sm:py-3 whitespace-nowrap">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              row["Status Pembayaran"] === 'Lunas'
              ? 'bg-emerald-100 text-emerald-800'
              : row["Status Pembayaran"] === 'Dibatalkan'
              ? 'bg-red-100 text-red-800'
              : 'bg-amber-100 text-amber-800'
            }`}>
            {row["Status Pembayaran"] === 'Lunas' && <CheckCircle className="w-3 h-3 mr-1" />}
            {row["Status Pembayaran"] === 'Dibatalkan' && <XCircle className="w-3 h-3 mr-1" />}
            {row["Status Pembayaran"] === 'Menunggu Verifikasi' && <Clock className="w-3 h-3 mr-1" />}
            {row["Status Pembayaran"]}
            </span>
            </td>
            <td className="px-4 sm:px-6 py-2.5 sm:py-3 whitespace-nowrap text-right">
            <div className="flex items-center justify-end gap-1.5">
            {row["Status Pembayaran"] === 'Menunggu Verifikasi' && (
              <>
              <button
              onClick={() => setConfirmDialog({ isOpen: true, id: row["No. Registrasi"], status: "Lunas" })}
              disabled={actionLoadingId === row["No. Registrasi"]}
              className="inline-flex items-center px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              title="Set Lunas"
              >
              {actionLoadingId === row["No. Registrasi"] ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckSquare className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              )}
              Lunas
              </button>
              <button
              onClick={() => setConfirmDialog({ isOpen: true, id: row["No. Registrasi"], status: "Dibatalkan" })}
              disabled={actionLoadingId === row["No. Registrasi"]}
              className="inline-flex items-center px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              title="Set Batal"
              >
              {actionLoadingId === row["No. Registrasi"] ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <XCircle className="w-3.5 h-3.5 mr-1 text-red-500" />
              )}
              Batal
              </button>
              </>
            )}

            <button
            onClick={() => handleSendWhatsapp(row)}
            className={`inline-flex items-center px-3 py-1.5 border text-xs font-semibold rounded-lg transition-all shadow-sm cursor-pointer ${
              row["Status Pembayaran"] === "Lunas"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300"
              : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 hover:border-amber-300"
            }`}
            title={row["Status Pembayaran"] === "Lunas" ? "Kirim QR E-Ticket langsung ke WhatsApp Peserta" : "Minta Bukti Transfer Pembayaran ke WhatsApp"}
            >
            <MessageCircle className={`w-3.5 h-3.5 mr-1.5 ${row["Status Pembayaran"] === "Lunas" ? "text-emerald-600" : "text-amber-600"}`} />
            {row["Status Pembayaran"] === "Lunas" ? "Kirim E-Tiket (WA)" : "Tagih Bukti Bayar (WA)"}
            </button>
            </div>
            </td>
            </tr>
        ))
      )}
      </tbody>
      </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-slate-600">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-between w-full sm:w-auto">
          <span>
            Menampilkan <strong className="text-slate-800 font-semibold">{totalRows === 0 ? 0 : startIndex + 1}</strong>–<strong className="text-slate-800 font-semibold">{endIndex}</strong> dari <strong className="text-slate-800 font-semibold">{totalRows}</strong> pendaftar
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Per hal:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={-1}>Semua</option>
            </select>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1 self-center sm:self-auto">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={safeCurrentPage === 1}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sebelumnya</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - safeCurrentPage) <= 1)
                .reduce<(number | string)[]>((acc, p, idx, arr) => {
                  if (idx > 0 && (p - (arr[idx - 1] as number)) > 1) {
                    acc.push('...');
                  }
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === '...' ? (
                    <span key={`dots-${idx}`} className="px-1.5 text-xs text-slate-400">...</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p as number)}
                      className={`min-w-[28px] sm:min-w-[32px] h-7 sm:h-8 px-2 rounded-lg text-xs font-semibold transition-colors ${
                        safeCurrentPage === p
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={safeCurrentPage === totalPages}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <span className="hidden sm:inline">Selanjutnya</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      </div>

      </div>
    )}
    </main>

    {/* Confirmation Modal */}
    {confirmDialog.isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
      <h3 className="text-lg font-bold text-slate-800 mb-2">Konfirmasi Tindakan</h3>
      <p className="text-sm text-slate-600 mb-6">
      Anda yakin ingin mengubah status pembayaran menjadi <strong className={confirmDialog.status === "Lunas" ? "text-emerald-600" : "text-red-600"}>{confirmDialog.status}</strong> untuk peserta dengan nomor registrasi <strong>{confirmDialog.id}</strong>?
      </p>
      <div className="flex justify-end space-x-3">
      <button
      onClick={() => setConfirmDialog({ isOpen: false, id: "", status: "" })}
      className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
      >
      Batal
      </button>
      <button
      onClick={executeUpdateStatus}
      className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors cursor-pointer ${
        confirmDialog.status === "Lunas"
        ? "bg-emerald-600 hover:bg-emerald-700"
        : "bg-red-600 hover:bg-red-700"
      }`}
      >
      {confirmDialog.status === "Lunas"
        ? "Ya, Ubah Status & Kirim WA"
        : "Ya, Batalkan Pendaftaran"}
        </button>
        </div>
        </div>
        </div>
    )}

    {/* Voucher Management Modal */}
    {isVoucherModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
          
          {/* Modal Header */}
          <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-xs">
                <Ticket className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-slate-800">Manajemen Voucher FKTP (Dokter Umum)</h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    {availableFktpVouchers.length} Siap Pakai
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Salin atau bagikan kode voucher aktif kepada dokter FKTP dengan satu kali klik.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsVoucherModalOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Toolbar: Search, Tabs & Quick Actions */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-white space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              
              {/* Search Bar */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Cari voucher, nama dokter, institusi, no. reg..."
                  value={voucherSearch}
                  onChange={(e) => setVoucherSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-xs sm:text-sm bg-slate-50/50"
                />
                {voucherSearch && (
                  <button
                    onClick={() => setVoucherSearch("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button
                  onClick={() => handleBatchGenerate(5)}
                  disabled={isGeneratingBatch}
                  className="inline-flex items-center px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  title="Generate 5 kode voucher FKTP baru secara otomatis"
                >
                  {isGeneratingBatch ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-600" />}
                  +5 Acak
                </button>

                <button
                  onClick={() => handleBatchGenerate(10)}
                  disabled={isGeneratingBatch}
                  className="inline-flex items-center px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  title="Generate 10 kode voucher FKTP baru secara otomatis"
                >
                  {isGeneratingBatch ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-600" />}
                  +10 Acak
                </button>

                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className={`inline-flex items-center px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    showAddForm ? 'bg-slate-800 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Manual
                </button>

                <button
                  onClick={fetchVouchers}
                  disabled={loadingVouchers}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-slate-200"
                  title="Refresh Data Voucher"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingVouchers ? 'animate-spin text-amber-600' : ''}`} />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setVoucherTab("fktp_tersedia")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  voucherTab === "fktp_tersedia"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Tersedia ({availableFktpVouchers.length})
              </button>
              <button
                onClick={() => setVoucherTab("terpakai")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  voucherTab === "terpakai"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Sudah Digunakan ({usedFktpVouchers.length})
              </button>
              <button
                onClick={() => setVoucherTab("semua")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  voucherTab === "semua"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Semua Voucher ({vouchers.length})
              </button>
            </div>

            {/* Inline Add Manual Voucher Form */}
            {showAddForm && (
              <form onSubmit={handleAddVoucher} className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-amber-900 mb-1">Kode Voucher Baru:</label>
                  <input
                    type="text"
                    required
                    value={newVoucherInput}
                    onChange={(e) => setNewVoucherInput(e.target.value.toUpperCase())}
                    placeholder="Contoh: FKTP-BOGOR01"
                    className="w-full px-3 py-1.5 rounded-lg border border-amber-300 bg-white focus:ring-1 focus:ring-amber-500 outline-none font-mono text-xs font-bold text-slate-800"
                  />
                </div>
                <div className="sm:self-end">
                  <button
                    type="submit"
                    disabled={isAddingVoucher}
                    className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isAddingVoucher ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Simpan Voucher"}
                  </button>
                </div>
              </form>
            )}

            {voucherActionMsg && (
              <div className={`p-2.5 rounded-lg text-xs font-medium ${
                voucherActionMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {voucherActionMsg.text}
              </div>
            )}
          </div>

          {/* Voucher List Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 max-h-[55vh] divide-y divide-slate-100">
            {loadingVouchers && vouchers.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-2" />
                <p className="text-xs">Memuat daftar voucher...</p>
              </div>
            ) : filteredVouchers.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="h-12 w-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 mb-3">
                  <Ticket className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">Tidak ada voucher yang sesuai</h4>
                <p className="text-xs text-slate-500 max-w-sm mb-4">
                  {voucherSearch ? `Tidak ditemukan voucher yang sesuai dengan kata kunci "${voucherSearch}".` : "Belum ada voucher pada kategori filter ini."}
                </p>
                {voucherTab === 'fktp_tersedia' && (
                  <button
                    onClick={() => handleBatchGenerate(5)}
                    disabled={isGeneratingBatch}
                    className="inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    + Buat 5 Voucher FKTP Sekarang
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredVouchers.map((v, idx) => {
                  const isUsed = isVoucherActuallyUsed(v);
                  const registrant = getUsedVoucherRegistrant(v);
                  return (
                    <div
                      key={v.id || v.code || idx}
                      className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                        isUsed
                          ? 'bg-slate-50/70 border-slate-200'
                          : 'bg-white border-amber-200 hover:border-amber-300 shadow-xs'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Voucher Info */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-sm sm:text-base text-slate-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg tracking-wider">
                              {v.code}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isUsed
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}>
                              {isUsed ? 'Sudah Digunakan' : 'Siap Digunakan'}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              Target: {v.kategori_target === 'dokter_umum' ? 'Dokter Umum (FKTP)' : (v.kategori_target || 'Umum')}
                            </span>
                          </div>

                          {/* Detail of who redeemed if used */}
                          {isUsed && (
                            <div className="mt-2 p-2.5 bg-white border border-slate-200 rounded-lg text-xs space-y-1">
                              <div className="font-semibold text-slate-800 flex items-center gap-1.5 flex-wrap">
                                <span className="text-slate-500">Pengguna:</span>
                                <span className="text-blue-700 font-bold">{registrant ? registrant["Nama Lengkap"] : (v.used_by || "Peserta")}</span>
                                {registrant && (
                                  <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                                    {registrant["No. Registrasi"]}
                                  </span>
                                )}
                              </div>
                              {registrant?.Institusi && registrant.Institusi !== '-' && (
                                <div className="text-slate-600 text-[11px]">Institusi: {registrant.Institusi}</div>
                              )}
                              <div className="flex items-center gap-3 text-slate-500 text-[11px] flex-wrap pt-0.5">
                                {v.used_at && (
                                  <span>Klaim: {new Date(v.used_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                )}
                                {registrant?.["No. WhatsApp"] && registrant["No. WhatsApp"] !== '-' && (
                                  <a
                                    href={`https://wa.me/${registrant["No. WhatsApp"].replace(/\D/g, '').replace(/^0/, '62')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-medium"
                                  >
                                    <MessageCircle className="w-3 h-3 mr-1" />
                                    WA: {registrant["No. WhatsApp"]}
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-center shrink-0 flex-wrap">
                          {!isUsed ? (
                            <>
                              <button
                                onClick={() => handleCopyCode(v.code)}
                                className="inline-flex items-center px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
                                title="Salin Kode Voucher"
                              >
                                {copiedKey === v.code ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 mr-1" />
                                    Tersalin!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5 mr-1" />
                                    Salin Kode
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => handleCopyWaMessage(v.code)}
                                className="inline-flex items-center px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                                title="Salin Template Pesan WhatsApp"
                              >
                                {copiedKey === `wa_${v.code}` ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                    Teks Tersalin!
                                  </>
                                ) : (
                                  <>
                                    <Share2 className="w-3.5 h-3.5 mr-1 text-slate-600" />
                                    Salin Pesan WA
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => handleShareWa(v.code)}
                                className="inline-flex items-center px-2.5 py-1.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                                title="Buka WhatsApp untuk Kirim Langsung"
                              >
                                <MessageCircle className="w-3.5 h-3.5 mr-1" />
                                Kirim WA
                              </button>

                              <button
                                onClick={() => handleDeleteVoucher(v.code)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Voucher Ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            registrant?.["No. WhatsApp"] && registrant["No. WhatsApp"] !== '-' && (
                              <a
                                href={`https://wa.me/${registrant["No. WhatsApp"].replace(/\D/g, '').replace(/^0/, '62')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
                              >
                                <MessageCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                Hubungi Dokter
                              </a>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
            <span>
              Menampilkan <strong className="text-slate-800 font-semibold">{filteredVouchers.length}</strong> dari <strong className="text-slate-800 font-semibold">{vouchers.length}</strong> voucher
            </span>
            <button
              onClick={() => setIsVoucherModalOpen(false)}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Floating Toast Notification */}
    {toastMessage && (
      <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 text-white text-xs sm:text-sm font-medium px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200 border border-slate-800 backdrop-blur-xs">
        <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
        <span>{toastMessage}</span>
      </div>
    )}
    </div>
  );
}

// Subcomponent for stat cards
function StatCard({ 
  title, 
  value, 
  icon, 
  trend, 
  color 
}: { 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
  trend?: React.ReactNode; 
  color: string;
}) {
  const bgColors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white p-3 sm:p-3.5 rounded-xl shadow-xs border border-slate-200 flex flex-col justify-between hover:border-slate-300 transition-colors">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className={`p-1.5 sm:p-2 rounded-lg ${bgColors[color] || 'bg-slate-50 text-slate-600'}`}>
          {icon}
        </div>
        {typeof trend === 'string' ? (
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full truncate max-w-[120px]" title={trend}>
            {trend}
          </span>
        ) : (
          trend
        )}
      </div>
      <div>
        <p className="text-[11px] sm:text-xs font-medium text-slate-500 mb-0.5 truncate" title={title}>{title}</p>
        <h3 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight truncate" title={value}>{value}</h3>
      </div>
    </div>
  );
}
