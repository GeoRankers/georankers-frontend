import { useNavigate, useLocation, Link } from "react-router-dom";
import { Menu, X, FileDown, User, LogOut, RefreshCw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { regenerateAnalysis } from "@/apiHelpers";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useResults, TabType } from "@/results/context/ResultsContext";
import { createRoot } from "react-dom/client";
import FullReportContent from "@/results/pages/FullReportContent";
import { useSidebar } from "@/components/ui/sidebar";
import { PanelLeft } from "lucide-react";

const mobileNavItems = [
  { label: "Overview", path: "/newresults", tab: "overview" as TabType },
  {
    label: "Executive Summary",
    path: "/newresults/executive-summary",
    tab: "executive-summary" as TabType,
  },
  { label: "Prompts", path: "/newresults/prompts", tab: "prompts" as TabType },
  {
    label: "Sources",
    path: "/newresults/sources-all",
    tab: "sources-all" as TabType,
  },
  {
    label: "Competitors",
    path: "/newresults/competitors-comparisons",
    tab: "competitors-comparisons" as TabType,
  },
  {
    label: "Brand Sentiment",
    path: "/newresults/brand-sentiment",
    tab: "brand-sentiment" as TabType,
  },
  {
    label: "Recommendations",
    path: "/newresults/recommendations",
    tab: "recommendations" as TabType,
  },
];

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, products } = useAuth();
  const { toast } = useToast();
  const { setActiveTab } = useResults();
  const printContainerRef = useRef<HTMLDivElement | null>(null);
  const { toggleSidebar } = useSidebar();

  useEffect(() => {
    const storedProductId = localStorage.getItem("product_id");
    setProductId(storedProductId);
  }, [location]);

  // Handle mobile menu body scroll lock
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleNewAnalysis = () => {
    const currentWebsite = products?.[0]?.website || "";
    const currentProductId = products?.[0]?.id || productId || "";

    navigate("/input", {
      state: {
        prefillWebsite: currentWebsite,
        productId: currentProductId,
        isNewAnalysis: true,
        disableWebsiteEdit: true,
      },
    });
  };

  const handleRegenerateAnalysis = async () => {
    if (!productId) return;

    setIsRegenerating(true);
    try {
      const accessToken = localStorage.getItem("access_token") || "";
      await regenerateAnalysis(productId, accessToken);

      toast({
        title: "Analysis in Progress",
        description:
          "Your analysis has begun. Please stay on this page, you'll receive a notification here when it's ready.",
        duration: 10000,
      });

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

  const handleMobileNavClick = (tab: TabType) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const handleGenerateReport = useCallback(() => {
    setIsGeneratingReport(true);

    // Create a hidden container for the full report
    let printContainer = document.getElementById(
      "print-report-container"
    ) as HTMLDivElement;
    if (!printContainer) {
      printContainer = document.createElement("div");
      printContainer.id = "print-report-container";
      printContainer.className = "print-only";
      document.body.appendChild(printContainer);
    }

    // Mount the full report content
    const root = createRoot(printContainer);
    root.render(<FullReportContent />);

    // Add print styles dynamically
    const printStyleId = "print-report-styles";
    let styleSheet = document.getElementById(printStyleId) as HTMLStyleElement;

    if (!styleSheet) {
      styleSheet = document.createElement("style");
      styleSheet.id = printStyleId;
      document.head.appendChild(styleSheet);
    }

    styleSheet.textContent = `
      @media print {
        @page {
          size: A4;
          margin: 10mm;
        }
        
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          font-size: 11px;
        }
        
        /* Hide everything except the print container */
        body > *:not(#print-report-container) {
          display: none !important;
        }
        
        #print-report-container {
          display: block !important;
          position: static !important;
          width: 100% !important;
        }
        
        .print-only {
          display: block !important;
        }
        
        .no-print, 
        [class*="no-print"],
        header,
        nav,
        .fixed,
        button,
        .sidebar,
        [data-sidebar] {
          display: none !important;
        }
        
        * {
          box-shadow: none !important;
        }
        
        .page-break-before {
          page-break-before: always;
        }
        
        .page-break-inside-avoid {
          page-break-inside: avoid;
        }
        
        .bg-card {
          background: white !important;
          border: 1px solid #e5e7eb !important;
        }
        
        table {
          font-size: 10px;
        }
      }
      
      @media screen {
        #print-report-container {
          display: none !important;
        }
      }
    `;

    toast({
      title: "Generating Report",
      description: "Preparing your comprehensive report...",
      duration: 2000,
    });

    // Small delay to render the component, then trigger print
    setTimeout(() => {
      window.print();

      // Cleanup after print
      setTimeout(() => {
        root.unmount();
        setIsGeneratingReport(false);
      }, 1000);
    }, 500);
  }, [toast]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border no-print shadow-sm">
        <div className="flex items-center justify-between px-3 md:px-6 md:pl-14 py-2 md:py-3">
          <div className="flex items-center gap-2 md:gap-3">
            {/* Mobile menu button */}
            <button
              className="md:hidden p-1.5 -ml-1 text-foreground touch-manipulation"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={toggleSidebar}
              className="hidden md:flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted transition-colors"
              aria-label="Toggle sidebar"
            >
              <PanelLeft className="h-5 w-5 text-foreground" />
            </button>

            <Link to="/" className="flex items-center gap-1.5 md:gap-2">
              <span className="text-xl md:text-2xl font-bold gradient-text">
                GeoRankers
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-1.5 md:gap-4">
            {/* New Analysis Button */}
            <Button
              variant="outline"
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground text-[10px] md:text-sm px-2 py-1 md:px-4 md:py-2 gap-1 h-7 md:h-9"
              onClick={handleNewAnalysis}
            >
              <Plus className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">New Analysis</span>
              <span className="sm:hidden">New</span>
            </Button>

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative h-7 w-7 md:h-10 md:w-10 rounded-full p-0 md:mr-5"
                  >
                    <div className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-xs md:text-sm shadow-lg">
                      {user.first_name?.charAt(0).toUpperCase() || "U"}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuItem className="flex items-center space-x-2">
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
                      <RefreshCw
                        className={`w-4 h-4 ${
                          isRegenerating ? "animate-spin" : ""
                        }`}
                      />
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
                  <DropdownMenuItem>
                    {/* Generate Report Button */}
                    <Button
                      size="sm"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 text-[10px] md:text-sm px-2 py-1 md:px-4 md:py-2 gap-1 h-7 md:h-9"
                      onClick={handleGenerateReport}
                      disabled={isGeneratingReport}
                    >
                      <FileDown
                        className={cn(
                          "w-3 h-3 md:w-4 md:h-4",
                          isGeneratingReport && "animate-pulse"
                        )}
                      />
                      <span className="hidden sm:inline">
                        {isGeneratingReport
                          ? "Generating..."
                          : "Generate Report"}
                      </span>
                      <span className="sm:hidden">Report</span>
                    </Button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-1 md:gap-2">
                <Link to="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs md:text-sm h-7 md:h-9 px-2 md:px-3"
                  >
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button
                    variant="default"
                    size="sm"
                    className="text-xs md:text-sm h-7 md:h-9 px-2 md:px-3"
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden touch-manipulation"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile menu drawer */}
      <div
        className={cn(
          "fixed top-[49px] left-0 right-0 bg-card border-b border-border z-50 md:hidden transition-all duration-300 overflow-hidden",
          mobileMenuOpen
            ? "max-h-[80vh] opacity-100 overflow-y-auto"
            : "max-h-0 opacity-0"
        )}
      >
        <nav className="p-3 space-y-1">
          {mobileNavItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleMobileNavClick(item.tab)}
              className={cn(
                "block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors touch-manipulation",
                location.pathname === item.path
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted active:bg-muted"
              )}
            >
              {item.label}
            </button>
          ))}
          <div className="px-3 py-2.5 text-sm text-muted-foreground">
            <span className="font-medium">Content Hub</span>
            <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded">
              Coming Soon
            </span>
          </div>
        </nav>
      </div>
    </>
  );
};