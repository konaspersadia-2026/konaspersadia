import { useState } from "react";
import { Clock, MapPin, BookOpen, UserCheck, Heart } from "lucide-react";
import { motion } from "motion/react";
import { SilhouetteKerumunan } from "./BackgroundSilhouettes";

export default function Schedules() {
  const [activeTab, setActiveTab] = useState<"ilmiah" | "pesta_rakyat">("ilmiah");

  // Sesi Ilmiah Schedule Data (Novotel Bogor)
  const ilmiahSchedule = [
    {
      day: "Hari 1 - Sabtu, 7 November 2026",
      events: [
        {
          time: "08:30 - 09:00",
          title: "Opening Ceremony & Registration (bersama)",
          location: "Novotel Bogor Convention Center",
          speaker: "Panitia Pelaksana",
          type: "administrative"
        },
        {
          time: "09:00 - 10:00",
          title: "Sesi 1: Update Terapi & Teknologi Diabetes",
          location: "Room 1, Room 2, Room 3",
          speaker: "Berbagai Narasumber",
          type: "symposium"
        },
        {
          time: "10:00 - 10:15",
          title: "Coffee Break",
          location: "Foyer",
          speaker: "Panitia",
          type: "break"
        },
        {
          time: "10:15 - 11:15",
          title: "Sesi 2: Kardiometabolik, Obesitas & Komplikasi Lanjut",
          location: "Room 1, Room 2, Room 3",
          speaker: "Berbagai Narasumber",
          type: "symposium"
        },
        {
          time: "11:15 - 12:30",
          title: "Sesi 3: Lunch Symposium (Update Terapi & Masa Depan)",
          location: "Room 1, Lintas Ruang",
          speaker: "Berbagai Narasumber",
          type: "symposium"
        },
        {
          time: "12:30 - 13:30",
          title: "ISHOMA",
          location: "Restoran / Foyer",
          speaker: "Panitia",
          type: "break"
        },
        {
          time: "13:30 - 16:00",
          title: "KONAS PERSADIA, KONKER PERKENI, KONKER PEDI (Bersamaan dengan Workshop)",
          location: "Ruang Rapat Utama",
          speaker: "Pengurus Pusat",
          type: "meeting"
        },
        {
          time: "13:30 - 16:00",
          title: "Sesi Workshop (Teknologi Diabetes, Manajemen Obesitas, Pencegahan Komplikasi)",
          location: "WS 1, WS 2, WS 3",
          speaker: "Berbagai Narasumber",
          type: "workshop"
        },
        {
          time: "16:00 - 18:30",
          title: "ISHOMA",
          location: "Novotel Bogor",
          speaker: "Panitia",
          type: "break"
        },
        {
          time: "18:30 - 21:00",
          title: "Malam Keakraban: Kata Sambutan, Diskusi, Drama, Lagu (Gala Dinner / Lilin-Lilin Kecil)",
          location: "Novotel Bogor Convention Center",
          speaker: "Tamara Geraldine (Host)",
          type: "activity"
        }
      ]
    }
  ];

  // Pesta Rakyat Schedule Data (GOR Pakansari)
  const pestaSchedule = [
    {
      day: "Hari 2 - Minggu, 8 November 2026 (GOR Pakansari)",
      events: [
        {
          time: "05:00 - 06:00",
          title: "Registrasi – Snack, Goodie Bag",
          location: "Pintu 8",
          speaker: "Panitia (Distribusi per wilayah)",
          type: "administrative"
        },
        {
          time: "06:00 - 07:00",
          title: "Parade Cabang PERSADIA & Pemeriksaan Gula Darah 10.000 Peserta",
          location: "Area GOR Pakansari",
          speaker: "Yell-yell & Mars PERSADIA",
          type: "activity"
        },
        {
          time: "07:00 - 07:30",
          title: "Pembukaan Acara, Sambutan & Pemeriksaan Kesehatan",
          location: "Panggung Utama",
          speaker: "Panitia & Tamu Undangan (Indonesia Raya)",
          type: "administrative"
        },
        {
          time: "07:30 - 08:30",
          title: "Senam Gabungan Bersama",
          location: "Lapangan Utama",
          speaker: "Instruktur Senam",
          type: "activity"
        },
        {
          time: "08:30 - 10:00",
          title: "Showcase Senam Full Kesehatan Nusantara",
          location: "Panggung Utama / Lapangan",
          speaker: "Tim Senam Nusantara",
          type: "activity"
        },
        {
          time: "10:00 - 11:00",
          title: "Hiburan dan Doorprize",
          location: "Panggung Utama",
          speaker: "MC & Panitia",
          type: "entertainment"
        },
        {
          time: "11:00 - 12:00",
          title: "Makan Siang (Lunch)",
          location: "Area GOR Pakansari",
          speaker: "Panitia Konsumsi",
          type: "break"
        },
        {
          time: "12:00",
          title: "Acara Selesai",
          location: "GOR Pakansari",
          speaker: "Panitia",
          type: "administrative"
        }
      ]
    }
  ];

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case "symposium":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "workshop":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "activity":
        return "bg-[#E6F4EA] text-[#2D7A4F] border-[#2D7A4F]/30";
      case "health_check":
        return "bg-rose-100 text-rose-800 border-rose-200 font-bold";
      case "talkshow":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "administrative":
        return "bg-slate-100 text-slate-800 border-slate-200";
      case "meeting":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "break":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "entertainment":
        return "bg-pink-100 text-pink-800 border-pink-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getEventTypeName = (type: string) => {
    switch (type) {
      case "symposium": return "Simposium Medis";
      case "workshop": return "Workshop Praktis";
      case "activity": return "Aktivitas Fisik";
      case "health_check": return "Skrining Gula Darah Gratis";
      case "talkshow": return "Edukasi Awam / Talkshow";
      case "administrative": return "Agenda Umum";
      case "meeting": return "Pleno Organisasi";
      case "break": return "Ishoma";
      case "entertainment": return "Hiburan & Pembagian Hadiah";
      default: return "Sesi Acara";
    }
  };

  return (
    <section id="jadwal" className="py-20 bg-white relative overflow-hidden">
      {/* Background Activity Silhouette */}
      <div className="absolute top-[25%] right-[-10%] sm:right-[5%] opacity-[0.03] text-slate-500 rotate-6 pointer-events-none z-0">
        <SilhouetteKerumunan className="w-64 h-64 sm:w-96 sm:h-96" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight mt-1 mb-4 font-sans">
            Agenda Resmi Kegiatan 2026
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mb-6">
            Pilih track di bawah ini untuk melihat jadwal lengkap sesi ilmiah dan pesta rakyat.
          </p>

          {/* Tab Buttons */}
          <div className="inline-flex p-1 bg-[#F8FAFC] rounded-full shadow-inner border border-slate-100">
            <button
              id="tab-btn-ilmiah"
              onClick={() => setActiveTab("ilmiah")}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition-all duration-300 cursor-pointer ${
                activeTab === "ilmiah"
                  ? "bg-[#0B3D5E] text-white shadow"
                  : "text-slate-600 hover:text-[#0B3D5E]"
              }`}
            >
              Sesi Ilmiah (Novotel Bogor)
            </button>
            <button
              id="tab-btn-rakyat"
              onClick={() => setActiveTab("pesta_rakyat")}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition-all duration-300 cursor-pointer ${
                activeTab === "pesta_rakyat"
                  ? "bg-[#0B3D5E] text-white shadow"
                  : "text-slate-600 hover:text-[#0B3D5E]"
              }`}
            >
              Pesta Rakyat (GOR Pakansari)
            </button>
          </div>
        </motion.div>

        {/* Schedule Display */}
        <div className="max-w-4xl mx-auto">
          {activeTab === "ilmiah" ? (
            <div className="space-y-12">
              {ilmiahSchedule.map((dayGroup, groupIdx) => (
                <div key={groupIdx} className="bg-[#F8FAFC]/45 rounded-2xl p-6 sm:p-8 border border-slate-100">
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#0B3D5E] mb-6 flex items-center gap-2 pb-2 border-b border-[#00B4AC]/25">
                    <BookOpen className="h-5 w-5" />
                    {dayGroup.day}
                  </h3>
                  
                  <div className="space-y-6 relative border-l-2 border-[#00B4AC]/35 ml-4 sm:ml-6 pl-4 sm:pl-8">
                    {dayGroup.events.map((event, eventIdx) => (
                      <div key={eventIdx} className="relative group">
                        {/* Timeline node */}
                        <div className="absolute -left-[25px] sm:-left-[41px] top-1.5 w-4 h-4 rounded-full bg-white border-4 border-[#0B3D5E] group-hover:scale-125 transition-transform"></div>
                        
                        <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-100 hover:border-[#00B4AC]/40 transition group-hover:shadow-md">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                            <span className="flex items-center gap-1 text-xs font-bold text-[#0B3D5E] bg-[#0B3D5E]/5 px-2 py-1 rounded">
                              <Clock className="h-3.5 w-3.5" />
                              {event.time}
                            </span>
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getBadgeStyle(event.type)}`}>
                              {getEventTypeName(event.type)}
                            </span>
                          </div>

                          <h4 className="font-extrabold text-slate-800 text-sm sm:text-base leading-tight mb-2">
                            {event.title}
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1.5 border-t border-dashed border-slate-100">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-[#00B4AC]" />
                              <span>{event.location}</span>
                            </div>
                            <div className="flex items-center gap-1 font-medium">
                              <UserCheck className="h-3.5 w-3.5 text-[#2D7A4F]" />
                              <span>Narasumber: <strong className="text-slate-700">{event.speaker}</strong></span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-12">
              {pestaSchedule.map((dayGroup, groupIdx) => (
                <div key={groupIdx} className="bg-[#E6F4EA] rounded-2xl p-6 sm:p-8 border border-[#2D7A4F]/20">
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#00B4AC] mb-6 flex items-center gap-2 pb-2 border-b border-[#00B4AC]/25">
                    <Heart className="h-5 w-5 text-rose-500 animate-pulse" />
                    {dayGroup.day}
                  </h3>
                  
                  <div className="space-y-6 relative border-l-2 border-[#00B4AC]/35 ml-4 sm:ml-6 pl-4 sm:pl-8">
                    {dayGroup.events.map((event, eventIdx) => (
                      <div key={eventIdx} className="relative group">
                        {/* Timeline node */}
                        <div className="absolute -left-[25px] sm:-left-[41px] top-1.5 w-4 h-4 rounded-full bg-white border-4 border-[#2D7A4F] group-hover:scale-125 transition-transform"></div>
                        
                        <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-100 hover:border-[#00B4AC]/40 transition group-hover:shadow-md">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                            <span className="flex items-center gap-1 text-xs font-bold text-[#2D7A4F] bg-[#E6F4EA] px-2 py-1 rounded">
                              <Clock className="h-3.5 w-3.5" />
                              {event.time}
                            </span>
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getBadgeStyle(event.type)}`}>
                              {getEventTypeName(event.type)}
                            </span>
                          </div>

                          <h4 className="font-extrabold text-slate-800 text-sm sm:text-base leading-tight mb-2">
                            {event.title}
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1.5 border-t border-dashed border-slate-100">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-[#2D7A4F]/80" />
                              <span>{event.location}</span>
                            </div>
                            <div className="flex items-center gap-1 font-medium">
                              <UserCheck className="h-3.5 w-3.5 text-[#2D7A4F]" />
                              <span>Pelaksana: <strong className="text-slate-700">{event.speaker}</strong></span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
