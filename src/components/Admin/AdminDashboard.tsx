import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { toJpeg } from 'html-to-image';
import { EVENT_INFO } from '../../config';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  Users, DollarSign, CheckCircle, Clock, Search, ChevronLeft, ShieldAlert,
  Loader2, LogOut, CheckSquare, XCircle, MessageCircle, Download, QrCode,
  Copy, Check, X
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateHome: () => void;
}

interface Pendaftar {
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean; id: string; status: string}>({ isOpen: false, id: "", status: "" });
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedTicketParticipant, setSelectedTicketParticipant] = useState<Pendaftar | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

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
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
      const { data: supabaseData, error: supabaseError } = await supabase
        .from('pendaftar')
        .select('*')
        .order('timestamp', { ascending: false });

      if (supabaseError) {
        throw supabaseError;
      }

      if (supabaseData) {
        // Map to existing Pendaftar interface format
        const mappedData: Pendaftar[] = supabaseData.map((row: any) => ({
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
        }));
        
        setData(mappedData);
      } else {
        setData([]);
      }
    } catch (err: any) {
      console.error(err);
      setError("Terjadi kesalahan saat mengambil data dari Supabase: " + err.message);
    } finally {
      setLoading(false);
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
      
      window.open("https://chat.whatsapp.com/GezzqQzSYPuHTiCBRGbela", "_blank");
    } catch (err: any) {
      console.error(err);
      setActionError("Terjadi kesalahan jaringan saat update status: " + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDownloadTicket = async (participant: Pendaftar) => {
    setDownloadingId(participant["No. Registrasi"]);
    setSelectedTicketParticipant(participant);

    setTimeout(async () => {
      const badgeElement = document.getElementById(`admin-badge-${participant["No. Registrasi"]}`);
      if (badgeElement) {
        try {
          const imgData = await toJpeg(badgeElement, { quality: 0.95, pixelRatio: 3, backgroundColor: '#ffffff' });
          const link = document.createElement('a');
          link.download = `E-Ticket-${participant["No. Registrasi"]}.jpg`;
          link.href = imgData;
          link.click();
        } catch (error) {
          console.error('Error generating JPG image', error);
          alert('Gagal mengunduh E-Ticket. Silakan coba lagi.');
        }
      } else {
        alert('Elemen E-Ticket belum siap. Silakan coba lagi.');
      }
      setDownloadingId(null);
    }, 150);
  };

  const handleSendWhatsapp = (participant: Pendaftar) => {
    const rawWa = participant["No. WhatsApp"] || "";
    const waNum = rawWa.replace(/\D/g, '').replace(/^0/, '62');
    const scannerUrl = `${window.location.origin}/scanner.html?id=${encodeURIComponent(participant["No. Registrasi"])}`;
    
    const message = `Yth. *${participant["Nama Lengkap"]}*,

Berikut adalah E-Ticket digital & QR Code resmi untuk *${EVENT_INFO.namaAcara}*:

📌 *No. Registrasi:* ${participant["No. Registrasi"]}
👤 *Nama:* ${participant["Nama Lengkap"]}
🏷️ *Kategori:* ${participant["Kategori Peserta"]}
🏛️ *Institusi:* ${participant.Institusi || '-'}
🎟️ *Akses Kegiatan:* ${participant["Akses Kegiatan"]}
✅ *Status Pembayaran:* ${participant["Status Pembayaran"]}

📱 *Link QR Code / Digital Pass:*
${scannerUrl}

*Petunjuk:*
1. Tunjukkan QR Code saat check-in registrasi di lokasi acara.
2. Panitia akan me-scan QR Code ini untuk akses masuk acara.

Sampai jumpa di Bogor!
_Panitia KONAS PERSADIA 2026_`;

    const waUrl = waNum 
      ? `https://wa.me/${waNum}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    window.open(waUrl, "_blank");
  };

  const handleCopyQrLink = (participant: Pendaftar) => {
    const scannerUrl = `${window.location.origin}/scanner.html?id=${encodeURIComponent(participant["No. Registrasi"])}`;
    navigator.clipboard.writeText(scannerUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

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

  // Filtered data for table
  const filteredData = data.filter(item => {
    const matchesSearch = 
      (item["Nama Lengkap"] || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item["No. Registrasi"] || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "Semua" ? true : item["Status Pembayaran"] === statusFilter;
    
    return matchesSearch && matchesStatus;
  }).reverse(); // Show newest first

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Admin Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
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
          <div className="flex items-center space-x-4">
            <button 
              onClick={fetchData} 
              className="text-sm font-medium text-slate-600 hover:text-blue-600 flex items-center"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Refresh Data
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="Keluar"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
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
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="Total Pendaftar" 
                value={totalPendaftar.toString()} 
                icon={<Users className="h-6 w-6 text-blue-600" />} 
                trend="+3 hari ini"
                color="blue"
              />
              <StatCard 
                title="Dana Terverifikasi" 
                value={`Rp ${totalDana.toLocaleString('id-ID')}`} 
                icon={<DollarSign className="h-6 w-6 text-emerald-600" />} 
                trend="Pembayaran Lunas"
                color="emerald"
              />
              <StatCard 
                title="Menunggu Verifikasi" 
                value={totalMenunggu.toString()} 
                icon={<Clock className="h-6 w-6 text-amber-600" />} 
                trend="Perlu tindakan"
                color="amber"
              />
              <StatCard 
                title="Terverifikasi" 
                value={totalLunas.toString()} 
                icon={<CheckCircle className="h-6 w-6 text-indigo-600" />} 
                trend="Selesai"
                color="indigo"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Kategori Pie Chart */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Distribusi Kategori Peserta</h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value: number) => [`${value} peserta`, 'Jumlah']}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Status Bar Chart */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-800">Status Pembayaran</h3>
                  <a 
                    href="https://chat.whatsapp.com/GezzqQzSYPuHTiCBRGbela"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 bg-[#25D366] hover:bg-[#128C7E] text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                  >
                    <MessageCircle className="h-4 w-4 mr-1.5" />
                    Grup WA
                  </a>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusBarData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                      <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                      <RechartsTooltip 
                        cursor={{fill: '#f1f5f9'}}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="jumlah" radius={[6, 6, 0, 0]} maxBarSize={60}>
                        {statusBarData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-slate-800">Daftar Pendaftar</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Cari nama atau no. reg..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full sm:w-64 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white"
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
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-4 font-medium">No. Registrasi</th>
                      <th className="px-6 py-4 font-medium">Peserta</th>
                      <th className="px-6 py-4 font-medium">Kategori & Akses</th>
                      <th className="px-6 py-4 font-medium">Total Bayar</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium text-right">Aksi</th>
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
                      filteredData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded text-xs">
                              {row["No. Registrasi"]}
                            </span>
                            <div className="text-xs text-slate-400 mt-1">
                              {new Date(row.Timestamp).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-800">{row["Nama Lengkap"]}</div>
                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
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
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">{row.Email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-slate-800">{row["Kategori Peserta"]}</div>
                            <div className="text-xs text-slate-500 mt-0.5 max-w-[200px] truncate" title={row["Akses Kegiatan"]}>
                              {row["Akses Kegiatan"]}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-700">
                            Rp {typeof row["Total Bayar"] === 'number' 
                              ? row["Total Bayar"].toLocaleString('id-ID') 
                              : parseInt(row["Total Bayar"] as string || '0', 10).toLocaleString('id-ID')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {row["Status Pembayaran"] === 'Menunggu Verifikasi' && (
                                <>
                                  <button
                                    onClick={() => setConfirmDialog({ isOpen: true, id: row["No. Registrasi"], status: "Lunas" })}
                                    disabled={actionLoadingId === row["No. Registrasi"]}
                                    className="inline-flex items-center px-2 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
                                    className="inline-flex items-center px-2 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
                                onClick={() => {
                                  setSelectedTicketParticipant(row);
                                  setIsTicketModalOpen(true);
                                }}
                                className="inline-flex items-center px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all shadow-sm cursor-pointer"
                                title="Lihat / Pratinjau E-Ticket & QR"
                              >
                                <QrCode className="w-3.5 h-3.5 mr-1" />
                                E-Ticket
                              </button>

                              <button
                                onClick={() => handleSendWhatsapp(row)}
                                className="inline-flex items-center px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-100 hover:border-emerald-300 transition-all shadow-sm cursor-pointer"
                                title="Kirim QR E-Ticket langsung ke WhatsApp Peserta"
                              >
                                <MessageCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                Kirim WA
                              </button>

                              <button
                                onClick={() => handleDownloadTicket(row)}
                                disabled={downloadingId === row["No. Registrasi"]}
                                className="inline-flex items-center p-1.5 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-200 transition-all disabled:opacity-50 shadow-sm cursor-pointer"
                                title="Download E-Ticket (.jpg)"
                              >
                                {downloadingId === row["No. Registrasi"] ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                                ) : (
                                  <Download className="w-3.5 h-3.5" />
                                )}
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
                Ya, Ubah Status Dan Kirim Link Undangan Komunitas WA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin E-Ticket Preview Modal */}
      {isTicketModalOpen && selectedTicketParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-base">E-Ticket & QR Code Peserta</h3>
              </div>
              <button 
                onClick={() => setIsTicketModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Visual Card */}
            <div className="p-6 overflow-y-auto space-y-4 bg-slate-50/50">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-3">
                <div className="w-full bg-[#0B3D5E] text-white p-3 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider">KONAS PERSADIA 2026</span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-mono font-bold">
                    {selectedTicketParticipant["No. Registrasi"]}
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-lg text-slate-900 leading-tight uppercase">
                    {selectedTicketParticipant["Nama Lengkap"]}
                  </h4>
                  {selectedTicketParticipant.Institusi && (
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {selectedTicketParticipant.Institusi}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap justify-center gap-1.5 text-xs">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-semibold rounded-full border border-blue-200">
                    {selectedTicketParticipant["Kategori Peserta"]}
                  </span>
                  <span className={`px-2.5 py-1 font-semibold rounded-full border ${
                    selectedTicketParticipant["Status Pembayaran"] === 'Lunas'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {selectedTicketParticipant["Status Pembayaran"]}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-inner my-2">
                  <QRCodeSVG 
                    value={`${window.location.origin}/scanner.html?id=${encodeURIComponent(selectedTicketParticipant["No. Registrasi"])}`} 
                    size={180} 
                    level="H" 
                    includeMargin={true}
                  />
                </div>

                <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg font-mono w-full truncate">
                  {window.location.origin}/scanner.html?id={selectedTicketParticipant["No. Registrasi"]}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-slate-200 bg-white flex flex-col gap-2">
              <button
                onClick={() => handleDownloadTicket(selectedTicketParticipant)}
                disabled={downloadingId === selectedTicketParticipant["No. Registrasi"]}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-sm cursor-pointer disabled:opacity-50"
              >
                {downloadingId === selectedTicketParticipant["No. Registrasi"] ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Mengunduh E-Ticket...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download E-Ticket (.jpg)
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSendWhatsapp(selectedTicketParticipant)}
                  className="py-2.5 px-3 bg-[#25D366] hover:bg-[#128C7E] text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 text-xs shadow-sm cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  Kirim QR ke WA
                </button>

                <button
                  onClick={() => handleCopyQrLink(selectedTicketParticipant)}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 text-xs border border-slate-200 cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      Tersalin!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Salin Link QR
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Printable E-Ticket Area for Image Generation */}
      {selectedTicketParticipant && (
        <div 
          id={`admin-badge-${selectedTicketParticipant["No. Registrasi"]}`} 
          style={{ 
            width: '450px',
            height: '720px',
            position: 'fixed',
            top: '-9999px',
            left: '-9999px',
            zIndex: -50,
            pointerEvents: 'none',
            backgroundColor: '#ffffff',
            padding: '20px',
            boxSizing: 'border-box'
          }}
        >
          <div className="h-full w-full rounded-2xl overflow-hidden flex flex-col border-2 border-slate-200 bg-white" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
            {/* Header Band */}
            <div 
              className="px-6 pt-5 pb-5 text-white" 
              style={{ backgroundColor: '#0B3D5E' }}
            >
              <div className="flex justify-between items-center">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1 shadow-sm">
                     <img src={EVENT_INFO.eventLogoUrl} className="w-full h-full object-contain" alt="Logo" />
                  </div>
                  <div>
                    <h2 className="text-base font-black tracking-wider leading-tight">KNS PERSADIA 2026</h2>
                    <p className="text-[10px] opacity-90 uppercase tracking-widest mt-0.5">Bogor, Indonesia • 7-8 Nov 2026</p>
                  </div>
                </div>
                <div className="bg-white/15 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border border-white/20">
                  E-TICKET PASS
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 px-6 pt-5 pb-4 flex flex-col bg-white text-center items-center">
              {/* Participant Name */}
              <div className="mb-3 text-center w-full">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">NAMA PESERTA</span>
                <h3 className="text-2xl font-black text-slate-900 leading-tight uppercase break-words">
                  {selectedTicketParticipant["Nama Lengkap"]}
                </h3>
                {selectedTicketParticipant.Institusi && (
                  <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wide">
                    {selectedTicketParticipant.Institusi}
                  </p>
                )}
              </div>

              {/* Category & Access Badges */}
              <div className="flex flex-wrap justify-center gap-2 mb-3 w-full">
                <div className="px-3.5 py-1 rounded-full border border-blue-600 text-blue-700 bg-slate-50 text-[11px] font-black uppercase tracking-wider">
                  {selectedTicketParticipant["Kategori Peserta"]}
                </div>
                <div className="px-3.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-wider">
                  {selectedTicketParticipant["Akses Kegiatan"]}
                </div>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                <span className={`px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${
                  selectedTicketParticipant["Status Pembayaran"] === 'Lunas'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  STATUS: {selectedTicketParticipant["Status Pembayaran"]}
                </span>
              </div>

              {/* LARGE HIGH-CONTRAST SCANNER-FRIENDLY QR CODE CONTAINER */}
              <div className="my-auto p-4 bg-white rounded-2xl border-2 border-slate-900 shadow-lg flex flex-col items-center justify-center w-full max-w-[270px]">
                <div className="bg-white p-2 rounded-xl">
                  <QRCodeSVG 
                    value={`${window.location.origin}/scanner.html?id=${encodeURIComponent(selectedTicketParticipant["No. Registrasi"])}`} 
                    size={200} 
                    level="H" 
                    includeMargin={true}
                  />
                </div>
                <div className="mt-2 text-center border-t border-slate-200 pt-2 w-full">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">ID REGISTRASI</span>
                  <strong className="text-base font-mono font-black text-slate-900 tracking-widest">{selectedTicketParticipant["No. Registrasi"]}</strong>
                </div>
              </div>

            </div>

            {/* Footer Area with Paperless Instructions */}
            <div className="bg-slate-900 text-white px-5 py-4 text-center border-t border-slate-800 flex items-center justify-center">
              <p className="text-[10px] font-bold tracking-wider text-amber-400 uppercase leading-none">
                Simpan E-Ticket ini di galeri HP Anda.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponent for stat cards
function StatCard({ title, value, icon, trend, color }: { title: string, value: string, icon: React.ReactNode, trend: string, color: string }) {
  const bgColors: Record<string, string> = {
    blue: 'bg-blue-50',
    emerald: 'bg-emerald-50',
    amber: 'bg-amber-50',
    indigo: 'bg-indigo-50',
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${bgColors[color]}`}>
          {icon}
        </div>
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
          {trend}
        </span>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      </div>
    </div>
  );
}
