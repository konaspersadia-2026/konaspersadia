import { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const faqs = [
    {
      q: "Siapa saja yang diperbolehkan mendaftar ke acara ini?",
      a: "Acara ini terbuka lebar untuk dua kelompok audiens: (1) Tenaga medis profesional seperti dokter spesialis endokrin/lainnya, dokter umum, perawat, ahli gizi, dan mahasiswa kedokteran untuk mengikuti Sesi Ilmiah di Novotel Bogor. (2) Penyandang diabetes (diabetesi) beserta keluarga mereka, dan masyarakat umum untuk mengikuti rangkaian Pesta Rakyat & skrining kesehatan gratis di GOR Pakansari, Cibinong, Bogor."
    },
    {
      q: "Bagaimana cara melakukan verifikasi pembayaran pendaftaran?",
      a: "Setelah mengisi biodata diri dan memilih kategori peserta di pop-up pendaftaran, sistem kami akan memunculkan nominal tagihan transfer yang ditambahkan dengan 3 digit kode unik acak (misal: Rp 1.500.342). Silakan transfer ke rekening resmi panitia tepat pas hingga digit terakhir tersebut. Anda juga wajib mengunggah screenshot bukti transfer. Tim bendahara kami akan mencocokkan mutasi rekening secara manual dan memperbarui status pendaftaran Anda di halaman 'Cek Status Pendaftaran' dalam kurun 1x24 jam."
    },
    {
      q: "Apakah pendaftaran Pesta Rakyat di GOR Pakansari wajib membayar?",
      a: "Pendaftaran Pesta Rakyat bagi Anggota PERSADIA adalah Gratis (atau Rp 25.000 jika mendaftar reguler di luar masa Early Bird). Sedangkan untuk Masyarakat Umum adalah Rp 50.000 (sudah mencakup konsumsi pagi, atribut senam, serta kupon undian doorprize). Semua pendaftaran di track Pesta Rakyat mendapatkan hak pemeriksaan gula darah gratis."
    },
    {
      q: "Bagaimana cara mengunggah dokumen bukti jika ukuran file kamera HP terlalu besar?",
      a: "Anda tidak perlu khawatir. Portal website kami dilengkapi dengan sistem pengompres otomatis di sisi browser (client-side compression). Ketika Anda mengunggah screenshot bukti transfer atau kartu mahasiswa dari kamera/galeri HP, sistem akan secara otomatis mengecilkan dimensi lebar maksimal ke ~1000px dengan kualitas sedang tanpa mengurangi kejelasan data transaksi. Pengiriman data menjadi sangat cepat dan hemat kuota internet Anda."
    },
    {
      q: "Apakah saya mendapatkan e-sertifikat setelah acara selesai?",
      a: "Ya, seluruh peserta terdaftar yang status pendaftarannya berstatus 'Terverifikasi' dan menghadiri sesi kegiatan (Sesi Ilmiah maupun Pesta Rakyat) akan berhak menerima E-Sertifikat resmi yang akan dikirimkan panitia ke email masing-masing setelah pelaksanaan selesai."
    },
    {
      q: "Kemana saya harus menghubungi jika menemui kendala teknis dalam pengisian form?",
      a: "Silakan menghubungi admin pelaksana pendaftaran melalui kontak layanan bantuan yang tercantum di bagian bawah halaman website (Email panitia atau WhatsApp resmi)."
    }
  ];

  const handleToggle = (idx: number) => {
    if (openIdx === idx) {
      setOpenIdx(null);
    } else {
      setOpenIdx(idx);
    }
  };

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight mt-1 mb-4 font-sans">
            Pertanyaan yang Sering Diajukan (FAQ)
          </h2>
          <div className="h-1.5 w-24 bg-[#00B4AC] mx-auto rounded-full"></div>
        </div>

        {/* FAQ Accordion Grid */}
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="bg-slate-50 rounded-2xl border border-slate-200/40 overflow-hidden transition-all duration-200 hover:border-[#00B4AC]/40 shadow-sm"
              >
                <button
                  onClick={() => handleToggle(idx)}
                  className="w-full px-6 py-5 flex justify-between items-center text-left focus:outline-none cursor-pointer"
                >
                  <span className="font-extrabold text-slate-800 text-sm sm:text-base flex items-center gap-2.5">
                    <HelpCircle className="h-5 w-5 text-[#00B4AC] shrink-0" />
                    {faq.q}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-[#0B3D5E] shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400 shrink-0" />
                  )}
                </button>
                
                {isOpen && (
                  <div className="px-6 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4 bg-white font-sans">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
