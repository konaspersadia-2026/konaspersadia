import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Mengapa from "./components/Mengapa";
import About from "./components/About";
import Schedules from "./components/Schedules";
import Speakers from "./components/Speakers";
import RegistrationFees from "./components/RegistrationFees";
import Location from "./components/Location";
import FAQ from "./components/FAQ";
import Committee from "./components/Committee";
import Footer from "./components/Footer";
import RegistrationModal from "./components/RegistrationModal";
import Sponsors from "./components/Sponsors";
import AdminDashboard from "./components/Admin/AdminDashboard";
import SponsorshipPage from "./components/SponsorshipPage";

export default function App() {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("beranda");
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [currentHash, setCurrentHash] = useState(window.location.hash);

  // Sync scroll position with navbar links if on home page
  useEffect(() => {
    if (currentHash === "#admin" || currentHash === "#sponsorship") return;
    if (currentPath !== "/" && currentPath !== "/index.html") return;

    const handleScroll = () => {
      const sections = ["beranda", "tentang", "jadwal", "pembicara", "biaya", "lokasi", "panitia", "faq"];
      const scrollPosition = window.scrollY + 120; // offset navbar height

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [currentPath]);

  // Sync back/forward button path changes
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
      setCurrentHash(window.location.hash);
      setActiveSection("beranda");
      window.scrollTo(0, 0);
    };
    window.addEventListener("popstate", handlePopState);
    
    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", handleHashChange);
    
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  const handleNavigate = (sectionId: string) => {
    setActiveSection(sectionId);
    if (window.location.pathname !== "/" && window.location.pathname !== "/index.html") {
      window.history.pushState({}, "", "/");
      setCurrentPath("/");
      setTimeout(() => {
        scrollToSection(sectionId);
      }, 150);
    } else {
      scrollToSection(sectionId);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      const offset = 80; // offset navbar height
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const handleBackToHome = () => {
    window.history.pushState({}, "", "/");
    setCurrentPath("/");
    window.location.hash = "";
    setCurrentHash("");
    setActiveSection("beranda");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenRegister = () => {
    setIsRegisterOpen(true);
  };

  const handleCloseRegister = () => {
    setIsRegisterOpen(false);
  };

  if (currentHash === "#admin") {
    return <AdminDashboard onNavigateHome={handleBackToHome} />;
  }

  if (currentHash === "#sponsorship") {
    return <SponsorshipPage onNavigateHome={handleBackToHome} />;
  }

  return (
    <div id="app-root-container" className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col justify-between">
      {/* Navbar Header */}
      <Navbar
        onOpenRegister={handleOpenRegister}
        activeSection={activeSection}
        onNavigate={handleNavigate}
      />

      {/* Main Page Content */}
      <main className="flex-1">
        <>
          {/* 1. Beranda / Hero section */}
            <Hero
              onOpenRegister={handleOpenRegister}
              onNavigate={handleNavigate}
            />
            <Mengapa />

            {/* 2. Tentang Acara */}
            <About />

            {/* 3. Jadwal / Agenda Sesi */}
            <Schedules />

            {/* 4. Profil Pembicara */}
            <Speakers />

            {/* 5. Kategori & Biaya Pendaftaran */}
            <RegistrationFees
              onOpenRegister={handleOpenRegister}
            />


            {/* 7. Panduan Lokasi & Akomodasi */}
            <Location />

            {/* 8. Susunan Panitia Pelaksana */}
            <Committee />

            {/* Sponsor Section */}
            <Sponsors />

            {/* 9. FAQ Section */}
            <FAQ />
          </>
      </main>

      {/* Footer Block */}
      <Footer />

      {/* Multi-step Registration Modal */}
      <RegistrationModal
        isOpen={isRegisterOpen}
        onClose={handleCloseRegister}
      />
    </div>
  );
}
