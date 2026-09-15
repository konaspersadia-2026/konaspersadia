import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScanner } from 'html5-qrcode';
import { supabase, isSupabaseConfigured } from '../src/lib/supabase';
import { CheckCircle2, XCircle, Search, RefreshCw, QrCode, ShieldAlert, ArrowLeft, CheckSquare, Square, LogOut, Flashlight } from 'lucide-react';

interface Pendaftar {
  "Timestamp": string;
  "No. Registrasi": string;
  "Status Pembayaran": string;
  "Nama Lengkap": string;
  "Kategori Peserta": string;
  [key: string]: any; // Allow dynamic checkpoint columns
}

// Opsi checkpoint yang bisa diedit/ditambah dengan mudah
export const CHECKPOINTS = [
  { id: "Registrasi_OnSite", label: "Registrasi On-Site", isMain: true }
];

function App() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [data, setData] = useState<Pendaftar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<Pendaftar | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  
  type ScannerMode = 'registrasi' | 'workshop' | 'pesta_rakyat' | 'makan_siang' | 'merchandise';
  const [scannerMode, setScannerMode] = useState<ScannerMode>('registrasi');

  // States for pemeriksaan
  const [tinggiBadan, setTinggiBadan] = useState("");
  const [beratBadan, setBeratBadan] = useState("");
  const [tensiSistolik, setTensiSistolik] = useState("");
  const [tensiDiastolik, setTensiDiastolik] = useState("");
  const [gulaDarah, setGulaDarah] = useState("");
  const [lingkarPerut, setLingkarPerut] = useState("");
  const [kesediaanData, setKesediaanData] = useState(false);
  const [gejalaNeuropati, setGejalaNeuropati] = useState(false);

  // Gunakan ref untuk menyimpan data terbaru agar useEffect scanner tidak perlu direstart saat data berubah
  const dataRef = useRef<Pendaftar[]>([]);

  useEffect(() => {
    if (selectedUser) {
      setTinggiBadan(selectedUser.tinggi_badan || "");
      setBeratBadan(selectedUser.berat_badan || "");
      const [sis, dia] = (selectedUser.tensi || "").split('/');
      setTensiSistolik(sis || "");
      setTensiDiastolik(dia || "");
      setGulaDarah(selectedUser.gula_darah || "");
      setLingkarPerut(selectedUser.lingkar_perut || "");
      setKesediaanData(selectedUser.kesediaan_data === 'Ya' || selectedUser.kesediaan_data === true);
      setGejalaNeuropati(selectedUser.gejala_neuropati === 'Ya' || selectedUser.gejala_neuropati === true);
    } else {
      setTinggiBadan("");
      setBeratBadan("");
      setTensiSistolik("");
      setTensiDiastolik("");
      setGulaDarah("");
      setLingkarPerut("");
      setKesediaanData(false);
      setGejalaNeuropati(false);
    }
  }, [selectedUser]);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const handleSimpanPemeriksaan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    setActionLoading('pemeriksaan');
    try {
      const { error: updateError } = await supabase
        .from('pendaftar')
        .update({
          tinggi_badan: tinggiBadan ? parseFloat(tinggiBadan) : null,
          berat_badan: beratBadan ? parseFloat(beratBadan) : null,
          tensi: (tensiSistolik && tensiDiastolik) ? `${tensiSistolik}/${tensiDiastolik}` : '',
          gula_darah: gulaDarah,
          lingkar_perut: lingkarPerut,
          kesediaan_data: kesediaanData ? 'Ya' : 'Tidak',
          gejala_neuropati: gejalaNeuropati ? 'Ya' : 'Tidak',
          cek_gula_darah: 'Ya'
        })
        .eq('no_registrasi', selectedUser["No. Registrasi"]);

      if (updateError) throw updateError;
      
      const updatedUser = { 
        ...selectedUser, 
        tinggi_badan: tinggiBadan, 
        berat_badan: beratBadan, 
        tensi: (tensiSistolik && tensiDiastolik) ? `${tensiSistolik}/${tensiDiastolik}` : '', 
        gula_darah: gulaDarah, 
        lingkar_perut: lingkarPerut,
        kesediaan_data: kesediaanData ? 'Ya' : 'Tidak',
        gejala_neuropati: gejalaNeuropati ? 'Ya' : 'Tidak',
        cek_gula_darah: 'Ya',
        "Cek_Gula_Darah": 'Ya'
      };
      setSelectedUser(updatedUser);
      setData(prevData => prevData.map(d => 
        d["No. Registrasi"] === selectedUser["No. Registrasi"] ? updatedUser : d
      ));
      
      alert('Data pemeriksaan berhasil disimpan!');
    } catch (err: any) {
      console.error(err);
      let errorMsg = err.message;
      if (err.code === 'PGRST204' || errorMsg.includes('schema cache')) {
        errorMsg += '\n\nTips: Jika Anda baru saja menambahkan kolom di Supabase, silakan ke Dasbor Supabase > API Settings > Klik "Reload schema cache". Pastikan juga nama kolom sudah benar: tinggi_badan, berat_badan, tensi, gula_darah, lingkar_perut, kesediaan_data, gejala_neuropati, cek_gula_darah (semua huruf kecil).';
      }
      alert('Gagal menyimpan data: ' + errorMsg);
    } finally {
      setActionLoading(null);
    }
  };

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Periksa sesi yang ada saat komponen dimuat
  useEffect(() => {
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
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
      if (!isSupabaseConfigured) {
        throw new Error("Supabase tidak dikonfigurasi.");
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        setIsAuthenticated(true);
        fetchData();
      }
    } catch (err: any) {
      console.error(err);
      setLoginError("Login gagal: " + (err.message || "Email atau password salah."));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setIsAuthenticated(false);
    setEmail("");
    setPassword("");
    setData([]);
    setScanResult(null);
    setSelectedUser(null);
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
          "Makan_Siang_Hari_1": row.makan_siang_hari_1,
          "Makan_Siang_Hari_2": row.makan_siang_hari_2,
          "Makan_Siang_Pesta_Rakyat": row.makan_siang_pesta_rakyat,
          "Seminar_Kit": row.seminar_kit,
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
      // Coba parsing sebagai URL
      const url = new URL(trimmed);
      const id = url.searchParams.get("id");
      if (id) return decodeURIComponent(id.trim());
    } catch (e) {
      // Jika bukan URL yang valid, lanjutkan ke regex
    }
    
    // Fallback regex jika URL parser gagal karena suatu hal (misal format tidak standar)
    const match = trimmed.match(/[?&]id=([^&]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1].trim());
    }
    
    // Coba cari pola ID KNS2026-XXXXX
    const knsMatch = trimmed.match(/(KNS2026-[A-Z0-9]+)/i);
    if (knsMatch && knsMatch[1]) {
      return knsMatch[1].toUpperCase();
    }
    
    return trimmed;
  };

  const findParticipant = (rawQuery: string): Pendaftar | null => {
    if (!rawQuery || !rawQuery.trim()) return null;
    const cleanId = extractIdFromScannedText(rawQuery).toLowerCase().trim();
    const rawLower = rawQuery.toLowerCase().trim();
    const sourceList = dataRef.current.length > 0 ? dataRef.current : data;

    // 1. Coba pencocokan presisi (No. Registrasi sama persis)
    let found = sourceList.find(d => {
      const reg = String(d["No. Registrasi"] || d.no_registrasi || "").toLowerCase().trim();
      return reg === cleanId || reg === rawLower;
    });
    if (found) return found;

    // 2. Coba pencocokan parsial No. Registrasi (misal tanpa awalan KNS2026 atau hanya digit terakhir)
    found = sourceList.find(d => {
      const reg = String(d["No. Registrasi"] || d.no_registrasi || "").toLowerCase().trim();
      return (
        (cleanId.length >= 3 && reg.includes(cleanId)) ||
        (rawLower.length >= 3 && reg.includes(rawLower)) ||
        (reg.length >= 4 && cleanId.includes(reg))
      );
    });
    if (found) return found;

    // 3. Coba pencocokan Nama Lengkap, Email, atau WhatsApp
    found = sourceList.find(d => {
      const name = String(d["Nama Lengkap"] || d.nama_lengkap || "").toLowerCase().trim();
      const email = String(d.email || d.Email || "").toLowerCase().trim();
      const wa = String(d.whatsapp || d["No. WhatsApp"] || "").toLowerCase().trim();

      return (
        (cleanId.length >= 3 && name.includes(cleanId)) ||
        (rawLower.length >= 3 && name.includes(rawLower)) ||
        (email && (email === cleanId || email === rawLower)) ||
        (wa && (wa.includes(cleanId) || wa.includes(rawLower)))
      );
    });

    return found || null;
  };

  useEffect(() => {
    // Automatically process ID from URL parameter (e.g. ?id=KNS2026-12345)
    const params = new URLSearchParams(window.location.search);
    const scannedId = params.get("id");
    
    if (scannedId && data.length > 0 && isAuthenticated) {
      const user = findParticipant(scannedId);
      setSelectedUser(user);
      
      if (!user) {
        setError(`Data peserta dengan identitas "${scannedId}" tidak ditemukan.`);
      } else {
        setError(null);
        setScanResult(user["No. Registrasi"] || user.no_registrasi || scannedId);
      }
      
      // Clean up URL so refresh doesn't trigger it again
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [data, isAuthenticated]);

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;
    let isComponentMounted = true;
    
    if (isScanning) {
      html5QrCode = new Html5Qrcode("reader");
      
      html5QrCode.start(
        { facingMode: "environment" },
        { 
          fps: 10, 
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const size = Math.min(viewfinderWidth, viewfinderHeight) * 0.7;
            return { width: size, height: size };
          }
        },
        (decodedText) => {
          if (!isComponentMounted) return;
          
          const extractedId = extractIdFromScannedText(decodedText);
          
          if (navigator.vibrate) navigator.vibrate(200);
          setScanResult(extractedId);
          setIsScanning(false);
          
          // Cari user menggunakan findParticipant yang aman dan fleksibel
          const user = findParticipant(decodedText);
          
          setSelectedUser(user);
          
          if (!user) {
            setError(`Data peserta dengan identitas "${extractedId}" tidak ditemukan.`);
          } else {
            setError(null);
          }
        },
        (err) => {
          // Ignored (berjalan terus mencari QR)
        }
      ).catch(err => {
        if (!isComponentMounted) return;
        console.error("Gagal memulai scanner", err);
        setError("Gagal mengakses kamera. Pastikan Anda memberikan izin akses kamera.");
      });
    }

    return () => {
      isComponentMounted = false;
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
          try { html5QrCode?.clear(); } catch(e) {}
        }).catch(e => console.error("Failed to stop/clear scanner", e));
      } else if (html5QrCode) {
        try { html5QrCode.clear(); } catch(e) {}
      }
    };
  }, [isScanning]);

  const toggleTorch = async () => {
    if (!isScanning) return;
    
    try {
      const html5QrCode = new Html5Qrcode("reader");
      setTorchOn(!torchOn);
      html5QrCode.applyVideoConstraints({
        advanced: [{ torch: !torchOn } as any]
      }).catch(e => {
        console.warn("Torch not supported or failed to apply", e);
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleManualSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchId = ((formData.get("searchId") as string) || "").trim();
    
    if (searchId) {
      const user = findParticipant(searchId);
      setSelectedUser(user);
      if (!user) {
        setError(`Data dengan kata kunci "${searchId}" tidak ditemukan.`);
      } else {
        setError(null);
        setScanResult(user["No. Registrasi"] || user.no_registrasi || searchId);
      }
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
    
    try {
      const updatePayload: Record<string, string | null> = {
        [checkpointId.toLowerCase()]: newValue ? "Ya" : null
      };

      extraColumns.forEach(col => {
        updatePayload[col.toLowerCase()] = newValue ? "Ya" : null;
      });

      const { error: updateError } = await supabase
        .from('pendaftar')
        .update(updatePayload)
        .eq('no_registrasi', selectedUser["No. Registrasi"]);
        
      if (updateError) {
        throw updateError;
      }
      
      // Update local state
      const updatedUser: Pendaftar = { 
        ...selectedUser, 
        [checkpointId]: newValue ? "Ya" : null,
        [checkpointId.toLowerCase()]: newValue ? "Ya" : null
      };

      extraColumns.forEach(col => {
        updatedUser[col] = newValue ? "Ya" : null;
        updatedUser[col.toLowerCase()] = newValue ? "Ya" : null;
      });

      setSelectedUser(updatedUser);
      setData(prevData => prevData.map(d => 
        d["No. Registrasi"] === selectedUser["No. Registrasi"] ? updatedUser : d
      ));
    } catch (err: any) {
      console.error(err);
      alert("Kesalahan saat update checkpoint: " + err.message + "\n\nPastikan Anda telah menambahkan kolom '" + checkpointId.toLowerCase() + "' (tipe text) di tabel Supabase.");
    } finally {
      setActionLoading(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-100">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center">
              <ShieldAlert className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 text-center mb-2">Scanner Panitia</h1>
          <p className="text-slate-500 text-center mb-6">Masuk menggunakan akun admin untuk mengakses scanner.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                placeholder="admin@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                autoFocus
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                required
              />
            </div>
            {loginError && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">{loginError}</p>}
            <button
              type="submit"
              className="w-full bg-emerald-600 text-white font-semibold py-3 rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center"
              disabled={authLoading}
            >
              {authLoading ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : null}
              {authLoading ? "Memverifikasi..." : "Akses Scanner"}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <a href="/" className="text-sm text-slate-500 hover:text-slate-800 flex items-center justify-center mx-auto">
              <ArrowLeft className="h-4 w-4 mr-1" />
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

  let hasAccess = false;
  let rejectionReason = "";
  
  const isLunas = selectedUser ? (selectedUser["Status Pembayaran"] === 'Lunas' || selectedUser.status_pembayaran === 'Lunas') : false;
  const kategori = selectedUser ? String(selectedUser["Kategori Peserta"] || selectedUser.kategori_peserta || "") : "";
  const pilihanKegiatan = selectedUser ? String(selectedUser["pilihan_kegiatan"] || selectedUser["Akses Kegiatan"] || selectedUser.pilihan_kegiatan || "") : "";
  
  const isIlmiah = ["Dokter Umum", "Dokter Spesialis", "Residen", "Perawat", "Mahasiswa"].includes(kategori);
  const isPestaRakyat = ["Anggota PERSADIA", "Masyarakat Umum"].includes(kategori);
  const bersediaAnggota = selectedUser ? (
    selectedUser["bersedia_anggota_persadia"] === true || 
    selectedUser["bersedia_anggota_persadia"] === 'Ya' || 
    selectedUser["bersedia_anggota_persadia"] === 'true' || 
    selectedUser["Bersedia_Anggota_Persadia"] === 'Ya'
  ) : false;

  if (selectedUser) {
    // 1. Peserta Ilmiah berbayar wajib berstatus Lunas untuk seluruh aktivitas
    if (isIlmiah && !isLunas) {
      hasAccess = false;
      rejectionReason = "Pembayaran belum lunas. Registrasi & rangkaian kegiatan belum dapat diikuti.";
    } else {
      // 2. Validasi per mode scanner
      if (scannerMode === 'registrasi') {
        // Registrasi on-site dibuka untuk seluruh peserta sah (Ilmiah lunas & Pesta Rakyat)
        hasAccess = true;
      } else if (scannerMode === 'workshop') {
        if (isIlmiah && (pilihanKegiatan.toLowerCase().includes("workshop") || pilihanKegiatan.toLowerCase().includes("paket"))) {
          hasAccess = true;
        } else if (isIlmiah) {
          hasAccess = false;
          rejectionReason = "Akses Ditolak: Tiket peserta adalah Simposium Saja (tidak termasuk Workshop).";
        } else {
          hasAccess = false;
          rejectionReason = "Akses Ditolak: Peserta bukan kategori Sesi Ilmiah / Workshop.";
        }
      } else if (scannerMode === 'pesta_rakyat') {
        // Cek Gula Darah: Pesta Rakyat & Peserta Ilmiah berbayar (Lunas) BERHAK ikut Hari ke-2!
        if (isPestaRakyat || isIlmiah) {
          hasAccess = true;
        } else {
          hasAccess = false;
          rejectionReason = "Akses Ditolak: Kategori peserta tidak terdaftar untuk kegiatan ini.";
        }
      } else if (scannerMode === 'makan_siang') {
        // Makan Siang: Terbuka untuk seluruh peserta sah (Ilmiah berhak Hari 1 & 2; Pesta Rakyat berhak Hari 2)
        hasAccess = true;
      } else if (scannerMode === 'merchandise') {
        if (kategori === "Anggota PERSADIA" || bersediaAnggota) {
          hasAccess = true;
        } else {
          hasAccess = false;
          rejectionReason = "Akses Ditolak: Pengambilan merchandise khusus untuk Anggota PERSADIA atau peserta yang bersedia mendaftar sebagai anggota PERSADIA.";
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Header */}
      <header className="bg-emerald-700 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <QrCode className="w-6 h-6" />
            <h1 className="text-lg font-bold">Scanner Panitia</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={fetchData}
              disabled={loading}
              className="p-2 bg-emerald-800 hover:bg-emerald-900 rounded-full transition-colors disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 bg-emerald-800 hover:bg-red-600 rounded-full transition-colors"
              title="Keluar"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 mt-4">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
            <ShieldAlert className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-800 text-sm font-medium">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        {!selectedUser && !isScanning && (
          <div className="space-y-6">
            
            {/* Mode Selector */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-3 text-center">Pilih Mode Scanner</h2>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <button
                  onClick={() => setScannerMode('registrasi')}
                  className={`py-2 px-1.5 sm:px-2.5 rounded-lg text-[11px] sm:text-sm font-medium transition-colors border min-h-[44px] ${scannerMode === 'registrasi' ? 'bg-emerald-100 border-emerald-300 text-emerald-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                >
                  Registrasi
                </button>
                <button
                  onClick={() => setScannerMode('workshop')}
                  className={`py-2 px-1.5 sm:px-2.5 rounded-lg text-[11px] sm:text-sm font-medium transition-colors border min-h-[44px] ${scannerMode === 'workshop' ? 'bg-emerald-100 border-emerald-300 text-emerald-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                >
                  Workshop
                </button>
                <button
                  onClick={() => setScannerMode('pesta_rakyat')}
                  className={`py-2 px-1.5 sm:px-2.5 rounded-lg text-[11px] sm:text-sm font-medium transition-colors border min-h-[44px] ${scannerMode === 'pesta_rakyat' ? 'bg-emerald-100 border-emerald-300 text-emerald-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                >
                  Cek Gula Darah
                </button>
                <button
                  onClick={() => setScannerMode('makan_siang')}
                  className={`py-2 px-1.5 sm:px-2.5 rounded-lg text-[11px] sm:text-sm font-medium transition-colors border min-h-[44px] ${scannerMode === 'makan_siang' ? 'bg-emerald-100 border-emerald-300 text-emerald-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                >
                  Makan Siang
                </button>
                <button
                  onClick={() => setScannerMode('merchandise')}
                  className={`py-2 px-1.5 sm:px-2.5 rounded-lg text-[11px] sm:text-sm font-medium transition-colors border min-h-[44px] col-span-2 sm:col-span-1 ${scannerMode === 'merchandise' ? 'bg-emerald-100 border-emerald-300 text-emerald-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                >
                  Merchandise
                </button>
              </div>
            </div>

            {/* Action Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                <QrCode className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Scan QR Code Peserta</h2>
              <p className="text-slate-600 text-sm mb-6 max-w-sm">
                Arahkan kamera ke QR code pada e-ticket peserta untuk melakukan registrasi ulang dan validasi kehadiran.
              </p>
              <button
                onClick={() => setIsScanning(true)}
                className="w-full sm:w-auto px-8 py-4 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center"
              >
                <QrCode className="w-5 h-5 mr-2" />
                Mulai Scan
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex-1 h-px bg-slate-200"></div>
              <span className="text-sm font-medium text-slate-400">ATAU</span>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>

            {/* Manual Search */}
            <form onSubmit={handleManualSearch} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Pencarian Manual</h3>
              <div className="flex flex-col space-y-3">
                <input
                  type="text"
                  name="searchId"
                  placeholder="No. Registrasi / Nama..."
                  className="w-full px-4 py-3 min-h-[44px] border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                />
                <button type="submit" className="w-full px-4 py-3 min-h-[44px] bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg transition-colors flex items-center justify-center">
                  <Search className="w-5 h-5 mr-2" />
                  Cari Peserta
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reader Container SELALU ter-mount di DOM */}
        <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-hidden mb-6 ${isScanning ? 'block' : 'hidden'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">Kamera Aktif</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleTorch}
                className={`p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-colors ${torchOn ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100 text-slate-500 hover:text-slate-700'}`}
                title="Toggle Senter"
              >
                <Flashlight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setIsScanning(false)}
                className="text-slate-500 hover:text-slate-700 text-sm font-medium px-4 py-2 min-h-[44px] bg-slate-100 rounded-lg flex items-center justify-center"
              >
                Batal
              </button>
            </div>
          </div>
          <div id="reader" className="w-full bg-black rounded-xl overflow-hidden shadow-inner" style={{ touchAction: 'pan-y' }}></div>
          <p className="text-center text-sm text-slate-500 mt-4">Arahkan QR code ke dalam kotak</p>
        </div>

        {selectedUser && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button 
              onClick={() => {
                setSelectedUser(null);
                setScanResult(null);
                setError(null);
              }}
              className="flex items-center text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Kembali ke Scanner
            </button>

            {/* Profile Card */}
            <div className={`bg-white rounded-2xl shadow-sm border p-4 sm:p-6 ${selectedUser["Status Pembayaran"] === 'Lunas' ? 'border-emerald-200' : 'border-red-200'}`}>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-2 flex-wrap">
                    <span className="text-[11px] sm:text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-md uppercase tracking-wider">
                      {selectedUser["No. Registrasi"]}
                    </span>
                    <span className={`text-[11px] sm:text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                      selectedUser["Status Pembayaran"] === 'Lunas' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {selectedUser["Status Pembayaran"]}
                    </span>

                    {/* Badge Akses Acara */}
                    {isIlmiah ? (
                      <span className="text-[11px] sm:text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-md shadow-xs">
                        🎫 Akses: Hari 1 (Novotel) + Hari 2 (GOR Pakansari)
                      </span>
                    ) : (
                      <span className="text-[11px] sm:text-xs font-bold px-2.5 py-1 bg-sky-50 text-sky-800 border border-sky-300 rounded-md shadow-xs">
                        🎪 Akses: Hari 2 (GOR Pakansari)
                      </span>
                    )}

                    {isIlmiah && (pilihanKegiatan.toLowerCase().includes("workshop") || pilihanKegiatan.toLowerCase().includes("paket")) && (
                      <span className="text-[11px] sm:text-xs font-bold px-2 py-1 bg-purple-50 text-purple-800 border border-purple-300 rounded-md">
                        🔬 Termasuk Workshop
                      </span>
                    )}

                    {(selectedUser.kode_voucher || selectedUser['kode_voucher']) && (
                      <span className="text-[11px] sm:text-xs font-mono font-bold px-2 py-1 bg-amber-50 text-amber-900 border border-amber-300 rounded-md">
                        🎟️ {selectedUser.kode_voucher || selectedUser['kode_voucher']}
                      </span>
                    )}

                    {selectedUser["Kategori Peserta"] !== "Anggota PERSADIA" && (
                      (selectedUser["bersedia_anggota_persadia"] === true || selectedUser["bersedia_anggota_persadia"] === 'Ya' || selectedUser["bersedia_anggota_persadia"] === 'true') ? (
                        <span className="text-[11px] sm:text-xs font-bold px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                          🎁 Bersedia Anggota PERSADIA
                        </span>
                      ) : (
                        <span className="text-[11px] sm:text-xs font-medium px-2 py-1 bg-slate-100 text-slate-500 rounded-md">
                          Tidak Mendaftar Anggota PERSADIA
                        </span>
                      )
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-800 break-words">{selectedUser["Nama Lengkap"]}</h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                    {selectedUser["Kategori Peserta"]}
                    {selectedUser.institusi ? ` • ${selectedUser.institusi}` : ''}
                  </p>
                </div>
              </div>
            </div>

            {!hasAccess ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-red-800 mb-2">Akses Ditolak</h3>
                <p className="text-red-600 text-sm">{rejectionReason}</p>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-emerald-800 mb-2">Akses Diberikan</h3>
                <p className="text-emerald-600 text-sm mb-6">
                  Peserta berhak masuk ke area <strong>{
                    scannerMode === 'registrasi' ? 'Registrasi' :
                    scannerMode === 'workshop' ? 'Workshop' :
                    scannerMode === 'pesta_rakyat' ? 'Cek Gula Darah' :
                    scannerMode === 'makan_siang' ? 'Pengambilan Makan Siang' : 'Pengambilan Merchandise'
                  }</strong>.
                </p>

                {scannerMode === 'merchandise' && (
                  <button
                    disabled={actionLoading === 'Pengambilan_Merchandise' || selectedUser['Pengambilan_Merchandise'] === 'Ya' || selectedUser['pengambilan_merchandise'] === 'Ya'}
                    onClick={() => handleUpdateCheckpoint('Pengambilan_Merchandise', selectedUser['Pengambilan_Merchandise'] === 'Ya' || selectedUser['pengambilan_merchandise'] === 'Ya')}
                    className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center transition-colors ${
                      (selectedUser['Pengambilan_Merchandise'] === 'Ya' || selectedUser['pengambilan_merchandise'] === 'Ya')
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                    }`}
                  >
                    {actionLoading === 'Pengambilan_Merchandise' ? (
                      <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                    ) : (selectedUser['Pengambilan_Merchandise'] === 'Ya' || selectedUser['pengambilan_merchandise'] === 'Ya') ? (
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                    ) : (
                      <CheckSquare className="w-5 h-5 mr-2" />
                    )}
                    {(selectedUser['Pengambilan_Merchandise'] === 'Ya' || selectedUser['pengambilan_merchandise'] === 'Ya') ? 'Sudah Ambil Merchandise' : 'Verifikasi Pengambilan Merchandise'}
                  </button>
                )}

                {scannerMode === 'makan_siang' && (
                  <div className="space-y-3 text-left">
                    {/* Hari 1 - Novotel (Khusus Peserta Ilmiah Berbayar) */}
                    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Hari 1 • Novotel Bogor</span>
                          <h4 className="text-sm font-bold text-slate-800">Makan Siang Sesi Ilmiah</h4>
                        </div>
                        {isIlmiah ? (
                          <span className="text-[11px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded font-semibold border border-emerald-200">
                            Berhak
                          </span>
                        ) : (
                          <span className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded font-medium">
                            Khusus Peserta Ilmiah
                          </span>
                        )}
                      </div>

                      {isIlmiah ? (
                        <button
                          disabled={actionLoading === 'Makan_Siang_Hari_1' || selectedUser['Makan_Siang_Hari_1'] === 'Ya' || selectedUser['makan_siang_hari_1'] === 'Ya'}
                          onClick={() => handleUpdateCheckpoint('Makan_Siang_Hari_1', selectedUser['Makan_Siang_Hari_1'] === 'Ya' || selectedUser['makan_siang_hari_1'] === 'Ya')}
                          className={`w-full py-2.5 px-4 rounded-lg font-bold flex items-center justify-center text-sm transition-colors ${
                            (selectedUser['Makan_Siang_Hari_1'] === 'Ya' || selectedUser['makan_siang_hari_1'] === 'Ya')
                              ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                          }`}
                        >
                          {actionLoading === 'Makan_Siang_Hari_1' ? (
                            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                          ) : (selectedUser['Makan_Siang_Hari_1'] === 'Ya' || selectedUser['makan_siang_hari_1'] === 'Ya') ? (
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                          ) : (
                            <CheckSquare className="w-4 h-4 mr-2" />
                          )}
                          {(selectedUser['Makan_Siang_Hari_1'] === 'Ya' || selectedUser['makan_siang_hari_1'] === 'Ya') ? 'Sudah Ambil Makan Siang Hari 1' : 'Verifikasi Makan Siang Hari 1'}
                        </button>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Peserta Pesta Rakyat tidak memiliki kupon makan siang Hari 1 di Novotel.</p>
                      )}
                    </div>

                    {/* Hari 2 - GOR Pakansari (Semua Peserta: Pesta Rakyat + Peserta Ilmiah Berbayar yang Lunas) */}
                    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Hari 2 • GOR Pakansari</span>
                          <h4 className="text-sm font-bold text-slate-800">Makan Siang / Snack Pesta Rakyat</h4>
                        </div>
                        <span className="text-[11px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded font-semibold border border-emerald-200">
                          Berhak
                        </span>
                      </div>

                      <button
                        disabled={
                          actionLoading === 'Makan_Siang_Pesta_Rakyat' || 
                          selectedUser['Makan_Siang_Pesta_Rakyat'] === 'Ya' || 
                          selectedUser['makan_siang_pesta_rakyat'] === 'Ya'
                        }
                        onClick={() => handleUpdateCheckpoint(
                          'Makan_Siang_Pesta_Rakyat', 
                          selectedUser['Makan_Siang_Pesta_Rakyat'] === 'Ya' || selectedUser['makan_siang_pesta_rakyat'] === 'Ya'
                        )}
                        className={`w-full py-2.5 px-4 rounded-lg font-bold flex items-center justify-center text-sm transition-colors ${
                          (selectedUser['Makan_Siang_Pesta_Rakyat'] === 'Ya' || selectedUser['makan_siang_pesta_rakyat'] === 'Ya')
                            ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                        }`}
                      >
                        {actionLoading === 'Makan_Siang_Pesta_Rakyat' ? (
                          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                        ) : (selectedUser['Makan_Siang_Pesta_Rakyat'] === 'Ya' || selectedUser['makan_siang_pesta_rakyat'] === 'Ya') ? (
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                        ) : (
                          <CheckSquare className="w-4 h-4 mr-2" />
                        )}
                        {(selectedUser['Makan_Siang_Pesta_Rakyat'] === 'Ya' || selectedUser['makan_siang_pesta_rakyat'] === 'Ya') 
                          ? 'Sudah Ambil Makan Siang Hari 2' 
                          : 'Verifikasi Makan Siang Hari 2'}
                      </button>
                    </div>
                  </div>
                )}
                
                {scannerMode === 'registrasi' && (
                  <button
                    disabled={actionLoading === 'Registrasi_OnSite' || selectedUser['Registrasi_OnSite'] === 'Ya'}
                    onClick={() => handleUpdateCheckpoint('Registrasi_OnSite', selectedUser['Registrasi_OnSite'] === 'Ya')}
                    className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center transition-colors ${
                      selectedUser['Registrasi_OnSite'] === 'Ya'
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                    }`}
                  >
                    {actionLoading === 'Registrasi_OnSite' ? (
                      <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                    ) : selectedUser['Registrasi_OnSite'] === 'Ya' ? (
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                    ) : (
                      <CheckSquare className="w-5 h-5 mr-2" />
                    )}
                    {selectedUser['Registrasi_OnSite'] === 'Ya' ? 'Sudah Registrasi On-Site' : 'Check-In Registrasi On-Site'}
                  </button>
                )}

                {scannerMode === 'pesta_rakyat' && (
                  <form onSubmit={handleSimpanPemeriksaan} className="bg-white p-4 rounded-xl border border-emerald-100 text-left space-y-4">
                    <h4 className="font-bold text-slate-800 border-b pb-2">Form Pemeriksaan</h4>
                    
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
                        <label className="block text-[11px] font-medium text-slate-600 mb-1 truncate" title="Gula Darah (mg/dL)">Gula Darah (mg/dL)</label>
                        <input type="number" value={gulaDarah} onChange={e => setGulaDarah(e.target.value)} className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-200 outline-none text-center" placeholder="110" />
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

                    <div className="pt-2 border-t border-slate-100 space-y-2.5">
                      <label htmlFor="kesediaan-data-cb" className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          id="kesediaan-data-cb"
                          type="checkbox"
                          checked={kesediaanData}
                          onChange={e => setKesediaanData(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                        />
                        <span className="text-xs text-slate-700 font-medium leading-tight">
                          Peserta bersedia datanya dicatat dan disimpan untuk rekam medis / pemantauan kesehatan.
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
                          Peserta mengalami gejala neuropati (kesemutan, kebas, atau rasa nyeri pada tangan / kaki).
                        </span>
                      </label>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={actionLoading === 'pemeriksaan'}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center text-sm"
                    >
                      {actionLoading === 'pemeriksaan' ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                      {selectedUser['Cek_Gula_Darah'] === 'Ya' ? 'Update Data Pemeriksaan' : 'Simpan Data Pemeriksaan'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
