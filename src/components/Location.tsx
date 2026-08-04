import { useState } from "react";
import { MapPin, Navigation, Hotel, Car, CheckCircle2 } from "lucide-react";

export default function Location() {
  const [activeVenue, setActiveVenue] = useState<"novotel" | "pakansari">("novotel");

  return (
    <section id="lokasi" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight mt-1 mb-4 font-sans">
            Lokasi Acara &amp; Rekomendasi Akomodasi
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mb-6">
            Penyelenggaraan acara terbagi menjadi dua lokasi yang strategis di wilayah Kabupaten &amp; Kota Bogor.
          </p>

          {/* Venue Toggle */}
          <div className="inline-flex p-1 bg-white rounded-full shadow border border-slate-100">
            <button
              onClick={() => setActiveVenue("novotel")}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition-all duration-300 cursor-pointer ${
                activeVenue === "novotel"
                  ? "bg-[#0B3D5E] text-white shadow"
                  : "text-slate-600 hover:text-[#0B3D5E]"
              }`}
            >
              Novotel Bogor (Sesi Ilmiah)
            </button>
            <button
              onClick={() => setActiveVenue("pakansari")}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition-all duration-300 cursor-pointer ${
                activeVenue === "pakansari"
                  ? "bg-[#0B3D5E] text-white shadow"
                  : "text-slate-600 hover:text-[#0B3D5E]"
              }`}
            >
              GOR Pakansari (Pesta Rakyat)
            </button>
          </div>
        </div>

        {/* Venue Information Display Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto">
          {/* Venue Details Left Column */}
          <div className="lg:col-span-6 space-y-6">
            {activeVenue === "novotel" ? (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-100 space-y-6">
                <div className="p-3 bg-[#0B3D5E]/10 text-[#0B3D5E] rounded-2xl inline-block">
                  <Hotel className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-800">Novotel Bogor Golf Resort &amp; Convention Center</h3>
                  <p className="text-xs font-bold text-[#0B3D5E] uppercase mt-1 tracking-wider">Sesi Ilmiah, Seminar, &amp; Rapat Kerja</p>
                </div>

                <div className="space-y-3.5 text-xs sm:text-sm text-slate-600">
                  <p className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-[#00B4AC] shrink-0 mt-0.5" />
                    <span>Golf Estate Bogor Raya, Sukaraja, Kec. Sukaraja, Kabupaten Bogor, Jawa Barat 16710</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <Navigation className="h-5 w-5 text-[#00B4AC] shrink-0 mt-0.5" />
                    <span>Akses sangat dekat melalui Gerbang Tol Bogor Selatan (Jagorawi), hanya 5-10 menit dari gerbang tol.</span>
                  </p>
                </div>

                {/* Accomodation Recommendations */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Rekomendasi Hotel Terdekat</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/40">
                      <strong className="text-slate-800 block">Novotel Bogor Resort (Venue)</strong>
                      <span className="text-slate-500">Hotel bintang 4 premium dengan suasana asri resort golf.</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/40">
                      <strong className="text-slate-800 block">ibis Styles Bogor Raya</strong>
                      <span className="text-slate-500">Bersebelahan langsung dengan Novotel, opsi akomodasi modern &amp; terjangkau.</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-100 space-y-6">
                <div className="p-3 bg-[#E6F4EA] text-[#2D7A4F] rounded-2xl inline-block">
                  <Car className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-800">GOR Pakansari, Cibinong, Bogor</h3>
                  <p className="text-xs font-bold text-[#2D7A4F] uppercase mt-1 tracking-wider">Sesi Pesta Rakyat, Senam &amp; Skrining Gratis</p>
                </div>

                <div className="space-y-3.5 text-xs sm:text-sm text-slate-600">
                  <p className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-[#00B4AC] shrink-0 mt-0.5" />
                    <span>Jalan GOR Pakansari No.1, Pakansari, Kec. Cibinong, Kabupaten Bogor, Jawa Barat 16915</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <Navigation className="h-5 w-5 text-[#00B4AC] shrink-0 mt-0.5" />
                    <span>Akses mudah melalui Tol Sentul Utara, lalu menyusuri Jalan Raya Tegar Beriman menuju Pusat Pemda Cibinong.</span>
                  </p>
                </div>

                <div className="p-4 bg-[#E6F4EA] rounded-2xl border border-[#2D7A4F]/20 space-y-2">
                  <h4 className="text-xs font-bold text-[#2D7A4F] flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Fasilitas di GOR Pakansari:
                  </h4>
                  <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                    <li>Area parkir luas (Barat &amp; Utara)</li>
                    <li>Tenda posko medis dan pemeriksaan gula darah ber-AC</li>
                    <li>Panggung hiburan musik rakyat dan stan makanan sehat</li>
                    <li>Akses toilet umum &amp; mushola portabel</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Simulated Map Right Column */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-4 shadow-md border border-slate-100 h-96 sm:h-[450px] flex flex-col overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
              <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                <MapPin className="h-4 w-4 text-[#0B3D5E]" />
                Peta Lokasi Google Maps (Simulasi Satelit)
              </span>
              <a
                href={activeVenue === "novotel" ? "https://maps.app.goo.gl/Zsd7tgWfR1RYe1sm9" : "https://maps.app.goo.gl/u36QCowK47HtJVur6"}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] font-bold text-[#0B3D5E] hover:underline bg-white px-2.5 py-1 rounded-md border border-slate-200"
              >
                Buka di Google Maps
              </a>
            </div>

            {/* Simulated Satellite View Image */}
            <div className="relative flex-1 bg-slate-100 overflow-hidden">
              <img
                src={
                  activeVenue === "novotel"
                    ? "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=600"
                    : "https://i.ibb.co.com/VYZvs4C1/images.webp"
                }
                alt="Venue Map Preview"
                className="w-full h-full object-cover filter brightness-75 contrast-125"
              />
              
              {/* Map pin overlay widget */}
              <div className="absolute inset-0 bg-slate-900/10 flex items-center justify-center">
                <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 max-w-xs shadow-2xl text-center border border-[#00B4AC]/40 animate-pulse">
                  <MapPin className="h-10 w-10 text-rose-500 mx-auto mb-1" />
                  <strong className="text-slate-800 text-xs block leading-tight">
                    {activeVenue === "novotel" ? "Novotel Bogor Resort" : "GOR Pakansari, Cibinong, Bogor"}
                  </strong>
                  <span className="text-[9px] text-[#0B3D5E] block font-semibold mt-1">7 - 8 November 2026</span>
                </div>
              </div>

              {/* Zoom buttons simulation */}
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur rounded-lg shadow-md border border-slate-200 flex flex-col overflow-hidden text-slate-700 font-extrabold text-sm">
                <button className="px-3 py-1.5 hover:bg-slate-100 border-b border-slate-200">+</button>
                <button className="px-3 py-1.5 hover:bg-slate-100">-</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
