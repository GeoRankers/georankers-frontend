import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Sparkles,
  ArrowRight,
  Check,
  Search,
  Globe,
  Briefcase,
  Users,
  Tag,
  Rocket,
  ArrowLeft,
  Plus,
  Zap,
  Cpu,
  Layers,
  ShieldCheck,
  Network,
  Database,
  Orbit,
} from "lucide-react";
import {
  fetchOnboardingData,
  saveOnboardingSelections,
  createProduct,
  OnboardingCompetitor,
  getProductAnalytics,
} from "@/apiHelpers";
import { useAnalysisState } from "@/hooks/useAnalysisState";
import { Header } from "@/results/layout/Header";
import { ResultsContext, TabType } from "@/results/context/ResultsContext";
import { SidebarProvider } from "@/components/ui/sidebar";

/* =====================
   HELPERS
   ===================== */
const normalizeDomain = (input: string) => {
  let domain = input.trim().toLowerCase();
  domain = domain.replace(/^https?:\/\//i, "");
  domain = domain.replace(/^www\./i, "");
  domain = domain.replace(/\/+$/, "");
  return `https://${domain}/`;
};

const isValidKeyword = (keyword: string) => {
  if (!keyword) return false;
  return !/^\{\{keyword\d+\}\}$/.test(keyword.trim());
};

const getDisplayDomain = (url: string) => {
  if (!url) return "";
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

import { cn } from "@/lib/utils";


// Simplified ID generator that is stable across re-renders/refetches for the same content
const generateStableId = (prefix: string, content: string) => {
  const slug = content
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${prefix}-${slug}`;
};

// Extend OnboardingCompetitor with id for selection tracking
// interface CompetitorWithId extends OnboardingCompetitor {
//   id: string;
// }

// interface Keyword {
//   id: string;
//   keyword: string;
// }

// Helper to check if two competitors are the same (by website or name)
const isSameCompetitor = (a: OnboardingCompetitor, b: OnboardingCompetitor) => {
  if (a.website && b.website) {
    return normalizeDomain(a.website) === normalizeDomain(b.website);
  }
  return a.name.toLowerCase().trim() === b.name.toLowerCase().trim();
};

const saveKeywordsOnce = (data: any) => {
  if (
    localStorage.getItem("keywords") &&
    localStorage.getItem("keywords") !== "[]" &&
    localStorage.getItem("keyword_count") &&
    localStorage.getItem("keyword_count") !== "0"
  ) {
    console.log("⚠️ Keywords already saved. Not overwriting.");
    return;
  }

  const validKeywords = (data.search_keywords || [])
    .filter((kw: any) => isValidKeyword(kw.keyword))
    .map((kw: any) => ({
      id: kw.id,
      keyword: kw.keyword,
    }));

  localStorage.setItem("keywords", JSON.stringify(validKeywords));
  localStorage.setItem("keyword_count", validKeywords.length.toString());
};

export default function InputPage() {
  // Core state
  const [brand, setBrand] = useState("");
  const [brandName, setBrandName] = useState("");
  const [dnsStatus, setDnsStatus] = useState<
    "valid" | "invalid" | "checking" | null
  >(null);

  // Progressive flow state
  const [brandDescription, setBrandDescription] = useState("");
  const [isLoadingDescription, setIsLoadingDescription] = useState(false);
  const [suggestedCompetitors, setSuggestedCompetitors] = useState<OnboardingCompetitor[]>([]);
  const [selectedCompetitors, setSelectedCompetitors] = useState<OnboardingCompetitor[]>([]);
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeAgentIndex, setActiveAgentIndex] = useState(0);

  const AGENTS = [
    { name: "Web Crawler", status: "Scanning digital footprint...", icon: Globe, color: "text-blue-500" },
    { name: "OpenAI", status: "Synthesizing brand identity...", icon: Zap, color: "text-emerald-500" },
    { name: "Claude", status: "Analyzing competitive landscape...", icon: Network, color: "text-purple-500" },
    { name: "Gemini", status: "Processing search intent...", icon: Sparkles, color: "text-orange-500" },
    { name: "Deep Research", status: "Generating final report...", icon: ShieldCheck, color: "text-indigo-500" },
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAnalyzing) {
      interval = setInterval(() => {
        setActiveAgentIndex((prev) => (prev < AGENTS.length - 1 ? prev + 1 : prev));
      }, 2000);
    } else {
      setActiveAgentIndex(0);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // Manual input state
  const [customKeyword, setCustomKeyword] = useState("");
  const [customCompName, setCustomCompName] = useState("");
  const [customCompWebsite, setCustomCompWebsite] = useState("");
  const [isAddingCustomComp, setIsAddingCustomComp] = useState(false);
  const [isAddingCustomKeyword, setIsAddingCustomKeyword] = useState(false);

  // Legacy state for compatibility
  const [isLoading, setIsLoading] = useState(false);
  const [isNewAnalysis, setIsNewAnalysis] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  const [isWebsiteDisabled, setIsWebsiteDisabled] = useState(false);

  const { user, applicationId } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { startAnalysis } = useAnalysisState();

  useEffect(() => {
    if (!user) navigate("/login");

    const state = location.state as any;
    if (state?.prefillWebsite) {
      setBrand(state.prefillWebsite);
      checkDNS(state.prefillWebsite);
    }
    if (state?.prefillName) {
      setBrandName(state.prefillName);
    }
    if (state?.isNewAnalysis) {
      setIsNewAnalysis(true);
    }
    if (state?.productId) {
      setProductId(state.productId);
      // Fetch existing data for pre-population
      if (state.productId) {
        handlePrePopulateData(state.productId, state.prefillWebsite);
      }
    }
    if (state?.disableWebsiteEdit) {
      setIsWebsiteDisabled(true);
    }
  }, [user, navigate, location.state]);

  /* =====================
     PRE-POPULATION
     ===================== */
  const handlePrePopulateData = async (pid: string, website?: string) => {
    setIsLoading(true);
    try {
      const accessToken = localStorage.getItem("access_token") || "";
      const res = await getProductAnalytics(pid, accessToken);

      if (res && res.analytics && res.analytics.length > 0) {
        const mostRecent = res.analytics[0];
        const analytics = mostRecent.analytics;

        if (analytics) {
          // Pre-populate keywords
          if (analytics.search_keywords) {
            const keywordsObj = analytics.search_keywords;
            const keywords = Object.values(keywordsObj).map((kw: any) => kw.name);

            // Set suggestions
            setSuggestedKeywords(prev => {
              const combined = [...keywords, ...prev];
              return Array.from(new Set(combined));
            });

            // Set selected (replace previous state to match "regenerate" semantic, or append if desired. 
            // "Pre-populate" suggests filling empty state, so appending is safer).
            setSelectedKeywords(prev => {
              const combined = [...prev, ...keywords];
              return Array.from(new Set(combined));
            });
          }

          // Pre-populate competitors
          if (analytics.brands) {
            const competitors = analytics.brands
              .filter((b: any) => b.brand.toLowerCase() !== (analytics.brand_name || "").toLowerCase())
              .map((b: any) => ({
                name: b.brand,
                website: analytics.brand_websites?.[b.brand] || "",
              }));

            setSuggestedCompetitors(prev => {
              // Avoid duplicates
              const newCompetitors = competitors.filter((nc: any) =>
                !prev.some(pc => isSameCompetitor(nc, pc))
              );
              return [...newCompetitors, ...prev];
            });

            setSelectedCompetitors(prev => {
              const newCompetitors = competitors.filter((nc: any) =>
                !prev.some(pc => isSameCompetitor(nc, pc))
              );
              return [...prev, ...newCompetitors];
            });
          }

          // Set brand name if available
          if (analytics.brand_name) {
            setBrandName(analytics.brand_name);
          }

          // Set description if available
          if (analytics.executive_summary?.conclusion && !brandDescription) {
            setBrandDescription(analytics.executive_summary.conclusion);
          }
        }
      }

      // Still trigger the suggestions fetch to get fresh ideas alongside old ones
      if (website) {
        handleGenerateBrandDescription(website, pid);
      }
    } catch (error) {
      console.error("Failed to pre-populate data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /* =====================
     DNS CHECK
     ===================== */
  const checkDNS = async (url: string) => {
    if (!url.trim()) {
      setDnsStatus(null);
      return;
    }
    setDnsStatus("checking");
    setTimeout(() => {
      try {
        const normalized = normalizeDomain(url);
        const domainOnly = normalized
          .replace(/^https:\/\//, "")
          .replace(/\/$/, "");
        const domainRegex =
          /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
        const isValid = domainRegex.test(domainOnly);
        setDnsStatus(isValid ? "valid" : "invalid");

        if (isValid) {
          handleGenerateBrandDescription(url);
        }
      } catch {
        setDnsStatus("invalid");
      }
    }, 500);
  };

  const handleWebsiteChange = (value: string) => {
    setBrand(value);
    setBrandDescription("");
    setSelectedCompetitors([]);
    setSelectedKeywords([]);
    checkDNS(value);
  };

  /* =====================
     BRAND DESCRIPTION & ONBOARDING DATA
     ===================== */
  const handleGenerateBrandDescription = async (url: string, productIdParam?: string) => {
    setIsLoadingDescription(true);

    try {
      const normalizedUrl = normalizeDomain(url);
      const data = await fetchOnboardingData(normalizedUrl, undefined, productIdParam || productId || undefined);

      // Set brand description
      setBrandDescription(data.description || "");

      // Set brand name
      setBrandName(data.name || "");

      // Set competitors
      // Since "whatever API hits you render it", we can just replace or append.
      // To avoid massive lists on repeated calls, we'll merge uniqueness by website/name.
      setSuggestedCompetitors(prev => {
        const newComps = data.competitors.filter(nc => !prev.some(pc => isSameCompetitor(nc, pc)));
        return [...prev, ...newComps];
      });

      // Set keywords
      setSuggestedKeywords(prev => {
        const uniqueNew = data.keywords.filter(k => !prev.includes(k));
        return [...prev, ...uniqueNew];
      });

      setIsLoadingDescription(false);
    } catch (error: any) {
      console.error("Failed to fetch onboarding data:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load onboarding data. Please try again.",
        variant: "destructive",
      });
      setIsLoadingDescription(false);
    }
  };

  /* =====================
     COMPETITOR SELECTION
     ===================== */
  /* =====================
     COMPETITOR SELECTION
     ===================== */
  const toggleCompetitor = (competitor: OnboardingCompetitor) => {
    const isSelected = selectedCompetitors.some(c => isSameCompetitor(c, competitor));

    if (isSelected) {
      setSelectedCompetitors(prev => prev.filter(c => !isSameCompetitor(c, competitor)));
    } else {
      if (selectedCompetitors.length >= 5) {
        toast({
          title: "Selection full",
          description: "Five competitors selected. Please remove one to pick another.",
          variant: "destructive",
        });
        return;
      }
      setSelectedCompetitors(prev => [...prev, competitor]);
    }
  };

  const handleAddCustomCompetitor = () => {
    if (!customCompName.trim() || !customCompWebsite.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both a name and a website for the competitor.",
        variant: "destructive",
      });
      return;
    }

    if (selectedCompetitors.length >= 5) {
      toast({
        title: "Selection full",
        description: "Five competitors selected. Please remove one to pick another.",
        variant: "destructive",
      });
      return;
    }

    const normalizedWeb = normalizeDomain(customCompWebsite);
    const newComp: OnboardingCompetitor = {
      name: customCompName.trim(),
      website: normalizedWeb,
    };

    // Add to selected
    setSelectedCompetitors(prev => [...prev, newComp]);

    // Add to suggested if not present (optional, but good for UI consistency if we want to show it there too, 
    // but usually custom added items just go to Selected)
    setSuggestedCompetitors(prev => {
      if (!prev.some(c => isSameCompetitor(c, newComp))) {
        return [newComp, ...prev];
      }
      return prev;
    });
    setCustomCompName("");
    setCustomCompWebsite("");
    setIsAddingCustomComp(false);

    toast({
      title: "Competitor Added",
      description: `${customCompName} has been added to your selection.`,
    });
  };

  /* =====================
     KEYWORD SELECTION
     ===================== */
  /* =====================
     KEYWORD SELECTION
     ===================== */
  const toggleKeyword = (keyword: string) => {
    if (selectedKeywords.includes(keyword)) {
      setSelectedKeywords(prev => prev.filter(k => k !== keyword));
    } else {
      if (selectedKeywords.length >= 3) {
        return;
      }
      setSelectedKeywords(prev => [...prev, keyword]);
    }
  };

  const handleAddCustomKeyword = () => {
    if (!customKeyword.trim()) return;

    if (selectedKeywords.length >= 3) {
      toast({
        title: "Selection full",
        description: "Three keywords selected. Please remove one to pick another.",
        variant: "destructive",
      });
      return;
    }

    const newKw = customKeyword.trim();

    setSelectedKeywords(prev => [...prev, newKw]);
    setSuggestedKeywords(prev => {
      if (!prev.includes(newKw)) return [newKw, ...prev];
      return prev;
    });
    setCustomKeyword("");
    setIsAddingCustomKeyword(false);

    toast({
      title: "Keyword Added",
      description: `"${newKw}" has been added to your selection.`,
    });
  };

  /* =====================
     SUBMIT / START ANALYSIS
     ===================== */
  const handleStartAnalysis = async () => {
    if (selectedCompetitors.length < 4) {
      toast({
        title: "Selection incomplete",
        description: "Please select at least 4 competitors to continue.",
        variant: "destructive",
      });
      return;
    }

    if (selectedKeywords.length < 1) {
      toast({
        title: "Selection incomplete",
        description: "Please select at least one keyword.",
        variant: "destructive",
      });
      return;
    }

    if (!applicationId) {
      toast({
        title: "Authentication error",
        description: "Please try logging out and logging back in.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setIsLoading(true);

    const ANALYSIS_LOCK_KEY = "new_results_analysis_action_lock";
    const analysisTriggeredAt = Date.now();
    localStorage.setItem(ANALYSIS_LOCK_KEY, String(analysisTriggeredAt));

    try {
      const trimmedBrand = brand.trim();
      const normalizedWebsite = normalizeDomain(trimmedBrand);
      startAnalysis(productId);

      const keywordStrings = selectedKeywords; // Already strings

      if (isNewAnalysis && productId) {
        const { generateWithKeywords } = await import("@/apiHelpers");
        await generateWithKeywords(productId, keywordStrings);

        if (productId) {
          localStorage.setItem("product_id", productId);
        }
        localStorage.setItem("keywords", JSON.stringify(keywordStrings.map(k => ({ keyword: k }))));
        localStorage.setItem("keyword_count", keywordStrings.length.toString());

        setTimeout(() => {
          toast({
            title: "Analysis in Progress",
            description: "Your analysis has begun. Please stay on this page, you'll receive a notification here when it's ready.",
            duration: 10000,
          });

          navigate("/results", {
            state: {
              website: trimmedBrand,
              keywords: keywordStrings,
              productId: productId,
              analysisTriggeredAt: analysisTriggeredAt,
              isNew: true,
            },
          });

          setIsLoading(false);
        }, 10000);
      } else {
        // Execute both operations in parallel for better performance
        // selectedCompetitors are already objects
        const selectedCompetitorObjs = selectedCompetitors;

        // Execute both operations in parallel for better performance
        let productData;
        try {
          const [_, productRes] = await Promise.all([
            saveOnboardingSelections({
              website: normalizedWebsite,
              competitors: selectedCompetitorObjs,
              keywords: keywordStrings,
            }),
            createProduct({
              website: normalizedWebsite,
              name: brandName,
              description: brandDescription,
              business_domain: "General",
              application_id: applicationId,
            })
          ]);
          productData = productRes;
        } catch (error: any) {
          console.error("Analysis initialization error:", error);
          toast({
            title: "Error starting analysis",
            description: error.message || "Failed to initialize analysis. Please try again.",
            variant: "destructive",
            duration: 5000, // Make error visible longer
          });
          setIsLoading(false);
          setIsAnalyzing(false);
          return;
        }

        if (productData?.id) {
          startAnalysis(productData.id);
          localStorage.setItem("product_id", productData.id);

          // Trigger analysis with keywords
          const { generateWithKeywords } = await import("@/apiHelpers");
          await generateWithKeywords(productData.id, keywordStrings);
        }

        localStorage.setItem("keywords", JSON.stringify(keywordStrings.map(k => ({ keyword: k }))));
        localStorage.setItem("keyword_count", keywordStrings.length.toString());
        saveKeywordsOnce(productData);
        setTimeout(() => {
          toast({
            title: "Analysis in Progress",
            description: "Your analysis has begun. Please stay on this page, you'll receive a notification here when it's ready.",
            duration: 10000,
          });

          navigate("/results", {
            state: {
              website: trimmedBrand,
              keywords: keywordStrings,
              productId: productData?.id,
              analysisTriggeredAt: analysisTriggeredAt,
              isNew: true,
            },
          });

          setIsLoading(false);
        }, 10000);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to start analysis. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
      setIsAnalyzing(false);
    }
  };

  const canProceed =
    dnsStatus === "valid" &&
    brandDescription &&
    selectedCompetitors.length >= 4 &&
    selectedKeywords.length >= 1;

  /* =====================
     RENDER
     ===================== */
  return (
    <ResultsContext.Provider value={{
      isLoading: false,
      dataReady: false,
      productData: null,
      currentAnalytics: null,
      previousAnalytics: null,
      activeTab: "overview",
      setActiveTab: () => { },
      isAnalyzing: false
    }}>
      <SidebarProvider defaultOpen={false}>
        <div className="w-full">
          <Layout showNavigation={false}>
            <div className="min-h-screen bg-transparent">
              <Header />
              <main className="container mx-auto px-4 py-12 max-w-5xl mt-14 mb-24 relative">
                {/* Background Decorations */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -z-10 animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] -z-10 animate-pulse delay-700" />

                {!isAnalyzing ? (
                  <>
                    <div className="space-y-4 text-center mb-12">
                      <h1 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl lg:text-6xl">
                        <span className="gradient-text">Analysis</span> Setup
                      </h1>
                      <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Configure your brand, keywords, and competitors for AI visibility tracking.
                      </p>
                    </div>

                    <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-start">
                      {/* SIDEBAR PROGRESSION */}
                      <aside className="lg:col-span-3 mb-10 lg:mb-0">
                        <div className="lg:sticky lg:top-32 space-y-10 animate-in fade-in slide-in-from-left-6 duration-700">
                          <div className="space-y-1">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/50">Your Progress</h3>
                            <p className="text-sm font-bold text-foreground/80">Analysis Configuration</p>
                          </div>

                          <div className="flex flex-col gap-8 relative">
                            {/* Vertical Line Connector */}
                            <div className="absolute left-5 top-4 bottom-4 w-0.5 bg-muted rounded-full overflow-hidden z-0">
                              <div
                                className="w-full bg-emerald-500 transition-all duration-1000"
                                style={{
                                  height: selectedCompetitors.length >= 4 ? '100%' :
                                    brandDescription ? '50%' : '0%'
                                }}
                              />
                            </div>

                            {[
                              { id: 1, label: "Brand Identity", desc: "Identity & Vision", active: true, completed: Boolean(brandDescription) },
                              { id: 2, label: "Competitors", desc: "Market Benchmarks", active: Boolean(brandDescription), completed: selectedCompetitors.length >= 4 },
                              { id: 3, label: "Keywords", desc: "Visibility Targets", active: selectedCompetitors.length >= 4, completed: selectedKeywords.length >= 1 },
                            ].map((step) => (
                              <div key={step.id} className={cn(
                                "flex items-start gap-5 transition-all duration-500 relative z-10",
                                step.active ? "opacity-100" : "opacity-30"
                              )}>
                                <div className={cn(
                                  "w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-bold transition-all duration-500 border-2 shrink-0 bg-background",
                                  step.completed ? "bg-emerald-500 border-emerald-500 text-white shadow-glow-emerald" :
                                    step.active ? "bg-primary border-primary text-primary-foreground shadow-glow" :
                                      "border-muted text-muted-foreground"
                                )}>
                                  {step.completed ? <Check className="w-5 h-5" /> : step.id}
                                </div>
                                <div className="flex flex-col gap-0.5 pt-0.5">
                                  <span className={cn(
                                    "text-xs font-black uppercase tracking-wider",
                                    step.active ? "text-foreground" : "text-muted-foreground"
                                  )}>{step.label}</span>
                                  <span className="text-[10px] font-bold text-muted-foreground/60 tracking-tight">{step.desc}</span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Requirement Pill */}
                          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 backdrop-blur-sm flex flex-col gap-3 transition-all duration-300 hover:bg-primary/10">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest">
                              <Tag className="w-3 h-3" />
                              Requirements
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-[10px] font-bold">
                                <span className={selectedCompetitors.length >= 4 ? "text-emerald-500" : "text-muted-foreground/70"}>Min. 4 Competitors</span>
                                {selectedCompetitors.length >= 4 ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <div className="w-3 h-3 rounded-full border border-muted-foreground/30" />
                                )}
                              </div>
                              <div className="flex items-center justify-between text-[10px] font-bold">
                                <span className={selectedKeywords.length >= 1 ? "text-emerald-500" : "text-muted-foreground/70"}>Min. 1 Keyword</span>
                                {selectedKeywords.length >= 1 ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <div className="w-3 h-3 rounded-full border border-muted-foreground/30" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </aside>

                      {/* MAIN CONTENT AREA */}
                      <div className="lg:col-span-9 space-y-12">
                        {/* SECTION 1: Brand Details */}
                        <Card className="border-none shadow-elevated bg-card/60 backdrop-blur-md overflow-hidden relative group transition-all duration-500 hover:shadow-glow/20">
                          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <CardHeader className="pb-4 pt-8">
                            <div className="flex items-center gap-4">
                              <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 shadow-sm transition-transform duration-500 group-hover:scale-110">
                                <Globe className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <CardTitle className="text-xl font-bold tracking-tight">Brand Details</CardTitle>
                                <CardDescription className="text-sm text-muted-foreground/80">How the world recognizes your business</CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="grid gap-8 p-8 pt-0">
                            <div className="grid grid-cols-2 gap-4">
                              {/* Brand Name */}
                              <div className="space-y-2">
                                <Label htmlFor="brand-name" className="text-xs font-medium text-foreground/80">
                                  Brand Name
                                </Label>
                                <Input
                                  id="brand-name"
                                  placeholder="e.g. Acme Corp"
                                  value={brandName}
                                  onChange={(e) => setBrandName(e.target.value)}
                                  disabled={isWebsiteDisabled}
                                  className="h-10 text-sm bg-background border-input hover:border-primary/50 focus:border-primary transition-all rounded-md px-3"
                                />
                              </div>

                              {/* Website */}
                              <div className="space-y-2">
                                <Label htmlFor="website" className="text-xs font-medium text-foreground/80">
                                  Website URL
                                </Label>
                                <div className="relative group/input">
                                  <Input
                                    id="website"
                                    placeholder="e.g. acme.com"
                                    value={brand}
                                    onChange={(e) => handleWebsiteChange(e.target.value)}
                                    className={cn(
                                      "h-10 pl-3 pr-10 text-sm bg-background border-input hover:border-primary/50 focus:border-primary transition-all rounded-md",
                                      dnsStatus === "valid" && "border-emerald-500/50 focus:border-emerald-500"
                                    )}
                                    disabled={isWebsiteDisabled}
                                  />
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                    {dnsStatus === "checking" && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                                    {dnsStatus === "valid" && <CheckCircle className="w-4 h-4 text-emerald-500 animate-in zoom-in duration-300" />}
                                    {dnsStatus === "invalid" && <XCircle className="w-4 h-4 text-destructive animate-in shake duration-300" />}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Description - Full Width */}
                            {dnsStatus === "valid" && (
                              <div className="space-y-4 animate-in fade-in slide-in-from-top-6 duration-700">
                                <div className="flex items-center justify-between">
                                  <Label htmlFor="description" className="text-sm font-bold flex items-center gap-2 text-foreground/90">
                                    <Briefcase className="w-4 h-4 text-primary" />
                                    Brand Description
                                  </Label>
                                  {!productId && (
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 animate-pulse shadow-sm">
                                      <Sparkles className="w-3.5 h-3.5" />
                                      AI INTELLIGENCE ACTIVE
                                    </div>
                                  )}
                                </div>
                                {isLoadingDescription ? (
                                  <div className="p-12 border-2 border-dashed border-primary/20 rounded-2xl bg-primary/5 space-y-6 flex flex-col items-center justify-center text-center overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-progress-loop" />
                                    <div className="relative">
                                      <div className="w-16 h-16 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                                      <Sparkles className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                    </div>
                                    <div className="space-y-2 relative">
                                      <p className="text-lg font-bold text-foreground">Analyzing Digital Footprint</p>
                                      <p className="text-sm text-muted-foreground">Synthesizing brand character and market positioning...</p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="relative group/textarea">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-transparent rounded-xl opacity-0 group-focus-within/textarea:opacity-100 transition-opacity duration-500" />
                                    <Textarea
                                      id="description"
                                      value={brandDescription}
                                      onChange={(e) => setBrandDescription(e.target.value)}
                                      disabled={!!productId}
                                      className={cn(
                                        "min-h-[160px] text-base bg-background/50 border-input resize-none focus:border-primary transition-all p-6 leading-relaxed rounded-xl shadow-inner relative z-10",
                                        productId && "opacity-60 cursor-not-allowed bg-muted/30"
                                      )}
                                      placeholder="Describe your brand and its offerings..."
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* ========== SECTION 2: COMPETITORS ========== */}
                        {brandDescription && (
                          <Card className="border-none shadow-elevated bg-card/60 backdrop-blur-md overflow-hidden relative animate-in fade-in slide-in-from-bottom-10 duration-700 hover:shadow-glow/20 transition-all duration-500">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                            <CardHeader className="pb-4 pt-8">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-sm">
                                    <Users className="w-5 h-5 text-amber-500" />
                                  </div>
                                  <div>
                                    <CardTitle className="text-xl font-bold tracking-tight">Competitive Brands</CardTitle>
                                    <CardDescription className="text-sm text-muted-foreground/80">Select key competitors to measure against</CardDescription>
                                  </div>
                                </div>
                                <Badge variant="secondary" className={cn(
                                  "h-8 px-4 font-bold transition-all duration-500 shadow-sm rounded-full",
                                  selectedCompetitors.length >= 4
                                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                    : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                )}>
                                  {selectedCompetitors.length} / 5 Selected
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-8 p-8 pt-0">

                              {/* Selected Zone */}
                              <div className="p-6 rounded-2xl border-2 border-dashed border-muted bg-muted/20 min-h-[100px] flex flex-col gap-4 relative overflow-hidden group/selected">
                                <div className="flex items-center justify-between relative z-10">
                                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Active Comparison Group</span>
                                  {selectedCompetitors.length > 0 && (
                                    <button
                                      onClick={() => setSelectedCompetitors([])}
                                      className="text-[10px] font-bold text-muted-foreground hover:text-destructive transition-colors uppercase tracking-wider"
                                    >
                                      Clear All
                                    </button>
                                  )}
                                </div>
                                {selectedCompetitors.length === 0 ? (
                                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-1 py-2">
                                    <p className="text-xs text-muted-foreground/60 font-medium">Add competitors</p>
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap gap-2">
                                    {selectedCompetitors.map((competitor, idx) => (
                                      <Badge
                                        key={`${normalizeDomain(competitor.website)}-${idx}`}
                                        variant="secondary"
                                        className="pl-4 pr-2 py-2 bg-background border shadow-elevated hover:bg-muted/80 flex items-center gap-3 group animate-in zoom-in-95 duration-300 rounded-xl"
                                      >
                                        <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                          {competitor.name.charAt(0)}
                                        </div>
                                        <span className="font-bold text-sm">{competitor.name}</span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleCompetitor(competitor);
                                          }}
                                          className="p-1 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                                        >
                                          <XCircle className="w-4 h-4" />
                                        </button>
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Suggested Zone */}
                              <div className="space-y-3">
                                <Label className="text-xs font-medium text-foreground/70">Suggested Competitors</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                  {suggestedCompetitors.filter(c => !selectedCompetitors.some(sc => isSameCompetitor(sc, c))).slice(0, 9).map((competitor, idx) => (
                                    <button
                                      key={`${normalizeDomain(competitor.website)}-suggestion-${idx}`}
                                      onClick={() => toggleCompetitor(competitor)}
                                      className="flex items-center gap-4 p-4 rounded-xl border bg-card/40 hover:bg-card hover:border-primary/50 hover:shadow-glow/10 hover:-translate-y-1 transition-all duration-300 text-left group relative overflow-hidden"
                                    >
                                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-sm font-black text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500 relative z-10">
                                        {competitor.name.charAt(0)}
                                      </div>
                                      <div className="flex-1 min-w-0 relative z-10">
                                        <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{competitor.name}</p>
                                        <p className="text-[10px] text-muted-foreground font-medium truncate opacity-70 group-hover:opacity-100 transition-opacity">{getDisplayDomain(competitor.website)}</p>
                                      </div>
                                      <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-all duration-500 opacity-20 group-hover:opacity-100 group-hover:rotate-90 relative z-10" />
                                    </button>
                                  ))}
                                  {/* Manual Add Card */}
                                  {isAddingCustomComp ? (
                                    <div className="col-span-full sm:col-span-2 md:col-span-1 p-3 rounded-md border border-dashed bg-muted/20 flex flex-col gap-2 animate-in fade-in zoom-in-95">
                                      <Input
                                        placeholder="Name"
                                        value={customCompName}
                                        onChange={(e) => setCustomCompName(e.target.value)}
                                        className="h-8 text-xs bg-background"
                                        autoFocus
                                      />
                                      <Input
                                        placeholder="Website"
                                        value={customCompWebsite}
                                        onChange={(e) => setCustomCompWebsite(e.target.value)}
                                        className="h-8 text-xs bg-background"
                                      />
                                      <div className="flex gap-2">
                                        <Button size="sm" variant="default" onClick={handleAddCustomCompetitor} className="h-7 text-xs flex-1">Add</Button>
                                        <Button size="sm" variant="ghost" onClick={() => setIsAddingCustomComp(false)} className="h-7 text-xs px-2">Cancel</Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setIsAddingCustomComp(true)}
                                      className="flex flex-col items-center justify-center gap-2 p-3 rounded-md border border-dashed hover:border-primary/50 hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary group h-full min-h-[60px]"
                                    >
                                      <Plus className="w-5 h-5" />
                                      <span className="text-xs font-medium">Add Manual</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}


                        {/* ========== SECTION 3: KEYWORDS ========== */}
                        {selectedCompetitors.length >= 4 && (
                          <Card className="border-none shadow-elevated bg-card/60 backdrop-blur-md overflow-hidden relative animate-in fade-in slide-in-from-bottom-10 duration-700 delay-100 hover:shadow-glow/20 transition-all duration-500">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                            <CardHeader className="pb-4 pt-8">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 shadow-sm">
                                    <Search className="w-5 h-5 text-primary" />
                                  </div>
                                  <div>
                                    <CardTitle className="text-xl font-bold tracking-tight">Keywords</CardTitle>
                                    <CardDescription className="text-sm text-muted-foreground/80">Target queries to analyze for visibility</CardDescription>
                                  </div>
                                </div>
                                <Badge variant="secondary" className={cn(
                                  "h-8 px-4 font-bold transition-all duration-500 shadow-sm rounded-full",
                                  selectedKeywords.length >= 1
                                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                    : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                )}>
                                  {selectedKeywords.length} / 3 Selected
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-8 p-8 pt-0">

                              {/* Selected Zone */}
                              <div className="flex flex-wrap gap-2 min-h-[40px] p-4 rounded-lg border bg-muted/30">
                                {selectedKeywords.length === 0 ? (
                                  <p className="text-xs text-muted-foreground/50 w-full text-center">Add Keywords</p>
                                ) : (
                                  selectedKeywords.map((keyword, idx) => (
                                    <Badge
                                      key={`selected-kw-${idx}-${keyword}`}
                                      variant="secondary"
                                      className="pl-3 pr-1.5 py-1 bg-background border shadow-sm flex items-center gap-2 group animate-in scale-95 duration-200"
                                    >
                                      <span className="font-medium text-xs">{keyword}</span>
                                      <button
                                        onClick={() => toggleKeyword(keyword)}
                                        className="p-0.5 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                                      >
                                        <XCircle className="w-3 h-3" />
                                      </button>
                                    </Badge>
                                  ))
                                )}
                              </div>

                              {/* Suggestions */}
                              <div className="space-y-3">
                                <Label className="text-xs font-medium text-foreground/70">Suggested Keywords</Label>
                                <div className="flex flex-wrap gap-2">
                                  {suggestedKeywords.filter(k => !selectedKeywords.includes(k)).slice(0, 15).map((keyword, idx) => (
                                    <button
                                      key={`suggestion-kw-${idx}`}
                                      onClick={() => toggleKeyword(keyword)}
                                      className="px-4 py-2 rounded-full border bg-card/40 text-xs font-bold text-foreground/70 hover:border-primary/50 hover:bg-primary/5 hover:text-primary hover:scale-105 hover:shadow-glow/5 transition-all duration-300 active:scale-95"
                                    >
                                      + {keyword}
                                    </button>
                                  ))}

                                  {/* Manual Add */}
                                  {isAddingCustomKeyword ? (
                                    <div className="flex items-center gap-2 animate-in fade-in zoom-in-95">
                                      <Input
                                        value={customKeyword}
                                        onChange={(e) => setCustomKeyword(e.target.value)}
                                        placeholder="New Keyword"
                                        className="h-7 w-32 text-xs bg-background rounded-full"
                                        autoFocus
                                        onKeyDown={(e) => e.key === "Enter" && handleAddCustomKeyword()}
                                      />
                                      <Button size="sm" variant="ghost" onClick={handleAddCustomKeyword} className="h-7 w-7 p-0 rounded-full"><Check className="w-4 h-4 text-emerald-500" /></Button>
                                      <Button size="sm" variant="ghost" onClick={() => setIsAddingCustomKeyword(false)} className="h-7 w-7 p-0 rounded-full"><XCircle className="w-4 h-4 text-muted-foreground" /></Button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setIsAddingCustomKeyword(true)}
                                      className="px-3 py-1.5 rounded-full border border-dashed border-muted-foreground/30 text-xs font-medium text-muted-foreground hover:border-primary/50 hover:text-primary transition-all flex items-center gap-1"
                                    >
                                      <Plus className="w-3 h-3" /> Add Custom
                                    </button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}


                        {/* START ANALYSIS BUTTON */}
                        <div className="flex justify-center pt-8 z-30">
                          <Button
                            size="lg"
                            className={cn(
                              "h-16 px-12 rounded-full shadow-glow font-black text-base transition-all duration-700 flex items-center gap-3 overflow-hidden group/btn relative",
                              canProceed
                                ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:scale-105 active:scale-95 text-white opacity-100"
                                : "bg-muted text-muted-foreground scale-95 opacity-50 cursor-not-allowed"
                            )}
                            onClick={handleStartAnalysis}
                            disabled={!canProceed || isLoading}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 ease-in-out" />
                            {isLoading ? (
                              <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                <span className="animate-pulse">Launching AI Swarm...</span>
                              </>
                            ) : (
                              <>
                                <Rocket className={cn("w-6 h-6 transition-transform duration-500", canProceed && "group-hover/btn:-translate-y-1 group-hover/btn:translate-x-1")} />
                                <span className="tracking-wide">LAUNCH DEEP ANALYSIS</span>
                                <ArrowRight className="w-5 h-5 ml-1 transition-transform duration-500 group-hover/btn:translate-x-1" />
                              </>
                            )}
                          </Button>
                        </div>

                      </div>
                    </div>
                  </>
                ) : (
                  // LOADING STATE
                  <div className="min-h-[85vh] flex flex-col items-center justify-center p-8 relative overflow-hidden">
                    {/* Background Ambient Glows */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse delay-700" />

                    <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-16 items-center relative z-10">

                      {/* Left Side: Premium Visualizer */}
                      <div className="flex flex-col items-center justify-center space-y-12 order-2 lg:order-1">
                        <div className="relative group">
                          {/* Multi-layered Spinner */}
                          <div className="relative w-64 h-64">
                            <div className="absolute inset-0 rounded-full border-[8px] border-primary/5 animate-[spin_8s_linear_infinite]" />
                            <div className="absolute inset-2 rounded-full border-[2px] border-dashed border-primary/20 animate-[spin_12s_linear_infinite_reverse]" />
                            <div className="absolute inset-0 rounded-full border-t-[8px] border-primary shadow-glow duration-1000 animate-[spin_3s_cubic-bezier(0.4,0,0.2,1)_infinite]" />

                            {/* Inner Orbiting Icons */}
                            <div className="absolute inset-8 rounded-full border border-indigo-500/20 animate-[spin_6s_linear_infinite]">
                              <div className="absolute -top-2 left-1/2 -translate-x-1/2 p-2 bg-background border border-indigo-500/40 rounded-lg shadow-glow-sm">
                                <Cpu className="w-4 h-4 text-indigo-500" />
                              </div>
                            </div>

                            {/* Center Icon: Dynamic based on active agent */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="relative">
                                <div className="absolute -inset-6 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                                {(() => {
                                  const Icon = AGENTS[activeAgentIndex].icon;
                                  return (
                                    <div className="relative p-6 bg-background rounded-3xl border-2 border-primary/30 shadow-elevated animate-in zoom-in duration-500">
                                      <Icon className={cn("w-12 h-12 transition-colors duration-500", AGENTS[activeAgentIndex].color)} />
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="text-center space-y-4">
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary animate-pulse shadow-sm">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-xs font-black uppercase tracking-[0.2em]">Agentic Intelligence Active</span>
                          </div>
                          <div className="space-y-1">
                            <h2 className="text-4xl font-black tracking-tighter uppercase">
                              <span className="gradient-text">{AGENTS[activeAgentIndex].name}</span>
                            </h2>
                            <p className="text-muted-foreground font-bold text-sm tracking-wide">{AGENTS[activeAgentIndex].status}</p>
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Agent List Progress */}
                      <div className="space-y-8 order-1 lg:order-2">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/60">Swarm Intelligence</h3>
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                              {Math.round(((activeAgentIndex + 1) / AGENTS.length) * 100)}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden border border-muted/20">
                            <div
                              className="h-full bg-gradient-to-r from-primary via-indigo-500 to-primary transition-all duration-1000 ease-out shadow-glow animate-gradient-flow"
                              style={{ width: `${((activeAgentIndex + 1) / AGENTS.length) * 100}%` }}
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          {AGENTS.map((agent, index) => {
                            const isActive = index === activeAgentIndex;
                            const isCompleted = index < activeAgentIndex;
                            const AgentIcon = agent.icon;

                            return (
                              <div
                                key={agent.name}
                                className={cn(
                                  "flex items-center gap-5 p-4 rounded-2xl border transition-all duration-500 relative overflow-hidden group/agent",
                                  isActive ? "bg-card border-primary/40 shadow-glow/10 translate-x-2 scale-[1.02]" :
                                    isCompleted ? "bg-emerald-500/5 border-emerald-500/20 opacity-80" :
                                      "bg-muted/30 border-transparent opacity-30"
                                )}
                              >
                                {isActive && (
                                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent animate-in slide-in-from-left duration-1000" />
                                )}
                                <div className={cn(
                                  "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-700 relative z-10",
                                  isActive ? "bg-primary text-primary-foreground shadow-glow rotate-0 scale-110" :
                                    isCompleted ? "bg-emerald-500 text-white" :
                                      "bg-background text-muted-foreground"
                                )}>
                                  {isCompleted ? <Check className="w-6 h-6 animate-in zoom-in duration-300" /> : <AgentIcon className="w-5 h-5" />}
                                </div>
                                <div className="flex-1 min-w-0 relative z-10">
                                  <div className="flex items-center justify-between">
                                    <span className={cn(
                                      "font-black text-xs uppercase tracking-wider transition-colors duration-500",
                                      isActive ? "text-foreground" : "text-muted-foreground"
                                    )}>{agent.name}</span>
                                    {isActive && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                                  </div>
                                  <p className="text-[10px] font-bold tracking-tight uppercase opacity-60">
                                    {isCompleted ? "Analysis Complete" : isActive ? "Processing Insights..." : "Awaiting activation"}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex flex-col items-center gap-2">
                          <p className="text-[10px] text-muted-foreground/60 font-black tracking-[0.2em] uppercase">
                            Estimated time remaining: {Math.max(0, (AGENTS.length - activeAgentIndex - 1) * 2)}s
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </main >
            </div>
          </Layout >
        </div>
      </SidebarProvider >
    </ResultsContext.Provider >
  );
}
