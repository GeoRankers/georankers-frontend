import { getTierColorVar, toOrdinal } from "@/results/data/formulas";
import { TierBadge } from "@/results/ui/TierBadge";
import {
  getExecutiveSummary,
  getAnalysisDate,
  getBrandName,
  getAIVisibilityMetrics,
  getBrandInfoWithLogos,
} from "@/results/data/analyticsData";
import {
  CheckCircle2,
  XCircle,
  Target,
  TrendingUp,
  AlertTriangle,
  Trophy,
  Users,
  ArrowDown,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ExecutiveSummaryContent = () => {
  const visibilityData = getAIVisibilityMetrics();
  const brandInfo = getBrandInfoWithLogos();
  const executiveSummary = getExecutiveSummary();

  const getBrandLogo = (brandName: string) => {
    const cleanName = brandName.replace(/\s*\(GEO \d+\)/, "");
    const brand = brandInfo.find((b) => b.brand === cleanName);
    return brand?.logo;
  };

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6 max-w w-full overflow-x-hidden">
      {/* Page Title with gradient header */}
      <div className="relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/20 p-4 md:p-8">
        <div className="absolute top-0 right-0 w-32 md:w-64 h-32 md:h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
          <Sparkles className="w-5 h-5 md:w-8 md:h-8 text-primary" />
          <h1 className="text-xl md:text-3xl font-bold text-foreground">
            Executive Summary
          </h1>
        </div>
      </div>

      {/* Brand Score Card with visual gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-4 md:p-6">
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
            <div className="p-2 md:p-3 bg-primary/10 rounded-lg md:rounded-xl">
              <Target className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base md:text-lg font-semibold text-foreground">
                Overall Assessment
              </h2>
            </div>
          </div>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            {executiveSummary.brand_score_and_tier}
            {executiveSummary.conclusion}
          </p>
        </div>

        {/* Quick Stats */}
        <div
          className={cn(
            "rounded-xl border p-4 md:p-6 flex flex-col items-center justify-center",
            getTierColorVar(visibilityData.tier),
            "bg-[color-mix(in_srgb,var(--tier-color)_10%,transparent)]",
            "border-[color-mix(in_srgb,var(--tier-color)_20%,transparent)]"
          )}
        >
          {/* Score */}
          <div className="text-4xl md:text-5xl font-bold text-[var(--tier-color)] mb-1 md:mb-2">
            {visibilityData.score}
          </div>

          <div className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">
            AI Visibility Score
          </div>

          <TierBadge
            tier={visibilityData.tier}
            className="text-sm md:text-lg px-3 py-1.5 md:px-4 md:py-2"
          />

          <p className="text-[10px] md:text-xs text-muted-foreground mt-2 md:mt-3 text-center">
            Your brand ranked {toOrdinal(visibilityData.brandPosition)} out of{" "}
            {visibilityData.totalBrands} brands in AI visibility score.
          </p>
        </div>
      </div>

      {/* Strengths & Weaknesses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Strengths */}
        <div className="bg-card rounded-xl border border-border p-4 md:p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
            <div className="p-1.5 md:p-2 bg-green-500/20 rounded-lg">
              <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-foreground">
              Strengths
            </h3>
          </div>
          <ul className="space-y-2 md:space-y-3">
            {executiveSummary.strengths.map((strength, index) => (
              <li
                key={index}
                className="flex items-start gap-2 md:gap-3 p-2 md:p-3 bg-green-500/5 rounded-lg border border-green-500/10"
              >
                <span className="flex-shrink-0 w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full bg-green-500/20 text-green-500 text-[10px] md:text-xs font-semibold">
                  {index + 1}
                </span>
                <span className="text-xs md:text-sm text-foreground leading-relaxed">
                  {strength}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="bg-card rounded-xl border border-border p-4 md:p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
            <div className="p-1.5 md:p-2 bg-red-500/20 rounded-lg">
              <XCircle className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-foreground">
              Weaknesses
            </h3>
          </div>
          <ul className="space-y-2 md:space-y-3">
            {executiveSummary.weaknesses.map((weakness, index) => (
              <li
                key={index}
                className="flex items-start gap-2 md:gap-3 p-2 md:p-3 bg-red-500/5 rounded-lg border border-red-500/10"
              >
                <span className="flex-shrink-0 w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full bg-red-500/20 text-red-500 text-[10px] md:text-xs font-semibold">
                  {index + 1}
                </span>
                <span className="text-xs md:text-sm text-foreground leading-relaxed">
                  {weakness}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Competitor Positioning */}
      <div className="bg-card rounded-xl border border-border p-4 md:p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
          <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
            <Users className="w-4 h-4 md:w-5 md:h-5 text-primary" />
          </div>
          <h3 className="text-base md:text-lg font-semibold text-foreground">
            Competitive Positioning
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {/* Leaders */}
          <div className="relative overflow-hidden bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl p-3 md:p-5 border border-green-500/20">
            <div className="absolute top-0 right-0 w-16 md:w-20 h-16 md:h-20 bg-green-500/10 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-1.5 md:gap-2 mb-3 md:mb-4">
                <Trophy className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                <h4 className="font-semibold text-green-600 text-sm md:text-base">
                  Leaders
                </h4>
              </div>
              <div className="space-y-2 md:space-y-3">
                {executiveSummary.competitor_positioning.leaders.map(
                  (leader, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 md:gap-3 p-2 md:p-3 bg-card/50 rounded-lg"
                    >
                      {getBrandLogo(leader.name) && (
                        <img
                          src={getBrandLogo(leader.name)}
                          alt=""
                          className="w-6 h-6 md:w-8 md:h-8 rounded-full object-contain bg-white flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-xs md:text-sm truncate">
                          {leader.name}
                        </p>
                        <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1 line-clamp-2">
                          {leader.summary}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Mid-Tier */}
          <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-xl p-3 md:p-5 border border-amber-500/20">
            <div className="absolute top-0 right-0 w-16 md:w-20 h-16 md:h-20 bg-amber-500/10 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-1.5 md:gap-2 mb-3 md:mb-4">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
                <h4 className="font-semibold text-amber-600 text-sm md:text-base">
                  Mid-Tier
                </h4>
              </div>
              <div className="space-y-2 md:space-y-3">
                {executiveSummary.competitor_positioning.mid_tier.map(
                  (brand, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 md:gap-3 p-2 md:p-3 bg-card/50 rounded-lg"
                    >
                      {getBrandLogo(brand.name) && (
                        <img
                          src={getBrandLogo(brand.name)}
                          alt=""
                          className="w-6 h-6 md:w-8 md:h-8 rounded-full object-contain bg-white flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-xs md:text-sm truncate">
                          {brand.name}
                        </p>
                        <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1 line-clamp-2">
                          {brand.summary}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Laggards */}
          <div className="relative overflow-hidden bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-xl p-3 md:p-5 border border-red-500/20">
            <div className="absolute top-0 right-0 w-16 md:w-20 h-16 md:h-20 bg-red-500/10 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-1.5 md:gap-2 mb-3 md:mb-4">
                <ArrowDown className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
                <h4 className="font-semibold text-red-600 text-sm md:text-base">
                  Laggards
                </h4>
              </div>
              <div className="space-y-2 md:space-y-3">
                {executiveSummary.competitor_positioning.laggards.map(
                  (brand, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 md:gap-3 p-2 md:p-3 bg-card/50 rounded-lg"
                    >
                      {getBrandLogo(brand.name) && (
                        <img
                          src={getBrandLogo(brand.name)}
                          alt=""
                          className="w-6 h-6 md:w-8 md:h-8 rounded-full object-contain bg-white flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-xs md:text-sm truncate">
                          {brand.name}
                        </p>
                        <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1 line-clamp-2">
                          {brand.summary}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prioritized Actions */}
      <div className="bg-card rounded-xl border border-border p-4 md:p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
          <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
            <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-primary" />
          </div>
          <h3 className="text-base md:text-lg font-semibold text-foreground">
            Prioritized Actions
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {executiveSummary.prioritized_actions.map((action, index) => (
            <div
              key={index}
              className="flex items-start gap-3 md:gap-4 p-3 md:p-4 bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl border border-border hover:border-primary/30 transition-colors"
            >
              <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary text-primary-foreground text-sm md:text-lg font-bold shadow-lg">
                {index + 1}
              </span>
              <span className="text-xs md:text-sm text-foreground leading-relaxed">
                {action}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExecutiveSummaryContent;
