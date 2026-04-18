import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { useAuth } from "../providers/AuthProvider";

export function SignupPage() {
  const navigate = useNavigate();
  const { signup, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  function handleChange(event) {
    setFormData({ ...formData, [event.target.id]: event.target.value });
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
    <div className="min-h-screen bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <Link to="/" className="flex justify-center mb-4 transition-transform hover:scale-105">
            <div className="w-16 h-16 bg-[#1E3A8A] rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-3xl">E</span>
            </div>
          </Link>
          <CardTitle className="text-2xl text-center">Create Account</CardTitle>
          <CardDescription className="text-center">Join Digital Equb and start saving today</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" placeholder="Abebe Bekele" value={formData.fullName} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="name@example.com" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" placeholder="+251 91 234 5678" value={formData.phone} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Create a password" value={formData.password} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90" disabled={submitting}>
              {submitting ? "Creating Account..." : "Create Account"}
            </Button>
            <p className="text-sm text-center text-gray-600">
              Already have an account?{" "}
              <Link to="/login" className="text-[#1E3A8A] hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
