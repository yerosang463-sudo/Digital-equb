import { lazy } from 'react';
import { Link } from "react-router";
import { Button } from "../ui/button";

export const HeroSection = lazy(() => import('./HeroSection'));

function HeroSectionComponent() {
  return (
    <section className="relative overflow-hidden bg-[#1E3A8A] pt-20">
      {/* Background Decorative Element (Diagonal Cut) */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-400/20 to-transparent skew-x-[-15deg] transform translate-x-1/4"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-left">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-white leading-tight">
              Unlock <span className="text-yellow-400">Financial</span> Growth Together
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-xl">
              Traditional Ethiopian savings circle, powered by modern technology. Save together, grow together with Digital Equb.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/signup">
                <Button size="lg" className="bg-yellow-400 text-blue-900 hover:bg-yellow-500 px-8 py-7 text-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-xl">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative flex justify-center lg:justify-end animate-float">
            <div className="relative w-full max-w-lg lg:max-w-none">
              {/* Decorative circles behind image */}
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-yellow-400/10 rounded-full blur-3xl"></div>
              
              {/* Lazy load hero image */}
              <img 
                src="https://images.unsplash.com/photo-1554224154-260325c05f6c?w=800&h=600&fit=crop&crop=center" 
                alt="Digital Equb Community Savings" 
                className="relative z-10 w-full h-auto object-contain drop-shadow-2xl"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Curved Bottom Divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 120L1440 120L1440 0C1440 0 1080 120 720 120C360 120 0 0 0 0L0 120Z" fill="white"/>
        </svg>
      </div>
    </section>
  );
}

export default HeroSectionComponent;
