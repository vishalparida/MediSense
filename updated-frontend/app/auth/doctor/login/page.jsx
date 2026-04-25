"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stethoscope, Eye, EyeOff, Heart } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function DoctorLogin() {
  const { setIsLoggedIn } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(""); // Added error state
  const [isLoading, setIsLoading] = useState(false); // Added loading state
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      // console.log(data)

      if (response.status === 200) {
        // Security check: Ensure a Facilitator isn't trying to log into the Doctor portal
        if (data.user.role !== "Doctor") {
          setError("Access denied. Please use the Facilitator login portal.");
          setIsLoading(false);
          return;
        }

        console.log("Doctor login successful:", data);
        const token = data?.token || "";
        const user = data?.user || {};
        console.log("Received token:", token);
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        setIsLoggedIn(true);
        
        // Optional: Save the JWT token securely here
        // localStorage.setItem("token", data.token);

        // Redirect to doctor dashboard
        router.push("/doctor");
      } else {
        // Handle invalid password or unregistered email
        setError(data.message || "Invalid email or password");
      }
    } catch (err) {
      setError("Server connection failed. Is your backend running?");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <Heart className="h-8 w-8 text-blue-600" />
            <span className="font-bold text-2xl text-blue-600">MediSense</span>
          </Link>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto p-3 bg-secondary rounded-full">
              <Stethoscope className="h-8 w-8 text-cyan-600" />
            </div>
            <div>
              <CardTitle className="text-2xl text-cyan-600">
                Login to your MediSense Doctor Account
              </CardTitle>
              <CardDescription className="mt-2">
                Access your medical dashboard to review patients
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* --- ADDED ERROR DISPLAY --- */}
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md text-center">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="doctor@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-cyan-600 hover:bg-cyan-700"
              >
                {isLoading ? "Logging in..." : "Login to Dashboard"}
              </Button>

              <div className="text-center">
                <Link
                  href="/auth/doctor/forgot-password"
                  className="text-sm text-cyan-600 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link
                  href="/auth/doctor/register"
                  className="text-cyan-600 hover:underline font-medium"
                >
                  Register as Doctor
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Are you a facilitator?{" "}
            <Link
              href="/auth/facilitator/login"
              className="text-blue-600 hover:underline"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}