/**
 * Formulas and calculation explanations for the AI Visibility Dashboard
 */

export const TOOLTIP_CONTENT = {
  aiVisibility: {
    description: "Measures how prominently your brand appears in AI-generated responses compared to competitors.",
    formula: "Percentile = (brands_with_lower_score / total_brands) × 100",
    tiers: {
      high: "≥ 70 percentile",
      medium: "40-69 percentile", 
      low: "< 40 percentile"
    }
  },
  brandMentions: {
    description: "Total raw mentions across all AI platforms compared to competitors.",
    formula: "Percentile = (brands_with_lower_mentions / total_brands) × 100",
    tiers: {
      high: "≥ 70 percentile",
      medium: "40-69 percentile",
      low: "< 40 percentile"
    }
  },
  sentimentAnalysis: {
    description: "Overall sentiment tone of your brand mentions across AI platforms.",
    explanation: "Analyzes the context and tone in which your brand is mentioned."
  },
  platformPerformance: {
    description: "Breakdown of your brand's performance across different source types.",
    formula: "Mention Ratio = (Brand's Mentions / Highest Mentions) × 100"
  }
};

/**
 * Calculate percentile rank for a value in an array
 */
export const calculatePercentile = (value: number, allValues: number[]): number => {
  const sorted = [...allValues].sort((a, b) => a - b);
  const lowerCount = sorted.filter(v => v < value).length;
  const percentile = (lowerCount / sorted.length) * 100;
  return Math.round(percentile);
};

/**
 * Get tier from percentile
 */
export const getTierFromPercentile = (percentile: number): string => {
  if (percentile >= 70) return "High";
  if (percentile >= 40) return "Medium";
  return "Low";
};

/**
 * Get tier color classes for solid badges
 */
export const getTierBadgeClasses = (tier: string): string => {
  switch (tier?.toLowerCase()) {
    case 'high':
    case 'positive':
    case 'yes':
      return 'bg-green-500 text-white';
    case 'medium':
    case 'neutral':
      return 'bg-amber-500 text-white';
    case 'low':
    case 'negative':
    case 'no':
    case 'absent':
      return 'bg-red-500 text-white';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

/**
 * Get gauge color based on percentile value
 */
export const getGaugeColor = (percentile: number): string => {
  if (percentile >= 70) return 'hsl(142, 71%, 45%)'; // green
  if (percentile >= 40) return 'hsl(45, 93%, 47%)'; // amber/yellow
  return 'hsl(0, 84%, 60%)'; // red
};

/**
 * Get gradient color for gauge arc
 */
export const getGaugeGradientId = (percentile: number): string => {
  if (percentile >= 70) return 'gaugeGreen';
  if (percentile >= 40) return 'gaugeAmber';
  return 'gaugeRed';
};
