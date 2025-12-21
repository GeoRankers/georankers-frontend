import { Layout } from "@/results/layout/Layout";
import { recommendations, getBrandName } from "@/results/data/analyticsData";
import { Lightbulb, Target, TrendingUp, Zap, ArrowRight, CheckCircle } from "lucide-react";

const Recommendations = () => {
  const brandName = getBrandName();

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

  // Group recommendations by impact for prioritization
  const highImpact = recommendations.filter((r: any) => r.impact === 'High');
  const mediumImpact = recommendations.filter((r: any) => r.impact === 'Medium');
  const lowImpact = recommendations.filter((r: any) => r.impact === 'Low');

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header with gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/20 p-6">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 rounded-xl">
                <Lightbulb className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Strategic Recommendations</h1>
                <p className="text-sm text-muted-foreground">AI-powered insights to improve {brandName}'s visibility</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-amber-500">{recommendations.length}</div>
              <div className="text-xs text-muted-foreground">Action Items</div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-500/10 rounded-xl border border-green-500/20 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-foreground">High Impact</span>
              </div>
              <span className="text-2xl font-bold text-green-500">{highImpact.length}</span>
            </div>
          </div>
          <div className="bg-amber-500/10 rounded-xl border border-amber-500/20 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-medium text-foreground">Medium Impact</span>
              </div>
              <span className="text-2xl font-bold text-amber-500">{mediumImpact.length}</span>
            </div>
          </div>
          <div className="bg-muted rounded-xl border border-border p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Low Effort Quick Wins</span>
              </div>
              <span className="text-2xl font-bold text-foreground">
                {recommendations.filter((r: any) => r.overall_effort === 'Low').length}
              </span>
            </div>
          </div>
        </div>

        {/* Recommendations List */}
        <div className="space-y-4">
          {recommendations.map((rec: any, index: number) => {
            const effortConfig = getEffortConfig(rec.overall_effort);
            const impactConfig = getImpactConfig(rec.impact);

            return (
              <div 
                key={index} 
                className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-all group"
              >
                {/* Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${impactConfig.bg} ${impactConfig.text} font-bold`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Insight</span>
                        </div>
                        <p className="text-foreground leading-relaxed">{rec.overall_insight}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <div className={`px-3 py-1.5 rounded-lg ${effortConfig.bg} border ${effortConfig.border}`}>
                        <span className="text-xs text-muted-foreground block">Effort</span>
                        <span className={`text-sm font-semibold ${effortConfig.text}`}>{rec.overall_effort}</span>
                      </div>
                      <div className={`px-3 py-1.5 rounded-lg ${impactConfig.bg} border ${impactConfig.border}`}>
                        <span className="text-xs text-muted-foreground block">Impact</span>
                        <span className={`text-sm font-semibold ${impactConfig.text}`}>{rec.impact}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action */}
                <div className="px-6 pb-6">
                  <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-xl border border-primary/10">
                    <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
                      <Target className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-medium text-primary uppercase tracking-wider block mb-1">Suggested Action</span>
                      <p className="text-sm text-foreground leading-relaxed">{rec.suggested_action}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-primary flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default Recommendations;
