import { lazy, Suspense } from "react";
import { Navbar } from "../components/Navbar";

// Lazy load all sections for optimal performance
const HeroSection = lazy(() => import("../components/sections/HeroSection"));
const FeaturesSection = lazy(() => import("../components/sections/FeaturesSection"));
const HowItWorksSection = lazy(() => import("../components/sections/HowItWorksSection"));
const PricingSection = lazy(() => import("../components/sections/PricingSection"));
const ContactSection = lazy(() => import("../components/sections/ContactSection"));

// Section loading component
const SectionLoader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

export function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar variant="transparent" />

      {/* Lazy loaded sections with Suspense */}
      <Suspense fallback={<SectionLoader />}>
        <HeroSection />
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <FeaturesSection />
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <HowItWorksSection />
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <PricingSection />
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <ContactSection />
      </Suspense>
    </div>
  );
}
