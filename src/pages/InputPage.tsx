import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  X,
  Plus,
  Search,
  Globe,
  Tags,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { fetchProductsWithKeywords } from "@/apiHelpers";
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

// ✅ Check valid keyword (rejects {{keyword1}}, {{keyword2}}, …)
const isValidKeyword = (keyword: string) => {
  if (!keyword) return false;
  return !/^\{\{keyword\d+\}\}$/.test(keyword.trim());
};

// ✅ Save keywords only once
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

  console.log("✅ Saved keywords:", validKeywords);
  console.log("✅ Keyword count:", validKeywords.length);
};

export default function InputPage() {
  const [brand, setBrand] = useState("");
  const [currentKeyword, setCurrentKeyword] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dnsStatus, setDnsStatus] = useState<
    "valid" | "invalid" | "checking" | null
  >(null);
  const [isNewAnalysis, setIsNewAnalysis] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  const [isWebsiteDisabled, setIsWebsiteDisabled] = useState(false);

  const { user, applicationId, products } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { startAnalysis } = useAnalysisState();

  useEffect(() => {
    if (!user) navigate("/login");

    // Check if coming from Results page with pre-filled website
    const state = location.state as any;
    if (state?.prefillWebsite) {
      setBrand(state.prefillWebsite);
      checkDNS(state.prefillWebsite);
    }
    if (state?.isNewAnalysis) {
      setIsNewAnalysis(true);
    }
    if (state?.productId) {
      setProductId(state.productId);
    }
    if (state?.disableWebsiteEdit) {
      setIsWebsiteDisabled(true);
    }
  }, [user, navigate, location.state]);

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
      } catch {
        setDnsStatus("invalid");
      }
    }, 500);
  };

  const handleWebsiteChange = (value: string) => {
    setBrand(value);
    checkDNS(value);
  };

  /* =====================
     KEYWORD HANDLERS
     ===================== */
  const addKeyword = () => {
    const trimmed = currentKeyword.trim();
    if (trimmed && keywords.length < 3 && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
      setCurrentKeyword("");
    }
  };

  const removeKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addKeyword();
    }
  };

  /* =====================
     SUBMIT
     ===================== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!brand.trim()) {
      toast({
        title: "Website URL required",
        description: "Please enter your website URL.",
        variant: "destructive",
      });
      return;
    }

    if (dnsStatus !== "valid") {
      toast({
        title: "Invalid website URL",
        description: "Please enter a valid website URL that exists.",
        variant: "destructive",
      });
      return;
    }

    if (keywords.length === 0) {
      toast({
        title: "Keywords required",
        description: "Please add at least one keyword.",
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

    setIsLoading(true);

    try {
      const trimmedBrand = brand.trim();
      const analysisTriggeredAt = Date.now();
      
      // Check if this is a new analysis or initial product creation
      if (isNewAnalysis && productId) {
        // Start analysis state tracking
        startAnalysis(productId);
        
        // Use the new generate/with-keywords endpoint
        const { generateWithKeywords } = await import("@/apiHelpers");
        const data = await generateWithKeywords(productId, keywords);
        
        console.log("New analysis generation started");
        
        // Update localStorage with latest data
        if (productId) {
          localStorage.setItem("product_id", productId);
        }
        localStorage.setItem("keywords", JSON.stringify(keywords.map(k => ({ keyword: k }))));
        localStorage.setItem("keyword_count", keywords.length.toString());

        setTimeout(() => {
          toast({
            title: "Analysis in Progress",
            description: "Your analysis has begun. Please stay on this page, you'll receive a notification here when it's ready.",
            duration: 10000,
          });

          navigate("/results", {
            state: {
              website: trimmedBrand,
              keywords,
              productId: productId,
              analysisTriggeredAt: analysisTriggeredAt,
              isNew: true,
            },
          });

          setIsLoading(false);
        }, 10000);
      } else {
        // Create new product with keywords
        const payload = {
          name: trimmedBrand,
          description: trimmedBrand,
          website: normalizeDomain(trimmedBrand),
          business_domain: trimmedBrand,
          application_id: applicationId,
          search_keywords: keywords,
        };

        console.log("Brand analysis generation started");
        const data = await fetchProductsWithKeywords(payload);
        console.log("Brand analysis created");

        // Start analysis state tracking after we have product ID
        if (data.product?.id) {
          startAnalysis(data.product.id);
          localStorage.setItem("product_id", data.product.id);
        }

        // Save keywords once
        saveKeywordsOnce(data);

        setTimeout(() => {
          toast({
            title: "Analysis in Progress",
            description: "Your analysis has begun. Please stay on this page, you'll receive a notification here when it's ready.",
            duration: 10000,
          });

          navigate("/results", {
            state: {
              website: trimmedBrand,
              keywords,
              productId: data.product?.id,
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
    }
  };

  /* =====================
     RENDER
     ===================== */
  return (
    <Layout>
      <div className="min-h-screen bg-gray-100">
        <main className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            {/* Hero Section */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-blue-600">
                Check your AI search visibility
              </h1>
              <p className="text-xl text-gray-600">
                Enter your website URL and up to 3 keywords to see how AI
                assistants mention you.
              </p>
            </div>

            {/* Form Card */}
            <Card className="text-left bg-white border shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900 text-center">
                  Website Visibility Analysis
                </CardTitle>
                <CardDescription className="text-gray-600 text-center">
                  Get insights into how AI assistants present your website in
                  search results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Website URL Field */}
                  <div className="space-y-2">
                    <Label htmlFor="website">Website URL</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="website"
                        type="text"
                        placeholder="e.g., kommunicate.io or https://kommunicate.io"
                        value={brand}
                        onChange={(e) => handleWebsiteChange(e.target.value)}
                        maxLength={100}
                        className="pl-11 pr-11 bg-white"
                        autoComplete="url"
                        disabled={isWebsiteDisabled}
                      />
                      {/* DNS Status Indicator */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {dnsStatus === "checking" && (
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        )}
                        {dnsStatus === "valid" && (
                          <CheckCircle className="w-4 h-4 text-success" />
                        )}
                        {dnsStatus === "invalid" && (
                          <XCircle className="w-4 h-4 text-destructive" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Keywords Field */}
                  <div className="space-y-2">
                    <Label htmlFor="keywords">Keywords (up to 3)</Label>
                    <div className="space-y-3">
                      <div className="flex gap-2 relative">
                        <Tags className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="keywords"
                          type="text"
                          placeholder="Press Enter to add"
                          value={currentKeyword}
                          onChange={(e) => setCurrentKeyword(e.target.value)}
                          onKeyPress={handleKeyPress}
                          maxLength={60}
                          disabled={keywords.length >= 3}
                          className="pl-11 bg-white"
                          autoComplete="off"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={addKeyword}
                          disabled={
                            !currentKeyword.trim() ||
                            keywords.length >= 3 ||
                            keywords.includes(currentKeyword.trim())
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Keywords Display */}
                      {keywords.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {keywords.map((keyword, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="pl-3 pr-1 py-1 text-sm"
                            >
                              {keyword}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 ml-2 hover:bg-red-500 hover:text-white"
                                onClick={() => removeKeyword(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      <p className="text-sm text-gray-500">
                        {keywords.length} of 3 keywords added
                      </p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="hero"
                    className="w-full"
                    disabled={
                      isLoading ||
                      !brand.trim() ||
                      keywords.length === 0 ||
                      dnsStatus !== "valid"
                    }
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing visibility...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Run visibility check
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </Layout>
  );
}
