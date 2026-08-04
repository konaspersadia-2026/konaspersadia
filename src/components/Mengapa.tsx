import { motion } from "motion/react";
import { Sparkles, Award, TrendingUp, CheckSquare } from "lucide-react";

export default function Mengapa() {
  return (
    <section className="bg-slate-50 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Storytelling & Visual Highlights (Section Utama) */}
        <motion.div
          className="max-w-5xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-6">
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-2">Mengapa Anda Harus Terlibat?</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Momentum Bento Card */}
            <div className="p-5 bg-gradient-to-br from-[#0B3D5E]/5 to-transparent rounded-2xl border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="p-2 bg-[#0B3D5E]/10 text-[#0B3D5E] rounded-lg w-fit mb-3">
                  <Sparkles className="h-5 w-5" />
                </div>
                <strong className="text-xs text-slate-800 block font-bold mb-1">Momentum Kesehatan Nasional</strong>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Acara ini dihelat tepat di antara dua tonggak penting: <strong>Hari Kesehatan Nasional (12 November)</strong> dan <strong>World Diabetes Day (14 November)</strong>, menjadi panggung kolaborasi terbesar tahun ini.
                </p>
              </div>
            </div>

            {/* Rekor Bento Card */}
            <div className="p-5 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-2xl border border-[#2D7A4F]/20 flex flex-col justify-between">
              <div>
                <div className="p-2 bg-[#E6F4EA] text-[#2D7A4F] rounded-lg w-fit mb-3">
                  <Award className="h-5 w-5" />
                </div>
                <strong className="text-xs text-[#2D7A4F] block font-bold mb-1">Pemecahan Rekor Skrining</strong>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pada Hari ke-2 di GOR Pakansari, mari jadi saksi dan bagian dari <strong>pemeriksaan gula darah massal gratis untuk 10.000 orang dalam satu hari</strong>.
                </p>
              </div>
            </div>

            {/* Statistik Bento Card */}
            <div className="p-5 bg-gradient-to-br from-rose-500/5 to-transparent rounded-2xl border border-rose-100 flex flex-col justify-between">
              <div>
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg w-fit mb-3">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <strong className="text-xs text-rose-950 block font-bold mb-1">Urgensi Diabetes Nasional</strong>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Indonesia berada di <strong>peringkat ke-5 dunia</strong> untuk jumlah penyandang diabetes terbanyak (&gt;19.5 juta jiwa), dan mayoritas tidak menyadari kondisinya. Deteksi dini adalah solusi.
                </p>
              </div>
            </div>
          </div>

          {/* Agenda Highlight Summary (Sabtu vs Minggu) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-6 border-t border-slate-100">
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-[#0B3D5E] block">Hari 1 — Sabtu, 7 Nov 2026 (Novotel Bogor)</span>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckSquare className="h-3.5 w-3.5 text-[#00B4AC] shrink-0 mt-0.5" />
                  <span>Kuliah Umum &amp; Simposium Medis Komprehensif untuk dokter umum &amp; spesialis.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckSquare className="h-3.5 w-3.5 text-[#00B4AC] shrink-0 mt-0.5" />
                  <span>Sesi edukasi interaktif khusus penyandang diabetes (diabetesi) dan keluarga pendamping.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckSquare className="h-3.5 w-3.5 text-[#00B4AC] shrink-0 mt-0.5" />
                  <span><strong>Pelantikan Pengurus PERSADIA Periode 2026–2029</strong> resmi.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckSquare className="h-3.5 w-3.5 text-[#00B4AC] shrink-0 mt-0.5" />
                  <span>Deklarasi Komitmen Nasional Deteksi Dini Diabetes.</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-[#2D7A4F] block">Hari 2 — Minggu, 8 Nov 2026 (GOR Pakansari)</span>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckSquare className="h-3.5 w-3.5 text-[#2D7A4F] shrink-0 mt-0.5" />
                  <span>Pemeriksaan Gula Darah Massal Gratis (Target Rekor 10.000 peserta).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckSquare className="h-3.5 w-3.5 text-[#2D7A4F] shrink-0 mt-0.5" />
                  <span>Senam Diabetes Massal dipandu instruktur berpengalaman.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckSquare className="h-3.5 w-3.5 text-[#2D7A4F] shrink-0 mt-0.5" />
                  <span>Konsultasi Gizi &amp; Kesehatan Gratis bersama dokter spesialis.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckSquare className="h-3.5 w-3.5 text-[#2D7A4F] shrink-0 mt-0.5" />
                  <span>Donor Darah Kemanusiaan dan Pameran Inovasi Kesehatan Diabetes.</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
