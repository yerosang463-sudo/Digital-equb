import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { useAuth } from "../providers/AuthProvider";

// Import GoogleLogin directly to avoid multiple initialization issues
import { GoogleLogin } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(Boolean(GOOGLE_CLIENT_ID));
  const [googleError, setGoogleError] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleLogin(event) {
    if (event) event.preventDefault();
    await performLogin(email, password);
  }

  async function handleGoogleSuccess(response) {
    try {
      if (!response?.credential) {
        throw new Error("No Google credential returned");
      }

      await loginWithGoogle(response.credential);
      navigate(location.state?.from || "/dashboard");
    } catch (error) {
      setGoogleError(true);
      window.alert(error.message || "Google login failed. Please try email/password login.");
    }
  }

  function handleGoogleError() {
    setGoogleError(true);
    setGoogleScriptLoaded(false);
    window.alert("Google login unavailable. Please check your internet connection or use email/password login.");
  }

  async function performLogin(loginEmail, loginPassword) {
    setSubmitting(true);
    try {
      await login(loginEmail, loginPassword);
      navigate(location.state?.from || "/dashboard");
    } catch (error) {
      window.alert(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-80 h-80 bg-blue-600 rounded-full blur-[120px] opacity-20"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-indigo-600 rounded-full blur-[120px] opacity-20"></div>
      
      <Card className="w-full max-w-md shadow-2xl bg-white/5 backdrop-blur-xl border-white/10 text-white">
        <CardHeader className="space-y-1 pb-6">
          <Link to="/" className="flex justify-center mb-6 transition-transform hover:scale-110">
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-700 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl ring-4 ring-blue-500/20">
              <span className="text-white font-bold text-3xl">E</span>
            </div>
          </Link>
          <CardTitle className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-center text-gray-400 text-lg">
            Sign in to your Digital Equb account
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Social Logins */}
          <div className="flex justify-center">
            {googleScriptLoaded && !googleError ? (
              <GoogleLogin
                key="google-login-button"
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_blue"
                shape="pill"
                size="large"
                text="continue_with"
                width="360"
              />
            ) : (
              <div className="w-full max-w-[360px] text-center">
                <p className="text-gray-400 text-sm mb-2">Google login unavailable</p>
                <p className="text-gray-500 text-xs">Please use email/password login below</p>
              </div>
            )}
          </div>


          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full bg-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#1a2035] px-2 text-gray-400 font-semibold tracking-wider">
                Or continue with
              </span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 ml-1">Email Address</Label>
                <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="bg-white/5 border-white/10 focus:ring-blue-500 text-white h-11"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" text-gray-300>Password</Label>
                <Link to="/forgot-password" size="sm" className="text-sm text-blue-400 hover:text-blue-300">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="bg-white/5 border-white/10 focus:ring-blue-500 text-white h-11"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-lg shadow-blue-900/20 mt-2" 
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing In...
                </span>
              ) : "Sign In"}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex flex-col pb-8 pt-0">
          <p className="text-sm text-center text-gray-400">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              Create an account
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}


