import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { Layout } from "@/results/layout/Layout";
import { getProductAnalytics } from "@/apiHelpers";
import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";

// Import the updated analyticsData functions
import {
  setAnalyticsData,
  getAIVisibilityMetrics,
  getMentionsPosition,
  getSentiment,
  getBrandName,
  getAnalysisDate,
  getModelName,
  hasAnalyticsData,
} from "@/results/data/analyticsData";

// Import your existing overview components
import { LLMVisibilityTable } from "@/results/overview/LLMVisibilityTable";
import { PlatformPresence } from "@/results/overview/PlatformPresence";
import { CompetitorComparisonChart } from "@/results/overview/CompetitorComparisonChart";
import { SourceMentionsChart } from "@/results/overview/SourceMentionsChart";
import { SourceInsights } from "@/results/overview/SourceInsights";
import { BrandMentionsRadar } from "@/results/overview/BrandMentionsRadar";
import { PercentileGauge } from "@/results/ui/PercentileGauge";
import { TierBadge } from "@/results/ui/TierBadge";
import { LLMIcon } from "@/results/ui/LLMIcon";
import {
  Info,
  TrendingUp,
  MessageSquare,
  ThumbsUp,
  Calendar,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AnalyticsData {
  id?: string;
  product_id?: string;
  date?: string;
  status?: string;
  analytics?: any;
  created_at?: string;
  updated_at?: string;
}

interface AnalyticsResponse {
  analytics: AnalyticsData[];
  count: number;
  limit: number;
  product_id: string;
}

const Overview = () => {
  const [productData, setProductData] = useState<any>(null);
  const [currentAnalytics, setCurrentAnalytics] = useState<AnalyticsData | null>(null);
  const [previousAnalytics, setPreviousAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dataReady, setDataReady] = useState<boolean>(false);

  const { products } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Polling configuration
  const POLL_INITIAL_DELAY_MS = 2 * 60 * 1000;
  const POLL_INTERVAL_MS = 2 * 60 * 1000;
  const POLL_MAX_ATTEMPTS = 5;
  const POLL_COOLDOWN_MS = 10 * 60 * 1000;

  // Refs for polling
  const pollingTimerRef = useRef<number>();
  const hasShownStartMessageRef = useRef(false);
  const previousAnalyticsRef = useRef<AnalyticsData | null>(null);
  const isPollingRef = useRef(false);
  const mountedRef = useRef(true);
  const currentProductIdRef = useRef<string | null>(null);
  const pollingAttemptsRef = useRef(0);
  const cooldownTimerRef = useRef<number>();
  const isInCooldownRef = useRef(false);
  const hasReceivedDataRef = useRef(false);
  const accessTokenRef = useRef<string>("");
  const initialPollDoneRef = useRef(false);
  const toastRef = useRef(toast);
  const analysisTriggeredAtRef = useRef<number | null>(null);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  useEffect(() => {
    previousAnalyticsRef.current = previousAnalytics;
  }, [previousAnalytics]);

  useEffect(() => {
    accessTokenRef.current = localStorage.getItem("access_token") || "";
  }, []);

  // ✅ Update analyticsData whenever currentAnalytics changes
  useEffect(() => {
    if (currentAnalytics && currentAnalytics.status?.toLowerCase() === "completed") {
      // Set the data in analyticsData for all helper functions to use
      setAnalyticsData({
        analytics: [currentAnalytics],
        count: 1,
        limit: 1,
        product_id: productData?.id || "",
      });
      setDataReady(true);
    } else if (previousAnalytics && previousAnalytics.status?.toLowerCase() === "completed") {
      // Use previous completed data while waiting for new analysis
      setAnalyticsData({
        analytics: [previousAnalytics],
        count: 1,
        limit: 1,
        product_id: productData?.id || "",
      });
      setDataReady(true);
    }
  }, [currentAnalytics, previousAnalytics, productData]);

  const scheduleNextPoll = useCallback(
    (productId: string, wasInitialPoll: boolean) => {
      if (pollingTimerRef.current) {
        clearTimeout(pollingTimerRef.current);
      }

      if (hasReceivedDataRef.current) {
        console.log("✅ [SCHEDULE] Data already received - no more polls");
        return;
      }

      if (wasInitialPoll && !initialPollDoneRef.current) {
        initialPollDoneRef.current = true;
        console.log(
          `⏱️ [SCHEDULE] Initial poll done - waiting ${POLL_INITIAL_DELAY_MS / 60000} minutes`
        );
        pollingTimerRef.current = window.setTimeout(() => {
          if (
            mountedRef.current &&
            currentProductIdRef.current === productId &&
            !hasReceivedDataRef.current
          ) {
            isPollingRef.current = false;
            pollingAttemptsRef.current = 0;
            pollProductAnalytics(productId, false);
          }
        }, POLL_INITIAL_DELAY_MS);
      } else {
        console.log(
          `⏱️ [SCHEDULE] Scheduling batch poll in ${POLL_INTERVAL_MS / 60000} minutes...`
        );
        pollingTimerRef.current = window.setTimeout(() => {
          if (
            mountedRef.current &&
            currentProductIdRef.current === productId &&
            !hasReceivedDataRef.current
          ) {
            isPollingRef.current = false;
            pollProductAnalytics(productId, false);
          }
        }, POLL_INTERVAL_MS);
      }
    },
    []
  );

  const pollProductAnalytics = useCallback(
    async (productId: string, isInitialPoll: boolean = false) => {
      const attemptNum = pollingAttemptsRef.current + 1;
      console.log(
        `🔄 [POLL] Poll #${attemptNum} for ${productId}`,
        isInitialPoll ? "(INITIAL)" : "(BATCH)"
      );

      if (
        !mountedRef.current ||
        isInCooldownRef.current ||
        hasReceivedDataRef.current ||
        isPollingRef.current ||
        !productId ||
        !accessTokenRef.current
      ) {
        return;
      }

      if (!isInitialPoll && pollingAttemptsRef.current >= POLL_MAX_ATTEMPTS) {
        console.log(`🛑 [POLL] Reached max batch limit - entering cooldown`);
        isInCooldownRef.current = true;

        toastRef.current({
          title: "Analysis Taking Longer Than Expected",
          description: `We'll pause checking for ${POLL_COOLDOWN_MS / 60000} minutes.`,
          duration: 5000,
        });

        if (pollingTimerRef.current) {
          clearTimeout(pollingTimerRef.current);
          pollingTimerRef.current = undefined;
        }

        cooldownTimerRef.current = window.setTimeout(() => {
          if (
            mountedRef.current &&
            !hasReceivedDataRef.current &&
            currentProductIdRef.current === productId
          ) {
            pollingAttemptsRef.current = 0;
            isInCooldownRef.current = false;
            pollProductAnalytics(productId, false);
          }
        }, POLL_COOLDOWN_MS);

        return;
      }

      isPollingRef.current = true;
      if (!isInitialPoll) {
        pollingAttemptsRef.current += 1;
      }

      try {
        const res = await getProductAnalytics(productId, accessTokenRef.current);

        if (!mountedRef.current || hasReceivedDataRef.current) {
          return;
        }

        if (res && res.analytics && Array.isArray(res.analytics)) {
          const mostRecentAnalysis = res.analytics[0];

          if (mostRecentAnalysis) {
            const currentStatus = mostRecentAnalysis.status?.toLowerCase() || "";
            const currentDate =
              mostRecentAnalysis.date ||
              mostRecentAnalysis.updated_at ||
              mostRecentAnalysis.created_at;

            // Save to localStorage
            if (res.product_id) {
              localStorage.setItem("product_id", res.product_id);
            }
            if (mostRecentAnalysis.analytics?.analysis_scope?.search_keywords) {
              const keywords =
                mostRecentAnalysis.analytics.analysis_scope.search_keywords;
              localStorage.setItem(
                "keywords",
                JSON.stringify(keywords.map((k: string) => ({ keyword: k })))
              );
            }

            const prevAnalytics = previousAnalyticsRef.current;
            const analysisTimestamp = currentDate
              ? new Date(currentDate).getTime()
              : 0;
            const isNewAnalysis =
              !analysisTriggeredAtRef.current ||
              analysisTimestamp > analysisTriggeredAtRef.current;

            // COMPLETED or FAILED = STOP if new analysis
            if (
              (currentStatus === "completed" || currentStatus === "failed") &&
              isNewAnalysis
            ) {
              hasReceivedDataRef.current = true;
              pollingAttemptsRef.current = 0;
              initialPollDoneRef.current = true;
              analysisTriggeredAtRef.current = null;

              if (pollingTimerRef.current) {
                clearTimeout(pollingTimerRef.current);
                pollingTimerRef.current = undefined;
              }
              if (cooldownTimerRef.current) {
                clearTimeout(cooldownTimerRef.current);
                cooldownTimerRef.current = undefined;
              }

              setCurrentAnalytics(mostRecentAnalysis);
              setIsLoading(false);

              const previousDate =
                prevAnalytics?.date ||
                prevAnalytics?.updated_at ||
                prevAnalytics?.created_at;

              if (
                currentStatus === "completed" &&
                previousDate &&
                currentDate &&
                currentDate > previousDate
              ) {
                toastRef.current({
                  title: "Analysis Completed",
                  description: "Your analysis is now complete.",
                  duration: 10000,
                });
              }

              if (currentStatus === "completed") {
                setPreviousAnalytics(mostRecentAnalysis);
                localStorage.setItem("last_analysis_data", JSON.stringify(res));
                if (currentDate) {
                  localStorage.setItem("last_analysis_date", currentDate);
                }
              }

              return;
            }

            // OLD completed data - continue polling
            if (
              (currentStatus === "completed" || currentStatus === "failed") &&
              !isNewAnalysis
            ) {
              setCurrentAnalytics(mostRecentAnalysis);
              setIsLoading(true);

              if (!hasShownStartMessageRef.current && mountedRef.current) {
                toastRef.current({
                  title: "Analysis in Progress",
                  description: "Your new analysis has begun.",
                  duration: 10000,
                });
                hasShownStartMessageRef.current = true;
              }

              scheduleNextPoll(productId, isInitialPoll);
              return;
            }

            // IN_PROGRESS or ERROR - continue polling
            if (currentStatus === "error" || currentStatus === "in_progress") {
              setCurrentAnalytics(mostRecentAnalysis);

              const isPreviousCompleted =
                prevAnalytics?.status?.toLowerCase() === "completed";
              if (isPreviousCompleted) {
                setIsLoading(false);
              } else {
                setIsLoading(true);
              }

              if (!hasShownStartMessageRef.current && mountedRef.current) {
                toastRef.current({
                  title: "Analysis in Progress",
                  description: "Your analysis has begun.",
                  duration: 10000,
                });
                hasShownStartMessageRef.current = true;
              }

              scheduleNextPoll(productId, isInitialPoll);
              return;
            }

            // Unknown status
            setCurrentAnalytics(mostRecentAnalysis);
            const isPreviousCompleted =
              prevAnalytics?.status?.toLowerCase() === "completed";
            setIsLoading(isPreviousCompleted ? false : true);
            scheduleNextPoll(productId, isInitialPoll);
          } else {
            setIsLoading(true);
            scheduleNextPoll(productId, isInitialPoll);
          }
        }
      } catch (err) {
        console.error(`❌ [POLL] Failed:`, err);
        if (!hasReceivedDataRef.current) {
          scheduleNextPoll(productId, isInitialPoll);
        }
      } finally {
        isPollingRef.current = false;
      }
    },
    [scheduleNextPoll]
  );

  // Parse location.state
  useEffect(() => {
    mountedRef.current = true;
    const state = location.state as any;

    if (state?.product?.id) {
      setProductData({
        id: state.product.id,
        name: state.product.name || state.product.website || state.product.id,
        website: state.website || state.product.website || "",
      });

      if (state.analysisTriggeredAt) {
        analysisTriggeredAtRef.current = state.analysisTriggeredAt;
      }
    } else if (state?.productId || state?.id) {
      const pid = state.productId || state.id;
      setProductData({
        id: pid.toString(),
        name: state.website || pid.toString(),
        website: state.website || "",
      });

      if (state.analysisTriggeredAt) {
        analysisTriggeredAtRef.current = state.analysisTriggeredAt;
      }
    } else if (products && products.length > 0) {
      setProductData({
        id: products[0].id,
        name: products[0].name || products[0].website,
        website: products[0].website || "",
      });
    } else {
      navigate("/input");
    }

    return () => {
      mountedRef.current = false;
    };
  }, [location.state, navigate, products]);

  // Load previous from localStorage
  useEffect(() => {
    const lastAnalysisData = localStorage.getItem("last_analysis_data");
    if (lastAnalysisData) {
      try {
        const parsed = JSON.parse(lastAnalysisData);
        if (parsed.analytics?.length > 0) {
          const lastCompleted = parsed.analytics.find(
            (a: AnalyticsData) => a.status?.toLowerCase() === "completed"
          );
          if (lastCompleted) {
            setPreviousAnalytics(lastCompleted);
          }
        }
      } catch (e) {
        console.error("Failed to parse last analysis:", e);
      }
    }
  }, []);

  // Start polling when productId changes
  useEffect(() => {
    const productId = productData?.id;

    if (!productId) return;

    if (currentProductIdRef.current === productId) return;

    currentProductIdRef.current = productId;

    hasShownStartMessageRef.current = false;
    isPollingRef.current = false;
    pollingAttemptsRef.current = 0;
    isInCooldownRef.current = false;
    hasReceivedDataRef.current = false;
    initialPollDoneRef.current = false;

    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current);
      pollingTimerRef.current = undefined;
    }
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = undefined;
    }

    pollProductAnalytics(productId, true);

    return () => {
      if (pollingTimerRef.current) {
        clearTimeout(pollingTimerRef.current);
        pollingTimerRef.current = undefined;
      }
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
        cooldownTimerRef.current = undefined;
      }
      isPollingRef.current = false;
      pollingAttemptsRef.current = 0;
      isInCooldownRef.current = false;
      initialPollDoneRef.current = false;
    };
  }, [productData?.id, pollProductAnalytics]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      currentProductIdRef.current = null;
      analysisTriggeredAtRef.current = null;
      if (pollingTimerRef.current) clearTimeout(pollingTimerRef.current);
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
      isPollingRef.current = false;
      pollingAttemptsRef.current = 0;
      isInCooldownRef.current = false;
      hasReceivedDataRef.current = false;
      initialPollDoneRef.current = false;
    };
  }, []);

  // Show loader
  const shouldShowLoader = isLoading && !previousAnalytics && !currentAnalytics;

  if (shouldShowLoader || !dataReady || !hasAnalyticsData()) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20">
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4 animate-spin" />
              <h2 className="text-2xl font-bold mb-2">Analysis Started</h2>
              <p className="text-muted-foreground">
                We are preparing your brand's comprehensive analysis.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ✅ Now all helper functions from analyticsData.ts will work correctly
  const visibilityData = getAIVisibilityMetrics();
  const mentionsData = getMentionsPosition();
  const sentiment = getSentiment();
  const brandName = getBrandName();
  const analysisDate = getAnalysisDate();
  const modelName = getModelName();
  const models = modelName?.split(",").map((m) => m.trim()) || [];

  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              Overall Insights
            </h1>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Comprehensive overview of your brand's AI performance.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {analysisDate && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{analysisDate}</span>
              </div>
            )}
            {models.length > 0 && (
              <div className="flex items-center gap-2">
                {models.map((model) => (
                  <div key={model} className="flex items-center gap-1">
                    <LLMIcon platform={model} size="sm" />
                    <span className="hidden sm:inline capitalize">
                      {model === "openai" ? "ChatGPT" : model}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* AI Visibility */}
          <div className="bg-card rounded-xl border p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                </div>
                <span className="text-sm font-medium">AI Visibility</span>
              </div>
              <TierBadge tier={visibilityData.tier} />
            </div>
            <div className="text-center py-4">
              <div className="text-4xl font-bold text-primary mb-1">#{visibilityData.brandPosition}</div>
              <div className="text-sm text-muted-foreground">GEO Score: {visibilityData.score}</div>
              <div className="text-xs text-muted-foreground mt-2">
                Position {visibilityData.brandPosition} of {visibilityData.totalBrands} brands
              </div>
            </div>
          </div>

          {/* Brand Mentions */}
          <div className="bg-card rounded-xl border p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
                </div>
                <span className="text-sm font-medium">Brand Mentions</span>
              </div>
              <TierBadge tier={mentionsData.tier} />
            </div>
            <div className="text-center py-4">
              <div className="text-4xl font-bold text-amber-500 mb-1">#{mentionsData.position}</div>
              <div className="text-sm text-muted-foreground">{mentionsData.brandMentions} total mentions</div>
              <div className="text-xs text-muted-foreground mt-2">
                Position {mentionsData.position} of {mentionsData.totalBrands} brands
              </div>
            </div>
          </div>

          {/* Sentiment */}
          <div className="bg-card rounded-xl border p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <ThumbsUp className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                </div>
                <span className="text-sm font-medium">Sentiment</span>
              </div>
              <TierBadge tier={sentiment.dominant_sentiment} />
            </div>
            <div className="flex flex-col items-center justify-center py-4">
              <p className="text-sm text-muted-foreground text-center">
                {sentiment.summary}
              </p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <CompetitorComparisonChart />
          <BrandMentionsRadar />
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <LLMVisibilityTable />
          <PlatformPresence />
        </div>

        {/* Sources */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <SourceMentionsChart />
          <SourceInsights />
        </div>
      </div>
    </Layout>
  );
};

export default Overview;