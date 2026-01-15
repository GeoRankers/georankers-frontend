import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { getProductsByApplication } from "@/apiHelpers";

const Register = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { register, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if email is educational
  const isEducationalEmail = (email: string) => {
    const eduPatterns = [
      // Generic .edu domains (USA and global)
      /\.edu$/i,
      /\.edu\./i,
      
      // Academic domains (.ac)
      /\.ac\.[a-z]{2,}$/i,
      /\.ac\./i,
      
      // Country-specific educational domains
      /\.edu\.[a-z]{2,}$/i,        // .edu.in, .edu.au, .edu.sg, .edu.cn, .edu.sa
      /\.edu\.in$/i,                // India
      /\.ac\.in$/i,                 // India academic
      /\.ac\.uk$/i,                 // UK
      /\.edu\.au$/i,                // Australia
      /\.ac\.jp$/i,                 // Japan
      /\.ac\.kr$/i,                 // South Korea
      /\.ac\.ae$/i,                 // UAE
      /\.edu\.cn$/i,                // China
      /\.edu\.sg$/i,                // Singapore
      /\.edu\.sa$/i,                // Saudi Arabia
      
      // European university domains
      /\.uni-[a-z]+\.de$/i,         // German universities
      /\.university\.[a-z]{2,}$/i,  // Generic university domains
      
      // Specific educational TLDs
      /@[a-z0-9-]+\.edu$/i,         // All .edu emails
      /@[a-z0-9-]+\.ac\./i,         // All .ac. emails
    ];
    return eduPatterns.some(pattern => pattern.test(email));
  };

  const isEmailEducational = isEducationalEmail(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEmailEducational) {
      toast({
        title: "Educational email not supported",
        description: "Please use a personal or business email address instead of an educational email.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both password fields match.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    try {
      await register(email, password, fullName);
    
      localStorage.setItem("pending_verification_email", email);
    
      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });
    
      navigate("/email-verification-pending");
    } catch (error: any) {
      console.error("Registration error:", error);
    
      // Extract backend error message if available
      const backendMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Registration failed. Please try again.";
    
      // Handle known error: existing user
      if (backendMessage.toLowerCase().includes("already exists")) {
        toast({
          title: "User already exists",
          description: "An account with this email already exists. Please try with some other email.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Registration failed",
          description: backendMessage,
          variant: "destructive",
        });
      }
    }    
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <Card className="w-full max-w-md bg-gradient-card border-0 shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-blue-600">
            Create account
          </CardTitle>
          <CardDescription>
            Join GeoRankers today
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="bg-background"
                autoComplete="name"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background"
                autoComplete="off"
              />
              {isEmailEducational && email && (
                <p className="text-sm text-red-600">
                  Educational emails are not supported. Please use a personal or business email address.
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-background pr-10"
                  autoComplete="off"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-background"
                autoComplete="off"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
              disabled={isLoading || isEmailEducational}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link
              to="/login"
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;