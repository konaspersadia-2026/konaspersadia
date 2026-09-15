import { HeartPulse, ShieldAlert, Award, Sparkles, CheckCircle2, Target, HelpCircle, Users } from "lucide-react";
import { EVENT_INFO } from "../config";
import { motion } from "motion/react";
import { SilhouetteMedis, SilhouettePemeriksaan } from "./BackgroundSilhouettes";

export default function About() {
  const tujuanKegiatan = [
    "Meningkatkan pengetahuan dan keterampilan dokter (khususnya di pelayanan kesehatan primer) serta memberi informasi perkembangan pengobatan mutakhir Diabetes.",
    "Memberikan informasi komprehensif mengenai produk farmasi dan inovasi alat kesehatan terbaru.",
    "Menyelenggarakan Rapat Kerja Nasional dan koordinasi strategis PERSADIA, PERKENI, dan PEDI."
  ];

  const jenisKegiatan = [
    { title: "Pesta Rakyat", desc: "Pemeriksaan gula darah massal gratis dengan target 5.000 peserta dalam satu hari di GOR Pakansari." },
    { title: "Senam Bersama", desc: "Senam bugar diabetesi masal untuk mengampanyekan gaya hidup aktif dan sehat. Dipersembahkan bersama oleh PERSADIA, PEDI, PERKENI, dan KORMI (Komite Olahraga Rekreasi Masyarakat Indonesia)." },
    { title: "Workshop Medis", desc: "Pelatihan interaktif dan intensif khusus bagi dokter umum dan dokter spesialis." },
    { title: "Simposium Klinis", desc: "Seminar sains menyajikan penelitian ilmiah dan tata laksana klinis diabetes termutakhir." },
    { title: "Exhibition", desc: "Exhibition produk kesehatan, alat medis mandiri, dan layanan farmasi terpercaya." },
    { title: "President Elect", desc: "Sidang organisasi untuk Pemilihan Presiden PERSADIA kepengurusan berikutnya." },
    { title: "Rapat Kerja", desc: "Rapat Kerja Nasional organisasi PEDI dan PERKENI demi keselarasan program." }
  ];

  return (
    <section
      id="tentang"
      className="py-20 bg-[#F8FAFC] relative overflow-hidden"
    >
      {/* Background Activity Silhouettes */}
      <div className="absolute top-[20%] right-[-5%] sm:right-[3%] opacity-[0.03] text-slate-500 rotate-12 pointer-events-none z-0">
        <SilhouetteMedis className="w-60 h-60 sm:w-80 sm:h-80" />
      </div>
      <div className="absolute bottom-[10%] left-[-5%] sm:left-[3%] opacity-[0.03] text-slate-500 -rotate-12 pointer-events-none z-0">
        <SilhouettePemeriksaan className="w-60 h-60 sm:w-80 sm:h-80" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Section */}
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight mt-1 mb-4 font-sans">
            Tentang Kongres &amp; Konferensi Gabungan 2026
          </h2>
          <div className="h-1.5 w-24 bg-[#00B4AC] mx-auto rounded-full"></div>
        </motion.div>

        {/* Introduction Narrative Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-16">
          <motion.div 
            className="lg:col-span-7 space-y-6"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-sans">
              Menyambut peringatan <strong>World Diabetes Day (Hari Diabetes Sedunia)</strong> serta <strong>Hari Kesehatan Nasional 2026</strong>, tiga pilar penanganan diabetes terkemuka di Indonesia menyatukan langkah untuk menyelenggarakan pertemuan ilmiah sekaligus bakti masyarakat berskala nasional.
            </p>
            <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
              Kolaborasi historis ini menggabungkan program tahunan <strong>KONAS PERSADIA</strong> (Persatuan Diabetes Indonesia), <strong>KONKER PEDI</strong> (Perkumpulan Edukator Diabetes Indonesia), dan <strong>KONKER PERKENI</strong> (Perkumpulan Endokrinologi Indonesia).
            </p>
            <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
              Dengan mengusung tema <strong className="text-[#0B3D5E]">"Pesta Rakyat Persadia, Menyehatkan Indonesia"</strong> dan fokus utama pada <strong className="text-[#0B3D5E]">"Diabetes, Deteksi Dini Lebih Awal"</strong>, acara ini dirancang inklusif mempertemukan para dokter spesialis, edukator medis, perawat, ahli gizi, penyandang diabetes (diabetesi) beserta keluarga, dan masyarakat umum.
            </p>

            {/* Campaign Tagline Box */}
            <div className="p-5 bg-amber-50 rounded-2xl border-l-4 border-[#C89A2E] shadow-sm">
              <span className="text-[10px] uppercase font-bold text-[#C89A2E] block mb-1">Tema Kampanye Kesehatan</span>
              <p className="text-sm font-extrabold text-slate-800 leading-snug italic">
                "Early Detection for Better Living: Standing Together Against Diabetes at Its Root"
              </p>
            </div>
          </motion.div>

          <motion.div 
            className="lg:col-span-5 bg-gradient-to-tr from-[#0B3D5E] to-[#00B4AC] text-white p-8 rounded-3xl shadow-xl space-y-6 relative"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="absolute top-4 right-4 text-white/10">
              <Sparkles className="h-24 w-24" />
            </div>
            
            <h3 className="text-xl font-bold border-b border-white/20 pb-3 flex items-center gap-2">
              <HeartPulse className="h-6 w-6 text-[#C89A2E] animate-pulse" />
              Tujuan Utama Kegiatan
            </h3>
            
            <ul className="space-y-4 text-xs sm:text-sm">
              {tujuanKegiatan.map((text, idx) => (
                <li key={idx} className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#C89A2E] shrink-0" />
                  <span className="text-white/90 leading-relaxed">{text}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Target Peserta Section */}
        <div className="mb-20">
          <motion.h3 
            className="text-xl font-bold text-center text-slate-800 mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Estimasi Target Peserta &amp; Skala Acara
          </motion.h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="p-4 bg-[#0B3D5E]/10 text-[#0B3D5E] rounded-2xl">
                <Users className="h-8 w-8" />
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-[#0B3D5E] block">400+ Orang</span>
                <strong className="text-xs text-slate-800 block mt-0.5">Track Simposium &amp; Workshop</strong>
                <p className="text-xs text-slate-500 mt-1">Dokter spesialis, dokter umum, residen, dan mahasiswa kedokteran nasional.</p>
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="p-4 bg-[#00B4AC]/10 text-[#00B4AC] rounded-2xl">
                <Target className="h-8 w-8" />
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-[#00B4AC] block">5.000+ Orang</span>
                <strong className="text-xs text-slate-800 block mt-0.5">Track Pesta Rakyat GOR Pakansari</strong>
                <p className="text-xs text-slate-500 mt-1">Dokter, edukator, anggota PERSADIA, serta masyarakat umum Bogor dan sekitarnya.</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Track Separation Highlight Cards */}
        <motion.h3 
          className="text-xl font-bold text-center text-slate-800 mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Dua Jalur (Track) Utama Acara
        </motion.h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {/* Sesi Ilmiah */}
          <motion.div 
            className="bg-white rounded-2xl p-8 border border-slate-100 shadow-md flex flex-col justify-between hover:shadow-lg transition cursor-default"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            whileHover={{ y: -5 }}
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#0B3D5E]/10 text-[#0B3D5E] flex items-center justify-center font-bold text-xl mb-6">
                1
              </div>
              <h4 className="text-xl font-bold text-slate-800 mb-2">Track Ilmiah (Indoor)</h4>
              <p className="text-xs font-bold text-[#0B3D5E] tracking-wider uppercase mb-3 flex items-center gap-1">
                📍 Novotel Bogor • Sabtu, 7 November 2026
              </p>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Diperuntukkan khusus bagi kalangan medis profesional: Dokter Spesialis Penyakit Dalam/Endokrin (PERKENI), Dokter Umum, Perawat, Ahli Gizi, Educator Diabetes (PEDI), Residen/PPDS, dan Mahasiswa Kedokteran. Berisi seminar sains, simposium klinis, diskusi panel, dan workshop studi kasus diabetes terbaru.
              </p>
            </div>
            <div className="bg-[#0B3D5E]/5 rounded-xl p-4 border border-[#0B3D5E]/10">
              <span className="text-xs font-semibold text-[#0B3D5E] block mb-1">Fokus Pembahasan:</span>
              <p className="text-xs text-slate-600 leading-tight">
                Pedoman klinis terbaru, inovasi terapi insulin, manajemen kaki diabetes, teknologi CGMS, dan komunikasi terapeutik bagi pendamping diabetesi.
              </p>
            </div>
          </motion.div>

          {/* Sesi Pesta Rakyat */}
          <motion.div 
            className="bg-white rounded-2xl p-8 border border-slate-100 shadow-md flex flex-col justify-between hover:shadow-lg transition cursor-default"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ y: -5 }}
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#00B4AC]/10 text-[#00B4AC] flex items-center justify-center font-bold text-xl mb-6">
                2
              </div>
              <h4 className="text-xl font-bold text-slate-800 mb-2">Track Pesta Rakyat (Outdoor/Masyarakat)</h4>
              <p className="text-xs font-bold text-[#00B4AC] tracking-wider uppercase mb-3 flex items-center gap-1">
                📍 GOR Pakansari, Cibinong, Bogor • Minggu, 8 November 2026 (mulai 06:00 WIB)
              </p>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Wadah kebersamaan bagi anggota PERSADIA (penyandang diabetes &amp; keluarganya) dan masyarakat umum. Menghadirkan beragam kegiatan luar ruangan yang edukatif dan menyehatkan jasmani untuk mengampanyekan pentingnya deteksi dini gula darah dalam mengontrol laju diabetes nasional.
              </p>
            </div>
            <div className="bg-[#E6F4EA] rounded-xl p-4 border border-[#2D7A4F]/20">
              <span className="text-xs font-semibold text-[#2D7A4F] block mb-1">Rangkaian Kegiatan:</span>
              <p className="text-xs text-slate-600 leading-tight">
                Senam bugar bersama diabetesi, jalan sehat keluarga, konsultasi gizi gratis, pembagian flyer edukasi kesehatan, panggung hiburan rakyat, dan pemeriksaan gula darah gratis massal.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Jenis Kegiatan Grid */}
        <div>
          <motion.h3 
            className="text-xl font-bold text-center text-slate-800 mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Rangkaian &amp; Jenis Kegiatan
          </motion.h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {jenisKegiatan.map((item, idx) => (
              <motion.div
                key={idx}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition"
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
              >
                <div className="w-8 h-8 rounded-lg bg-[#00B4AC]/10 text-[#00B4AC] flex items-center justify-center font-bold text-xs mb-3">
                  {idx + 1}
                </div>
                <strong className="text-xs text-slate-800 block font-bold mb-1">{item.title}</strong>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
