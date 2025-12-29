/**
 * useAnalysisState - Single source of truth for analysis lifecycle state
 * 
 * Manages:
 * - Whether an analysis is currently in progress (isAnalyzing)
 * - When the current analysis was triggered (triggeredAt)
 * - Locking mechanism to disable buttons during analysis
 * 
 * State is persisted to sessionStorage (cleared on logout/tab close)
 * NOT localStorage to avoid stale locks across sessions.
 */

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "analysis_state";

interface AnalysisState {
  isAnalyzing: boolean;
  triggeredAt: number | null;
  productId: string | null;
}

const defaultState: AnalysisState = {
  isAnalyzing: false,
  triggeredAt: null,
  productId: null,
};

// In-memory cache for SSR safety and fast reads
let cachedState: AnalysisState = defaultState;

// Subscribers for useSyncExternalStore
const subscribers = new Set<() => void>();

function notifySubscribers() {
  subscribers.forEach((cb) => cb());
}

function readFromStorage(): AnalysisState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AnalysisState;
      // Validate shape
      if (
        typeof parsed.isAnalyzing === "boolean" &&
        (parsed.triggeredAt === null || typeof parsed.triggeredAt === "number") &&
        (parsed.productId === null || typeof parsed.productId === "string")
      ) {
        return parsed;
      }
    }
  } catch {
    // ignore parse errors
  }
  return defaultState;
}

function writeToStorage(state: AnalysisState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
  cachedState = state;
  notifySubscribers();
}

// Initialize cache
if (typeof window !== "undefined") {
  cachedState = readFromStorage();
}

function subscribe(callback: () => void) {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

function getSnapshot(): AnalysisState {
  return cachedState;
}

function getServerSnapshot(): AnalysisState {
  return defaultState;
}

/**
 * Hook to access and mutate analysis state
 */
export function useAnalysisState() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  /**
   * Call when a new analysis is triggered (from InputPage or Regenerate)
   */
  const startAnalysis = useCallback((productId: string) => {
    const newState: AnalysisState = {
      isAnalyzing: true,
      triggeredAt: Date.now(),
      productId,
    };
    writeToStorage(newState);
    console.log("🚀 [ANALYSIS_STATE] Analysis started for product:", productId);
  }, []);

  /**
   * Call when analysis completes (success or failure)
   */
  const completeAnalysis = useCallback(() => {
    writeToStorage(defaultState);
    console.log("✅ [ANALYSIS_STATE] Analysis completed - state cleared");
  }, []);

  /**
   * Force clear state (e.g., on logout)
   */
  const clearAnalysisState = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    cachedState = defaultState;
    notifySubscribers();
    console.log("🧹 [ANALYSIS_STATE] State cleared");
  }, []);

  /**
   * Check if a given analysis timestamp is newer than when we triggered
   * Used to determine if API response is from our current analysis or old data
   */
  const isNewerThanTrigger = useCallback(
    (analysisTimestamp: number | null): boolean => {
      if (!state.triggeredAt) return true; // No trigger = accept any data
      if (!analysisTimestamp) return false;
      return analysisTimestamp > state.triggeredAt;
    },
    [state.triggeredAt]
  );

  return {
    isAnalyzing: state.isAnalyzing,
    triggeredAt: state.triggeredAt,
    productId: state.productId,
    startAnalysis,
    completeAnalysis,
    clearAnalysisState,
    isNewerThanTrigger,
  };
}

// Export for use in auth logout
export function clearAnalysisStateOnLogout() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  cachedState = defaultState;
  notifySubscribers();
}
