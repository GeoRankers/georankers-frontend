import {
  getBrandName,
  getBrandInfoWithLogos,
  getAnalytics,
} from "@/results/data/analyticsData";
import {
  ChevronDown,
  ChevronRight,
  Globe,
  FileText,
  Layers,
  Search,
  Lightbulb,
  Link2,
} from "lucide-react";
import { useState, useMemo } from "react";

const SourcesAllContent = () => {
  const brandName = getBrandName();
  const analytics = getAnalytics();
  const sourcesAndContentImpact = analytics?.sources_and_content_impact || {};
  const brandInfo = getBrandInfoWithLogos();

  const [expandedSource, setExpandedSource] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Transform the new data structure
  const sourcesData = useMemo(() => {
    if (!sourcesAndContentImpact || typeof sourcesAndContentImpact !== 'object') return [];
    
    return Object.entries(sourcesAndContentImpact).map(([sourceName, sourceData]: [string, any]) => {
      const mentions = sourceData.mentions || {};
      const pagesUsed = sourceData.pages_used || [];
      
      // Calculate totals across all brands for this source
      let totalMentions = 0;
      Object.values(mentions).forEach((m: any) => {
        totalMentions += m.count || 0;
      });
      
      return {
        name: sourceName,
        pagesUsed,
        mentions,
        totalMentions,
        brandMentions: mentions[brandName]?.count || 0,
        brandScore: Math.round((mentions[brandName]?.score || 0) * 100),
        brandInsight: mentions[brandName]?.insight || '',
      };
    });
  }, [sourcesAndContentImpact, brandName]);

  // Filter sources based on search
  const filteredSources = sourcesData.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Total stats
  const totalSources = sourcesData.length;
  const totalMentionsAll = sourcesData.reduce((acc, s) => acc + s.totalMentions, 0);

  const getBrandLogo = (name: string) => {
    const brand = brandInfo.find(b => b.brand === name);
    return brand?.logo;
  };

  // Get top competitor for a source
  const getTopCompetitorForSource = (mentions: Record<string, any>) => {
    let topBrand = '';
    let topScore = 0;
    let topLogo = '';
    
    Object.entries(mentions).forEach(([brand, data]: [string, any]) => {
      if (data.count > topScore) {
        topScore = data.count;
        topBrand = brand;
        topLogo = getBrandLogo(brand) || '';
      }
    });
    
    return { brand: topBrand, count: topScore, logo: topLogo };
  };

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header with gradient */}
      <div className="relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/20 p-4 md:p-6">
        <div className="absolute top-0 right-0 w-32 md:w-48 h-32 md:h-48 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-2 md:p-3 bg-primary/10 rounded-lg md:rounded-xl">
              <Layers className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-foreground">Sources & Content Impact</h1>
              <p className="text-xs md:text-sm text-muted-foreground">{totalSources} source categories, {totalMentionsAll} total mentions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search source categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 bg-card border border-border rounded-lg md:rounded-xl text-sm md:text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        />
      </div>

      {/* Sources with Dropdown */}
      <div className="space-y-4">
        {filteredSources.map((source) => {
          const isExpanded = expandedSource === source.name;
          const topCompetitor = getTopCompetitorForSource(source.mentions);

          return (
            <div key={source.name} className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
              {/* Source Header */}
              <div 
                className="p-4 md:p-5 flex items-center justify-between gap-3 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedSource(isExpanded ? null : source.name)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-primary flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <span className="font-semibold text-foreground text-sm md:text-base block truncate">{source.name}</span>
                    <span className="text-xs text-muted-foreground">{source.pagesUsed.length} sources referenced</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {/* Brand Score Badge */}
                  <div className="flex flex-col items-center">
                    <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${
                      source.brandMentions >= 2 ? 'bg-green-500/20 text-green-500' :
                      source.brandMentions >= 1 ? 'bg-amber-500/20 text-amber-500' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {source.brandMentions}
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
                      <span className="text-xs font-bold text-primary">{topCompetitor.count}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-border/50 bg-muted/20">
                  <div className="p-4 md:p-5 space-y-4">
                    {/* Brand Insight */}
                    {source.brandInsight && (
                      <div className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border/50">
                        <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-semibold text-foreground">Insight for {brandName}:</span>
                          <p className="text-sm text-muted-foreground mt-1">{source.brandInsight}</p>
                        </div>
                      </div>
                    )}

                    {/* Pages Used */}
                    {source.pagesUsed.length > 0 && (
                      <div className="pt-2">
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                          <Link2 className="w-4 h-4 text-primary" />
                          Sources Referenced ({source.pagesUsed.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {source.pagesUsed.map((p: string, i: number) => (
                            <a
                              key={i}
                              href={p.startsWith("http") ? p : `https://${p}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs hover:bg-primary/20 transition-colors"
                            >
                              <Globe className="w-3 h-3" />
                              <span className="max-w-[300px] truncate">{p}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Brand Mentions Table */}
                    <div className="pt-4 border-t border-border/50">
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4 text-primary" />
                        Brand Mentions in "{source.name}"
                      </h4>
                      
                      {/* Desktop Table */}
                      <div className="hidden md:block bg-card rounded-lg border border-border overflow-hidden">
                        {/* Table Header */}
                        <div className="bg-muted/50 px-4 py-3 border-b border-border">
                          <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-muted-foreground uppercase">
                            <span className="col-span-3">Brand</span>
                            <span className="col-span-2 text-center">Mentions</span>
                            <span className="col-span-2 text-center">Score</span>
                            <span className="col-span-5">Insight</span>
                          </div>
                        </div>
                        
                        {/* Brand Rows */}
                        <div className="divide-y divide-border/50">
                          {Object.entries(source.mentions)
                            .sort(([, a]: any, [, b]: any) => b.count - a.count)
                            .map(([brand, data]: [string, any]) => {
                              const isBrand = brand === brandName;
                              const logo = getBrandLogo(brand);
                              const scorePercent = Math.round((data.score || 0) * 100);
                              
                              return (
                                <div 
                                  key={brand} 
                                  className={`px-4 py-3 ${isBrand ? 'bg-primary/5' : 'hover:bg-muted/30'} transition-colors`}
                                >
                                  <div className="grid grid-cols-12 gap-4 items-center">
                                    <div className="col-span-3 flex items-center gap-2 min-w-0">
                                      {logo && (
                                        <img src={logo} alt="" className="w-6 h-6 rounded-full object-contain bg-white flex-shrink-0 border border-border/50" />
                                      )}
                                      <span className={`text-sm truncate ${isBrand ? 'text-primary font-semibold' : 'text-foreground font-medium'}`}>
                                        {brand}
                                      </span>
                                    </div>
                                    <div className="col-span-2 flex justify-center">
                                      <span className={`inline-flex items-center justify-center min-w-[2.5rem] h-10 px-3 rounded-full text-sm font-bold ${
                                        data.count >= 2 ? 'bg-green-500/20 text-green-500' :
                                        data.count >= 1 ? 'bg-amber-500/20 text-amber-500' :
                                        'bg-muted text-muted-foreground'
                                      }`}>
                                        {data.count}
                                      </span>
                                    </div>
                                    <div className="col-span-2 flex justify-center">
                                      <span className={`text-sm font-bold ${
                                        scorePercent >= 70 ? 'text-green-500' :
                                        scorePercent >= 40 ? 'text-amber-500' :
                                        'text-muted-foreground'
                                      }`}>
                                        {scorePercent}%
                                      </span>
                                    </div>
                                    <div className="col-span-5">
                                      <p className="text-xs text-muted-foreground line-clamp-2">
                                        {data.insight || '-'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>

                      {/* Mobile Cards */}
                      <div className="md:hidden space-y-3">
                        {Object.entries(source.mentions)
                          .sort(([, a]: any, [, b]: any) => b.count - a.count)
                          .map(([brand, data]: [string, any]) => {
                            const isBrand = brand === brandName;
                            const logo = getBrandLogo(brand);
                            const scorePercent = Math.round((data.score || 0) * 100);
                            
                            return (
                              <div 
                                key={brand} 
                                className={`p-4 rounded-lg border ${
                                  isBrand ? 'bg-primary/5 border-primary/20' : 'bg-card border-border'
                                }`}
                              >
                                {/* Brand Name */}
                                <div className="flex items-center gap-2 mb-3">
                                  {logo && (
                                    <img src={logo} alt="" className="w-6 h-6 rounded-full object-contain bg-white border border-border/50" />
                                  )}
                                  <span className={`text-sm font-semibold ${isBrand ? 'text-primary' : 'text-foreground'}`}>
                                    {brand}
                                  </span>
                                </div>
                                
                                {/* Metrics */}
                                <div className="flex items-center gap-4 mb-3">
                                  <div className="flex flex-col items-center">
                                    <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${
                                      data.count >= 2 ? 'bg-green-500/20 text-green-500' :
                                      data.count >= 1 ? 'bg-amber-500/20 text-amber-500' :
                                      'bg-muted text-muted-foreground'
                                    }`}>
                                      {data.count}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground mt-1">mentions</span>
                                  </div>
                                  <div className="flex flex-col items-center">
                                    <span className={`text-lg font-bold ${
                                      scorePercent >= 70 ? 'text-green-500' :
                                      scorePercent >= 40 ? 'text-amber-500' :
                                      'text-muted-foreground'
                                    }`}>
                                      {scorePercent}%
                                    </span>
                                    <span className="text-[10px] text-muted-foreground mt-1">score</span>
                                  </div>
                                </div>
                                
                                {/* Insight */}
                                {data.insight && (
                                  <p className="text-xs text-muted-foreground">
                                    {data.insight}
                                  </p>
                                )}
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

      {filteredSources.length === 0 && (
        <div className="text-center py-8 md:py-12 text-muted-foreground bg-card rounded-xl border border-border text-sm md:text-base">
          No source categories found matching "{searchQuery}"
        </div>
      )}
    </div>
  );
};

export default SourcesAllContent;