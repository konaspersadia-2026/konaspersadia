import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  Vote, Users, CheckCircle, Clock, ShieldCheck, LogOut, Search,
  Plus, Copy, Check, MessageCircle, RefreshCw, Download, ExternalLink,
  Lock, Unlock, AlertCircle, Eye, EyeOff, Sparkles, ChevronRight, X, Loader2,
  FileText, RotateCcw, Trash2, AlertTriangle, KeyRound, MapPin, Building2,
  Calendar, CheckSquare, Scale, FileSpreadsheet, Upload
} from 'lucide-react';

interface VotingAdminDashboardProps {
  onNavigateHome: () => void;
  onOpenVotingPage: (token?: string) => void;
  onOpenLiveProjector: () => void;
}

interface VoterDPT {
  id: string;
  nama_lengkap: string;
  whatsapp: string | null;
  cabang_persadia: string;
  token: string;
  status_memilih: boolean;
  waktu_memilih: string | null;
  catatan?: string | null;
  created_at: string;
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
  total_suara?: number;
  persentase?: number;
}

interface VotingRekap {
  total_dpt: number;
  total_suara_masuk: number;
  belum_memilih: number;
  persentase_partisipasi: number;
  status_pemilihan: 'draft' | 'open' | 'closed';
  tampilkan_quick_count: boolean;
  putaran_voting?: string;
  kandidat_putaran_2?: number[];
  kandidat: Candidate[];
}

export default function VotingAdminDashboard({
  onNavigateHome,
  onOpenVotingPage,
  onOpenLiveProjector
}: VotingAdminDashboardProps) {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<'dpt' | 'kandidat' | 'sidang'>('dpt');

  // Data States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dptList, setDptList] = useState<VoterDPT[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [rekap, setRekap] = useState<VotingRekap | null>(null);
  const [sessionStatus, setSessionStatus] = useState<'draft' | 'open' | 'closed'>('draft');
  const [showQuickCount, setShowQuickCount] = useState(false);
  const [putaranVoting, setPutaranVoting] = useState<string>('1');
  const [kandidatPutaran2, setKandidatPutaran2] = useState<number[]>([]);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"semua" | "belum" | "sudah">("semua");

  // UI States
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Modal Tambah/Edit DPT
  const [isDptModalOpen, setIsDptModalOpen] = useState(false);
  const [editingDptId, setEditingDptId] = useState<string | null>(null);
  const [dptFormData, setDptFormData] = useState({
    nama_lengkap: "",
    whatsapp: "",
    cabang_persadia: "",
    catatan: ""
  });
  const [isSavingDpt, setIsSavingDpt] = useState(false);

  // Modal Upload Bulk DPT (Excel / CSV)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<Array<{
    nama_lengkap: string;
    cabang_persadia: string;
    whatsapp: string | null;
    catatan: string | null;
    token?: string;
  }>>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<{ total: number; success: number } | null>(null);

  // Modal Tambah/Edit Kandidat
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [editingCandidateId, setEditingCandidateId] = useState<number | null>(null);
  const [candidateFormData, setCandidateFormData] = useState({
    nomor_urut: 1,
    nama_kandidat: "",
    gelar: "",
    institusi: "",
    foto_url: "",
    visi: "",
    misi: "",
    cv_url: "",
    ringkasan_cv: ""
  });
  const [isSavingCandidate, setIsSavingCandidate] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Cek sesi login di sessionStorage saat inisialisasi
  useEffect(() => {
    const isLogged = sessionStorage.getItem('persadia_voting_admin_auth');
    if (isLogged === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch Semua Data Terkait Voting
  const fetchVotingData = async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Fetch Config
      const { data: configData } = await supabase
        .from('voting_config')
        .select('*');

      if (configData) {
        const statusObj = configData.find(c => c.key === 'status_pemilihan');
        const qcObj = configData.find(c => c.key === 'tampilkan_quick_count');
        const roundObj = configData.find(c => c.key === 'putaran_voting');
        const k2Obj = configData.find(c => c.key === 'kandidat_putaran_2');
        if (statusObj) setSessionStatus(statusObj.value as any);
        if (qcObj) setShowQuickCount(qcObj.value === 'true');
        if (roundObj) setPutaranVoting(roundObj.value);
        if (k2Obj) {
          try {
            setKandidatPutaran2(JSON.parse(k2Obj.value));
          } catch {
            setKandidatPutaran2([]);
          }
        }
      }

      // 2. Fetch Rekapitulasi via RPC
      const { data: rekapData, error: rekapErr } = await supabase.rpc('get_voting_rekapitulasi');
      if (!rekapErr && rekapData) {
        setRekap(rekapData);
        if (rekapData.putaran_voting) setPutaranVoting(rekapData.putaran_voting);
        if (rekapData.kandidat_putaran_2) setKandidatPutaran2(rekapData.kandidat_putaran_2);
        if (rekapData.kandidat) {
          setCandidates(rekapData.kandidat);
        }
      } else {
        // Fallback fetch kandidat langsung jika RPC belum siap
        const { data: candData } = await supabase
          .from('voting_kandidat')
          .select('*')
          .order('nomor_urut', { ascending: true });
        if (candData) setCandidates(candData);
      }

      // 3. Fetch DPT List
      const { data: votersData, error: dptErr } = await supabase
        .from('voting_dpt')
        .select('*')
        .order('created_at', { ascending: false });

      if (dptErr) throw dptErr;
      setDptList(votersData || []);

    } catch (err: any) {
      console.error("Gagal load data voting:", err);
      setError("Gagal memuat data dari database: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchVotingData();
    }
  }, [isAuthenticated]);

  // Handler Login Admin
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setAuthError("");

    try {
      let validPasscode = "panlih2026";

      if (isSupabaseConfigured) {
        const { data } = await supabase
          .from('voting_config')
          .select('value')
          .eq('key', 'voting_admin_passcode')
          .single();
        if (data && data.value) {
          validPasscode = data.value;
        }
      }

      if (passcode.trim() === validPasscode) {
        setIsAuthenticated(true);
        sessionStorage.setItem('persadia_voting_admin_auth', 'true');
      } else {
        setAuthError("Passcode salah. Hanya Panitia Pemilihan (Panlih) yang berwenang.");
      }
    } catch (err) {
      if (passcode.trim() === "panlih2026") {
        setIsAuthenticated(true);
        sessionStorage.setItem('persadia_voting_admin_auth', 'true');
      } else {
        setAuthError("Gagal autentikasi.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('persadia_voting_admin_auth');
    setIsAuthenticated(false);
    setPasscode("");
  };

  // Helper Pembuat Token Bersih (Tanpa huruf O dan angka 0)
  const generateCleanToken = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let randomStr = "";
    for (let i = 0; i < 5; i++) {
      randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `KNAS-${randomStr}`;
  };

  // Handler Simpan / Tambah DPT
  const handleSaveDpt = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingDpt(true);
    try {
      if (editingDptId) {
        const { error: updErr } = await supabase
          .from('voting_dpt')
          .update({
            nama_lengkap: dptFormData.nama_lengkap.trim(),
            whatsapp: dptFormData.whatsapp ? dptFormData.whatsapp.trim() : null,
            cabang_persadia: dptFormData.cabang_persadia.trim(),
            catatan: dptFormData.catatan ? dptFormData.catatan.trim() : null
          })
          .eq('id', editingDptId);

        if (updErr) throw updErr;
        showToast("Data pemilih berhasil diperbarui!");
      } else {
        const token = generateCleanToken();
        const { error: insErr } = await supabase
          .from('voting_dpt')
          .insert([{
            nama_lengkap: dptFormData.nama_lengkap.trim(),
            whatsapp: dptFormData.whatsapp ? dptFormData.whatsapp.trim() : null,
            cabang_persadia: dptFormData.cabang_persadia.trim(),
            token,
            catatan: dptFormData.catatan ? dptFormData.catatan.trim() : null
          }]);

        if (insErr) throw insErr;
        showToast("Delegasi pemilih baru berhasil ditambahkan!");
      }

      setIsDptModalOpen(false);
      fetchVotingData();
    } catch (err: any) {
      alert("Gagal simpan DPT: " + err.message);
    } finally {
      setIsSavingDpt(false);
    }
  };

  // Handler Generate Token Baru untuk pemilih yang belum punya atau ingin diganti
  const handleRegenerateToken = async (voterId: string) => {
    const newToken = generateCleanToken();
    try {
      const { error: updErr } = await supabase
        .from('voting_dpt')
        .update({ token: newToken })
        .eq('id', voterId);

      if (updErr) throw updErr;
      showToast(`Token baru dibuat: ${newToken}`);
      fetchVotingData();
    } catch (err: any) {
      alert("Gagal memperbarui token: " + err.message);
    }
  };

  // Handler Hapus Pemilih DPT
  const handleDeleteDpt = async (voter: VoterDPT) => {
    if (!window.confirm(`Hapus pemilih ${voter.nama_lengkap} (${voter.cabang_persadia}) dari DPT?`)) return;
    try {
      const { error: delErr } = await supabase
        .from('voting_dpt')
        .delete()
        .eq('id', voter.id);

      if (delErr) throw delErr;
      showToast("Pemilih berhasil dihapus dari DPT.");
      fetchVotingData();
    } catch (err: any) {
      alert("Gagal menghapus pemilih: " + err.message);
    }
  };

  // Download Template Excel Panduan Format DPT
  const handleDownloadTemplate = () => {
    try {
      const templateData = [
        {
          "Nama Lengkap": "dr. H. Ahmad Fauzi, Sp.PD, K-EMD",
          "Cabang PERSADIA": "Cabang Jawa Barat",
          "No WhatsApp": "081234567890",
          "Catatan": "Ketua Delegasi Cabang",
          "Token (Opsional)": ""
        },
        {
          "Nama Lengkap": "dr. Siti Rahmawati, Sp.A",
          "Cabang PERSADIA": "Cabang DKI Jakarta",
          "No WhatsApp": "081398765432",
          "Catatan": "Sekretaris Cabang",
          "Token (Opsional)": ""
        },
        {
          "Nama Lengkap": "dr. Budi Santoso, Sp.GK",
          "Cabang PERSADIA": "Cabang Jawa Timur",
          "No WhatsApp": "082155556666",
          "Catatan": "Anggota Delegasi",
          "Token (Opsional)": ""
        }
      ];

      const worksheet = XLSX.utils.json_to_sheet(templateData);
      worksheet['!cols'] = [
        { wch: 35 },
        { wch: 25 },
        { wch: 18 },
        { wch: 25 },
        { wch: 20 }
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Format_DPT_Voting");
      XLSX.writeFile(workbook, "Template_DPT_Pemilihan_PERSADIA_2026.xlsx");
      showToast("Template Excel DPT berhasil diunduh!");
    } catch (err: any) {
      console.error("Gagal membuat template excel:", err);
      const link = document.createElement('a');
      link.href = '/Template_DPT_Pemilihan_PERSADIA_2026.xlsx';
      link.download = 'Template_DPT_Pemilihan_PERSADIA_2026.xlsx';
      link.click();
    }
  };

  // Handler Parse File Excel / CSV yang diupload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkFile(file);
    setParseErrors([]);
    setImportSummary(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (!jsonData || jsonData.length === 0) {
          setParseErrors(["File Excel kosong atau tidak memiliki baris data."]);
          setParsedRows([]);
          return;
        }

        const validRows: any[] = [];
        const errors: string[] = [];

        jsonData.forEach((row, idx) => {
          const rowNum = idx + 2;

          const nama = (
            row["Nama Lengkap"] || row["nama_lengkap"] || row["Nama"] || row["nama"] || row["NAMA"] || ""
          ).toString().trim();

          const cabang = (
            row["Cabang PERSADIA"] || row["cabang_persadia"] || row["Cabang"] || row["cabang"] || row["CABANG"] || ""
          ).toString().trim();

          let wa = (
            row["No WhatsApp"] || row["WhatsApp"] || row["whatsapp"] || row["No WA"] || row["Telepon"] || row["No HP"] || row["phone"] || ""
          ).toString().trim();

          if (wa) {
            wa = wa.replace(/[^\d+]/g, '');
          }

          const catatan = (
            row["Catatan"] || row["catatan"] || row["Keterangan"] || row["keterangan"] || ""
          ).toString().trim();

          const customToken = (
            row["Token (Opsional)"] || row["Token"] || row["token"] || row["TOKEN"] || ""
          ).toString().trim().toUpperCase();

          if (!nama && !cabang) {
            return;
          }

          if (!nama) {
            errors.push(`Baris ${rowNum}: Nama Lengkap wajib diisi.`);
            return;
          }

          if (!cabang) {
            errors.push(`Baris ${rowNum}: Cabang PERSADIA wajib diisi.`);
            return;
          }

          validRows.push({
            nama_lengkap: nama,
            cabang_persadia: cabang,
            whatsapp: wa || null,
            catatan: catatan || null,
            token: customToken || undefined
          });
        });

        if (validRows.length === 0 && errors.length === 0) {
          errors.push("Tidak ditemukan data valid dalam file. Pastikan kolom 'Nama Lengkap' dan 'Cabang PERSADIA' ada.");
        }

        setParsedRows(validRows);
        setParseErrors(errors);
      } catch (err: any) {
        console.error("Gagal membaca file excel:", err);
        setParseErrors(["Gagal membaca file: " + err.message]);
        setParsedRows([]);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Handler Eksekusi Simpan Bulk DPT ke Database
  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return;

    setIsImporting(true);
    try {
      const existingTokens = new Set(dptList.map(v => v.token.toUpperCase()));
      const generatedInThisBatch = new Set<string>();

      const rowsToInsert = parsedRows.map(row => {
        let finalToken = row.token;

        if (!finalToken || existingTokens.has(finalToken) || generatedInThisBatch.has(finalToken)) {
          do {
            finalToken = generateCleanToken();
          } while (existingTokens.has(finalToken) || generatedInThisBatch.has(finalToken));
        }

        generatedInThisBatch.add(finalToken);

        return {
          nama_lengkap: row.nama_lengkap,
          cabang_persadia: row.cabang_persadia,
          whatsapp: row.whatsapp,
          catatan: row.catatan,
          token: finalToken,
          status_memilih: false,
          waktu_memilih: null
        };
      });

      const { error: insertErr } = await supabase
        .from('voting_dpt')
        .insert(rowsToInsert);

      if (insertErr) throw insertErr;

      setImportSummary({
        total: parsedRows.length,
        success: rowsToInsert.length
      });

      showToast(`Berhasil menambahkan ${rowsToInsert.length} delegasi DPT!`);
      await fetchVotingData();
    } catch (err: any) {
      console.error("Gagal import DPT:", err);
      alert("Terjadi kesalahan saat menyimpan ke database: " + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  // Handler Ubah Status Sesi Sidang (Draft / Open / Closed)
  const handleUpdateSessionStatus = async (newStatus: 'draft' | 'open' | 'closed') => {
    const statusLabel =
      newStatus === 'open' ? 'MEMBUKA SESI PEMILIHAN (LIVE)' :
      newStatus === 'closed' ? 'MENUTUP SESI PEMILIHAN' : 'MENGEMBALIKAN KE DRAFT';

    const confirmMsg = `Konfirmasi Presidium Sidang:\n\nApakah Anda yakin ingin ${statusLabel}?\n` +
      (newStatus === 'open' ? 'Pemilih dapat langsung mencoblos.' :
       newStatus === 'closed' ? 'Pemilih tidak dapat lagi mengirimkan suara.' : '');

    if (!window.confirm(confirmMsg)) return;

    try {
      const { error: updErr } = await supabase
        .from('voting_config')
        .upsert({ key: 'status_pemilihan', value: newStatus, updated_at: new Date().toISOString() }, { onConflict: 'key' });

      if (updErr) throw updErr;
      setSessionStatus(newStatus);
      showToast(`Status sesi sidang: ${newStatus.toUpperCase()}`);
      fetchVotingData();
    } catch (err: any) {
      alert("Gagal mengubah status sidang: " + err.message);
    }
  };

  // Handler Toggle Quick Count Real-time
  const handleToggleQuickCount = async () => {
    const nextVal = !showQuickCount;
    try {
      const { error: updErr } = await supabase
        .from('voting_config')
        .upsert({ key: 'tampilkan_quick_count', value: nextVal ? 'true' : 'false', updated_at: new Date().toISOString() }, { onConflict: 'key' });

      if (updErr) throw updErr;
      setShowQuickCount(nextVal);
      showToast(nextVal ? "Hasil suara live diaktifkan untuk layar proyektor." : "Hasil suara disembunyikan dari layar proyektor.");
      fetchVotingData();
    } catch (err: any) {
      alert("Gagal update quick count setting: " + err.message);
    }
  };

  // State & Handler Reset Data Simulasi
  const [isResetting, setIsResetting] = useState(false);

  const handleResetVoting = async (mode: 'votes_only' | 'all') => {
    const confirmMsg = mode === 'votes_only'
      ? "PERINGATAN RESMI:\n\nApakah Anda yakin ingin MENGOSONGKAN KOTAK SUARA?\n\n• Seluruh suara masuk simulasi akan dihapus (kembali 0).\n• Token semua delegasi DPT akan dihidupkan kembali (bisa memilih ulang).\n• Status sidang dikembalikan ke 'Draft'.\n• Daftar nama pemilih DPT dan Kandidat TIDAK AKAN DIHAPUS."
      : "PERINGATAN KERAS (RESET TOTAL):\n\nApakah Anda yakin ingin MENGHAPUS SEMUA DATA UJI COBA?\n\n• Seluruh suara masuk akan dihapus.\n• Seluruh delegasi pemilih DPT simulasi akan DIHAPUS PERMANEN.\n• Seluruh kandidat simulasi akan DIHAPUS PERMANEN.\n• Sistem akan kembali ke kondisi kosong total seperti baru dipasang.";

    if (!window.confirm(confirmMsg)) return;

    setIsResetting(true);
    try {
      // 1. Coba panggil RPC PostgreSQL atomik
      const { data, error } = await supabase.rpc('reset_voting_data', { p_mode: mode });

      if (error) {
        // Fallback langsung jika RPC belum dieksekusi di Supabase
        if (mode === 'votes_only') {
          await supabase.from('voting_suara').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('voting_dpt').update({ status_memilih: false, waktu_memilih: null }).neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('voting_config').update({ value: 'draft' }).eq('key', 'status_pemilihan');
          await supabase.from('voting_config').update({ value: 'false' }).eq('key', 'tampilkan_quick_count');
          await supabase.from('voting_config').update({ value: '1' }).eq('key', 'putaran_voting');
          await supabase.from('voting_config').update({ value: '[]' }).eq('key', 'kandidat_putaran_2');
        } else {
          await supabase.from('voting_suara').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('voting_dpt').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('voting_kandidat').delete().neq('id', -999);
          await supabase.from('voting_config').update({ value: 'draft' }).eq('key', 'status_pemilihan');
          await supabase.from('voting_config').update({ value: 'false' }).eq('key', 'tampilkan_quick_count');
          await supabase.from('voting_config').update({ value: '1' }).eq('key', 'putaran_voting');
          await supabase.from('voting_config').update({ value: '[]' }).eq('key', 'kandidat_putaran_2');
        }
      }

      showToast(mode === 'votes_only' ? "Kotak suara berhasil dikosongkan!" : "Seluruh data dummy berhasil dibersihkan!");
      fetchVotingData();
    } catch (err: any) {
      alert("Gagal melakukan reset: " + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  // Handler Memulai Pemilihan Putaran Kedua (Run-Off)
  const handleStartRound2 = async (candidateIds: number[]) => {
    if (!isSupabaseConfigured) return;
    const candNames = candidates
      .filter(c => candidateIds.includes(c.id))
      .map(c => `Calon No. ${c.nomor_urut} (${c.nama_kandidat})`)
      .join(' dan ');

    const confirmMsg =
      `PERINGATAN RESMI PEMILIHAN PUTARAN KEDUA (RUN-OFF):\n\n` +
      `1. Kotak suara akan dikosongkan (0 suara) untuk babak final.\n` +
      `2. Seluruh ${dptList.length} pemilih DPT akan diaktifkan kembali statusnya agar dapat mencoblos ulang.\n` +
      `3. Surat suara dan layar proyektor HANYA akan menampilkan kandidat seri: ${candNames}.\n` +
      `4. Status sesi pemilihan akan langsung DIBUKA (OPEN).\n\n` +
      `Apakah Presidium Sidang & Panlih menyetujui pembukaan Putaran Kedua sekarang?`;

    if (!window.confirm(confirmMsg)) return;

    setIsResetting(true);
    try {
      // 1. Kosongkan tabel voting_suara
      const { error: errSuara } = await supabase
        .from('voting_suara')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      if (errSuara) throw errSuara;

      // 2. Reset status memilih DPT
      const { error: errDpt } = await supabase
        .from('voting_dpt')
        .update({ status_memilih: false, waktu_memilih: null })
        .neq('id', '00000000-0000-0000-0000-000000000000');
      if (errDpt) throw errDpt;

      // 3. Update voting_config
      const updates = [
        { key: 'putaran_voting', value: '2' },
        { key: 'kandidat_putaran_2', value: JSON.stringify(candidateIds) },
        { key: 'status_pemilihan', value: 'open' },
        { key: 'tampilkan_quick_count', value: 'false' },
      ];

      for (const u of updates) {
        await supabase.from('voting_config').upsert({ key: u.key, value: u.value });
      }

      showToast("Pemilihan Putaran Kedua resmi dibuka! Kotak suara disiapkan & token DPT diaktifkan kembali.");
      await fetchVotingData();
    } catch (err: any) {
      console.error("Gagal memulai putaran kedua:", err);
      alert("Gagal memulai putaran kedua: " + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  // Handler Kembalikan Konfigurasi ke Putaran 1
  const handleResetToRound1 = async () => {
    if (!isSupabaseConfigured) return;
    if (!window.confirm("Kembalikan konfigurasi pemilihan ke Putaran 1 normal (seluruh kandidat)?")) return;

    setIsResetting(true);
    try {
      await supabase.from('voting_config').upsert({ key: 'putaran_voting', value: '1' });
      await supabase.from('voting_config').upsert({ key: 'kandidat_putaran_2', value: '[]' });
      showToast("Sistem dikembalikan ke Putaran 1 normal.");
      await fetchVotingData();
    } catch (err: any) {
      alert("Gagal reset ke putaran 1: " + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  // Salin Token ke Clipboard
  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    showToast(`Token ${token} disalin ke clipboard!`);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  // Salin Magic Link ke Clipboard
  const handleCopyMagicLink = (token: string) => {
    const link = `${window.location.origin}/#vote?token=${token}`;
    navigator.clipboard.writeText(link);
    showToast(`Magic link disalin: ${link}`);
  };

  // Handler Kirim Undangan & Token via WhatsApp
  const handleSendWhatsApp = (voter: VoterDPT) => {
    let phone = voter.whatsapp ? voter.whatsapp.trim().replace(/\D/g, '') : '';
    if (!phone) {
      const inputPhone = window.prompt(
        `Delegasi ${voter.nama_lengkap} belum memiliki nomor WhatsApp tercatat.\n\nMasukkan nomor WhatsApp delegasi untuk membuka chat (contoh: 08123456789):`,
        ''
      );
      if (!inputPhone) return;
      phone = inputPhone.trim().replace(/\D/g, '');
    }

    if (phone.startsWith('0')) {
      phone = '62' + phone.slice(1);
    } else if (phone.startsWith('8')) {
      phone = '62' + phone;
    }

    const magicLink = `${window.location.origin}/#vote?token=${voter.token}`;
    const roundInfo = putaranVoting === '2' ? ' *PUTARAN KE-2 (RUN-OFF)*' : '';
    const message =
      `*UNDANGAN PEMILIHAN RESMI (E-VOTING)${roundInfo}*\n` +
      `*KONGRES NASIONAL PERSADIA 2026*\n\n` +
      `Kepada Yth. Delegasi Sah Cabang:\n` +
      `*${voter.nama_lengkap}* (${voter.cabang_persadia})\n\n` +
      `Berikut adalah kode akses resmi untuk memberikan hak suara dalam Pemilihan Ketua Pengurus Besar PERSADIA Periode 2029–2032:\n\n` +
      `🔑 *KODE TOKEN SUARA:* \`${voter.token}\`\n\n` +
      `🗳️ *Akses Langsung Bilik Suara:*\n` +
      `${magicLink}\n\n` +
      `_Petunjuk Penggunaan:_\n` +
      `1. Klik tautan bilik suara di atas atau buka menu Pemilihan di sistem Kongres.\n` +
      `2. Masukkan kode token Anda.\n` +
      `3. Pelajari rekam jejak calon, lalu tentukan pilihan Anda.\n` +
      `4. Satu token hanya dapat digunakan 1 (satu) kali dan akan hangus otomatis setelah suara terkirim.\n\n` +
      `_Kerahasiaan pilihan suara Anda dijamin sepenuhnya oleh sistem LUBER Sidang Pleno._\n\n` +
      `Salam hangat,\n` +
      `*Panitia Pemilihan - KONAS PERSADIA 2026*`;

    const waUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  // Filter DPT (Mendukung cari nama, cabang, token, dan nomor WhatsApp)
  const filteredDpt = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const cleanQ = searchQuery.replace(/\D/g, '');

    return dptList.filter((voter) => {
      if (q) {
        const matchName = voter.nama_lengkap.toLowerCase().includes(q);
        const matchCabang = voter.cabang_persadia.toLowerCase().includes(q);
        const matchToken = voter.token.toLowerCase().includes(q);
        const matchPhoneText = voter.whatsapp ? voter.whatsapp.toLowerCase().includes(q) : false;
        const matchPhoneDigits = (cleanQ.length >= 3 && voter.whatsapp)
          ? voter.whatsapp.replace(/\D/g, '').includes(cleanQ)
          : false;

        const matchSearch = matchName || matchCabang || matchToken || matchPhoneText || matchPhoneDigits;
        if (!matchSearch) return false;
      }

      if (statusFilter === "sudah") return voter.status_memilih;
      if (statusFilter === "belum") return !voter.status_memilih;
      return true;
    });
  }, [dptList, searchQuery, statusFilter]);

  // Statistik Ringkas
  const stats = useMemo(() => {
    const total = dptList.length;
    const sudah = dptList.filter(v => v.status_memilih).length;
    const belum = total - sudah;
    const persen = total > 0 ? Math.round((sudah / total) * 100) : 0;
    return { total, sudah, belum, persen };
  }, [dptList]);

  // Deteksi Suara Seri (Tie / Draw)
  const sortedCandidates = candidates && candidates.length > 0
    ? [...candidates].sort((a, b) => (b.total_suara ?? 0) - (a.total_suara ?? 0))
    : [];
  const highestVotes = sortedCandidates.length > 0 ? (sortedCandidates[0].total_suara ?? 0) : 0;
  const topTiedCandidates = sortedCandidates.filter(c => (c.total_suara ?? 0) === highestVotes && (c.total_suara ?? 0) > 0);
  const isTie = topTiedCandidates.length >= 2;
  const isRound2 = putaranVoting === '2';

  // ==========================================================================
  // VIEW: FORM LOGIN ADMIN PANLIH (LIGHT THEME)
  // ==========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-center items-center p-4 relative">
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] opacity-50 z-0" />

        <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/60 relative z-10 space-y-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 inline-block border border-emerald-200">
              PORTAL KHUSUS PANLIH
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Dashboard Sidang Pemilihan
            </h1>
            <p className="text-xs text-slate-500">
              Pemilihan Presiden Pengurus Besar PERSADIA 2029–2032
            </p>
          </div>

          {authError && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Passcode Panitia Pemilihan
              </label>
              <input
                type="password"
                required
                placeholder="Masukkan passcode panlih..."
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-emerald-600 focus:bg-white text-slate-900 text-center font-mono font-bold tracking-widest text-lg outline-none transition shadow-inner placeholder:text-slate-400 placeholder:text-xs placeholder:font-sans placeholder:tracking-normal"
              />
              <p className="text-[11px] text-slate-400 mt-2 text-center">
                Default passcode panitia: <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold font-mono">panlih2026</code>
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn || !passcode.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              <span>Buka Dashboard Sidang</span>
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={onNavigateHome}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
            >
              &larr; Kembali ke Halaman Utama
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // VIEW: MAIN DASHBOARD ADMIN (LIGHT THEME)
  // ==========================================================================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between selection:bg-emerald-500 selection:text-white relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-2xl flex items-center gap-2 border border-slate-700 animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Admin Navbar */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="w-full px-4 sm:px-8 lg:px-12 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-slate-900 tracking-tight">
                  PANLIH &bull; PRESIDIUM SIDANG
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  sessionStatus === 'open' ? 'bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse' :
                  sessionStatus === 'closed' ? 'bg-red-100 text-red-800 border-red-300' :
                  'bg-slate-100 text-slate-700 border-slate-300'
                }`}>
                  {sessionStatus === 'open' ? '🟢 Sesi Live (Dibuka)' :
                   sessionStatus === 'closed' ? '🔴 Sesi Ditutup' : '⚪ DRAFT (Belum Dibuka)'}
                </span>
                {isRound2 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 border border-amber-600 shadow-2xs flex items-center gap-1 animate-pulse">
                    <Scale className="w-3 h-3" />
                    Putaran Ke-2
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Pemilihan Presiden Pengurus Besar PERSADIA 2029–2032
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onOpenVotingPage()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl transition cursor-pointer shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka Bilik Suara</span>
            </button>

            <button
              onClick={onOpenLiveProjector}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs font-bold rounded-xl transition cursor-pointer shadow-2xs"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Layar Proyektor Pleno</span>
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
              title="Keluar"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full px-4 sm:px-8 lg:px-12 py-6 sm:py-8 space-y-6">

        {/* 4 Kartu Metrik Utama */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total DPT Cabang</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.total}</span>
              <span className="text-[11px] text-slate-500">Delegasi berhak suara</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Suara Masuk</span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block">{stats.sudah}</span>
              <span className="text-[11px] text-emerald-700 font-semibold">{stats.persen}% Partisipasi</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Belum Memilih</span>
              <span className="text-2xl font-black text-amber-600 mt-1 block">{stats.belum}</span>
              <span className="text-[11px] text-slate-500">Menunggu suara</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Calon Kandidat</span>
              <span className="text-2xl font-black text-indigo-600 mt-1 block">{candidates.length}</span>
              <span className="text-[11px] text-slate-500">Terdaftar di bilik suara</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Vote className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Tab Navigation Segmented Bar */}
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200 pb-2">
          <div className="bg-slate-200/70 p-1.5 rounded-2xl flex items-center gap-1.5 shadow-inner">
            <button
              onClick={() => setActiveTab('dpt')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'dpt'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Daftar Pemilih (DPT)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">
                {dptList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('kandidat')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'kandidat'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Vote className="w-4 h-4" />
              <span>Calon Kandidat &amp; CV</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">
                {candidates.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('sidang')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'sidang'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Kendali Sidang &amp; Rekap</span>
            </button>
          </div>

          <button
            onClick={fetchVotingData}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Muat ulang data"
          >
            <RefreshCw className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Segarkan Data</span>
          </button>
        </div>

        {/* ==================================================================== */}
        {/* TAB 1: DAFTAR PEMILIH TETAP (DPT) */}
        {/* ==================================================================== */}
        {activeTab === 'dpt' && (
          <div className="space-y-4">
            {/* Toolbar Atas */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 max-w-xl">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Cari nama, cabang, token, atau no. telepon/WA..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs outline-none focus:border-emerald-600 shadow-2xs"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs outline-none focus:border-emerald-600 shadow-2xs"
                >
                  <option value="semua">Semua Status</option>
                  <option value="belum">Belum Memilih</option>
                  <option value="sudah">Sudah Memilih</option>
                </select>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleDownloadTemplate}
                  type="button"
                  className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Unduh format panduan Excel DPT"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Template Excel</span>
                </button>

                <button
                  onClick={() => {
                    setIsBulkModalOpen(true);
                    setBulkFile(null);
                    setParsedRows([]);
                    setParseErrors([]);
                    setImportSummary(null);
                  }}
                  type="button"
                  className="px-3.5 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Upload berkas Excel (.xlsx / .xls / .csv) untuk tambah DPT massal"
                >
                  <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                  <span>Upload Excel (Bulk)</span>
                </button>

                <button
                  onClick={() => {
                    setEditingDptId(null);
                    setDptFormData({ nama_lengkap: "", whatsapp: "", cabang_persadia: "", catatan: "" });
                    setIsDptModalOpen(true);
                  }}
                  type="button"
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Tambah Manual</span>
                </button>
              </div>
            </div>

            {/* Tabel DPT */}
            <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Nama Delegasi &amp; WhatsApp</th>
                      <th className="px-5 py-3.5">Utusan Cabang</th>
                      <th className="px-5 py-3.5">Token Rahasia</th>
                      <th className="px-5 py-3.5">Status Hak Suara</th>
                      <th className="px-5 py-3.5 text-right">Aksi Operasional</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDpt.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                          Tidak ada data pemilih DPT yang cocok dengan pencarian.
                        </td>
                      </tr>
                    ) : (
                      filteredDpt.map((voter) => (
                        <tr key={voter.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-5 py-3.5">
                            <span className="font-bold text-slate-900 block text-sm">{voter.nama_lengkap}</span>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {voter.whatsapp ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  <MessageCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span>{voter.whatsapp}</span>
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">No WA belum dicatat</span>
                              )}
                              {voter.catatan && (
                                <span className="text-[11px] text-slate-400 italic">• {voter.catatan}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="font-semibold text-slate-800 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{voter.cabang_persadia}</span>
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <code className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-mono font-bold text-xs border border-emerald-200">
                                {voter.token}
                              </code>
                              <button
                                onClick={() => handleCopyToken(voter.token)}
                                className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                                title="Salin Token"
                              >
                                {copiedToken === voter.token ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            {voter.status_memilih ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                <span>Sudah Memilih</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>Belum Memilih</span>
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Tombol Kirim WhatsApp */}
                              <button
                                onClick={() => handleSendWhatsApp(voter)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition shadow-2xs cursor-pointer"
                                title="Kirim Token & Link Undangan Pemilihan via WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>Kirim WA</span>
                              </button>

                              <button
                                onClick={() => handleCopyMagicLink(voter.token)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition cursor-pointer"
                                title="Salin link langsung voting untuk pemilih ini"
                              >
                                Salin Link
                              </button>

                              {!voter.status_memilih && (
                                <button
                                  onClick={() => handleRegenerateToken(voter.id)}
                                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-semibold transition cursor-pointer"
                                  title="Ganti token baru jika hilang"
                                >
                                  Token Baru
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setEditingDptId(voter.id);
                                  setDptFormData({
                                    nama_lengkap: voter.nama_lengkap,
                                    whatsapp: voter.whatsapp || "",
                                    cabang_persadia: voter.cabang_persadia,
                                    catatan: voter.catatan || ""
                                  });
                                  setIsDptModalOpen(true);
                                }}
                                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-semibold transition cursor-pointer"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => handleDeleteDpt(voter)}
                                className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition cursor-pointer"
                                title="Hapus Pemilih"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: DATA CALON KANDIDAT & CV */}
        {/* ==================================================================== */}
        {activeTab === 'kandidat' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Daftar Calon Ketua PB PERSADIA Periode 2029–2032
                </h2>
                <p className="text-xs text-slate-500">
                  Profil dan CV calon yang akan ditampilkan pada bilik suara elektronik delegasi
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingCandidateId(null);
                  setCandidateFormData({
                    nomor_urut: candidates.length + 1,
                    nama_kandidat: "",
                    gelar: "",
                    institusi: "",
                    foto_url: "",
                    visi: "",
                    misi: "",
                    cv_url: "",
                    ringkasan_cv: ""
                  });
                  setIsCandidateModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah Calon Baru</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {candidates.map((cand) => (
                <div
                  key={cand.id}
                  className="bg-white border-2 border-slate-200/90 hover:border-emerald-500 rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-start gap-4">
                      {cand.foto_url ? (
                        <img
                          src={cand.foto_url}
                          alt={cand.nama_kandidat}
                          className="w-20 h-24 rounded-2xl object-cover border-2 border-slate-100 shadow-sm shrink-0 bg-slate-100"
                        />
                      ) : (
                        <div className="w-20 h-24 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center shrink-0">
                          <Vote className="w-8 h-8 text-emerald-600" />
                        </div>
                      )}

                      <div className="space-y-1">
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white font-mono font-bold text-xs inline-block shadow-2xs">
                          NO. URUT {cand.nomor_urut}
                        </span>
                        <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                          {cand.nama_kandidat}
                        </h3>
                        {cand.gelar && (
                          <p className="text-xs text-emerald-700 font-semibold">{cand.gelar}</p>
                        )}
                        {cand.institusi && (
                          <p className="text-xs text-slate-500 line-clamp-2">{cand.institusi}</p>
                        )}
                      </div>
                    </div>

                    {cand.visi && (
                      <div className="pt-3 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                          Visi Utama:
                        </span>
                        <p className="text-xs text-slate-600 italic leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                          "{cand.visi}"
                        </p>
                      </div>
                    )}

                    {cand.misi && (
                      <div>
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                          Misi Utama:
                        </span>
                        <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed line-clamp-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                          {cand.misi}
                        </p>
                      </div>
                    )}

                    {cand.cv_url && (
                      <div className="pt-1">
                        <a
                          href={cand.cv_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold transition w-full justify-center"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Link Dokumen CV / Berkas</span>
                          <ExternalLink className="w-3 h-3 text-emerald-700" />
                        </a>
                      </div>
                    )}

                    {cand.ringkasan_cv && (
                      <div>
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                          Rekam Jejak &amp; CV Singkat:
                        </span>
                        <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed line-clamp-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                          {cand.ringkasan_cv}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      Total Suara Masuk: <strong className="text-slate-900 font-bold">{cand.total_suara ?? 0} suara</strong>
                    </span>
                    <button
                      onClick={() => {
                        setEditingCandidateId(cand.id);
                        setCandidateFormData({
                          nomor_urut: cand.nomor_urut,
                          nama_kandidat: cand.nama_kandidat,
                          gelar: cand.gelar || "",
                          institusi: cand.institusi || "",
                          foto_url: cand.foto_url || "",
                          visi: cand.visi || "",
                          misi: cand.misi || "",
                          cv_url: cand.cv_url || "",
                          ringkasan_cv: cand.ringkasan_cv || ""
                        });
                        setIsCandidateModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                    >
                      Edit Profil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 3: KENDALI SIDANG & REKAPITULASI SUARA */}
        {/* ==================================================================== */}
        {activeTab === 'sidang' && (
          <div className="space-y-6">
            {/* Master Control Sesi Sidang */}
            <div className="bg-white border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                      MASTER CONTROL PRESIDIUM
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      Status: {sessionStatus.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900">
                    Kendali Pembukaan &amp; Penutupan Sidang Pemilihan
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Buka sesi pemilihan saat Presidium Sidang secara resmi mempersilakan delegasi mencoblos. Tutup sesi pemilihan setelah batas waktu pemungutan suara berakhir.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {sessionStatus !== 'open' ? (
                    <button
                      onClick={() => handleUpdateSessionStatus('open')}
                      className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Unlock className="w-4 h-4" />
                      <span>BUKA SESI PEMILIHAN (LIVE)</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateSessionStatus('closed')}
                      className="px-6 py-3.5 bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-bold text-sm rounded-2xl shadow-lg shadow-red-600/25 transition flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                    >
                      <Lock className="w-4 h-4" />
                      <span>TUTUP SESI PEMILIHAN</span>
                    </button>
                  )}

                  {sessionStatus === 'closed' && (
                    <button
                      onClick={() => handleUpdateSessionStatus('draft')}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-2xl transition cursor-pointer"
                    >
                      Kembalikan ke Draft
                    </button>
                  )}
                </div>
              </div>

              {/* Saklar Quick Count */}
              <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className={`w-3.5 h-3.5 rounded-full ${showQuickCount ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'}`} />
                  <div>
                    <span className="font-bold text-slate-900 block">Tampilkan Quick Count Real-time di Layar Proyektor</span>
                    <span className="text-slate-500 text-[11px]">
                      {showQuickCount ? "Grafik perolehan suara tampil live di layar sidang." : "Grafik suara disembunyikan sampai sesi ditutup resmi oleh Presidium."}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleToggleQuickCount}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-2 shadow-2xs ${
                    showQuickCount ? "bg-emerald-600 text-white shadow-emerald-600/20" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {showQuickCount ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{showQuickCount ? "Hasil Live: AKTIF DITAMPILKAN" : "Hasil Live: DISEMBUNYIKAN"}</span>
                </button>
              </div>
            </div>

            {/* ============================================================== */}
            {/* KONTROL SKENARIO SUARA SERI & PUTARAN KEDUA (RUN-OFF) */}
            {/* ============================================================== */}
            {isRound2 ? (
              // Status Aktif Putaran Kedua
              <div className="bg-amber-50/80 border-2 border-amber-300 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                      <Scale className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold text-xs uppercase tracking-wider">
                        Sesi Putaran Ke-2 (Run-Off) Aktif
                      </div>
                      <h3 className="text-lg font-black text-amber-950">
                        Pemilihan Putaran Kedua Sedang Berlangsung
                      </h3>
                      <p className="text-xs text-amber-900/80 leading-relaxed max-w-xl">
                        Surat suara di bilik pemilih saat ini telah dibatasi hanya untuk kandidat yang bertanding di putaran kedua. Delegasi DPT dapat mencoblos menggunakan token masing-masing.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleResetToRound1}
                    disabled={isResetting}
                    className="px-4 py-2.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 self-start sm:self-center"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                    <span>Kembalikan ke Putaran 1</span>
                  </button>
                </div>
              </div>
            ) : isTie ? (
              // Terdeteksi Suara Seri (Draw) pada Calon Teratas
              <div className="bg-gradient-to-r from-amber-50 via-amber-100/60 to-amber-50 border-2 border-amber-400 rounded-3xl p-6 sm:p-7 shadow-md space-y-5 animate-pulse">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-lg">
                      <Scale className="w-7 h-7" />
                    </div>
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-300 text-amber-950 font-black text-xs uppercase tracking-wider shadow-2xs">
                        ⚠️ Terdeteksi Hasil Seri (Draw)
                      </div>
                      <h3 className="text-xl font-black text-amber-950">
                        Perolehan Suara Tertinggi Seimbang ({highestVotes} Suara)
                      </h3>
                      <p className="text-xs text-amber-900 leading-relaxed max-w-2xl">
                        Terdapat {topTiedCandidates.length} calon dengan perolehan suara tertinggi yang sama persis:{' '}
                        <strong>
                          {topTiedCandidates.map(c => `Calon No. ${c.nomor_urut} (${c.nama_kandidat})`).join(', ')}
                        </strong>
                        . Presidium Sidang dapat menginstruksikan pemungutan suara putaran kedua (run-off).
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button
                      onClick={() => handleStartRound2(topTiedCandidates.map(c => c.id))}
                      disabled={isResetting}
                      className="px-6 py-3.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-amber-500/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scale className="w-4 h-4" />}
                      <span>BUKA PEMILIHAN PUTARAN KE-2</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/80 border border-amber-200 text-xs text-amber-950 space-y-1">
                  <strong className="block font-bold">Mekanisme Putaran Ke-2:</strong>
                  <ul className="list-disc list-inside space-y-0.5 text-amber-900/90 text-[11px]">
                    <li>Kotak suara dikosongkan (0 suara) khusus untuk sesi putaran kedua.</li>
                    <li>Token seluruh {stats.total} pemilih DPT diaktifkan kembali agar dapat mencoblos ulang.</li>
                    <li>Pilihan di bilik suara dan layar hasil proyektor otomatis difilter hanya menampilkan kandidat yang seri di atas.</li>
                  </ul>
                </div>
              </div>
            ) : null}

            {/* Rekapitulasi Suara Live Tally */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Hasil Rekapitulasi Suara Masuk</h3>
                  <p className="text-xs text-slate-500">
                    Total Suara Masuk: <strong className="text-slate-900">{stats.sudah} dari {stats.total} DPT ({stats.persen}%)</strong>
                  </p>
                </div>
                <button
                  onClick={fetchVotingData}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                  title="Segarkan data hasil"
                >
                  <RefreshCw className="w-4 h-4 text-emerald-600" />
                </button>
              </div>

              {/* Progress Bars per Candidate */}
              <div className="space-y-4">
                {candidates.map((cand) => {
                  const votes = cand.total_suara ?? 0;
                  const percent = stats.sudah > 0 ? Math.round((votes / stats.sudah) * 100) : 0;

                  return (
                    <div key={cand.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center font-mono shadow-2xs">
                            {cand.nomor_urut}
                          </span>
                          <div>
                            <span className="font-extrabold text-slate-900 text-sm block">{cand.nama_kandidat}</span>
                            <span className="text-xs text-emerald-800 font-semibold">{cand.gelar || cand.institusi || ''}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-lg font-black text-slate-900 block">{votes} Suara</span>
                          <span className="text-xs text-emerald-600 font-bold">{percent}%</span>
                        </div>
                      </div>

                      {/* Bar Visualizer */}
                      <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-700"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Area Bahaya: Reset Simulasi & Pembersihan Data */}
            <div className="bg-red-50/70 border border-red-200 rounded-3xl p-6 sm:p-7 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center shrink-0 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-red-900">Pembersihan Data Uji Coba &amp; Reset Simulasi</h3>
                  <p className="text-xs text-red-700/80">
                    Setelah panitia selesai melakukan simulasi, gunakan opsi di bawah ini agar kotak suara kembali 0 suara sebelum hari-H pemilihan resmi.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Opsi 1: Kosongkan Kotak Suara & Reset Token */}
                <div className="bg-white border border-red-200 rounded-2xl p-5 flex flex-col justify-between space-y-3 shadow-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-900 text-xs block">Opsi 1: Reset Kotak Suara &amp; Token (0 Suara)</span>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Menghapus seluruh perolehan suara (menjadi 0) dan mengaktifkan kembali token semua pemilih DPT. <strong>Nama kandidat dan daftar DPT tetap utuh aman.</strong>
                    </p>
                  </div>
                  <button
                    onClick={() => handleResetVoting('votes_only')}
                    disabled={isResetting}
                    className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isResetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                    <span>Kosongkan Suara Masuk (Nol-kan)</span>
                  </button>
                </div>

                {/* Opsi 2: Reset Total / Hapus Semua Data Dummy */}
                <div className="bg-white border border-red-300 rounded-2xl p-5 flex flex-col justify-between space-y-3 shadow-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-red-700 text-xs block">Opsi 2: Bersihkan Seluruh Data Uji Coba (Reset Total)</span>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Menghapus semua suara masuk, seluruh pemilih DPT simulasi, dan seluruh kandidat dummy. Sistem kembali kosong total.
                    </p>
                  </div>
                  <button
                    onClick={() => handleResetVoting('all')}
                    disabled={isResetting}
                    className="w-full py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isResetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    <span>Hapus Bersih Semua Data Dummy</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ==================================================================== */}
      {/* MODAL TAMBAH / EDIT DPT (LIGHT THEME) */}
      {/* ==================================================================== */}
      {isDptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingDptId ? "Edit Delegasi Pemilih DPT" : "Tambah Delegasi Pemilih DPT"}
              </h3>
              <button onClick={() => setIsDptModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDpt} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Delegasi *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: dr. ..."
                  value={dptFormData.nama_lengkap}
                  onChange={(e) => setDptFormData(prev => ({ ...prev, nama_lengkap: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs outline-none focus:border-emerald-600 focus:bg-white shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Utusan Cabang PERSADIA *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Cabang DKI Jakarta / Surabaya"
                  value={dptFormData.cabang_persadia}
                  onChange={(e) => setDptFormData(prev => ({ ...prev, cabang_persadia: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs outline-none focus:border-emerald-600 focus:bg-white shadow-2xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Nomor WhatsApp</label>
                  <span className="text-[10px] text-slate-400 font-medium">Opsional (Boleh Dikosongkan)</span>
                </div>
                <input
                  type="text"
                  placeholder="0812xxxx atau kosongkan"
                  value={dptFormData.whatsapp}
                  onChange={(e) => setDptFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs outline-none focus:border-emerald-600 focus:bg-white shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Delegasi (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Ketua Delegasi / Pengurus Cabang"
                  value={dptFormData.catatan}
                  onChange={(e) => setDptFormData(prev => ({ ...prev, catatan: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs outline-none focus:border-emerald-600 focus:bg-white shadow-2xs"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDptModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingDpt}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSavingDpt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Simpan Delegasi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL UPLOAD BULK DPT EXCEL (LIGHT THEME) */}
      {/* ==================================================================== */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold shadow-2xs">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Import Pemilih DPT Massal (Excel / CSV)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Upload daftar delegasi cabang sekaligus untuk membuat DPT dan token otomatis
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsBulkModalOpen(false);
                  setBulkFile(null);
                  setParsedRows([]);
                  setParseErrors([]);
                  setImportSummary(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sukses Import State */}
            {importSummary ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-black text-emerald-950">
                    Berhasil Mengimpor {importSummary.success} Delegasi DPT!
                  </h4>
                  <p className="text-xs text-emerald-800 max-w-md mx-auto">
                    Seluruh delegasi telah ditambahkan ke database dengan token rahasia yang siap dibagikan via WhatsApp atau dicetak kartu suaranya.
                  </p>
                </div>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setIsBulkModalOpen(false);
                      setBulkFile(null);
                      setParsedRows([]);
                      setParseErrors([]);
                      setImportSummary(null);
                    }}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    Selesai &amp; Lihat Tabel DPT
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Panduan & Tombol Download Template */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 block">Belum memiliki template Excel resmi?</span>
                    <span className="text-[11px] text-slate-500 block">
                      Download format panduan resmi dengan kolom: <em>Nama Lengkap, Cabang PERSADIA, No WhatsApp, Catatan, Token</em>.
                    </span>
                  </div>
                  <button
                    onClick={handleDownloadTemplate}
                    type="button"
                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Download Template</span>
                  </button>
                </div>

                {/* Upload File Zone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Pilih File Excel (.xlsx / .xls / .csv)
                  </label>
                  <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-50/20 rounded-2xl p-6 text-center cursor-pointer block transition group">
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Upload className="w-8 h-8 text-slate-400 group-hover:text-emerald-600 mx-auto mb-2 transition" />
                    <span className="text-xs font-bold text-slate-800 block">
                      {bulkFile ? bulkFile.name : "Klik untuk memilih berkas Excel atau Drag & Drop di sini"}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Mendukung format Microsoft Excel (.xlsx, .xls) dan CSV
                    </span>
                  </label>
                </div>

                {/* Error Parsing Box */}
                {parseErrors.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-amber-950">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Catatan Pengecekan Baris:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800 max-h-24 overflow-y-auto">
                      {parseErrors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Preview Data Siap Diimpor */}
                {parsedRows.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>Pratinjau: {parsedRows.length} Delegasi Terdeteksi</span>
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Token kosong akan otomatis dibuatkan sistem
                      </span>
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-600 font-bold text-[10px] uppercase sticky top-0">
                          <tr>
                            <th className="px-3 py-2">No</th>
                            <th className="px-3 py-2">Nama Delegasi</th>
                            <th className="px-3 py-2">Cabang</th>
                            <th className="px-3 py-2">WhatsApp</th>
                            <th className="px-3 py-2">Token</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[11px]">
                          {parsedRows.slice(0, 5).map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="px-3 py-1.5 text-slate-400 font-mono">{idx + 1}</td>
                              <td className="px-3 py-1.5 font-bold text-slate-900">{row.nama_lengkap}</td>
                              <td className="px-3 py-1.5 text-slate-700">{row.cabang_persadia}</td>
                              <td className="px-3 py-1.5 text-slate-600 font-mono">{row.whatsapp || "-"}</td>
                              <td className="px-3 py-1.5">
                                {row.token ? (
                                  <span className="font-mono text-emerald-700 font-bold">{row.token}</span>
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic">Auto-Generate</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {parsedRows.length > 5 && (
                      <p className="text-[11px] text-slate-400 text-center italic">
                        ... dan {parsedRows.length - 5} baris delegasi lainnya
                      </p>
                    )}
                  </div>
                )}

                {/* Footer Modal */}
                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsBulkModalOpen(false);
                      setBulkFile(null);
                      setParsedRows([]);
                      setParseErrors([]);
                    }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Batal
                  </button>

                  <button
                    type="button"
                    onClick={handleExecuteImport}
                    disabled={isImporting || parsedRows.length === 0}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Mengimpor ke Database...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Import {parsedRows.length > 0 ? `${parsedRows.length} Pemilih` : ''}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL TAMBAH / EDIT KANDIDAT (LIGHT THEME) */}
      {/* ==================================================================== */}
      {isCandidateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingCandidateId ? "Edit Calon Ketua Umum" : "Tambah Calon Ketua Umum Baru"}
              </h3>
              <button onClick={() => setIsCandidateModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsSavingCandidate(true);
              try {
                if (editingCandidateId) {
                  const { error: updErr } = await supabase
                    .from('voting_kandidat')
                    .update(candidateFormData)
                    .eq('id', editingCandidateId);
                  if (updErr) throw updErr;
                } else {
                  const { error: insErr } = await supabase
                    .from('voting_kandidat')
                    .insert([candidateFormData]);
                  if (insErr) throw insErr;
                }
                showToast("Data calon berhasil disimpan!");
                setIsCandidateModalOpen(false);
                fetchVotingData();
              } catch (err: any) {
                alert("Gagal simpan kandidat: " + err.message);
              } finally {
                setIsSavingCandidate(false);
              }
            }} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Urut *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={candidateFormData.nomor_urut}
                    onChange={(e) => setCandidateFormData(prev => ({ ...prev, nomor_urut: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs outline-none focus:border-emerald-600 focus:bg-white font-mono font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: dr. ..."
                    value={candidateFormData.nama_kandidat}
                    onChange={(e) => setCandidateFormData(prev => ({ ...prev, nama_kandidat: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Gelar Akademik &amp; Spesialisasi</label>
                <input
                  type="text"
                  placeholder="Contoh: Sp.PD-KEMD, FINASIM"
                  value={candidateFormData.gelar}
                  onChange={(e) => setCandidateFormData(prev => ({ ...prev, gelar: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Institusi / Rumah Sakit</label>
                <input
                  type="text"
                  placeholder="Contoh: RSUP Dr. Kariadi / FK Undip"
                  value={candidateFormData.institusi}
                  onChange={(e) => setCandidateFormData(prev => ({ ...prev, institusi: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">URL Foto Resmi</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={candidateFormData.foto_url}
                  onChange={(e) => setCandidateFormData(prev => ({ ...prev, foto_url: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Visi Calon</label>
                <textarea
                  rows={2}
                  placeholder="Visi calon ketua umum..."
                  value={candidateFormData.visi}
                  onChange={(e) => setCandidateFormData(prev => ({ ...prev, visi: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Misi Calon</label>
                <textarea
                  rows={3}
                  placeholder="Misi calon ketua umum (tiap poin pisahkan baris)..."
                  value={candidateFormData.misi}
                  onChange={(e) => setCandidateFormData(prev => ({ ...prev, misi: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Link Dokumen CV (PDF / Google Drive)
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/... atau https://.../cv.pdf"
                  value={candidateFormData.cv_url}
                  onChange={(e) => setCandidateFormData(prev => ({ ...prev, cv_url: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ringkasan Riwayat Hidup / Rekam Jejak (CV Singkat)
                </label>
                <textarea
                  rows={3}
                  placeholder="Pengalaman organisasi di PERSADIA, riwayat pendidikan, dsb..."
                  value={candidateFormData.ringkasan_cv}
                  onChange={(e) => setCandidateFormData(prev => ({ ...prev, ringkasan_cv: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCandidateModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingCandidate}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSavingCandidate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Simpan Calon</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        <p>&copy; 2026 Presidium Sidang Kongres Nasional PERSADIA. Seluruh Hak Cipta Dilindungi.</p>
      </footer>
    </div>
  );
}
