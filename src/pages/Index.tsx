import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  HomeHero,
  HomeHeader,
  HomeFooter,
  LandingSections,
} from "@/components/home";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClick = (path: string) => {
    navigate(path);
  };

  return (
    <div data-page="home" className="min-h-screen relative overflow-hidden bg-background flex flex-col">
      <div className="page-bg-animated" aria-hidden />

      {/* موجة واحدة: الهيدر + البانر بدون أي فاصل + تموج متحرك */}
      <div className="hero-header-wave relative min-h-[95vh] flex flex-col">
        <div className="hero-header-wave-bg" aria-hidden />
        <div className="hero-header-wave-line" aria-hidden>
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="text-background fill-current">
            <path d="M0,60 Q300,20 600,60 T1200,60 L1200,120 L0,120 Z" />
          </svg>
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="text-background fill-current">
            <path d="M0,80 Q400,40 800,80 T1600,80 L1600,120 L0,120 Z" />
          </svg>
        </div>
        <HomeHeader onNavigate={handleClick} />
        <div className="flex-1 flex items-center">
          <HomeHero />
        </div>
      </div>

      <main className="flex-1 relative z-10">
        <LandingSections onNavigate={handleClick} />
      </main>

      <HomeFooter />

      {/* زر العودة للأعلى */}
      {showBackToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="back-to-top-btn fixed bottom-6 end-6 z-40 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 active:scale-95 transition-transform flex items-center justify-center print:hidden"
          aria-label={t("backToTop")}
        >
          <svg className="w-6 h-6 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default Index;
