import { useNavigate } from "react-router-dom";
import {
  HomeHero,
  HomeHeader,
  HomeFooter,
  LandingSections,
} from "@/components/home";

const Index = () => {
  const navigate = useNavigate();

  const handleClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background flex flex-col">
      {/* Header */}
      <HomeHeader onNavigate={handleClick} />

      {/* Main Content */}
      <main className="flex-1 relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16">
          <HomeHero />
        </section>

        {/* Landing Page Sections */}
        <LandingSections onNavigate={handleClick} />
      </main>

      {/* Footer */}
      <HomeFooter />
    </div>
  );
};

export default Index;
