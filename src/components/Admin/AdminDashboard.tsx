import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  Users, DollarSign, CheckCircle, Clock, Search, ChevronLeft, ShieldAlert,
  Loader2, LogOut, CheckSquare, XCircle
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateHome: () => void;
}

// Simple PIN for demo purposes (In real apps, use proper auth or env var)
const ADMIN_PIN = "k0n@5p3r5@d1@";

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
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  const [data, setData] = useState<Pendaftar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean; id: string; status: string}>({ isOpen: false, id: "", status: "" });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
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
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");
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
    } catch (err: any) {
      console.error(err);
      setActionError("Terjadi kesalahan jaringan saat update status: " + err.message);
    } finally {
      setActionLoadingId(null);
    }
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
          <h1 className="text-2xl font-bold text-slate-800 text-center mb-2">Admin Dashboard</h1>
          <p className="text-slate-500 text-center mb-6">Masukkan PIN keamanan untuk mengakses dashboard panitia.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Masukkan PIN"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full px-4 py-3 text-center tracking-[0.5em] font-mono text-lg rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                autoFocus
              />
            </div>
            {pinError && <p className="text-red-500 text-sm text-center">{pinError}</p>}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Masuk Dashboard
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <button onClick={onNavigateHome} className="text-sm text-slate-500 hover:text-slate-800 flex items-center justify-center mx-auto">
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
              <h1 className="font-bold text-xl text-slate-800 tracking-tight">Konas Admin</h1>
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
                <h3 className="text-lg font-bold text-slate-800 mb-6">Status Pembayaran</h3>
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
                            <div className="text-xs text-slate-500 mt-0.5">{row["No. WhatsApp"]}</div>
                            <div className="text-xs text-slate-500">{row.Email}</div>
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
                            {row["Status Pembayaran"] === 'Menunggu Verifikasi' ? (
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => setConfirmDialog({ isOpen: true, id: row["No. Registrasi"], status: "Lunas" })}
                                  disabled={actionLoadingId === row["No. Registrasi"]}
                                  className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                >
                                  {actionLoadingId === row["No. Registrasi"] ? (
                                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                                  ) : (
                                    <CheckSquare className="w-4 h-4 mr-1.5" />
                                  )}
                                  Lunas
                                </button>
                                <button
                                  onClick={() => setConfirmDialog({ isOpen: true, id: row["No. Registrasi"], status: "Dibatalkan" })}
                                  disabled={actionLoadingId === row["No. Registrasi"]}
                                  className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                >
                                  {actionLoadingId === row["No. Registrasi"] ? (
                                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                                  ) : (
                                    <XCircle className="w-4 h-4 mr-1.5" />
                                  )}
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">
                                {row["Status Pembayaran"] === 'Lunas' ? 'Terverifikasi' : 'Dibatalkan'}
                              </span>
                            )}
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
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={executeUpdateStatus}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  confirmDialog.status === "Lunas" 
                    ? "bg-emerald-600 hover:bg-emerald-700" 
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                Ya, Ubah Status
              </button>
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
