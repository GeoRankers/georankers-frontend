import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { regenerateAnalysis } from "@/apiHelpers";
import { useToast } from "@/hooks/use-toast";

interface LayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
  sidebarTrigger?: React.ReactNode;
}

export const Layout = ({ children, showNavigation = true, sidebarTrigger }: LayoutProps) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedProductId = localStorage.getItem("product_id");
    setProductId(storedProductId);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleRegenerateAnalysis = async () => {
    if (!productId) return;

    setIsRegenerating(true);
    try {
      const accessToken = localStorage.getItem("access_token") || "";

      // Call regenerate analysis API
      await regenerateAnalysis(productId, accessToken);

      toast({
        title: "Analysis in Progress",
        description: "Your analysis has begun. Please stay on this page, you'll receive a notification here when it's ready.",
        duration: 10000,
      });

      // Refresh after some time
      setTimeout(() => {
        window.location.reload();
      }, 20000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to regenerate analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-bg">
      {/* Add no-print class to hide navigation in PDF */}
      {showNavigation && (
        <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 no-print">
          <div className="px-4">
            <div className="flex h-16 items-center justify-between">
              {/* Left side - Sidebar trigger and Logo */}
              <div className="flex items-center space-x-3">
                {sidebarTrigger}
                <Link to="/" className="flex items-center space-x-2">
                  <span className="text-2xl md:text-3xl font-bold gradient-text">
                    GeoRankers
                  </span>
                </Link>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                {user ? (
                  <>
                    {/* Desktop Profile */}
                    <div className="hidden md:flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span className="text-sm text-muted-foreground">
                        Welcome, {user.first_name}
                      </span>
                    </div>

                    {/* Profile Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="relative h-10 w-10 rounded-full p-0"
                        >
                          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                            {user.first_name.charAt(0).toUpperCase()}
                          </div>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="w-56"
                        align="end"
                        forceMount
                      >
                        <DropdownMenuItem className="flex items-center space-x-2 md:hidden">
                          <User className="w-4 h-4" />
                          <span>
                            {user.first_name} {user.last_name}
                          </span>
                        </DropdownMenuItem>
                        {productId && (
                          <DropdownMenuItem
                            onClick={handleRegenerateAnalysis}
                            disabled={isRegenerating}
                            className="flex items-center space-x-2"
                          >
                            <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                            <span>Regenerate Analysis</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={handleLogout}
                          className="flex items-center space-x-2 text-destructive focus:text-destructive"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : location.pathname === "/login" ? (
                  <Link to="/register">
                    <Button variant="outline" size="sm">
                      Register
                    </Button>
                  </Link>
                ) : location.pathname === "/register" ? (
                  <Link to="/login">
                    <Button variant="outline" size="sm">
                      Login
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/login">
                      <Button variant="ghost" size="sm">
                        Login
                      </Button>
                    </Link>
                    <Link to="/register">
                      <Button variant="default" size="sm">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>
      )}

      <main className="flex-1">{children}</main>
    </div>
  );
};