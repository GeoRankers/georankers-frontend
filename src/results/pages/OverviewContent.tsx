import { useResults } from "@/results/context/ResultsContext";
import { useEffect, useState, useMemo } from "react";
import {
  getAIVisibilityMetrics,
  getMentionsPosition,
  getBrandMentionResponseRates,
  getSentiment,
  hasAnalyticsData,
} from "@/results/data/analyticsData";
import { LLMVisibilityTable } from "@/results/overview/LLMVisibilityTable";
import { PlatformPresence } from "@/results/overview/PlatformPresence";
import { CompetitorComparisonChart } from "@/results/overview/CompetitorComparisonChart";
import { BrandMentionsRadar } from "@/results/overview/BrandMentionsRadar";
import BrandInfoBar from "@/results/overview/BrandInfoBar";
import { TierBadge } from "@/results/ui/TierBadge";
import { toOrdinal } from "@/results/data/formulas";
import {
  Info,
  TrendingUp,
  MessageSquare,
  ThumbsUp,
  Search,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Trophy,
  Medal,
  Award,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const OverviewContent = () => {
  const { dataReady } = useResults();
  const [animatedBars, setAnimatedBars] = useState(false);

  // FIX 1: Check if analytics data is available first
  const analyticsAvailable = hasAnalyticsData();

  // FIX 2: Only compute derived values when data is actually available
  // Use empty fallbacks to maintain hook order
  const visibilityData = useMemo(() => {
    if (!analyticsAvailable) {
      return {
        score: 0,
        tier: "Low",
        brandPosition: 0,
        totalBrands: 0,
        positionBreakdown: {
          topPosition: 0,
          midPosition: 0,
          lowPosition: 0,
        },
      };
    }
    return getAIVisibilityMetrics();
  }, [analyticsAvailable]);

  const mentionsData = useMemo(() => {
    if (!analyticsAvailable) {
      return {
        position: 0,
        tier: "Low",
        totalBrands: 0,
        topBrandMentions: 0,
        brandMentions: 0,
        allBrandMentions: {},
      };
    }
    return getMentionsPosition();
  }, [analyticsAvailable]);

  const brandMentionRates = useMemo(() => {
    if (!analyticsAvailable) return [];
    return getBrandMentionResponseRates();
  }, [analyticsAvailable]);

  const sentiment = useMemo(() => {
    if (!analyticsAvailable) {
      return { dominant_sentiment: "N/A", summary: "" };
    }
    return getSentiment();
  }, [analyticsAvailable]);

  useEffect(() => {
    if (dataReady && analyticsAvailable) {
      const timer = setTimeout(() => setAnimatedBars(true), 100);
      return () => clearTimeout(timer);
    }
  }, [dataReady, analyticsAvailable]);

  const getMedalIcon = (index: number, isTestBrand: boolean) => {
    if (index === 0) return <Trophy className="w-4 h-4 text-yellow-500" />;
    if (index === 1) return <Medal className="w-4 h-4 text-gray-400" />;
    if (isTestBrand) return <Award className="w-4 h-4 text-primary" />;
    return <Award className="w-4 h-4 text-amber-600" />;
  };

  const mentionsInsight = useMemo(() => {
    const { position, totalBrands } = mentionsData;

    if (!position || position <= 0) return null;

    if (position === 1) {
      return `Your brand is leading in brand mention score among ${totalBrands} brands.`;
    }

    return `Your brand ranked at ${toOrdinal(position)} position out of ${totalBrands} brands.`;
  }, [mentionsData]);

  const visibilityInsight = useMemo(() => {
    const { brandPosition, totalBrands } = visibilityData;

    if (!brandPosition || brandPosition <= 0) return null;

    if (brandPosition === 1) {
      return `Your brand is leading in AI search visibility score among ${totalBrands} brands.`;
    }

    return `Your brand ranked at ${toOrdinal(
      brandPosition
    )} position out of ${totalBrands} brands.`;
  }, [visibilityData]);

  // FIX 3: Show loading state properly
  if (!dataReady || !analyticsAvailable) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4 animate-spin" />
            <h2 className="text-2xl font-bold mb-2">Analysis Started</h2>
            <p className="text-muted-foreground">
              We are preparing your brand's comprehensive analysis.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden p-4 md:p-6">
      {/* Brand Info Bar - Only on Overview page */}
      <BrandInfoBar />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <h1 className="text-xl md:text-2xl font-bold text-foreground">
            Overall Insights
          </h1>
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-4 h-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Comprehensive overview of your brand's AI performance.</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Main metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* AI Visibility Card */}
          <div className="bg-card rounded-xl border p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                </div>
                <span className="font-semibold text-foreground">
                  AI Visibility
                </span>
              </div>
              <TierBadge tier={visibilityData.tier} />
            </div>

            {/* Score Display */}
            <div className="border-2 border-border rounded-lg p-3 mb-4">
              <div className="text-center">
                <span className="text-xl text-muted-foreground">
                  AI Visibility Score:{" "}
                </span>
                <span className="text-2xl font-bold text-foreground">
                  {visibilityData.score}
                </span>
              </div>
            </div>

            {/* Position Breakdown */}
            <div className="space-y-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-between text-sm cursor-help hover:bg-muted/50 rounded-md px-2 py-1 -mx-2 transition-colors">
                    <div className="flex items-center gap-2">
                      <ArrowUp className="w-4 h-4 text-emerald-500" />
                      <span className="text-foreground">Top Position</span>
                    </div>
                    <span className="font-semibold text-foreground">
                      {visibilityData.positionBreakdown.topPosition}%
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="text-sm">
                    Percentage of queries where your brand ranked 1 across
                    Gemini and OpenAI.
                  </p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-between text-sm cursor-help hover:bg-muted/50 rounded-md px-2 py-1 -mx-2 transition-colors">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-amber-500" />
                      <span className="text-foreground">
                        Mid Position (2-4)
                      </span>
                    </div>
                    <span className="font-semibold text-foreground">
                      {visibilityData.positionBreakdown.midPosition}%
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="text-sm">
                    Percentage of queries where your brand ranked 2nd to 4th
                    across Gemini and OpenAI.
                  </p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-between text-sm cursor-help hover:bg-muted/50 rounded-md px-2 py-1 -mx-2 transition-colors">
                    <div className="flex items-center gap-2">
                      <ArrowDown className="w-4 h-4 text-red-500" />
                      <span className="text-foreground">Low Position</span>
                    </div>
                    <span className="font-semibold text-foreground">
                      {visibilityData.positionBreakdown.lowPosition}%
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="text-sm">
                    Percentage of queries where your brand ranked 5th or lower
                    across Gemini and OpenAI.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>

            {visibilityData.brandPosition > 0 && visibilityInsight && (
              <p className="text-sm text-foreground font-medium border-t pt-3 mt-4">
                {visibilityInsight}
              </p>
            )}
          </div>

          {/* Brand Mention Score Card */}
          <div className="bg-card rounded-xl border border-border p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
                </div>
                <span className="font-semibold text-foreground">
                  Brand Mentions
                </span>
              </div>
              <TierBadge tier={mentionsData.tier} />
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-[auto_1fr_auto] gap-3 text-xs text-muted-foreground mb-3 pb-2 border-b border-border">
              <span>% of AI responses where your brand is mentioned</span>
            </div>

            {/* FIX 4: Add unique keys using brand name + index */}
            <div className="space-y-3">
              {brandMentionRates.map((item, index) => {
                return (
                  <div
                    key={`brand-mention-${item.brand}-${index}`}
                    className="grid grid-cols-[auto_1fr_auto] gap-3 items-center"
                  >
                    <div className="flex items-center gap-2 min-w-[100px]">
                      {getMedalIcon(index, item.isTestBrand)}
                      <span
                        className={`text-sm truncate ${
                          item.isTestBrand
                            ? "font-semibold text-primary"
                            : "text-foreground"
                        }`}
                      >
                        {item.brand}
                      </span>
                    </div>

                    <div className="relative h-6 bg-muted rounded overflow-hidden">
                      <div
                        className={`absolute left-0 top-0 h-full rounded transition-all duration-700 ease-out ${
                          item.isTestBrand
                            ? "bg-gradient-to-r from-primary/80 to-primary"
                            : index === 0
                            ? "bg-gradient-to-r from-amber-500 to-amber-400"
                            : "bg-gradient-to-r from-amber-600/80 to-amber-500/80"
                        }`}
                        style={{
                          width: animatedBars ? `${item.responseRate}%` : "0%",
                          transitionDelay: `${index * 150}ms`,
                        }}
                      />
                    </div>

                    <span
                      className={`text-sm font-medium min-w-[50px] text-right ${
                        item.isTestBrand ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {item.responseRate}%
                    </span>
                  </div>
                );
              })}
            </div>

            {visibilityData.brandPosition > 0 && visibilityInsight && (
              <p className="text-sm text-foreground font-medium border-t pt-3 mt-4">
                {visibilityInsight}
              </p>
            )}
          </div>

          {/* Sentiment Card */}
          <div className="bg-card rounded-xl border p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <ThumbsUp className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                </div>
                <span className="font-semibold text-foreground">Sentiment</span>
              </div>
              <TierBadge tier={sentiment.dominant_sentiment} />
            </div>
            <div className="flex flex-col items-center justify-center py-2">
              <p className="text-sm text-muted-foreground text-center leading-relaxed">
                {sentiment.summary || "No sentiment data available"}
              </p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <CompetitorComparisonChart />
          <BrandMentionsRadar />
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <LLMVisibilityTable />
          <PlatformPresence />
        </div>
      </div>
    </div>
  );
};

export default OverviewContent;