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

  const formatDateString = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
    return new Date(dateStr).toLocaleDateString("id-ID", options);
  };

  // Data tarif ilmiah sesuai DAFTAR_BIAYA.md & DOKUMEN_SIMPOSIUM_WORKSHOP_KONAS_PERSADIA_2026.md
  const scientificPricing = [
    {
      kategori: "Dokter Spesialis",
      subKategori: "(Sp.PD, Sp.PD-KEMD)",
      paket: "Symposium + Workshop",
      biaya: 2500000,
      fasilitas: [
        "Sertifikat Akreditasi SKP Kemenkes RI (Plataran Sehat)",
        "Akses Sesi Ilmiah (Plenary & Presidents' Lecture)",
        "Modul Hands-on Workshop Klinis Terapan",
        "Seminar Kit Eksklusif (Tas Kongres & Buku Panduan)",
        "Jamuan Makan Siang Prasmanan (Buffet Lunch) Novotel Bintang 4",
        "2x Rehat Kopi/Kudapan (Coffee Break Pagi & Sore)",
        "Akses Malam Keakraban (Gala Dinner) di Grand Ballroom Novotel",
        "Akses Bebas Hari Ke-2 Pesta Rakyat di Stadion Pakansari"
      ]
    },
    {
      kategori: "Dokter Umum",
      subKategori: "",
      paket: "Symposium + Workshop",
      biaya: 1500000,
      fasilitas: [
        "Akses Penuh Simposium Komprehensif Diabetes & Update Guideline PERKENI",
        "Sesi Paralel Simposium Neuropati & Workshop Teknologi CGM",
        "Sertifikat Akreditasi Resmi SKP Kemenkes RI (Plataran Sehat)",
        "Jamuan Makan Lunch Buffet Novotel Bintang 4 & 2x Coffee Break",
        "Akses Gala Dinner Sabtu malam & Free Pesta Rakyat Minggu pagi"
      ]
    },
    {
      kategori: "Dokter Layanan Primer (FKTP)",
      subKategori: "(Puskesmas / Klinik / Praktisi Mandiri)",
      paket: "Onsite: Rp 600.000 · Online: Rp 300.000",
      biaya: 600000,
      fasilitas: [
        "Pilihan Onsite (Rp 600.000): Hadir Novotel Bogor (Lunch Buffet, Coffee Break, Gala Dinner)",
        "Pilihan Online (Rp 300.000): Mengikuti Sesi Ilmiah Daring via Live Zoom Webinar",
        "Sesi Khusus: 'My Life in FKTP' & 'Diabetes Approach in FKTP'",
        "Fokus Tata Laksana & Deteksi Dini di Fasilitas Kesehatan Tingkat Pertama",
        "Sertifikat Akreditasi Resmi SKP Kemenkes RI (Plataran Sehat)"
      ]
    },
    {
      kategori: "Residen / PPDS",
      subKategori: "(Pendidikan Dokter Spesialis)",
      paket: "Symposium + Workshop",
      biaya: 1000000,
      fasilitas: [
        "Seluruh fasilitas komprehensif peserta ilmiah",
        "Modul Hands-on Workshop & Lembar Kasus Interaktif",
        "Jamuan Makan Lunch Buffet & Gala Dinner Novotel",
        "Akses Bebas Hari Ke-2 Pesta Rakyat di Stadion Pakansari"
      ]
    },
    {
      kategori: "Perawat, Ahli Gizi & Edukator Diabetes",
      subKategori: "(PEDI & Tim Asuhan Medis)",
      paket: "Workshop Medis Terapan",
      isWorkshopOnly: true,
      biaya: 400000,
      fasilitas: [
        "Khusus Hands-on Workshop Medis Terapan",
        "Lembar Kerja Kasus Klinis & Bimbingan Narasumber Pakar",
        "Sertifikat Resmi SKP Kemenkes RI (Plataran Sehat)",
        "Seminar Kit, Jamuan Makan Siang Buffet Novotel & Coffee Break"
      ]
    },
    {
      kategori: "Mahasiswa Kedokteran S1",
      subKategori: "(Tahap Akademik & Profesi / Co-ass)",
      paket: "Symposium + Workshop",
      biaya: 400000,
      fasilitas: [
        "Akses Penuh Symposium & Hands-on Workshop",
        "Fasilitas Seminar Kit, Lunch Buffet, Coffee Break & Gala Dinner",
        "Wajib melampirkan / unggah bukti KTM aktif"
      ]
    }
  ];

  return (
    <section id="biaya" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight mt-1 mb-4 font-sans">
            Biaya &amp; Ketentuan Pendaftaran Resmi
          </h2>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-[#C89A2E]/20 text-[#0B3D5E] border border-[#C89A2E]/30">
            <Info className="h-4 w-4 text-[#00B4AC]" />
            Periode Pendaftaran: <strong className="text-slate-800">s.d. 31 Oktober 2026</strong>
          </div>
        </div>

        {/* Info Banner */}
        <div className="max-w-5xl mx-auto mb-10">
          <div className="bg-[#E6F4EA] border border-[#2D7A4F]/30 text-[#2D7A4F] rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-sm">
            <CheckCircle2 className="h-5 w-5 text-[#2D7A4F] shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-sm sm:text-base">Pendaftaran Resmi Dibuka!</p>
              <p className="text-xs sm:text-sm text-[#2D7A4F]/90 mt-0.5 leading-relaxed">
                Pendaftaran peserta ilmiah (Simposium &amp; Workshop) dibuka hingga <strong>31 Oktober 2026</strong> *(tetap dibuka bila kuota masih ada)*. Seluruh peserta ilmiah mendapatkan sertifikat SKP Kemenkes RI, seminar kit, modul workshop, jamuan makan Novotel (Bintang 4), tiket Malam Keakraban (*Gala Dinner*), dan akses bebas Pesta Rakyat.
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Tabel Ilmiah (Desktop) */}
        <div className="max-w-5xl mx-auto mb-14">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-6 bg-[#0B3D5E] rounded-full inline-block"></span>
                1. Skema Tarif Investasi Pendaftaran Medis (Simposium &amp; Workshop)
              </h3>
              <p className="text-xs text-slate-500 ml-4.5">Lokasi: Novotel Bogor Golf Resort &amp; Convention Center (7 November 2026)</p>
            </div>
          </div>

          <div className="overflow-hidden bg-white border border-slate-200 rounded-3xl shadow-xl hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0B3D5E] text-white border-b border-[#0B3D5E]">
                    <th className="p-4 text-xs font-bold uppercase tracking-wider pl-6 w-2/5">Kategori Peserta Medis</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider w-1/3">Pilihan Paket Kegiatan</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-center w-1/4">Biaya Resmi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {scientificPricing.map((item, idx) => (
                    <tr key={idx} className={`hover:bg-[#F8FAFC]/50 transition duration-150 ${idx % 2 === 1 ? "bg-slate-50/40" : ""}`}>
                      <td className="p-4 pl-6 align-top">
                        <span className="font-extrabold text-slate-800 text-sm block">{item.kategori}</span>
                        {item.subKategori && (
                          <span className="text-xs text-slate-500 font-medium block">{item.subKategori}</span>
                        )}
                      </td>
                      <td className="p-4 align-top">
                        <span className={`inline-block px-3 py-1 rounded-lg text-xs font-black ${
                          item.isWorkshopOnly ? "bg-teal-100 text-teal-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {item.paket}
                        </span>
                      </td>
                      <td className="p-4 text-center align-top">
                        <span className="text-base font-black text-[#0B3D5E] bg-[#00B4AC]/10 px-4 py-2 rounded-xl border border-[#00B4AC]/20 inline-block">
                          {formatRupiah(item.biaya)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View: Sesi Ilmiah */}
          <div className="md:hidden space-y-3">
            {scientificPricing.map((item, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 leading-tight">{item.kategori}</h4>
                  {item.subKategori && (
                    <span className="text-xs text-slate-500 font-medium block mt-0.5">{item.subKategori}</span>
                  )}
                  <div className="mt-2">
                    <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                      item.isWorkshopOnly ? "bg-teal-100 text-teal-800" : "bg-amber-100 text-amber-800"
                    }`}>
                      {item.paket}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <span className="text-sm font-black text-[#0B3D5E] bg-[#00B4AC]/10 px-3 py-1.5 rounded-xl border border-[#00B4AC]/20 inline-block">
                    {formatRupiah(item.biaya)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Callout Fasilitas Tambahan Seluruh Peserta Ilmiah */}
          <div className="mt-4 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-xs text-amber-900 flex items-start gap-3 shadow-sm">
            <span className="text-base leading-none mt-0.5">💡</span>
            <div>
              <strong className="font-extrabold text-amber-950 block mb-0.5 text-xs sm:text-sm">Fasilitas Tambahan Seluruh Peserta Ilmiah:</strong>
              <p className="text-amber-900/90 leading-relaxed text-xs">
                Seluruh peserta Simposium &amp; Workshop berhak atas akses bebas (<em>free access</em>) menghadiri rangkaian Hari Ke-2 (Minggu, 8 November 2026) di Stadion Pakansari: Skrining Massal 7.000 Peserta, Senam Sehat Diabetes Nusantara, dan Pameran Kesehatan.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Paket Voucher Khusus Dokter Umum (Kolektif / FKTP) */}
        <div className="max-w-5xl mx-auto mb-14">
          <div className="mb-4">
            <h3 className="text-lg sm:text-xl font-black text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-6 bg-[#C89A2E] rounded-full inline-block"></span>
              2. Paket Voucher Khusus Dokter Umum (Kolektif / FKTP)
            </h3>
            <p className="text-xs text-slate-500 ml-4.5">Skema pendaftaran kolektif bagi Puskesmas, Klinik Pratama, &amp; RS Daerah</p>
          </div>

          <div className="overflow-hidden bg-white border border-slate-200 rounded-3xl shadow-xl hidden md:block">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#C89A2E] text-slate-900 border-b border-amber-500">
                  <th className="p-4 text-xs font-bold uppercase tracking-wider pl-6 w-1/4">Jenis Voucher</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider w-1/3">Sasaran</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-center w-1/6">Tarif Paket</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-amber-50/30 transition">
                  <td className="p-4 pl-6 align-top">
                    <span className="font-extrabold text-slate-800 text-sm block">Voucher Instansi</span>
                    <span className="font-mono text-xs text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded border border-amber-300 inline-block mt-0.5">Kode FKTP-xxxxxx</span>
                  </td>
                  <td className="p-4 text-xs text-slate-700 align-top leading-relaxed">
                    Fasilitas Kesehatan Tingkat Pertama (Klinik Pratama / Puskesmas / RS Daerah)
                  </td>
                  <td className="p-4 text-center align-top">
                    <span className="text-base font-black text-[#0B3D5E] bg-amber-100 px-3.5 py-1.5 rounded-xl border border-amber-300 inline-block">
                      Rp 600.000
                    </span>
                  </td>
                  <td className="p-4 text-xs text-slate-600 align-top leading-relaxed">
                    Paket pendaftaran kolektif dokter umum untuk memfasilitasi delegasi tenaga medis layanan primer.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile view for Voucher */}
          <div className="md:hidden bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2.5">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-sm text-slate-800">Voucher Instansi FKTP</h4>
                <span className="font-mono text-xs text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded border border-amber-200 inline-block mt-1">Kode FKTP-xxxxxx</span>
              </div>
              <span className="text-xs font-black bg-amber-100 text-[#0B3D5E] px-2.5 py-1 rounded-lg border border-amber-300">
                Rp 600.000
              </span>
            </div>
            <p className="text-xs text-slate-600">
              <strong>Sasaran:</strong> Fasilitas Kesehatan Tingkat Pertama (Klinik Pratama / Puskesmas / RS Daerah).
            </p>
            <p className="text-[11px] text-slate-500 italic">
              Paket pendaftaran kolektif dokter umum untuk memfasilitasi delegasi tenaga medis layanan primer.
            </p>
          </div>
        </div>

        {/* Section 3: Tabel Kegiatan Publik & Komunitas */}
        <div className="max-w-5xl mx-auto mb-14">
          <div className="mb-4">
            <h3 className="text-lg sm:text-xl font-black text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-6 bg-[#2D7A4F] rounded-full inline-block"></span>
              3. Biaya Kegiatan Publik &amp; Komunitas (Hari Ke-1 &amp; Hari Ke-2)
            </h3>
            <p className="text-xs text-slate-500 ml-4.5">Lokasi: Novotel Bogor &amp; Stadion Pakansari (7–8 November 2026)</p>
          </div>

          <div className="overflow-hidden bg-white border border-slate-200 rounded-3xl shadow-xl hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#2D7A4F] text-white border-b border-[#2D7A4F]">
                    <th className="p-4 text-xs font-bold uppercase tracking-wider pl-6 w-1/4">Kategori Peserta</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider w-1/4">Kegiatan &amp; Sesi</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-center w-1/6">Biaya</th>
                    <th className="p-4 text-xs font-bold uppercase tracking-wider">Fasilitas &amp; Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-[#F8FAFC]/50 transition duration-150">
                    <td className="p-4 pl-6 align-top border-r border-slate-100 bg-white" rowSpan={2}>
                      <span className="font-extrabold text-slate-800 text-sm block">Anggota PERSADIA</span>
                      <span className="text-[11px] text-slate-500 font-medium">*Wajib verifikasi Nama Ketua Cabang</span>
                    </td>
                    <td className="p-4 align-top font-bold text-[#2D7A4F] text-sm">
                      Pesta Rakyat (8 Nov 2026)
                      <span className="block text-[11px] text-slate-400 font-normal">Stadion Pakansari</span>
                    </td>
                    <td className="p-4 text-center align-top">
                      <span className="text-sm font-black text-[#2D7A4F] bg-[#E6F4EA] px-3 py-1.5 rounded-xl border border-[#2D7A4F]/20 inline-block">
                        Gratis (Rp 0)
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-600 align-top leading-relaxed">
                      Senam bugar diabetes massal, jalan sehat nusantara, skrining gula darah gratis, doorprize menarik.
                    </td>
                  </tr>
                  <tr className="hover:bg-[#F8FAFC]/50 transition duration-150 bg-blue-50/20">
                    <td className="p-4 align-top font-bold text-blue-700 text-sm">
                      Diabetes Health Forum (7 Nov 2026)
                      <span className="block text-[11px] text-slate-400 font-normal">Novotel Bogor</span>
                    </td>
                    <td className="p-4 text-center align-top">
                      <span className="text-sm font-black text-slate-800 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 inline-block">
                        Rp 200.000
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-600 align-top leading-relaxed">
                      Temu 6 Tokoh Diabetisi &amp; diskusi interaktif bersama dr. Boyke Dian Nugraha, SpOG, materi edukasi, konsumsi, dan sertifikat.
                    </td>
                  </tr>
                  <tr className="hover:bg-[#F8FAFC]/50 transition duration-150 border-t border-slate-200">
                    <td className="p-4 pl-6 align-top border-r border-slate-100 bg-white" rowSpan={3}>
                      <span className="font-extrabold text-slate-800 text-sm block">Masyarakat Umum</span>
                    </td>
                    <td className="p-4 align-top font-bold text-slate-700 text-sm">
                      Pesta Rakyat (Akses Reguler)
                      <span className="block text-[11px] text-slate-400 font-normal">8 Nov 2026 di Stadion Pakansari</span>
                    </td>
                    <td className="p-4 text-center align-top">
                      <span className="text-sm font-black text-[#2D7A4F] bg-[#E6F4EA] px-3 py-1.5 rounded-xl border border-[#2D7A4F]/20 inline-block">
                        Gratis (Rp 0)
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-600 align-top leading-relaxed">
                      Senam diabetes massal, pemeriksaan skrining gula darah gratis bagi 7.000 peserta, hiburan musik.
                    </td>
                  </tr>
                  <tr className="hover:bg-[#F8FAFC]/50 transition duration-150 bg-amber-50/20">
                    <td className="p-4 align-top font-bold text-amber-900 text-sm">
                      Pesta Rakyat (Paket Berbayar)
                      <span className="block text-[11px] text-amber-700 font-semibold">+ Kaos Eksklusif</span>
                    </td>
                    <td className="p-4 text-center align-top">
                      <span className="text-sm font-black text-slate-800 bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 inline-block">
                        Rp 100.000
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-600 align-top leading-relaxed">
                      Seluruh fasilitas gratis + <strong>Kaos Eksklusif Pesta Rakyat KONAS PERSADIA 2026</strong>, goodie bag, dan snack box.
                    </td>
                  </tr>
                  <tr className="hover:bg-[#F8FAFC]/50 transition duration-150 bg-blue-50/20">
                    <td className="p-4 align-top font-bold text-blue-700 text-sm">
                      Diabetes Health Forum (7 Nov 2026)
                      <span className="block text-[11px] text-slate-400 font-normal">Novotel Bogor</span>
                    </td>
                    <td className="p-4 text-center align-top">
                      <span className="text-sm font-black text-slate-800 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 inline-block">
                        Rp 200.000
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-600 align-top leading-relaxed">
                      Sesi talkshow edukasi kesehatan reproduksi &amp; diabetes bersama narasumber ahli, sertifikat, dan jamuan konsumsi.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View: Publik & Komunitas */}
          <div className="md:hidden space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-[#2D7A4F] text-white p-3 font-bold text-sm">
                Anggota PERSADIA
              </div>
              <div className="p-4 space-y-3">
                <div className="space-y-1.5 border-b pb-2.5">
                  <div className="font-bold text-[#2D7A4F] text-xs">Pesta Rakyat (8 Nov 2026, Stadion Pakansari)</div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Biaya:</span>
                    <span className="font-bold text-[#2D7A4F] bg-[#E6F4EA] px-2 py-0.5 rounded">Gratis (Rp 0)</span>
                  </div>
                  <p className="text-[10px] text-slate-500">*Wajib verifikasi Nama Ketua Cabang saat pendaftaran</p>
                </div>
                <div className="space-y-1.5">
                  <div className="font-bold text-blue-700 text-xs">Diabetes Health Forum (7 Nov 2026, Novotel)</div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Biaya:</span>
                    <span className="font-bold text-slate-800">Rp 200.000</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-[#0B3D5E] text-white p-3 font-bold text-sm">
                Masyarakat Umum
              </div>
              <div className="p-4 space-y-3">
                <div className="space-y-1.5 border-b pb-2.5">
                  <div className="font-bold text-[#2D7A4F] text-xs">Pesta Rakyat (Akses Reguler)</div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Biaya:</span>
                    <span className="font-bold text-[#2D7A4F] bg-[#E6F4EA] px-2 py-0.5 rounded">Gratis (Rp 0)</span>
                  </div>
                </div>
                <div className="space-y-1.5 border-b pb-2.5">
                  <div className="font-bold text-amber-700 text-xs">Pesta Rakyat (Paket Berbayar + Kaos)</div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Biaya:</span>
                    <span className="font-bold text-slate-800">Rp 100.000</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Termasuk Kaos Eksklusif Pesta Rakyat, goodie bag &amp; snack box.</p>
                </div>
                <div className="space-y-1.5">
                  <div className="font-bold text-blue-700 text-xs">Diabetes Health Forum (7 Nov 2026)</div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Biaya:</span>
                    <span className="font-bold text-slate-800">Rp 200.000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="max-w-5xl mx-auto mb-12 bg-slate-50 p-5 sm:p-7 rounded-2xl border border-slate-200/80 text-xs sm:text-sm text-slate-600 space-y-2.5">
          <p className="font-extrabold text-slate-800 mb-3 flex items-center gap-2 text-sm sm:text-base">
            <Info className="h-5 w-5 text-[#00B4AC]" /> Catatan Penting Pendaftaran:
          </p>
          <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 leading-relaxed">
            <li>Batas akhir pendaftaran dan konfirmasi transfer pembayaran: <strong className="text-slate-800">{formatDateString(EVENT_INFO.deadlinePembayaranPeserta)}</strong> *(pendaftaran tetap dibuka bila kuota masih ada)*.</li>
            <li>Seluruh peserta Simposium &amp; Workshop berhak atas akses gratis menghadiri **Malam Keakraban (Gala Dinner)** pada Sabtu malam serta **Pesta Rakyat** (skrining gula darah 7.000 peserta &amp; senam sehat) pada Minggu pagi di Stadion Pakansari.</li>
            <li>Tersedia **Paket Voucher Instansi (Kode `FKTP-xxxxxx`)** senilai **Rp 600.000** bagi faskes tingkat pertama (klinik/puskesmas/RS) untuk pendaftaran delegasi dokter umum.</li>
            <li>Pendaftaran Pesta Rakyat (8 Nov 2026 di Stadion Pakansari) untuk <strong className="text-slate-800">Anggota PERSADIA adalah Gratis (Rp 0)</strong> dengan mencantumkan nama ketua cabang untuk verifikasi.</li>
            <li>Masyarakat Umum yang mengikuti Pesta Rakyat (8 Nov) dapat memilih <strong className="text-[#2D7A4F]">Akses Gratis (Rp 0)</strong> atau <strong className="text-slate-800">Paket Berbayar (Rp 100.000)</strong> dengan benefit tambahan Kaos Eksklusif Pesta Rakyat KONAS PERSADIA 2026, goodie bag, dan snack box.</li>
            <li>Sesi <strong className="text-slate-800">Diabetes Health Forum (7 Nov 2026 di Novotel)</strong> dapat diikuti oleh Anggota PERSADIA dan Masyarakat Umum dengan biaya <strong className="text-slate-800">Rp 200.000</strong>.</li>
          </ul>
        </div>

        {/* Large Central Call to Action */}
        <div className="bg-gradient-to-r from-[#0B3D5E] to-[#00B4AC] rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center text-white shadow-xl max-w-4xl mx-auto">
          <h3 className="text-lg sm:text-2xl font-bold mb-3">Siap Menjadi Bagian dari Konferensi Ini?</h3>
          <p className="text-xs sm:text-sm text-[#F8FAFC] max-w-xl mx-auto mb-6 leading-relaxed">
            Klik tombol di bawah ini untuk mengisi formulir pendaftaran. Proses pendaftaran hanya memakan waktu 3 menit dengan konfirmasi otomatis berdasarkan 3 digit kode unik transfer.
          </p>
          <button
            id="fees-btn-daftar"
            onClick={onOpenRegister}
            className="px-6 sm:px-8 py-3.5 sm:py-4 bg-[#C89A2E] hover:bg-[#F8FAFC] text-[#0B3D5E] hover:text-[#0B3D5E] font-extrabold text-sm sm:text-base rounded-full shadow-lg hover:shadow-xl transition-all cursor-pointer"
          >
            Daftar Sekarang Secara Instan
          </button>
        </div>
      </div>
    </section>
  );
}
