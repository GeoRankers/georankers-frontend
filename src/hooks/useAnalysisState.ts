/**
 * useAnalysisState - Single source of truth for analysis lifecycle state
 * 
 * Manages:
 * - Whether an analysis is currently in progress (isAnalyzing)
 * - When the current analysis was triggered (triggeredAt)
 * - Locking mechanism to disable buttons during analysis
 * 
 * State is persisted to localStorage (NOT sessionStorage) so it survives logout/login
 * All keys are SCOPED PER USER EMAIL to prevent state leakage between accounts.
 */

import { useCallback, useSyncExternalStore } from "react";
import { STORAGE_KEYS, getEmailScopedKey } from "@/lib/storageKeys";

const STORAGE_KEY_PREFIX = "analysis_state";

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
let currentUserEmail: string | null = null;

// Subscribers for useSyncExternalStore
const subscribers = new Set<() => void>();

function notifySubscribers() {
  subscribers.forEach((cb) => cb());
}

// Get storage key scoped to user email
function getStorageKey(email?: string): string {
  const userEmail = email || currentUserEmail || localStorage.getItem("user_email") || "";
  if (userEmail) {
    const sanitizedEmail = userEmail.toLowerCase().replace(/[^a-z0-9]/g, "_");
    return `${STORAGE_KEY_PREFIX}_${sanitizedEmail}`;
  }
  return STORAGE_KEY_PREFIX;
}

function readFromStorage(email?: string): AnalysisState {
  try {
    const key = getStorageKey(email);
    // Use localStorage instead of sessionStorage so it persists across logout/login
    const raw = localStorage.getItem(key);
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
    const key = getStorageKey();
    // Use localStorage instead of sessionStorage so it persists across logout/login
    localStorage.setItem(key, JSON.stringify(state));
    console.log(`🔒 [ANALYSIS_STATE] Written to key: ${key}, isAnalyzing: ${state.isAnalyzing}`);
  } catch {
    // ignore quota errors
  }
  cachedState = state;
  notifySubscribers();
}

// Initialize cache
if (typeof window !== "undefined") {
  currentUserEmail = localStorage.getItem("user_email");
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
 * Set current user email for scoping (call on login)
 * This will load the analysis state for this specific user
 */
export function setAnalysisUserEmail(email: string) {
  const prevEmail = currentUserEmail;
  currentUserEmail = email;
  
  // Save email to localStorage for persistence
  try {
    localStorage.setItem("user_email", email);
  } catch {
    // ignore
  }
  
  // Always reload state for the user (important for login)
  cachedState = readFromStorage(email);
  notifySubscribers();
  console.log(`👤 [ANALYSIS_STATE] User email set: ${email}, isAnalyzing: ${cachedState.isAnalyzing}`);
}

/**
 * Clear user email (call on logout)
 */
export function clearAnalysisUserEmail() {
  currentUserEmail = null;
  cachedState = defaultState;
  notifySubscribers();
  console.log("👤 [ANALYSIS_STATE] User email cleared");
}

/**
 * Hook to access and mutate analysis state
 */
export function useAnalysisState() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  /**
   * Call when a new analysis is triggered (from InputPage or Regenerate)
   * Note: Old data is NOT cleared here - it's cleared only when new data arrives
   */
  const startAnalysis = useCallback((productId: string) => {
    // Clear the completion toast flag so notification can show for new analysis
    try {
      const toastKey = getEmailScopedKey(STORAGE_KEYS.COMPLETION_TOAST_SHOWN);
      localStorage.removeItem(toastKey);
    } catch {
      // ignore
    }
    
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
   * Force clear state (e.g., when analysis completes or on explicit clear)
   * Note: This should NOT be called on logout - analysis state should persist
   */
  const clearAnalysisState = useCallback(() => {
    try {
      const key = getStorageKey();
      localStorage.removeItem(key);
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

// Note: We no longer clear analysis state on logout
// The state is email-scoped and should persist so users see their analysis
// is still running when they log back in
