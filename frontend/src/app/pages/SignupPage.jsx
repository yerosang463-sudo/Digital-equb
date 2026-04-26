import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { GoogleLogin } from "@react-oauth/google";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { useAuth } from "../providers/AuthProvider";

export function SignupPage() {
  const navigate = useNavigate();
  const { signup, loginWithGoogle, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(true);
  const [googleError, setGoogleError] = useState(false);

  function handleChange(event) {
    setFormData({ ...formData, [event.target.id]: event.target.value });
  }

  async function handleGoogleSuccess(response) {
    try {
      await loginWithGoogle(response.credential);
      navigate("/dashboard");
    } catch (error) {
      setGoogleError(true);
      window.alert(error.message || "Google signup failed. Please try email/password signup.");
    }
  }

  function handleGoogleError() {
    setGoogleError(true);
    setGoogleScriptLoaded(false);
    window.alert("Google login unavailable. Please check your internet connection or use email/password signup.");
  }

  async function handleSignup(event) {
    event.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      window.alert("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await signup({
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });
      navigate("/dashboard");
    } catch (error) {
      window.alert(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-80 h-80 bg-blue-600 rounded-full blur-[120px] opacity-20"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-indigo-600 rounded-full blur-[120px] opacity-20"></div>

      <Card className="w-full max-w-md shadow-2xl bg-white/5 backdrop-blur-xl border-white/10 text-white">
        <CardHeader className="space-y-1 pb-6">
          <Link to="/" className="flex justify-center mb-6 transition-transform hover:scale-110">
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-700 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl ring-4 ring-blue-500/20">
              <span className="text-white font-bold text-3xl">E</span>
            </div>
          </Link>
          <CardTitle className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
            Create Account
          </CardTitle>
          <CardDescription className="text-center text-gray-400 text-lg">
            Join Digital Equb and start saving today
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            {googleScriptLoaded && !googleError ? (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_blue"
                shape="pill"
                size="large"
                text="signup_with"
                width="360"
              />
            ) : (
              <div className="w-full max-w-[360px] text-center">
                <p className="text-gray-400 text-sm mb-2">Google signup unavailable</p>
                <p className="text-gray-500 text-xs">Please use email/password signup below</p>
              </div>
            )}
          </div>


          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full bg-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#1a2035] px-2 text-gray-400 font-semibold tracking-wider">
                Or sign up with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-gray-300 ml-1">Full Name</Label>
                <Input id="fullName" placeholder="Enter your full name" value={formData.fullName} onChange={handleChange} required className="bg-white/5 border-white/10 focus:ring-blue-500 text-white h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300 ml-1">Email</Label>
                <Input id="email" type="email" placeholder="Enter your email" value={formData.email} onChange={handleChange} required className="bg-white/5 border-white/10 focus:ring-blue-500 text-white h-11" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-300 ml-1">Phone Number</Label>
              <Input id="phone" type="tel" placeholder="Enter your phone number" value={formData.phone} onChange={handleChange} required className="bg-white/5 border-white/10 focus:ring-blue-500 text-white h-11" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300 ml-1">Password</Label>
                <Input id="password" type="password" placeholder="Create a password" value={formData.password} onChange={handleChange} required className="bg-white/5 border-white/10 focus:ring-blue-500 text-white h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-300 ml-1">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="bg-white/5 border-white/10 focus:ring-blue-500 text-white h-11"
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-lg shadow-blue-900/20 mt-4" disabled={submitting}>
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating Account...
                </span>
              ) : "Create Account"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col pb-8 pt-0">
          <p className="text-sm text-center text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

