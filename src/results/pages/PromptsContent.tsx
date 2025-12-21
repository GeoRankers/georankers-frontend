import { getAnalytics, getBrandName, getBrandInfoWithLogos, getSearchKeywordsWithPrompts } from "@/results/data/analyticsData";
import { ChevronDown, ChevronRight, Search, Zap, MessageSquare } from "lucide-react";
import { useState } from "react";

const PromptsContent = () => {
  const brandName = getBrandName();
  const brandInfo = getBrandInfoWithLogos();
  const keywordsWithPrompts = getSearchKeywordsWithPrompts();
  const [expandedKeyword, setExpandedKeyword] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter keywords based on search
  const filteredKeywords = keywordsWithPrompts.filter(k => 
    k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    k.prompts.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getBrandLogo = (name: string) => {
    const brand = brandInfo.find(b => b.brand === name);
    return brand?.logo;
  };

  // Get brand's mention breakdown for a keyword
  const getBrandScoreForKeyword = (keywordId: string) => {
    const brand = brandInfo.find(b => b.brand === brandName);
    return brand?.mention_breakdown?.[keywordId] || 0;
  };

  // Get top competitor for a keyword
  const getTopCompetitorForKeyword = (keywordId: string) => {
    let topBrand = '';
    let topScore = 0;
    let topLogo = '';
    
    brandInfo.forEach(b => {
      const score = b.mention_breakdown?.[keywordId] || 0;
      if (score > topScore) {
        topScore = score;
        topBrand = b.brand;
        topLogo = b.logo;
      }
    });
    
    return { brand: topBrand, score: topScore, logo: topLogo };
  };

  // Calculate total prompts
  const totalPrompts = keywordsWithPrompts.reduce((acc, k) => acc + k.prompts.length, 0);

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header with gradient */}
      <div className="relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/20 p-4 md:p-6">
        <div className="absolute top-0 right-0 w-32 md:w-48 h-32 md:h-48 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-2 md:p-3 bg-primary/10 rounded-lg md:rounded-xl">
              <Zap className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-foreground">Prompts & Keywords</h1>
              <p className="text-xs md:text-sm text-muted-foreground">{keywordsWithPrompts.length} keywords, {totalPrompts} prompts analyzed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search keywords or prompts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 bg-card border border-border rounded-lg md:rounded-xl text-sm md:text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        />
      </div>

      {/* Keywords with Prompts */}
      <div className="space-y-4">
        {filteredKeywords.map((keyword) => {
          const isExpanded = expandedKeyword === keyword.id;
          const brandScore = getBrandScoreForKeyword(keyword.id);
          const topCompetitor = getTopCompetitorForKeyword(keyword.id);
          const promptCount = keyword.prompts.length;

          return (
            <div key={keyword.id} className="bg-card rounded-xl border border-border overflow-hidden">
              {/* Keyword Header */}
              <div 
                className="p-4 md:p-5 flex items-center justify-between gap-3 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedKeyword(isExpanded ? null : keyword.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-primary flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <span className="font-semibold text-foreground text-sm md:text-base block truncate">{keyword.name}</span>
                    <span className="text-xs text-muted-foreground">{promptCount} prompts</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {/* Brand Score Badge */}
                  <div className="flex flex-col items-center">
                    <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${
                      brandScore >= 3 ? 'bg-green-500/20 text-green-500' :
                      brandScore >= 1 ? 'bg-amber-500/20 text-amber-500' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {brandScore}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-1">mentions</span>
                  </div>
                  
                  {/* Top Competitor */}
                  {topCompetitor.brand && (
                    <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                      {topCompetitor.logo && (
                        <img src={topCompetitor.logo} alt="" className="w-5 h-5 rounded-full object-contain bg-white" />
                      )}
                      <span className="text-xs text-muted-foreground">Top:</span>
                      <span className="text-xs font-medium">{topCompetitor.brand}</span>
                      <span className="text-xs font-bold text-primary">{topCompetitor.score}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Expanded Prompts List */}
              {isExpanded && (
                <div className="border-t border-border/50 bg-muted/20">
                  <div className="p-4 md:p-5 space-y-3">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      AI Prompts Used
                    </h4>
                    <div className="space-y-2">
                      {keyword.prompts.map((prompt, idx) => (
                        <div 
                          key={idx} 
                          className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border/50"
                        >
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex-shrink-0">
                            {idx + 1}
                          </span>
                          <p className="text-sm text-foreground leading-relaxed">{prompt}</p>
                        </div>
                      ))}
                    </div>
                    
                    {/* Competitor Breakdown */}
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <h4 className="text-sm font-semibold text-foreground mb-3">Brand Mentions for "{keyword.name}"</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {brandInfo
                          .filter(b => (b.mention_breakdown?.[keyword.id] || 0) > 0 || b.brand === brandName)
                          .sort((a, b) => (b.mention_breakdown?.[keyword.id] || 0) - (a.mention_breakdown?.[keyword.id] || 0))
                          .map(brand => {
                            const score = brand.mention_breakdown?.[keyword.id] || 0;
                            const isBrand = brand.brand === brandName;
                            return (
                              <div 
                                key={brand.brand} 
                                className={`flex flex-col items-center p-3 rounded-lg border transition-all ${
                                  isBrand 
                                    ? 'bg-primary/10 border-primary/30' 
                                    : 'bg-muted/50 border-border'
                                }`}
                              >
                                {brand.logo && (
                                  <img src={brand.logo} alt="" className="w-8 h-8 rounded-full object-contain bg-white mb-1" />
                                )}
                                <span className={`text-[10px] font-medium text-center truncate w-full ${isBrand ? 'text-primary' : 'text-foreground'}`}>
                                  {brand.brand}
                                </span>
                                <span className={`text-lg font-bold ${
                                  score >= 3 ? 'text-green-500' :
                                  score >= 1 ? 'text-amber-500' :
                                  'text-muted-foreground'
                                }`}>
                                  {score}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredKeywords.length === 0 && (
        <div className="text-center py-8 md:py-12 text-muted-foreground bg-card rounded-xl border border-border text-sm md:text-base">
          No keywords or prompts found matching "{searchQuery}"
        </div>
      )}
    </div>
  );
};

export default PromptsContent;
