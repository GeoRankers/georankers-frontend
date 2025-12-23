import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const IST_TIMEZONE = 'Asia/Kolkata';
import { calculatePercentile, getTierFromPercentile } from './formulas';

const ANALYTICS_STORAGE_KEY = 'new_results_analytics_data';

// Global state to hold the API response data
let currentAnalyticsData: any = null;

/**
 * Helper to format logo URL - handles both full URLs and domain-only formats
 */
const FAVICON_URL_TEMPLATE =
  import.meta.env.VITE_FAVICON_URL_TEMPLATE || 'https://www.google.com/s2/favicons?domain={domain}&sz=128';

/**
 * Normalize input to a clean domain (no protocol, no www, no path)
 */
const normalizeDomain = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split('/')[0];
};

export const formatLogoUrl = (logo: string): string => {
  if (!logo || typeof logo !== 'string') return '';
  if (/^https?:\/\//i.test(logo)) {
    return logo;
  }

  const domain = normalizeDomain(logo);
  if (!domain) return '';
  
  const httpsWwwDomain = `https://www.${domain}`;

  return FAVICON_URL_TEMPLATE.replace(
    '{domain}',
    httpsWwwDomain
  );
};


export const formatDateToIST = (dateStr: string): string => {
  if (!dateStr) return '';

  try {
    const date = new Date(dateStr);
    const istDate = toZonedTime(date, IST_TIMEZONE); 

    return format(istDate, 'd MMM yyyy, hh:mm a');
  } catch (error) {
    console.error('Error formatting date to IST:', error);
    return '';
  }
};

/**
 * Set the analytics data from API response
 * Call this function whenever you receive new data from the API
 * Also stores in localStorage for persistence
 */
export const setAnalyticsData = (apiResponse: any) => {
  if (apiResponse && apiResponse.analytics && Array.isArray(apiResponse.analytics)) {
    currentAnalyticsData = apiResponse;
    // Store in localStorage for persistence
    try {
      localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(apiResponse));
      console.log('📦 [ANALYTICS] Data stored in localStorage');
    } catch (e) {
      console.error('Failed to store analytics data in localStorage:', e);
    }
  } else {
    console.error('Invalid analytics data format');
  }
};

/**
 * Load analytics data from localStorage
 * Call this on app initialization to restore previous data
 * Validates that the data structure is compatible with current version
 */
export const loadAnalyticsFromStorage = (): boolean => {
  try {
    const stored = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.analytics && Array.isArray(parsed.analytics)) {
        // Validate the data structure - check for new format with brands array
        const analyticsObj = parsed.analytics[0]?.analytics;
        if (analyticsObj && !analyticsObj.brands) {
          // Old data structure without brands array - clear it
          console.log('📦 [ANALYTICS] Old data structure detected, clearing localStorage');
          localStorage.removeItem(ANALYTICS_STORAGE_KEY);
          return false;
        }
        
        currentAnalyticsData = parsed;
        console.log('📦 [ANALYTICS] Data loaded from localStorage');
        return true;
      }
    }
  } catch (e) {
    console.error('Failed to load analytics data from localStorage:', e);
    // Clear corrupted data
    localStorage.removeItem(ANALYTICS_STORAGE_KEY);
  }
  return false;
};

/**
 * Clear analytics data from memory and localStorage
 */
export const clearAnalyticsData = () => {
  currentAnalyticsData = null;
  try {
    localStorage.removeItem(ANALYTICS_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear analytics data from localStorage:', e);
  }
};

/**
 * Get the stored analytics data
 */
export const analyticsData = () => currentAnalyticsData;

// Helper to get the main analytics object
export const getAnalytics = () => {
  if (!currentAnalyticsData) {
    return null;
  }
  
  if (!currentAnalyticsData.analytics?.[0]) {
    return null;
  }
  
  const wrapper = currentAnalyticsData.analytics[0];
  
  // The wrapper has { id, product_id, date, status, analytics: {...} }
  // The actual data is in wrapper.analytics
  const data = wrapper.analytics;
  
  if (!data) {
    return null;
  }
  
  return data;
};

// Get brand name (fully dynamic from data)
export const getBrandName = () => getAnalytics()?.brand_name || '';

// Get brand website
export const getBrandWebsite = () => getAnalytics()?.brand_website || '';

// Get all competitor names from the brands array
export const getCompetitorNames = (): string[] => {
  const analytics = getAnalytics();
  if (!analytics?.brands) return [];
  return analytics.brands.map((brand: any) => brand.brand as string);
};

// Get keywords from search_keywords object
export const getKeywords = (): string[] => {
  const analytics = getAnalytics();
  if (!analytics?.search_keywords) return [];
  
  return Object.values(analytics.search_keywords).map((kw: any) => kw.name as string);
};

// Get keywords from search_keywords (for display purposes) - now returns keyword names
export const getAnalysisKeywords = (): string[] => {
  return getKeywords();
};

// Get search keywords with prompts
export const getSearchKeywordsWithPrompts = (): Array<{
  id: string;
  name: string;
  prompts: string[];
}> => {
  const analytics = getAnalytics();
  if (!analytics?.search_keywords) return [];
  
  return Object.entries(analytics.search_keywords).map(([id, kw]: [string, any]) => ({
    id,
    name: kw.name,
    prompts: kw.prompts || []
  }));
};

// Get brand info with logos from brands array (new data structure)
export const getBrandInfoWithLogos = (): Array<{
  brand: string;
  geo_score: number;
  mention_score: number;
  mention_count: number;
  logo: string;
  geo_tier: string;
  mention_tier: string;
  summary: string;
  outlook: string;
  mention_breakdown: Record<string, number> | null;
}> => {
  const analytics = getAnalytics();
  const brands = analytics?.brands;
  
  if (!brands || !Array.isArray(brands)) {
    console.warn('⚠️ [ANALYTICS] No brands array found in analytics data');
    return [];
  }
  
  // Map the data to ensure consistent field names and format logos
  return brands.map((brand: any) => ({
    brand: brand.brand,
    geo_score: brand.geo_score || 0,
    mention_score: brand.mention_score || 0,
    mention_count: brand.mention_count || 0,
    logo: formatLogoUrl(brand.logo || ''),
    geo_tier: brand.geo_tier || 'Low',
    mention_tier: brand.mention_tier || 'Low',
    summary: brand.summary || '',
    outlook: brand.outlook || 'Neutral',
    mention_breakdown: brand.mention_breakdown
  }));
};

// Get logo for a specific brand
export const getBrandLogo = (brandName: string): string => {
  const brandInfo = getBrandInfoWithLogos();
  const brand = brandInfo.find(b => b.brand === brandName);
  return brand?.logo || '';
};

// Competitor data derived from brands array with scores
export const getCompetitorData = () => {
  const brandInfoWithLogos = getBrandInfoWithLogos();
  const keywordsWithPrompts = getSearchKeywordsWithPrompts();
  
  return brandInfoWithLogos.map((brand) => {
    const keywordScores: number[] = [];
    let totalScore = brand.geo_score;
    
    // Calculate keyword scores from mention_breakdown
    keywordsWithPrompts.forEach((kw) => {
      const score = brand.mention_breakdown?.[kw.id] || 0;
      keywordScores.push(score);
    });
    
    return {
      name: brand.brand,
      keywordScores,
      totalScore,
      logo: brand.logo
    };
  }).sort((a, b) => b.totalScore - a.totalScore);
};

// Export as both function and constant for backward compatibility
export const competitorData = getCompetitorData();

// Calculate visibility for progress bars (relative to max)
export const getCompetitorVisibility = () => {
  const data = getCompetitorData();
  const maxScore = Math.max(...data.map(c => c.totalScore));
  return data.map(c => ({
    ...c,
    visibility: maxScore > 0 ? Math.round((c.totalScore / maxScore) * 100) : 0
  }));
};

// Get all brand total scores for percentile calculation
export const getAllBrandVisibilityScores = (): number[] => {
  return getCompetitorData().map(c => c.totalScore);
};

// FIXED: Single declaration of getAIVisibilityMetrics with correct t1/t2/t3 mapping
export const getAIVisibilityMetrics = (): { 
  score: number; 
  tier: string; 
  brandPosition: number;
  totalBrands: number;
  positionBreakdown: {
    topPosition: number;
    midPosition: number;
    lowPosition: number;
  };
} => {
  const analytics = getAnalytics();
  if (!analytics) {
    return {
      score: 0,
      tier: "Low",
      positionBreakdown: {
        topPosition: 0,
        midPosition: 0,
        lowPosition: 0,
      },
      brandPosition: 0,
      totalBrands: 0,
    };
  }

  const llmData = analytics.llm_wise_data;
  const brandName = analytics.brand_name;
  const brands = analytics.brands || [];

  // Get the brand's geo_score directly (this is the AI Visibility Score)
  const brandInfo = brands.find((b: any) => b.brand === brandName);
  const visibilityScore = brandInfo?.geo_score || 0;
  
  // Get tier from brand data
  const tier = brandInfo?.geo_tier || "Low";

  // Calculate position breakdown from LLM data
  // Combine data from both Gemini and OpenAI
  const geminiT1 = llmData?.gemini?.t1 || 0;
  const geminiT2 = llmData?.gemini?.t2 || 0;
  const geminiT3 = llmData?.gemini?.t3 || 0;

  const openaiT1 = llmData?.openai?.t1 || 0;
  const openaiT2 = llmData?.openai?.t2 || 0;
  const openaiT3 = llmData?.openai?.t3 || 0;

  // Total mentions where brand appeared (across all positions)
  const totalT1 = geminiT1 + openaiT1;
  const totalT2 = geminiT2 + openaiT2;
  const totalT3 = geminiT3 + openaiT3;
  
  const totalMentions = totalT1 + totalT2 + totalT3;

  // Calculate percentages based on: (# of queries at position / total queries where brand appeared) * 100
  const topPosition = totalMentions > 0 
    ? Math.round((totalT1 / totalMentions) * 100) 
    : 0;
  const midPosition = totalMentions > 0 
    ? Math.round((totalT2 / totalMentions) * 100) 
    : 0;
  const lowPosition = totalMentions > 0 
    ? Math.round((totalT3 / totalMentions) * 100) 
    : 0;

  // Find brand position (rank by geo_score)
  const sortedBrands = [...brands].sort((a, b) => {
    const scoreA = a.geo_score || 0;
    const scoreB = b.geo_score || 0;
    return scoreB - scoreA;
  });

  const brandPosition = sortedBrands.findIndex(b => b.brand === brandName) + 1;
  const totalBrands = brands.length;

  return {
    score: visibilityScore, // Direct geo_score from data
    tier, // Direct tier from data
    positionBreakdown: {
      topPosition, // Percentage
      midPosition, // Percentage
      lowPosition, // Percentage
    },
    brandPosition: brandPosition || 0,
    totalBrands,
  };
};

// Legacy function for backward compatibility
export const getVisibilityPosition = (): { position: number; tier: string; totalBrands: number } => {
  const metrics = getAIVisibilityMetrics();
  return {
    position: metrics.brandPosition,
    tier: metrics.tier,
    totalBrands: metrics.totalBrands
  };
};

// Calculate raw mentions for each brand from brands array
export const getBrandMentionCounts = (): Record<string, number> => {
  const brandInfoWithLogos = getBrandInfoWithLogos();
  const mentionCounts: Record<string, number> = {};
  
  brandInfoWithLogos.forEach((brand) => {
    mentionCounts[brand.brand] = brand.mention_count;
  });
  
  return mentionCounts;
};

// Calculate Brand's mentions position using mention_score from brands array
export const getMentionsPosition = (): { 
  position: number; 
  tier: string; 
  totalBrands: number;
  topBrandMentions: number;
  brandMentions: number;
  allBrandMentions: Record<string, number>;
} => {
  const brandName = getBrandName();
  const brandInfoWithLogos = getBrandInfoWithLogos();
  
  // Use mention_score for all calculations
  const allMentionScores: Record<string, number> = {};
  brandInfoWithLogos.forEach(b => {
    allMentionScores[b.brand] = b.mention_score; // Direct mention_score
  });
  
  // Sort by mention_score descending to find position
  const sortedByMentions = [...brandInfoWithLogos].sort((a, b) => b.mention_score - a.mention_score);
  const brandIndex = sortedByMentions.findIndex(b => b.brand === brandName);
  const position = brandIndex >= 0 ? brandIndex + 1 : sortedByMentions.length;
  
  const brandInfo = brandInfoWithLogos.find(b => b.brand === brandName);
  const brandMentionScore = brandInfo?.mention_score || 0;
  const topMentionScore = sortedByMentions[0]?.mention_score || 0;
  
  // Use mention_tier from data directly
  const tier = brandInfo?.mention_tier || 'Low';
  
  return {
    position,
    tier,
    totalBrands: brandInfoWithLogos.length,
    topBrandMentions: topMentionScore,
    brandMentions: brandMentionScore,
    allBrandMentions: allMentionScores
  };
};

// Get total number of prompts from search_keywords
export const getTotalPromptCount = (): number => {
  const analytics = getAnalytics();
  if (!analytics?.search_keywords) return 0;
  
  let totalPrompts = 0;
  Object.values(analytics.search_keywords).forEach((kw: any) => {
    if (kw.prompts && Array.isArray(kw.prompts)) {
      totalPrompts += kw.prompts.length;
    }
  });
  
  return totalPrompts;
};

// Get brand mention response rates for table display
export const getBrandMentionResponseRates = (): Array<{
  brand: string;
  responseRate: number;
  logo: string;
  isTestBrand: boolean;
}> => {
  const brandName = getBrandName();
  const brandInfoWithLogos = getBrandInfoWithLogos();
  
  // Map all brands with their mention_score
  const allBrandsWithRates = brandInfoWithLogos.map(b => ({
    brand: b.brand,
    responseRate: b.mention_score, // Direct mapping from data
    logo: b.logo,
    isTestBrand: b.brand === brandName
  }));
  
  // Sort all brands by mention_score descending
  const sortedBrands = [...allBrandsWithRates].sort((a, b) => b.responseRate - a.responseRate);
  
  // Get top 2 competitors (non-test brands with highest scores)
  const topTwoCompetitors = sortedBrands.filter(b => !b.isTestBrand).slice(0, 2);
  
  // Get the test brand
  const testBrand = sortedBrands.find(b => b.isTestBrand);
  
  // Combine all three brands
  const combinedBrands = [...topTwoCompetitors];
  if (testBrand) {
    combinedBrands.push(testBrand);
  }
  
  // Sort the final result by responseRate descending to maintain order
  return combinedBrands.sort((a, b) => b.responseRate - a.responseRate);
};

// Get brand's mention percentile for display
export const getBrandMentionPercentile = (): number => {
  const brandName = getBrandName();
  const brandInfoWithLogos = getBrandInfoWithLogos();
  const totalPrompts = getTotalPromptCount();
  
  if (totalPrompts === 0 || brandInfoWithLogos.length === 0) return 0;
  
  const allRates = brandInfoWithLogos.map(b => {
    let totalMentions = 0;
    if (b.mention_breakdown) {
      Object.values(b.mention_breakdown).forEach((count: number) => {
        totalMentions += count;
      });
    }
    return {
      brand: b.brand,
      rate: totalPrompts > 0 ? (totalMentions / totalPrompts) * 100 : 0
    };
  });
  
  const brandRate = allRates.find(b => b.brand === brandName)?.rate || 0;
  const brandsWithLowerRate = allRates.filter(b => b.rate < brandRate).length;
  const percentile = Math.round((brandsWithLowerRate / brandInfoWithLogos.length) * 100);
  
  return percentile;
};

// Get all brands with their mention counts and calculated tiers
export const getAllBrandMentionsWithTiers = (): Array<{ brand: string; mentions: number; percentile: number; tier: string; logo: string }> => {
  const brandInfoWithLogos = getBrandInfoWithLogos();
  const allMentions = brandInfoWithLogos.map(b => b.mention_count);
  
  return brandInfoWithLogos.map((brand) => {
    const percentile = calculatePercentile(brand.mention_count, allMentions);
    return {
      brand: brand.brand,
      mentions: brand.mention_count,
      percentile,
      tier: brand.mention_tier,
      logo: brand.logo
    };
  }).sort((a, b) => b.mentions - a.mentions);
};

// Get sources data from new sources_and_content_impact structure
export const getSourcesData = () => {
  const analytics = getAnalytics();
  const sourcesAndContentImpact = analytics?.sources_and_content_impact;
  
  if (!sourcesAndContentImpact) return [];
  
  const brandName = getBrandName();
  
  return Object.entries(sourcesAndContentImpact).map(([sourceName, sourceData]: [string, any]) => {
    const mentions = sourceData.mentions || {};
    const pagesUsed = sourceData.pages_used || [];
    
    const brandMentionData = mentions[brandName] || { count: 0, score: 0, insight: '' };
    
    const result: any = {
      name: sourceName,
      pagesUsed,
      [`${brandName}Mentions`]: brandMentionData.count,
      [`${brandName}Score`]: Math.round(brandMentionData.score * 100),
      [`${brandName}Insight`]: brandMentionData.insight,
      [`${brandName}Presence`]: brandMentionData.count > 0 ? 'Present' : 'Absent'
    };
    
    Object.entries(mentions).forEach(([brand, data]: [string, any]) => {
      if (brand !== brandName) {
        result[`${brand}Mentions`] = data.count;
        result[`${brand}Score`] = Math.round(data.score * 100);
        result[`${brand}Insight`] = data.insight;
        result[`${brand}Presence`] = data.count > 0 ? 'Present' : 'Absent';
      }
    });
    
    return result;
  });
};

// Get depth notes for the brand
export const getDepthNotes = () => {
  const analytics = getAnalytics();
  const sourcesAndContentImpact = analytics?.sources_and_content_impact;
  const brandName = getBrandName();
  
  if (!sourcesAndContentImpact) return {};
  
  const notes: Record<string, any> = {};
  
  Object.entries(sourcesAndContentImpact).forEach(([sourceName, sourceData]: [string, any]) => {
    const brandData = sourceData.mentions?.[brandName];
    if (brandData) {
      notes[sourceName] = {
        insight: brandData.insight,
        pages_used: sourceData.pages_used
      };
    }
  });
  
  return notes;
};

// LLM-wise data
export const getLlmData = () => {
  const analytics = getAnalytics();
  const llmWiseData = analytics?.llm_wise_data || {};
  
  // Calculate total number of prompts from all keywords
  const totalPrompts = getTotalPromptCount();
  
  const result: Record<string, any> = {};
  
  Object.entries(llmWiseData).forEach(([llm, data]: [string, any]) => {
    result[llm] = {
      mentions_count: data.mentions_count || 0,
      prompts: totalPrompts, // Use calculated total from all keywords
      average_rank: data.average_rank || 0,
      sources: data.sources || 0,
      // Keep original prompts value if needed for debugging
      _original_prompts: data.prompts || 0
    };
  });
  
  return result;
};

export const llmData = getLlmData();

// Recommendations
export const getRecommendations = () => {
  const analytics = getAnalytics();
  return analytics?.recommendations || [];
};

export const recommendations = getRecommendations();

// Executive Summary
export const getExecutiveSummary = () => {
  const analytics = getAnalytics();
  return analytics?.executive_summary || {
    brand_score_and_tier: '',
    strengths: [],
    weaknesses: [],
    competitor_positioning: { leaders: [], mid_tier: [], laggards: [] },
    prioritized_actions: [],
    conclusion: ''
  };
};

export const executiveSummary = getExecutiveSummary();

// Competitor sentiment data
export const getCompetitorSentiment = () => {
  const brandInfoWithLogos = getBrandInfoWithLogos();
  
  return brandInfoWithLogos.map((brand) => ({
    brand: brand.brand,
    summary: brand.summary,
    outlook: brand.outlook,
    logo: brand.logo
  }));
};

export const competitorSentiment = getCompetitorSentiment();

// Get search keywords
export const getSearchKeywords = () => {
  return getKeywords();
};

// Get sentiment for brand
export const getSentiment = () => {
  const brandName = getBrandName();
  const brandInfo = getBrandInfoWithLogos().find(b => b.brand === brandName);
  
  return { 
    dominant_sentiment: brandInfo?.outlook || 'N/A', 
    summary: brandInfo?.summary || '' 
  };
};

// Get AI visibility data
export const getAIVisibility = () => {
  const brandName = getBrandName();
  const brandInfo = getBrandInfoWithLogos().find(b => b.brand === brandName);
  
  return {
    geo_score: brandInfo?.geo_score || 0,
    brand_tier: brandInfo?.geo_tier || 'Low'
  };
};

// Get brand mentions data
export const getBrandMentions = () => {
  const brandName = getBrandName();
  const brandInfo = getBrandInfoWithLogos().find(b => b.brand === brandName);
  
  return {
    mention_count: brandInfo?.mention_count || 0,
    mention_score: brandInfo?.mention_score || 0,
    mention_tier: brandInfo?.mention_tier || 'Low'
  };
};

// Get model name
export const getModelName = () => {
  const analytics = getAnalytics();
  return analytics?.models_used || '';
};

// Get analysis date in IST
export const getAnalysisDate = () => {
  if (!currentAnalyticsData?.analytics?.[0]) return '';
  const data = currentAnalyticsData.analytics[0];
  const dateStr = data?.date || data?.updated_at || data?.created_at;
  
  return formatDateToIST(dateStr);
};

// Get total mentions across all sources for the primary brand
export const getPrimaryBrandTotalMentions = (): number => {
  const brandName = getBrandName();
  const brandInfo = getBrandInfoWithLogos().find(b => b.brand === brandName);
  return brandInfo?.mention_count || 0;
};

// Get platform presence
export const getPlatformPresence = () => {
  const analytics = getAnalytics();
  return analytics?.platform_presence || {};
};

// Get status
export const getStatus = () => {
  if (!currentAnalyticsData?.analytics?.[0]) return '';
  return currentAnalyticsData.analytics[0].status || '';
};

// Check if data is available
export const hasAnalyticsData = (): boolean => {
  return currentAnalyticsData !== null && getAnalytics() !== null;
};