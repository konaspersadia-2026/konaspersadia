import { useState, useEffect } from "react";
import { Calendar, MapPin, Users, HeartPulse, ShieldAlert, ArrowRight, Activity } from "lucide-react";
import { EVENT_INFO } from "../config";
import { motion } from "motion/react";
import { SilhouetteSenam, SilhouetteJalanSehat } from "./BackgroundSilhouettes";

interface HeroProps {
  onOpenRegister: () => void;
  onNavigate: (sectionId: string) => void;
}

export default function Hero({ onOpenRegister, onNavigate }: HeroProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isOver: false,
  });

  useEffect(() => {
    const eventDate = new Date(`${EVENT_INFO.tanggalMulai}T08:00:00+07:00`).getTime();

    const calculateTime = () => {
      const now = new Date().getTime();
      const difference = eventDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isOver: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="beranda"
      className="relative min-h-screen pt-24 pb-16 flex flex-col justify-center overflow-hidden"
    >
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url("https://github.com/user-attachments/assets/c9f7045d-2d27-4384-a171-47a015106321")' }}
      >
        <div className="absolute inset-0 bg-[#0B3D5E]/40 backdrop-blur-[0.5px]"></div>
      </div>

      {/* Decorative Circles */}
      <div className="absolute top-20 right-[-10%] w-[40rem] h-[40rem] rounded-full bg-blue-400/20 blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-10 left-[-10%] w-[35rem] h-[35rem] rounded-full bg-[#00B4AC]/20 blur-3xl pointer-events-none z-0" />

      {/* Background Activity Silhouettes */}
      <div className="absolute top-[18%] left-[-8%] sm:left-[2%] opacity-[0.05] text-white rotate-12 pointer-events-none z-0">
        <SilhouetteSenam className="w-56 h-56 sm:w-80 sm:h-80" />
      </div>
      <div className="absolute bottom-[15%] right-[-8%] sm:right-[2%] opacity-[0.05] text-white -rotate-12 pointer-events-none z-0">
        <SilhouetteJalanSehat className="w-56 h-56 sm:w-80 sm:h-80" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        
        {/* Badge World Diabetes Day & Hari Kesehatan Nasional */}
        <motion.div 
          className="flex flex-wrap justify-center gap-3 mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] sm:text-xs font-bold bg-white/10 text-white border border-white/20 backdrop-blur-sm shadow-sm">
            <HeartPulse className="h-4 w-4 animate-pulse text-rose-400" />
            World Diabetes Day 2026
          </span>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] sm:text-xs font-bold bg-white/10 text-white border border-white/20 backdrop-blur-sm shadow-sm">
            <Activity className="h-4 w-4 text-emerald-400" />
            Hari Kesehatan Nasional 2026
          </span>
        </motion.div>

        {/* Title & Host Organizations */}
        <div className="text-center max-w-4xl mx-auto mb-4">
          <motion.p 
            className="text-xs sm:text-sm font-extrabold tracking-widest text-[#C89A2E] uppercase mb-2 drop-shadow-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            Kongres Nasional &amp; Konferensi Kerja Bersama
          </motion.p>
          <motion.h1 
            className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight mb-4 font-sans drop-shadow-lg"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            KONAS PERSADIA <span className="text-[#C89A2E]">2026</span>
          </motion.h1>
          <motion.p 
            className="text-base sm:text-lg font-medium text-blue-50 mb-6 px-4 drop-shadow-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Mewadahi <span className="font-bold text-white">PERSADIA</span> (Persatuan Diabetes Indonesia),{" "}
            <span className="font-bold text-white">PEDI</span> (Perkumpulan Edukator Diabetes Indonesia), dan{" "}
            <span className="font-bold text-white">PERKENI</span> (Perkumpulan Endokrinologi Indonesia)
          </motion.p>

          {/* Theme Banner Card */}
          <motion.div 
            className="bg-white/85 backdrop-blur-md rounded-2xl p-6 sm:p-8 max-w-3xl mx-auto mb-10 shadow-xl border border-white/40 transform transition hover:scale-[1.01]"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6, type: "spring", stiffness: 100 }}
          >
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-800 mt-1 mb-2">
              "Pesta Rakyat Persadia, Menyehatkan Indonesia"
            </h2>
            <div className="flex justify-center items-center gap-2 text-[#0B3D5E] font-medium text-xs sm:text-sm">
              <ShieldAlert className="h-4 w-4 text-[#00B4AC]" />
              <span>Topik Utama: <strong>Diabetes, Deteksi Dini Lebih Awal</strong></span>
            </div>

            {/* Campaign Taglines added directly in Hero */}
            <div className="mt-4 pt-4 border-t border-slate-100 text-center">
              <p className="text-xs sm:text-sm font-extrabold text-[#0B3D5E] italic">
                "Early Detection for Better Living: Standing Together Against Diabetes at Its Root"
              </p>
            </div>
          </motion.div>
        </div>

        {/* Date and Locations Info Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
        >
          {/* Tanggal */}
          <div className="bg-white/85 backdrop-blur-md rounded-xl p-5 border border-white/40 flex items-start gap-4 shadow-xl hover:bg-white/95 transition duration-300">
            <div className="p-3 bg-[#0B3D5E] text-white rounded-lg">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-xs">Waktu &amp; Tanggal</p>
              <p className="text-slate-600 text-xs mt-1">Sabtu - Minggu</p>
              <p className="text-[#0B3D5E] font-bold text-xs sm:text-sm">7 - 8 November 2026</p>
            </div>
          </div>

          {/* Venue Ilmiah & Temu Wicara */}
          <div className="bg-white/85 backdrop-blur-md rounded-xl p-5 border border-white/40 flex items-start gap-4 shadow-xl hover:bg-white/95 transition duration-300">
            <div className="p-3 bg-[#00B4AC] text-white rounded-lg">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-xs">Sesi Ilmiah (Nakes)</p>
              <p className="font-bold text-slate-800 text-xs">Temu Wicara (Awam)</p>
              <p className="text-slate-600 text-xs mt-1">7 November 2026 • Novotel Bogor</p>
              <span className="inline-block mt-1.5 px-2 py-0.5 bg-[#0B3D5E]/10 text-[#0B3D5E] font-semibold text-[9px] rounded">
                Simposium, Workshop &amp; Pameran
              </span>
            </div>
          </div>

          {/* Venue Rakyat */}
          <div className="bg-white/85 backdrop-blur-md rounded-xl p-5 border border-white/40 flex items-start gap-4 shadow-xl hover:bg-white/95 transition duration-300">
            <div className="p-3 bg-[#C89A2E] text-[#0B3D5E] rounded-lg font-bold">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-xs">Pesta Rakyat (Umum)</p>
              <p className="text-slate-600 text-xs mt-1">8 November 2026 • GOR Pakansari, Cibinong</p>
              <span className="inline-block mt-1.5 px-2 py-0.5 bg-[#E6F4EA] text-[#2D7A4F] font-semibold text-[9px] rounded">
                Senam, Jalan Sehat &amp; Skrining Gratis
              </span>
            </div>
          </div>
        </motion.div>

        {/* Countdown Timer */}
        <motion.div 
          className="max-w-xl mx-auto mb-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <h3 className="text-xs sm:text-sm font-bold text-blue-100 tracking-wider uppercase mb-3 drop-shadow-md">
            {timeLeft.isOver ? "Acara Telah Dimulai / Berakhir" : "Menghitung Mundur Menuju Acara"}
          </h3>
          {!timeLeft.isOver && (
            <div className="grid grid-cols-4 gap-3 sm:gap-4 max-w-md mx-auto">
              {[
                { label: "Hari", value: timeLeft.days },
                { label: "Jam", value: timeLeft.hours },
                { label: "Menit", value: timeLeft.minutes },
                { label: "Detik", value: timeLeft.seconds },
              ].map((item, idx) => (
                <motion.div 
                  key={idx} 
                  className="bg-[#0B3D5E] text-white p-3 sm:p-4 rounded-xl shadow-md border border-[#C89A2E]/20"
                  whileHover={{ scale: 1.05, rotate: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className="block text-2xl sm:text-3xl font-extrabold tracking-tight">
                    {String(item.value).padStart(2, "0")}
                  </span>
                  <span className="block text-[10px] sm:text-xs font-medium text-[#C89A2E] uppercase mt-0.5">
                    {item.label}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>


        {/* Primary and Secondary CTA Buttons */}
      </div>
    </section>
  );
}
