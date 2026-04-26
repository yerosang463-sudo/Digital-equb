import { Navbar } from "../components/Navbar";
import FeaturesSection from "../components/sections/FeaturesSection";

export function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar variant="default" />
      <div className="pt-20">
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                About Digital Equb
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Modernizing the traditional Ethiopian savings circle for the digital age.
              </p>
            </div>
          </div>
        </section>
        <FeaturesSection />
      </div>
    </div>
  );
}
