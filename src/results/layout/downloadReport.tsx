import { createRoot } from "react-dom/client";
import {
  getBrandName,
  getBrandWebsite,
  getBrandInfoWithLogos,
  getAnalytics,
  getExecutiveSummary,
  getRecommendations,
  getSearchKeywordsWithPrompts,
  getLlmData,
  getAIVisibilityMetrics,
  getMentionsPosition,
} from '@/results/data/analyticsData';

// Type definitions
interface SourceMention {
  count: number;
  score: number;
  insight: string;
}

interface SourceData {
  mentions: Record<string, SourceMention>;
  pages_used: string[];
}

interface LlmDataItem {
  mentions_count: number;
  prompts: number;
  average_rank: number;
  sources: number;
  t1?: number;
  t2?: number;
  t3?: number;
}

interface PrintableContentProps {
  brandName: string;
  brandWebsite: string;
  brandInfo: Array<{
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
  }>;
  executiveSummary: {
    brand_score_and_tier?: string;
    strengths?: string[];
    weaknesses?: string[];
    prioritized_actions?: string[];
    conclusion?: string;
    competitor_positioning?: {
      leaders?: Array<{ name: string; summary: string }>;
      mid_tier?: Array<{ name: string; summary: string }>;
      laggards?: Array<{ name: string; summary: string }>;
    };
  };
  recommendations: Array<{
    overall_insight: string;
    suggested_action: string;
    overall_effort: string;
    impact: string;
  }>;
  keywords: Array<{ id: string; name: string; prompts: string[] }>;
  llmData: Record<string, LlmDataItem>;
  aiVisibility: {
    score: number;
    tier: string;
    brandPosition: number;
    totalBrands: number;
    positionBreakdown?: { topPosition: number; midPosition: number; lowPosition: number };
  };
  mentionsData: {
    position: number;
    tier: string;
    totalBrands: number;
    brandMentions: number;
    topBrandMentions: number;
    allBrandMentions: Record<string, number>;
  };
  sourcesAndContentImpact: Record<string, SourceData>;
}

// Printable Report Component
const PrintableContent = ({
  brandName,
  brandWebsite,
  brandInfo,
  executiveSummary,
  recommendations,
  keywords,
  llmData,
  aiVisibility,
  mentionsData,
  sourcesAndContentImpact,
}: PrintableContentProps) => {
  // Styles
  const styles = {
    page: {
      padding: '50px',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      color: '#1a1a1a',
      fontSize: '11pt',
      lineHeight: '1.6',
      backgroundColor: '#ffffff',
    },
    coverPage: {
      textAlign: 'center' as const,
      paddingTop: '200px',
      paddingBottom: '200px',
      pageBreakAfter: 'always' as const,
      borderBottom: '3px solid #2563eb',
    },
    mainTitle: {
      fontSize: '42px',
      fontWeight: '700',
      marginBottom: '20px',
      color: '#1e40af',
      letterSpacing: '-0.5px',
    },
    brandTitle: {
      fontSize: '32px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '12px',
    },
    websiteText: {
      fontSize: '16px',
      color: '#6b7280',
      marginBottom: '60px',
    },
    dateText: {
      fontSize: '14px',
      color: '#9ca3af',
      fontStyle: 'italic' as const,
    },
    section: {
      pageBreakBefore: 'auto' as const,
      pageBreakAfter: 'auto' as const,
      pageBreakInside: 'avoid' as const,
      marginBottom: '40px',
    },
    sectionHeader: {
      fontSize: '24px',
      fontWeight: '700',
      marginBottom: '24px',
      marginTop: '32px',
      paddingBottom: '12px',
      borderBottom: '3px solid #2563eb',
      color: '#1e40af',
    },
    subsectionHeader: {
      fontSize: '18px',
      fontWeight: '600',
      marginBottom: '16px',
      marginTop: '24px',
      color: '#1f2937',
    },
    subsubsectionHeader: {
      fontSize: '15px',
      fontWeight: '600',
      marginBottom: '12px',
      marginTop: '16px',
      color: '#374151',
    },
    card: {
      padding: '20px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      marginBottom: '20px',
      border: '1px solid #e5e7eb',
      pageBreakInside: 'avoid' as const,
    },
    metricCard: {
      padding: '24px',
      backgroundColor: '#eff6ff',
      borderRadius: '8px',
      marginBottom: '20px',
      border: '2px solid #bfdbfe',
      textAlign: 'center' as const,
      pageBreakInside: 'avoid' as const,
    },
    metricValue: {
      fontSize: '48px',
      fontWeight: '700',
      color: '#1e40af',
      marginBottom: '8px',
    },
    metricLabel: {
      fontSize: '14px',
      color: '#6b7280',
      fontWeight: '600',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      marginTop: '16px',
      marginBottom: '24px',
      fontSize: '10pt',
    },
    tableHeader: {
      border: '1px solid #d1d5db',
      padding: '12px',
      textAlign: 'left' as const,
      backgroundColor: '#1e40af',
      color: '#ffffff',
      fontWeight: '600',
      fontSize: '11pt',
    },
    tableCell: {
      border: '1px solid #d1d5db',
      padding: '10px',
      backgroundColor: '#ffffff',
    },
    tableRowAlt: {
      backgroundColor: '#f9fafb',
    },
    badge: {
      display: 'inline-block',
      padding: '6px 12px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: '600',
      marginRight: '8px',
      marginBottom: '8px',
    },
    list: {
      listStyleType: 'disc' as const,
      paddingLeft: '24px',
      marginBottom: '16px',
    },
    listItem: {
      marginBottom: '8px',
      lineHeight: '1.6',
    },
    footer: {
      marginTop: '60px',
      paddingTop: '24px',
      borderTop: '2px solid #e5e7eb',
      textAlign: 'center' as const,
      color: '#9ca3af',
      fontSize: '10pt',
    },
  };

  // Helper function for tier badges
  const getTierBadgeStyle = (tier: string) => {
    const baseStyle = { ...styles.badge };
    switch (tier?.toLowerCase()) {
      case 'high':
        return { ...baseStyle, backgroundColor: '#d1fae5', color: '#065f46' };
      case 'medium':
        return { ...baseStyle, backgroundColor: '#fef3c7', color: '#92400e' };
      case 'low':
        return { ...baseStyle, backgroundColor: '#fee2e2', color: '#991b1b' };
      default:
        return { ...baseStyle, backgroundColor: '#f3f4f6', color: '#374151' };
    }
  };

  // Helper function for impact/effort badges
  const getImpactBadgeStyle = (level: string) => {
    const baseStyle = { ...styles.badge };
    switch (level?.toLowerCase()) {
      case 'high':
        return { ...baseStyle, backgroundColor: '#dcfce7', color: '#166534' };
      case 'medium':
        return { ...baseStyle, backgroundColor: '#fef3c7', color: '#92400e' };
      case 'low':
        return { ...baseStyle, backgroundColor: '#dbeafe', color: '#1e40af' };
      default:
        return { ...baseStyle, backgroundColor: '#f3f4f6', color: '#374151' };
    }
  };

  // Helper function for outlook badges
  const getOutlookBadgeStyle = (outlook: string) => {
    const baseStyle = { ...styles.badge };
    switch (outlook?.toLowerCase()) {
      case 'positive':
        return { ...baseStyle, backgroundColor: '#d1fae5', color: '#065f46' };
      case 'neutral':
        return { ...baseStyle, backgroundColor: '#fef3c7', color: '#92400e' };
      case 'negative':
        return { ...baseStyle, backgroundColor: '#fee2e2', color: '#991b1b' };
      default:
        return { ...baseStyle, backgroundColor: '#f3f4f6', color: '#374151' };
    }
  };

  // Calculate total prompts
  const totalPrompts = keywords.reduce((sum, kw) => sum + (kw.prompts?.length || 0), 0);
  
  // Calculate total mentions
  const totalMentions = Object.values(llmData).reduce((sum, llm) => sum + (llm.mentions_count || 0), 0);

  // Sort brands by geo_score for consistent display
  const sortedBrands = [...brandInfo].sort((a, b) => b.geo_score - a.geo_score);

  return (
    <div style={styles.page}>
      {/* Cover Page */}
      <div style={styles.coverPage}>
        <h1 style={styles.mainTitle}>AI Visibility Analysis Report</h1>
        <h2 style={styles.brandTitle}>{brandName}</h2>
        <p style={styles.websiteText}>{brandWebsite}</p>
        <div style={{ marginTop: '80px' }}>
          <p style={styles.dateText}>
            Report Generated: {new Date().toLocaleDateString('en-US', { 
              weekday: 'long',
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      {/* Table of Contents */}
      <div style={{ pageBreakAfter: 'always' }}>
        <h2 style={styles.sectionHeader}>Table of Contents</h2>
        <div style={{ paddingLeft: '20px', lineHeight: '2' }}>
          <p><strong>1. Executive Overview</strong> ..................................................... 3</p>
          <p style={{ paddingLeft: '20px' }}>1.1 Key Metrics Summary</p>
          <p style={{ paddingLeft: '20px' }}>1.2 Performance Snapshot</p>
          <p><strong>2. Executive Summary</strong> .................................................... 5</p>
          <p style={{ paddingLeft: '20px' }}>2.1 Brand Score & Positioning</p>
          <p style={{ paddingLeft: '20px' }}>2.2 Strengths & Weaknesses Analysis</p>
          <p style={{ paddingLeft: '20px' }}>2.3 Competitor Positioning</p>
          <p><strong>3. Detailed Performance Analysis</strong> .................................. 7</p>
          <p style={{ paddingLeft: '20px' }}>3.1 LLM-wise Performance Breakdown</p>
          <p style={{ paddingLeft: '20px' }}>3.2 Competitive Landscape</p>
          <p style={{ paddingLeft: '20px' }}>3.3 Search Query Analysis</p>
          <p><strong>4. Sources & Content Impact</strong> ....................................... 12</p>
          <p style={{ paddingLeft: '20px' }}>4.1 Source Category Breakdown</p>
          <p style={{ paddingLeft: '20px' }}>4.2 Brand Mentions by Source</p>
          <p><strong>5. Strategic Recommendations</strong> ..................................... 15</p>
          <p style={{ paddingLeft: '20px' }}>5.1 Prioritized Action Items</p>
          <p style={{ paddingLeft: '20px' }}>5.2 Implementation Roadmap</p>
          <p><strong>6. Appendix</strong> ............................................................. 18</p>
          <p style={{ paddingLeft: '20px' }}>6.1 Competitor Sentiment Analysis</p>
          <p style={{ paddingLeft: '20px' }}>6.2 Methodology Notes</p>
        </div>
      </div>

      {/* Section 1: Executive Overview */}
      <div style={{ pageBreakAfter: 'always' }}>
        <h2 style={styles.sectionHeader}>1. Executive Overview</h2>
        
        <h3 style={styles.subsectionHeader}>1.1 Key Metrics Summary</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '30px' }}>
          <div style={styles.metricCard}>
            <div style={styles.metricValue}>{aiVisibility?.score || 0}</div>
            <div style={styles.metricLabel}>AI Visibility Score</div>
            <div style={{ marginTop: '12px' }}>
              <span style={getTierBadgeStyle(aiVisibility?.tier)}>{aiVisibility?.tier || 'N/A'} Tier</span>
            </div>
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '12px' }}>
              Ranked #{aiVisibility?.brandPosition || 0} of {aiVisibility?.totalBrands || 0} brands
            </p>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricValue}>{mentionsData?.brandMentions || 0}</div>
            <div style={styles.metricLabel}>Total Mentions</div>
            <div style={{ marginTop: '12px' }}>
              <span style={getTierBadgeStyle(mentionsData?.tier)}>{mentionsData?.tier || 'N/A'} Tier</span>
            </div>
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '12px' }}>
              Ranked #{mentionsData?.position || 0} of {mentionsData?.totalBrands || 0} brands
            </p>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricValue}>{totalPrompts}</div>
            <div style={styles.metricLabel}>Prompts Analyzed</div>
            <div style={{ marginTop: '12px' }}>
              <span style={{ ...styles.badge, backgroundColor: '#e0e7ff', color: '#3730a3' }}>
                {keywords.length} Keywords
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '12px' }}>
              Across {Object.keys(llmData).length} LLM platforms
            </p>
          </div>
        </div>

        <h3 style={styles.subsectionHeader}>1.2 Performance Snapshot</h3>
        
        {/* Position Breakdown */}
        {aiVisibility?.positionBreakdown && (
          <div style={styles.card}>
            <h4 style={styles.subsubsectionHeader}>Ranking Distribution</h4>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'space-around', marginTop: '16px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#16a34a' }}>
                  {aiVisibility.positionBreakdown.topPosition}%
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Top 3 Rankings</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#ca8a04' }}>
                  {aiVisibility.positionBreakdown.midPosition}%
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Position 4-7</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#dc2626' }}>
                  {aiVisibility.positionBreakdown.lowPosition}%
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Position 8+</div>
              </div>
            </div>
          </div>
        )}

        {/* LLM Performance Summary */}
        <div style={styles.card}>
          <h4 style={styles.subsubsectionHeader}>LLM Performance Overview</h4>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Platform</th>
                <th style={styles.tableHeader}>Mentions</th>
                <th style={styles.tableHeader}>Prompts Analyzed</th>
                <th style={styles.tableHeader}>Avg Rank</th>
                <th style={styles.tableHeader}>Sources</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(llmData).map(([llm, data], idx) => (
                <tr key={idx} style={idx % 2 === 1 ? styles.tableRowAlt : {}}>
                  <td style={{ ...styles.tableCell, fontWeight: '600', textTransform: 'capitalize' }}>{llm}</td>
                  <td style={styles.tableCell}>{data.mentions_count}</td>
                  <td style={styles.tableCell}>{totalPrompts}</td>
                  <td style={styles.tableCell}>{data.average_rank > 0 ? data.average_rank.toFixed(1) : 'N/A'}</td>
                  <td style={styles.tableCell}>{data.sources}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Executive Summary */}
      <div style={{ pageBreakAfter: 'always' }}>
        <h2 style={styles.sectionHeader}>2. Executive Summary</h2>
        
        <h3 style={styles.subsectionHeader}>2.1 Brand Score & Positioning</h3>
        {executiveSummary?.brand_score_and_tier && (
          <div style={styles.card}>
            <p style={{ fontSize: '13pt', lineHeight: '1.8' }}>{executiveSummary.brand_score_and_tier}</p>
          </div>
        )}

        <h3 style={styles.subsectionHeader}>2.2 Strengths & Weaknesses Analysis</h3>
        
        {executiveSummary?.strengths && executiveSummary.strengths.length > 0 && (
          <div style={styles.card}>
            <h4 style={{ ...styles.subsubsectionHeader, color: '#16a34a' }}>
              ✓ Key Strengths
            </h4>
            <ul style={styles.list}>
              {executiveSummary.strengths.map((strength, idx) => (
                <li key={idx} style={styles.listItem}>{strength}</li>
              ))}
            </ul>
          </div>
        )}

        {executiveSummary?.weaknesses && executiveSummary.weaknesses.length > 0 && (
          <div style={styles.card}>
            <h4 style={{ ...styles.subsubsectionHeader, color: '#dc2626' }}>
              ✗ Areas for Improvement
            </h4>
            <ul style={styles.list}>
              {executiveSummary.weaknesses.map((weakness, idx) => (
                <li key={idx} style={styles.listItem}>{weakness}</li>
              ))}
            </ul>
          </div>
        )}

        {executiveSummary?.conclusion && (
          <div style={styles.card}>
            <h4 style={styles.subsubsectionHeader}>Strategic Conclusion</h4>
            <p style={{ lineHeight: '1.8' }}>{executiveSummary.conclusion}</p>
          </div>
        )}

        <h3 style={styles.subsectionHeader}>2.3 Competitor Positioning</h3>
        
        {executiveSummary?.competitor_positioning && (
          <>
            {executiveSummary.competitor_positioning.leaders && executiveSummary.competitor_positioning.leaders.length > 0 && (
              <div style={styles.card}>
                <h4 style={{ ...styles.subsubsectionHeader, color: '#16a34a' }}>
                  🏆 Market Leaders
                </h4>
                {executiveSummary.competitor_positioning.leaders.map((item, idx) => (
                  <div key={idx} style={{ marginBottom: '12px', paddingLeft: '12px', borderLeft: '3px solid #16a34a' }}>
                    <p style={{ fontWeight: '600', marginBottom: '4px' }}>{item.name}</p>
                    <p style={{ color: '#4b5563', fontSize: '11pt' }}>{item.summary}</p>
                  </div>
                ))}
              </div>
            )}

            {executiveSummary.competitor_positioning.mid_tier && executiveSummary.competitor_positioning.mid_tier.length > 0 && (
              <div style={styles.card}>
                <h4 style={{ ...styles.subsubsectionHeader, color: '#ca8a04' }}>
                  ⚡ Mid-Tier Performers
                </h4>
                {executiveSummary.competitor_positioning.mid_tier.map((item, idx) => (
                  <div key={idx} style={{ marginBottom: '12px', paddingLeft: '12px', borderLeft: '3px solid #ca8a04' }}>
                    <p style={{ fontWeight: '600', marginBottom: '4px' }}>{item.name}</p>
                    <p style={{ color: '#4b5563', fontSize: '11pt' }}>{item.summary}</p>
                  </div>
                ))}
              </div>
            )}

            {executiveSummary.competitor_positioning.laggards && executiveSummary.competitor_positioning.laggards.length > 0 && (
              <div style={styles.card}>
                <h4 style={{ ...styles.subsubsectionHeader, color: '#dc2626' }}>
                  📊 Emerging Players
                </h4>
                {executiveSummary.competitor_positioning.laggards.map((item, idx) => (
                  <div key={idx} style={{ marginBottom: '12px', paddingLeft: '12px', borderLeft: '3px solid #dc2626' }}>
                    <p style={{ fontWeight: '600', marginBottom: '4px' }}>{item.name}</p>
                    <p style={{ color: '#4b5563', fontSize: '11pt' }}>{item.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Section 3: Detailed Performance Analysis */}
      <div style={{ pageBreakAfter: 'always' }}>
        <h2 style={styles.sectionHeader}>3. Detailed Performance Analysis</h2>
        
        <h3 style={styles.subsectionHeader}>3.1 Competitive Landscape</h3>
        
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>Rank</th>
              <th style={styles.tableHeader}>Brand</th>
              <th style={styles.tableHeader}>Visibility Score</th>
              <th style={styles.tableHeader}>Tier</th>
              <th style={styles.tableHeader}>Mentions</th>
              <th style={styles.tableHeader}>Mention Tier</th>
              <th style={styles.tableHeader}>Outlook</th>
            </tr>
          </thead>
          <tbody>
            {sortedBrands.map((brand, idx) => {
              const isCurrentBrand = brand.brand === brandName;
              return (
                <tr 
                  key={idx} 
                  style={{
                    ...(idx % 2 === 1 ? styles.tableRowAlt : {}),
                    backgroundColor: isCurrentBrand ? '#eff6ff' : (idx % 2 === 1 ? '#f9fafb' : '#ffffff'),
                    fontWeight: isCurrentBrand ? '600' : 'normal',
                  }}
                >
                  <td style={styles.tableCell}>{idx + 1}</td>
                  <td style={styles.tableCell}>{brand.brand}</td>
                  <td style={styles.tableCell}>{brand.geo_score}</td>
                  <td style={styles.tableCell}>
                    <span style={getTierBadgeStyle(brand.geo_tier)}>{brand.geo_tier}</span>
                  </td>
                  <td style={styles.tableCell}>{brand.mention_score}</td>
                  <td style={styles.tableCell}>
                    <span style={getTierBadgeStyle(brand.mention_tier)}>{brand.mention_tier}</span>
                  </td>
                  <td style={styles.tableCell}>
                    <span style={getOutlookBadgeStyle(brand.outlook)}>{brand.outlook}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <h3 style={styles.subsectionHeader}>3.2 Search Query Analysis</h3>
        
        {keywords && keywords.length > 0 && keywords.map((kw, idx) => (
          <div key={idx} style={{ ...styles.card, pageBreakInside: 'avoid' }}>
            <h4 style={styles.subsubsectionHeader}>
              Keyword {idx + 1}: {kw.name}
            </h4>
            <p style={{ fontSize: '11pt', color: '#6b7280', marginBottom: '12px' }}>
              {kw.prompts?.length || 0} prompts analyzed
            </p>
            <table style={{ ...styles.table, fontSize: '10pt' }}>
              <thead>
                <tr>
                  <th style={{ ...styles.tableHeader, width: '60px' }}>#</th>
                  <th style={styles.tableHeader}>Search Prompt</th>
                </tr>
              </thead>
              <tbody>
                {kw.prompts.map((prompt, pIdx) => (
                  <tr key={pIdx} style={pIdx % 2 === 1 ? styles.tableRowAlt : {}}>
                    <td style={styles.tableCell}>{pIdx + 1}</td>
                    <td style={styles.tableCell}>{prompt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Section 4: Sources & Content Impact */}
      {sourcesAndContentImpact && Object.keys(sourcesAndContentImpact).length > 0 && (
        <div style={{ pageBreakBefore: 'always' }}>
          <h2 style={styles.sectionHeader}>4. Sources & Content Impact</h2>
          
          <p style={{ marginBottom: '24px', color: '#4b5563' }}>
            This section analyzes how different content sources impact brand visibility across AI platforms. 
            Understanding source authority and mention patterns helps identify opportunities for strategic content optimization.
          </p>

          {Object.entries(sourcesAndContentImpact).map(([sourceName, sourceData]: [string, any], idx) => (
            <div key={idx} style={{ ...styles.card, pageBreakInside: 'avoid', marginBottom: '32px' }}>
              <h3 style={{ ...styles.subsectionHeader, marginTop: '0' }}>{sourceName}</h3>
              
              {/* Pages Used */}
              {sourceData.pages_used && sourceData.pages_used.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ ...styles.subsubsectionHeader, fontSize: '13px' }}>
                    Referenced Sources ({sourceData.pages_used.length})
                  </h4>
                  <ul style={{ ...styles.list, fontSize: '9pt', color: '#4b5563' }}>
                    {sourceData.pages_used.map((url: string, urlIdx: number) => (
                      <li key={urlIdx} style={{ marginBottom: '4px', wordBreak: 'break-all' }}>{url}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Brand Mentions Table */}
              {sourceData.mentions && Object.keys(sourceData.mentions).length > 0 && (
                <>
                  <h4 style={{ ...styles.subsubsectionHeader, fontSize: '13px' }}>Brand Mentions Analysis</h4>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.tableHeader}>Brand</th>
                        <th style={styles.tableHeader}>Mention Count</th>
                        <th style={styles.tableHeader}>Impact Score</th>
                        <th style={styles.tableHeader}>Strategic Insight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(sourceData.mentions)
                        .sort(([, a]: [string, any], [, b]: [string, any]) => b.count - a.count)
                        .map(([brand, mentionData]: [string, any], mIdx: number) => {
                          const isCurrentBrand = brand === brandName;
                          return (
                            <tr 
                              key={mIdx} 
                              style={{
                                ...(mIdx % 2 === 1 ? styles.tableRowAlt : {}),
                                backgroundColor: isCurrentBrand ? '#eff6ff' : (mIdx % 2 === 1 ? '#f9fafb' : '#ffffff'),
                                fontWeight: isCurrentBrand ? '600' : 'normal',
                              }}
                            >
                              <td style={styles.tableCell}>{brand}</td>
                              <td style={styles.tableCell}>{mentionData.count}</td>
                              <td style={styles.tableCell}>{Math.round(mentionData.score * 100)}%</td>
                              <td style={{ ...styles.tableCell, fontSize: '10pt' }}>{mentionData.insight}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Section 5: Strategic Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div style={{ pageBreakBefore: 'always' }}>
          <h2 style={styles.sectionHeader}>5. Strategic Recommendations</h2>
          
          <h3 style={styles.subsectionHeader}>5.1 Prioritized Action Items</h3>
          
          {recommendations.map((rec, idx) => (
            <div key={idx} style={{ ...styles.card, pageBreakInside: 'avoid', marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <h4 style={{ ...styles.subsubsectionHeader, marginTop: '0' }}>
                Recommendation {idx + 1}
              </h4>
              </div>
              <span style={getImpactBadgeStyle(rec.impact)}>
                  Impact: {rec.impact}
                </span>
                <span style={getImpactBadgeStyle(rec.overall_effort)}>
                  Effort: {rec.overall_effort}
                </span>
              <div style={{ marginBottom: '16px' }}>
                <h5 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                  Strategic Insight
                </h5>
                <p style={{ fontSize: '11pt', lineHeight: '1.7', color: '#4b5563' }}>
                  {rec.overall_insight}
                </p>
              </div>
              
              <div>
                <h5 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                  Suggested Action
                </h5>
                <p style={{ fontSize: '11pt', lineHeight: '1.7', color: '#1f2937' }}>
                  {rec.suggested_action}
                </p>
              </div>
            </div>
          ))}

          <h3 style={styles.subsectionHeader}>5.2 Implementation Roadmap</h3>
          
          {executiveSummary?.prioritized_actions && executiveSummary.prioritized_actions.length > 0 && (
            <div style={styles.card}>
              <h4 style={styles.subsubsectionHeader}>Priority Actions</h4>
              <ol style={{ paddingLeft: '24px', margin: '0' }}>
                {executiveSummary.prioritized_actions.map((action, idx) => (
                  <li key={idx} style={{ marginBottom: '12px', lineHeight: '1.7' }}>{idx+1}. {action}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Section 6: Appendix */}
      <div style={{ pageBreakBefore: 'always' }}>
        <h2 style={styles.sectionHeader}>6. Appendix</h2>
        
        <h3 style={styles.subsectionHeader}>6.1 Competitor Sentiment Analysis</h3>
        
        {sortedBrands.map((brand, idx) => (
          <div key={idx} style={{ ...styles.card, pageBreakInside: 'avoid' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ ...styles.subsubsectionHeader, margin: '0' }}>{brand.brand}</h4>
              <span style={getOutlookBadgeStyle(brand.outlook)}>{brand.outlook}</span>
            </div>
            
            <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '10pt', color: '#6b7280', fontWeight: '600' }}>Visibility Score: </span>
                <span style={{ fontSize: '10pt', color: '#1f2937', fontWeight: '600' }}>{brand.geo_score}</span>
              </div>
              <div>
                <span style={{ fontSize: '10pt', color: '#6b7280', fontWeight: '600' }}>Mentions: </span>
                <span style={{ fontSize: '10pt', color: '#1f2937', fontWeight: '600' }}>{brand.mention_score}</span>
              </div>
              <div>
                <span style={getTierBadgeStyle(brand.geo_tier)}>{brand.geo_tier} Tier</span>
              </div>
            </div>
            
            <p style={{ fontSize: '11pt', lineHeight: '1.7', color: '#4b5563', margin: '0' }}>
              {brand.summary}
            </p>
          </div>
        ))}

        <h3 style={styles.subsectionHeader}>6.2 Methodology Notes</h3>
        
        <div style={styles.card}>
          <h4 style={styles.subsubsectionHeader}>Data Collection</h4>
          <p style={{ marginBottom: '12px' }}>
            This analysis was conducted by querying multiple AI language models (LLMs) including {Object.keys(llmData).join(', ')} 
            across {keywords.length} keyword categories with a total of {totalPrompts} unique prompts.
          </p>
          
          <h4 style={styles.subsubsectionHeader}>Scoring Methodology</h4>
          <p style={{ marginBottom: '12px' }}>
            <strong>AI Visibility Score:</strong> Calculated based on brand ranking positions across all queries, 
            weighted by mention frequency and source authority.
          </p>
          <p style={{ marginBottom: '12px' }}>
            <strong>Tier Classification:</strong> Brands are classified into High, Medium, or Low tiers based on 
            their relative performance within the competitive set.
          </p>
          
          <h4 style={styles.subsubsectionHeader}>Source Analysis</h4>
          <p style={{ marginBottom: '12px' }}>
            Sources are categorized by type and authority. The impact score reflects how frequently and prominently 
            each brand appears in specific source categories, helping identify content optimization opportunities.
          </p>
          
          <h4 style={styles.subsubsectionHeader}>Limitations</h4>
          <p style={{ marginBottom: '0' }}>
            This analysis represents a snapshot in time and may not capture real-time changes in AI model outputs. 
            Results are based on the specific prompts tested and may vary with different query formulations.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <p style={{ marginBottom: '8px', fontWeight: '600' }}>
          Generated by GeoRankers AI Visibility Analysis Platform
        </p>
        <p style={{ margin: '0' }}>
          {new Date().toLocaleDateString('en-US', { 
            day: 'numeric',
            month: 'long', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
    </div>
  );
};

// Generate Report Function
export const generateReport = (toast: (props: { title: string; description: string; variant?: "default" | "destructive"; duration?: number }) => void) => {
  // Gather all data upfront before rendering
  const brandName = getBrandName();
  const brandWebsite = getBrandWebsite();
  const analytics = getAnalytics();
  const brandInfo = getBrandInfoWithLogos();
  const executiveSummary = getExecutiveSummary();
  const recommendations = getRecommendations();
  const keywords = getSearchKeywordsWithPrompts();
  const llmData = getLlmData();
  const aiVisibility = getAIVisibilityMetrics();
  const mentionsData = getMentionsPosition();
  const sourcesAndContentImpact = analytics?.sources_and_content_impact || {};

  // Check if data is available
  if (!brandName || brandInfo.length === 0) {
    toast({
      title: "No Data Available",
      description: "Please wait for the analysis to complete before generating a report.",
      variant: "destructive",
    });
    return false;
  }

  toast({
    title: "Generating Report",
    description: "Preparing your comprehensive report...",
    duration: 2000,
  });

  // Create a hidden container for the full report
  let printContainer = document.getElementById("print-report-container") as HTMLDivElement;
  
  if (!printContainer) {
    printContainer = document.createElement("div");
    printContainer.id = "print-report-container";
    printContainer.style.display = "none";
    document.body.appendChild(printContainer);
  }

  // Mount the full report content with all data passed as props
  const root = createRoot(printContainer);
  root.render(
    <PrintableContent 
      brandName={brandName}
      brandWebsite={brandWebsite}
      brandInfo={brandInfo}
      executiveSummary={executiveSummary}
      recommendations={recommendations}
      keywords={keywords}
      llmData={llmData}
      aiVisibility={aiVisibility}
      mentionsData={mentionsData}
      sourcesAndContentImpact={sourcesAndContentImpact}
    />
  );

  // Add print styles dynamically
  const printStyleId = "print-report-styles";
  let styleSheet = document.getElementById(printStyleId) as HTMLStyleElement;

  if (!styleSheet) {
    styleSheet = document.createElement("style");
    styleSheet.id = printStyleId;
    document.head.appendChild(styleSheet);
  }

  styleSheet.textContent = `
    @media print {
      @page {
        size: A4;
        margin: 15mm;
      }
      
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* Hide everything except the print container */
      body > *:not(#print-report-container) {
        display: none !important;
      }
      
      #print-report-container {
        display: block !important;
      }
      
      /* Hide UI elements */
      header, nav, .fixed, button, .sidebar, [data-sidebar] {
        display: none !important;
      }
      
      /* Remove shadows and transitions */
      * {
        box-shadow: none !important;
        transition: none !important;
        animation: none !important;
      }
    }
    
    @media screen {
      #print-report-container {
        display: none !important;
      }
    }
  `;

  // Small delay to ensure component renders, then trigger print
  setTimeout(() => {
    printContainer.style.display = "block";
    window.print();

    // Cleanup after print
    setTimeout(() => {
      printContainer.style.display = "none";
      root.unmount();
    }, 1000);
  }, 500);

  return true;
};