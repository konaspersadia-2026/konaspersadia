import { DUMMY_SPEAKERS } from "../config";
import { Award, BookOpen, Star } from "lucide-react";
import { motion } from "motion/react";

export default function Speakers() {
  return (
    <section id="pembicara" className="py-20 bg-[#F8FAFC]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight mt-1 mb-4 font-sans">
            Pembicara & Narasumber Utama
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mb-2">
            Menghadirkan guru besar, konsultan endokrinologi, dan edukator diabetes profesional.
          </p>
          <div className="h-1.5 w-24 bg-[#00B4AC] mx-auto rounded-full"></div>
        </motion.div>

        {/* Speakers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {DUMMY_SPEAKERS.map((speaker, index) => (
            <motion.div
              key={speaker.id}
              id={`speaker-card-${speaker.id}`}
              className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -6 }}
            >
              <div>
                {/* Photo Header */}
                <div className="relative h-64 w-full overflow-hidden bg-slate-100">
                  <img
                    src={speaker.imageUrl}
                    alt={speaker.name}
                    className="w-full h-full object-cover object-top transition-transform duration-500 hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#0B3D5E] text-white text-[10px] font-bold rounded-full shadow">
                      <Star className="h-3 w-3 fill-white" />
                      Keynote Speaker
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-800 leading-snug mb-1">
                    {speaker.name}
                  </h3>
                  <p className="text-xs font-semibold text-[#0B3D5E] mb-1 flex items-center gap-1">
                    <Award className="h-3.5 w-3.5 text-[#00B4AC]" />
                    {speaker.title}
                  </p>
                  <p className="text-[11px] font-medium text-slate-500 mb-4 uppercase tracking-wider">
                    {speaker.institution}
                  </p>
                  
                  {/* Topics List */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-600 block uppercase tracking-wide flex items-center gap-1">
                      <BookOpen className="h-3 w-3 text-[#00B4AC]" />
                      Topik yang Dibawakan:
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {speaker.topics.map((topic, topicIdx) => (
                        <div
                          key={topicIdx}
                          className="text-xs bg-[#F8FAFC] text-slate-700 px-3 py-1.5 rounded-lg border-l-4 border-[#00B4AC] font-sans"
                        >
                          {topic}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  Sesi Ilmiah • Novotel Bogor
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
