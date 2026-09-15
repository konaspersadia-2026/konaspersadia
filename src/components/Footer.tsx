import { Mail, Phone, Heart, Activity } from "lucide-react";
import { KONTAK_PANITIA, EVENT_INFO } from "../config";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0B3D5E] text-white">
      {/* Contact Hub Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-white/10 py-8 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-6 lg:gap-8 items-center text-center md:text-left">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="text-base font-black uppercase tracking-wider text-[#C89A2E] mb-2">Hubungi Panitia</h4>
            <p className="text-xs text-white/80 max-w-xs text-center md:text-left mx-auto md:mx-0">
              Hubungi sekretariat pendaftaran kami jika Anda memerlukan bantuan koordinasi rombongan atau verifikasi manual cepat.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 text-xs font-bold w-full max-w-xs mx-auto md:mx-0">
            <a
              href={`mailto:${KONTAK_PANITIA.email}`}
              className="flex items-center justify-center md:justify-start gap-2 px-3.5 py-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition truncate"
            >
              <Mail className="h-4 w-4 text-[#C89A2E] shrink-0" />
              <span className="truncate">{KONTAK_PANITIA.email}</span>
            </a>
            <a
              href={`https://wa.me/${KONTAK_PANITIA.whatsapp.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center md:justify-start gap-2 px-3.5 py-2.5 bg-[#2D7A4F] rounded-xl hover:bg-[#2D7A4F] transition truncate"
            >
              <Phone className="h-4 w-4 shrink-0" />
              <span className="truncate">{KONTAK_PANITIA.whatsapp} (WhatsApp)</span>
            </a>
          </div>

          <div className="flex flex-col items-center md:items-end text-center md:text-right">
            <span className="text-[10px] text-white/50 block font-semibold uppercase tracking-widest">Sekretariat Bersama</span>
            <span className="text-xs font-extrabold text-white">Gedung PERSADIA / PERKENI Raya</span>
            <p className="text-[10px] text-white/70 mt-0.5">Jakarta Selatan, DKI Jakarta</p>
          </div>
        </div>
      </div>

      {/* Main Footer Block */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-center lg:text-left">
          
          {/* Host Organizations */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-center lg:justify-start gap-2">
              <Activity className="h-5 w-5 text-[#C89A2E]" />
              <strong className="text-base font-black tracking-tight uppercase">KONAS & KONKER GABUNGAN 2026</strong>
            </div>
            <div className="flex items-center justify-center lg:justify-start gap-3 py-2">
              <img 
                src={EVENT_INFO.eventLogoUrl || "https://placehold.co/240x80/ffffff/1e3a8a?text=Logo+Acara"} 
                alt="Logo Konas Persadia" 
                className="h-10 max-w-[200px] object-contain bg-white rounded p-1" 
                onError={(e) => { 
                  e.currentTarget.src = "https://placehold.co/240x80/ffffff/1e3a8a?text=Logo+Acara"; 
                }} 
              />
            </div>
            <p className="text-xs text-white/80 leading-relaxed max-w-sm mx-auto lg:mx-0">
              Diselenggarakan bersama oleh tiga perkumpulan besar diabetes terpercaya di Indonesia: <strong>PERSADIA</strong> (Persatuan Diabetes Indonesia), <strong>PEDI</strong> (Perkumpulan Edukator Diabetes Indonesia), dan <strong>PERKENI</strong> (Perkumpulan Endokrinologi Indonesia).
            </p>
          </div>

          {/* Quick Info links */}
          <div className="lg:col-span-3 space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#C89A2E]">Agenda Utama</h5>
            <ul className="text-xs space-y-1.5 text-white/80">
              <li>• Sesi Seminar & Workshop Ilmiah (Novotel Bogor)</li>
              <li>• Sesi Pesta Rakyat Diabetes (GOR Pakansari)</li>
              <li>• Pemeriksaan Gula Darah & Skrining Gratis massal</li>
              <li>• Senam Bugar Diabetesi & Hiburan</li>
            </ul>
          </div>

          {/* Campaign support */}
          <div className="lg:col-span-4 space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#C89A2E]">Kampanye Kesehatan</h5>
            <p className="text-xs text-white/80 leading-relaxed max-w-xs mx-auto lg:mx-0">
              Mendukung penuh kampanye global pencegahan diabetes dalam momentum <strong>World Diabetes Day 2026</strong> dan memperingati <strong>Hari Kesehatan Nasional 2026</strong>.
            </p>
            <span className="inline-block px-3 py-1 bg-white/10 text-[#C89A2E] rounded-full text-[10px] font-bold">
              #DiabetesDeteksiDiniLebihAwal
            </span>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 mt-12 pt-6 text-left text-[10px] text-white/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="flex flex-col items-start text-left leading-relaxed">
            <span>© {currentYear} Panitia Pelaksana Bersama KONAS PERSADIA, PEDI, PERKENI.</span>
            <span>
              All Rights Reserved.
              <button 
                onClick={() => {
                  window.location.hash = "admin";
                }} 
                className="ml-2 hover:text-white transition-colors"
              >
                (Admin)
              </button>
              <a 
                href="/scanner.html"
                className="ml-2 hover:text-white transition-colors inline-block"
              >
                (Scanner)
              </a>
            </span>
          </p>
          <div className="flex flex-col items-start sm:items-end text-left sm:text-right leading-relaxed">
            <span className="flex items-center gap-1 sm:justify-end">
              Made with <Heart className="h-3 w-3 text-rose-500 fill-rose-500 mx-0.5" /> by 
              <a 
                href="https://api.whatsapp.com/send/?phone=6285370716686&text&type=phone_number&app_absent=0" 
                target="_blank" 
                rel="noreferrer"
                className="font-bold text-white hover:text-[#C89A2E] transition-colors ml-0.5"
                title="Hubungi Pengembang Aplikasi"
              >
                satukreatif
              </a>
            </span>
            <span className="mt-0.5">For a healthier Indonesia.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
