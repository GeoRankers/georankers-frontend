import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { getProductAnalytics } from "@/apiHelpers";
import { setAnalyticsData, clearCurrentAnalyticsData } from "@/results/data/analyticsData";
import { clearAnalyticsDataForCurrentUser } from "@/lib/storageKeys";
import { useToast } from "@/hooks/use-toast";
import { handleUnauthorized, isUnauthorizedError } from "@/lib/authGuard";
import { useAnalysisState } from "@/hooks/useAnalysisState";
import { getEmailScopedKey, STORAGE_KEYS } from "@/lib/storageKeys";

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
  isAnalyzing: boolean;
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

  const { 
    isAnalyzing, 
    triggeredAt, 
    completeAnalysis, 
    isNewerThanTrigger,
    startAnalysis 
  } = useAnalysisState();

  const pathToTab: Record<string, TabType> = {
    "/results": "overview",
    "/results/executive-summary": "executive-summary",
    "/results/prompts": "prompts",
    "/results/sources-all": "sources-all",
    "/results/competitors-comparisons": "competitors-comparisons",
  };

  useEffect(() => {
    const currentPath = location.pathname;
    const matchedTab = pathToTab[currentPath];
    if (matchedTab && matchedTab !== activeTab) {
      setActiveTabState(matchedTab);
    }
  }, [location.pathname]);

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

  const POLL_INTERVAL_MS = 2 * 60 * 1000;
  const POLL_MAX_ATTEMPTS = 30;
  const POLL_COOLDOWN_MS = 10 * 60 * 1000;

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
  const hasFetchedRef = useRef(false);
  const toastRef = useRef(toast);
  const hasShownCompletionToastRef = useRef(false);
  const pageLoadTimestampRef = useRef<number>(Date.now()); // Track when page loaded
  
  const getCompletionToastShownKey = useCallback(() => {
    return getEmailScopedKey(STORAGE_KEYS.COMPLETION_TOAST_SHOWN);
  }, []);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  useEffect(() => {
    previousAnalyticsRef.current = previousAnalytics;
  }, [previousAnalytics]);

  useEffect(() => {
    accessTokenRef.current = localStorage.getItem("access_token") || "";
  }, []);

  // Load existing data from localStorage on mount
  useEffect(() => {
    const loadExistingData = () => {
      try {
        const lastDataKey = getEmailScopedKey(STORAGE_KEYS.LAST_ANALYSIS_DATA);
        const stored = localStorage.getItem(lastDataKey);
        
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.analytics?.length > 0) {
            const latestAnalysis = parsed.analytics[0];
            
            if (latestAnalysis.status?.toLowerCase() === "completed") {
              console.log("📦 [MOUNT] Loading completed analysis from localStorage");
              setCurrentAnalytics(latestAnalysis);
              setPreviousAnalytics(latestAnalysis);
              setDataReady(true);
              setIsLoading(false);
              
              // Also update analyticsData cache
              setAnalyticsData(parsed);
            }
          }
        }
      } catch (e) {
        console.error("Failed to load existing data:", e);
      }
    };
    
    loadExistingData();
  }, []);

  const scheduleNextPoll = useCallback(
    (productId: string) => {
      if (pollingTimerRef.current) {
        clearTimeout(pollingTimerRef.current);
      }

      if (hasReceivedDataRef.current) {
        console.log("✅ [SCHEDULE] Data already received - no more polls");
        return;
      }

      console.log(`⏱️ [SCHEDULE] Scheduling next poll in ${POLL_INTERVAL_MS / 60000} minutes...`);
      pollingTimerRef.current = window.setTimeout(() => {
        if (
          mountedRef.current &&
          currentProductIdRef.current === productId &&
          !hasReceivedDataRef.current
        ) {
          isPollingRef.current = false;
          pollProductAnalytics(productId);
        }
      }, POLL_INTERVAL_MS);
    },
    []
  );

  const pollProductAnalytics = useCallback(
    async (productId: string) => {
      pollingAttemptsRef.current += 1;
      const attemptNum = pollingAttemptsRef.current;
      console.log(`[POLL] Starting poll #${attemptNum} for product:`, productId);

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

      if (pollingAttemptsRef.current >= POLL_MAX_ATTEMPTS) {
        console.log(
          `🛑 [POLL] Reached max poll limit (${POLL_MAX_ATTEMPTS}) - entering ${POLL_COOLDOWN_MS / 60000} min cooldown`
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
            pollProductAnalytics(productId);
          }
        }, POLL_COOLDOWN_MS);

        return;
      }

      isPollingRef.current = true;
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

            const analysisTimestamp = currentDate ? new Date(currentDate).getTime() : 0;
            const isNewData = isNewerThanTrigger(analysisTimestamp);

            console.log(`[POLL] Analysis date: ${currentDate}, Trigger time: ${triggeredAt ? new Date(triggeredAt).toISOString() : 'none'}, isNew: ${isNewData}`);

            // COMPLETED or FAILED = STOP ONLY IF it's NEWER analysis
            if ((currentStatus === "completed" || currentStatus === "failed") && isNewData) {
              hasReceivedDataRef.current = true;
              pollingAttemptsRef.current = 0;
              
              // CRITICAL FIX: Clear old data FIRST
              console.log("🧹 [POLL] Clearing old data from storage");
              clearAnalyticsDataForCurrentUser();
              clearCurrentAnalyticsData();
              
              // CRITICAL FIX: Save new data to localStorage IMMEDIATELY
              console.log("💾 [POLL] Saving new data to localStorage immediately");
              const dataToSave = {
                analytics: [mostRecentAnalysis],
                count: 1,
                limit: 1,
                product_id: productId,
              };
              
              // Save to email-scoped key
              const lastDataKey = getEmailScopedKey(STORAGE_KEYS.LAST_ANALYSIS_DATA);
              const lastDateKey = getEmailScopedKey(STORAGE_KEYS.LAST_ANALYSIS_DATE);
              
              try {
                localStorage.setItem(lastDataKey, JSON.stringify(dataToSave));
                if (currentDate) {
                  localStorage.setItem(lastDateKey, currentDate);
                }
                console.log("✅ [POLL] New data saved to localStorage successfully");
              } catch (e) {
                console.error("❌ [POLL] Failed to save to localStorage:", e);
              }
              
              // Also update analyticsData cache
              setAnalyticsData(dataToSave);
              
              // Clear analysis state
              completeAnalysis();

              // Clear all timers
              if (pollingTimerRef.current) {
                clearTimeout(pollingTimerRef.current);
                pollingTimerRef.current = undefined;
              }
              if (cooldownTimerRef.current) {
                clearTimeout(cooldownTimerRef.current);
                cooldownTimerRef.current = undefined;
              }

              // Update React state
              setCurrentAnalytics(mostRecentAnalysis);
              setPreviousAnalytics(mostRecentAnalysis);
              setDataReady(true);
              setIsLoading(false);

              // Show completion notification ONLY if page was loaded BEFORE analysis completed
              if (currentStatus === "completed" && !hasShownCompletionToastRef.current) {
                // Check if analysis completed AFTER this page load
                const analysisCompletedAfterPageLoad = analysisTimestamp > pageLoadTimestampRef.current;
                
                if (analysisCompletedAfterPageLoad) {
                  // Analysis completed while user is on this page -> ask to refresh
                  hasShownCompletionToastRef.current = true;
                  toastRef.current({
                    title: "Analysis Complete!",
                    description: "Your analysis is ready. Refresh the page to see the latest data.",
                    duration: 10000,
                  });
                  console.log("🎉 [POLL] Showing refresh notification - analysis completed while on page");
                } else {
                  // Page was refreshed AFTER analysis completed -> no notification needed
                  console.log("✅ [POLL] Page already refreshed after completion - no notification");
                }
              }

              console.log(`✅ [POLL] Analysis ${currentStatus.toUpperCase()} - ALL polling stopped, data saved`);
              return;
            }

            // OLD completed data found but waiting for NEW analysis
            if ((currentStatus === "completed" || currentStatus === "failed") && !isNewData) {
              console.log(`⏳ [POLL] Found OLD ${currentStatus} analysis - waiting for NEW analysis`);
              
              // Show old data while waiting
              if (!currentAnalytics) {
                setCurrentAnalytics(mostRecentAnalysis);
                setPreviousAnalytics(mostRecentAnalysis);
                setDataReady(true);
              }
              
              setIsLoading(true);

              if (!hasShownStartMessageRef.current && mountedRef.current) {
                toastRef.current({
                  title: "Analysis in Progress",
                  description: "Your new analysis has begun. We'll notify you when it's ready.",
                  duration: 10000,
                });
                hasShownStartMessageRef.current = true;
              }

              scheduleNextPoll(productId);
              return;
            }

            // IN_PROGRESS or ERROR
            if (currentStatus === "error" || currentStatus === "in_progress") {
              if (!currentAnalytics) {
                setCurrentAnalytics(mostRecentAnalysis);
              }

              setIsLoading(true);

              if (!hasShownStartMessageRef.current && mountedRef.current) {
                toastRef.current({
                  title: "Analysis in Progress",
                  description: "Your analysis has begun. We'll notify you when it's ready.",
                  duration: 10000,
                });
                hasShownStartMessageRef.current = true;
              }

              scheduleNextPoll(productId);
              return;
            }

            // Unknown status
            if (!currentAnalytics) {
              setCurrentAnalytics(mostRecentAnalysis);
            }
            setIsLoading(true);
            console.log(`⚠️ [POLL] Unknown status "${currentStatus}" - continuing polling`);
            scheduleNextPoll(productId);
          } else {
            console.log("⚠️ [POLL] No analysis found - scheduling next poll");
            setIsLoading(true);
            scheduleNextPoll(productId);
          }
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err: any) {
        console.error(`❌ [POLL] Failed to fetch analytics:`, err);

        if (isUnauthorizedError(err)) {
          console.log("🔒 [POLL] Unauthorized error - logging out");
          handleUnauthorized();
          return;
        }

        if (hasReceivedDataRef.current) {
          console.log("✅ [POLL] Already have completed data - not retrying after error");
          return;
        }

        scheduleNextPoll(productId);
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

    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      console.log("🔒 [STATE] No access token - redirecting to login");
      handleUnauthorized();
      return;
    }

    if (state?.isNew && state?.productId && state?.analysisTriggeredAt) {
      console.log("🆕 [STATE] New analysis detected from InputPage");
      setIsLoading(true);
      setDataReady(false);
      hasReceivedDataRef.current = false;
      hasFetchedRef.current = false;
      hasShownCompletionToastRef.current = false;
      // Reset page load timestamp when new analysis is triggered
      pageLoadTimestampRef.current = Date.now();
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

  // Start polling when productId changes
  useEffect(() => {
    const productId = productData?.id;

    if (!productId) return;

    if (currentProductIdRef.current === productId && hasFetchedRef.current) {
      return;
    }

    currentProductIdRef.current = productId;
    hasFetchedRef.current = true;

    hasShownStartMessageRef.current = false;
    hasShownCompletionToastRef.current = false;
    isPollingRef.current = false;
    pollingAttemptsRef.current = 0;
    isInCooldownRef.current = false;
    hasReceivedDataRef.current = false;

    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current);
      pollingTimerRef.current = undefined;
    }
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = undefined;
    }

    console.log("▶️ [EFFECT] Starting poll for product:", productId);
    pollProductAnalytics(productId);

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
    };
  }, [productData?.id, pollProductAnalytics]);

  useEffect(() => {
    mountedRef.current = true;
    console.log("[MOUNT] Component mounted");

    return () => {
      console.log("🛑 [UNMOUNT] Component unmounting");
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
        isAnalyzing,
      }}
    >
      {children}
    </ResultsContext.Provider>
  );
};