import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { getProductAnalytics } from "@/apiHelpers";
import { setAnalyticsData, loadAnalyticsFromStorage } from "@/results/data/analyticsData";
import { useToast } from "@/hooks/use-toast";
import { handleUnauthorized, isUnauthorizedError } from "@/lib/authGuard";
import { useAnalysisState } from "@/hooks/useAnalysisState";

interface AnalyticsData {
  id?: string;
  product_id?: string;
  date?: string;
  status?: string;
  analytics?: any;
  created_at?: string;
  updated_at?: string;
}

export type TabType = 
  | "overview" 
  | "executive-summary" 
  | "prompts" 
  | "sources-all" 
  | "competitors-comparisons"
  | "recommendations";

interface ResultsContextType {
  productData: any;
  currentAnalytics: AnalyticsData | null;
  previousAnalytics: AnalyticsData | null;
  isLoading: boolean;
  dataReady: boolean;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isAnalyzing: boolean; // Single source of truth from hook
}

const ResultsContext = createContext<ResultsContextType | null>(null);

export const useResults = () => {
  const context = useContext(ResultsContext);
  if (!context) {
    throw new Error("useResults must be used within a ResultsProvider");
  }
  return context;
};

interface ResultsProviderProps {
  children: React.ReactNode;
}

export const ResultsProvider: React.FC<ResultsProviderProps> = ({ children }) => {
  const [productData, setProductData] = useState<any>(null);
  const [currentAnalytics, setCurrentAnalytics] = useState<AnalyticsData | null>(null);
  const [previousAnalytics, setPreviousAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dataReady, setDataReady] = useState<boolean>(false);
  const [activeTab, setActiveTabState] = useState<TabType>("overview");

  const { products } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Single source of truth for analysis state
  const { 
    isAnalyzing, 
    triggeredAt, 
    completeAnalysis, 
    isNewerThanTrigger,
    startAnalysis 
  } = useAnalysisState();

  // Map URL paths to tab types
  const pathToTab: Record<string, TabType> = {
    "/results": "overview",
    "/results/executive-summary": "executive-summary",
    "/results/prompts": "prompts",
    "/results/sources-all": "sources-all",
    "/results/competitors-comparisons": "competitors-comparisons",
  };

  // Sync activeTab with URL path
  useEffect(() => {
    const currentPath = location.pathname;
    const matchedTab = pathToTab[currentPath];
    if (matchedTab && matchedTab !== activeTab) {
      setActiveTabState(matchedTab);
    }
  }, [location.pathname]);

  // Wrapper to also update URL when tab changes programmatically
  const setActiveTab = (tab: TabType) => {
    setActiveTabState(tab);
    const tabToPath: Record<TabType, string> = {
      "overview": "/results",
      "executive-summary": "/results/executive-summary",
      "prompts": "/results/prompts",
      "sources-all": "/results/sources-all",
      "competitors-comparisons": "/results/competitors-comparisons",
      "recommendations": "/results/recommendations",
    };
    const targetPath = tabToPath[tab];
    if (targetPath && location.pathname !== targetPath) {
      navigate(targetPath, { replace: true });
    }
  };

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
  const hasFetchedRef = useRef(false);
  const completionToastShownRef = useRef<string | null>(null);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  useEffect(() => {
    previousAnalyticsRef.current = previousAnalytics;
  }, [previousAnalytics]);

  useEffect(() => {
    accessTokenRef.current = localStorage.getItem("access_token") || "";
  }, []);

  const lastPersistedAnalyticsSigRef = useRef<string | null>(null);

  // Try to load analytics from localStorage on mount
  useEffect(() => {
    const loaded = loadAnalyticsFromStorage();
    if (loaded) {
      console.log('📦 [CONTEXT] Loaded analytics from localStorage');
      setDataReady(true);
    }
  }, []);

  // Persist analytics ONLY when NEW completed data arrives
  useEffect(() => {
    const pick =
      currentAnalytics && currentAnalytics.status?.toLowerCase() === "completed"
        ? currentAnalytics
        : previousAnalytics && previousAnalytics.status?.toLowerCase() === "completed"
          ? previousAnalytics
          : null;

    if (!pick) return;

    const sig = JSON.stringify({
      productId: productData?.id || "",
      id: pick.id,
      date: pick.date,
      updated_at: pick.updated_at,
      status: pick.status,
    });

    if (lastPersistedAnalyticsSigRef.current === sig) return;
    lastPersistedAnalyticsSigRef.current = sig;

    setAnalyticsData({
      analytics: [pick],
      count: 1,
      limit: 1,
      product_id: productData?.id || "",
    });

    setDataReady(true);
  }, [currentAnalytics, previousAnalytics, productData?.id]);

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
    },
    []
  );

  const pollProductAnalytics = useCallback(
    async (productId: string, isInitialPoll: boolean = false) => {
      const attemptNum = pollingAttemptsRef.current + 1;
      console.log(
        `[POLL] Starting poll #${attemptNum} for product:`,
        productId,
        isInitialPoll ? "(INITIAL)" : "(BATCH)"
      );

      // Early exit checks
      if (!mountedRef.current) {
        console.log("[POLL] Component unmounted - aborting");
        return;
      }

      if (isInCooldownRef.current) {
        console.log("[POLL] In cooldown period - skipping poll");
        return;
      }

      if (hasReceivedDataRef.current) {
        console.log("✅ [POLL] Already received completed/failed data - stopping all polling");
        return;
      }

      if (isPollingRef.current) {
        console.log("[POLL] Already polling - skipping");
        return;
      }

      if (!productId || !accessTokenRef.current) {
        console.log("[POLL] Missing productId or accessToken");
        if (!accessTokenRef.current) {
          console.log("🔒 [POLL] No access token - redirecting to login");
          handleUnauthorized();
        }
        return;
      }

      // Check retry limit
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
            console.log("[POLL] Cooldown complete - resetting counter and starting new batch");
            pollingAttemptsRef.current = 0;
            isInCooldownRef.current = false;
            pollProductAnalytics(productId, false);
          }
        }, POLL_COOLDOWN_MS);

        return;
      }

      // Acquire lock
      isPollingRef.current = true;
      if (!isInitialPoll) {
        pollingAttemptsRef.current += 1;
      }
      console.log(`✅ [POLL] Lock acquired, attempt ${pollingAttemptsRef.current}/${POLL_MAX_ATTEMPTS}`);

      try {
        const res = await getProductAnalytics(productId, accessTokenRef.current);
        console.log("[POLL] Analytics response received:", res);

        if (!mountedRef.current) {
          console.log("[POLL] Component unmounted during fetch - aborting");
          return;
        }

        if (hasReceivedDataRef.current) {
          console.log("✅ [POLL] Data received while fetching - aborting");
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

            // Save to storage ONLY if values changed
            try {
              if (res.product_id) {
                const existingPid = localStorage.getItem("product_id");
                if (existingPid !== res.product_id) {
                  localStorage.setItem("product_id", res.product_id);
                }
              }

              if (mostRecentAnalysis.analytics?.analysis_scope?.search_keywords) {
                const keywords = mostRecentAnalysis.analytics.analysis_scope.search_keywords;
                const nextKeywords = JSON.stringify(keywords.map((k: string) => ({ keyword: k })));
                const existingKeywords = localStorage.getItem("keywords");
                if (existingKeywords !== nextKeywords) {
                  localStorage.setItem("keywords", nextKeywords);
                  localStorage.setItem("keyword_count", String(keywords.length));
                }
              }
            } catch {
              // ignore storage errors
            }

            const prevAnalytics = previousAnalyticsRef.current;
            const isPreviousCompleted = prevAnalytics?.status?.toLowerCase() === "completed";

            // Use the hook's isNewerThanTrigger to check if this is new data
            const analysisTimestamp = currentDate ? new Date(currentDate).getTime() : 0;
            const isNewData = isNewerThanTrigger(analysisTimestamp);

            console.log(`[POLL] Analysis date: ${currentDate}, Trigger time: ${triggeredAt ? new Date(triggeredAt).toISOString() : 'none'}, isNew: ${isNewData}`);

            // COMPLETED or FAILED = STOP ONLY IF it's a NEWER analysis
            if ((currentStatus === "completed" || currentStatus === "failed") && isNewData) {
              hasReceivedDataRef.current = true;
              pollingAttemptsRef.current = 0;
              initialPollDoneRef.current = true;
              
              // Clear analysis state via hook
              completeAnalysis();

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

              const previousDate =
                prevAnalytics?.date ||
                prevAnalytics?.updated_at ||
                prevAnalytics?.created_at;

              // Show toast only once per unique completion
              const toastKey = `${productId}_${currentDate}`;
              if (currentStatus === "completed" && previousDate && currentDate && currentDate > previousDate) {
                if (completionToastShownRef.current !== toastKey) {
                  completionToastShownRef.current = toastKey;
                  toastRef.current({
                    title: "Analysis Completed",
                    description: "Your analysis is now complete. Please refresh the page to see the updated insights.",
                    duration: 10000,
                  });
                  console.log("🎉 [POLL] Showing completion notification for new completed analysis");
                }
              }

              if (currentStatus === "completed") {
                setPreviousAnalytics(mostRecentAnalysis);
                localStorage.setItem("last_analysis_data", JSON.stringify(res));
                if (currentDate) {
                  localStorage.setItem("last_analysis_date", currentDate);
                }
              }

              console.log(`✅ [POLL] Analysis ${currentStatus.toUpperCase()} - ALL polling stopped permanently`);
              return;
            }

            // OLD completed data found but waiting for NEW analysis - continue polling
            if ((currentStatus === "completed" || currentStatus === "failed") && !isNewData) {
              console.log(`⏳ [POLL] Found OLD ${currentStatus} analysis - waiting for NEW analysis, continuing poll`);
              setCurrentAnalytics(mostRecentAnalysis);
              setIsLoading(true);

              if (!hasShownStartMessageRef.current && mountedRef.current) {
                toastRef.current({
                  title: "Analysis in Progress",
                  description: "Your new analysis has begun. Please stay on this page, you'll receive a notification when it's ready.",
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

              if (isPreviousCompleted) {
                setIsLoading(false);
              } else {
                setIsLoading(true);
              }

              if (!hasShownStartMessageRef.current && mountedRef.current) {
                toastRef.current({
                  title: "Analysis in Progress",
                  description: "Your analysis has begun. Please stay on this page, you'll receive a notification here when it's ready.",
                  duration: 10000,
                });
                hasShownStartMessageRef.current = true;
              }

              scheduleNextPoll(productId, isInitialPoll);
              return;
            }

            // Unknown status - continue polling
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
      } catch (err: any) {
        console.error(`❌ [POLL] Failed to fetch analytics:`, err);

        // Check for auth errors
        if (isUnauthorizedError(err)) {
          console.log("🔒 [POLL] Unauthorized error - logging out");
          handleUnauthorized();
          return;
        }

        // Don't retry if we already have completed data
        if (hasReceivedDataRef.current) {
          console.log("✅ [POLL] Already have completed data - not retrying after error");
          return;
        }

        // Schedule retry
        scheduleNextPoll(productId, isInitialPoll);
      } finally {
        isPollingRef.current = false;
        console.log("🔓 [POLL] Lock released");
      }
    },
    [scheduleNextPoll, isNewerThanTrigger, triggeredAt, completeAnalysis]
  );

  // Parse location.state and handle incoming navigation
  useEffect(() => {
    mountedRef.current = true;
    const state = location.state as any;

    // Check for valid access token
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      console.log("🔒 [STATE] No access token - redirecting to login");
      handleUnauthorized();
      return;
    }

    // If isNew flag is set from InputPage, ensure analysis state is started
    if (state?.isNew && state?.productId && state?.analysisTriggeredAt) {
      console.log("🆕 [STATE] New analysis detected from InputPage");
      // The startAnalysis was already called in InputPage, but we need to ensure loading state
      setIsLoading(true);
      setDataReady(false);
      hasReceivedDataRef.current = false;
      hasFetchedRef.current = false;
    }

    if (state?.product?.id) {
      setProductData({
        id: state.product.id,
        name: state.product.name || state.product.website || state.product.id,
        website: state.website || state.product.website || "",
      });
    } else if (state?.productId || state?.id) {
      const pid = state.productId || state.id;
      setProductData({
        id: pid.toString(),
        name: state.website || pid.toString(),
        website: state.website || "",
      });
    } else if (products && products.length > 0) {
      setProductData({
        id: products[0].id,
        name: products[0].name || products[0].website,
        website: products[0].website || "",
      });
    } else {
      const storedProductId = localStorage.getItem("product_id");
      if (storedProductId) {
        setProductData({
          id: storedProductId,
          name: storedProductId,
          website: "",
        });
      } else {
        console.log("⚠️ [STATE] No product data - redirecting to input");
        navigate("/input");
      }
    }

    return () => {
      mountedRef.current = false;
    };
  }, [location.state, navigate, products, startAnalysis]);

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

  // Start polling when productId changes - ONLY ONCE
  useEffect(() => {
    const productId = productData?.id;

    if (!productId) return;

    // Skip if we've already fetched for this product
    if (currentProductIdRef.current === productId && hasFetchedRef.current) {
      return;
    }

    currentProductIdRef.current = productId;
    hasFetchedRef.current = true;

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

    console.log("▶️ [EFFECT] Starting INITIAL poll for product:", productId);
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
    console.log("[MOUNT] Component mounted");

    return () => {
      console.log("🛑 [UNMOUNT] Component unmounting - cleaning up");
      mountedRef.current = false;
      currentProductIdRef.current = null;
      hasFetchedRef.current = false;
    };
  }, []);

  return (
    <ResultsContext.Provider
      value={{
        productData,
        currentAnalytics,
        previousAnalytics,
        isLoading,
        dataReady,
        activeTab,
        setActiveTab,
        isAnalyzing, // From hook - single source of truth
      }}
    >
      {children}
    </ResultsContext.Provider>
  );
};
