import { Layout } from "@/results/layout/Layout";
import { getSourcesData, getBrandName, getDepthNotes, getBrandInfoWithLogos } from "@/results/data/analyticsData";
import { TierBadge } from "@/results/ui/TierBadge";
import { ChevronDown, ChevronRight, Globe, FileText, Layers, BookOpen } from "lucide-react";
import { useState, useMemo } from "react";

const SourcesAll = () => {
  const brandName = getBrandName();
  const sourcesData = getSourcesData();
  const depthNotes = getDepthNotes();
  const brandInfo = getBrandInfoWithLogos();
  const [expandedSource, setExpandedSource] = useState<string | null>(null);

  // Calculate totals
  const totalSources = sourcesData.length;
  const brandMentionsKey = `${brandName}Mentions`;
  const brandPresenceKey = `${brandName}Presence`;
  const sourcesWithMentions = sourcesData.filter(s => (s[brandMentionsKey] || 0) > 0).length;
  const totalMentions = sourcesData.reduce((acc, s) => acc + (s[brandMentionsKey] || 0), 0);
  const presentSources = sourcesData.filter(s => s[brandPresenceKey] === 'Present').length;

  // Sort sources by brand mentions in decreasing order
  const sortedSourcesData = useMemo(() => {
    return [...sourcesData].sort((a, b) => {
      const aMentions = a[brandMentionsKey] || 0;
      const bMentions = b[brandMentionsKey] || 0;
      return bMentions - aMentions;
    });
  }, [sourcesData, brandMentionsKey]);

  // Sort brand info by mention count for expanded view
  const sortedBrandInfo = useMemo(() => {
    return [...brandInfo].sort((a, b) => b.mention_count - a.mention_count);
  }, [brandInfo]);

  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header with gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/20 p-4 md:p-6">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Layers className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Sources & Content Impact</h1>
              <p className="text-sm text-muted-foreground">Where your brand is being cited by AI</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-card rounded-xl border border-border p-4 md:p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Globe className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <span className="text-xs md:text-sm text-muted-foreground">Source Categories</span>
            </div>
            <span className="text-2xl md:text-3xl font-bold text-foreground">{totalSources}</span>
          </div>
          
          <div className="bg-card rounded-xl border border-border p-4 md:p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <FileText className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
              </div>
              <span className="text-xs md:text-sm text-muted-foreground">Present In</span>
            </div>
            <span className="text-2xl md:text-3xl font-bold text-green-500">{presentSources}</span>
            <span className="text-xs md:text-sm text-muted-foreground ml-2">of {totalSources}</span>
          </div>

          <div className="bg-card rounded-xl border border-border p-4 md:p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
              </div>
              <span className="text-xs md:text-sm text-muted-foreground">With Mentions</span>
            </div>
            <span className="text-2xl md:text-3xl font-bold text-amber-500">{sourcesWithMentions}</span>
          </div>

          <div className="bg-card rounded-xl border border-border p-4 md:p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <span className="text-xs md:text-sm text-muted-foreground">Total Mentions</span>
            </div>
            <span className="text-2xl md:text-3xl font-bold text-primary">{totalMentions}</span>
          </div>
        </div>

        {/* Sources Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-4 px-3 md:px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-8"></th>
                  <th className="text-left py-4 px-3 md:px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Source Category</th>
                  <th className="text-center py-4 px-3 md:px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Presence</th>
                  <th className="text-center py-4 px-3 md:px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mentions</th>
                  <th className="text-center py-4 px-3 md:px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Score</th>
                </tr>
              </thead>
              <tbody>
                {sortedSourcesData.map((source) => {
                  const isExpanded = expandedSource === source.name;
                  const notes = depthNotes[source.name as keyof typeof depthNotes];
                  const presence = source[brandPresenceKey];
                  const mentions = source[brandMentionsKey] || 0;
                  const score = source[`${brandName}Score`];

                  return (
                    <>
                      <tr 
                        key={source.name}
                        className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => setExpandedSource(isExpanded ? null : source.name)}
                      >
                        <td className="py-4 px-3 md:px-4">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-primary" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </td>
                        <td className="py-4 px-3 md:px-4">
                          <span className="font-medium text-foreground text-sm md:text-base">{source.name}</span>
                        </td>
                        <td className="py-4 px-3 md:px-4 text-center">
                          <TierBadge tier={presence || 'Absent'} />
                        </td>
                        <td className="py-4 px-3 md:px-4 text-center">
                          <span className={`inline-flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full text-sm font-bold ${
                            mentions > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                          }`}>
                            {mentions}
                          </span>
                        </td>
                        <td className="py-4 px-3 md:px-4 text-center hidden md:table-cell">
                          <TierBadge tier={score || 'Low'} />
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-muted/20">
                          <td colSpan={5} className="py-4 md:py-6 px-4 md:px-8">
                            <div className="space-y-4 md:space-y-6">
                              {notes && typeof notes === 'object' && 'insight' in notes && (
                                <>
                                  <div className="bg-card p-4 rounded-xl border border-border">
                                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2 text-sm md:text-base">
                                      <BookOpen className="w-4 h-4 text-primary" />
                                      Insight
                                    </h4>
                                    <p className="text-muted-foreground leading-relaxed text-sm">{(notes as any).insight}</p>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-foreground mb-3 text-sm md:text-base">Pages Used</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {((notes as any).pages_used || []).map((page: string, idx: number) => (
                                        <span key={idx} className="px-3 py-1.5 md:px-4 md:py-2 bg-primary/10 text-primary rounded-full text-xs md:text-sm font-medium">
                                          {page}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </>
                              )}
                              
                              {/* Show all brands for this source - sorted by mentions */}
                              <div>
                                <h4 className="font-semibold text-foreground mb-3 text-sm md:text-base">All Brands in this Source</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
                                  {sortedBrandInfo.map(brand => {
                                    const brandPresence = source[`${brand.brand}Presence`];
                                    const brandMentions = source[`${brand.brand}Mentions`] || 0;
                                    const isCurrent = brand.brand === brandName;
                                    
                                    return (
                                      <div 
                                        key={brand.brand}
                                        className={`flex flex-col items-center p-3 md:p-4 rounded-xl border transition-all ${
                                          isCurrent 
                                            ? 'bg-primary/10 border-primary/30' 
                                            : 'bg-card border-border'
                                        }`}
                                      >
                                        {brand.logo && (
                                          <img src={brand.logo} alt="" className="w-8 h-8 md:w-10 md:h-10 rounded-full object-contain bg-white mb-2" />
                                        )}
                                        <span className={`text-xs md:text-sm font-medium mb-2 text-center ${isCurrent ? 'text-primary' : 'text-foreground'}`}>
                                          {brand.brand}
                                        </span>
                                        <TierBadge tier={brandPresence || 'Absent'} />
                                        <span className="text-xs text-muted-foreground mt-1">{brandMentions} mentions</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SourcesAll;
