import { lazy, Suspense } from "react";
import { Navbar } from "../components/Navbar";

// Lazy load all sections for optimal performance
const HeroSection = lazy(() => import("../components/sections/HeroSection"));
const FeaturesSection = lazy(() => import("../components/sections/FeaturesSection"));
const HowItWorksSection = lazy(() => import("../components/sections/HowItWorksSection"));
const PricingSection = lazy(() => import("../components/sections/PricingSection"));
const ContactSection = lazy(() => import("../components/sections/ContactSection"));
const Footer = lazy(() => import("../components/sections/FooterSection"));

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

      <Suspense fallback={<SectionLoader />}>
        <Footer />
      </Suspense>
    </div>
  );
}
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
      <section id="how-it-works" className="py-24 bg-[#FAF7F2]">
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
            { icon: DollarSign, step: "3", title: "Make Contributions", desc: "Pay daily, weekly or monthly via Telebirr - safe and instant" },
            { icon: TrendingUp, step: "4", title: "Win Your Turn", desc: "Receive the full pool when it's your round" }].
            map((item, index) =>
            <Card key={index} className="transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-transparent hover:border-blue-100 group">
              <CardContent className="p-8 text-center relative">
                <div className="absolute top-4 right-4 w-10 h-10 bg-yellow-400 text-gray-900 rounded-full flex items-center justify-center font-bold shadow-md z-20">
                  {item.step}
                </div>
                
                <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 text-[#1E3A8A] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <item.icon className="w-10 h-10" />
                </div>
                
                <h3 className="text-2xl font-bold mb-3 text-gray-900">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </CardContent>
            </Card>
            )}
          </div>


        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Simple management fees that support the platform
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            <Card className="border-2 border-transparent hover:border-blue-100 transition-all duration-300 shadow-lg">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-2">Basic Circle</h3>
                <p className="text-gray-500 mb-6">For small groups of friends and family</p>
                <div className="text-4xl font-bold mb-6">Free</div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="w-5 h-5 text-green-500" /> Up to 5 members
                  </li>
                  <li className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="w-5 h-5 text-green-500" /> user  signup and group creation
                  </li>
                  <li className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="w-5 h-5 text-green-500" /> Basic bookkeeping
                  </li>
                </ul>
                <Link to="/login">
                  <Button className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90">Current Plan</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-2 border-[#1E3A8A] relative shadow-2xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#1E3A8A] text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-2">Pro Circle</h3>
                <p className="text-gray-500 mb-6">For automated and public groups</p>
                <div className="text-4xl font-bold mb-6">1.5% <span className="text-lg font-normal text-gray-500">/ pool</span></div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="w-5 h-5 text-green-500" /> Unlimited members
                  </li>
                  <li className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="w-5 h-5 text-green-500" /> Automated randomizing
                  </li>
                  <li className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="w-5 h-5 text-green-500" /> Verified member status
                  </li>
                  <li className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="w-5 h-5 text-green-500" /> Priority support
                  </li>
                </ul>
                <Button className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90">Go Pro</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Get in Touch</h2>
              <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                Have questions about Digital Equb? Our team is here to help you start your savings journey.
              </p>
              
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-[#1E3A8A] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border border-blue-100">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">Email Us</h4>
                    <p className="text-gray-600">We're here to help! Send us an email and we'll get back to you as soon as possible</p>
                    <div>
                      <p><a href="mailto:yerosang463@gmail.com" className="text-blue-600 hover:underline">Email Us</a></p>
                    </div>
                  </div>
                    
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-[#1E3A8A] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border border-blue-100">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">Community Support</h4>
                    <p className="text-gray-600">Join our Telegram channel for instant help</p>
                    <p><a href="https://t.me/novara_code" className="text-blue-600 hover:underline">Join Now</a></p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="shadow-2xl border-none rounded-3xl overflow-hidden">
              <CardContent className="p-10">
                {isSent ? (
                  <div className="text-center py-10 animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                    <p className="text-gray-600">Thank you for reaching out. We'll get back to you shortly.</p>
                  </div>
                ) : (
                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-gray-700 font-semibold">Full Name</Label>
                      <Input 
                        id="name" 
                        placeholder="Enter your name" 
                        className="h-12 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700 font-semibold">Email Address</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="Enter your Email" 
                        className="h-12 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-gray-700 font-semibold">Message</Label>
                      <textarea 
                        id="message" 
                        className="w-full min-h-[150px] p-4 rounded-xl bg-gray-50 border border-gray-100 focus:bg-white focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition-all outline-none text-sm resize-none"
                        placeholder="How can we help you?"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                      ></textarea>
                    </div>
                    <Button 
                      type="submit" 
                      className={`w-full h-12 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 ${!isFormValid || isSubmitting ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                      disabled={!isFormValid || isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Sending...
                        </>
                      ) : "Send Message"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
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
      <footer className="bg-gray-900 text-gray-400 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8">
            <div className="col-span-2 sm:col-span-1">
              <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity cursor-pointer">
                <div className="w-8 h-8 bg-[#1E3A8A] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">E</span>
                </div>
                <span className="text-white font-semibold">Digital Equb</span>
              </a>
              <p className="text-sm hidden sm:block">Making traditional savings circles accessible to everyone.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Product</h4>
              <ul className="space-y-1.5 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Company</h4>
              <ul className="space-y-1.5 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Legal</h4>
              <ul className="space-y-1.5 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-4 sm:pt-8 text-center text-xs sm:text-sm">
            <p>&copy; 2026 Digital Equb. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>);

}