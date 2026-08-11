import { useState, useEffect } from "react";
import { Menu, X, Activity } from "lucide-react";
import { EVENT_INFO, BRAND_COLORS } from "../config";

interface NavbarProps {
  onOpenRegister: () => void;
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

export default function Navbar({ onOpenRegister, activeSection, onNavigate }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { id: "beranda", label: "Beranda" },
    { id: "tentang", label: "Tentang Acara" },
    { id: "jadwal", label: "Jadwal & Pembicara" },
    { id: "biaya", label: "Kategori & Biaya" },
    { id: "lokasi", label: "Lokasi" },
    { id: "panitia", label: "Panitia" },
    { id: "faq", label: "FAQ" },
  ];

  const handleItemClick = (id: string) => {
    onNavigate(id);
    setIsOpen(false);
  };

  return (
    <nav
      id="main-navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#0B3D5E]/95 text-white shadow-lg backdrop-blur-md py-2 sm:py-2.5"
          : "bg-gradient-to-r from-[#0B3D5E] to-[#00B4AC] text-white py-2.5 sm:py-3.5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 sm:gap-4 lg:gap-8">
          {/* Logo & Brand */}
          <div
            id="brand-logo-container"
            className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0"
            onClick={() => handleItemClick("beranda")}
          >
            <div className="flex items-center justify-center bg-white rounded-lg p-1 sm:p-1.5 shadow-sm border border-white/20 shrink-0">
              <img 
                src={EVENT_INFO.eventLogoUrl || "https://placehold.co/240x80/ffffff/1e3a8a?text=Logo+Acara"} 
                alt="Logo Konas Persadia" 
                className="h-5 sm:h-8 max-w-[75px] min-[360px]:max-w-[90px] sm:max-w-[160px] object-contain"
                onError={(e) => {
                  e.currentTarget.src = "https://placehold.co/240x80/ffffff/1e3a8a?text=Logo+Acara";
                }}
              />
            </div>
            <div className="shrink-0">
              <div className="font-extrabold text-[9px] min-[360px]:text-[10px] sm:text-base tracking-tight leading-[1.15] uppercase font-sans">
                <span className="block sm:inline">KONAS </span>
                <span className="block sm:inline">PERSADIA </span>
                <span className="block sm:inline text-[#C89A2E] sm:text-inherit">2026</span>
              </div>
              <div className="text-[10px] text-[#F8FAFC] hidden md:block">
                KONAS PERSADIA • KONKER PERKENI • KONKER PEDI
              </div>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden xl:flex items-center space-x-1 shrink-0">
            {navItems.map((item) => (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => handleItemClick(item.id)}
                className={`px-2.5 py-1.5 text-xs font-medium transition-all duration-300 cursor-pointer ${
                  activeSection === item.id || (item.id === "jadwal" && activeSection === "pembicara")
                    ? "bg-white/15 text-[#C89A2E] font-semibold rounded-md"
                    : "hover:bg-white/10 text-white/90 hover:text-white rounded-md"
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className="flex items-center gap-2 pl-3 ml-1 border-l border-white/20">
              <a
                href="#sponsorship"
                onClick={() => window.scrollTo(0, 0)}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 font-extrabold text-xs rounded-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer text-center animate-pulse whitespace-nowrap"
              >
                Sponsorship
              </a>
              <button
                id="nav-btn-daftar"
                onClick={onOpenRegister}
                className="px-3.5 py-2 bg-[#C89A2E] text-[#0B3D5E] hover:bg-[#F8FAFC] font-bold text-xs rounded-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer whitespace-nowrap"
              >
                Daftar Sekarang
              </button>
            </div>
          </div>

          {/* Mobile & Tablet Menu & Actions */}
          <div className="xl:hidden flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <a
              href="#sponsorship"
              onClick={() => window.scrollTo(0, 0)}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-xs sm:text-sm rounded-full shadow-md cursor-pointer text-center whitespace-nowrap animate-pulse"
            >
              Sponsorship
            </a>
            <button
              id="nav-mobile-btn-daftar"
              onClick={onOpenRegister}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-[#C89A2E] text-[#0B3D5E] font-extrabold text-xs sm:text-sm rounded-full shadow-md cursor-pointer whitespace-nowrap"
            >
              Daftar
            </button>
            <button
              id="mobile-menu-toggle"
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 sm:p-1.5 rounded-md hover:bg-white/15 focus:outline-none text-white shrink-0 cursor-pointer"
              aria-label="Toggle Menu"
            >
              {isOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Drawer Menu */}
      {isOpen && (
        <div id="mobile-nav-drawer" className="xl:hidden bg-[#0B3D5E] border-t border-white/10 shadow-xl px-3 pt-3 pb-5 space-y-1.5">
          <div className="grid grid-cols-2 gap-2 pb-2.5 mb-2 border-b border-white/15">
            <a
              href="#sponsorship"
              onClick={() => {
                window.scrollTo(0, 0);
                setIsOpen(false);
              }}
              className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs rounded-lg text-center shadow-sm animate-pulse"
            >
              Sponsorship
            </a>
            <button
              onClick={() => {
                onOpenRegister();
                setIsOpen(false);
              }}
              className="w-full py-2 bg-[#C89A2E] text-[#0B3D5E] font-bold text-xs rounded-lg text-center shadow-sm"
            >
              Daftar Sekarang
            </button>
          </div>

          {navItems.map((item) => (
            <button
              key={item.id}
              id={`nav-mobile-link-${item.id}`}
              onClick={() => handleItemClick(item.id)}
              className={`block w-full text-left px-3.5 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                activeSection === item.id || (item.id === "jadwal" && activeSection === "pembicara")
                  ? "bg-white/15 text-[#C89A2E]"
                  : "text-white/95 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}
