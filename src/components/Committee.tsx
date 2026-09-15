import { SUSUNAN_PANITIA } from "../config";
import { Users, Award, ShieldAlert, Heart, ClipboardList } from "lucide-react";

export default function Committee() {
  return (
    <section id="panitia" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight mt-1 mb-4 font-sans">
            Panitia Pelaksana Kegiatan
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Susunan panitia kongres gabungan nasional KONAS PERSADIA, KONKER PEDI, dan KONKER PERKENI 2026.
          </p>
          <div className="h-1.5 w-24 bg-[#00B4AC] mx-auto rounded-full mt-4"></div>
        </div>

        {/* Structure Organization Layout */}
        <div className="max-w-5xl mx-auto space-y-10">
          
          {/* Penasehat Card */}
          <div className="bg-[#F8FAFC]/50 rounded-3xl p-6 sm:p-8 border border-slate-100 text-center shadow-sm">
            <h3 className="text-xs font-black text-slate-400 tracking-widest uppercase mb-4 flex items-center justify-center gap-1.5">
              <Award className="h-4 w-4 text-[#00B4AC]" />
              Dewan Penasehat
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {SUSUNAN_PANITIA.penasehat.map((nama, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200/40 shadow-sm">
                  <p className="font-extrabold text-slate-800 text-xs sm:text-sm leading-tight">{nama}</p>
                  <span className="text-[10px] font-bold text-[#00B4AC] block mt-1 uppercase">Penasehat</span>
                </div>
              ))}
            </div>
          </div>

          {/* Leaders Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ketua */}
            <div className="bg-[#0B3D5E] text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
              <div className="absolute top-4 right-4 text-white/5">
                <Users className="h-24 w-24" />
              </div>
              <span className="text-[10px] font-black tracking-widest text-[#C89A2E] uppercase block mb-1">Ketua Panitia Pelaksana</span>
              <h4 className="text-lg sm:text-2xl font-black">{SUSUNAN_PANITIA.ketua}</h4>
              <p className="text-xs text-[#F8FAFC]/90 mt-2 max-w-sm">
                Mengoordinasikan seluruh rangkaian persiapan teknis ilmiah, dan kegiatan pesta rakyat di Bogor maupun GOR Pakansari.
              </p>
            </div>

            {/* Wakil Ketua */}
            <div className="bg-[#00B4AC] text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
              <div className="absolute top-4 right-4 text-white/5">
                <Users className="h-24 w-24" />
              </div>
              <span className="text-[10px] font-black tracking-widest text-[#F8FAFC]/80 uppercase block mb-1">Wakil Ketua Panitia</span>
              <h4 className="text-lg sm:text-2xl font-black">{SUSUNAN_PANITIA.wakilKetua}</h4>
              <p className="text-xs text-[#F8FAFC]/90 mt-2 max-w-sm">
                Membantu kelancaran koordinasi antar-instansi organisasi dan mengawasi jalannya administrasi di lapangan.
              </p>
            </div>
          </div>

          {/* Core Support (Bendahara & Sekretaris) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bendahara */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-black text-[#0B3D5E] tracking-widest uppercase mb-4">Bendahara</h4>
                <div className="space-y-2">
                  {SUSUNAN_PANITIA.bendahara.map((nama, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded-lg border-l-4 border-[#00B4AC] font-extrabold text-slate-800 text-xs sm:text-sm">
                      {nama}
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-4">Bertanggung jawab atas verifikasi pembayaran tiket peserta online.</p>
            </div>

            {/* Sekretaris */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-black text-[#0B3D5E] tracking-widest uppercase mb-4">Sekretaris</h4>
                <div className="space-y-2">
                  {SUSUNAN_PANITIA.sekretaris.map((nama, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded-lg border-l-4 border-[#00B4AC] font-extrabold text-slate-800 text-xs sm:text-sm">
                      {nama}
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-4">Bertanggung jawab atas registrasi administrasi, persuratan, dan sertifikat.</p>
            </div>
          </div>

          {/* Divisions Divisions (Seksi-seksi) */}
          <div className="bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200/40">
            <h3 className="text-xs font-black text-slate-400 tracking-widest uppercase mb-6 flex items-center gap-1.5">
              <ClipboardList className="h-4 w-4 text-[#00B4AC]" />
              Seksi Pelaksana Bidang Kerja
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Seksi Acara */}
              <div className="space-y-2">
                <span className="text-[10px] font-black text-[#0B3D5E] tracking-wider uppercase">Seksi Acara</span>
                <div className="space-y-1.5">
                  {SUSUNAN_PANITIA.seksiAcara.map((n, idx) => (
                    <p key={idx} className="text-xs text-slate-700 font-extrabold">{n}</p>
                  ))}
                </div>
              </div>

              {/* Seksi Ilmiah */}
              <div className="space-y-2">
                <span className="text-[10px] font-black text-[#0B3D5E] tracking-wider uppercase">Seksi Ilmiah (Penyusun)</span>
                <div className="space-y-1.5">
                  {SUSUNAN_PANITIA.seksiIlmiah.map((n, idx) => (
                    <p key={idx} className="text-xs text-slate-700 font-extrabold">{n}</p>
                  ))}
                </div>
              </div>

              {/* Seksi Peserta */}
              <div className="space-y-2">
                <span className="text-[10px] font-black text-[#0B3D5E] tracking-wider uppercase">Seksi Peserta</span>
                <div className="space-y-1.5">
                  {SUSUNAN_PANITIA.seksiPeserta.map((n, idx) => (
                    <p key={idx} className="text-xs text-slate-700 font-extrabold">{n}</p>
                  ))}
                </div>
              </div>

              {/* Seksi Konsumsi */}
              <div className="space-y-2">
                <span className="text-[10px] font-black text-[#0B3D5E] tracking-wider uppercase">Seksi Konsumsi</span>
                <p className="text-xs text-slate-700 font-extrabold">{SUSUNAN_PANITIA.seksiKonsumsi}</p>
              </div>

              {/* Seksi Transportasi */}
              <div className="space-y-2">
                <span className="text-[10px] font-black text-[#0B3D5E] tracking-wider uppercase">Seksi Transportasi</span>
                <div className="space-y-1.5">
                  {SUSUNAN_PANITIA.seksiTransportasi.map((n, idx) => (
                    <p key={idx} className="text-xs text-slate-700 font-extrabold">{n}</p>
                  ))}
                </div>
              </div>

              {/* Seksi Publikasi */}
              <div className="space-y-2">
                <span className="text-[10px] font-black text-[#0B3D5E] tracking-wider uppercase">Seksi Publikasi</span>
                <p className="text-xs text-slate-700 font-extrabold">{SUSUNAN_PANITIA.seksiPublikasi}</p>
              </div>

              {/* Seksi Protokol */}
              <div className="sm:col-span-2 lg:col-span-1 space-y-2">
                <span className="text-[10px] font-black text-[#0B3D5E] tracking-wider uppercase">Seksi Protokol</span>
                <div className="space-y-1.5">
                  {SUSUNAN_PANITIA.seksiProtokol.map((n, idx) => (
                    <p key={idx} className="text-xs text-slate-700 font-extrabold">{n}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
