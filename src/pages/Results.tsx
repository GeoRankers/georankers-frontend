import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { Layout } from "@/components/Layout";
import { BrandHeader } from "@/components/BrandHeader";
import { OverallInsights } from "@/components/OverallInsights";
import { SourceAnalysis } from "@/components/SourceAnalysis";
import { CompetitorAnalysis } from "@/components/CompetitorAnalysis";
import { ContentImpact } from "@/components/ContentImpact";
import { Recommendations } from "@/components/Recommendations";
import { QueryAnalysis } from "@/components/QueryAnalysis";
import { ChatSidebar } from "@/components/ChatSidebar";
import { Search } from "lucide-react";
import { regenerateAnalysis, getProductAnalytics } from "@/apiHelpers";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { MessageSquare, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Printer, Plus } from "lucide-react";

interface InputStateAny {
  product?: { id: string; name?: string; website?: string };
  id?: string;
  productId?: string;
  website?: string;
  search_keywords?: Array<{ id?: string; keyword: string }>;
  keywords?: string[];
  analytics?: any;
  analysisTriggeredAt?: number; // Timestamp when new analysis was triggered
  isNewAnalysisTriggered?: boolean;
}

// Updated interface for the API response structure
interface AnalyticsResponse {
  analytics: AnalyticsData[];
  count: number;
  limit: number;
  product_id: string;
}

// Updated AnalyticsData interface to match the new API structure
interface AnalyticsData {
  id?: string;
  product_id?: string;
  product_name?: string;
  date?: string;
  status?: string;
  analytics?: {
    brand_name?: string;
    brand_website?: string;
    model_name?: string;
    status?: string;
    analysis_scope?: {
      search_keywords?: string[];
      keywords_or_queries?: string[];
      date_range?: {
        from?: string | null;
        to?: string | null;
      };
    };
    ai_visibility?: {
      weighted_mentions_total?: number;
      geo_score?: number;
      percentile_visibility?: number;
      percentile_trace?: {
        sorted_brand_info?: Array<{
          brand: string;
          geo_score: number;
          logo: string;
        }>;
        brands_with_lower_geo_score?: number;
        total_brands?: number;
        calculation?: string;
      };
      breakdown?: {
        top_two_mentions?: number;
        top_five_mentions?: number;
        later_mentions?: number;
        calculation?: string;
      };
      tier_mapping_method?: string;
      brand_tier?: string;
      explanation?: string;
    };
    sentiment?: {
      dominant_sentiment?: string;
      summary?: string;
    };
    competitor_visibility_table?: {
      header?: string[];
      rows?: any[][];
    };
    competitor_sentiment_table?: {
      header?: string[];
      rows?: any[][];
    };
    brand_mentions?: {
      total_mentions?: number;
      queries_with_mentions?: number;
      total_sources_checked?: number;
      alignment_with_visibility?: string;
    };
    sources_and_content_impact?: {
      header?: any[];
      rows?: any[][];
      depth_notes?: any;
    };
    recommendations?: Array<{
      overall_insight?: string;
      suggested_action?: string;
      overall_effort?: string;
      impact?: string;
    }>;
    executive_summary?: {
      brand_score_and_tier?: string;
      strengths?: string[];
      weaknesses?: string[];
      competitor_positioning?: {
        leaders?: Array<{ name: string; summary: string }>;
        mid_tier?: Array<{ name: string; summary: string }>;
        laggards?: Array<{ name: string; summary: string }>;
      };
      prioritized_actions?: string[];
      conclusion?: string;
    };
  };
  created_at?: string;
  updated_at?: string;
}

interface ResultsData {
  website: string;
  product: { id: string; name?: string };
  search_keywords: Array<{ id?: string; keyword: string }>;
}

export default function Results() {
  const [resultsData, setResultsData] = useState<ResultsData | null>(null);
  const [analyticsResponse, setAnalyticsResponse] =
    useState<AnalyticsResponse | null>(null);
  const [currentAnalytics, setCurrentAnalytics] =
    useState<AnalyticsData | null>(null);
  const [previousAnalytics, setPreviousAnalytics] =
    useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { user, products } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ POLLING CONFIGURATION (tweakable)
  const POLL_INITIAL_DELAY_MS = 2 * 60 * 1000; // 5 minutes after first poll
  const POLL_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes between batch polls
  const POLL_MAX_ATTEMPTS = 5; // 5 polls per batch
  const POLL_COOLDOWN_MS = 10 * 60 * 1000; // 10 minute cooldown

  // ✅ CRITICAL: Use refs to avoid dependency hell
  const pollingTimerRef = useRef<number | undefined>();
  const hasShownStartMessageRef = useRef(false);
  const previousAnalyticsRef = useRef<AnalyticsData | null>(null);
  const isPollingRef = useRef(false);
  const mountedRef = useRef(true);
  const currentProductIdRef = useRef<string | null>(null);
  const pollingAttemptsRef = useRef(0);
  const cooldownTimerRef = useRef<number | undefined>();
  const isInCooldownRef = useRef(false);
  const hasReceivedDataRef = useRef(false);
  const accessTokenRef = useRef<string>("");
  const initialPollDoneRef = useRef(false); // Track if first poll done
  const toastRef = useRef(toast); // Stable toast reference
  const analysisTriggeredAtRef = useRef<number | null>(null); // Timestamp when new analysis was triggered
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  // Prevent body and page scroll when mobile chat is open
  useEffect(() => {
    if (isMobileChatOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      // Also prevent scrolling on the main container
      const mainContainer = document.querySelector('.min-h-screen');
      if (mainContainer) {
        (mainContainer as HTMLElement).style.overflow = 'hidden';
      }
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      const mainContainer = document.querySelector('.min-h-screen');
      if (mainContainer) {
        (mainContainer as HTMLElement).style.overflow = '';
      }
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      const mainContainer = document.querySelector('.min-h-screen');
      if (mainContainer) {
        (mainContainer as HTMLElement).style.overflow = '';
      }
    };
  }, [isMobileChatOpen]);

  // Keep toast ref updated
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  // Sync refs (doesn't trigger re-renders)
  useEffect(() => {
    previousAnalyticsRef.current = previousAnalytics;
  }, [previousAnalytics]);

  useEffect(() => {
    accessTokenRef.current = localStorage.getItem("access_token") || "";
  }, []);

  const handleNewAnalysis = () => {
    const currentWebsite =
      products[0]?.website || currentAnalytics?.analytics?.brand_website || "";
    const productId = products[0]?.id || resultsData?.product.id || "";

    navigate("/input", {
      state: {
        prefillWebsite: currentWebsite,
        productId: productId,
        isNewAnalysis: true,
        disableWebsiteEdit: true,
      },
    });
  };

  // ✅ STABLE POLLING FUNCTION - No dependencies, everything via refs
  const pollProductAnalytics = useCallback(
    async (productId: string, isInitialPoll: boolean = false) => {
      const attemptNum = pollingAttemptsRef.current + 1;
      console.log(
        `🔄 [POLL] Starting poll #${attemptNum} for product:`,
        productId,
        isInitialPoll ? "(INITIAL)" : "(BATCH)"
      );

      // ✅ CRITICAL: Early exit checks BEFORE acquiring lock
      if (!mountedRef.current) {
        console.log("⏸️ [POLL] Component unmounted - aborting");
        return;
      }

      if (isInCooldownRef.current) {
        console.log("❄️ [POLL] In cooldown period - skipping poll");
        return;
      }

      if (hasReceivedDataRef.current) {
        console.log(
          "✅ [POLL] Already received completed/failed data - stopping all polling"
        );
        return;
      }

      if (isPollingRef.current) {
        console.log("⏸️ [POLL] Already polling - skipping");
        return;
      }

      if (!productId || !accessTokenRef.current) {
        console.log("⏸️ [POLL] Missing productId or accessToken");
        return;
      }

      // ✅ Check retry limit BEFORE incrementing (only for batch polls, not initial)
      if (!isInitialPoll && pollingAttemptsRef.current >= POLL_MAX_ATTEMPTS) {
        console.log(
          `🛑 [POLL] Reached max batch limit (${POLL_MAX_ATTEMPTS}) - entering ${POLL_COOLDOWN_MS / 60000} min cooldown`
        );
        isInCooldownRef.current = true;

        toastRef.current({
          title: "Analysis Taking Longer Than Expected",
          description: `We'll pause checking for ${POLL_COOLDOWN_MS / 60000} minutes. The analysis will continue in the background.`,
          duration: 5000,
        });

        // Clear existing timer
        if (pollingTimerRef.current) {
          clearTimeout(pollingTimerRef.current);
          pollingTimerRef.current = undefined;
        }

        // Enter cooldown, then reset and start new batch
        cooldownTimerRef.current = window.setTimeout(() => {
          if (
            mountedRef.current &&
            !hasReceivedDataRef.current &&
            currentProductIdRef.current === productId
          ) {
            console.log(
              "🔄 [POLL] Cooldown complete - resetting counter and starting new batch"
            );
            pollingAttemptsRef.current = 0;
            isInCooldownRef.current = false;
            pollProductAnalytics(productId, false);
          }
        }, POLL_COOLDOWN_MS);

        return;
      }

      // ✅ Acquire lock AFTER all checks
      isPollingRef.current = true;
      if (!isInitialPoll) {
        pollingAttemptsRef.current += 1;
      }
      console.log(
        `✅ [POLL] Lock acquired, attempt ${pollingAttemptsRef.current}/${POLL_MAX_ATTEMPTS}`
      );

      try {
        const res = await getProductAnalytics(
          productId,
          accessTokenRef.current
        );
        console.log("📊 [POLL] Analytics response received:", res);

        // ✅ Check mounted state after async operation
        if (!mountedRef.current) {
          console.log("⏸️ [POLL] Component unmounted during fetch - aborting");
          return;
        }

        // ✅ Double-check we haven't received data yet
        if (hasReceivedDataRef.current) {
          console.log("✅ [POLL] Data received while fetching - aborting");
          return;
        }

        if (res && res.analytics && Array.isArray(res.analytics)) {
          setAnalyticsResponse(res);

          const mostRecentAnalysis = res.analytics[0];

          if (mostRecentAnalysis) {
            const currentStatus =
              mostRecentAnalysis.status?.toLowerCase() || "";
            const currentDate =
              mostRecentAnalysis.date ||
              mostRecentAnalysis.updated_at ||
              mostRecentAnalysis.created_at;

            // Save to localStorage (outside state updates to avoid re-renders)
            if (res.product_id) {
              localStorage.setItem("product_id", res.product_id);
            }
            if (mostRecentAnalysis.analytics?.analysis_scope?.search_keywords) {
              const keywords =
                mostRecentAnalysis.analytics.analysis_scope.search_keywords;
              localStorage.setItem(
                "keywords",
                JSON.stringify(keywords.map((k) => ({ keyword: k })))
              );
              localStorage.setItem("keyword_count", keywords.length.toString());
            }

            const prevAnalytics = previousAnalyticsRef.current;
            const isPreviousCompleted =
              prevAnalytics?.status?.toLowerCase() === "completed";

            // ✅ Check if this analysis is newer than when we triggered a new analysis
            const analysisTimestamp = currentDate ? new Date(currentDate).getTime() : 0;
            const isNewAnalysis = !analysisTriggeredAtRef.current || analysisTimestamp > analysisTriggeredAtRef.current;

            console.log(`📅 [POLL] Analysis date: ${currentDate}, Trigger time: ${analysisTriggeredAtRef.current ? new Date(analysisTriggeredAtRef.current).toISOString() : 'none'}, isNew: ${isNewAnalysis}`);

            // ✅ COMPLETED or FAILED = STOP ONLY IF it's a NEW analysis (not old data)
            if ((currentStatus === "completed" || currentStatus === "failed") && isNewAnalysis) {
              hasReceivedDataRef.current = true;
              pollingAttemptsRef.current = 0;
              initialPollDoneRef.current = true;
              analysisTriggeredAtRef.current = null; // Clear trigger timestamp

              // Clear all timers immediately
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
              setError(null);

              const previousDate =
                prevAnalytics?.date ||
                prevAnalytics?.updated_at ||
                prevAnalytics?.created_at;

              // Show toast only for newly completed analysis
              if (currentStatus === "completed" && previousDate && currentDate && currentDate > previousDate) {
                toastRef.current({
                  title: "Analysis Completed",
                  description:
                    "Your analysis is now complete and available on this page.",
                  duration: 10000,
                });
                console.log(
                  "🎉 [POLL] Showing completion notification for new completed analysis"
                );
              }

              if (currentStatus === "completed") {
                setPreviousAnalytics(mostRecentAnalysis);
                localStorage.setItem("last_analysis_data", JSON.stringify(res));
                if (currentDate) {
                  localStorage.setItem("last_analysis_date", currentDate);
                }
              }

              console.log(
                `✅ [POLL] Analysis ${currentStatus.toUpperCase()} - ALL polling stopped permanently`
              );
              return;
            }

            // ✅ OLD completed data found but waiting for NEW analysis - continue polling
            if ((currentStatus === "completed" || currentStatus === "failed") && !isNewAnalysis) {
              console.log(`⏳ [POLL] Found OLD ${currentStatus} analysis - waiting for NEW analysis, continuing poll`);
              setCurrentAnalytics(mostRecentAnalysis);
              setIsLoading(true); // Show loading since we're waiting for new data

              if (!hasShownStartMessageRef.current && mountedRef.current) {
                toastRef.current({
                  title: "Analysis in Progress",
                  description:
                    "Your new analysis has begun. Please stay on this page, you'll receive a notification when it's ready.",
                  duration: 10000,
                });
                hasShownStartMessageRef.current = true;
              }

              scheduleNextPoll(productId, isInitialPoll);
              return;
            }

            // ✅ IN_PROGRESS or ERROR - continue polling
            if (currentStatus === "error" || currentStatus === "in_progress") {
              setCurrentAnalytics(mostRecentAnalysis);

              // Show previous completed results while new analysis runs
              if (isPreviousCompleted) {
                setIsLoading(false);
              } else {
                setIsLoading(true);
              }

              if (!hasShownStartMessageRef.current && mountedRef.current) {
                toastRef.current({
                  title: "Analysis in Progress",
                  description:
                    "Your analysis has begun. Please stay on this page, you'll receive a notification here when it's ready.",
                  duration: 10000,
                });
                hasShownStartMessageRef.current = true;
              }

              setError(null);

              // Schedule next poll based on whether this is initial or batch
              scheduleNextPoll(productId, isInitialPoll);
              return;
            }

            // ✅ Unknown status - continue polling
            setCurrentAnalytics(mostRecentAnalysis);
            if (isPreviousCompleted) {
              setIsLoading(false);
            } else {
              setIsLoading(true);
            }

            console.log(`⚠️ [POLL] Unknown status "${currentStatus}" - continuing polling`);
            scheduleNextPoll(productId, isInitialPoll);
          } else {
            // No analysis found - keep polling
            console.log("⚠️ [POLL] No analysis found - scheduling next poll");
            setIsLoading(true);
            scheduleNextPoll(productId, isInitialPoll);
          }
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        console.error(
          `❌ [POLL] Failed to fetch analytics (attempt ${pollingAttemptsRef.current}/${POLL_MAX_ATTEMPTS}):`,
          err
        );

        // Don't retry if we already have completed data
        if (hasReceivedDataRef.current) {
          console.log(
            "✅ [POLL] Already have completed data - not retrying after error"
          );
          return;
        }

        // Schedule retry
        scheduleNextPoll(productId, isInitialPoll);
      } finally {
        isPollingRef.current = false;
        console.log("🔓 [POLL] Lock released");
      }
    },
    [] // ✅ EMPTY ARRAY - Everything accessed through refs
  );

  // ✅ Helper to schedule next poll with correct timing
  const scheduleNextPoll = useCallback((productId: string, wasInitialPoll: boolean) => {
    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current);
    }

    if (hasReceivedDataRef.current) {
      console.log("✅ [SCHEDULE] Data already received - no more polls");
      return;
    }

    // After initial poll, wait 5 minutes before starting batch
    if (wasInitialPoll && !initialPollDoneRef.current) {
      initialPollDoneRef.current = true;
      console.log(`⏱️ [SCHEDULE] Initial poll done - waiting ${POLL_INITIAL_DELAY_MS / 60000} minutes before batch`);
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
      // Batch poll - use 2 minute interval
      console.log(`⏱️ [SCHEDULE] Scheduling batch poll in ${POLL_INTERVAL_MS / 60000} minutes...`);
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
  }, [pollProductAnalytics]);

  // Parse and normalize location.state
  useEffect(() => {
    mountedRef.current = true;
    const state = (location.state || {}) as InputStateAny;

    if (state && state.product?.id) {
      const normalized: ResultsData = {
        website:
          (state.website || state.product.website || state.product.name || "") +
          "",
        product: {
          id: state.product.id,
          name: state.product.name || state.product.website || state.product.id,
        },
        search_keywords: (state.search_keywords || []).map((k) => ({
          id: k.id,
          keyword: k.keyword,
        })),
      };
      setResultsData(normalized);
    } else if ((state as any).productId || (state as any).id) {
      const pid = (state as any).productId || (state as any).id;
      const normalized: ResultsData = {
        website: state.website || "",
        product: { id: pid.toString(), name: state.website || pid.toString() },
        search_keywords: Array.isArray(state.search_keywords)
          ? state.search_keywords.map((k) => ({ id: k.id, keyword: k.keyword }))
          : (state.keywords || []).map((k: string) => ({ keyword: k })),
      };
      setResultsData(normalized);

      // ✅ Store analysisTriggeredAt if coming from InputPage with new analysis
      if ((state as any).analysisTriggeredAt) {
        analysisTriggeredAtRef.current = (state as any).analysisTriggeredAt;
        console.log("📅 [STATE] New analysis triggered at:", new Date(analysisTriggeredAtRef.current!).toISOString());
      }
    } else {
      navigate("/input");
    }

    return () => {
      mountedRef.current = false;
    };
  }, [location.state, navigate]);

  // ✅ Load previous completed analysis from localStorage ONCE on mount
  useEffect(() => {
    const lastAnalysisData = localStorage.getItem("last_analysis_data");
    if (lastAnalysisData) {
      try {
        const parsed = JSON.parse(lastAnalysisData);
        if (parsed.analytics && parsed.analytics.length > 0) {
          const lastCompleted = parsed.analytics.find(
            (a: AnalyticsData) => a.status?.toLowerCase() === "completed"
          );
          if (lastCompleted) {
            setPreviousAnalytics(lastCompleted);
          }
        }
      } catch (e) {
        console.error("Failed to parse last analysis data:", e);
      }
    }
  }, []); // ✅ Empty dependency array - runs ONCE

  // ✅ CRITICAL: Start polling only when productId changes (NOT on every render)
  useEffect(() => {
    const productId = resultsData?.product?.id;

    if (!productId) {
      console.log("⏸️ [EFFECT] No productId - skipping polling");
      return;
    }

    // Only start new polling if productId actually changed
    if (currentProductIdRef.current === productId) {
      console.log("⏸️ [EFFECT] ProductId unchanged - skipping polling restart");
      return;
    }

    console.log("🆕 [EFFECT] New productId detected:", productId);

    // Update current product ID
    currentProductIdRef.current = productId;

    // ✅ RESET all polling state for new product
    hasShownStartMessageRef.current = false;
    isPollingRef.current = false;
    pollingAttemptsRef.current = 0;
    isInCooldownRef.current = false;
    hasReceivedDataRef.current = false;
    initialPollDoneRef.current = false; // Reset initial poll flag

    // Clear any existing timers
    if (pollingTimerRef.current) {
      console.log("🧹 [EFFECT] Clearing existing polling timer");
      clearTimeout(pollingTimerRef.current);
      pollingTimerRef.current = undefined;
    }
    if (cooldownTimerRef.current) {
      console.log("🧹 [EFFECT] Clearing existing cooldown timer");
      clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = undefined;
    }

    // Start polling with initial poll flag
    console.log("▶️ [EFFECT] Starting INITIAL poll for product:", productId);
    pollProductAnalytics(productId, true);

    // Cleanup on unmount or productId change
    return () => {
      console.log("🧹 [EFFECT] Cleanup - Stopping all polling and timers");
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
  }, [resultsData?.product?.id, pollProductAnalytics]); // ✅ Now safe - pollProductAnalytics is stable

  // ✅ Cleanup timers on unmount
  useEffect(() => {
    mountedRef.current = true;
    console.log("🎬 [MOUNT] Component mounted");

    return () => {
      console.log("🛑 [UNMOUNT] Component unmounting - cleaning up");
      mountedRef.current = false;
      currentProductIdRef.current = null;
      analysisTriggeredAtRef.current = null;
      if (pollingTimerRef.current) {
        clearTimeout(pollingTimerRef.current);
      }
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
      isPollingRef.current = false;
      pollingAttemptsRef.current = 0;
      isInCooldownRef.current = false;
      hasReceivedDataRef.current = false;
      initialPollDoneRef.current = false;
    };
  }, []);

  // Show loader only when no displayable data exists
  const shouldShowLoader = isLoading && !previousAnalytics && !currentAnalytics;

  // Determine which analytics to display
  const displayAnalytics = (() => {
    // If currentAnalytics is completed, show it
    if (currentAnalytics) {
      const currentStatus = currentAnalytics.status?.toLowerCase() || "";

      // Show completed analysis directly
      if (currentStatus === "completed") {
        return currentAnalytics;
      }

      // For in_progress/error/failed, show previous completed if available
      if (
        (currentStatus === "error" || currentStatus === "in_progress" || currentStatus === "failed") &&
        previousAnalytics &&
        previousAnalytics.status?.toLowerCase() === "completed"
      ) {
        return previousAnalytics;
      }

      // Otherwise show current even if not ideal
      return currentAnalytics;
    }

    // Fallback to previous if no current
    if (previousAnalytics) {
      return previousAnalytics;
    }

    return null;
  })();

  // Chat bubble component that uses sidebar toggle on desktop, full-screen on mobile
  const ChatBubbleButton = () => {
    const { toggleSidebar } = useSidebar();

    const handleChatClick = () => {
      // Check if mobile (window width < 768px)
      if (window.innerWidth < 768) {
        setIsMobileChatOpen(true);
      } else {
        toggleSidebar();
      }
    };

    const handleCloseMobileChat = () => {
      setIsMobileChatOpen(false);
    };

    return (
      <>
        {/* Chat Trigger - Bottom Right (Mobile & Desktop) */}
        <div
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 lg:bottom-8 lg:right-8 no-print z-50 group"
          onClick={handleChatClick}
        >
          <div className="relative">
            {/* Desktop: Animated glow effect */}
            <div className="hidden md:block absolute -inset-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-300 animate-pulse"></div>
            <div className="relative">
              <div className="relative bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl md:rounded-3xl shadow-xl md:shadow-2xl hover:shadow-2xl md:hover:shadow-3xl transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                <div className="relative px-3 py-2 sm:px-4 sm:py-3 md:px-5 md:py-4 lg:px-6 lg:py-4 flex items-center gap-2 sm:gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L2 22l5.71-.97C9 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.38 0-2.68-.29-3.86-.79l-.29-.15-2.99.51.51-2.99-.15-.29C4.79 14.68 4.5 13.38 4.5 12 4.5 7.86 7.86 4.5 12 4.5S19.5 7.86 19.5 12 16.14 19.5 12 19.5z" />
                      <circle cx="8" cy="12" r="1.5" />
                      <circle cx="12" cy="12" r="1.5" />
                      <circle cx="16" cy="12" r="1.5" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <div className="text-white font-bold text-sm sm:text-base lg:text-xl tracking-wide drop-shadow-lg whitespace-nowrap">Geo AI</div>
                    <div className="hidden sm:block text-white/90 text-[10px] lg:text-xs font-bold tracking-wide whitespace-nowrap">Your AI SEO Companion</div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </div>

            </div>
          </div>
        </div>

        {/* Mobile Full-Screen Chat Overlay */}
        {isMobileChatOpen && (
          <div className="fixed inset-0 z-50 bg-background md:hidden overflow-hidden">
            <div className="relative w-full h-full flex flex-col overflow-hidden">
              {/* Chat Content - Full height, no extra padding */}
              <div className="flex-1 overflow-hidden h-full">
                <ChatSidebar
                  productId={resultsData.product.id}
                  isMobile={true}
                  onClose={handleCloseMobileChat}
                />
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  if (shouldShowLoader && !displayAnalytics) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20">
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4 animate-spin" />
              <h2 className="text-2xl font-bold mb-2">Analysis Started</h2>
              <p className="text-muted-foreground">
                We are preparing your brand's comprehensive analysis. This
                strategic process ensures precision in every insight.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const data = displayAnalytics?.analytics;

  if (!data) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <p className="text-muted-foreground">No analytics data available</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Extract brand mention data from percentile_trace.sorted_brand_info
  type BrandInfo = { brand: string; geo_score: number; logo: string; mention_count?: number; mention_score?: number };
  const sortedBrandInfo: BrandInfo[] = data.ai_visibility?.percentile_trace?.sorted_brand_info || [];
  const currentBrandInfo = sortedBrandInfo.find(
    (b) => b.brand?.toLowerCase() === data.brand_name?.toLowerCase()
  );
  const topBrandInfo = sortedBrandInfo[sortedBrandInfo.length - 1]; // Last item has highest score

  // Transform data to match component interfaces - all values directly from backend
  const insights = {
    ai_visibility: {
      tier: data.ai_visibility?.brand_tier || "Low",
      percentile_visibility: data.ai_visibility?.percentile_visibility ?? 0,
      geo_score: data.ai_visibility?.geo_score ?? 0,
    },
    brand_mentions: {
      // mention_count from sorted_brand_info is total mentions for the brand
      total_mentions: currentBrandInfo?.mention_count ?? data.brand_mentions?.total_mentions ?? 0,
      // mention_score from sorted_brand_info is the percentile for speedometer
      mention_score: currentBrandInfo?.mention_score ?? 0,
    },
    dominant_sentiment: {
      sentiment: data.sentiment?.dominant_sentiment || "",
      statement: data.sentiment?.summary || "",
    },
  };

  // Get top brand mention data for comparison display
  const topBrandMentionCount = topBrandInfo?.mention_count || 0;
  const topBrandName = topBrandInfo?.brand || "";

  const handlePrint = () => {
    window.print();
  };

  return (
    <SidebarProvider
      defaultOpen={true}
      style={
        {
          "--sidebar-width": "24rem",
        } as React.CSSProperties
      }
    >
      <Sidebar side="left" collapsible="offcanvas" className="no-print hidden md:flex">
        <SidebarContent>
          <ChatSidebar productId={resultsData.product.id} />
        </SidebarContent>
      </Sidebar>

      <SidebarInset className={`w-full max-w-full overflow-x-hidden ${isMobileChatOpen ? 'overflow-y-hidden h-screen' : ''}`}>
        <Layout
          sidebarTrigger={<SidebarTrigger className="h-8 w-8 no-print hidden md:flex" />}
        >
          <div className={`min-h-screen bg-background overflow-x-hidden w-full max-w-full ${isMobileChatOpen ? 'overflow-y-hidden h-screen' : ''}`}>
            <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 space-y-4 sm:space-y-6 md:space-y-8 max-w-full">
              {/* GeoRankers Print Header - Shows only in print, once at top */}
              <div className="hidden print:block print-only-header">
                <h1 className="text-5xl font-bold font-bold gradient-text">
                  GeoRankers
                </h1>
                <p className="text-xl text-gray-600 mt-1">
                  AI Visibility Analysis Report
                </p>
              </div>

              {/* Brand Header Section */}
              <div style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
                <BrandHeader
                  brandName={data.brand_name || ""}
                  brandWebsite={data.brand_website || ""}
                  brandLogo={data.ai_visibility?.percentile_trace?.sorted_brand_info?.find(
                    b => b.brand === data.brand_name
                  )?.logo}
                  keywordsAnalyzed={data.analysis_scope?.search_keywords || []}
                  status={data.status || ""}
                  date={
                    displayAnalytics?.updated_at ||
                    displayAnalytics?.created_at ||
                    ""
                  }
                  modelName={data.model_name || ""}
                />
              </div>

              {/* New Analysis Button - Hidden in print */}
              <div className="flex justify-center no-print">
                <Button
                  onClick={handleNewAnalysis}
                  variant="default"
                  size="lg"
                  className="gap-2 w-full sm:w-auto text-sm sm:text-base lg:text-lg px-4 py-2 sm:px-6 sm:py-2.5 lg:px-12 shadow-elevated hover:shadow-glow"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" /> New Analysis{" "}
                </Button>
              </div>

              {/* Overall Insights Section */}
              <div style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
                <OverallInsights
                  insights={insights}
                  executiveSummary={
                    data.executive_summary
                      ? {
                        brand_score_and_tier:
                          data.executive_summary.brand_score_and_tier || "",
                        strengths: data.executive_summary.strengths || [],
                        weaknesses: data.executive_summary.weaknesses || [],
                        competitor_positioning: {
                          leaders:
                            data.executive_summary.competitor_positioning
                              ?.leaders || [],
                          mid_tier:
                            data.executive_summary.competitor_positioning
                              ?.mid_tier || [],
                          laggards:
                            data.executive_summary.competitor_positioning
                              ?.laggards || [],
                        },
                        prioritized_actions:
                          data.executive_summary.prioritized_actions || [],
                        conclusion: data.executive_summary.conclusion || "",
                      }
                      : undefined
                  }
                  yourBrandTotal={currentBrandInfo?.mention_count || 0}
                  topBrand={topBrandName}
                  topBrandTotal={topBrandMentionCount}
                  competitorCount={sortedBrandInfo.length}
                />
              </div>

              {/* Source Analysis Section */}
              {data.sources_and_content_impact &&
                data.sources_and_content_impact.header &&
                data.sources_and_content_impact.rows && (
                  <div
                    style={{ pageBreakInside: "avoid", breakInside: "avoid" }}
                  >
                    <SourceAnalysis
                      contentImpact={{
                        header: data.sources_and_content_impact.header,
                        rows: data.sources_and_content_impact.rows,
                        depth_notes:
                          data.sources_and_content_impact.depth_notes,
                      }}
                      brandName={data.brand_name || ""}
                    />
                  </div>
                )}

              {/* Competitor Analysis Section */}
              {(data.competitor_visibility_table?.header &&
                data.competitor_visibility_table?.rows) ||
                (data.competitor_sentiment_table?.header &&
                  data.competitor_sentiment_table?.rows) ? (
                <div style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
                  <CompetitorAnalysis
                    brandName={data.brand_name || ""}
                    brandLogos={data.ai_visibility?.percentile_trace?.sorted_brand_info?.map(b => ({
                      brand: b.brand,
                      logo: b.logo
                    }))}
                    analysis={{
                      competitor_visibility_table:
                        data.competitor_visibility_table?.header &&
                          data.competitor_visibility_table?.rows
                          ? {
                            header: data.competitor_visibility_table.header,
                            rows: data.competitor_visibility_table.rows,
                          }
                          : undefined,
                      competitor_sentiment_table:
                        data.competitor_sentiment_table?.header &&
                          data.competitor_sentiment_table?.rows
                          ? {
                            header: data.competitor_sentiment_table.header,
                            rows: data.competitor_sentiment_table.rows,
                          }
                          : undefined,
                    }}
                  />
                </div>
              ) : null}

              {/* Content Impact Section */}
              {data.sources_and_content_impact &&
                data.sources_and_content_impact.header &&
                data.sources_and_content_impact.rows &&
                data.sources_and_content_impact.rows.length > 0 && (
                  <div
                    style={{ pageBreakInside: "avoid", breakInside: "avoid" }}
                  >
                    <ContentImpact
                      brandName={data.brand_name || ""}
                      brandLogos={data.ai_visibility?.percentile_trace?.sorted_brand_info?.map(b => ({
                        brand: b.brand,
                        logo: b.logo
                      }))}
                      contentImpact={{
                        header: data.sources_and_content_impact.header,
                        rows: data.sources_and_content_impact.rows,
                        depth_notes:
                          data.sources_and_content_impact.depth_notes,
                      }}
                    />
                  </div>
                )}

              {/* Recommendations Section */}
              {data.recommendations && data.recommendations.length > 0 && (
                <div style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
                  <Recommendations
                    recommendations={data.recommendations.map((rec) => ({
                      overall_insight: rec.overall_insight || "",
                      suggested_action: rec.suggested_action || "",
                      overall_effort: rec.overall_effort || "",
                      impact: rec.impact || "",
                    }))}
                  />
                </div>
              )}

              {/* Print button - Hidden in print */}
              <div className="flex justify-center pt-4 sm:pt-6 md:pt-8 no-print">
                <Button onClick={handlePrint} size="lg" className="gap-2 w-full sm:w-auto text-sm sm:text-base lg:text-lg px-4 py-2 sm:px-6 sm:py-2.5 lg:px-12">
                  <Printer className="h-4 w-4 sm:h-5 sm:w-5" /> Download Report
                </Button>
              </div>
            </div>
          </div>

          {/* GeoAi Chat Bubble - Bottom Right */}
          <ChatBubbleButton />
        </Layout>
      </SidebarInset>
    </SidebarProvider>
  );
}
