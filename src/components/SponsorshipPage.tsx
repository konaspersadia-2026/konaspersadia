import { motion } from "motion/react";
import { 
  ArrowLeft, CheckCircle2, Diamond, Gem, Star, Shield, Medal, Briefcase, 
  MessageCircle, Calendar, MapPin, Users, HeartPulse, Building, CreditCard, 
  AlertCircle, FileText, Gift, Sparkles, Mail, Phone, Award, ChevronRight
} from "lucide-react";
import Footer from "./Footer";
import { useEffect, useState } from "react";

interface SponsorshipPageProps {
  onNavigateHome: () => void;
}

export default function SponsorshipPage({ onNavigateHome }: SponsorshipPageProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const handleScroll = () => {
      setScrolled(window.scrollY > 150);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const whatsappUrl = "https://wa.me/628980287820?text=Halo%20Panitia%20Konas%20Persadia,%20saya%20tertarik%20untuk%20menjadi%20sponsor.";
  const emailUrl = "mailto:diabetesinitiativeid@gmail.com?subject=Inquiry%20Sponsorship%20Konas%20Persadia%202026";

  const sponsorshipTiers = [
    {
      id: "nusantara",
      name: "NUSANTARA",
      badge: "Sponsor Tunggal / Utama",
      icon: <Star className="h-8 w-8 text-amber-500" />,
      color: "border-amber-400/60 bg-gradient-to-br from-amber-50/80 via-amber-100/30 to-white",
      headerBg: "bg-gradient-to-r from-amber-600 to-amber-500 text-white",
      textColor: "text-amber-800",
      accentColor: "bg-amber-500",
      description: "Kategori sponsorship eksklusif tertinggi sebagai Sponsor Tunggal Pelaksanaan Pesta Rakyat PERSADIA (8 November 2026) di Stadion Pakansari dengan target 5.000++ peserta.",
      benefits: [
        "Kolaborasi strategis bersama panitia dalam menghadirkan aktivitas promosi yang terintegrasi (aktivasi & eksposur disesuaikan dengan tujuan komunikasi sponsor).",
        "Mendukung pembiayaan utama peserta Pesta Rakyat: Kaos resmi untuk 5.000 peserta, Topi resmi untuk 5.000 peserta, dan Konsumsi untuk 5.000 peserta.",
        "Mendapatkan karya seni eksklusif hasil kreasi Tamara Geraldine / Wendy Septarina."
      ],
      bonus: "Karya seni eksklusif kreasi Tamara Geraldine / Wendy Septarina"
    },
    {
      id: "diamond",
      name: "DIAMOND",
      badge: "Terbatas (Max 3 Sponsor)",
      icon: <Diamond className="h-8 w-8 text-cyan-600" />,
      color: "border-slate-300 bg-gradient-to-br from-slate-50 via-cyan-50/30 to-white",
      headerBg: "bg-gradient-to-r from-slate-800 to-slate-700 text-white",
      textColor: "text-slate-800",
      accentColor: "bg-cyan-600",
      description: "Tingkat sponsorship eksklusif yang memberikan eksposur maksimal serta kesempatan kolaborasi yang komprehensif pada sesi ilmiah dan Pesta Rakyat.",
      benefits: [
        "1 slot presentasi eksposur produk/perusahaan pada sesi Symposium & Workshop.",
        "1 slot presentasi pada sesi Meet the Expert.",
        "1 slot presentasi pada sesi Dinner Symposium.",
        "1 sesi symposium makan siang dengan pembicara yang ditunjuk sponsor.",
        "1 booth stand pameran selama 1 hari di lokasi premium (Symposium & Workshop).",
        "1 tenda sarnavile (5x5m) sebagai stand pameran pada acara Pesta Rakyat.",
        "Penayangan logo/produk pada slide PowerPoint, Banner Acara, Umbul-umbul/Spanduk, dan Tas Goodie Bag.",
        "Penempatan logo/produk di Kaos & Goodie Bag acara Pesta Rakyat.",
        "Penyisipan brosur promosi ke dalam tas symposium dan workshop.",
        "Pendaftaran gratis: 3 peserta symposium + 3 peserta workshop.",
        "5 voucher konsumsi.",
        "Gratis undangan 100 orang pada Dinner Symposium.",
        "Sponsor menanggung biaya akomodasi, transportasi, dan honorarium pembicara/moderator yang terlibat dalam sesi yang dipilih."
      ],
      bonus: "Karya seni eksklusif kreasi Tamara Geraldine / Wendy Septarina"
    },
    {
      id: "sapphire",
      name: "SAPPHIRE",
      badge: "Pilihan Favorit",
      icon: <Gem className="h-8 w-8 text-white" />,
      color: "border-blue-300 bg-gradient-to-br from-blue-50/80 via-white to-blue-50/50 shadow-blue-500/20 shadow-xl scale-[1.02]",
      headerBg: "bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 text-white",
      textColor: "text-blue-800",
      accentColor: "bg-blue-600",
      isFeatured: true,
      description: "Memberikan tingkat eksposur yang sangat tinggi dengan berbagai manfaat promosi utama untuk membangun visibilitas kuat bagi brand Anda.",
      benefits: [
        "1 slot presentasi eksposur produk/perusahaan pada sesi Symposium & Workshop.",
        "1 slot presentasi pada sesi Meet the Expert.",
        "1 booth stand pameran selama 1 hari di lokasi Symposium & Workshop.",
        "1 tenda sarnavile (5x5m) sebagai stand pameran pada acara Pesta Rakyat.",
        "Penayangan logo/produk pada slide PowerPoint, Banner Acara, Umbul-umbul/Spanduk, dan Tas Goodie Bag.",
        "Penempatan logo/produk di Kaos & Goodie Bag acara Pesta Rakyat.",
        "Penyisipan brosur promosi ke dalam tas symposium dan workshop.",
        "Pendaftaran gratis: 2 peserta symposium + 2 peserta workshop.",
        "3 voucher konsumsi.",
        "Gratis undangan 50 orang pada Dinner Symposium.",
        "Sponsor menanggung biaya akomodasi, transportasi, dan honorarium pembicara/moderator yang terlibat dalam sesi yang dipilih."
      ],
      bonus: "Karya seni eksklusif kreasi Tamara Geraldine / Wendy Septarina"
    },
    {
      id: "ruby",
      name: "RUBY",
      badge: "Nilai Optimal",
      icon: <Shield className="h-8 w-8 text-rose-600" />,
      color: "border-rose-200 bg-gradient-to-br from-rose-50/60 to-white",
      headerBg: "bg-gradient-to-r from-rose-700 to-rose-600 text-white",
      textColor: "text-rose-800",
      accentColor: "bg-rose-600",
      description: "Menawarkan peluang promosi yang optimal melalui berbagai media komunikasi dengan keseimbangan ideal antara eksposur dan investasi.",
      benefits: [
        "1 slot presentasi eksposur produk/perusahaan pada sesi Symposium & Workshop.",
        "1 booth stand pameran selama 1 hari di lokasi Symposium & Workshop.",
        "1 tenda sarnavile (3x3m) sebagai stand pameran pada acara Pesta Rakyat.",
        "Penayangan logo/produk pada slide PowerPoint, Banner Acara, Umbul-umbul/Spanduk, dan Tas Goodie Bag.",
        "Penempatan logo/produk di Kaos & Goodie Bag acara Pesta Rakyat.",
        "Penyisipan brosur promosi ke dalam tas symposium dan workshop.",
        "Pendaftaran gratis: 2 peserta symposium + 2 peserta workshop.",
        "4 voucher konsumsi.",
        "Gratis undangan 30 orang pada Dinner Symposium.",
        "Sponsor menanggung biaya akomodasi, transportasi, dan honorarium pembicara/moderator yang terlibat dalam sesi yang dipilih."
      ],
      bonus: "Karya seni eksklusif kreasi anggota PERSADIA"
    },
    {
      id: "emerald",
      name: "EMERALD",
      badge: "Promosi Tepat Sasaran",
      icon: <Medal className="h-8 w-8 text-emerald-600" />,
      color: "border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-white",
      headerBg: "bg-gradient-to-r from-emerald-800 to-emerald-600 text-white",
      textColor: "text-emerald-800",
      accentColor: "bg-emerald-600",
      description: "Kesempatan tepat meningkatkan pengenalan merek melalui berbagai media promosi selama seluruh rangkaian acara berlangsung.",
      benefits: [
        "1 slot presentasi eksposur produk/perusahaan pada sesi Workshop.",
        "1 booth stand pameran selama 1 hari di lokasi Symposium & Workshop.",
        "1 tenda sarnavile (3x3m) sebagai stand pameran pada acara Pesta Rakyat.",
        "Penayangan logo/produk pada slide PowerPoint, Banner Acara, Umbul-umbul/Spanduk, dan Tas Goodie Bag.",
        "Penempatan logo/produk di Kaos & Goodie Bag Pesta Rakyat.",
        "Penyisipan brosur promosi ke dalam tas symposium dan workshop.",
        "Pendaftaran gratis: 2 peserta workshop.",
        "2 voucher konsumsi.",
        "Gratis undangan 20 orang pada Dinner Symposium.",
        "Sponsor menanggung biaya akomodasi, transportasi, dan honorarium pembicara/moderator yang terlibat dalam sesi yang dipilih."
      ]
    },
    {
      id: "topaz",
      name: "TOPAZ",
      badge: "Paket Stand Booth",
      icon: <Medal className="h-8 w-8 text-amber-600" />,
      color: "border-amber-200 bg-gradient-to-br from-amber-50/60 to-white",
      headerBg: "bg-gradient-to-r from-amber-700 to-amber-600 text-white",
      textColor: "text-amber-800",
      accentColor: "bg-amber-600",
      description: "Langkah awal yang tepat untuk mendukung kesuksesan acara sekaligus membangun hubungan langsung dengan medis dan komunitas diabetes.",
      benefits: [
        "1 booth stand pameran selama 1 hari di lokasi Symposium & Workshop.",
        "1 voucher konsumsi.",
        "Gratis undangan 5 orang pada Dinner Symposium."
      ]
    },
    {
      id: "pendukung",
      name: "PENDUKUNG (UMKM)",
      badge: "Khusus Mitra UMKM",
      price: "Rp 3.000.000",
      icon: <Briefcase className="h-8 w-8 text-indigo-600" />,
      color: "border-indigo-200 bg-gradient-to-br from-indigo-50/60 to-white",
      headerBg: "bg-gradient-to-r from-indigo-800 to-indigo-600 text-white",
      textColor: "text-indigo-800",
      accentColor: "bg-indigo-600",
      description: "Bentuk dukungan agar pelaku usaha lokal dapat turut ambil bagian, memperkenalkan produk, dan membangun jejaring dengan tenaga kesehatan & masyarakat.",
      benefits: [
        "Area / Space Only ukuran 3x3 meter (tidak termasuk listrik) pada Symposium/Workshop dan Pesta Rakyat."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col relative pb-20 md:pb-0">
      {/* Background Graphic */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-[#0B3D5E]/5 to-transparent"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-20 -left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div 
          className="absolute inset-0 opacity-[0.015]" 
          style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        ></div>
      </div>

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8 sm:py-12 relative z-10 pt-24 sm:pt-28">
        
        {/* Back Button */}
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-[#0B3D5E] font-bold text-sm transition-colors mb-6 sm:mb-8 group cursor-pointer"
        >
          <div className="p-2 rounded-full bg-white shadow-sm border border-slate-200 group-hover:border-[#0B3D5E] transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </div>
          Kembali ke Beranda
        </button>

        {/* Hero Section */}
        <div className="text-center mb-10 sm:mb-14">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 text-xs font-extrabold uppercase tracking-wider mb-4"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Peluang Kemitraan & Sponsorship
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#0B3D5E] via-[#094b75] to-[#00B4AC] mb-4 leading-tight tracking-tight drop-shadow-sm"
          >
            Sponsorship Konas Persadia 2026
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-600 text-sm sm:text-base max-w-3xl mx-auto font-medium leading-relaxed italic"
          >
            &quot;Early Detection for Better Living: Standing Together Against Diabetes at Its Root&quot;
          </motion.p>
        </div>

        {/* Quick Event Summary Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-r from-[#0B3D5E] to-[#00B4AC] rounded-2xl p-5 sm:p-8 text-white shadow-lg mb-12"
        >
          <h2 className="text-lg sm:text-xl font-extrabold mb-4 flex items-center gap-2 border-b border-white/20 pb-3">
            <Award className="h-5 w-5 text-amber-400" />
            Ringkasan Rangkaian Acara
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/15">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase mb-1">
                <Calendar className="h-4 w-4" /> Waktu Pelaksanaan
              </div>
              <p className="text-sm font-extrabold">7–8 November 2026</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/15">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase mb-1">
                <MapPin className="h-4 w-4" /> Lokasi Kegiatan
              </div>
              <p className="text-xs font-semibold leading-tight">
                <strong>Hari 1:</strong> Novotel Bogor<br />
                <strong>Hari 2:</strong> Stadion Pakansari
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/15">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase mb-1">
                <Users className="h-4 w-4" /> Target Peserta
              </div>
              <p className="text-xs font-semibold leading-tight">
                ±400 Dokter (Spesialis/Umum)<br />
                + 5.000 Peserta Awam/Umum
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/15">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase mb-1">
                <HeartPulse className="h-4 w-4" /> Highlight Utama
              </div>
              <p className="text-xs font-semibold leading-tight">
                Pemeriksaan Gula Darah Massal di Pesta Rakyat
              </p>
            </div>
          </div>
        </motion.div>

        {/* Section Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl font-black text-[#0B3D5E]">Pilihan Paket Sponsorship</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Setiap paket menawarkan hak eksposur, panggung presentasi, serta fasilitas booth pameran yang dapat disesuaikan.
            </p>
          </div>
          <a 
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center justify-center gap-2 bg-[#2D7A4F] hover:bg-[#23613e] text-white px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            <MessageCircle className="h-4 w-4" />
            Minta Proposal Lengkap
          </a>
        </div>

        {/* Sponsorship Tiers Grid */}
        <div className="flex flex-col gap-10 mb-16">
          {sponsorshipTiers.map((tier, index) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className={`bg-white rounded-3xl border-2 ${tier.color} overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 relative ${tier.isFeatured ? 'ring-4 ring-blue-500/20' : ''}`}
            >
              {tier.isFeatured && (
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-400 z-10 animate-pulse"></div>
              )}
              {/* Card Header Bar */}
              <div className={`px-6 sm:px-8 py-5 ${tier.headerBg} flex flex-wrap items-center justify-between gap-4 relative overflow-hidden`}>
                <div className="absolute inset-0 bg-white/5 opacity-50" style={{ backgroundImage: 'radial-gradient(circle at 100% 100%, rgba(255,255,255,0.2) 0%, transparent 50%)' }}></div>
                
                <div className="flex items-center gap-4 relative z-10">
                  <div className={`p-3 ${tier.isFeatured ? 'bg-white/20 shadow-inner' : 'bg-white/90 shadow-sm'} rounded-2xl backdrop-blur-sm`}>
                    {tier.icon}
                  </div>
                  <div>
                    <h3 className={`text-xl sm:text-3xl font-black tracking-wide ${tier.isFeatured ? 'text-white' : ''}`}>
                      PAKET {tier.name}
                    </h3>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${tier.isFeatured ? 'text-blue-100' : 'text-white/80'}`}>
                      Konas Persadia 2026
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 relative z-10 mt-2 sm:mt-0 items-start">
                  {tier.price && (
                    <span className="px-3.5 py-1.5 bg-emerald-500 text-white shadow-md rounded-full text-xs sm:text-sm font-black tracking-wider border border-emerald-400">
                      {tier.price}
                    </span>
                  )}
                  <span className={`px-4 py-1.5 ${tier.isFeatured ? 'bg-white text-blue-700 shadow-md' : 'bg-white/20 text-white'} rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-sm`}>
                    {tier.badge}
                  </span>
                </div>
              </div>

              {/* Card Content Body */}
              <div className="p-6 sm:p-8 relative">
                {tier.isFeatured && (
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-100/50 rounded-full blur-3xl pointer-events-none"></div>
                )}
                <p className="text-slate-700 text-sm sm:text-base font-medium mb-8 leading-relaxed bg-slate-50/80 p-5 rounded-2xl border border-slate-100/80 shadow-sm">
                  {tier.description}
                </p>

                <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider mb-5 flex items-center gap-2">
                  <span className={`p-1.5 rounded-lg ${tier.accentColor} text-white`}>
                    <Award className="h-4 w-4" />
                  </span>
                  Hak & Fasilitas Sponsorship:
                </h4>

                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {tier.benefits.map((benefit, i) => (
                    <motion.li 
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 + (i * 0.05) }}
                      key={i} 
                      className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all group"
                    >
                      <div className={`mt-0.5 p-1 rounded-full ${tier.accentColor}/10 group-hover:${tier.accentColor}/20 transition-colors shrink-0`}>
                        <ChevronRight className={`h-4 w-4 ${tier.textColor}`} />
                      </div>
                      <span className="text-slate-700 text-sm font-medium leading-relaxed">
                        {benefit}
                      </span>
                    </motion.li>
                  ))}
                </ul>

                {tier.bonus && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="mb-8 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200/60 flex items-center gap-4 shadow-sm"
                  >
                    <div className="p-2 bg-amber-100 rounded-full shrink-0">
                      <Gift className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-amber-700 font-bold uppercase tracking-wider mb-0.5">Bonus Istimewa</p>
                      <p className="text-sm text-amber-900 font-semibold">{tier.bonus}</p>
                    </div>
                  </motion.div>
                )}

                {/* Footer Action */}
                <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                  <div className="text-xs text-slate-500 font-medium max-w-xs">
                    Tertarik dengan Paket {tier.name}? Hubungi panitia untuk mendiskusikan penawaran khusus.
                  </div>
                  <a 
                    href={`https://wa.me/628980287820?text=Halo%20Panitia%20Konas%20Persadia,%20saya%20tertarik%20dengan%20Paket%20Sponsorship%20${encodeURIComponent(tier.name)}.`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 ${tier.isFeatured ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#0B3D5E] hover:bg-[#082e47]'} text-white px-6 py-3 rounded-full font-extrabold text-sm transition-all cursor-pointer shadow-md hover:shadow-lg hover:-translate-y-0.5 ml-auto`}
                  >
                    <MessageCircle className={`h-4 w-4 ${tier.isFeatured ? 'text-blue-200' : 'text-emerald-400'}`} />
                    Konsultasi Paket {tier.name}
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Syarat & Ketentuan Sponsorship */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm mb-12"
        >
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4 mb-6">
            <FileText className="h-6 w-6 text-[#0B3D5E]" />
            <div>
              <h3 className="text-xl font-black text-[#0B3D5E]">Syarat & Ketentuan Sponsorship</h3>
              <p className="text-xs text-slate-500 font-medium">Panduan pembayaran dan kebijakan partisipasi sponsor</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Pembayaran */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-sm text-[#0B3D5E] uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                Ketentuan Pembayaran
              </h4>
              
              <ul className="space-y-2.5 text-xs text-slate-700 font-medium">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Pembayaran sponsorship paling lambat dilakukan pada <strong>23 Oktober 2026</strong> (dua minggu sebelum acara).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Transfer pembayaran dilakukan ke rekening resmi:
                    <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200 font-sans space-y-1">
                      <p className="text-slate-800 font-bold text-xs">Bank Victoria</p>
                      <p className="text-[#0B3D5E] font-black text-sm tracking-wider">No. Rek: 2101022971</p>
                      <p className="text-slate-600 text-[11px]">a/n Perkumpulan Diabetes Inisiatif</p>
                    </div>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Form Konfirmasi Sponsorship dan bukti pembayaran mohon dikirimkan melalui email dan WhatsApp panitia.</span>
                </li>
              </ul>
            </div>

            {/* Pembatalan */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-sm text-[#0B3D5E] uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                Ketentuan Pembatalan
              </h4>

              <ul className="space-y-2.5 text-xs text-slate-700 font-medium">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>Pembatalan wajib dilakukan secara tertulis dan diberitahukan resmi kepada panitia.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>Pembatalan setelah tanggal 23 Oktober 2026 dikenakan biaya pembatalan sebesar <strong>50%</strong> dari nilai sponsorship.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>Pembatalan 1 (satu) minggu sebelum acara dikenakan biaya pembatalan sebesar <strong>100%</strong> (hangus).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>Jika pembayaran tidak diterima hingga batas waktu yang ditentukan, panitia berhak membatalkan slot partisipasi.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>Pembatalan tidak dapat dilakukan setelah pembayaran, kecuali dalam kondisi <em>Force Majeure</em>.</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Contact Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-[#0B3D5E] text-white rounded-3xl p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 0% 0%, rgba(255,255,255,0.2) 0%, transparent 50%)' }}></div>
          
          <div className="space-y-2 text-center md:text-left relative z-10">
            <h3 className="text-2xl font-black text-amber-400">Hubungi Sekretariat Sponsorship</h3>
            <p className="text-sm text-slate-300 max-w-lg">
              Tim sekretariat kami siap membantu penjelasan detail paket, ketersediaan booth, dan negosiasi aktivasi khusus untuk brand Anda.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 shrink-0 relative z-10 w-full md:w-auto">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#2D7A4F] hover:bg-[#23613e] text-white rounded-full font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 cursor-pointer w-full sm:w-auto"
            >
              <Phone className="h-5 w-5" />
              WhatsApp Kami
            </a>
            <a
              href={emailUrl}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold text-sm transition-all border border-white/20 cursor-pointer w-full sm:w-auto"
            >
              <Mail className="h-5 w-5 text-amber-400" />
              Kirim Email
            </a>
          </div>
        </div>

      </main>
      
      <Footer />

      {/* Mobile Sticky Action Bar */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: scrolled ? 0 : 100 }}
        className="md:hidden fixed bottom-0 inset-x-0 z-50 p-4 bg-white/90 backdrop-blur-md border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-transform duration-300"
      >
        <div className="flex gap-3 max-w-md mx-auto">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-[#2D7A4F] text-white py-3 px-4 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-transform"
          >
            <MessageCircle className="h-5 w-5" />
            Chat Panitia
          </a>
          <a
            href={emailUrl}
            className="inline-flex items-center justify-center bg-slate-100 text-[#0B3D5E] p-3 rounded-xl border border-slate-200 shadow-sm active:scale-95 transition-transform"
          >
            <Mail className="h-5 w-5" />
          </a>
        </div>
      </motion.div>
    </div>
  );
}

