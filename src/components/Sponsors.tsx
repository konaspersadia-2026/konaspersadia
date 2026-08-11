import { motion } from "motion/react";
import { Sparkles, Star, ArrowRight } from "lucide-react";

export default function Sponsors() {
  // We use placeholder images for sponsors. 
  // Larger resolution for main sponsors, smaller for supporting partners.
  
  const mainSponsors = [
    { id: 1, name: "DIAMOND", url: "https://placehold.co/300x150/ffffff/1e3a8a?text=DIAMOND" },
    { id: 2, name: "NUSANTARA", url: "https://placehold.co/300x150/ffffff/0d9488?text=NUSANTARA" },
    { id: 3, name: "SAPPHIRE", url: "https://placehold.co/300x150/ffffff/f59e0b?text=SAPPHIRE" },
  ];

  const supportingSponsors = [
    { id: 1, name: "RUBY", url: "https://placehold.co/150x80/f8fafc/64748b?text=RUBY" },
    { id: 2, name: "NUSANTARA", url: "https://placehold.co/150x80/f8fafc/64748b?text=NUSANTARA" },
    { id: 3, name: "TOPAZ", url: "https://placehold.co/150x80/f8fafc/64748b?text=TOPAZ" },
    { id: 4, name: "NUSANTARA", url: "https://placehold.co/150x80/f8fafc/64748b?text=NUSANTARA" },
    { id: 5, name: "EMERALD", url: "https://placehold.co/150x80/f8fafc/64748b?text=EMERALD" },
    { id: 6, name: "NUSANTARA", url: "https://placehold.co/150x80/f8fafc/64748b?text=NUSANTARA" },
  ];

  return (
    <section id="sponsors" className="py-20 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Sponsors */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight mt-1 mb-4 font-sans flex items-center justify-center gap-2">
            Sponsor Utama
            <Star className="h-6 w-6 text-[#C89A2E] fill-[#C89A2E]" />
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Didukung penuh oleh mitra strategis kami dalam mewujudkan Indonesia yang lebih sehat.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20 max-w-5xl mx-auto">
          {mainSponsors.map((sponsor, index) => (
            <motion.div
              key={sponsor.id}
              className="bg-white rounded-2xl p-6 border-2 border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all flex items-center justify-center group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <img 
                src={sponsor.url} 
                alt={sponsor.name} 
                className="w-full h-auto max-h-32 object-contain filter grayscale group-hover:grayscale-0 transition-all duration-500 opacity-80 group-hover:opacity-100" 
              />
            </motion.div>
          ))}
        </div>

        {/* Supporting Partners (Running Text) */}
        <div className="text-center mb-8">
          <h3 className="text-xl font-bold text-slate-700 font-sans flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-[#00B4AC]" />
            Mitra Pendukung
          </h3>
        </div>

        <div className="relative w-full max-w-6xl mx-auto overflow-hidden bg-slate-50/50 py-6 rounded-2xl border border-slate-100">
          <div className="flex w-[200%] animate-marquee gap-8 items-center">
            {[...supportingSponsors, ...supportingSponsors, ...supportingSponsors].map((sponsor, index) => (
              <div
                key={`${sponsor.id}-${index}`}
                className="flex-none bg-white rounded-xl p-4 border border-slate-100 flex items-center justify-center min-w-[140px] h-[80px]"
              >
                <img 
                  src={sponsor.url} 
                  alt={sponsor.name} 
                  className="h-10 w-auto object-contain filter grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300" 
                />
              </div>
            ))}
          </div>
          
          {/* Fading edges for marquee */}
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
        </div>

        {/* Call to Action Banner for Sponsorship */}
        <div className="mt-16 bg-gradient-to-r from-[#0B3D5E] via-[#0B3D5E] to-[#00B4AC] rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden w-full border border-white/10">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 p-8 opacity-10 rotate-12 pointer-events-none">
            <Star className="w-40 h-40" />
          </div>
          <div className="absolute bottom-0 left-1/3 -mb-8 p-8 opacity-10 -rotate-12 pointer-events-none">
            <Sparkles className="w-28 h-28" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 text-[#C89A2E] border border-white/15 mb-3">
                <Sparkles className="h-3.5 w-3.5 text-[#C89A2E]" />
                Kemitraan Strategis
              </span>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
                Jadilah Bagian dari Sejarah Kongres Nasional 2026!
              </h3>
              <p className="text-blue-100 text-xs sm:text-sm mt-2 leading-relaxed">
                Dukung kesuksesan Kongres Nasional PERSADIA 2026 dan dapatkan eksposur maksimal bagi brand/perusahaan Anda di hadapan ribuan peserta &amp; tenaga kesehatan.
              </p>
            </div>
            <a 
              href="#sponsorship" 
              onClick={() => window.scrollTo(0, 0)}
              className="shrink-0 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white px-7 py-3.5 rounded-full font-extrabold text-xs sm:text-sm shadow-md hover:shadow-xl transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              Lihat Peluang Sponsor
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
