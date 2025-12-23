/**
 * Utility functions for the AI Visibility Dashboard
 * All calculations are done on the backend - this file only contains display helpers
 */

// ============= TOOLTIP CONTENT =============
export const TOOLTIP_CONTENT = {
  overallInsights: {
    description: "Comprehensive overview of your brand's performance across AI platforms including search, chat, and recommendations."
  },
  aiVisibility: {
    description: "Measures how prominently your brand appears in AI-generated responses using percentile ranking.",
    formula: "Percentile = (Brands with lower AI Visibility Score / Total brands) × 100",
    calculation: "AI Visibility Score is calculated, then ranked against all competitors to derive percentile position.",
    tiers: {
      high: "≥ 80 percentile",
      medium: "40-79 percentile", 
      low: "< 40 percentile"
    }
  },
  brandMentions: {
    description: "Total mentions of your brand across all AI platforms, ranked as a percentile against competitors.",
    formula: "Percentile = (Brands with lower mention score / Total brands) × 100",
    calculation: "Mention score calculated and ranked to derive percentile position.",
    tiers: {
      high: "≥ 80 percentile",
      medium: "40-79 percentile",
      low: "< 40 percentile"
    }
  },
  sentimentAnalysis: {
    description: "Overall sentiment tone of your brand mentions across AI platforms.",
    explanation: "Analyzes the context and tone in which your brand is mentioned."
  },
  executiveSummary: {
    description: "Strategic overview of your brand's AI visibility performance, including competitive positioning and prioritized actions."
  },
  brandHeader: {
    model: "AI model used to perform the visibility analysis",
  },
  platformPerformance: {
    description: "Breakdown of your brand's performance across different AI platform types.",
    formula: "Mention Ratio = (Brand's Mentions in Source / Highest Mentions in Source) × 100",
    tiers: {
      high: "≥ 80% of top brand in that source",
      medium: "40-79% of top brand in that source",
      low: "< 40% of top brand in that source"
    }
  },
  sourceAnalysis: {
    description: "Detailed breakdown of individual AI sources where your brand appears.",
    calculation: "Each source is rated based on your brand's mention ratio compared to the highest-mentioned brand.",
    mentions: "Total number of times your brand appears in this source category",
    tier: "Performance tier: High ≥80%, Medium 40-79%, Low <40%"
  },
  queryAnalysis: {
    description: "Analysis of specific search queries where your brand appears.",
    explanation: "Helps identify which types of queries trigger mentions of your brand."
  },
  competitorAnalysis: {
    description: "Comparative analysis of your brand versus competitors across all AI platforms.",
    visibilityTable: "Shows total mention scores for each competitor across different keywords",
    sentimentTable: "Summarizes market positioning and sentiment for each competitor",
    sentiment: "Overall perception of the brand in AI-generated responses"
  },
  contentImpact: {
    description: "Performance of your content across different source types and platforms.",
    explanation: "Identifies which content types are most effective for AI visibility.",
    mentions: "Total brand mentions in this platform category",
    tier: "Calculated as: (Brand Mentions / Top Brand Mentions) × 100"
  },
  recommendations: {
    description: "Actionable recommendations to improve your brand's AI visibility.",
    overallInsight: "Key insight from analyzing visibility patterns",
    suggestedAction: "Specific action recommended to improve visibility",
    effort: "Implementation effort: High, Medium, or Low",
    impact: "Expected visibility improvement: High, Medium, or Low"
  }
};

// ============= TIER THRESHOLDS =============
export const PERCENTILE_TIERS = {
  HIGH: 80,
  MEDIUM: 40,
  LOW: 0
};

// ============= UTILITY FUNCTIONS =============

/**
 * Safely convert value to number
 */
export const safeNumber = (value: any, fallback: number = 0): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

/**
 * Get tier from percentile score (0-100)
 */
export const getTierFromPercentile = (percentile: number): string => {
  const safe = safeNumber(percentile, 0);
  if (safe >= PERCENTILE_TIERS.HIGH) return "High";
  if (safe >= PERCENTILE_TIERS.MEDIUM) return "Medium";
  if (safe > 0) return "Low";
  return "Low";
};

/**
 * Get tier badge color class
 */
export const getTierColor = (tier: string): string => {
  const lowerTier = tier?.toLowerCase() || "";
  switch (lowerTier) {
    case "high":
      return "bg-success text-success-foreground";
    case "medium":
      return "bg-medium-neutral text-medium-neutral-foreground";
    case "low":
    case "absent":
      return "bg-destructive text-destructive-foreground";
    default:
      return "bg-secondary text-secondary-foreground";
  }
};

/**
 * Get sentiment badge color class
 */
export const getSentimentColor = (sentiment: string): string => {
  const lowerSentiment = sentiment?.toLowerCase() || "";
  switch (lowerSentiment) {
    case "positive":
      return "bg-success text-success-foreground";
    case "negative":
      return "bg-destructive text-destructive-foreground";
    case "neutral":
      return "bg-medium-neutral text-medium-neutral-foreground";
    default:
      return "bg-secondary text-secondary-foreground";
  }
};

/**
 * Get border color class based on tier
 */
export const getTierBorderColor = (tier: string): string => {
  const lowerTier = tier?.toLowerCase() || "";
  switch (lowerTier) {
    case "high":
      return "border-success";
    case "medium":
      return "border-medium-neutral";
    case "low":
      return "border-destructive";
    default:
      return "border-border";
  }
};

/**
 * Get HSL color for speedometer needle based on tier
 */
export const getTierNeedleColor = (tier: string): string => {
  const lowerTier = tier?.toLowerCase() || "";
  switch (lowerTier) {
    case "high":
      return "hsl(var(--success))";
    case "medium":
      return "hsl(var(--medium-neutral))";
    case "low":
      return "hsl(var(--destructive))";
    default:
      return "hsl(var(--primary))";
  }
};

/**
 * Get effort badge color (inverse - High effort = red)
 */
export const getEffortColor = (effort: string): string => {
  const lowerEffort = effort?.toLowerCase() || "";
  switch (lowerEffort) {
    case "high":
      return "bg-destructive text-destructive-foreground";
    case "medium":
      return "bg-medium-neutral text-medium-neutral-foreground";
    case "low":
      return "bg-success text-success-foreground";
    default:
      return "bg-secondary text-secondary-foreground";
  }
};

/**
 * Get impact badge color (High impact = green)
 */
export const getImpactColor = (impact: string): string => {
  const lowerImpact = impact?.toLowerCase() || "";
  switch (lowerImpact) {
    case "high":
      return "bg-success text-success-foreground";
    case "medium":
      return "bg-medium-neutral text-medium-neutral-foreground";
    case "low":
      return "bg-destructive text-destructive-foreground";
    default:
      return "bg-secondary text-secondary-foreground";
  }
};

/**
 * Get tier from ratio percentage (0-100)
 */
export const getTierFromRatio = (ratio: number): string => {
  const safe = safeNumber(ratio, 0);
  if (safe >= 80) return "High";
  if (safe >= 40) return "Medium";
  return "Low";
};

/**
 * Calculate mention ratio for source/platform analysis
 */
export const calculateMentionRatio = (
  brandMentions: number,
  maxMentions: number
): number => {
  if (maxMentions <= 0) return 0;
  return (brandMentions / maxMentions) * 100;
};

/**
 * Get chart bar color based on tier
 */
export const getBarColor = (tier: string): string => {
  const lowerTier = tier?.toLowerCase() || "";
  switch (lowerTier) {
    case "high":
      return "hsl(var(--success))";
    case "medium":
      return "hsl(var(--medium-neutral))";
    case "low":
    case "absent":
      return "hsl(var(--destructive))";
    default:
      return "hsl(var(--primary))";
  }
};
