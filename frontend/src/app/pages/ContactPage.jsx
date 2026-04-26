import { Navbar } from "../components/Navbar";
import ContactSection from "../components/sections/ContactSection";

export function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar variant="default" />
      <div className="pt-20">
        <section className="py-10 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Contact Us
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Get in touch with our team for any questions or support.
              </p>
            </div>
          </div>
        </section>
        <ContactSection />
      </div>
    </div>
  );
}
