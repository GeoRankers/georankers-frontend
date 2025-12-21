import { Layout } from "@/results/layout/Layout";
import { TierBadge } from "@/results/ui/TierBadge";
import { getSourcesData, llmData, getDepthNotes, getBrandName, getCompetitorNames, getBrandMentionCounts } from "@/results/data/analyticsData";
import { Info, TrendingUp, Database, Cpu, BarChart3 } from "lucide-react";

const PerformanceInsights = () => {
  const depthNotes = getDepthNotes();
  const brandName = getBrandName();
  const competitors = getCompetitorNames();
  const sourcesData = getSourcesData();
  const mentionCounts = getBrandMentionCounts();

  // Find top brand by mentions
  const topBrand = Object.entries(mentionCounts).sort(([,a], [,b]) => b - a)[0];
  const maxMentions = topBrand ? topBrand[1] : 0;

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Page Title */}
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">Performance Insights</h1>
          <Info className="w-4 h-4 text-muted-foreground cursor-help" />
        </div>

        {/* Brand Mentions Summary */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Total Brand Mentions by Source</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(mentionCounts).map(([brand, count]) => {
              const isPrimaryBrand = brand === brandName;
              const percentage = maxMentions > 0 ? Math.round((count / maxMentions) * 100) : 0;
              
              return (
                <div 
                  key={brand} 
                  className={`rounded-lg p-4 border ${isPrimaryBrand ? 'bg-primary/10 border-primary' : 'bg-muted/30 border-border'}`}
                >
                  <div className={`text-2xl font-bold mb-1 ${isPrimaryBrand ? 'text-primary' : 'text-foreground'}`}>
                    {count}
                  </div>
                  <div className={`text-sm font-medium truncate ${isPrimaryBrand ? 'text-primary' : 'text-foreground'}`}>
                    {brand}
                  </div>
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${isPrimaryBrand ? 'bg-primary' : 'bg-muted-foreground/40'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Platform-wise Brand Performance */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-6">
            <Database className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Platform-wise Brand Performance</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/30">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Source</th>
                  {competitors.map(brand => (
                    <th 
                      key={brand} 
                      className={`text-center py-3 px-3 text-xs font-semibold uppercase tracking-wider ${brand === brandName ? 'text-primary bg-primary/5' : 'text-muted-foreground'}`}
                    >
                      {brand}
                    </th>
                  ))}
                  <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cited by LLMs</th>
                </tr>
              </thead>
              <tbody>
                {sourcesData.map((source, index) => (
                  <tr key={index} className="border-b border-border/50 hover:bg-muted/10">
                    <td className="py-3 px-4 font-medium text-foreground">{source.name}</td>
                    {competitors.map(brand => {
                      const presence = source[`${brand}Presence`];
                      const mentions = source[`${brand}Mentions`];
                      const isPrimaryBrand = brand === brandName;
                      
                      return (
                        <td key={brand} className={`py-3 px-3 text-center ${isPrimaryBrand ? 'bg-primary/5' : ''}`}>
                          <div className="flex flex-col items-center gap-1">
                            <TierBadge tier={presence || 'Absent'} />
                            <span className="text-xs text-muted-foreground">{mentions || 0}</span>
                          </div>
                        </td>
                      );
                    })}
                    <td className="py-3 px-4 text-center">
                      <TierBadge tier={source.citedByLLMs} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* LLM-wise Performance */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-6">
            <Cpu className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">LLM-wise Brand Performance</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(llmData).map(([platform, data]: [string, any]) => (
              <div key={platform} className="bg-muted/30 rounded-lg p-5 border border-border">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold text-foreground capitalize text-lg">{platform}</span>
                  <span className="text-3xl font-bold text-primary">{data.brand_mentions_count}</span>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Queries with brand:</span>
                    <span className="font-semibold text-foreground bg-muted px-2 py-0.5 rounded">{data.queries_with_brand}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Average rank:</span>
                    <span className="font-semibold text-foreground bg-muted px-2 py-0.5 rounded">#{data.average_brand_rank}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Source Insights for Brand */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Source Insights for {brandName}</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(depthNotes).map(([source, data]: [string, any]) => (
              <div key={source} className="bg-muted/30 rounded-lg p-5 border border-border">
                <h4 className="font-semibold text-foreground mb-2">{source}</h4>
                <p className="text-sm text-muted-foreground mb-3">{data.insight}</p>
                <div className="flex flex-wrap gap-1">
                  {data.pages_used.map((page: string, idx: number) => (
                    <span key={idx} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {page}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Types by Source */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Content Types by Source</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sourcesData.filter(s => s.pagesUsed && s.pagesUsed[0] !== 'Absent').map((source, idx) => (
              <div key={idx} className="bg-muted/30 rounded-lg p-4 border border-border">
                <h4 className="font-medium text-foreground mb-2">{source.name}</h4>
                <div className="flex flex-wrap gap-1">
                  {source.pagesUsed.map((page, pidx) => (
                    <span key={pidx} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {page}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PerformanceInsights;
