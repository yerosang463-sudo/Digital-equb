import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";

function ContactSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });

  const isFormValid = formData.email.includes("@") && formData.email.includes(".") && formData.message.trim().length > 5;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    setIsSubmitting(true);
    try {
      // Simulate API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSent(true);
      setFormData({ name: "", email: "", message: "" });
      setTimeout(() => setIsSent(false), 5000);
    } catch (error) {
      window.alert(error.message || "Failed to send message. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get in Touch
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Have questions about Digital Equb? We'd love to hear from you.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="shadow-lg">
              <CardContent className="p-8">
                {isSent ? (
                  <div className="text-center py-8">
                    <div className="text-green-500 text-5xl mb-4">✓</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Message Sent!
                    </h3>
                    <p className="text-gray-600">
                      We'll get back to you within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <Label htmlFor="name" className="text-gray-700">Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Your name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-gray-700">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="mt-1"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="message" className="text-gray-700">Message</Label>
                      <textarea
                        id="message"
                        rows={4}
                        placeholder="How can we help you?"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={!isFormValid || isSubmitting}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                    >
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Contact Info */}
            <div className="space-y-8">
              <Card className="shadow-lg">
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">
                    Contact Information
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600">📧</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Email</p>
                        <p className="text-gray-600">support@digitalequb.com</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600">📱</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Phone</p>
                        <p className="text-gray-600">+251 911 234 567</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600">📍</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Office</p>
                        <p className="text-gray-600">Addis Ababa, Ethiopia</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Business Hours
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monday - Friday</span>
                      <span className="text-gray-900">9:00 AM - 6:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Saturday</span>
                      <span className="text-gray-900">10:00 AM - 2:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sunday</span>
                      <span className="text-gray-900">Closed</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
            <Button 
              size="lg" 
              className="bg-white text-[#1E3A8A] hover:bg-gray-100 px-8 py-6 text-lg"
            >
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
    </>
  );
}

export default ContactSection;
