import { useState } from "react";
import { Link } from "react-router";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#1E3A8A] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">E</span>
            </div>
            <span className="text-xl font-semibold text-gray-900">Digital Equb</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-700 hover:text-[#1E3A8A] transition-colors">About</a>
            <a href="#how-it-works" className="text-gray-700 hover:text-[#1E3A8A] transition-colors">How It Works</a>
            <a href="#testimonials" className="text-gray-700 hover:text-[#1E3A8A] transition-colors">Testimonials</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90">Sign Up</Button>
            </Link>
          </div>

          <button
            className="md:hidden p-2 text-gray-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen &&
        <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col gap-4">
              <a href="#features" className="text-gray-700 hover:text-[#1E3A8A] transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-700 hover:text-[#1E3A8A] transition-colors">How It Works</a>
              <a href="#testimonials" className="text-gray-700 hover:text-[#1E3A8A] transition-colors">Testimonials</a>
              <div className="flex flex-col gap-2 pt-2">
                <Link to="/login" className="w-full">
                  <Button variant="ghost" className="w-full">Login</Button>
                </Link>
                <Link to="/signup" className="w-full">
                  <Button className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90">Sign Up</Button>
                </Link>
              </div>
            </div>
          </div>
        }
      </div>
    </nav>);

}