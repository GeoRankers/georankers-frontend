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
  brandMentionScore: {
    description: "Percentage of AI responses where the brand appeared out of total AI prompts.",
    formula: "Brand Mention Score % = (sum of mention_breakdown values / total prompts) × 100",
    explanation: "For example, if there are 10 AI prompts and the brand appeared in 5 of them, the score is 50%.",
    calculation: {
      step1: "Count total prompts from search_keywords (sum of all prompts arrays)",
      step2: "Sum mention_breakdown values for the brand (shows prompts where brand appeared per keyword)",
      step3: "Calculate: (total_mentions / total_prompts) × 100, capped at 100%"
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
 * Get tier color CSS variable only
 */
export const getTierColorVar = (tier: string): string => {
  switch (tier?.toLowerCase()) {
    case 'high':
    case 'positive':
    case 'yes':
      return '[--tier-color:theme(colors.green.500)]';

    case 'medium':
    case 'neutral':
      return '[--tier-color:theme(colors.amber.500)]';

    case 'low':
    case 'negative':
    case 'no':
    case 'absent':
      return '[--tier-color:theme(colors.red.500)]';

    default:
      return '[--tier-color:theme(colors.blue.500)]';
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

export function toOrdinal(n) {
  if (typeof n !== "number") return n;

  const mod100 = n % 100;

  if (mod100 >= 11 && mod100 <= 13) {
    return `${n}th`;
  }

  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}
