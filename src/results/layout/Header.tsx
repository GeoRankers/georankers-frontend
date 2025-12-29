import { useNavigate, useLocation, Link } from "react-router-dom";
import { Menu, X, User, LogOut, RefreshCw, Plus, Loader2, FileDown, FileText, Globe, Database, Sparkles, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { regenerateAnalysis } from "@/apiHelpers";
import { useToast } from "@/hooks/use-toast";
import { useAnalysisState } from "@/hooks/useAnalysisState";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useResults, TabType } from "@/results/context/ResultsContext";
import { useSidebar } from "@/components/ui/sidebar";
import { PanelLeft } from "lucide-react";
import { createRoot } from "react-dom/client";
import {
  getBrandName,
  getBrandWebsite,
  getBrandInfoWithLogos,
  getAnalytics,
  getExecutiveSummary,
  getRecommendations,
  getSearchKeywordsWithPrompts,
  getLlmData,
  getAIVisibilityMetrics,
  getMentionsPosition,
} from '@/results/data/analyticsData';

const mobileNavItems = [
  { label: "Overview", path: "/results", tab: "overview" as TabType },
  {
    label: "Executive Summary",
    path: "/results/executive-summary",
    tab: "executive-summary" as TabType,
  },
  { label: "Prompts", path: "/results/prompts", tab: "prompts" as TabType },
  {
    label: "Sources",
    path: "/results/sources-all",
    tab: "sources-all" as TabType,
  },
  {
    label: "Competitors",
    path: "/results/competitors-comparisons",
    tab: "competitors-comparisons" as TabType,
  },
  {
    label: "Recommendations",
    path: "/results/recommendations",
    tab: "recommendations" as TabType,
  },
];

// Analysis Animation Component
const AnalyzingAnimation = () => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    { icon: FileText, text: "Gathering", color: "text-blue-500" },
    { icon: Globe, text: "Searching", color: "text-green-500" },
    { icon: Database, text: "Processing", color: "text-purple-500" },
    { icon: Brain, text: "ChatGPT", color: "text-emerald-500" },
    { icon: Sparkles, text: "Gemini", color: "text-amber-500" },
    { icon: Brain, text: "Analyzing", color: "text-pink-500" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = steps[currentStep].icon;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary/10 via-purple-500/10 to-amber-500/10 border border-primary/20">
      <div className="relative w-5 h-5 flex items-center justify-center">
        <div className="absolute inset-0 animate-ping opacity-75">
          <CurrentIcon className={cn("w-5 h-5", steps[currentStep].color)} />
        </div>
        <CurrentIcon className={cn("w-5 h-5 relative z-10", steps[currentStep].color)} />
      </div>
      <div className="flex flex-col">
        <span className={cn("text-xs font-semibold transition-all duration-300", steps[currentStep].color)}>
          {steps[currentStep].text}
        </span>
        <div className="flex gap-0.5 mt-0.5">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "h-0.5 w-3 rounded-full transition-all duration-300",
                idx === currentStep ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Type definitions for print data
interface SourceMention {
  count: number;
  score: number;
  insight: string;
}

interface SourceData {
  mentions: Record<string, SourceMention>;
  pages_used: string[];
}

interface LlmDataItem {
  mentions_count: number;
  prompts: number;
  average_rank: number;
  sources: number;
}

// Printable Content Component - receives data as props to ensure it's available
interface PrintableContentProps {
  brandName: string;
  brandWebsite: string;
  brandInfo: Array<{
    brand: string;
    geo_score: number;
    mention_score: number;
    mention_count: number;
    logo: string;
    geo_tier: string;
    mention_tier: string;
    summary: string;
    outlook: string;
  }>;
  executiveSummary: {
    brand_score_and_tier?: string;
    strengths?: string[];
    weaknesses?: string[];
    prioritized_actions?: string[];
    conclusion?: string;
    competitor_positioning?: {
      leaders?: Array<{ name: string; summary: string }>;
      mid_tier?: Array<{ name: string; summary: string }>;
      laggards?: Array<{ name: string; summary: string }>;
    };
  };
  recommendations: Array<{
    overall_insight: string;
    suggested_action: string;
    overall_effort: string;
    impact: string;
  }>;
  keywords: Array<{ id: string; name: string; prompts: string[] }>;
  llmData: Record<string, LlmDataItem>;
  aiVisibility: {
    score: number;
    tier: string;
    brandPosition: number;
    totalBrands: number;
  };
  mentionsData: {
    position: number;
    tier: string;
    totalBrands: number;
    brandMentions: number;
  };
  sourcesAndContentImpact: Record<string, SourceData>;
}

const PrintableContent = ({
  brandName,
  brandWebsite,
  brandInfo,
  executiveSummary,
  recommendations,
  keywords,
  llmData,
  aiVisibility,
  mentionsData,
  sourcesAndContentImpact,
}: PrintableContentProps) => {
  const tableHeaderStyle = { border: '1px solid #ddd', padding: '12px', textAlign: 'left' as const, backgroundColor: '#f0f0f0', fontWeight: 'bold' as const };
  const tableCellStyle = { border: '1px solid #ddd', padding: '12px' };
  const sectionStyle = { pageBreakInside: 'avoid' as const, marginBottom: '32px' };

  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#333', fontSize: '14px', lineHeight: '1.6' }}>
      {/* Cover Page */}
      <div style={{ textAlign: 'center', paddingTop: '150px', paddingBottom: '150px', pageBreakAfter: 'always' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '16px', color: '#1a1a1a' }}>AI Visibility Analysis Report</h1>
        <h2 style={{ fontSize: '28px', color: '#666', marginBottom: '8px' }}>{brandName}</h2>
        <p style={{ fontSize: '16px', color: '#888', marginBottom: '48px' }}>{brandWebsite}</p>
        <p style={{ fontSize: '14px', color: '#666' }}>Generated on {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      {/* Executive Summary */}
      <div style={{ pageBreakAfter: 'always' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', borderBottom: '2px solid #333', paddingBottom: '8px' }}>Executive Summary</h2>
        
        {executiveSummary?.brand_score_and_tier && (
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#444' }}>Brand Score & Tier</h3>
            <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#2563eb' }}>{executiveSummary.brand_score_and_tier}</p>
          </div>
        )}

        {executiveSummary?.strengths && executiveSummary.strengths.length > 0 && (
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#16a34a' }}>Strengths</h3>
            <ul style={{ listStyleType: 'disc', paddingLeft: '24px', margin: 0 }}>
              {executiveSummary.strengths.map((strength, idx) => (
                <li key={idx} style={{ marginBottom: '6px' }}>{strength}</li>
              ))}
            </ul>
          </div>
        )}

        {executiveSummary?.weaknesses && executiveSummary.weaknesses.length > 0 && (
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#dc2626' }}>Weaknesses</h3>
            <ul style={{ listStyleType: 'disc', paddingLeft: '24px', margin: 0 }}>
              {executiveSummary.weaknesses.map((weakness, idx) => (
                <li key={idx} style={{ marginBottom: '6px' }}>{weakness}</li>
              ))}
            </ul>
          </div>
        )}

        {executiveSummary?.prioritized_actions && executiveSummary.prioritized_actions.length > 0 && (
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#444' }}>Prioritized Actions</h3>
            <ol style={{ paddingLeft: '24px', margin: 0 }}>
              {executiveSummary.prioritized_actions.map((action, idx) => (
                <li key={idx} style={{ marginBottom: '6px' }}>{action}</li>
              ))}
            </ol>
          </div>
        )}

        {executiveSummary?.conclusion && (
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#444' }}>Conclusion</h3>
            <p>{executiveSummary.conclusion}</p>
          </div>
        )}

        {/* Competitor Positioning */}
        {executiveSummary?.competitor_positioning && (
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#444' }}>Competitor Positioning</h3>
            
            {executiveSummary.competitor_positioning.leaders && executiveSummary.competitor_positioning.leaders.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#16a34a', marginBottom: '8px' }}>Leaders</h4>
                {executiveSummary.competitor_positioning.leaders.map((item, idx) => (
                  <div key={idx} style={{ marginBottom: '8px', paddingLeft: '16px' }}>
                    <strong>{item.name}</strong>: {item.summary}
                  </div>
                ))}
              </div>
            )}

            {executiveSummary.competitor_positioning.mid_tier && executiveSummary.competitor_positioning.mid_tier.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#ca8a04', marginBottom: '8px' }}>Mid Tier</h4>
                {executiveSummary.competitor_positioning.mid_tier.map((item, idx) => (
                  <div key={idx} style={{ marginBottom: '8px', paddingLeft: '16px' }}>
                    <strong>{item.name}</strong>: {item.summary}
                  </div>
                ))}
              </div>
            )}

            {executiveSummary.competitor_positioning.laggards && executiveSummary.competitor_positioning.laggards.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#dc2626', marginBottom: '8px' }}>Laggards</h4>
                {executiveSummary.competitor_positioning.laggards.map((item, idx) => (
                  <div key={idx} style={{ marginBottom: '8px', paddingLeft: '16px' }}>
                    <strong>{item.name}</strong>: {item.summary}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Visibility Overview */}
      <div style={{ pageBreakAfter: 'always' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', borderBottom: '2px solid #333', paddingBottom: '8px' }}>AI Visibility Overview</h2>
        
        <div style={{ display: 'flex', gap: '40px', marginBottom: '24px' }}>
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#444' }}>AI Visibility Score</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#2563eb' }}>{aiVisibility?.score || 0}</p>
            <p style={{ fontSize: '14px', color: '#666' }}>Tier: {aiVisibility?.tier || 'N/A'}</p>
            <p style={{ fontSize: '14px', color: '#666' }}>Position: {aiVisibility?.brandPosition || 0} of {aiVisibility?.totalBrands || 0} brands</p>
          </div>

          <div style={sectionStyle}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#444' }}>Mentions</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#8b5cf6' }}>{mentionsData?.brandMentions || 0}</p>
            <p style={{ fontSize: '14px', color: '#666' }}>Tier: {mentionsData?.tier || 'N/A'}</p>
            <p style={{ fontSize: '14px', color: '#666' }}>Position: {mentionsData?.position || 0} of {mentionsData?.totalBrands || 0} brands</p>
          </div>
        </div>
      </div>

      {/* Competitor Comparison */}
      {brandInfo && brandInfo.length > 0 && (
        <div style={{ pageBreakAfter: 'always' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', borderBottom: '2px solid #333', paddingBottom: '8px' }}>Competitor Comparison</h2>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>Brand</th>
                <th style={tableHeaderStyle}>AI Visibility Score</th>
                <th style={tableHeaderStyle}>AI Visibility Tier</th>
                <th style={tableHeaderStyle}>Mention Score</th>
                <th style={tableHeaderStyle}>Mention Count</th>
                <th style={tableHeaderStyle}>Outlook</th>
              </tr>
            </thead>
            <tbody>
              {brandInfo
                .sort((a, b) => b.geo_score - a.geo_score)
                .map((brand, idx) => (
                <tr key={idx} style={{ backgroundColor: brand.brand === brandName ? '#eff6ff' : (idx % 2 === 0 ? '#fff' : '#f9fafb') }}>
                  <td style={{ ...tableCellStyle, fontWeight: brand.brand === brandName ? 'bold' : 'normal' }}>{brand.brand}</td>
                  <td style={tableCellStyle}>{brand.geo_score}</td>
                  <td style={tableCellStyle}>{brand.geo_tier}</td>
                  <td style={tableCellStyle}>{brand.mention_score}</td>
                  <td style={tableCellStyle}>{brand.mention_count}</td>
                  <td style={tableCellStyle}>{brand.outlook}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Brand Summaries */}
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#444' }}>Brand Sentiment Analysis</h3>
          {brandInfo.map((brand, idx) => (
            <div key={idx} style={{ marginBottom: '16px', padding: '12px', backgroundColor: brand.brand === brandName ? '#eff6ff' : '#f9fafb', borderRadius: '4px', pageBreakInside: 'avoid' }}>
              <h4 style={{ fontWeight: '600', marginBottom: '4px' }}>{brand.brand} - {brand.outlook}</h4>
              <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>{brand.summary}</p>
            </div>
          ))}
        </div>
      )}

      {/* Keywords & Prompts - All Expanded */}
      {keywords && keywords.length > 0 && (
        <div style={{ pageBreakAfter: 'always' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', borderBottom: '2px solid #333', paddingBottom: '8px' }}>Search Keywords & Prompts</h2>
          
          {keywords.map((kw, idx) => (
            <div key={idx} style={{ marginBottom: '24px', pageBreakInside: 'avoid' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#2563eb' }}>
                Keyword {idx + 1}: {kw.name}
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...tableHeaderStyle, width: '50px' }}>#</th>
                    <th style={tableHeaderStyle}>Prompt</th>
                  </tr>
                </thead>
                <tbody>
                  {kw.prompts.map((prompt, pIdx) => (
                    <tr key={pIdx}>
                      <td style={tableCellStyle}>{pIdx + 1}</td>
                      <td style={tableCellStyle}>{prompt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* LLM Performance */}
      {llmData && Object.keys(llmData).length > 0 && (
        <div style={{ pageBreakAfter: 'always' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', borderBottom: '2px solid #333', paddingBottom: '8px' }}>LLM-wise Performance</h2>
          
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>LLM</th>
                <th style={tableHeaderStyle}>Mentions</th>
                <th style={tableHeaderStyle}>Total Prompts</th>
                <th style={tableHeaderStyle}>Avg Rank</th>
                <th style={tableHeaderStyle}>Sources</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(llmData).map(([llm, data], idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <td style={{ ...tableCellStyle, textTransform: 'capitalize' }}>{llm}</td>
                  <td style={tableCellStyle}>{data.mentions_count}</td>
                  <td style={tableCellStyle}>{data.prompts}</td>
                  <td style={tableCellStyle}>{data.average_rank > 0 ? data.average_rank.toFixed(2) : 'N/A'}</td>
                  <td style={tableCellStyle}>{data.sources}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sources & Content Impact - All Expanded */}
      {sourcesAndContentImpact && Object.keys(sourcesAndContentImpact).length > 0 && (
        <div style={{ pageBreakAfter: 'always' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', borderBottom: '2px solid #333', paddingBottom: '8px' }}>Sources & Content Impact</h2>
          
          {Object.entries(sourcesAndContentImpact).map(([sourceName, sourceData], idx) => (
            <div key={idx} style={{ marginBottom: '32px', pageBreakInside: 'avoid' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#2563eb' }}>{sourceName}</h3>
              
              {/* Brand Mentions Table */}
              {sourceData?.mentions && typeof sourceData.mentions === 'object' && (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
                  <thead>
                    <tr>
                      <th style={tableHeaderStyle}>Brand</th>
                      <th style={tableHeaderStyle}>Count</th>
                      <th style={tableHeaderStyle}>Score</th>
                      <th style={tableHeaderStyle}>Insight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(sourceData.mentions)
                      .sort(([, a], [, b]) => (b?.count || 0) - (a?.count || 0))
                      .map(([brand, data], bIdx) => (
                        <tr key={bIdx} style={{ backgroundColor: brand === brandName ? '#eff6ff' : (bIdx % 2 === 0 ? '#fff' : '#f9fafb') }}>
                          <td style={{ ...tableCellStyle, fontWeight: brand === brandName ? 'bold' : 'normal' }}>{brand}</td>
                          <td style={tableCellStyle}>{data?.count || 0}</td>
                          <td style={tableCellStyle}>{Math.round((data?.score || 0) * 100)}%</td>
                          <td style={{ ...tableCellStyle, fontSize: '12px' }}>{data?.insight || '-'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}

              {/* Pages Used */}
              {sourceData?.pages_used && Array.isArray(sourceData.pages_used) && sourceData.pages_used.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <h4 style={{ fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>Referenced Sources:</h4>
                  <ul style={{ listStyleType: 'disc', paddingLeft: '24px', margin: 0, fontSize: '12px' }}>
                    {sourceData.pages_used.map((page, pIdx) => (
                      <li key={pIdx} style={{ marginBottom: '4px', wordBreak: 'break-all', color: '#666' }}>{page}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Recommendations - All Expanded */}
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', borderBottom: '2px solid #333', paddingBottom: '8px' }}>Recommendations</h2>
        
        {recommendations && recommendations.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...tableHeaderStyle, width: '50px' }}>#</th>
                <th style={tableHeaderStyle}>Insight</th>
                <th style={tableHeaderStyle}>Suggested Action</th>
                <th style={{ ...tableHeaderStyle, width: '80px' }}>Effort</th>
                <th style={{ ...tableHeaderStyle, width: '80px' }}>Impact</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.map((rec, idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f9fafb', pageBreakInside: 'avoid' }}>
                  <td style={tableCellStyle}>{idx + 1}</td>
                  <td style={{ ...tableCellStyle, fontSize: '12px' }}>{rec.overall_insight}</td>
                  <td style={{ ...tableCellStyle, fontSize: '12px' }}>{rec.suggested_action}</td>
                  <td style={tableCellStyle}>{rec.overall_effort}</td>
                  <td style={tableCellStyle}>{rec.impact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No recommendations available.</p>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #ddd', textAlign: 'center', color: '#888', fontSize: '12px' }}>
        <p>Generated by GeoRankers AI Visibility Analysis Platform</p>
        <p>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      </div>
    </div>
  );
};

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, products } = useAuth();
  const { toast } = useToast();
  const { setActiveTab, isLoading, dataReady, isAnalyzing } = useResults();
  const { toggleSidebar } = useSidebar();
  const { isAnalyzing: analysisLocked, startAnalysis, completeAnalysis } = useAnalysisState();

  // Analysis is in progress if loading and no data ready yet, OR if analyzing via hook
  const isAnalysisInProgress = (isLoading && !dataReady) || isAnalyzing;

  // Clear regenerating state once data is ready
  useEffect(() => {
    if (dataReady && !isLoading && !isAnalyzing) {
      setIsRegenerating(false);
      completeAnalysis();
    }
  }, [dataReady, isLoading, isAnalyzing, completeAnalysis]);

  const actionsDisabled = isAnalysisInProgress || isRegenerating || analysisLocked;

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
    if (actionsDisabled) return;

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
    if (actionsDisabled) return;

    setIsRegenerating(true);
    startAnalysis(productId);

    try {
      const accessToken = localStorage.getItem("access_token") || "";
      await regenerateAnalysis(productId, accessToken);

      toast({
        title: "Analysis in Progress",
        description:
          "Your analysis has begun. Please stay on this page, you'll receive a notification here when it's ready.",
        duration: 10000,
      });

      // NOTE: keep locked until dataReady becomes true (handled by useEffect)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to regenerate analysis. Please try again.",
        variant: "destructive",
      });

      setIsRegenerating(false);
      completeAnalysis();
    }
  };

  const handleMobileNavClick = (tab: TabType) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const handleGenerateReport = useCallback(() => {
    setIsGeneratingReport(true);

    // Gather all data upfront before rendering
    const brandName = getBrandName();
    const brandWebsite = getBrandWebsite();
    const analytics = getAnalytics();
    const brandInfo = getBrandInfoWithLogos();
    const executiveSummary = getExecutiveSummary();
    const recommendations = getRecommendations();
    const keywords = getSearchKeywordsWithPrompts();
    const llmData = getLlmData();
    const aiVisibility = getAIVisibilityMetrics();
    const mentionsData = getMentionsPosition();
    const sourcesAndContentImpact = analytics?.sources_and_content_impact || {};

    // Check if data is available
    if (!brandName || brandInfo.length === 0) {
      toast({
        title: "No Data Available",
        description: "Please wait for the analysis to complete before generating a report.",
        variant: "destructive",
      });
      setIsGeneratingReport(false);
      return;
    }

    toast({
      title: "Generating Report",
      description: "Preparing your comprehensive report...",
      duration: 2000,
    });

    // Create a hidden container for the full report
    let printContainer = document.getElementById("print-report-container") as HTMLDivElement;
    
    if (!printContainer) {
      printContainer = document.createElement("div");
      printContainer.id = "print-report-container";
      printContainer.style.display = "none";
      document.body.appendChild(printContainer);
    }

    // Mount the full report content with all data passed as props
    const root = createRoot(printContainer);
    root.render(
      <PrintableContent 
        brandName={brandName}
        brandWebsite={brandWebsite}
        brandInfo={brandInfo}
        executiveSummary={executiveSummary}
        recommendations={recommendations}
        keywords={keywords}
        llmData={llmData}
        aiVisibility={aiVisibility}
        mentionsData={mentionsData}
        sourcesAndContentImpact={sourcesAndContentImpact}
      />
    );

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
          margin: 15mm;
        }
        
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        /* Hide everything except the print container */
        body > *:not(#print-report-container) {
          display: none !important;
        }
        
        #print-report-container {
          display: block !important;
        }
        
        /* Hide UI elements */
        header, nav, .fixed, button, .sidebar, [data-sidebar] {
          display: none !important;
        }
        
        /* Remove shadows and transitions */
        * {
          box-shadow: none !important;
          transition: none !important;
          animation: none !important;
        }
      }
      
      @media screen {
        #print-report-container {
          display: none !important;
        }
      }
    `;

    // Small delay to ensure component renders, then trigger print
    setTimeout(() => {
      printContainer.style.display = "block";
      window.print();

      // Cleanup after print
      setTimeout(() => {
        printContainer.style.display = "none";
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
              <span className="text-lg md:text-2xl font-bold gradient-text">
                GeoRankers
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-1.5 md:gap-3">
            {/* Analysis in Progress Animation - beside New Analysis button */}
            {(isAnalysisInProgress || isRegenerating || analysisLocked) && (
              <div className="flex items-center">
                <AnalyzingAnimation />
              </div>
            )}
            
            {/* New Analysis Button */}
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "text-[10px] md:text-sm px-2 py-1 md:px-4 md:py-2 gap-1 h-7 md:h-9",
                actionsDisabled
                  ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
              )}
              onClick={handleNewAnalysis}
              disabled={actionsDisabled}
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
                <DropdownMenuContent className="w-56 bg-card border-border" align="end" forceMount>
                  <DropdownMenuItem className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>
                      {user.first_name} {user.last_name}
                    </span>
                  </DropdownMenuItem>
                  {productId && (
                    <>
                      <DropdownMenuItem
                        onClick={handleRegenerateAnalysis}
                        disabled={actionsDisabled}
                        className={cn(
                          "flex items-center space-x-2",
                          actionsDisabled && "opacity-60 cursor-not-allowed"
                        )}
                      >
                        <RefreshCw
                          className={cn("w-4 h-4", isRegenerating && "animate-spin")}
                        />
                        <span>Regenerate Analysis</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleGenerateReport}
                        disabled={isGeneratingReport || isAnalysisInProgress}
                        className={cn(
                          "flex items-center space-x-2",
                          (isGeneratingReport || isAnalysisInProgress) && "opacity-60 cursor-not-allowed"
                        )}
                      >
                        <FileDown
                          className={cn(
                            "w-4 h-4",
                            isGeneratingReport && "animate-pulse"
                          )}
                        />
                        <span>
                          {isGeneratingReport ? "Generating..." : "Generate Report"}
                        </span>
                      </DropdownMenuItem>
                    </>
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
            <span className="font-medium">Content Impact Analysis</span>
            <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded">
              Coming Soon
            </span>
          </div>
        </nav>
      </div>
    </>
  );
};