import heroIllustration from "../../assets/hero_illustration.png";
import { Link } from "react-router";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Users, Shield, TrendingUp, CheckCircle, DollarSign, ArrowRight } from "lucide-react";

export function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="absolute top-0 left-0 right-0 z-50">
        <Navbar variant="transparent" />
      </div>

      {/* Hero Section */}
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
                <Link to="/login?demo=1">
                  <Button size="lg" variant="outline" className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-7 text-lg backdrop-blur-sm">
                    Try Live Demo <ArrowRight className="ml-2 w-5 h-5" />
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
                
                <img 
                  src={heroIllustration} 
                  alt="Digital Equb Community Savings" 
                  className="relative z-10 w-full h-auto object-contain drop-shadow-2xl"
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

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Digital Equb?
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need for a secure and transparent savings circle
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-transparent hover:border-blue-100 group">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 text-[#1E3A8A] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <Shield className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">100% Secure</h3>
                <p className="text-gray-600 leading-relaxed">
                  Bank-level security with end-to-end encryption. Your funds and personal data are protected by state-of-the-art security protocols.
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-transparent hover:border-green-100 group">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-50 to-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <TrendingUp className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">Grow Your Savings</h3>
                <p className="text-gray-600 leading-relaxed">
                  Join a community of savers. Disciplined contributions help you reach your financial goals faster than saving alone.
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-transparent hover:border-purple-100 group">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <Users className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">Community First</h3>
                <p className="text-gray-600 leading-relaxed">
                  Built on trust. Create or join private groups with family and friends, or explore public circles with verified members.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple steps to start your savings journey
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
            { icon: Users, step: "1", title: "Create Account", desc: "Sign up in minutes with your phone number" },
            { icon: Users, step: "2", title: "Join a Group", desc: "Browse groups or create your own with custom rules" },
            { icon: DollarSign, step: "3", title: "Make Contributions", desc: "Pay monthly via Telebirr - safe and instant" },
            { icon: TrendingUp, step: "4", title: "Win Your Turn", desc: "Receive the full pool when it's your round" }].
            map((item, index) =>
            <div key={index} className="text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-[#1E3A8A] text-white rounded-full flex items-center justify-center mx-auto">
                    <item.icon className="w-10 h-10" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 text-gray-900 rounded-full flex items-center justify-center font-bold">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            )}
          </div>

          <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#10B981]" />
              Example: How Digital Equb Works
            </h4>
            <p className="text-gray-700">
              <strong>10 members</strong> × <strong>200 Birr/month</strong> = <strong>2,000 Birr pool</strong> each round.
              After 10 months, everyone has received 2,000 Birr - a disciplined way to save!
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Thousands
            </h2>
            <p className="text-xl text-gray-600">
              See what our members are saying
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
            {
              name: "Hanna Tesfaye",
              role: "Small Business Owner",
              text: "Digital Equb helped me save 20,000 Birr in just 10 months. I used it to expand my café. The automatic reminders kept me on track!"
            },
            {
              name: "Dawit Alemu",
              role: "Teacher",
              text: "I joined a group with my colleagues. The transparency is amazing - I can see every payment and know exactly when my turn is coming."
            },
            {
              name: "Sara Mulugeta",
              role: "Student",
              text: "Started with a small group of 5 friends contributing 100 Birr each. Now we're on our third cycle. Best decision ever!"
            }].
            map((testimonial, index) =>
            <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) =>
                  <span key={i} className="text-yellow-400">★</span>
                  )}
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Saving?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of Ethiopians building their financial future together
          </p>
          <Link to="/signup">
            <Button size="lg" className="bg-white text-[#1E3A8A] hover:bg-gray-100 px-8 py-6 text-lg">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Link to="/" className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 bg-[#1E3A8A] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">E</span>
                </div>
                <span className="text-white font-semibold">Digital Equb</span>
              </Link>
              <p className="text-sm">Making traditional savings circles accessible to everyone.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">How It Works</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
                <li><a href="#" className="hover:text-white">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2026 Digital Equb. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>);

}