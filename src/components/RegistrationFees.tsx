import { KATEGORI_PESERTA, EVENT_INFO } from "../config";
import { Info, HelpCircle, FileText, CheckCircle2 } from "lucide-react";

interface RegistrationFeesProps {
  onOpenRegister: () => void;
}

export default function RegistrationFees({ onOpenRegister }: RegistrationFeesProps) {
  const formatRupiah = (num: number) => {
    if (num === 0) return "Gratis";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const isEarlyBirdActive = () => {
    const deadline = new Date(`${EVENT_INFO.batasEarlyBird}T23:59:59+07:00`).getTime();
    const now = new Date().getTime();
    return now <= deadline;
  };

  const isOnsiteActive = () => {
    const deadline = new Date(`${EVENT_INFO.batasOnsite}T00:00:00+07:00`).getTime();
    const now = new Date().getTime();
    return now >= deadline;
  };

  const formatDateString = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
    return new Date(dateStr).toLocaleDateString("id-ID", options);
  };

  const ilmiahCategories = KATEGORI_PESERTA.filter(k => k.akses === "ilmiah");
  const pestaRakyatCategories = KATEGORI_PESERTA.filter(k => k.akses === "pesta_rakyat");

  return (
    <section id="biaya" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight mt-1 mb-4 font-sans">
            Biaya & Ketentuan Pendaftaran
          </h2>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-[#C89A2E]/20 text-[#0B3D5E] border border-[#C89A2E]/30">
            <Info className="h-4 w-4 text-[#00B4AC]" />
            Periode Early Bird: <strong className="text-slate-800">Agustus–September 2026</strong>
          </div>
        </div>

        {/* Info Banner on Early Bird Status */}
        <div className="max-w-4xl mx-auto mb-10">
          {isEarlyBirdActive() ? (
            <div className="bg-[#E6F4EA] border border-[#2D7A4F]/30 text-[#2D7A4F] rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-sm">
              <CheckCircle2 className="h-5 w-5 text-[#2D7A4F] shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-sm sm:text-base">Masa Registrasi Early Bird Aktif!</p>
                <p className="text-xs sm:text-sm text-[#2D7A4F]/90 mt-0.5">
                  Daftarkan diri Anda sekarang sebelum akhir <strong>September 2026</strong> untuk mendapatkan potongan harga eksklusif.
                </p>
              </div>
            </div>
          ) : isOnsiteActive() ? (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-sm">
              <Info className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-sm sm:text-base">Harga Onsite Berlaku</p>
                <p className="text-xs sm:text-sm text-rose-700/90 mt-0.5">
                  Masa pendaftaran Early Bird telah berakhir. Harga tiket saat ini menggunakan tarif Onsite (mulai Oktober 2026).
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-sm">
              <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-sm sm:text-base">Registrasi Reguler Berlaku</p>
                <p className="text-xs sm:text-sm text-amber-700/90 mt-0.5">
                  Periode Early Bird telah berakhir. Harga tiket menggunakan tarif reguler sebelum masuk masa Onsite pada <strong>{formatDateString(EVENT_INFO.batasOnsite)}</strong>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="max-w-5xl mx-auto overflow-hidden bg-white border border-slate-100 rounded-3xl shadow-xl mb-6 hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0B3D5E] text-white border-b border-[#0B3D5E]">
                  <th className="p-4 text-xs font-bold uppercase tracking-wider pl-6">Kategori</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider">Pilihan Kegiatan</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-center">Early Bird<br/><span className="text-[10px] font-normal">(Agustus–September 2026)</span></th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-center">Onsite<br/><span className="text-[10px] font-normal">(Mulai {formatDateString(EVENT_INFO.batasOnsite)})</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ilmiahCategories.map((kategori) => (
                  <tr key={`${kategori.id}-symposium`} className="hover:bg-[#F8FAFC]/30 transition duration-150">
                    <td className="p-4 font-extrabold text-slate-800 text-sm pl-6 max-w-xs">{kategori.label}</td>
                    <td className="p-4 font-bold text-[#00B4AC] text-sm">Symposium</td>
                    <td className="p-4 text-center">
                      <span className={`text-sm font-bold ${isEarlyBirdActive() ? "text-[#2D7A4F] bg-[#E6F4EA] px-2.5 py-1 rounded-md" : "text-slate-500"}`}>
                        {formatRupiah(kategori.hargaSymposium?.earlyBird || 0)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`text-sm font-bold ${isOnsiteActive() ? "text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md" : "text-slate-500"}`}>
                        {formatRupiah(kategori.hargaSymposium?.onsite || 0)}
                      </span>
                    </td>
                  </tr>
                ))}
                {ilmiahCategories.map((kategori) => (
                  <tr key={`${kategori.id}-workshop`} className="hover:bg-[#F8FAFC]/30 transition duration-150 bg-slate-50/50">
                    <td className="p-4 font-extrabold text-slate-800 text-sm pl-6 max-w-xs">{kategori.label}</td>
                    <td className="p-4 font-bold text-[#C89A2E] text-sm">Symposium + Workshop</td>
                    <td className="p-4 text-center">
                      <span className={`text-sm font-bold ${isEarlyBirdActive() ? "text-[#2D7A4F] bg-[#E6F4EA] px-2.5 py-1 rounded-md" : "text-slate-500"}`}>
                        {formatRupiah(kategori.hargaSymposiumWorkshop?.earlyBird || 0)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`text-sm font-bold ${isOnsiteActive() ? "text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md" : "text-slate-500"}`}>
                        {formatRupiah(kategori.hargaSymposiumWorkshop?.onsite || 0)}
                      </span>
                    </td>
                  </tr>
                ))}
                {pestaRakyatCategories.map((kategori) => (
                  <tr key={kategori.id} className="hover:bg-[#F8FAFC]/30 transition duration-150">
                    <td className="p-4 font-extrabold text-slate-800 text-sm pl-6 max-w-xs">{kategori.label}</td>
                    <td className="p-4 font-bold text-slate-600 text-sm">Pesta Rakyat</td>
                    <td className="p-4 text-center">
                      <span className={`text-sm font-bold text-[#2D7A4F] bg-[#E6F4EA] px-2.5 py-1 rounded-md`}>
                        {kategori.hargaEarlyBird === 0 ? "Gratis" : formatRupiah(kategori.hargaEarlyBird || 0)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`text-sm font-bold text-slate-500`}>
                        {kategori.hargaReguler === 0 ? "Gratis" : formatRupiah(kategori.hargaReguler || 0)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile View */}
        <div className="md:hidden max-w-5xl mx-auto space-y-4 mb-6">
          {ilmiahCategories.map((kategori) => (
            <div key={`${kategori.id}-mobile`} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-[#0B3D5E] text-white p-3 font-bold text-sm">
                {kategori.label}
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <div className="font-bold text-[#00B4AC] border-b pb-1">Symposium</div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Early Bird:</span>
                    <span className="font-bold">{formatRupiah(kategori.hargaSymposium?.earlyBird || 0)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Onsite:</span>
                    <span className="font-bold">{formatRupiah(kategori.hargaSymposium?.onsite || 0)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="font-bold text-[#C89A2E] border-b pb-1">Symposium + Workshop</div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Early Bird:</span>
                    <span className="font-bold">{formatRupiah(kategori.hargaSymposiumWorkshop?.earlyBird || 0)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Onsite:</span>
                    <span className="font-bold">{formatRupiah(kategori.hargaSymposiumWorkshop?.onsite || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {pestaRakyatCategories.map((kategori) => (
             <div key={`${kategori.id}-mobile`} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-[#0B3D5E] text-white p-3 font-bold text-sm">
                {kategori.label}
              </div>
              <div className="p-4 space-y-2">
                <div className="font-bold text-slate-600 border-b pb-1">Pesta Rakyat</div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Early Bird:</span>
                  <span className="font-bold">{kategori.hargaEarlyBird === 0 ? "Gratis" : formatRupiah(kategori.hargaEarlyBird || 0)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Onsite:</span>
                  <span className="font-bold">{kategori.hargaReguler === 0 ? "Gratis" : formatRupiah(kategori.hargaReguler || 0)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Important Notes */}
        <div className="max-w-5xl mx-auto mb-12 bg-slate-50 p-6 rounded-2xl border border-slate-100 text-sm text-slate-600 space-y-2">
          <p className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Info className="h-5 w-5 text-[#00B4AC]" /> Catatan Penting:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Biaya sudah termasuk: akses materi, e-certificate, seminar kit, dan konsumsi.</li>
            <li><strong className="text-slate-800">Spesial:</strong> 200 pendaftar pertama berhak mendapatkan tiket gratis Gala Dinner.</li>
            <li>Semua pendaftar berbayar juga berhak mengikuti acara tambahan pada tanggal 8.</li>
            <li>Harga dapat berubah sewaktu-waktu tanpa pemberitahuan sebelumnya.</li>
            <li>Deadline pembayaran peserta: <strong className="text-slate-800">{formatDateString(EVENT_INFO.deadlinePembayaranPeserta)}</strong></li>
          </ul>
        </div>

        {/* Large Central Call to Action */}
        <div className="bg-gradient-to-r from-[#0B3D5E] to-[#00B4AC] rounded-3xl p-8 sm:p-12 text-center text-white shadow-xl max-w-4xl mx-auto">
          <h3 className="text-xl sm:text-2xl font-bold mb-3">Siap Menjadi Bagian dari Konferensi Ini?</h3>
          <p className="text-xs sm:text-sm text-[#F8FAFC] max-w-xl mx-auto mb-6">
            Klik tombol di bawah ini untuk mengisi formulir pendaftaran. Proses pendaftaran hanya memakan waktu 3 menit dengan konfirmasi otomatis berdasarkan 3 digit kode unik.
          </p>
          <button
            id="fees-btn-daftar"
            onClick={onOpenRegister}
            className="px-8 py-4 bg-[#C89A2E] hover:bg-[#F8FAFC] text-[#0B3D5E] hover:text-[#0B3D5E] font-extrabold text-base rounded-full shadow-lg hover:shadow-xl transition-all cursor-pointer"
          >
            Daftar Sekarang Secara Instan
          </button>
        </div>
      </div>
    </section>
  );
}
