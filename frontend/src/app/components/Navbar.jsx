import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";

export function Navbar({ variant = "default" }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isTransparent = variant === "transparent" && !isScrolled;

  return (
    <nav className={`fixed top-0 z-[100] w-full transition-all duration-300 ${
      isTransparent 
        ? "bg-transparent border-transparent py-4 text-white" 
        : "bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm py-2 text-gray-900"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" onClick={(e) => {
            if (window.location.pathname === "/") {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }} className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300 ${
              isTransparent ? "bg-white" : "bg-[#1E3A8A]"
            }`}>
              <span className={`font-bold text-xl ${
                isTransparent ? "text-[#1E3A8A]" : "text-white"
              }`}>E</span>
            </div>
            <span className="text-xl font-bold">Digital Equb</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="font-medium hover:text-blue-500 transition-colors">About</a>
            <a href="#how-it-works" className="font-medium hover:text-blue-500 transition-colors">How It Works</a>
            <a href="#pricing" className="font-medium hover:text-blue-500 transition-colors">Pricing</a>
            <a href="#testimonials" className="font-medium hover:text-blue-500 transition-colors">Testimonials</a>
            <a href="#contact" className="font-medium hover:text-blue-500 transition-colors">Contact</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className={
                isTransparent ? "text-white hover:bg-white/10" : "text-gray-700"
              }>Login</Button>
            </Link>
            <Link to="/signup">
              <Button className={
                isTransparent 
                  ? "bg-white text-[#1E3A8A] hover:bg-gray-100 shadow-lg" 
                  : "bg-[#1E3A8A] hover:bg-[#1E3A8A]/90"
              }>Sign Up</Button>
            </Link>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen &&
        <div className={`md:hidden py-4 border-t border-gray-100 ${isScrolled ? "bg-white" : "bg-[#1E3A8A]"}`}>
            <div className="flex flex-col gap-4 px-4">
              <a href="#features" className="font-medium" onClick={() => setMobileMenuOpen(false)}>About</a>
              <a href="#how-it-works" className="font-medium" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
              <a href="#pricing" className="font-medium" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
              <a href="#testimonials" className="font-medium" onClick={() => setMobileMenuOpen(false)}>Testimonials</a>
              <a href="#contact" className="font-medium" onClick={() => setMobileMenuOpen(false)}>Contact</a>
              <div className="flex flex-col gap-2 pt-2">
                <Link to="/login" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full">Login</Button>
                </Link>
                <Link to="/signup" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                  <Button className={`w-full ${
                    isScrolled ? "bg-[#1E3A8A] text-white" : "bg-white text-[#1E3A8A]"
                  }`}>Sign Up</Button>
                </Link>
              </div>
            </div>
          </div>
        }
      </div>
    </nav>);
}