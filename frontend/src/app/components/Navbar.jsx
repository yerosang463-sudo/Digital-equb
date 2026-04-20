import { useState } from "react";
import { Link } from "react-router";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";

export function Navbar({ variant = "default" }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isTransparent = variant === "transparent";

  return (
    <nav className={`sticky top-0 z-50 w-full transition-all duration-300 ${
      isTransparent 
        ? "bg-transparent border-none" 
        : "bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isTransparent ? "bg-white" : "bg-[#1E3A8A]"
            }`}>
              <span className={`font-bold text-xl ${
                isTransparent ? "text-[#1E3A8A]" : "text-white"
              }`}>E</span>
            </div>
            <span className={`text-xl font-bold ${
              isTransparent ? "text-white" : "text-gray-900"
            }`}>Digital Equb</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className={`font-medium transition-colors ${
              isTransparent ? "text-blue-50 hover:text-white" : "text-gray-700 hover:text-[#1E3A8A]"
            }`}>About</a>
            <a href="#how-it-works" className={`font-medium transition-colors ${
              isTransparent ? "text-blue-50 hover:text-white" : "text-gray-700 hover:text-[#1E3A8A]"
            }`}>How It Works</a>
            <a href="#pricing" className={`font-medium transition-colors ${
              isTransparent ? "text-blue-50 hover:text-white" : "text-gray-700 hover:text-[#1E3A8A]"
            }`}>Pricing</a>
            <a href="#testimonials" className={`font-medium transition-colors ${
              isTransparent ? "text-blue-50 hover:text-white" : "text-gray-700 hover:text-[#1E3A8A]"
            }`}>Testimonials</a>
            <a href="#contact" className={`font-medium transition-colors ${
              isTransparent ? "text-blue-50 hover:text-white" : "text-gray-700 hover:text-[#1E3A8A]"
            }`}>Contact</a>
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
            className={`md:hidden p-2 ${isTransparent ? "text-white" : "text-gray-700"}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen &&
        <div className={`md:hidden py-4 ${isTransparent ? "bg-[#1E3A8A]" : "bg-white"}`}>
            <div className="flex flex-col gap-4 px-4">
              <a href="#features" className={`font-medium ${isTransparent ? "text-white" : "text-gray-700"}`}>Features</a>
              <a href="#how-it-works" className={`font-medium ${isTransparent ? "text-white" : "text-gray-700"}`}>How It Works</a>
              <a href="#pricing" className={`font-medium ${isTransparent ? "text-white" : "text-gray-700"}`}>Pricing</a>
              <a href="#testimonials" className={`font-medium ${isTransparent ? "text-white" : "text-gray-700"}`}>Testimonials</a>
              <a href="#contact" className={`font-medium ${isTransparent ? "text-white" : "text-gray-700"}`}>Contact</a>
              <div className="flex flex-col gap-2 pt-2">
                <Link to="/login" className="w-full">
                  <Button variant="ghost" className={`w-full ${isTransparent ? "text-white hover:bg-white/10" : ""}`}>Login</Button>
                </Link>
                <Link to="/signup" className="w-full">
                  <Button className={`w-full ${
                    isTransparent ? "bg-white text-[#1E3A8A]" : "bg-[#1E3A8A]"
                  }`}>Sign Up</Button>
                </Link>
              </div>
            </div>
          </div>
        }
      </div>
    </nav>);
}