import { useState } from "react";
import { Clock, MapPin, BookOpen, UserCheck, Heart, Users, Sparkles, Building, Coffee, Activity, ChevronRight, Download } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SilhouetteKerumunan } from "./BackgroundSilhouettes";

type ScheduleTab = "ilmiah" | "dhf" | "pesta_rakyat" | "rapat";

interface ParallelRoom {
  room: string;
  trackTitle: string;
  speaker: string;
  details: string[];
}

interface ScheduleEvent {
  time: string;
  title: string;
  location: string;
  speaker: string;
  type: "symposium" | "workshop" | "parallel" | "activity" | "health_check" | "talkshow" | "administrative" | "meeting" | "break" | "entertainment";
  description?: string[];
  parallelRooms?: ParallelRoom[];
}

export default function Schedules() {
  const [activeTab, setActiveTab] = useState<ScheduleTab>("ilmiah");

  // 1. Simposium & Workshop Schedule Data (Novotel Bogor, 7 Nov 2026)
  const ilmiahSchedule: ScheduleEvent[] = [
    {
      time: "08:00 – 08:30",
      title: "Registrasi Peserta Simposium & Workshop",
      location: "Foyer Ballroom Novotel",
      speaker: "Panitia Pelaksana",
      type: "administrative",
      description: ["Re-registrasi peserta Simposium & Workshop"]
    },
    {
      time: "08:30 – 08:50",
      title: "SESI 1 — Plenary Lecture",
      location: "Room Gede",
      speaker: "Prof. dr. Putu Moda Arsana, SpPD-KEMD | MC: Dr. dr. Rudy Kurniawan, SpPD, MM, MARS, Dip.TH, DCD",
      type: "symposium",
      description: [
        "Topik: 'Good Habit for a Better Life' — Prof. dr. Putu Moda Arsana, SpPD-KEMD (Konsil Kedokteran Indonesia / PB PERKENI)",
        "MC: Dr. dr. Rudy Kurniawan, SpPD, MM, MARS, Dip.TH, DCD (Sobat Diabet)"
      ]
    },
    {
      time: "08:50 – 09:00",
      title: "Opening Ceremony",
      location: "Room Gede",
      speaker: "Pimpinan Pengurus Pusat & Tamu Kehormatan",
      type: "administrative",
      description: [
        "Pembukaan resmi Kongres Nasional PERSADIA & Konferensi Gabungan 2026 oleh Pimpinan Pengurus Pusat & Tamu Kehormatan"
      ]
    },
    {
      time: "09:00 – 10:00",
      title: "SESI 2 — Presidents' Lecture",
      location: "Room Gede",
      speaker: "Prof. Dr. dr. Sidartawan Soegondo, SpPD-KEMD | Dr. dr. K. Heri Nugroho Harioseno, SpPD-KEMD | Prof. Dr. dr. Achmad Rudijanto, SpPD-KEMD | Moderator: dr. Fauzia Kirana, SpPD",
      type: "symposium",
      description: [
        "09.00 – 09.20: 'Obesity: The Growing Metabolic Challenge' — Prof. Dr. dr. Sidartawan Soegondo, SpPD-KEMD (FKUI - RSCM / PB PERKENI)",
        "09.20 – 09.40: 'Tirzepatide: Beyond the Numbers (Dual GIP/GLP-1)' — Dr. dr. K. Heri Nugroho Harioseno, SpPD-KEMD (UNDIP / RSUP Dr. Kariadi)",
        "09.40 – 10.00: 'Diabetes Update Treatment: Janus, The First and After' — Prof. Dr. dr. Achmad Rudijanto, SpPD-KEMD (Universitas Brawijaya / PB PERKENI)"
      ]
    },
    {
      time: "10:00 – 10:30",
      title: "Coffee Break & Diskusi Panel",
      location: "Foyer Novotel Bogor",
      speaker: "Pembicara Presidents' Lecture & Seluruh Peserta",
      type: "break",
      description: [
        "Tanya jawab interaktif bersama pembicara Presidents' Lecture & Rehat Kopi/Kudapan Pagi di Foyer Novotel Bogor"
      ]
    },
    {
      time: "10:30 – 11:30",
      title: "SESI 3 — Sesi Dokter Layanan Primer (FKTP)",
      location: "Room Gede",
      speaker: "Prof. Dr. dr. Sidartawan Soegondo, SpPD-KEMD | dr. Baringin T A Manik, MKM | dr. Dicky Levenus Tahapary, SpPD-KEMD, PhD | Moderator: dr. Nur Rusyda Kuddah, SpPD-KEMD",
      type: "symposium",
      description: [
        "10.30 – 10.35: 'Opening Speech' — Prof. Dr. dr. Sidartawan Soegondo, SpPD-KEMD",
        "10.35 – 10.50: 'My Life in FKTP: Realita & Dedikasi Layanan Primer' — dr. Baringin T A Manik, MKM (Dokter Praktisi Layanan Primer)",
        "10.50 – 11.10: 'Diabetes Approach in FKTP: Deteksi Cepat & Tatalaksana' — dr. Dicky Levenus Tahapary, SpPD-KEMD, PhD (FKUI - RSCM / PB PERSADIA)",
        "11.10 – 11.30: Diskusi & Tanya Jawab Kasus Layanan Primer"
      ]
    },
    {
      time: "11:30 – 12:30",
      title: "SESI 4 — Sesi Paralel: Simposium Neuropati & Workshop 1 (CGM)",
      location: "Room Gede & Room Pangrango",
      speaker: "dr. Roy Panusunan Sibarani, dr. Gloria Tanjung, dr. Johanes Purwoto, Daniel Surbakti",
      type: "parallel",
      parallelRooms: [
        {
          room: "Room Gede",
          trackTitle: "Simposium: Footsteps Leading to Neuropathy",
          speaker: "Speaker 1: dr. Roy Panusunan Sibarani, SpPD-KEMD | Speaker 2: dr. Gloria Tanjung, SpN | Moderator: dr. William Djauhari",
          details: [
            "11.30 – 11.50: From Upstream: Endocrinologist POV — dr. Roy Panusunan Sibarani, SpPD-KEMD",
            "11.50 – 12.10: To Downstream: Neurologist POV — dr. Gloria Tanjung, SpN",
            "12.10 – 12.30: DISCUSSION & Tanya Jawab Klinis"
          ]
        },
        {
          room: "Room Pangrango",
          trackTitle: "Workshop 1: Diabetes Technology: CGM",
          speaker: "Speaker 1: dr. Johanes Purwoto, SpPD-KEMD | Speaker 2: Daniel Surbakti",
          details: [
            "11.30 – 12.00: Doctor's POV — dr. Johanes Purwoto, SpPD-KEMD (Mastering AGP reports, CGM-driven clinical decisions in T1D & T2D, CGM in special populations: prediabetes, pregnancy, elderly, hospitalized)",
            "12.00 – 12.10: Patient's POV — Daniel Surbakti",
            "12.10 – 12.30: HANDS ON: Case-based CGM Workshop — Solving real-world glycemic profiles & artifacts"
          ]
        }
      ]
    },
    {
      time: "12:30 – 14:00",
      title: "ISHOMA (Istirahat, Sholat, Makan Siang)",
      location: "R. Makan Ballroom 2 & Restaurant Novotel",
      speaker: "Panitia Konsumsi",
      type: "break"
    },
    {
      time: "14:00 – 15:00",
      title: "SESI 5 — Sesi Paralel: Workshop 2 (Semaglutide) & Workshop 3 (Nutrition)",
      location: "Room Gede & Room Pangrango",
      speaker: "dr. Sony Wibisono Mudjanarko, SpPD-KEMD | dr. Santi Syafril, SpPD-KEMD",
      type: "parallel",
      parallelRooms: [
        {
          room: "Room Gede",
          trackTitle: "Workshop 2: Semaglutide on Prediabetes",
          speaker: "Speaker: dr. Sony Wibisono Mudjanarko, SpPD-KEMD",
          details: [
            "14.00 – 14.30: Teori & Telaah (Targeting metabolic risk early: Semaglutide beyond weight loss; Synergy of Semaglutide and lifestyle intervention in Prediabetes Reversal; Patient selection & dosing protocol)",
            "14.30 – 15.00: HANDS ON: Case-Based Learning — Navigating Real-World Prediabetes Cases with Semaglutide (How to use, tapering strategy, compliance)"
          ]
        },
        {
          room: "Room Pangrango",
          trackTitle: "Workshop 3: Nutrition in Diabetes",
          speaker: "Speaker: dr. Santi Syafril, SpPD-KEMD",
          details: [
            "14.00 – 14.30: Teori Diet Nutrisi (Navigating dietary patterns: Mediterranean, Low-Carb, Intermittent Fasting; Carbohydrate counting & Glycemic Index; Behavior change & nutritional counseling)",
            "14.30 – 15.00: HANDS ON: Meal planning and case-based — Designing Practical Diets for Real World Patients (shift worker, obesity, elderly)"
          ]
        }
      ]
    },
    {
      time: "15:00 – 16:00",
      title: "SESI 6 — Sesi Paralel: Workshop 4 (Hypoglycemia) & Workshop 5 (Pre-Diabetes)",
      location: "Room Gede & Room Pangrango",
      speaker: "Dr. dr. Yuanita Langi, dr. Henny Megawati, Dr. dr. Made Ratna Saraswati, dr. Pandu Sakti",
      type: "parallel",
      parallelRooms: [
        {
          room: "Room Gede",
          trackTitle: "Workshop 4: Investigating Hypoglycemia",
          speaker: "Speaker 1: Dr. dr. Yuanita Langi, SpPD-KEMD | Filling the Gap: dr. Henny Megawati, SpPD",
          details: [
            "15.00 – 15.20: Speaker: Dr. dr. Yuanita Langi, SpPD-KEMD",
            "15.20 – 15.40: Topik (Hypoglycemia Unawareness mechanism & risk stratification, Special populations: elderly/renal/shift workers, Management protocol, prevention, post-crisis care)",
            "15.40 – 16.00: HANDS ON: Case-based workshop — navigating complex hypoglycemic scenarios in daily practice (dr. Henny Megawati, SpPD)"
          ]
        },
        {
          room: "Room Pangrango",
          trackTitle: "Workshop 5: Pre-Diabetes — Counting the Time",
          speaker: "Speaker 1: Dr. dr. Made Ratna Saraswati, SpPD-KEMD | Filling the Gap: dr. Pandu Sakti, SpPD, AIFO-K",
          details: [
            "15.00 – 15.20: Speaker: Dr. dr. Made Ratna Saraswati, SpPD-KEMD",
            "15.20 – 15.40: Topik (Early detection & risk stratification in prediabetes: stopping the diabetes continuum; Pharmacotherapy vs Lifestyle modification; Reversing prediabetes: practical nutrition & exercise)",
            "15.40 – 16.00: HANDS ON: Case-based learning — personalizing prediabetes management in high-risk patients (dr. Pandu Sakti, SpPD, AIFO-K)"
          ]
        }
      ]
    },
    {
      time: "16:00 – 18:30",
      title: "ISHOMA (Istirahat & Persiapan Acara Malam)",
      location: "Novotel Bogor",
      speaker: "Panitia Pelaksana",
      type: "break"
    },
    {
      time: "18:30 – 21:00",
      title: "MALAM KEAKRABAN (Gala Dinner & Pentas Budaya)",
      location: "Grand Ballroom Novotel Bogor",
      speaker: "Tamara Geraldine (Host), Pengurus Pusat & Tamu Kehormatan",
      type: "entertainment",
      description: [
        "Kata Sambutan Pengurus & Tokoh Kehormatan",
        "Sesi Diskusi Reflektif & Ramah Tamah Lintas Cabang",
        "Penampilan Lagu dan Tari Lilin-Lilin Kecil"
      ]
    }
  ];

  // 2. Diabetes Health Forum Schedule Data (Ballroom 2 Novotel, 7 Nov 2026)
  const dhfSchedule: ScheduleEvent[] = [
    {
      time: "08:30 – 08:40",
      title: "Pembukaan Diabetes Health Forum",
      location: "Ballroom 2, Novotel Bogor",
      speaker: "MC & Panitia Edukasi PERSADIA",
      type: "administrative"
    },
    {
      time: "08:40 – 09:25",
      title: "Sesi Edukasi: 'Masih muda, kok diabetes?'",
      location: "Ballroom 2, Novotel Bogor",
      speaker: "Narasumber Pakar Endokrinologi",
      type: "talkshow",
      description: [
        "Membedah fenomena diabetes usia muda di era digital.",
        "Faktor risiko genetik vs gaya hidup sedenter & pola makan cepat saji.",
        "Langkah preventif dan remisi dini bagi generasi usia produktif."
      ]
    },
    {
      time: "09:25 – 09:55",
      title: "Sesi Tanya Jawab Interaktif",
      location: "Ballroom 2, Novotel Bogor",
      speaker: "Moderator & Peserta Forum",
      type: "talkshow"
    },
    {
      time: "09:55 – 10:25",
      title: "Temu 6 Tokoh Senior Penyandang Diabetes",
      location: "Ballroom 2, Novotel Bogor",
      speaker: "6 Tokoh Senior Inspiratif PERSADIA",
      type: "activity",
      description: [
        "Berbagi pengalaman nyata puluhan tahun hidup berkualitas bersama diabetes.",
        "Tips disiplin pantau gula darah, menjaga pola makan, dan ketangguhan mental."
      ]
    },
    {
      time: "10:25 – 10:35",
      title: "Coffee Break & Networking",
      location: "Foyer Ballroom 2",
      speaker: "Panitia Konsumsi",
      type: "break"
    },
    {
      time: "10:35 – 11:20",
      title: "Talkshow Spesial: 'Cantik, Bugar, Bergairah'",
      location: "Ballroom 2, Novotel Bogor",
      speaker: "dr. Boyke Dian Nugraha, SpOG, MARS",
      type: "talkshow",
      description: [
        "Menjaga vitalitas, kebugaran fisik, dan kepercayaan diri penyandang diabetes.",
        "Tips medis menjaga keharmonisan pasangan suami istri tetap prima dan bahagia.",
        "Mengatasi mitos dan dampak vaskulopati/neuropati pada kesehatan pasutri."
      ]
    },
    {
      time: "11:20 – 11:50",
      title: "Sesi Tanya Jawab Bersama dr. Boyke, SpOG",
      location: "Ballroom 2, Novotel Bogor",
      speaker: "dr. Boyke Dian Nugraha, SpOG, MARS & Peserta",
      type: "talkshow"
    },
    {
      time: "11:50 – 12:00",
      title: "Sesi Penutupan & Foto Bersama",
      location: "Ballroom 2, Novotel Bogor",
      speaker: "Panitia & Seluruh Peserta Forum",
      type: "administrative"
    },
    {
      time: "12:00 – Selesai",
      title: "Makan Siang dan Ramah Tamah",
      location: "R. Makan Ballroom 2 / Restoran Novotel",
      speaker: "Panitia Pelaksana",
      type: "break"
    }
  ];

  // 3. Pesta Rakyat Schedule Data (GOR Pakansari, 8 Nov 2026)
  const pestaSchedule: ScheduleEvent[] = [
    {
      time: "05:00 – 06:00",
      title: "Registrasi Peserta, Pembagian Snack & Goodie Bag",
      location: "Pintu 8 GOR Pakansari",
      speaker: "Panitia (Distribusi per wilayah)",
      type: "administrative"
    },
    {
      time: "06:00 – 07:00",
      title: "Parade Cabang PERSADIA & Pemeriksaan Gula Darah 7.000 Peserta",
      location: "Area Luar & Lapangan GOR Pakansari",
      speaker: "Yell-yell & Mars PERSADIA Bersama",
      type: "health_check",
      description: [
        "Parade antusiasme kontingen cabang PERSADIA dari seluruh Indonesia.",
        "Skrining gula darah serentak massal gratis menargetkan 7.000 peserta."
      ]
    },
    {
      time: "07:00 – 07:30",
      title: "Pembukaan Acara, Sambutan & Pemeriksaan Kesehatan",
      location: "Panggung Utama GOR Pakansari",
      speaker: "Panitia & Tamu Kehormatan (Menyanyikan Indonesia Raya)",
      type: "administrative"
    },
    {
      time: "07:30 – 08:30",
      title: "Senam Gabungan Bersama Diabetes Sehat",
      location: "Lapangan Utama GOR Pakansari",
      speaker: "Instruktur Senam Profesional KORMI & PERSADIA",
      type: "activity"
    },
    {
      time: "08:30 – 10:00",
      title: "Showcase Senam Full Kesehatan Nusantara",
      location: "Panggung Utama / Lapangan",
      speaker: "Tim Senam Nusantara Perwakilan Cabang",
      type: "activity"
    },
    {
      time: "10:00 – 11:00",
      title: "Hiburan Panggung & Pengundian Doorprize Utama",
      location: "Panggung Utama GOR Pakansari",
      speaker: "MC & Tim Panitia Doorprize",
      type: "entertainment"
    },
    {
      time: "11:00 – 12:00",
      title: "Makan Siang Bersama (Lunch Box)",
      location: "Area Tribun & Lapangan GOR Pakansari",
      speaker: "Panitia Konsumsi",
      type: "break"
    },
    {
      time: "12:00 – Selesai",
      title: "Penutupan Resmi Pesta Rakyat 2026",
      location: "GOR Pakansari Bogor",
      speaker: "Panitia Pelaksana",
      type: "administrative"
    }
  ];

  // 4. Jadwal Rapat Organisasi (Novotel Bogor, 7 Nov 2026)
  const rapatSchedule: ScheduleEvent[] = [
    {
      time: "14:00 – 17:00",
      title: "Rapat Kerja PERSADIA (Sidang Pleno & Komisi)",
      location: "Ruang Karang–Sanggar",
      speaker: "Pengurus Pusat & Delegasi Cabang PERSADIA se-Indonesia",
      type: "meeting",
      description: [
        "Ruang Breakout Sidang Komisi:",
        "• Ruang Karang",
        "• Ruang Sanggar",
        "• Ruang Geulis"
      ]
    },
    {
      time: "14:00 – 15:00",
      title: "KONKER PERSADIA / PEDI (Koordinasi Bersama)",
      location: "Ballroom 2 Novotel Bogor",
      speaker: "Pengurus Pusat PERSADIA & Dewan Pengurus PEDI",
      type: "meeting",
      description: [
        "Penyelarasan program kerja nasional edukasi diabetes komunitas dan tenaga edukator."
      ]
    },
    {
      time: "14:00 – 17:00",
      title: "Rapat Kerja PEDI (Perkumpulan Edukator Diabetes Indonesia)",
      location: "Ruang Kencana",
      speaker: "Pengurus & Anggota PEDI",
      type: "meeting",
      description: [
        "Rapat kerja internal evaluasi kompetensi edukator dan rencana sertifikasi 2026-2029."
      ]
    },
    {
      time: "18:00 – 19:00",
      title: "Rapat Sinergi PERKENI & PEDI",
      location: "Ballroom 2 Novotel Bogor",
      speaker: "Pimpinan Pengurus Pusat PERKENI & PEDI",
      type: "meeting",
      description: [
        "Penguatan kolaborasi klinis dokter spesialis endokrin dan edukator diabetes profesional."
      ]
    }
  ];

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case "symposium":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "workshop":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "parallel":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
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
      case "parallel": return "Sesi Paralel (2 Ruang)";
      case "activity": return "Aktivitas Komunitas";
      case "health_check": return "Skrining Kesehatan Gratis";
      case "talkshow": return "Edukasi & Talkshow";
      case "administrative": return "Agenda Acara";
      case "meeting": return "Rapat Organisasi";
      case "break": return "Ishoma & Rehat";
      case "entertainment": return "Gala Dinner & Hiburan";
      default: return "Sesi Acara";
    }
  };

  const tabs = [
    { 
      id: "ilmiah" as ScheduleTab, 
      label: "Simposium & Workshop", 
      sub: "7 Nov • Novotel Bogor",
      icon: BookOpen,
      count: ilmiahSchedule.length 
    },
    { 
      id: "dhf" as ScheduleTab, 
      label: "Diabetes Health Forum", 
      sub: "7 Nov • Ballroom 2 (dr. Boyke)",
      icon: Sparkles,
      count: dhfSchedule.length 
    },
    { 
      id: "pesta_rakyat" as ScheduleTab, 
      label: "Pesta Rakyat", 
      sub: "8 Nov • GOR Pakansari",
      icon: Heart,
      count: pestaSchedule.length 
    },
    { 
      id: "rapat" as ScheduleTab, 
      label: "Rapat Organisasi", 
      sub: "7 Nov • PERSADIA / PEDI / PERKENI",
      icon: Users,
      count: rapatSchedule.length 
    },
  ];

  const getCurrentSchedule = () => {
    switch (activeTab) {
      case "ilmiah": return { data: ilmiahSchedule, date: "Sabtu, 7 November 2026", venue: "Novotel Bogor (Room Gede & Room Pangrango)" };
      case "dhf": return { data: dhfSchedule, date: "Sabtu, 7 November 2026", venue: "Novotel Bogor (Ballroom 2)" };
      case "pesta_rakyat": return { data: pestaSchedule, date: "Minggu, 8 November 2026", venue: "GOR Pakansari Cibinong, Kab. Bogor" };
      case "rapat": return { data: rapatSchedule, date: "Sabtu, 7 November 2026", venue: "Novotel Bogor (Karang, Sanggar, Geulis, Kencana, Ballroom 2)" };
    }
  };

  const current = getCurrentSchedule();

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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold mb-3">
            <Activity className="w-3.5 h-3.5 text-teal-600" />
            Rundown &amp; Susunan Acara Resmi 2026
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight mt-1 mb-4 font-sans">
            Jadwal Rangkaian Acara
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mb-6">
            Pilih track agenda di bawah ini untuk melihat jadwal lengkap sesi simposium, workshop hands-on, health forum awam, maupun pesta rakyat.
          </p>

          {/* Tab Selector Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 p-1.5 bg-[#F8FAFC] rounded-2xl border border-slate-200 shadow-xs max-w-4xl mx-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-btn-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 cursor-pointer text-left ${
                    isSelected
                      ? "bg-[#0B3D5E] text-white shadow-md shadow-[#0B3D5E]/20 scale-[1.02]"
                      : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm mb-0.5">
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? "text-amber-300" : "text-[#00B4AC]"}`} />
                    <span>{tab.label}</span>
                  </div>
                  <span className={`text-[11px] ${isSelected ? "text-slate-200" : "text-slate-400"}`}>
                    {tab.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Schedule Display */}
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Header Box */}
              <div className="bg-gradient-to-r from-[#0B3D5E] to-[#125883] text-white rounded-2xl p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs uppercase tracking-wider font-bold text-teal-300 block mb-1">
                    Jadwal Agenda
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black">
                    {tabs.find(t => t.id === activeTab)?.label}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-200 mt-2">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-teal-300" />
                      {current.date}
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-teal-300" />
                      {current.venue}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {activeTab === "ilmiah" && (
                    <a
                      href="/panduan-simposium-workshop-konas-persadia-2026.pdf"
                      download="Panduan-Lengkap-Simposium-Workshop-KONAS-PERSADIA-2026.pdf"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold transition shadow-sm cursor-pointer hover:scale-[1.02]"
                      title="Download Panduan Lengkap Simposium & Workshop (.pdf)"
                    >
                      <Download className="w-3.5 h-3.5 text-white" />
                      <span>Download Panduan Simpo & WS (.pdf)</span>
                    </a>
                  )}
                  <a
                    href="/rundown-konas-persadia-2026.pdf"
                    download="Rundown-Acara-KONAS-PERSADIA-2026.pdf"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-bold transition shadow-sm cursor-pointer hover:scale-[1.02]"
                    title="Download Rundown Resmi (.pdf)"
                  >
                    <Download className="w-3.5 h-3.5 text-teal-300" />
                    <span>Download Rundown</span>
                  </a>
                  <div className="shrink-0 bg-white/10 backdrop-blur-sm border border-white/20 px-3.5 py-2 rounded-xl text-center">
                    <span className="block text-2xl font-extrabold text-white leading-none">
                      {current.data.length}
                    </span>
                    <span className="text-[10px] text-slate-200 uppercase font-semibold">
                      Sesi Acara
                    </span>
                  </div>
                </div>
              </div>

              {/* Timeline Container */}
              <div className="bg-[#F8FAFC]/50 rounded-2xl p-4 sm:p-8 border border-slate-100">
                <div className="space-y-6 relative border-l-2 border-[#00B4AC]/35 ml-3 sm:ml-6 pl-4 sm:pl-8">
                  {current.data.map((event, eventIdx) => (
                    <div key={eventIdx} className="relative group">
                      {/* Timeline Node */}
                      <div className="absolute -left-[23px] sm:-left-[39px] top-2 w-3.5 h-3.5 rounded-full bg-white border-4 border-[#0B3D5E] group-hover:scale-125 transition-transform"></div>
                      
                      {/* Event Card */}
                      <div className="bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-slate-100 hover:border-[#00B4AC]/40 transition group-hover:shadow-md">
                        {/* Header: Time & Badge */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <span className="flex items-center gap-1 text-xs font-bold text-[#0B3D5E] bg-[#0B3D5E]/5 px-2.5 py-1 rounded-md w-fit">
                            <Clock className="h-3.5 w-3.5 text-[#00B4AC]" />
                            {event.time}
                          </span>
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getBadgeStyle(event.type)} w-fit`}>
                            {getEventTypeName(event.type)}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="font-extrabold text-slate-800 text-sm sm:text-base leading-snug mb-2">
                          {event.title}
                        </h4>

                        {/* Description List if single room */}
                        {event.description && !event.parallelRooms && (
                          <div className="mb-3 space-y-1.5 bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                            {event.description.map((desc, i) => (
                              <p key={i} className="text-[11px] sm:text-xs text-slate-600 leading-relaxed flex items-start gap-1.5">
                                <ChevronRight className="w-3 h-3 text-[#00B4AC] shrink-0 mt-0.5" />
                                <span>{desc}</span>
                              </p>
                            ))}
                          </div>
                        )}

                        {/* Parallel Rooms Card (Room Gede vs Room Pangrango) */}
                        {event.parallelRooms && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 my-3">
                            {event.parallelRooms.map((par, pIdx) => (
                              <div 
                                key={pIdx} 
                                className="bg-gradient-to-b from-blue-50/40 to-slate-50/80 rounded-xl p-3.5 border border-blue-100 flex flex-col justify-between"
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-900 bg-blue-100/70 px-2 py-0.5 rounded">
                                      <Building className="w-3 h-3 text-blue-700" />
                                      {par.room}
                                    </span>
                                  </div>
                                  <h5 className="font-bold text-xs sm:text-sm text-slate-900 mb-2 leading-tight">
                                    {par.trackTitle}
                                  </h5>
                                  <div className="space-y-1.5 mb-3">
                                    {par.details.map((detail, dIdx) => (
                                      <p key={dIdx} className="text-[11px] text-slate-600 leading-relaxed pl-2 border-l-2 border-blue-400">
                                        {detail}
                                      </p>
                                    ))}
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-blue-100/80 text-[11px] text-slate-700 font-medium flex items-center gap-1.5">
                                  <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  <span className="truncate">{par.speaker}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Footer Info: Location & Speaker */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-dashed border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-[#00B4AC] shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-medium">
                            <UserCheck className="h-3.5 w-3.5 text-[#2D7A4F] shrink-0" />
                            <span className="truncate">Narasumber / PIC: <strong className="text-slate-800">{event.speaker}</strong></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Disclaimer Note */}
        <div className="max-w-3xl mx-auto mt-12 p-4 bg-amber-50 border border-amber-200/60 rounded-xl flex items-start gap-3">
          <div className="mt-0.5 text-amber-600 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-amber-800 leading-relaxed font-medium">
              *Jadwal dan pembicara dapat berubah sewaktu-waktu tanpa pemberitahuan terlebih dahulu. Informasi perubahan terkini akan selalu kami perbarui melalui website ini dan grup koordinasi resmi pendaftar.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
