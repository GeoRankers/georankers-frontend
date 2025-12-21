import { 
  getAIVisibilityMetrics,
  getMentionsPosition,
  getSentiment,
  getBrandName,
  getAnalysisDate,
  getModelName,
  hasAnalyticsData,
  getExecutiveSummary,
  getAnalytics,
  getBrandInfoWithLogos,
  getSourcesData,
  getDepthNotes,
  getCompetitorData,
  getCompetitorSentiment,
  getCompetitorVisibility,
  getKeywords,
  getBrandLogo,
  getRecommendations,
  getBrandMentionResponseRates,
} from "@/results/data/analyticsData";
import { TierBadge } from "@/results/ui/TierBadge";
import { LLMIcon } from "@/results/ui/LLMIcon";
import { 
  TrendingUp, 
  MessageSquare, 
  ThumbsUp, 
  Calendar,
  Sparkles,
  CheckCircle2,
  XCircle,
  Target,
  AlertTriangle,
  Trophy,
  Users,
  ArrowDown,
  Zap,
  Globe,
  FileText,
  Layers,
  BookOpen,
  Lightbulb,
  ArrowRight,
  ArrowUp,
  BarChart3,
  MessageCircle,
  Link2,
} from "lucide-react";

const FullReportContent = () => {
  if (!hasAnalyticsData()) {
    return null;
  }

  const visibilityData = getAIVisibilityMetrics();
  const mentionsData = getMentionsPosition();
  const sentiment = getSentiment();
  const brandName = getBrandName();
  const analysisDate = getAnalysisDate();
  const modelName = getModelName();
  const models = modelName?.split(",").map(m => m.trim()) || [];
  const analytics = getAnalytics();
  const brandInfo = getBrandInfoWithLogos();
  const keywords = analytics?.analysis_scope?.search_keywords || [];
  const visibilityTable = analytics?.competitor_visibility_table;
  const sourcesData = getSourcesData();
  const depthNotes = getDepthNotes();
  const competitorVisibility = getCompetitorVisibility();
  const competitorData = getCompetitorData();
  const competitorSentiment = getCompetitorSentiment();
  const recommendations = getRecommendations();
  const executiveSummary = getExecutiveSummary();
  const brandMentionRates = getBrandMentionResponseRates();

  const brandRow = visibilityTable?.rows?.find((row: any) => row[0] === brandName);
  const totalBrandScore = brandRow ? brandRow.slice(1).reduce((sum: number, s: any) => sum + (s as number), 0) : 0;

  const brandMentionsKey = `${brandName}Mentions`;
  const brandPresenceKey = `${brandName}Presence`;
  const totalSources = sourcesData.length;
  const sourcesWithMentions = sourcesData.filter((s: any) => (s[brandMentionsKey] || 0) > 0).length;
  const totalMentions = sourcesData.reduce((acc: number, s: any) => acc + (s[brandMentionsKey] || 0), 0);
  const presentSources = sourcesData.filter((s: any) => s[brandPresenceKey] === 'Present').length;

  const sortedCompetitorData = [...competitorData].sort((a, b) => b.totalScore - a.totalScore);
  const allBrandNames = competitorData.map(c => c.name);

  const getBrandLogoUrl = (name: string) => {
    const brand = brandInfo.find((b: any) => b.brand === name);
    return brand?.logo;
  };

  const outlookOrder = { 'Positive': 0, 'Neutral': 1, 'Negative': 2 };
  const sortedSentiment = [...competitorSentiment].sort((a, b) => {
    return (outlookOrder[a.outlook as keyof typeof outlookOrder] || 2) - 
           (outlookOrder[b.outlook as keyof typeof outlookOrder] || 2);
  });

  // Collect all unique sources
  const allCheckedSources: string[] = [];
  sourcesData.forEach((source: any) => {
    const pagesUsed = source.pagesUsed;
    if (Array.isArray(pagesUsed)) {
      pagesUsed.forEach((page: string) => {
        if (page && page !== 'Absent' && !allCheckedSources.includes(page)) {
          allCheckedSources.push(page);
        }
      });
    }
  });
  if (depthNotes && typeof depthNotes === 'object') {
    Object.values(depthNotes).forEach((categoryData: any) => {
      if (categoryData?.pages_used && Array.isArray(categoryData.pages_used)) {
        categoryData.pages_used.forEach((page: string) => {
          if (page && page !== 'Absent' && !allCheckedSources.includes(page)) {
            allCheckedSources.push(page);
          }
        });
      }
    });
  }
  allCheckedSources.sort();

  const sortedBrandInfo = [...brandInfo].sort((a, b) => b.mention_count - a.mention_count);

  const getEffortConfig = (effort: string) => {
    switch (effort) {
      case 'High': return { bg: 'bg-red-500/10', text: 'text-red-500' };
      case 'Medium': return { bg: 'bg-amber-500/10', text: 'text-amber-500' };
      case 'Low': return { bg: 'bg-green-500/10', text: 'text-green-500' };
      default: return { bg: 'bg-muted', text: 'text-muted-foreground' };
    }
  };

  const getImpactConfig = (impact: string) => {
    switch (impact) {
      case 'High': return { bg: 'bg-green-500/10', text: 'text-green-500' };
      case 'Medium': return { bg: 'bg-amber-500/10', text: 'text-amber-500' };
      case 'Low': return { bg: 'bg-red-500/10', text: 'text-red-500' };
      default: return { bg: 'bg-muted', text: 'text-muted-foreground' };
    }
  };

  const getScoreTier = (score: number, maxScore: number) => {
    const ratio = score / maxScore;
    if (ratio >= 0.7) return 'High';
    if (ratio >= 0.4) return 'Medium';
    return 'Low';
  };

  return (
    <div className="print-report-container space-y-8 p-6 bg-background">
      {/* Report Header */}
      <div className="text-center border-b border-border pb-6 mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">GEO Analysis Report</h1>
        <p className="text-lg text-muted-foreground">{brandName}</p>
        <div className="flex items-center justify-center gap-4 mt-4 text-sm text-muted-foreground">
          {analysisDate && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>{analysisDate}</span>
            </div>
          )}
          {models.length > 0 && (
            <div className="flex items-center gap-2">
              {models.map(model => (
                <div key={model} className="flex items-center gap-1">
                  <LLMIcon platform={model} size="sm" />
                  <span className="capitalize">{model === "openai" ? "ChatGPT" : model}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section 1: Executive Summary */}
      <section className="page-break-inside-avoid">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Executive Summary</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-2 bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Overall Assessment</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{executiveSummary.brand_score_and_tier}</p>
            <p className="text-sm text-muted-foreground">{executiveSummary.conclusion}</p>
          </div>
          <div className="bg-primary/10 rounded-xl border border-primary/20 p-4 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold text-primary mb-1">{visibilityData.score}</div>
            <div className="text-sm text-muted-foreground mb-2">GEO Score</div>
            <TierBadge tier={visibilityData.tier} />
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Position {visibilityData.brandPosition} of {visibilityData.totalBrands} brands
            </p>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <h3 className="font-semibold text-foreground">Strengths</h3>
            </div>
            <ul className="space-y-2">
              {executiveSummary.strengths.map((strength: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-green-500/20 text-green-500 text-xs font-semibold">
                    {index + 1}
                  </span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="w-4 h-4 text-red-500" />
              <h3 className="font-semibold text-foreground">Weaknesses</h3>
            </div>
            <ul className="space-y-2">
              {executiveSummary.weaknesses.map((weakness: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-red-500/20 text-red-500 text-xs font-semibold">
                    {index + 1}
                  </span>
                  <span>{weakness}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Competitor Positioning */}
        <div className="bg-card rounded-xl border border-border p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">Competitive Positioning</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Leaders */}
            <div className="bg-green-500/5 rounded-lg p-3 border border-green-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-green-500" />
                <h4 className="font-semibold text-green-600 text-sm">Leaders</h4>
              </div>
              <div className="space-y-2">
                {executiveSummary.competitor_positioning?.leaders?.map((leader: any, idx: number) => (
                  <div key={idx} className="p-2 bg-card rounded-lg">
                    <p className="font-medium text-foreground text-sm">{leader.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{leader.summary}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mid-Tier */}
            <div className="bg-amber-500/5 rounded-lg p-3 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <h4 className="font-semibold text-amber-600 text-sm">Mid-Tier</h4>
              </div>
              <div className="space-y-2">
                {executiveSummary.competitor_positioning?.mid_tier?.map((brand: any, idx: number) => (
                  <div key={idx} className="p-2 bg-card rounded-lg">
                    <p className="font-medium text-foreground text-sm">{brand.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{brand.summary}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Laggards */}
            <div className="bg-red-500/5 rounded-lg p-3 border border-red-500/20">
              <div className="flex items-center gap-2 mb-3">
                <ArrowDown className="w-4 h-4 text-red-500" />
                <h4 className="font-semibold text-red-600 text-sm">Laggards</h4>
              </div>
              <div className="space-y-2">
                {executiveSummary.competitor_positioning?.laggards?.map((brand: any, idx: number) => (
                  <div key={idx} className="p-2 bg-card rounded-lg">
                    <p className="font-medium text-foreground text-sm">{brand.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{brand.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Prioritized Actions */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">Prioritized Actions</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {executiveSummary.prioritized_actions.map((action: string, index: number) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {index + 1}
                </span>
                <span className="text-sm text-foreground">{action}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: Overview Metrics */}
      <section className="page-break-before page-break-inside-avoid">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Overview Metrics</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* AI Visibility Card */}
          <div className="bg-card rounded-xl border p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">AI Visibility</span>
              <TierBadge tier={visibilityData.tier} className="ml-auto" />
            </div>
            <div className="text-3xl font-bold text-primary">#{visibilityData.brandPosition}</div>
            <p className="text-xs text-muted-foreground">GEO Score: {visibilityData.score} | {visibilityData.totalBrands} brands</p>
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <ArrowUp className="w-3 h-3 text-emerald-500" />
                  <span>Top Position</span>
                </div>
                <span className="font-semibold">{visibilityData.positionBreakdown?.topPosition || 0}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <ArrowRight className="w-3 h-3 text-amber-500" />
                  <span>Mid Position (2-4)</span>
                </div>
                <span className="font-semibold">{visibilityData.positionBreakdown?.midPosition || 0}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <ArrowDown className="w-3 h-3 text-red-500" />
                  <span>Low Position</span>
                </div>
                <span className="font-semibold">{visibilityData.positionBreakdown?.lowPosition || 0}%</span>
              </div>
            </div>
          </div>
          
          {/* Brand Mentions Card */}
          <div className="bg-card rounded-xl border p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium">Brand Mention Score</span>
              <TierBadge tier={mentionsData.tier} className="ml-auto" />
            </div>
            <div className="text-3xl font-bold text-amber-500">{mentionsData.brandMentions}</div>
            <p className="text-xs text-muted-foreground mb-3">Top brand: {mentionsData.topBrandMentions}</p>
            <div className="space-y-2">
              {brandMentionRates.slice(0, 5).map((item, index) => (
                <div key={item.brand} className="flex items-center justify-between text-xs">
                  <span className={item.isTestBrand ? 'text-primary font-semibold' : 'text-foreground'}>
                    {item.brand}
                  </span>
                  <span className={item.isTestBrand ? 'text-primary font-semibold' : 'text-foreground'}>
                    {item.responseRate}%
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Sentiment Card */}
          <div className="bg-card rounded-xl border p-4">
            <div className="flex items-center gap-2 mb-2">
              <ThumbsUp className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Sentiment</span>
              <TierBadge tier={sentiment.dominant_sentiment} className="ml-auto" />
            </div>
            <p className="text-sm text-muted-foreground">{sentiment.summary}</p>
          </div>
        </div>
      </section>

      {/* Section 3: Prompts & Keywords - EXPANDED */}
      <section className="page-break-before page-break-inside-avoid">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Prompts & Keywords</h2>
          <span className="ml-auto text-lg font-bold text-primary">{totalBrandScore} Total Score</span>
        </div>
        
        <div className="bg-card rounded-xl border border-border overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Keyword</th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground">{brandName}</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Top Competitor</th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Top Score</th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {keywords.map((keyword: string, index: number) => {
                const keywordIndex = index + 1;
                const brandScore = brandRow ? brandRow[keywordIndex] as number : 0;
                let topCompetitor = '';
                let topScore = 0;
                visibilityTable?.rows?.forEach((row: any) => {
                  const score = row[keywordIndex] as number;
                  if (score > topScore) {
                    topScore = score;
                    topCompetitor = row[0] as string;
                  }
                });
                const isLeading = brandScore === topScore && brandScore > 0;
                const tier = getScoreTier(brandScore, topScore || 1);
                return (
                  <tr key={keyword} className="border-b border-border/50">
                    <td className="py-2 px-4 text-foreground font-medium">{keyword}</td>
                    <td className="py-2 px-4 text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                        brandScore >= 7 ? 'bg-green-500/20 text-green-500' :
                        brandScore >= 4 ? 'bg-amber-500/20 text-amber-500' :
                        'bg-red-500/20 text-red-500'
                      }`}>{brandScore}</span>
                    </td>
                    <td className="py-2 px-4 text-foreground">{topCompetitor}</td>
                    <td className="py-2 px-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold">{topScore}</span>
                    </td>
                    <td className="py-2 px-4 text-center">
                      {isLeading ? (
                        <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-500 text-xs font-medium">Leading</span>
                      ) : (
                        <TierBadge tier={tier} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Expanded Keywords Detail */}
        {keywords.map((keyword: string, index: number) => {
          const keywordIndex = index + 1;
          return (
            <div key={keyword} className="bg-muted/20 rounded-xl border border-border p-4 mb-3">
              <h4 className="font-semibold text-foreground mb-3">All Competitors for "{keyword}"</h4>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {visibilityTable?.rows
                  ?.slice()
                  .sort((a: any, b: any) => (b[keywordIndex] as number) - (a[keywordIndex] as number))
                  .map((row: any) => {
                    const name = row[0] as string;
                    const score = row[keywordIndex] as number;
                    const isBrand = name === brandName;
                    const logo = getBrandLogoUrl(name);
                    return (
                      <div 
                        key={name} 
                        className={`flex flex-col items-center p-3 rounded-xl border ${
                          isBrand ? 'bg-primary/10 border-primary/30' : 'bg-card border-border'
                        }`}
                      >
                        {logo && (
                          <img src={logo} alt="" className="w-8 h-8 rounded-full object-contain bg-white mb-1" />
                        )}
                        <span className={`text-xs font-medium text-center ${isBrand ? 'text-primary' : 'text-foreground'}`}>
                          {name}
                        </span>
                        <span className={`text-lg font-bold ${
                          score >= 7 ? 'text-green-500' :
                          score >= 4 ? 'text-amber-500' :
                          score > 0 ? 'text-red-500' :
                          'text-muted-foreground'
                        }`}>
                          {score}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </section>

      {/* Section 4: Sources & Content Impact - EXPANDED */}
      <section className="page-break-before page-break-inside-avoid">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Sources & Content Impact</h2>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-card rounded-xl border p-3 text-center">
            <Globe className="w-5 h-5 text-primary mx-auto mb-1" />
            <div className="text-2xl font-bold text-foreground">{totalSources}</div>
            <div className="text-xs text-muted-foreground">Categories</div>
          </div>
          <div className="bg-card rounded-xl border p-3 text-center">
            <FileText className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <div className="text-2xl font-bold text-green-500">{presentSources}</div>
            <div className="text-xs text-muted-foreground">Present In</div>
          </div>
          <div className="bg-card rounded-xl border p-3 text-center">
            <BookOpen className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <div className="text-2xl font-bold text-amber-500">{sourcesWithMentions}</div>
            <div className="text-xs text-muted-foreground">With Mentions</div>
          </div>
          <div className="bg-card rounded-xl border p-3 text-center">
            <FileText className="w-5 h-5 text-primary mx-auto mb-1" />
            <div className="text-2xl font-bold text-primary">{totalMentions}</div>
            <div className="text-xs text-muted-foreground">Total Mentions</div>
          </div>
        </div>

        {/* All Checked Sources - EXPANDED */}
        <div className="bg-card rounded-xl border border-border mb-4">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">All Checked Sources ({allCheckedSources.length})</h3>
            </div>
          </div>
          <div className="p-4">
            {allCheckedSources.length > 0 ? (
              <ol className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-1 list-decimal list-inside text-sm">
                {allCheckedSources.map((source, idx) => (
                  <li key={idx} className="text-primary">{source}</li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">No sources found</p>
            )}
          </div>
        </div>

        {/* Sources Table with Expanded Details */}
        <div className="bg-card rounded-xl border border-border overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Source Category</th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Presence</th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Mentions</th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Score</th>
              </tr>
            </thead>
            <tbody>
              {sourcesData.map((source: any) => (
                <tr key={source.name} className="border-b border-border/50">
                  <td className="py-2 px-4 text-foreground font-medium">{source.name}</td>
                  <td className="py-2 px-4 text-center">
                    <TierBadge tier={source[brandPresenceKey] || 'Absent'} />
                  </td>
                  <td className="py-2 px-4 text-center">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                      (source[brandMentionsKey] || 0) > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>{source[brandMentionsKey] || 0}</span>
                  </td>
                  <td className="py-2 px-4 text-center">
                    <TierBadge tier={source[`${brandName}Score`] || 'Low'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Expanded Source Details */}
        {sourcesData.map((source: any) => {
          const notes = depthNotes[source.name as keyof typeof depthNotes];
          const pagesUsed = source.pagesUsed;
          if (!notes && (!pagesUsed || pagesUsed.length === 0)) return null;
          
          return (
            <div key={source.name} className="bg-muted/20 rounded-xl border border-border p-4 mb-3">
              <h4 className="font-semibold text-foreground mb-3">{source.name} - Details</h4>
              
              {notes && typeof notes === 'object' && 'insight' in notes && (
                <div className="bg-card p-3 rounded-lg border border-border mb-3">
                  <h5 className="font-medium text-foreground text-sm mb-1 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    Insight
                  </h5>
                  <p className="text-muted-foreground text-sm">{(notes as any).insight}</p>
                </div>
              )}

              {Array.isArray(pagesUsed) && pagesUsed.length > 0 && (
                <div>
                  <h5 className="font-medium text-foreground text-sm mb-2">Sources Referenced</h5>
                  <div className="flex flex-wrap gap-2">
                    {pagesUsed.map((page: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                        {page}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* All Brands in Source */}
              <div className="mt-3">
                <h5 className="font-medium text-foreground text-sm mb-2">All Brands in this Source</h5>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {sortedBrandInfo.map((brand) => {
                    const brandPresence = source[`${brand.brand}Presence`];
                    const brandMentions = source[`${brand.brand}Mentions`] || 0;
                    const isCurrent = brand.brand === brandName;

                    return (
                      <div
                        key={brand.brand}
                        className={`flex flex-col items-center p-2 rounded-lg border ${
                          isCurrent ? 'bg-primary/10 border-primary/30' : 'bg-card border-border'
                        }`}
                      >
                        {brand.logo && (
                          <img src={brand.logo} alt="" className="w-6 h-6 rounded-full object-contain bg-white mb-1" />
                        )}
                        <span className={`text-xs font-medium text-center truncate w-full ${isCurrent ? 'text-primary' : 'text-foreground'}`}>
                          {brand.brand}
                        </span>
                        <span className="text-lg font-bold text-foreground">{brandMentions}</span>
                        <TierBadge tier={brandPresence || 'Absent'} className="text-[10px]" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Section 5: Competitor Analysis */}
      <section className="page-break-before page-break-inside-avoid">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Competitor Analysis</h2>
        </div>

        {/* AI Visibility Score Comparison */}
        <div className="bg-card rounded-xl border border-border overflow-hidden mb-4">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">AI Visibility Score Comparison</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Brand visibility scores across different search keywords</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Brand</th>
                {keywords.map((keyword: string) => (
                  <th key={keyword} className="text-center py-3 px-4 font-semibold text-muted-foreground text-xs">{keyword}</th>
                ))}
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Total</th>
              </tr>
            </thead>
            <tbody>
              {sortedCompetitorData.map(c => {
                const isPrimaryBrand = c.name === brandName;
                return (
                  <tr key={c.name} className={`border-b border-border/50 ${isPrimaryBrand ? 'bg-primary/5' : ''}`}>
                    <td className={`py-2 px-4 font-medium ${isPrimaryBrand ? 'text-primary' : 'text-foreground'}`}>
                      <div className="flex items-center gap-2">
                        {c.logo && (
                          <img src={c.logo} alt={c.name} className="w-5 h-5 rounded-full object-contain bg-white" />
                        )}
                        <span className="text-sm">{c.name}</span>
                      </div>
                    </td>
                    {c.keywordScores.map((score: number, idx: number) => (
                      <td key={idx} className="py-2 px-4 text-center text-foreground text-sm">{score}</td>
                    ))}
                    <td className="py-2 px-4 text-center">
                      <span className={`px-2 py-1 rounded-lg font-semibold text-sm ${isPrimaryBrand ? 'bg-primary text-white' : 'bg-muted text-foreground'}`}>
                        {c.totalScore}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Competitor Sentiment Analysis */}
        <div className="bg-card rounded-xl border border-border overflow-hidden mb-4">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Competitor Sentiment Analysis</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-1">How AI models perceive and describe each competitor</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Brand</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Sentiment Summary</th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Outlook</th>
              </tr>
            </thead>
            <tbody>
              {sortedSentiment.map((item, index) => {
                const isPrimaryBrand = item.brand === brandName;
                return (
                  <tr key={index} className={`border-b border-border/50 ${isPrimaryBrand ? 'bg-primary/5' : ''}`}>
                    <td className={`py-2 px-4 font-medium ${isPrimaryBrand ? 'text-primary' : 'text-foreground'}`}>
                      <div className="flex items-center gap-2">
                        {item.logo && (
                          <img src={item.logo} alt={item.brand} className="w-5 h-5 rounded-full object-contain bg-white" />
                        )}
                        <span className="text-sm">{item.brand}</span>
                      </div>
                    </td>
                    <td className="py-2 px-4 text-muted-foreground text-xs">{item.summary}</td>
                    <td className="py-2 px-4 text-center">
                      <TierBadge tier={item.outlook} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Number of Source Citations */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Number of Source Citations</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Brand mentions count across different source categories</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Source</th>
                {allBrandNames.map((brand: string) => (
                  <th key={brand} className={`text-center py-3 px-4 font-semibold text-xs ${brand === brandName ? 'text-primary' : 'text-muted-foreground'}`}>
                    {brand}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sourcesData.map((source: any) => (
                <tr key={source.name} className="border-b border-border/50">
                  <td className="py-2 px-4 font-medium text-foreground text-sm">{source.name}</td>
                  {allBrandNames.map((brand: string) => {
                    const mentions = source[`${brand}Mentions`] || 0;
                    const isPrimaryBrand = brand === brandName;
                    return (
                      <td key={brand} className="py-2 px-4 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                          isPrimaryBrand 
                            ? mentions > 0 ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                            : mentions > 0 ? 'bg-muted text-foreground' : 'bg-muted/50 text-muted-foreground'
                        }`}>
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
      </section>

      {/* Section 6: Brand Sentiment */}
      <section className="page-break-before page-break-inside-avoid">
        <div className="flex items-center gap-2 mb-4">
          <ThumbsUp className="w-6 h-6 text-green-500" />
          <h2 className="text-2xl font-bold text-foreground">Brand Sentiment Analysis</h2>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {['Positive', 'Neutral', 'Negative'].map(sentimentType => {
            const count = competitorSentiment.filter(c => c.outlook === sentimentType).length;
            const matchingBrands = competitorSentiment.filter(c => c.outlook === sentimentType);
            const colors = {
              'Positive': 'bg-green-500/10 border-green-500/30 text-green-500',
              'Neutral': 'bg-gray-500/10 border-gray-500/30 text-gray-500',
              'Negative': 'bg-red-500/10 border-red-500/30 text-red-500'
            };
            return (
              <div key={sentimentType} className={`rounded-xl border p-3 ${colors[sentimentType as keyof typeof colors]}`}>
                <div className="flex items-center justify-between mb-2">
                  <TierBadge tier={sentimentType} />
                  <span className="text-2xl font-bold">{count}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">Brands with {sentimentType.toLowerCase()} outlook</p>
                <div className="flex flex-wrap gap-1">
                  {matchingBrands.map(item => (
                    <span 
                      key={item.brand} 
                      className={`text-xs px-2 py-0.5 rounded-full bg-card/80 ${
                        item.brand === brandName ? 'text-primary border border-primary' : 'text-foreground'
                      }`}
                    >
                      {item.brand}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Brand</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Summary</th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Outlook</th>
              </tr>
            </thead>
            <tbody>
              {sortedSentiment.map((item, index) => {
                const isPrimaryBrand = item.brand === brandName;
                return (
                  <tr key={index} className={`border-b border-border/50 ${isPrimaryBrand ? 'bg-primary/5' : ''}`}>
                    <td className={`py-2 px-4 font-medium ${isPrimaryBrand ? 'text-primary' : 'text-foreground'}`}>
                      <div className="flex items-center gap-2">
                        {item.logo && (
                          <img src={item.logo} alt={item.brand} className="w-5 h-5 rounded-full object-contain bg-white" />
                        )}
                        <span className="text-sm font-semibold">{item.brand}</span>
                      </div>
                    </td>
                    <td className="py-2 px-4 text-muted-foreground text-xs">{item.summary}</td>
                    <td className="py-2 px-4 text-center">
                      <TierBadge tier={item.outlook} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 7: Recommendations */}
      <section className="page-break-before page-break-inside-avoid">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-6 h-6 text-amber-500" />
          <h2 className="text-2xl font-bold text-foreground">Strategic Recommendations</h2>
          <span className="ml-auto text-lg font-bold text-amber-500">{recommendations.length} Actions</span>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-green-500/10 rounded-xl border border-green-500/20 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">High Impact</span>
              <span className="text-2xl font-bold text-green-500">{recommendations.filter((r: any) => r.impact === 'High').length}</span>
            </div>
          </div>
          <div className="bg-amber-500/10 rounded-xl border border-amber-500/20 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Medium</span>
              <span className="text-2xl font-bold text-amber-500">{recommendations.filter((r: any) => r.impact === 'Medium').length}</span>
            </div>
          </div>
          <div className="bg-muted rounded-xl border border-border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Quick Wins</span>
              <span className="text-2xl font-bold text-foreground">{recommendations.filter((r: any) => r.overall_effort === 'Low').length}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {recommendations.map((rec: any, index: number) => {
            const effortConfig = getEffortConfig(rec.overall_effort);
            const impactConfig = getImpactConfig(rec.impact);
            return (
              <div key={index} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${impactConfig.bg} ${impactConfig.text} font-bold text-sm`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Lightbulb className="w-3 h-3 text-amber-400" />
                      <span className="text-xs font-medium text-muted-foreground uppercase">Insight</span>
                    </div>
                    <p className="text-sm text-foreground">{rec.overall_insight}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <div className={`px-2 py-1 rounded-lg ${effortConfig.bg}`}>
                      <span className="text-[8px] text-muted-foreground block">Effort</span>
                      <span className={`text-xs font-semibold ${effortConfig.text}`}>{rec.overall_effort}</span>
                    </div>
                    <div className={`px-2 py-1 rounded-lg ${impactConfig.bg}`}>
                      <span className="text-[8px] text-muted-foreground block">Impact</span>
                      <span className={`text-xs font-semibold ${impactConfig.text}`}>{rec.impact}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10 ml-11">
                  <Target className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-medium text-primary uppercase block mb-0.5">Action</span>
                    <p className="text-xs text-foreground">{rec.suggested_action}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <div className="text-center border-t border-border pt-6 mt-8 text-sm text-muted-foreground">
        <p>Generated by GeoRankers • {analysisDate}</p>
      </div>
    </div>
  );
};

export default FullReportContent;