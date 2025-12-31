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
} from "lucide-react";
import {
  fetchOnboardingData,
  saveOnboardingSelections,
  createProduct,
  OnboardingCompetitor,
  getProductAnalytics,
} from "@/apiHelpers";
import { useAnalysisState } from "@/hooks/useAnalysisState";
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
        handleGenerateBrandDescription(website);
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
  const handleGenerateBrandDescription = async (url: string) => {
    setIsLoadingDescription(true);

    try {
      const normalizedUrl = normalizeDomain(url);
      const data = await fetchOnboardingData(normalizedUrl);

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
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="container mx-auto px-4 py-12 max-w-4xl">
          {!isAnalyzing ? (
            <div className="space-y-12">
              {/* Header */}
              <div className="space-y-4 text-center">
                <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-xl mb-2">
                  <Rocket className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                  Brand Analysis Setup
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium opacity-90">
                  Configure your brand analysis by providing key information. We'll use this to benchmark your presence against competitors.
                </p>
              </div>

              {/* Main Content Sections */}
              <div className="space-y-12 pb-20">

                {/* SECTION 1: Brand Details */}
                <Card className="border-none shadow-[0_20px_50px_rgba(30,144,255,0.15)] bg-card/40 backdrop-blur-xl overflow-hidden ring-1 ring-border/50 relative group">
                  <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-blue-600 to-indigo-600" />
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700" />

                  <CardHeader className="pb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 shadow-inner border border-blue-500/20">
                        <Globe className="w-6 h-6 text-blue-500" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold tracking-tight">Brand Details</CardTitle>
                        <CardDescription className="text-base">Enter your brand's core information</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-10 p-8 pt-2">
                    <div className="grid gap-8 md:grid-cols-2">
                      {/* Brand Name */}
                      <div className="space-y-3">
                        <Label htmlFor="brand-name" className="text-sm font-bold flex items-center gap-2 text-foreground/80">
                          Brand Name
                        </Label>
                        <Input
                          id="brand-name"
                          placeholder="e.g. Acme Corp"
                          value={brandName}
                          onChange={(e) => setBrandName(e.target.value)}
                          disabled={isWebsiteDisabled}
                          className="h-14 bg-background/40 border-border/60 hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all rounded-xl px-4 text-base"
                        />
                      </div>

                      {/* Website */}
                      <div className="space-y-3">
                        <Label htmlFor="website" className="text-sm font-bold text-foreground/80">
                          Website URL
                        </Label>
                        <div className="relative group/input">
                          <Input
                            id="website"
                            placeholder="e.g. acme.com"
                            value={brand}
                            onChange={(e) => handleWebsiteChange(e.target.value)}
                            className={cn(
                              "h-14 pl-5 pr-12 bg-background/40 border-border/60 hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all rounded-xl text-base",
                              dnsStatus === "valid" && "border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/10"
                            )}
                            disabled={isWebsiteDisabled}
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            {dnsStatus === "checking" && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                            {dnsStatus === "valid" && <CheckCircle className="w-6 h-6 text-emerald-500 animate-in zoom-in duration-500" />}
                            {dnsStatus === "invalid" && <XCircle className="w-6 h-6 text-destructive animate-in shake duration-300" />}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description - Full Width */}
                    {dnsStatus === "valid" && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-6 duration-700">
                        <Label htmlFor="description" className="text-sm font-bold flex items-center gap-2 text-foreground/80">
                          <Briefcase className="w-4 h-4 text-muted-foreground" />
                          Brand Description
                        </Label>
                        {isLoadingDescription ? (
                          <div className="p-10 border-2 border-dashed rounded-2xl bg-primary/5 space-y-6 flex flex-col items-center justify-center text-center overflow-hidden relative">
                            <div className="relative z-10">
                              <div className="p-4 rounded-3xl bg-primary/10 mb-2">
                                <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                              </div>
                            </div>
                            <div className="space-y-3 w-full max-w-xs relative z-10">
                              <p className="text-base font-bold text-foreground">Analyzing presence...</p>
                              <div className="h-2 bg-muted rounded-full overflow-hidden shadow-inner">
                                <div className="h-full bg-gradient-to-r from-primary to-indigo-500 animate-progress-loop" />
                              </div>
                              <p className="text-xs text-muted-foreground font-medium italic opacity-80">Generating an optimized brand profile</p>
                            </div>
                            {/* Decorative Blobs */}
                            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/10 blur-[60px] rounded-full" />
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 blur-[60px] rounded-full" />
                          </div>
                        ) : (
                          <div className="relative group/textarea">
                            <Textarea
                              id="description"
                              value={brandDescription}
                              onChange={(e) => setBrandDescription(e.target.value)}
                              className="min-h-[160px] bg-background/40 border-border/60 resize-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all p-5 leading-relaxed rounded-2xl text-base shadow-sm"
                              placeholder="Describe your brand and its offerings..."
                            />
                            <div className="absolute bottom-4 right-4 flex items-center gap-2 text-[11px] font-bold text-primary bg-primary/5 px-3 py-1.5 rounded-full border border-primary/20 backdrop-blur-md">
                              <Sparkles className="w-3 h-3" />
                              AI-Optimized
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>


                {/* ========== SECTION 2: COMPETITORS ========== */}
                {brandDescription && (
                  <Card className="border-none shadow-[0_20px_50px_rgba(245,158,11,0.15)] bg-card/40 backdrop-blur-xl overflow-hidden ring-1 ring-border/50 animate-in fade-in slide-in-from-bottom-12 duration-1000 relative group">
                    <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-amber-500 to-orange-600" />
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all duration-700" />

                    <CardHeader className="pb-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 shadow-inner border border-amber-500/20">
                            <Users className="w-6 h-6 text-amber-500" />
                          </div>
                          <div>
                            <CardTitle className="text-2xl font-bold tracking-tight">Competitors</CardTitle>
                            <CardDescription className="text-base text-muted-foreground/80">Choose from our suggestions or add your own competitors to benchmark against</CardDescription>
                          </div>
                        </div>
                        <div className={cn(
                          "px-6 py-2 rounded-full text-sm font-bold border transition-all duration-500 shadow-xl backdrop-blur-md",
                          selectedCompetitors.length >= 4
                            ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-600 border-emerald-500/30 shadow-emerald-500/10"
                            : "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 border-amber-500/30 shadow-amber-500/10"
                        )}>
                          {selectedCompetitors.length} Selected
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-10 p-8 pt-2">

                      {/* Selected Zone */}
                      <div className="p-6 rounded-2xl border bg-muted/30 backdrop-blur-md min-h-[120px] flex flex-col gap-5 relative overflow-hidden shadow-inner border-border/40">
                        <div className="absolute inset-0 bg-gradient-to-br from-background/50 to-transparent pointer-events-none" />
                        <div className="flex items-center justify-between relative z-10">
                          <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">Your Active Benchmark Group</span>
                          {selectedCompetitors.length > 0 && (
                            <button
                              onClick={() => setSelectedCompetitors([])}
                              className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-destructive transition-all hover:translate-x-1"
                            >
                              Reset Group
                            </button>
                          )}
                        </div>
                        {selectedCompetitors.length === 0 ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-2 py-4 relative z-10">
                            <div className="w-10 h-10 rounded-full border border-dashed border-muted-foreground/20 flex items-center justify-center">
                              <Plus className="w-5 h-5 text-muted-foreground/30" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-muted-foreground/70 uppercase tracking-tight">No competitors tracked</p>
                              <p className="text-xs text-muted-foreground/40 font-medium">Add suggestions or create your own</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-4 relative z-10">
                            <div className="flex flex-wrap gap-3">
                              {selectedCompetitors.map((competitor, idx) => (
                                <Badge
                                  key={`${normalizeDomain(competitor.website)}-${idx}`}
                                  className="pl-4 pr-2 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 rounded-2xl flex items-center gap-3 group animate-in zoom-in-95 duration-500 shadow-lg shadow-amber-500/20 border-white/10"
                                >
                                  <span className="font-bold text-sm">{competitor.name}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleCompetitor(competitor);
                                    }}
                                    className="p-1.5 rounded-xl bg-black/10 hover:bg-black/20 text-white/90 hover:text-white transition-all transform hover:scale-110"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                            {selectedCompetitors.length < 4 && (
                              <div className="flex items-center gap-2.5 text-amber-600/90 animate-in fade-in slide-in-from-left-4 duration-500 py-1">
                                <Sparkles className="w-4 h-4" />
                                <span className="text-xs font-bold tracking-tight">Expand to {4} competitors to reveal deep-bench insights (at least {4 - selectedCompetitors.length} more)</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-6">
                        {/* Ghost Trigger Manual Entry */}
                        {!isAddingCustomComp ? (
                          <button
                            onClick={() => setIsAddingCustomComp(true)}
                            className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-muted/40 border border-border/40 hover:bg-amber-500/5 hover:border-amber-500/30 hover:text-amber-600 transition-all group w-full sm:w-fit shadow-sm hover:shadow-md hover:-translate-y-0.5"
                          >
                            <div className="p-1 rounded-lg bg-muted group-hover:bg-amber-500 group-hover:text-white transition-all">
                              <Plus className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold uppercase tracking-wider">Add Custom Entity</span>
                          </button>
                        ) : (
                          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/30 animate-in zoom-in-95 duration-300 shadow-xl backdrop-blur-md">
                            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="relative group/input">
                                <input
                                  autoFocus
                                  placeholder="Competitor Name"
                                  value={customCompName}
                                  onChange={(e) => setCustomCompName(e.target.value)}
                                  className="w-full h-11 bg-background/60 border border-border/40 hover:border-amber-500/30 focus:border-amber-500/50 rounded-xl text-sm placeholder:text-muted-foreground/50 focus:ring-4 focus:ring-amber-500/5 focus:outline-none px-4 transition-all"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  placeholder="Website (e.g. competitor.com)"
                                  value={customCompWebsite}
                                  onChange={(e) => setCustomCompWebsite(e.target.value)}
                                  className="flex-1 h-11 bg-background/60 border border-border/40 hover:border-amber-500/30 focus:border-amber-500/50 rounded-xl text-sm placeholder:text-muted-foreground/50 focus:ring-4 focus:ring-amber-500/5 focus:outline-none px-4 transition-all"
                                />
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <Button
                                    onClick={handleAddCustomCompetitor}
                                    disabled={!customCompName.trim() || !customCompWebsite.trim()}
                                    size="sm"
                                    className="h-11 px-5 text-xs font-bold uppercase bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20 rounded-xl transition-all active:scale-95"
                                  >
                                    Add
                                  </Button>
                                  <Button
                                    onClick={() => setIsAddingCustomComp(false)}
                                    variant="ghost"
                                    size="sm"
                                    className="h-11 w-11 p-0 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors"
                                  >
                                    <XCircle className="w-5 h-5" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Suggestions Grid */}
                        <div className="space-y-6">
                          <div className="flex items-center gap-3">
                            <Label className="text-sm font-bold text-foreground/80 uppercase tracking-widest px-1">Curated Benchmarks</Label>
                            <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {suggestedCompetitors
                              .filter(c => !selectedCompetitors.some(sc => isSameCompetitor(sc, c))) // Check if NOT selected
                              .map((competitor, idx) => (
                                <button
                                  key={`${normalizeDomain(competitor.website)}-${idx}`} // Use website/name as key
                                  onClick={() => toggleCompetitor(competitor)} // Pass object
                                  className="flex items-start gap-4 p-5 rounded-2xl border bg-background/40 backdrop-blur-sm border-border/60 hover:border-amber-500/5 hover:bg-background/80 hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-1.5 transition-all duration-500 text-left group"
                                >
                                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-muted to-background flex items-center justify-center shrink-0 border border-border/80 group-hover:from-amber-500/10 group-hover:to-orange-500/10 group-hover:border-amber-500/30 group-hover:scale-110 transition-all duration-500 shadow-sm">
                                    <span className="text-base font-extrabold text-amber-600">{competitor.name.charAt(0)}</span>
                                  </div>
                                  <div className="min-w-0 flex-1 space-y-1.5">
                                    <div className="font-bold text-base truncate group-hover:text-amber-600 transition-colors duration-300">{competitor.name}</div>
                                    <div className="text-[11px] text-muted-foreground/60 truncate font-mono uppercase tracking-tighter group-hover:text-muted-foreground transition-colors duration-300">
                                      {competitor.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                                    </div>
                                  </div>
                                </button>
                              ))
                            }
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* ========== SECTION 3: KEYWORDS ========== */}
                {selectedCompetitors.length >= 1 && suggestedKeywords.length > 0 && (
                  <Card className="border-none shadow-[0_20px_50px_rgba(79,70,229,0.15)] bg-card/40 backdrop-blur-xl overflow-hidden ring-1 ring-border/50 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-150 relative group">
                    <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-violet-600" />
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700" />

                    <CardHeader className="pb-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 shadow-inner border border-indigo-500/20">
                            <Tag className="w-6 h-6 text-indigo-500" />
                          </div>
                          <div>
                            <CardTitle className="text-2xl font-bold tracking-tight">Target Keywords</CardTitle>
                            <CardDescription className="text-base text-muted-foreground/80">Select recommended keywords or add your own specific industry terms</CardDescription>
                          </div>
                        </div>
                        <div className={cn(
                          "px-6 py-2 rounded-full text-sm font-bold border transition-all duration-500 shadow-xl backdrop-blur-md",
                          selectedKeywords.length >= 1
                            ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-600 border-emerald-500/30 shadow-emerald-500/10"
                            : "bg-gradient-to-r from-indigo-500/20 to-violet-500/20 text-indigo-600 border-indigo-500/30 shadow-indigo-500/10"
                        )}>
                          {selectedKeywords.length} Selected
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-10 p-8 pt-2">

                      {/* Selected Zone */}
                      <div className="p-6 rounded-2xl border bg-muted/30 backdrop-blur-md min-h-[120px] flex flex-col gap-5 relative overflow-hidden shadow-inner border-border/40">
                        <div className="absolute inset-0 bg-gradient-to-br from-background/50 to-transparent pointer-events-none" />
                        <div className="flex items-center justify-between relative z-10">
                          <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">Top Relevance Focus</span>
                        </div>
                        {selectedKeywords.length === 0 ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-2 py-4 relative z-10">
                            <div className="w-10 h-10 rounded-full border border-dashed border-muted-foreground/20 flex items-center justify-center">
                              <Tag className="w-5 h-5 text-muted-foreground/30" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-muted-foreground/70 uppercase tracking-tight">Focus list empty</p>
                              <p className="text-xs text-muted-foreground/40 font-medium">Keywords guide AI search testing intensity</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-3 relative z-10">
                            {selectedKeywords.map((keyword, idx) => (
                              <Badge
                                key={`${keyword}-${idx}`}
                                className="pl-4 pr-2 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-700 text-white hover:from-indigo-700 hover:to-violet-800 rounded-2xl flex items-center gap-3 group animate-in zoom-in-95 duration-500 shadow-lg shadow-indigo-500/20 border-white/10"
                              >
                                <span className="font-bold text-sm text-white">{keyword}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleKeyword(keyword); // Pass string
                                  }}
                                  className="p-1.5 rounded-xl bg-black/10 hover:bg-black/20 text-white/90 hover:text-white transition-all transform hover:scale-110"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </Badge>
                            ))
                            }
                          </div>
                        )}
                      </div>

                      <div className="space-y-8">
                        {/* Ghost Trigger Manual Entry */}
                        {!isAddingCustomKeyword ? (
                          <button
                            onClick={() => setIsAddingCustomKeyword(true)}
                            className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-muted/40 border border-border/40 hover:bg-indigo-500/5 hover:border-indigo-500/30 hover:text-indigo-600 transition-all group w-full sm:w-fit shadow-sm hover:shadow-md hover:-translate-y-0.5"
                          >
                            <div className="p-1 rounded-lg bg-muted group-hover:bg-indigo-500 group-hover:text-white transition-all">
                              <Plus className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold uppercase tracking-wider">Define Custom keyword</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/30 animate-in zoom-in-95 duration-300 shadow-xl backdrop-blur-md">
                            <input
                              autoFocus
                              placeholder="Add your own keyword..."
                              value={customKeyword}
                              onChange={(e) => setCustomKeyword(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddCustomKeyword();
                                }
                              }}
                              className="flex-1 h-11 bg-background/60 border border-border/40 hover:border-indigo-500/30 focus:border-indigo-500/50 rounded-xl text-sm placeholder:text-muted-foreground/50 focus:ring-4 focus:ring-indigo-500/5 focus:outline-none px-4 transition-all"
                            />
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Button
                                onClick={handleAddCustomKeyword}
                                disabled={!customKeyword.trim()}
                                size="sm"
                                className="h-11 px-5 text-xs font-bold uppercase bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 rounded-xl transition-all active:scale-95"
                              >
                                Add
                              </Button>
                              <Button
                                onClick={() => setIsAddingCustomKeyword(false)}
                                variant="ghost"
                                size="sm"
                                className="h-11 w-11 p-0 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors"
                              >
                                <XCircle className="w-5 h-5" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Suggestions Cloud */}
                        <div className="space-y-6">
                          <div className="flex items-center gap-3">
                            <Label className="text-sm font-bold text-foreground/80 uppercase tracking-widest px-1">Industry Context</Label>
                            <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
                          </div>
                          <div className="flex flex-wrap gap-3.5">
                            {suggestedKeywords
                              .filter(k => !selectedKeywords.includes(k))
                              .map((keyword, idx) => (
                                <button
                                  key={`${keyword}-${idx}`}
                                  onClick={() => toggleKeyword(keyword)}
                                  disabled={selectedKeywords.length >= 3}
                                  className={cn(
                                    "px-6 py-3 rounded-2xl text-[13px] font-bold border transition-all duration-300 shadow-sm relative overflow-hidden group",
                                    selectedKeywords.length >= 3
                                      ? "opacity-40 cursor-not-allowed bg-muted/50 border-border"
                                      : "bg-background/40 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/20 border-border/60"
                                  )}
                                >
                                  <span className="relative z-10">{keyword}</span>
                                  {!selectedKeywords.length && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-violet-500/5 pointer-events-none" />
                                  )}
                                </button>
                              ))
                            }
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* ========== ACTION BUTTON ========== */}
                {selectedKeywords.length >= 1 && (
                  <div className="flex flex-col items-center gap-6 pt-12 pb-24 animate-in fade-in slide-in-from-bottom-12 duration-1000 relative">
                    <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
                    <Button
                      onClick={handleStartAnalysis}
                      disabled={!canProceed || isLoading}
                      size="lg"
                      className={cn(
                        "w-full sm:w-auto min-w-[320px] h-20 text-2xl font-extrabold rounded-3xl shadow-[0_20px_60px_rgba(var(--primary),0.3)] transition-all duration-500 group relative overflow-hidden",
                        isLoading
                          ? "opacity-80 cursor-not-allowed"
                          : "bg-primary text-white hover:bg-primary/90 hover:scale-[1.03] active:scale-95 hover:shadow-primary/50"
                      )}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-3 h-7 w-7 animate-spin" />
                          Igniting Core Engine...
                        </>
                      ) : (
                        <div className="flex items-center gap-4">
                          <span>Launch Deep Analysis</span>
                          <ArrowRight className="h-7 w-7 group-hover:translate-x-2 transition-transform duration-500" />
                        </div>
                      )}
                    </Button>
                    <p className="text-[11px] font-bold tracking-[0.2em] text-muted-foreground/60 uppercase animate-pulse">
                      Processing benchmarks across millions of data points
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ========== ANALYZING STATE ========== */
            <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
              <div className="relative mb-12">
                <div className="w-32 h-32 rounded-3xl bg-primary/10 flex items-center justify-center animate-pulse relative z-10 border border-primary/20">
                  <Search className="w-16 h-16 text-primary" />
                </div>
                {/* Decorative Elements */}
                <div className="absolute -inset-4 bg-primary/5 rounded-full blur-2xl animate-pulse" />
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-amber-500/10 rounded-full blur-xl animate-bounce duration-[3000ms]" />
                <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-indigo-500/10 rounded-full blur-xl animate-bounce duration-[4000ms]" />
              </div>

              <div className="max-w-md w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="space-y-3">
                  <h3 className="text-3xl font-extrabold tracking-tight text-foreground">
                    Analyzing Your Brand
                  </h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Our AI is scanning millions of data points across the search ecosystem to map your brand visibility.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden p-0.5 border border-border/50">
                    <div className="h-full bg-gradient-to-r from-primary via-indigo-500 to-primary bg-[length:200%_auto] animate-gradient-flow rounded-full w-full" />
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                    <span>Gathering Data</span>
                    <span>Processing Insights</span>
                  </div>
                </div>

                <div className="pt-8 border-t border-border/50 flex flex-col items-center gap-4">
                  <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-full border border-border/50 backdrop-blur-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm font-semibold text-foreground">Creating your dashboard</span>
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    Estimated completion: 30-45 seconds
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
}
