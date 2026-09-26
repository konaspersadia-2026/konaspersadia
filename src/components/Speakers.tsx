import { useState } from "react";
import { DUMMY_SPEAKERS } from "../config";
import { Award, BookOpen, Star, Sparkles, Stethoscope, Wrench, HeartHandshake, Mic, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type SpeakerCategory = "all" | "plenary" | "symposium" | "workshop" | "health_forum" | "moderator";

export default function Speakers() {
  const [selectedCategory, setSelectedCategory] = useState<SpeakerCategory>("all");

  const categories: { id: SpeakerCategory; label: string; count: number; icon: any }[] = [
    { id: "all", label: "Semua", count: DUMMY_SPEAKERS.length, icon: Sparkles },
    { 
      id: "plenary", 
      label: "Plenary & Presidents' Lecture", 
      count: DUMMY_SPEAKERS.filter(s => s.category === "plenary").length,
      icon: Star 
    },
    { 
      id: "symposium", 
      label: "Simposium Medis & FKTP", 
      count: DUMMY_SPEAKERS.filter(s => s.category === "symposium").length,
      icon: Stethoscope 
    },
    { 
      id: "workshop", 
      label: "Workshop Hands-On", 
      count: DUMMY_SPEAKERS.filter(s => s.category === "workshop").length,
      icon: Wrench 
    },
    { 
      id: "health_forum", 
      label: "Health Forum", 
      count: DUMMY_SPEAKERS.filter(s => s.category === "health_forum").length,
      icon: HeartHandshake 
    },
    { 
      id: "moderator", 
      label: "Moderator & MC", 
      count: DUMMY_SPEAKERS.filter(s => s.category === "moderator").length,
      icon: Mic 
    },
  ];

  const filteredSpeakers = selectedCategory === "all" 
    ? DUMMY_SPEAKERS 
    : DUMMY_SPEAKERS.filter(s => s.category === selectedCategory);

  const getRoleBadgeStyle = (category?: string) => {
    switch (category) {
      case "plenary":
        return "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-amber-500/20";
      case "symposium":
        return "bg-gradient-to-r from-blue-600 to-[#0B3D5E] text-white shadow-blue-500/20";
      case "workshop":
        return "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-500/20";
      case "health_forum":
        return "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-rose-500/20";
      case "moderator":
        return "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-teal-500/20";
      default:
        return "bg-[#0B3D5E] text-white";
    }
  };

  return (
    <section id="pembicara" className="py-20 bg-[#F8FAFC]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Narasumber Terkemuka &amp; Terpercaya
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight mt-1 mb-4 font-sans">
            Pembicara &amp; Instruktur Ahli
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mb-2">
            Menghadirkan guru besar endokrinologi, konsultan metabolik, pakar gizi, neurolog, dokter spesialis, serta edukator diabetes nasional.
          </p>
          <div className="h-1.5 w-24 bg-[#00B4AC] mx-auto rounded-full mt-4"></div>
        </motion.div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "bg-[#0B3D5E] text-white shadow-md shadow-[#0B3D5E]/20 scale-105"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-amber-300" : "text-slate-400"}`} />
                <span>{cat.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                }`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Speakers Grid */}
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
        >
          <AnimatePresence mode="popLayout">
            {filteredSpeakers.map((speaker, index) => (
              <motion.div
                key={speaker.id}
                layout
                id={`speaker-card-${speaker.id}`}
                className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.35, delay: index * 0.04 }}
                whileHover={{ y: -6 }}
              >
                <div>
                  {/* Photo Header */}
                  <div className="relative h-60 w-full overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200">
                    <img
                      src={speaker.imageUrl}
                      alt={speaker.name}
                      className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-3.5 left-3.5">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 text-[10px] font-bold rounded-full shadow-sm ${getRoleBadgeStyle(speaker.category)}`}>
                        <Star className="h-3 w-3 fill-current" />
                        {speaker.role || "Narasumber"}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 sm:p-6">
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-800 leading-snug mb-1 group-hover:text-[#0B3D5E] transition-colors">
                      {speaker.name}
                    </h3>
                    <p className="text-xs font-semibold text-[#0B3D5E] mb-1 flex items-center gap-1">
                      <Award className="h-3.5 w-3.5 text-[#00B4AC] shrink-0" />
                      <span>{speaker.title}</span>
                    </p>
                    <p className="text-[11px] font-medium text-slate-500 mb-4 uppercase tracking-wider">
                      {speaker.institution}
                    </p>
                    
                    {/* Topics List */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-600 block uppercase tracking-wide flex items-center gap-1">
                        <BookOpen className="h-3 w-3 text-[#00B4AC]" />
                        Topik &amp; Sesi:
                      </span>
                      <div className="flex flex-col gap-1.5">
                        {speaker.topics.map((topic, topicIdx) => (
                          <div
                            key={topicIdx}
                            className="text-xs bg-[#F8FAFC] text-slate-700 px-3 py-1.5 rounded-lg border-l-4 border-[#00B4AC] font-sans leading-relaxed"
                          >
                            {topic}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-500">
                    {speaker.category === "health_forum" 
                      ? "Ballroom 2 Novotel" 
                      : speaker.category === "workshop" 
                      ? "Hands-On Workshop" 
                      : "Sesi Ilmiah Novotel"}
                  </span>
                  <span className="text-[10px] font-bold text-[#00B4AC] uppercase tracking-wider">
                    7 Nov 2026
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Disclaimer Note */}
        <div className="max-w-3xl mx-auto mt-12 p-4 bg-amber-50 border border-amber-200/60 rounded-xl flex items-start gap-3">
          <div className="mt-0.5 text-amber-600 shrink-0">
            <Info className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-amber-800 leading-relaxed font-medium">
              *Jadwal dan susunan pembicara dapat berubah sewaktu-waktu tanpa pemberitahuan terlebih dahulu.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
