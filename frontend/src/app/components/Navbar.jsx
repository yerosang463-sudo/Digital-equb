import { useState, useEffect, useRef, useCallback, memo } from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";

const Navbar = memo(function Navbar({ variant = "default" }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuRef = useRef(null);

  // Memoize scroll handler to prevent unnecessary re-renders
  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 20);
  }, []);

  // Memoize click outside handler
  const handleClickOutside = useCallback((event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setMobileMenuOpen(false);
    }
  }, []);

  // Memoize mobile menu toggle
  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, []);

  useEffect(() => {
    const handleScrollEvent = () => handleScroll();
    window.addEventListener("scroll", handleScrollEvent);
    return () => window.removeEventListener("scroll", handleScrollEvent);
  }, [handleScroll]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [mobileMenuOpen, handleClickOutside]);

  const isTransparent = variant === "transparent" && !isScrolled;

  return (
    <nav className={`fixed top-0 z-[100] w-full transition-all duration-300 ${
      isTransparent 
        ? "bg-transparent border-transparent py-4 text-white" 
        : "bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm py-2 text-gray-900"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
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
            <Link to="/about" className="font-medium hover:text-blue-500 transition-colors">About</Link>
            <Link to="/how-it-works" className="font-medium hover:text-blue-500 transition-colors">How It Works</Link>
            <Link to="/pricing" className="font-medium hover:text-blue-500 transition-colors">Pricing</Link>
            <Link to="/contact" className="font-medium hover:text-blue-500 transition-colors">Contact</Link>
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
            onClick={toggleMobileMenu}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen &&
        <div ref={menuRef} className={`md:hidden py-4 border-t border-gray-100 ${isScrolled ? "bg-white" : "bg-[#1E3A8A]"}`}>
            <div className="flex flex-col gap-4 px-4">
              <Link to="/about" className="font-medium" onClick={() => setMobileMenuOpen(false)}>About</Link>
              <Link to="/how-it-works" className="font-medium" onClick={() => setMobileMenuOpen(false)}>How It Works</Link>
              <Link to="/pricing" className="font-medium" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
              <Link to="/contact" className="font-medium" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
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
    </nav>
  );
});

Navbar.displayName = "Navbar";

export { Navbar };