import { Link } from "react-router";
import { Button } from "../ui/button";

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#1E3A8A] pt-20 group hover:bg-[#1e40af] transition-colors duration-700">
      {/* Background Decorative Element (Diagonal Cut) */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-400/20 to-transparent skew-x-[-15deg] transform translate-x-1/4 group-hover:from-blue-400/40 group-hover:translate-x-1/3 transition-all duration-700"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-left group-hover:translate-x-2 transition-transform duration-700">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-white leading-tight group-hover:scale-105 group-hover:text-yellow-100 transition-all duration-700">
              Unlock <span className="text-yellow-400 group-hover:text-yellow-300 transition-colors duration-700">Financial</span> Growth Together
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-xl group-hover:translate-x-1 transition-transform duration-700">
              Traditional Ethiopian savings circle, powered by modern technology. Save together, grow together with Digital Equb.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/login">
                <Button size="lg" className="bg-yellow-400 text-blue-900 hover:bg-yellow-500 px-8 py-7 text-lg font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-yellow-400/50 shadow-xl">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative flex justify-center lg:justify-end animate-float group-hover:scale-110 transition-transform duration-700">
            <div className="relative w-full max-w-lg lg:max-w-none">
              {/* Decorative circles behind image */}
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl group-hover:bg-blue-400/40 group-hover:scale-150 transition-all duration-700"></div>
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-yellow-400/10 rounded-full blur-3xl group-hover:bg-yellow-400/30 group-hover:scale-125 transition-all duration-700"></div>
              
              {/* Hero illustration using CSS */}
              <div className="relative z-10 w-full h-80 bg-gradient-to-br from-blue-500/20 to-blue-600/30 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-blue-400/30 shadow-2xl group-hover:shadow-blue-400/50 group-hover:border-blue-400/60 group-hover:scale-105 transition-all duration-700">
                <div className="text-center group-hover:scale-110 transition-transform duration-700">
                  <div className="text-6xl mb-4 group-hover:scale-125 group-hover:rotate-12 transition-all duration-700">💰</div>
                  <div className="text-2xl font-bold text-white mb-2 group-hover:text-yellow-200 transition-colors duration-700">Smart Savings</div>
                  <div className="text-blue-200 group-hover:text-blue-100 transition-colors duration-700">Community-powered finance</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Curved Bottom Divider */}
      <div className="absolute bottom-0 left-0 right-0 group-hover:scale-x-105 transition-transform duration-700">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 120L1440 120L1440 0C1440 0 1080 120 720 120C360 120 0 0 0 0L0 120Z" fill="white"/>
        </svg>
      </div>
    </section>
  );
}

export default HeroSection;
