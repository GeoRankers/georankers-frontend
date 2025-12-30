/**
 * Email-scoped storage key utilities
 * Used to scope localStorage/sessionStorage keys per user email
 */

// Get sanitized email string for use in storage keys
export function getSanitizedEmail(email?: string): string {
  const userEmail = email || localStorage.getItem("user_email") || "";
  return userEmail.toLowerCase().replace(/[^a-z0-9]/g, "_");
}

// Get email-scoped key
export function getEmailScopedKey(baseKey: string, email?: string): string {
  const sanitized = getSanitizedEmail(email);
  if (sanitized) {
    return `${baseKey}_${sanitized}`;
  }
  return baseKey;
}

// Storage key constants
export const STORAGE_KEYS = {
  ANALYTICS_DATA: "geo_analytics_data",
  LAST_ANALYSIS_DATA: "last_analysis_data",
  LAST_ANALYSIS_DATE: "last_analysis_date",
  ANALYSIS_STATE: "analysis_state",
  USER_EMAIL: "user_email",
  COMPLETION_TOAST_SHOWN: "completion_toast_shown",
} as const;

// Clear analytics data for current user (call when starting new analysis)
export function clearAnalyticsDataForCurrentUser(): void {
  const sanitized = getSanitizedEmail();
  if (!sanitized) return;
  
  const keysToRemove = [
    `${STORAGE_KEYS.ANALYTICS_DATA}_${sanitized}`,
    `${STORAGE_KEYS.LAST_ANALYSIS_DATA}_${sanitized}`,
    `${STORAGE_KEYS.LAST_ANALYSIS_DATE}_${sanitized}`,
    `${STORAGE_KEYS.COMPLETION_TOAST_SHOWN}_${sanitized}`,
  ];
  
  keysToRemove.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  });
  
  console.log("🧹 [STORAGE] Cleared analytics data for current user");
}

// Get all email-scoped datasets from localStorage
export function getAllEmailScopedDatasets(): Array<{
  email: string;
  key: string;
  hasAnalyticsData: boolean;
  hasLastAnalysisData: boolean;
  lastAnalysisDate: string | null;
}> {
  const datasets: Array<{
    email: string;
    key: string;
    hasAnalyticsData: boolean;
    hasLastAnalysisData: boolean;
    lastAnalysisDate: string | null;
  }> = [];
  
  const analyticsPrefix = STORAGE_KEYS.ANALYTICS_DATA + "_";
  const lastDataPrefix = STORAGE_KEYS.LAST_ANALYSIS_DATA + "_";
  const lastDatePrefix = STORAGE_KEYS.LAST_ANALYSIS_DATE + "_";
  
  // Collect all unique email suffixes
  const emailSuffixes = new Set<string>();
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    
    if (key.startsWith(analyticsPrefix)) {
      emailSuffixes.add(key.substring(analyticsPrefix.length));
    } else if (key.startsWith(lastDataPrefix)) {
      emailSuffixes.add(key.substring(lastDataPrefix.length));
    } else if (key.startsWith(lastDatePrefix)) {
      emailSuffixes.add(key.substring(lastDatePrefix.length));
    }
  }
  
  // Build dataset info for each email
  emailSuffixes.forEach((suffix) => {
    const analyticsKey = `${STORAGE_KEYS.ANALYTICS_DATA}_${suffix}`;
    const lastDataKey = `${STORAGE_KEYS.LAST_ANALYSIS_DATA}_${suffix}`;
    const lastDateKey = `${STORAGE_KEYS.LAST_ANALYSIS_DATE}_${suffix}`;
    
    // Try to recover original email from suffix (best effort)
    const email = suffix.replace(/_/g, ".").replace(/\.com$/, "@gmail.com") || suffix;
    
    datasets.push({
      email: suffix, // Use suffix as identifier
      key: suffix,
      hasAnalyticsData: localStorage.getItem(analyticsKey) !== null,
      hasLastAnalysisData: localStorage.getItem(lastDataKey) !== null,
      lastAnalysisDate: localStorage.getItem(lastDateKey),
    });
  });
  
  return datasets;
}

// Delete all data for a specific email suffix
export function deleteEmailScopedData(emailSuffix: string): void {
  const keysToDelete = [
    `${STORAGE_KEYS.ANALYTICS_DATA}_${emailSuffix}`,
    `${STORAGE_KEYS.LAST_ANALYSIS_DATA}_${emailSuffix}`,
    `${STORAGE_KEYS.LAST_ANALYSIS_DATE}_${emailSuffix}`,
  ];
  
  keysToDelete.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  });
  
  // Also clear from sessionStorage
  try {
    sessionStorage.removeItem(`${STORAGE_KEYS.ANALYSIS_STATE}_${emailSuffix}`);
  } catch {
    // ignore
  }
  
  console.log(`🗑️ [STORAGE] Deleted data for: ${emailSuffix}`);
}
