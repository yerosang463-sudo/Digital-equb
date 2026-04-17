import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { useAuth } from "../providers/AuthProvider";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleLogin(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await login(email, password);
      navigate(location.state?.from || "/dashboard");
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
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#1E3A8A] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-3xl">E</span>
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">Sign in to your Digital Equb account</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm text-gray-600">
              Demo seed account: <strong>abebe@example.com</strong> / <strong>password123</strong>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90" disabled={submitting}>
              {submitting ? "Signing In..." : "Sign In"}
            </Button>
            <p className="text-sm text-center text-gray-600">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="text-[#1E3A8A] hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
