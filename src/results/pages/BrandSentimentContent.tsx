import { TierBadge } from "@/results/ui/TierBadge";
import { getCompetitorSentiment, getBrandName, getSentiment, getBrandLogo } from "@/results/data/analyticsData";
import { Info, ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const BrandSentimentContent = () => {
  const brandName = getBrandName();
  const sentiment = getSentiment();
  const brandLogo = getBrandLogo(brandName);
  const competitorSentiment = getCompetitorSentiment();

  const outlookOrder = { 'Positive': 0, 'Neutral': 1, 'Negative': 2 };
  const sortedSentiment = useMemo(() => {
    return [...competitorSentiment].sort((a, b) => {
      return (outlookOrder[a.outlook as keyof typeof outlookOrder] || 2) - 
             (outlookOrder[b.outlook as keyof typeof outlookOrder] || 2);
    });
  }, [competitorSentiment]);

  return (
    <div className="p-4 md:p-6 space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-500/20 via-green-500/10 to-transparent border border-green-500/20 p-4 md:p-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex items-center gap-3">
          <div className="p-3 bg-green-500/10 rounded-xl">
            <ThumbsUp className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Brand Sentiment</h1>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-card border border-border">
                  <p>Analysis of how AI platforms perceive and present each brand.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-sm text-muted-foreground">Comprehensive sentiment analysis across the competitive landscape</p>
          </div>
        </div>
      </div>

      {/* Primary Brand Sentiment */}
      <div className="bg-card rounded-xl border border-border p-4 md:p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {brandLogo ? (
              <img 
                src={brandLogo} 
                alt={brandName} 
                className="w-12 h-12 rounded-full object-contain bg-white shadow-md"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                {brandName[0]}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-lg font-semibold text-foreground">{brandName} Sentiment Overview</h3>
              <TierBadge tier={sentiment.dominant_sentiment} />
            </div>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">{sentiment.summary}</p>
          </div>
        </div>
      </div>

      {/* Sentiment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['Positive', 'Neutral', 'Negative'].map(sentimentType => {
          const matchingBrands = competitorSentiment.filter(c => c.outlook === sentimentType);
          const count = matchingBrands.length;
          const colors = {
            'Positive': 'from-green-500/20 to-green-500/5 border-green-500/30',
            'Neutral': 'from-gray-500/20 to-gray-500/5 border-gray-500/30',
            'Negative': 'from-red-500/20 to-red-500/5 border-red-500/30'
          };
          
          return (
            <div key={sentimentType} className={`rounded-xl border p-4 md:p-5 bg-gradient-to-br ${colors[sentimentType as keyof typeof colors]}`}>
              <div className="flex items-center justify-between mb-4">
                <TierBadge tier={sentimentType} />
                <span className="text-2xl md:text-3xl font-bold text-foreground">{count}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Brands with {sentimentType.toLowerCase()} outlook</p>
              <div className="flex flex-wrap gap-2">
                {matchingBrands.map(item => (
                  <div 
                    key={item.brand} 
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full bg-card/80 border ${
                      item.brand === brandName ? 'border-primary text-primary' : 'border-border text-foreground'
                    }`}
                  >
                    {item.logo && (
                      <img 
                        src={item.logo} 
                        alt={item.brand} 
                        className="w-4 h-4 rounded-full object-contain bg-white"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                    <span className="font-medium">{item.brand}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* All Brands Sentiment Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 md:p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Competitor Sentiment Analysis</h3>
          <p className="text-sm text-muted-foreground">Detailed breakdown by brand (sorted by outlook)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/30">
                <th className="text-left py-4 px-4 md:px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Brand</th>
                <th className="text-left py-4 px-4 md:px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Sentiment Summary</th>
                <th className="text-center py-4 px-4 md:px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Outlook</th>
              </tr>
            </thead>
            <tbody>
              {sortedSentiment.map((item, index) => {
                const isPrimaryBrand = item.brand === brandName;
                return (
                  <tr 
                    key={index} 
                    className={`border-b border-border/50 ${isPrimaryBrand ? 'bg-primary/5' : 'hover:bg-muted/20'} transition-colors`}
                  >
                    <td className={`py-4 px-4 md:px-6 font-medium ${isPrimaryBrand ? 'text-primary' : 'text-foreground'}`}>
                      <div className="flex items-center gap-3">
                        {item.logo ? (
                          <img 
                            src={item.logo} 
                            alt={item.brand} 
                            className="w-8 h-8 rounded-full object-contain bg-white shadow-sm"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            isPrimaryBrand ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                          }`}>
                            {item.brand[0]}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="font-semibold">{item.brand}</span>
                          <span className="text-xs text-muted-foreground md:hidden line-clamp-1">{item.summary.slice(0, 50)}...</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 md:px-6 text-sm text-muted-foreground max-w-md hidden md:table-cell">
                      <p className="line-clamp-2">{item.summary}</p>
                    </td>
                    <td className="py-4 px-4 md:px-6">
                      <div className="flex justify-center">
                        <TierBadge tier={item.outlook} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BrandSentimentContent;
