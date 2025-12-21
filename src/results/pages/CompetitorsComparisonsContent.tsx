import { getAnalytics, getCompetitorData, getCompetitorSentiment, getCompetitorVisibility, getBrandName, getKeywords, getBrandLogo, getBrandInfoWithLogos, getSourcesData } from "@/results/data/analyticsData";
import { TierBadge } from "@/results/ui/TierBadge";
import { useState, useMemo, useEffect } from "react";
import { Trophy, Users, TrendingUp, Info, BarChart3, MessageCircle, Layers } from "lucide-react";
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
  const sourcesData = getSourcesData();
  
  const otherCompetitors = competitorData.filter(c => c.name !== brandName);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>('');

  // Set initial selected competitor when data loads
  useEffect(() => {
    if (otherCompetitors.length > 0 && !selectedCompetitor) {
      setSelectedCompetitor(otherCompetitors[0]?.name || '');
    }
  }, [otherCompetitors, selectedCompetitor]);

  const brand = competitorVisibility.find(c => c.name === brandName);
  const competitor = competitorVisibility.find(c => c.name === selectedCompetitor);

  const brandSentiment = competitorSentiment.find(s => s.brand === brandName);
  const competitorSentimentData = competitorSentiment.find(s => s.brand === selectedCompetitor);

  const brandLogo = getBrandLogo(brandName);
  const competitorLogo = getBrandLogo(selectedCompetitor);

  const sortedCompetitorData = useMemo(() => {
    return [...competitorData].sort((a, b) => b.totalScore - a.totalScore);
  }, [competitorData]);

  // Get all brand names for the source citations table
  const allBrandNames = useMemo(() => {
    return competitorData.map(c => c.name);
  }, [competitorData]);

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
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Competitor Analysis</h1>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-card border border-border">
                  <p>Comprehensive analysis of your brand's visibility compared to competitors across AI platforms.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-sm text-muted-foreground">Compare your brand visibility against competitors</p>
          </div>
        </div>
      </div>

      {/* Card 1: AI Visibility Score Comparison */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 md:p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">AI Visibility Score Comparison</h3>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-card border border-border">
                <p>Compares how often each brand appears in AI-generated responses for each keyword. Higher scores indicate stronger visibility in AI search results.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Brand visibility scores across different search keywords</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Brand</th>
                {keywords.map(keyword => (
                  <th key={keyword} className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{keyword}</th>
                ))}
                <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody>
              {sortedCompetitorData.map(c => {
                const isPrimaryBrand = c.name === brandName;
                return (
                  <tr key={c.name} className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${isPrimaryBrand ? 'bg-primary/5' : ''}`}>
                    <td className={`py-3 px-4 font-medium ${isPrimaryBrand ? 'text-primary' : 'text-foreground'}`}>
                      <div className="flex items-center gap-2">
                        {c.logo ? (
                          <img 
                            src={c.logo} 
                            alt={c.name} 
                            className="w-6 h-6 rounded-full object-contain bg-white shadow-sm"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isPrimaryBrand ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                          }`}>
                            {c.name[0]}
                          </div>
                        )}
                        <span className="text-sm font-semibold">{c.name}</span>
                      </div>
                    </td>
                    {c.keywordScores.map((score, idx) => (
                      <td key={idx} className="py-3 px-4 text-center text-foreground text-sm">{score}</td>
                    ))}
                    <td className="py-3 px-4 text-center">
                      <span className={`px-3 py-1.5 rounded-lg font-semibold text-sm ${isPrimaryBrand ? 'bg-primary text-white' : 'bg-muted text-foreground'}`}>
                        {c.totalScore}
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
            <h3 className="text-lg font-semibold text-foreground">Competitor Sentiment Analysis</h3>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-card border border-border">
                <p>Analysis of how AI models portray each brand in their responses, including sentiment summary and overall outlook.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-sm text-muted-foreground mt-1">How AI models perceive and describe each competitor</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Brand</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sentiment Summary</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Overall Outlook</th>
              </tr>
            </thead>
            <tbody>
              {competitorSentiment.map(sentiment => {
                const isPrimaryBrand = sentiment.brand === brandName;
                return (
                  <tr key={sentiment.brand} className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${isPrimaryBrand ? 'bg-primary/5' : ''}`}>
                    <td className={`py-3 px-4 font-medium ${isPrimaryBrand ? 'text-primary' : 'text-foreground'}`}>
                      <div className="flex items-center gap-2">
                        {sentiment.logo ? (
                          <img 
                            src={sentiment.logo} 
                            alt={sentiment.brand} 
                            className="w-6 h-6 rounded-full object-contain bg-white shadow-sm"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isPrimaryBrand ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                          }`}>
                            {sentiment.brand[0]}
                          </div>
                        )}
                        <span className="text-sm font-semibold">{sentiment.brand}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground max-w-md">{sentiment.summary}</td>
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
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 md:p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Number of Source Citations</h3>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-card border border-border">
                <p>Visibility of each brand across different sources as referenced by AI models.</p>
                <p className="mt-2 text-xs">
                  <strong>Mention Score:</strong><br/>
                  High ≥ 80 | Medium 40–79 | Low &lt; 40
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Brand mentions count across different source categories</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Source</th>
                {allBrandNames.map(brand => (
                  <th key={brand} className={`text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider ${brand === brandName ? 'text-primary' : 'text-muted-foreground'}`}>
                    {brand}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sourcesData.map((source: any) => (
                <tr key={source.name} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-medium text-foreground text-sm">{source.name}</td>
                  {allBrandNames.map(brand => {
                    const mentions = source[`${brand}Mentions`] || 0;
                    const isPrimaryBrand = brand === brandName;
                    return (
                      <td key={brand} className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
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
      </div>
    </div>
  );
};

export default CompetitorsComparisonsContent;