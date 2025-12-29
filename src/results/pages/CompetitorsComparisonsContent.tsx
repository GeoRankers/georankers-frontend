import {
  getAnalytics,
  getCompetitorData,
  getCompetitorSentiment,
  getCompetitorVisibility,
  getBrandName,
  getKeywords,
  getBrandLogo,
  getBrandInfoWithLogos,
  getSourcesData,
} from "@/results/data/analyticsData";
import { TierBadge } from "@/results/ui/TierBadge";
import { useState, useMemo, useEffect } from "react";
import {
  Trophy,
  Users,
  TrendingUp,
  Info,
  BarChart3,
  MessageCircle,
  Layers,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const CompetitorsComparisonsContent = () => {
  const analytics = getAnalytics();
  const visibilityTable = analytics?.competitor_visibility_table;
  const brandName = getBrandName();
  const keywords = getKeywords();
  const competitorVisibility = getCompetitorVisibility();
  const brandInfo = getBrandInfoWithLogos();
  const competitorData = getCompetitorData();
  const competitorSentiment = getCompetitorSentiment();
  const sourcesDataRaw = getSourcesData();

  const otherCompetitors = competitorData.filter((c) => c.name !== brandName);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>("");

  // Set initial selected competitor when data loads
  useEffect(() => {
    if (otherCompetitors.length > 0 && !selectedCompetitor) {
      setSelectedCompetitor(otherCompetitors[0]?.name || "");
    }
  }, [otherCompetitors, selectedCompetitor]);

  const brand = competitorVisibility.find((c) => c.brand === brandName);
  const competitor = competitorVisibility.find(
    (c) => c.brand === selectedCompetitor
  );

  const brandSentiment = competitorSentiment.find((s) => s.brand === brandName);
  const competitorSentimentData = competitorSentiment.find(
    (s) => s.brand === selectedCompetitor
  );

  const brandLogo = getBrandLogo(brandName);
  const competitorLogo = getBrandLogo(selectedCompetitor);

  const sortedCompetitorData = useMemo(() => {
    const sorted = [...competitorData].sort((a, b) => {
      const totalA = a.keywordScores.reduce(
        (sum, score) => sum + (Number(score) || 0),
        0
      );
      const totalB = b.keywordScores.reduce(
        (sum, score) => sum + (Number(score) || 0),
        0
      );
      return totalB - totalA;
    });

    // Move primary brand to the end
    const primaryBrandIndex = sorted.findIndex((c) => c.name === brandName);
    if (primaryBrandIndex !== -1) {
      const primaryBrand = sorted.splice(primaryBrandIndex, 1)[0];
      sorted.push(primaryBrand);
    }

    return sorted;
  }, [competitorData, brandName]);

  // Sort competitor sentiment with primary brand at the end
  const sortedCompetitorSentiment = useMemo(() => {
    const sorted = [...competitorSentiment];
    const primaryBrandIndex = sorted.findIndex((s) => s.brand === brandName);
    if (primaryBrandIndex !== -1) {
      const primaryBrand = sorted.splice(primaryBrandIndex, 1)[0];
      sorted.push(primaryBrand);
    }
    return sorted;
  }, [competitorSentiment, brandName]);

  // Get all brand names for the source citations table with primary brand at the end
  const allBrandNames = useMemo(() => {
    const brands = competitorData.map((c) => c.name);
    const primaryBrandIndex = brands.findIndex((b) => b === brandName);
    if (primaryBrandIndex !== -1) {
      const primaryBrand = brands.splice(primaryBrandIndex, 1)[0];
      brands.push(primaryBrand);
    }
    return brands;
  }, [competitorData, brandName]);

  // Convert sourcesData object to array format with correct structure
  const sourcesData = useMemo(() => {
    if (!sourcesDataRaw || typeof sourcesDataRaw !== 'object') {
      return [];
    }

    return Object.entries(sourcesDataRaw).map(([sourceName, sourceData]: [string, any]) => {
      const row: any = { name: sourceName };
      
      // Extract mentions for each brand from the nested mentions object
      if (sourceData && sourceData.mentions && typeof sourceData.mentions === 'object') {
        allBrandNames.forEach(brand => {
          const brandMentionData = sourceData.mentions[brand];
          // Get the count from the brand's mention data
          row[`${brand}Mentions`] = brandMentionData?.count || 0;
        });
      } else {
        // If no mentions data, set all brands to 0
        allBrandNames.forEach(brand => {
          row[`${brand}Mentions`] = 0;
        });
      }
      
      return row;
    });
  }, [sourcesDataRaw, allBrandNames]);

  return (
    <div className="p-4 md:p-6 space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/20 p-4 md:p-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Trophy className="w-6 h-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-foreground">
                Competitor Analysis
              </h1>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-card border border-border">
                  <p>
                    Comprehensive analysis of your brand's visibility compared
                    to competitors across AI platforms.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-sm text-muted-foreground">
              See who's winning the AI visibility race in your industry
            </p>
          </div>
        </div>
      </div>

      {/* Card 1: AI Visibility Score Comparison */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 md:p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              Keyword Performance Matrix
            </h3>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-card border border-border">
                <p>
                  Compares how often each brand appears in AI-generated
                  responses for each keyword. Higher mention count indicate
                  stronger visibility in AI search results.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Who wins each keyword battle in AI responses
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Brand
                </th>
                {keywords.map((keyword, idx) => (
                  <th
                    key={`kw-${idx}`}
                    className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    {keyword}
                  </th>
                ))}
                <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedCompetitorData.map((c) => {
                const isPrimaryBrand = c.name === brandName;
                return (
                  <tr
                    key={c.name}
                    className={`border-b border-border/50 transition-colors ${
                      isPrimaryBrand ? "bg-primary/20" : ""
                    }`}
                  >
                    <td className="py-3 px-4 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        {c.logo ? (
                          <img
                            src={c.logo}
                            alt={c.name}
                            className="w-6 h-6 rounded-full object-contain bg-white shadow-sm"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              isPrimaryBrand
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {c.name[0]}
                          </div>
                        )}
                        <span className="text-sm font-semibold">{c.name}</span>
                      </div>
                    </td>
                    {c.keywordScores.map((score, idx) => (
                      <td
                        key={idx}
                        className="py-3 px-4 text-center text-foreground text-sm"
                      >
                        {score}
                      </td>
                    ))}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-3 py-1.5 rounded-lg font-semibold text-sm ${
                          isPrimaryBrand
                            ? "bg-primary text-white"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        {c.keywordScores.reduce(
                          (sum, score) => sum + (Number(score) || 0),
                          0
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Card 2: Competitor Sentiment Analysis */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 md:p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              AI Brand Perception
            </h3>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-card border border-border">
                <p>
                  Analysis of how AI models portray each brand in their
                  responses, including sentiment summary and overall outlook.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            What AI is saying about you and your competitors
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Brand
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Sentiment Summary
                </th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Overall Outlook
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedCompetitorSentiment.map((sentiment) => {
                const isPrimaryBrand = sentiment.brand === brandName;
                return (
                  <tr
                    key={sentiment.brand}
                    className={`border-b border-border/50 transition-colors ${
                      isPrimaryBrand ? "bg-primary/20" : ""
                    }`}
                  >
                    <td className="py-3 px-4 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        {sentiment.logo ? (
                          <img
                            src={sentiment.logo}
                            alt={sentiment.brand}
                            className="w-6 h-6 rounded-full object-contain bg-white shadow-sm"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              isPrimaryBrand
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {sentiment.brand[0]}
                          </div>
                        )}
                        <span className="text-sm font-semibold">
                          {sentiment.brand}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground max-w-md">
                      {sentiment.summary}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <TierBadge tier={sentiment.outlook} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Card 3: Number of Source Citations */}
      {sourcesData.length > 0 && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 md:p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">
                Source Authority Map
              </h3>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-card border border-border">
                  <p>
                    Mentions of each brand across different sources as referenced
                    by AI models.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Which content channels are driving AI recommendations
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[200px]">
                    Source
                  </th>
                  {allBrandNames.map((brand) => {
                    const isPrimaryBrand = brand === brandName;
                    return (
                      <th
                        key={brand}
                        className={`text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider min-w-[100px] ${
                          isPrimaryBrand
                            ? "bg-primary/30"
                            : "text-muted-foreground"
                        }`}
                      >
                        <div className="truncate" title={brand}>
                          {brand}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {sourcesData.map((source: any) => (
                  <tr
                    key={source.name}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-foreground text-sm">
                      {source.name}
                    </td>
                    {allBrandNames.map((brand) => {
                      const mentions = source[`${brand}Mentions`] || 0;
                      const isPrimaryBrand = brand === brandName;
                      return (
                        <td
                          key={brand}
                          className={`py-3 px-4 text-center ${
                            isPrimaryBrand ? "bg-primary/5" : ""
                          }`}
                        >
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                            isPrimaryBrand
                              ? mentions > 0
                                ? "bg-blue-500/20 text-black-500"
                                : "bg-red-500/20 text-red-500"
                              : mentions > 0
                              ? "bg-green-500/20 text-green-500"
                              : "bg-red-500/20 text-red-500"
                          }`}
                          >
                            {mentions}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetitorsComparisonsContent;