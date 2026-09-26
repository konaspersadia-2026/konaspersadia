import { useState, useEffect, type TouchEvent } from "react";
import { 
  ArrowLeft, Building2, MapPin, CheckCircle2, 
  MessageCircle, Phone, Sparkles, X, ChevronLeft, 
  ChevronRight, Calendar, Info, BedDouble, ShieldCheck, Tag
} from "lucide-react";
import { AKOMODASI_HOTEL, KONTAK_AKOMODASI, EVENT_INFO } from "../config";
import { HotelOption, HotelRoom } from "../types";
import Footer from "./Footer";

interface AccommodationPageProps {
  onNavigateHome: () => void;
}

interface LightboxData {
  images: string[];
  currentIndex: number;
  hotelName: string;
  roomName: string;
}

export default function AccommodationPage({ onNavigateHome }: AccommodationPageProps) {
  const [selectedHotelId, setSelectedHotelId] = useState<string>(AKOMODASI_HOTEL[0].id);
  const [lightbox, setLightbox] = useState<LightboxData | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const openLightbox = (images: string[], index: number, hotelName: string, roomName: string) => {
    setLightbox({
      images,
      currentIndex: index,
      hotelName,
      roomName,
    });
  };

  const nextImage = () => {
    setLightbox((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        currentIndex: (prev.currentIndex + 1) % prev.images.length,
      };
    });
  };

  const prevImage = () => {
    setLightbox((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        currentIndex: (prev.currentIndex - 1 + prev.images.length) % prev.images.length,
      };
    });
  };

  // Keyboard navigation listener (panah kiri, panah kanan, Escape)
  useEffect(() => {
    if (!lightbox) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        nextImage();
      } else if (e.key === "ArrowLeft") {
        prevImage();
      } else if (e.key === "Escape") {
        setLightbox(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightbox]);

  // Touch swipe support untuk perangkat layar sentuh/HP
  const handleTouchStart = (e: TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        nextImage();
      } else {
        prevImage();
      }
    }
    setTouchStartX(null);
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const getWaReservationUrl = (hotel: HotelOption, room: HotelRoom) => {
    const text = `Halo Panitia KONAS PERSADIA 2026, saya peserta sesi ilmiah. Saya ingin melakukan reservasi kamar hotel dengan tarif khusus panitia:

🏨 *Hotel:* ${hotel.name}
🛏️ *Tipe Kamar:* ${room.name}
💰 *Tarif Khusus:* ${formatRupiah(room.price)} / malam
🛌 *Tipe Ranjang:* ${room.bedType || "-"}

Mohon informasi ketersediaan slot kamar dan instruksi pembayarannya. Terima kasih!`;

    return `https://wa.me/${KONTAK_AKOMODASI.whatsappNumber}?text=${encodeURIComponent(text)}`;
  };

  const getGeneralWaUrl = () => {
    const text = `Halo Panitia KONAS PERSADIA 2026, saya peserta sesi ilmiah. Saya ingin bertanya perihal ketersediaan dan reservasi akomodasi hotel (Novotel & Ibis Styles) tarif khusus panitia. Terima kasih!`;
    return `https://wa.me/${KONTAK_AKOMODASI.whatsappNumber}?text=${encodeURIComponent(text)}`;
  };

  const activeHotel = AKOMODASI_HOTEL.find((h) => h.id === selectedHotelId) || AKOMODASI_HOTEL[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#0B3D5E] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={onNavigateHome}
              className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white/90 hover:text-white transition cursor-pointer flex items-center gap-1.5 text-xs sm:text-sm font-semibold"
              title="Kembali ke Beranda"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Beranda</span>
            </button>
            <div className="h-6 w-px bg-white/20 hidden sm:block" />
            <div>
              <span className="text-[10px] sm:text-xs text-[#C89A2E] font-bold uppercase tracking-wider block">
                Official Accommodation
              </span>
              <h1 className="text-sm sm:text-lg font-black tracking-tight leading-tight">
                Tarif Khusus Hotel Peserta
              </h1>
            </div>
          </div>

          <a
            href={getGeneralWaUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-full shadow-sm transition"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Chat Panitia Hotel</span>
            <span className="sm:hidden">WA Panitia</span>
          </a>
        </div>
      </header>

      {/* Hero Announcement Banner */}
      <section className="bg-gradient-to-br from-[#0B3D5E] via-[#092c42] to-[#00B4AC] text-white py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 text-[#C89A2E] border border-white/20 text-xs font-extrabold tracking-wide">
            <Sparkles className="h-4 w-4 text-[#C89A2E]" />
            Eksklusif Peserta Ilmiah KONAS PERSADIA 2026
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Akomodasi Nyaman di Venue Acara &amp; Sekitarnya
          </h2>
          <p className="text-xs sm:text-base text-slate-200 max-w-2xl mx-auto leading-relaxed">
            Panitia bekerjasama dengan pihak hotel menyediakan penawaran tarif khusus di <strong>Novotel Bogor Golf Resort</strong> (lokasi utama Hari ke-1) dan <strong>Ibis Styles Bogor Raya</strong> (bersebelahan langsung).
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs text-slate-200">
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
              <Calendar className="h-4 w-4 text-[#C89A2E]" />
              <span>Periode Acara: 7–8 November 2026</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
              <Tag className="h-4 w-4 text-emerald-300" />
              <span>Harga Spesial Negosiasi Panitia</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
              <ShieldCheck className="h-4 w-4 text-sky-300" />
              <span>Slot Terbatas (First-Come, First-Served)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 w-full space-y-8">
        
        {/* Hotel Selector Tabs */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 max-w-2xl mx-auto">
          {AKOMODASI_HOTEL.map((hotel) => (
            <button
              key={hotel.id}
              onClick={() => setSelectedHotelId(hotel.id)}
              className={`w-full sm:w-1/2 p-4 rounded-2xl border-2 transition-all text-left cursor-pointer flex items-center justify-between ${
                selectedHotelId === hotel.id
                  ? "bg-white border-[#00B4AC] shadow-lg shadow-[#00B4AC]/10 scale-[1.02]"
                  : "bg-white/80 border-slate-200 hover:border-slate-300 text-slate-600"
              }`}
            >
              <div>
                <span className={`text-[10px] font-black uppercase tracking-wider block ${
                  selectedHotelId === hotel.id ? "text-[#00B4AC]" : "text-slate-400"
                }`}>
                  {hotel.id === "novotel" ? "Hotel Venue Utama" : "Hotel Partner Terdekat"}
                </span>
                <strong className="text-sm sm:text-base font-extrabold text-slate-800 block mt-0.5">
                  {hotel.name}
                </strong>
                <span className="text-xs text-slate-500 font-medium">
                  {hotel.rooms.length} Pilihan Tipe Kamar
                </span>
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ml-2 ${
                selectedHotelId === hotel.id ? "bg-[#00B4AC] text-white" : "bg-slate-100 text-slate-400"
              }`}>
                <Building2 className="h-4 w-4" />
              </div>
            </button>
          ))}
        </div>

        {/* Selected Hotel Overview Box */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0B3D5E]/10 text-[#0B3D5E] text-xs font-bold mb-2">
                <Building2 className="h-3.5 w-3.5" />
                {activeHotel.distance}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800">
                {activeHotel.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                <MapPin className="h-4 w-4 text-[#00B4AC] shrink-0" />
                {activeHotel.location}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={getGeneralWaUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition"
              >
                <MessageCircle className="h-4 w-4" />
                Reservasi via WA Panitia
              </a>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {activeHotel.description}
          </p>
        </div>

        {/* Room Categories Cards */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-black text-slate-800">
              Pilihan Kamar &amp; Rincian Tarif — {activeHotel.name}
            </h3>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Klik foto untuk memperbesar
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {activeHotel.rooms.map((room) => (
              <div
                key={room.id}
                className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200/90 flex flex-col justify-between"
              >
                <div>
                  {/* Photo Gallery Header */}
                  <div className="relative bg-slate-900 overflow-hidden group">
                    <img
                      src={room.images[0]}
                      alt={room.name}
                      onClick={() => openLightbox(room.images, 0, activeHotel.name, room.name)}
                      className="w-full h-56 sm:h-64 object-cover cursor-pointer transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-slate-800 text-[11px] font-black shadow-md border border-slate-200 flex items-center gap-1">
                      <BedDouble className="h-3.5 w-3.5 text-[#00B4AC]" />
                      {room.bedType || "King / Twin Bed"}
                    </div>

                    <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[10px] font-bold">
                      📸 {room.images.length} Foto Kamar
                    </div>
                  </div>

                  {/* Thumbnail Row */}
                  <div className="p-3 bg-slate-100/70 border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
                    {room.images.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        onClick={() => openLightbox(room.images, idx, activeHotel.name, room.name)}
                        className="relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 border-transparent hover:border-[#00B4AC] transition cursor-pointer"
                        title={`Lihat foto ${idx + 1}`}
                      >
                        <img
                          src={imgUrl}
                          alt={`${room.name} ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=300&q=80";
                          }}
                        />
                      </button>
                    ))}
                  </div>

                  {/* Room Details */}
                  <div className="p-5 sm:p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#00B4AC]">
                          Kategori Kamar
                        </span>
                        <h4 className="text-lg sm:text-xl font-extrabold text-slate-800 leading-snug">
                          {room.name}
                        </h4>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                          Tarif Khusus Panitia
                        </span>
                        <div className="text-xl sm:text-2xl font-black text-[#0B3D5E]">
                          {formatRupiah(room.price)}
                          <span className="text-xs font-semibold text-slate-500"> /malam</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {room.description}
                    </p>

                    {/* Facilities Checklist */}
                    <div className="pt-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                        Fasilitas Termasuk:
                      </span>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                        {room.facilities.map((fac, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{fac}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    <span className="block font-bold text-slate-700">Pemesanan Langsung:</span>
                    <span>No. WA: <strong className="text-slate-900">{KONTAK_AKOMODASI.telepon}</strong></span>
                  </div>
                  <a
                    href={getWaReservationUrl(activeHotel, room)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3 bg-[#0B3D5E] hover:bg-[#00B4AC] text-white text-xs sm:text-sm font-extrabold rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Pesan Kamar Ini
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Important Terms & Information */}
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-3xl p-6 sm:p-8 text-amber-900 space-y-4">
          <div className="flex items-center gap-2 text-sm sm:text-base font-extrabold">
            <Info className="h-5 w-5 text-amber-700" />
            Ketentuan &amp; Tata Cara Reservasi Akomodasi
          </div>
          <ul className="text-xs sm:text-sm space-y-2 text-amber-800/95 list-disc pl-5">
            <li>
              <strong>Khusus Peserta Ilmiah Terdaftar:</strong> Penawaran tarif kamar khusus ini hanya berlaku bagi dokter umum, dokter spesialis, residen, perawat, atau mahasiswa yang telah mendaftar pada sesi ilmiah KONAS PERSADIA 2026.
            </li>
            <li>
              <strong>Ketersediaan Terbatas:</strong> Kuota kamar dengan tarif khusus panitia bersifat terbatas dan berlaku sistem <em>first-come, first-served</em> (siapa cepat, dia dapat).
            </li>
            <li>
              <strong>Pemesanan &amp; Pembayaran:</strong> Seluruh pemesanan dan pembayaran kamar ditangani secara resmi melalui panitia ke nomor WhatsApp <strong className="underline">{KONTAK_AKOMODASI.telepon}</strong>.
            </li>
            <li>
              <strong>Waktu Check-In &amp; Check-Out:</strong> Mengikuti kebijakan standar hotel (Check-in pukul 14:00 WIB, Check-out pukul 12:00 WIB).
            </li>
          </ul>
        </div>

        {/* Bottom CTA Box */}
        <div className="bg-gradient-to-r from-[#0B3D5E] to-[#00B4AC] rounded-3xl p-6 sm:p-10 text-white text-center space-y-4 shadow-xl">
          <h3 className="text-xl sm:text-3xl font-black">
            Ada Pertanyaan Seputar Akomodasi atau Jadwal Menginap?
          </h3>
          <p className="text-xs sm:text-sm text-slate-100 max-w-xl mx-auto leading-relaxed">
            Tim seksi akomodasi panitia KONAS PERSADIA 2026 siap membantu Anda untuk memastikan kenyamanan masa menginap Anda selama acara berlangsung.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <a
              href={getGeneralWaUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 bg-[#C89A2E] hover:bg-white text-[#0B3D5E] font-black rounded-full text-xs sm:text-sm shadow-lg transition-all flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Hubungi Panitia via WhatsApp ({KONTAK_AKOMODASI.telepon})
            </a>
            <button
              onClick={onNavigateHome}
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full text-xs sm:text-sm border border-white/20 transition-all cursor-pointer"
            >
              Kembali ke Beranda Acara
            </button>
          </div>
        </div>

      </main>

      {/* Lightbox Photo Preview Modal with Slider & Arrow Navigation */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none animate-fadeIn"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative max-w-5xl w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[92vh] animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-900/90 text-white border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-2">
                <span className="text-xs sm:text-sm font-black text-[#C89A2E] uppercase tracking-wider truncate">
                  {lightbox.hotelName}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-xs sm:text-sm font-bold text-white truncate">
                  {lightbox.roomName}
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[11px] sm:text-xs font-mono font-bold bg-white/15 px-2.5 py-1 rounded-full text-white/90">
                  {lightbox.currentIndex + 1} / {lightbox.images.length}
                </span>
                <button
                  onClick={() => setLightbox(null)}
                  className="p-1.5 sm:p-2 rounded-full hover:bg-white/15 text-white/90 hover:text-white transition cursor-pointer"
                  title="Tutup (Esc)"
                  aria-label="Tutup"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Main Stage with Image & Arrow Navigation Buttons */}
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[300px] sm:min-h-[460px] max-h-[68vh]">
              {/* Tombol Panah Kiri (Previous) */}
              {lightbox.images.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-2 sm:left-4 z-20 p-2 sm:p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md transition-all cursor-pointer shadow-xl hover:scale-110 flex items-center justify-center group"
                  title="Foto Sebelumnya (Panah Kiri)"
                  aria-label="Previous Photo"
                >
                  <ChevronLeft className="h-5 w-5 sm:h-7 sm:w-7 group-hover:-translate-x-0.5 transition-transform" />
                </button>
              )}

              {/* Foto Utama yang Sedang Ditampilkan */}
              <img
                key={lightbox.currentIndex}
                src={lightbox.images[lightbox.currentIndex]}
                alt={`${lightbox.roomName} - Foto ${lightbox.currentIndex + 1}`}
                className="max-h-[65vh] w-auto max-w-full object-contain mx-auto select-none transition-opacity duration-300"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80";
                }}
              />

              {/* Tombol Panah Kanan (Next) */}
              {lightbox.images.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-2 sm:right-4 z-20 p-2 sm:p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md transition-all cursor-pointer shadow-xl hover:scale-110 flex items-center justify-center group"
                  title="Foto Selanjutnya (Panah Kanan)"
                  aria-label="Next Photo"
                >
                  <ChevronRight className="h-5 w-5 sm:h-7 sm:w-7 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </div>

            {/* Thumbnail Strip Slider & Caption Footer */}
            <div className="bg-slate-900 border-t border-white/10 p-3 sm:p-4 space-y-2 shrink-0">
              {/* Thumbnails Row */}
              {lightbox.images.length > 1 && (
                <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 px-2">
                  {lightbox.images.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setLightbox({ ...lightbox, currentIndex: idx })}
                      className={`relative w-14 sm:w-16 h-10 sm:h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                        lightbox.currentIndex === idx
                          ? "border-[#00B4AC] scale-105 shadow-md shadow-[#00B4AC]/30 ring-2 ring-[#00B4AC]/40"
                          : "border-white/20 opacity-50 hover:opacity-100"
                      }`}
                      title={`Pilih foto ${idx + 1}`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Thumb ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=200&q=80";
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Bottom Instructions / Hint */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px] text-slate-400 text-center sm:text-left px-2">
                <span className="hidden sm:inline">
                  💡 Gunakan tombol panah ⬅️ ➡️ pada keyboard atau swipe layar untuk beralih foto
                </span>
                <span>
                  Reservasi kamar via WhatsApp: <strong className="text-white">{KONTAK_AKOMODASI.telepon}</strong>
                </span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Site Footer */}
      <Footer />
    </div>
  );
}
