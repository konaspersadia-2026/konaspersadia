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
  { id: "Registrasi_OnSite", label: "Registrasi On-Site", isMain: true },
  { id: "Makan_Siang_Hari_1", label: "Makan Siang (Hari 1)" },
  { id: "Makan_Siang_Hari_2", label: "Makan Siang (Hari 2)" },
  { id: "Seminar_Kit", label: "Pengambilan Seminar Kit" },
  { id: "Cek_Gula_Darah", label: "Cek Gula Darah" },
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

  // Gunakan ref untuk menyimpan data terbaru agar useEffect scanner tidak perlu direstart saat data berubah
  const dataRef = useRef<Pendaftar[]>([]);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const SCANNER_PIN = "rahasia"; // Same as admin pin for now or similar

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === SCANNER_PIN) {
      setIsAuthenticated(true);
      fetchData();
    } else {
      setPinError("PIN yang Anda masukkan salah.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPinInput("");
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
      const user = data.find(d => d["No. Registrasi"] === scannedId);
      setSelectedUser(user || null);
      
      if (!user) {
        setError(`Nomor registrasi ${scannedId} tidak ditemukan.`);
      } else {
        setError(null);
        setScanResult(scannedId);
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
          
          if (navigator.vibrate) navigator.vibrate(200);
          setScanResult(decodedText);
          setIsScanning(false);
          
          // Cari user menggunakan dataRef agar selalu up-to-date
          const user = dataRef.current.find(d => d["No. Registrasi"] === decodedText);
          setSelectedUser(user || null);
          
          if (!user) {
            setError(`Nomor registrasi ${decodedText} tidak ditemukan.`);
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
          <p className="text-slate-500 text-center mb-6">Masukkan PIN keamanan untuk mengakses scanner registrasi.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Masukkan PIN"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full px-4 py-3 text-center tracking-[0.5em] font-mono text-lg rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                autoFocus
              />
            </div>
            {pinError && <p className="text-red-500 text-sm text-center">{pinError}</p>}
            <button
              type="submit"
              className="w-full bg-emerald-600 text-white font-semibold py-3 rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center"
              disabled={loading}
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : null}
              {loading ? "Memverifikasi..." : "Akses Scanner"}
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
              <div className="flex space-x-2">
                <input
                  type="text"
                  name="searchId"
                  placeholder="No. Registrasi / Nama..."
                  className="flex-1 px-4 py-2 min-h-[44px] border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                />
                <button type="submit" className="px-4 py-2 min-h-[44px] min-w-[44px] bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg transition-colors flex items-center justify-center">
                  <Search className="w-5 h-5" />
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

            {selectedUser["Status Pembayaran"] !== 'Lunas' ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-red-800 mb-2">Pembayaran Belum Lunas</h3>
                <p className="text-red-600 text-sm">Peserta ini belum menyelesaikan pembayaran atau masih menunggu verifikasi. Registrasi on-site tidak dapat dilanjutkan.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-2" />
                  Checkpoints Kehadiran
                </h3>
                
                <div className="space-y-3">
                  {CHECKPOINTS.map((cp) => {
                    const isChecked = selectedUser[cp.id] === "Ya";
                    const isMain = cp.isMain;
                    const isMainChecked = selectedUser[CHECKPOINTS.find(c => c.isMain)?.id || ""] === "Ya";
                    
                    // Disable non-main checkpoints if main is not checked
                    const isDisabled = !isMain && !isMainChecked;
                    
                    return (
                      <div 
                        key={cp.id}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                          isChecked 
                            ? 'bg-emerald-50 border-emerald-200' 
                            : isDisabled 
                              ? 'bg-slate-50 border-slate-100 opacity-60' 
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <button
                            disabled={isDisabled || actionLoading === cp.id}
                            onClick={() => handleUpdateCheckpoint(cp.id, isChecked)}
                            className={`flex-shrink-0 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${
                              isChecked ? 'text-emerald-600' : isDisabled ? 'text-slate-300' : 'text-slate-400 hover:text-emerald-500'
                            }`}
                          >
                            {isChecked ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
                          </button>
                          <div>
                            <p className={`font-medium ${isChecked ? 'text-emerald-900' : 'text-slate-700'}`}>
                              {cp.label}
                            </p>
                            {isMain && (
                              <p className="text-xs text-slate-500">Gerbang Utama Registrasi</p>
                            )}
                          </div>
                        </div>
                        
                        {actionLoading === cp.id && (
                          <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
                        )}
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-sm text-blue-800 text-center">
                    <strong>Informasi:</strong> Ceklis <em>Registrasi On-Site</em> terlebih dahulu untuk membuka kunci checkpoint lainnya.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
