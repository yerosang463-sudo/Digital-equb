import { Navbar } from "../components/Navbar";
import HeroSection from "../components/sections/HeroSection";
import FeaturesSection from "../components/sections/FeaturesSection";
import HowItWorksSection from "../components/sections/HowItWorksSection";
import PricingSection from "../components/sections/PricingSection";
import ContactSection from "../components/sections/ContactSection";

export function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar variant="transparent" />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <ContactSection />
    </div>
  );
}
