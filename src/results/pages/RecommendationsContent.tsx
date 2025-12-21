import { getRecommendations, getBrandName } from "@/results/data/analyticsData";
import { Lightbulb, Target, TrendingUp, Zap, ArrowRight, CheckCircle } from "lucide-react";

const RecommendationsContent = () => {
  const brandName = getBrandName();
  const recommendations = getRecommendations();

  const getEffortConfig = (effort: string) => {
    switch (effort) {
      case 'High': return { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20' };
      case 'Medium': return { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' };
      case 'Low': return { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/20' };
      default: return { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' };
    }
  };

  const getImpactConfig = (impact: string) => {
    switch (impact) {
      case 'High': return { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/20' };
      case 'Medium': return { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' };
      case 'Low': return { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20' };
      default: return { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' };
    }
  };

  const highImpact = recommendations.filter((r: any) => r.impact === 'High');
  const mediumImpact = recommendations.filter((r: any) => r.impact === 'Medium');

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
              <h1 className="text-lg md:text-2xl font-bold text-foreground">Strategic Recommendations</h1>
              <p className="text-xs md:text-sm text-muted-foreground">AI-powered insights to improve {brandName}'s visibility</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-2xl md:text-3xl font-bold text-amber-500">{recommendations.length}</div>
            <div className="text-[10px] md:text-xs text-muted-foreground">Action Items</div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <div className="bg-green-500/10 rounded-lg md:rounded-xl border border-green-500/20 p-3 md:p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-3">
            <div className="flex items-center gap-1.5 md:gap-3">
              <Zap className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
              <span className="text-[10px] md:text-sm font-medium text-foreground">High Impact</span>
            </div>
            <span className="text-xl md:text-2xl font-bold text-green-500">{highImpact.length}</span>
          </div>
        </div>
        <div className="bg-amber-500/10 rounded-lg md:rounded-xl border border-amber-500/20 p-3 md:p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-3">
            <div className="flex items-center gap-1.5 md:gap-3">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
              <span className="text-[10px] md:text-sm font-medium text-foreground">Medium</span>
            </div>
            <span className="text-xl md:text-2xl font-bold text-amber-500">{mediumImpact.length}</span>
          </div>
        </div>
        <div className="bg-muted rounded-lg md:rounded-xl border border-border p-3 md:p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-3">
            <div className="flex items-center gap-1.5 md:gap-3">
              <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
              <span className="text-[10px] md:text-sm font-medium text-foreground">Quick Wins</span>
            </div>
            <span className="text-xl md:text-2xl font-bold text-foreground">
              {recommendations.filter((r: any) => r.overall_effort === 'Low').length}
            </span>
          </div>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-3 md:space-y-4">
        {recommendations.map((rec: any, index: number) => {
          const effortConfig = getEffortConfig(rec.overall_effort);
          const impactConfig = getImpactConfig(rec.impact);

          return (
            <div 
              key={index} 
              className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-all group"
            >
              {/* Header */}
              <div className="p-3 md:p-6 pb-2 md:pb-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4 mb-3 md:mb-4">
                  <div className="flex items-start gap-2 md:gap-4 flex-1">
                    <div className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${impactConfig.bg} ${impactConfig.text} font-bold text-sm md:text-base`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
                        <Lightbulb className="w-3 h-3 md:w-4 md:h-4 text-amber-400" />
                        <span className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wider">Insight</span>
                      </div>
                      <p className="text-xs md:text-base text-foreground leading-relaxed">{rec.overall_insight}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 ml-10 md:ml-0">
                    <div className={`px-2 py-1 md:px-3 md:py-1.5 rounded-lg ${effortConfig.bg} border ${effortConfig.border}`}>
                      <span className="text-[8px] md:text-xs text-muted-foreground block">Effort</span>
                      <span className={`text-[10px] md:text-sm font-semibold ${effortConfig.text}`}>{rec.overall_effort}</span>
                    </div>
                    <div className={`px-2 py-1 md:px-3 md:py-1.5 rounded-lg ${impactConfig.bg} border ${impactConfig.border}`}>
                      <span className="text-[8px] md:text-xs text-muted-foreground block">Impact</span>
                      <span className={`text-[10px] md:text-sm font-semibold ${impactConfig.text}`}>{rec.impact}</span>
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
                    <span className="text-[10px] md:text-xs font-medium text-primary uppercase tracking-wider block mb-0.5 md:mb-1">Suggested Action</span>
                    <p className="text-xs md:text-sm text-foreground leading-relaxed">{rec.suggested_action}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block" />
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
