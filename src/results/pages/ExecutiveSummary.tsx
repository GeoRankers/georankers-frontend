import { Layout } from "@/results/layout/Layout";
import { TierBadge } from "@/results/ui/TierBadge";
import { executiveSummary, getAnalysisDate, getBrandName, getAIVisibilityMetrics, getBrandInfoWithLogos } from "@/results/data/analyticsData";
import { CheckCircle2, XCircle, Target, TrendingUp, AlertTriangle, Trophy, Users, ArrowDown, Sparkles, BarChart3 } from "lucide-react";

const ExecutiveSummary = () => {
  const visibilityData = getAIVisibilityMetrics();
  const brandInfo = getBrandInfoWithLogos();

  // Get logos for brands in positioning
  const getBrandLogo = (brandName: string) => {
    const cleanName = brandName.replace(/\s*\(GEO \d+\)/, '');
    const brand = brandInfo.find(b => b.brand === cleanName);
    return brand?.logo;
  };

  return (
    <Layout>
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* Page Title with gradient header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/20 p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Executive Summary</h1>
            </div>
            <p className="text-muted-foreground">
              Strategic overview for {getBrandName()} • {getAnalysisDate()}
            </p>
          </div>
        </div>

        {/* Brand Score Card with visual gauge */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Overall Assessment</h2>
                <p className="text-sm text-muted-foreground">{executiveSummary.brand_score_and_tier}</p>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {executiveSummary.conclusion}
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20 p-6 flex flex-col items-center justify-center">
            <div className="text-5xl font-bold text-primary mb-2">{visibilityData.score}</div>
            <div className="text-sm text-muted-foreground mb-3">GEO Score</div>
            <TierBadge tier={visibilityData.tier} className="text-lg px-4 py-2" />
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Position {visibilityData.brandPosition} of {visibilityData.totalBrands} brands
            </p>
          </div>
        </div>

        {/* Strengths & Weaknesses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className="bg-card rounded-xl border border-border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Strengths</h3>
            </div>
            <ul className="space-y-3">
              {executiveSummary.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-3 p-3 bg-green-500/5 rounded-lg border border-green-500/10">
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-green-500/20 text-green-500 text-xs font-semibold">
                    {index + 1}
                  </span>
                  <span className="text-sm text-foreground leading-relaxed">{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="bg-card rounded-xl border border-border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Weaknesses</h3>
            </div>
            <ul className="space-y-3">
              {executiveSummary.weaknesses.map((weakness, index) => (
                <li key={index} className="flex items-start gap-3 p-3 bg-red-500/5 rounded-lg border border-red-500/10">
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-red-500/20 text-red-500 text-xs font-semibold">
                    {index + 1}
                  </span>
                  <span className="text-sm text-foreground leading-relaxed">{weakness}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Competitor Positioning */}
        <div className="bg-card rounded-xl border border-border p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Competitive Positioning</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Leaders */}
            <div className="relative overflow-hidden bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl p-5 border border-green-500/20">
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-5 h-5 text-green-500" />
                  <h4 className="font-semibold text-green-600">Leaders</h4>
                </div>
                <div className="space-y-3">
                  {executiveSummary.competitor_positioning.leaders.map((leader, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-card/50 rounded-lg">
                      {getBrandLogo(leader.name) && (
                        <img src={getBrandLogo(leader.name)} alt="" className="w-8 h-8 rounded-full object-contain bg-white" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{leader.name}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{leader.summary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mid-Tier */}
            <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-xl p-5 border border-amber-500/20">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                  <h4 className="font-semibold text-amber-600">Mid-Tier</h4>
                </div>
                <div className="space-y-3">
                  {executiveSummary.competitor_positioning.mid_tier.map((brand, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-card/50 rounded-lg">
                      {getBrandLogo(brand.name) && (
                        <img src={getBrandLogo(brand.name)} alt="" className="w-8 h-8 rounded-full object-contain bg-white" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{brand.name}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{brand.summary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Laggards */}
            <div className="relative overflow-hidden bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-xl p-5 border border-red-500/20">
              <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <ArrowDown className="w-5 h-5 text-red-500" />
                  <h4 className="font-semibold text-red-600">Laggards</h4>
                </div>
                <div className="space-y-3">
                  {executiveSummary.competitor_positioning.laggards.map((brand, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-card/50 rounded-lg">
                      {getBrandLogo(brand.name) && (
                        <img src={getBrandLogo(brand.name)} alt="" className="w-8 h-8 rounded-full object-contain bg-white" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{brand.name}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{brand.summary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Prioritized Actions */}
        <div className="bg-card rounded-xl border border-border p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Prioritized Actions</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {executiveSummary.prioritized_actions.map((action, index) => (
              <div 
                key={index} 
                className="flex items-start gap-4 p-4 bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl border border-border hover:border-primary/30 transition-colors"
              >
                <span className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground text-lg font-bold shadow-lg">
                  {index + 1}
                </span>
                <span className="text-sm text-foreground leading-relaxed">{action}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ExecutiveSummary;
