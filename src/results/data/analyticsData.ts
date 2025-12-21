import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { calculatePercentile, getTierFromPercentile } from './formulas';

const ANALYTICS_STORAGE_KEY = 'new_results_analytics_data';

// Global state to hold the API response data
let currentAnalyticsData: any = null;

/**
 * Helper to format logo URL - handles both full URLs and domain-only formats
 */
const FAVICON_URL_TEMPLATE =
  import.meta.env.VITE_FAVICON_URL_TEMPLATE;

/**
 * Normalize input to a clean domain (no protocol, no www, no path)
 */
const normalizeDomain = (input: string): string =>
  input
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split('/')[0];

export const formatLogoUrl = (logo: string): string => {
  if (!logo) return '';
  if (/^https?:\/\//i.test(logo)) {
    return logo;
  }

  const domain = normalizeDomain(logo);
  const httpsWwwDomain = `https://www.${domain}`;

  return FAVICON_URL_TEMPLATE.replace(
    '{domain}',
    httpsWwwDomain
  );
};

/**
 * Convert UTC date to IST and format using date-fns and date-fns-tz
 * Properly handles timezone conversion
 */
export const formatDateToIST = (dateStr: string): string => {
  if (!dateStr) return '';
  
  try {
    // Parse the date string (assumed to be in UTC)
    const utcDate = new Date(dateStr);
    
    // Convert to IST timezone (Asia/Kolkata)
    const istDate = toZonedTime(utcDate, 'Asia/Kolkata');
    
    // Format the date in IST
    return format(istDate, 'd MMM yyyy, hh:mm a');
  } catch (error) {
    console.error('Error formatting date:', error);
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

// Get AI Visibility data using geo_score from data
// Position is calculated from brands array (sorted by geo_score ascending, so last = best)
export const getAIVisibilityMetrics = (): { 
  score: number; 
  tier: string; 
  brandPosition: number;
  totalBrands: number;
  explanation: string;
  positionBreakdown: {
    topPosition: number;
    midPosition: number;
    lowPosition: number;
  };
} => {
  const brandName = getBrandName();
  const brandInfoWithLogos = getBrandInfoWithLogos();
  
  // Find the brand's data
  const brandData = brandInfoWithLogos.find(b => b.brand === brandName);
  const score = brandData?.geo_score || 0;
  const tier = brandData?.geo_tier || 'Low';
  const totalBrands = brandInfoWithLogos.length;
  
  // Sort by geo_score descending (highest first) to calculate position
  const sortedByScore = [...brandInfoWithLogos].sort((a, b) => b.geo_score - a.geo_score);
  const brandIndex = sortedByScore.findIndex(b => b.brand === brandName);
  const brandPosition = brandIndex >= 0 ? brandIndex + 1 : totalBrands;
  
  // Calculate position breakdown from llm_wise_data
  const analytics = getAnalytics();
  const llmData = analytics?.llm_wise_data || {};
  
  let totalQueriesWithBrand = 0;
  let topPositionCount = 0;
  let midPositionCount = 0;
  let lowPositionCount = 0;
  
  // Count from each LLM
  Object.values(llmData).forEach((data: any) => {
    if (data?.queries_with_brand) {
      totalQueriesWithBrand += data.queries_with_brand;
      const avgRank = data.average_brand_rank || data.average_rank || 0;
      if (avgRank > 0) {
        if (avgRank <= 1) {
          topPositionCount += data.queries_with_brand;
        } else if (avgRank <= 4) {
          midPositionCount += data.queries_with_brand;
        } else {
          lowPositionCount += data.queries_with_brand;
        }
      }
    }
  });
  
  const queriesWithMentions = totalQueriesWithBrand || 1;
  
  const topPosition = queriesWithMentions > 0 ? Math.round((topPositionCount / queriesWithMentions) * 100) : 0;
  const midPosition = queriesWithMentions > 0 ? Math.round((midPositionCount / queriesWithMentions) * 100) : 0;
  const lowPosition = queriesWithMentions > 0 ? Math.round((lowPositionCount / queriesWithMentions) * 100) : 0;
  
  return {
    score,
    tier,
    brandPosition,
    totalBrands,
    explanation: '',
    positionBreakdown: {
      topPosition,
      midPosition,
      lowPosition
    }
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
  
  const allMentionCounts: Record<string, number> = {};
  brandInfoWithLogos.forEach(b => {
    allMentionCounts[b.brand] = b.mention_score;
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
    allBrandMentions: allMentionCounts
  };
};

// Get brand mention response rates for table display
// Shows top 2 brands + test brand with % of AI responses where brand appeared
// % = (queries where brand appeared / total queries) * 100, capped at 100%
export const getBrandMentionResponseRates = (): Array<{
  brand: string;
  responseRate: number;
  logo: string;
  isTestBrand: boolean;
}> => {
  const brandName = getBrandName();
  const brandInfoWithLogos = getBrandInfoWithLogos();
  
  // Use mention_score from brands array which is already a percentage
  const brandsWithRates = brandInfoWithLogos.map(b => {
    // mention_score from data is already a percentage value
    // Cap at 100% to ensure no values exceed maximum
    const responseRate = Math.min(b.mention_score, 100);
    
    return {
      brand: b.brand,
      responseRate,
      logo: b.logo,
      isTestBrand: b.brand === brandName
    };
  }).sort((a, b) => b.responseRate - a.responseRate);
  
  // Get top 2 brands (excluding test brand) + test brand
  const topTwoBrands = brandsWithRates.filter(b => !b.isTestBrand).slice(0, 2);
  const testBrand = brandsWithRates.find(b => b.isTestBrand);
  
  const result = [...topTwoBrands];
  if (testBrand) {
    result.push(testBrand);
  }
  
  return result;
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
  
  // Transform the new structure to a flat array
  return Object.entries(sourcesAndContentImpact).map(([sourceName, sourceData]: [string, any]) => {
    const mentions = sourceData.mentions || {};
    const pagesUsed = sourceData.pages_used || [];
    
    // Get the brand's data from mentions
    const brandMentionData = mentions[brandName] || { count: 0, score: 0, insight: '' };
    
    // Create an object with all brand mentions
    const result: any = {
      name: sourceName,
      pagesUsed,
      [`${brandName}Mentions`]: brandMentionData.count,
      [`${brandName}Score`]: Math.round(brandMentionData.score * 100), // Convert to percentage
      [`${brandName}Insight`]: brandMentionData.insight,
      [`${brandName}Presence`]: brandMentionData.count > 0 ? 'Present' : 'Absent'
    };
    
    // Add data for all other brands
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

// Get depth notes for the brand - now from sources_and_content_impact
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

// LLM-wise data - display only till sources
export const getLlmData = () => {
  const analytics = getAnalytics();
  const llmWiseData = analytics?.llm_wise_data || {};
  
  // Return data with proper field mapping
  const result: Record<string, any> = {};
  
  Object.entries(llmWiseData).forEach(([llm, data]: [string, any]) => {
    result[llm] = {
      mentions_count: data.mentions_count || 0,
      prompts: data.prompts || 0,
      average_rank: data.average_rank || 0,
      sources: data.sources || 0
    };
  });
  
  return result;
};

// Export as constant for backward compatibility
export const llmData = getLlmData();

// Recommendations
export const getRecommendations = () => {
  const analytics = getAnalytics();
  return analytics?.recommendations || [];
};

// Export as constant for backward compatibility
export const recommendations = getRecommendations();

// Executive Summary - updated field mapping
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

// Export as constant for backward compatibility
export const executiveSummary = getExecutiveSummary();

// Competitor sentiment data - now from brands array
export const getCompetitorSentiment = () => {
  const brandInfoWithLogos = getBrandInfoWithLogos();
  
  return brandInfoWithLogos.map((brand) => ({
    brand: brand.brand,
    summary: brand.summary,
    outlook: brand.outlook,
    logo: brand.logo
  }));
};

// Export as constant for backward compatibility
export const competitorSentiment = getCompetitorSentiment();

// Get search keywords (returns keyword names)
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