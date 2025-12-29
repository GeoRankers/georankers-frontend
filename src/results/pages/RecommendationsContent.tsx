import { useState } from "react";
import { getRecommendations, getBrandName } from "@/results/data/analyticsData";
import {
  Lightbulb,
  Target,
  TrendingUp,
  Zap,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

const RecommendationsContent = () => {
  const brandName = getBrandName();
  const recommendations = getRecommendations();
  const [activeFilter, setActiveFilter] = useState<"all" | "high" | "medium" | "quick">("all");

  const getEffortConfig = (effort: string) => {
    switch (effort) {
      case "High":
        return {
          bg: "bg-red-500/10",
          text: "text-red-500",
          border: "border-red-500/20",
        };
      case "Medium":
        return {
          bg: "bg-amber-500/10",
          text: "text-amber-500",
          border: "border-amber-500/20",
        };
      case "Low":
        return {
          bg: "bg-green-500/10",
          text: "text-green-500",
          border: "border-green-500/20",
        };
      default:
        return {
          bg: "bg-muted",
          text: "text-muted-foreground",
          border: "border-border",
        };
    }
  };

  const getImpactConfig = (impact: string) => {
    switch (impact) {
      case "High":
        return {
          bg: "bg-green-500/10",
          text: "text-green-500",
          border: "border-green-500/20",
        };
      case "Medium":
        return {
          bg: "bg-amber-500/10",
          text: "text-amber-500",
          border: "border-amber-500/20",
        };
      case "Low":
        return {
          bg: "bg-red-500/10",
          text: "text-red-500",
          border: "border-red-500/20",
        };
      default:
        return {
          bg: "bg-muted",
          text: "text-muted-foreground",
          border: "border-border",
        };
    }
  };

  const highImpact = recommendations.filter((r: any) => r.impact === "High");
  const mediumImpact = recommendations.filter(
    (r: any) => r.impact === "Medium"
  );
  const quickWins = recommendations.filter((r: any) => r.overall_effort === "Low" && r.impact === "High");

  // Filter recommendations based on active filter
  const filteredRecommendations = () => {
    switch (activeFilter) {
      case "high":
        return highImpact;
      case "medium":
        return mediumImpact;
      case "quick":
        return quickWins;
      default:
        return recommendations;
    }
  };

  const displayedRecommendations = filteredRecommendations();

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header with gradient */}
      <div className="relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/20 p-4 md:p-6">
        <div className="absolute top-0 right-0 w-32 md:w-48 h-32 md:h-48 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-2 md:p-3 bg-amber-500/10 rounded-lg md:rounded-xl">
              <Lightbulb className="w-5 h-5 md:w-6 md:h-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-foreground">
                Strategic Recommendations
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                Data-driven actions to boost {brandName}'s AI presence
              </p>
            </div>
          </div>
          <div className="text-center sm:text-right">
            <div className="text-2xl md:text-3xl font-bold text-amber-500">
              {displayedRecommendations.length}
            </div>
            <div className="text-[10px] md:text-xs text-muted-foreground">
              {activeFilter === "all" ? "Action Items" : "Filtered Items"}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats - Now Clickable Filters */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <button
          onClick={() => setActiveFilter(activeFilter === "high" ? "all" : "high")}
          className={`transition-all rounded-lg md:rounded-xl border p-3 md:p-5 text-left ${
            activeFilter === "high"
              ? "bg-green-500/30 border-green-500/50 shadow-lg scale-105"
              : "bg-green-500/10 border-green-500/20 hover:bg-green-500/15"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-3">
            <div className="flex items-center gap-1.5 md:gap-3">
              <Zap className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
              <span className="text-[10px] md:text-sm font-medium text-foreground">
                High Impact
              </span>
            </div>
            <span className="text-xl md:text-2xl font-bold text-green-500">
              {highImpact.length}
            </span>
          </div>
        </button>
        <button
          onClick={() => setActiveFilter(activeFilter === "medium" ? "all" : "medium")}
          className={`transition-all rounded-lg md:rounded-xl border p-3 md:p-5 text-left ${
            activeFilter === "medium"
              ? "bg-amber-500/30 border-amber-500/50 shadow-lg scale-105"
              : "bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/15"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-3">
            <div className="flex items-center gap-1.5 md:gap-3">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
              <span className="text-[10px] md:text-sm font-medium text-foreground">
                Medium Impact
              </span>
            </div>
            <span className="text-xl md:text-2xl font-bold text-amber-500">
              {mediumImpact.length}
            </span>
          </div>
        </button>
        <button
          onClick={() => setActiveFilter(activeFilter === "quick" ? "all" : "quick")}
          className={`relative group transition-all rounded-lg md:rounded-xl border p-3 md:p-5 text-left ${
            activeFilter === "quick"
              ? "bg-primary/30 border-primary/50 shadow-lg scale-105"
              : "bg-muted border-border hover:bg-muted/80"
          }`}
        >
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
            Low effort, high value actions
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-popover"></div>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-3">
            <div className="flex items-center gap-1.5 md:gap-3">
              <CheckCircle className={`w-4 h-4 md:w-5 md:h-5 ${activeFilter === "quick" ? "text-primary" : "text-muted-foreground"}`} />
              <span className="text-[10px] md:text-sm font-medium text-foreground">
                Quick Wins
              </span>
            </div>
            <span className="text-xl md:text-2xl font-bold text-muted-foreground">
              {quickWins.length}
            </span>
          </div>
        </button>
      </div>

      {/* Active Filter Indicator */}
      {activeFilter !== "all" && (
        <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg px-4 py-2">
          <span className="text-sm text-foreground">
            Showing {activeFilter === "high" ? "High Impact" : activeFilter === "medium" ? "Medium Impact" : "Quick Wins"} recommendations
          </span>
          <button
            onClick={() => setActiveFilter("all")}
            className="text-xs text-primary hover:underline font-medium"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Recommendations List */}
      <div className="space-y-3 md:space-y-4">
        {displayedRecommendations.map((rec: any, index: number) => {
          const effortConfig = getEffortConfig(rec.overall_effort);
          const impactConfig = getImpactConfig(rec.impact);
          
          // Determine circle color based on active filter
          let circleConfig = impactConfig;
          if (activeFilter === "quick") {
            circleConfig = {
              bg: "bg-muted",
              text: "text-muted-foreground",
              border: "border-border"
            };
          }

          return (
            <div
              key={index}
              className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-all group"
            >
              {/* Header */}
              <div className="p-3 md:p-6 pb-2 md:pb-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4 mb-3 md:mb-4">
                  <div className="flex items-start gap-2 md:gap-4 flex-1">
                    <div
                      className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${circleConfig.bg} ${circleConfig.text} font-bold text-sm md:text-base`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
                        <Lightbulb className="w-3 h-3 md:w-4 md:h-4 text-amber-400" />
                        <span className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Insight
                        </span>
                      </div>
                      <p className="text-xs md:text-base text-foreground leading-relaxed">
                        {rec.overall_insight}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 ml-10 md:ml-0">
                    <div
                      className={`w-20 md:w-24 h-12 md:h-14 flex flex-col justify-center rounded-lg ${effortConfig.bg} border ${effortConfig.border}`}
                    >
                      <span className="text-[8px] md:text-xs text-muted-foreground text-center">
                        Effort
                      </span>
                      <span
                        className={`text-[10px] md:text-sm font-semibold text-center ${effortConfig.text}`}
                      >
                        {rec.overall_effort}
                      </span>
                    </div>

                    <div
                      className={`w-20 md:w-24 h-12 md:h-14 flex flex-col justify-center rounded-lg ${impactConfig.bg} border ${impactConfig.border}`}
                    >
                      <span className="text-[8px] md:text-xs text-muted-foreground text-center">
                        Impact
                      </span>
                      <span
                        className={`text-[10px] md:text-sm font-semibold text-center ${impactConfig.text}`}
                      >
                        {rec.impact}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="px-3 pb-3 md:px-6 md:pb-6">
                <div className="flex items-start gap-2 md:gap-3 p-3 md:p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-lg md:rounded-xl border border-primary/10">
                  <div className="flex-shrink-0 p-1.5 md:p-2 bg-primary/10 rounded-lg">
                    <Target className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] md:text-xs font-medium text-primary uppercase tracking-wider block mb-0.5 md:mb-1">
                      Suggested Action
                    </span>
                    <p className="text-xs md:text-sm text-foreground leading-relaxed">
                      {rec.suggested_action}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendationsContent;