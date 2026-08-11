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
  
  type ScannerMode = 'registrasi' | 'workshop' | 'pesta_rakyat' | 'makan_siang';
  const [scannerMode, setScannerMode] = useState<ScannerMode>('registrasi');

  // States for pemeriksaan
  const [tinggiBadan, setTinggiBadan] = useState("");
  const [beratBadan, setBeratBadan] = useState("");
  const [tensiSistolik, setTensiSistolik] = useState("");
  const [tensiDiastolik, setTensiDiastolik] = useState("");
  const [gulaDarah, setGulaDarah] = useState("");
  const [lingkarPerut, setLingkarPerut] = useState("");

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
    } else {
      setTinggiBadan("");
      setBeratBadan("");
      setTensiSistolik("");
      setTensiDiastolik("");
      setGulaDarah("");
      setLingkarPerut("");
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
          tinggi_badan: tinggiBadan,
          berat_badan: beratBadan,
          tensi: (tensiSistolik && tensiDiastolik) ? `${tensiSistolik}/${tensiDiastolik}` : '',
          gula_darah: gulaDarah,
          lingkar_perut: lingkarPerut,
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
        errorMsg += '\n\nTips: Jika Anda baru saja menambahkan kolom di Supabase, silakan ke Dasbor Supabase > API Settings > Klik "Reload schema cache". Pastikan juga nama kolom sudah benar: tinggi_badan, berat_badan, tensi, gula_darah, lingkar_perut, cek_gula_darah (semua huruf kecil).';
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
      const { data: supabaseData, error: supabaseError } = await supabase
        .from('pendaftar')
        .select('*');

      if (supabaseError) {
        throw supabaseError;
      }

      if (supabaseData) {
        const mappedData: Pendaftar[] = supabaseData.map((row: any) => ({
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

  useEffect(() => {
    // Automatically process ID from URL parameter (e.g. ?id=KNS2026-12345)
    const params = new URLSearchParams(window.location.search);
    const scannedId = params.get("id");
    
    if (scannedId && data.length > 0 && isAuthenticated) {
      const extractedId = scannedId.trim();
      const user = data.find(d => 
        d["No. Registrasi"].toLowerCase() === extractedId.toLowerCase() ||
        d["Nama Lengkap"].toLowerCase().includes(extractedId.toLowerCase())
      );
      
      setSelectedUser(user || null);
      
      if (!user) {
        setError(`Data peserta dengan identitas "${extractedId}" tidak ditemukan.`);
      } else {
        setError(null);
        setScanResult(user["No. Registrasi"]);
      }
      
      // Clean up URL so refresh doesn't trigger it again
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [data, isAuthenticated]);

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;
    let isComponentMounted = true;
    
    const extractIdFromScannedText = (text: string) => {
      let trimmed = text.trim();
      try {
        // Coba parsing sebagai URL
        const url = new URL(trimmed);
        const id = url.searchParams.get("id");
        if (id) return id.trim();
      } catch (e) {
        // Jika bukan URL yang valid, lanjutkan ke regex
      }
      
      // Fallback regex jika URL parser gagal karena suatu hal (misal format tidak standar)
      const match = trimmed.match(/[?&]id=([^&]+)/);
      if (match && match[1]) {
        return match[1].trim();
      }
      
      // Coba cari pola ID KNS2026-XXXXX
      const knsMatch = trimmed.match(/(KNS2026-\d+)/i);
      if (knsMatch && knsMatch[1]) {
        return knsMatch[1].toUpperCase();
      }
      
      return trimmed;
    };
    
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
          
          // Cari user menggunakan dataRef agar selalu up-to-date
          const user = dataRef.current.find(d => 
            d["No. Registrasi"].toLowerCase() === extractedId.toLowerCase() ||
            d["Nama Lengkap"].toLowerCase().includes(extractedId.toLowerCase())
          );
          
          setSelectedUser(user || null);
          
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
          html5QrCode?.clear();
        }).catch(e => console.error("Failed to stop/clear scanner", e));
      } else if (html5QrCode) {
        html5QrCode.clear();
      }
    };
  }, [isScanning]);

  const toggleTorch = async () => {
    // Torch tidak didukung secara native oleh semua browser lewat library ini dengan mudah
    // Tapi kita bisa coba restart dengan advanced constraint
    if (!isScanning) return;
    
    try {
      const html5QrCode = new Html5Qrcode("reader");
      // This is a simplified approach. In a real scenario, applying constraints to an active track is better.
      // For simplicity, we just inform the user if it's tricky, but let's assume we can re-apply constraints if we had the track.
      // Alternatively, just toggling state is fine if we restart, but restarting is slow.
      // So let's skip complex torch implementation or just add a UI placeholder if needed.
      // Wait, Html5Qrcode has applyVideoConstraints
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
    const searchId = formData.get("searchId") as string;
    
    if (searchId) {
      const user = data.find(d => 
        d["No. Registrasi"].toLowerCase() === searchId.toLowerCase() ||
        d["Nama Lengkap"].toLowerCase().includes(searchId.toLowerCase())
      );
      
      setSelectedUser(user || null);
      if (!user) {
        setError(`Data dengan kata kunci "${searchId}" tidak ditemukan.`);
      } else {
        setError(null);
        setScanResult(user["No. Registrasi"]);
      }
    }
  };

  const handleUpdateCheckpoint = async (checkpointId: string, currentValue: boolean) => {
    if (!selectedUser) return;
    
    if (!isSupabaseConfigured) {
      alert("Supabase tidak dikonfigurasi.");
      return;
    }

    const newValue = !currentValue;
    setActionLoading(checkpointId);
    
    try {
      // Create a column name for the checkpoint
      // e.g., "Registrasi_OnSite" -> "registrasi_onsite"
      const columnName = checkpointId.toLowerCase();

      const { error: updateError } = await supabase
        .from('pendaftar')
        .update({ [columnName]: newValue ? "Ya" : null })
        .eq('no_registrasi', selectedUser["No. Registrasi"]);
        
      if (updateError) {
        throw updateError;
      }
      
      // Update local state (keep using original case for local state to match UI logic)
      const updatedUser = { ...selectedUser, [checkpointId]: newValue ? "Ya" : null };
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
  
  if (selectedUser) {
    const isLunas = selectedUser["Status Pembayaran"] === 'Lunas';
    const kategori = selectedUser["Kategori Peserta"] || "";
    // Because we just use ...row, the db column name is `pilihan_kegiatan`
    const pilihanKegiatan = selectedUser["pilihan_kegiatan"] || "";
    
    const isIlmiah = ["Dokter Umum", "Dokter Spesialis", "Residen", "Mahasiswa"].includes(kategori);
    const isPestaRakyat = ["Anggota PERSADIA", "Masyarakat Umum"].includes(kategori);

    if (!isLunas && scannerMode !== 'pesta_rakyat' && scannerMode !== 'makan_siang') {
       hasAccess = false;
       rejectionReason = "Pembayaran belum lunas. Registrasi on-site tidak dapat dilanjutkan.";
    } else {
       if (scannerMode === 'registrasi') {
          hasAccess = true;
       } else if (scannerMode === 'workshop') {
          if (isIlmiah && pilihanKegiatan.includes("Workshop")) {
             hasAccess = true;
          } else {
             hasAccess = false;
             rejectionReason = "Akses Ditolak: Peserta tidak memiliki tiket Workshop.";
          }
       } else if (scannerMode === 'pesta_rakyat') {
          if (isPestaRakyat) {
             hasAccess = true;
          } else {
             hasAccess = false;
             rejectionReason = "Akses Ditolak: Peserta bukan kategori Pesta Rakyat.";
          }
       } else if (scannerMode === 'makan_siang') {
          if (isPestaRakyat) {
             hasAccess = true;
          } else {
             hasAccess = false;
             rejectionReason = "Akses Ditolak: Pengambilan makan siang ini khusus untuk kategori Pesta Rakyat.";
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => setScannerMode('registrasi')}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors border min-h-[44px] ${scannerMode === 'registrasi' ? 'bg-emerald-100 border-emerald-300 text-emerald-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                >
                  Registrasi On-Site
                </button>
                <button
                  onClick={() => setScannerMode('workshop')}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors border min-h-[44px] ${scannerMode === 'workshop' ? 'bg-emerald-100 border-emerald-300 text-emerald-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                >
                  Workshop
                </button>
                <button
                  onClick={() => setScannerMode('pesta_rakyat')}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors border min-h-[44px] ${scannerMode === 'pesta_rakyat' ? 'bg-emerald-100 border-emerald-300 text-emerald-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                >
                  Cek Gula Darah
                </button>
                <button
                  onClick={() => setScannerMode('makan_siang')}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors border min-h-[44px] ${scannerMode === 'makan_siang' ? 'bg-emerald-100 border-emerald-300 text-emerald-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                >
                  Makan Siang
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
            <div className={`bg-white rounded-2xl shadow-sm border p-6 ${selectedUser["Status Pembayaran"] === 'Lunas' ? 'border-emerald-200' : 'border-red-200'}`}>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-md uppercase tracking-wider">
                      {selectedUser["No. Registrasi"]}
                    </span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                      selectedUser["Status Pembayaran"] === 'Lunas' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {selectedUser["Status Pembayaran"]}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">{selectedUser["Nama Lengkap"]}</h2>
                  <p className="text-slate-500 font-medium">{selectedUser["Kategori Peserta"]}</p>
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
                    scannerMode === 'pesta_rakyat' ? 'Cek Gula Darah' : 'Pengambilan Makan Siang'
                  }</strong>.
                </p>

                {scannerMode === 'makan_siang' && (
                  <button
                    disabled={actionLoading === 'Makan_Siang_Pesta_Rakyat' || selectedUser['Makan_Siang_Pesta_Rakyat'] === 'Ya'}
                    onClick={() => handleUpdateCheckpoint('Makan_Siang_Pesta_Rakyat', selectedUser['Makan_Siang_Pesta_Rakyat'] === 'Ya')}
                    className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center transition-colors ${
                      selectedUser['Makan_Siang_Pesta_Rakyat'] === 'Ya'
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                    }`}
                  >
                    {actionLoading === 'Makan_Siang_Pesta_Rakyat' ? (
                      <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                    ) : selectedUser['Makan_Siang_Pesta_Rakyat'] === 'Ya' ? (
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                    ) : (
                      <CheckSquare className="w-5 h-5 mr-2" />
                    )}
                    {selectedUser['Makan_Siang_Pesta_Rakyat'] === 'Ya' ? 'Sudah Ambil Makan Siang' : 'Verifikasi Pengambilan Makan Siang'}
                  </button>
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
