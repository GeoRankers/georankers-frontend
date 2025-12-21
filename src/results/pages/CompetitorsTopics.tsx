import { Layout } from "@/results/layout/Layout";
import { getAnalytics, competitorData, getBrandName, getKeywords } from "@/results/data/analyticsData";
import { Info } from "lucide-react";

const CompetitorsTopics = () => {
  const analytics = getAnalytics();
  const visibilityTable = analytics?.competitor_visibility_table;
  const keywords = getKeywords();
  const brandName = getBrandName();

  // Calculate max score per keyword for percentage calculation
  const maxScores = keywords.map((_, idx) => {
    let max = 0;
    visibilityTable?.rows?.forEach(row => {
      const score = row[idx + 1] as number;
      if (score > max) max = score;
    });
    return max;
  });

  // Overall max for the entire table
  const overallMax = Math.max(...competitorData.map(c => c.totalScore), 1);

  const getHeatIntensity = (score: number, maxScore: number): string => {
    if (maxScore === 0 || score === 0) return 'bg-slate-100 dark:bg-slate-800';
    const percentage = (score / maxScore) * 100;
    
    if (percentage >= 80) return 'bg-blue-600';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-blue-400';
    if (percentage >= 20) return 'bg-blue-300';
    return 'bg-blue-200';
  };

  const getTextColor = (score: number, maxScore: number): string => {
    if (maxScore === 0 || score === 0) return 'text-muted-foreground';
    const percentage = (score / maxScore) * 100;
    return percentage >= 40 ? 'text-white' : 'text-slate-700';
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">Competitor Topics Heatmap</h1>
          <Info className="w-4 h-4 text-muted-foreground cursor-help" />
        </div>

        <p className="text-muted-foreground">
          Visual representation of competitor visibility across different search keywords. 
          Darker colors indicate higher visibility scores.
        </p>

        {/* Heatmap Legend */}
        <div className="flex items-center gap-6 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground">Intensity:</span>
          <div className="flex items-center gap-1">
            <div className="w-8 h-6 rounded bg-slate-100 dark:bg-slate-800 border border-border"></div>
            <div className="w-8 h-6 rounded bg-blue-200"></div>
            <div className="w-8 h-6 rounded bg-blue-300"></div>
            <div className="w-8 h-6 rounded bg-blue-400"></div>
            <div className="w-8 h-6 rounded bg-blue-500"></div>
            <div className="w-8 h-6 rounded bg-blue-600"></div>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>0%</span>
            <span>→</span>
            <span>100%</span>
          </div>
        </div>

        {/* Heatmap Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border min-w-[140px]">
                    Brand
                  </th>
                  {keywords.map(keyword => (
                    <th key={keyword} className="text-center py-4 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border min-w-[120px]">
                      {keyword}
                    </th>
                  ))}
                  <th className="text-center py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border min-w-[80px]">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {competitorData.map((competitor, rowIdx) => {
                  const row = visibilityTable?.rows?.find(r => r[0] === competitor.name);
                  const isPrimaryBrand = competitor.name === brandName;
                  
                  return (
                    <tr 
                      key={competitor.name} 
                      className={`${isPrimaryBrand ? 'bg-primary/5' : rowIdx % 2 === 0 ? 'bg-transparent' : 'bg-muted/20'}`}
                    >
                      <td className={`py-3 px-4 font-medium border-b border-border/50 ${isPrimaryBrand ? 'text-primary' : 'text-foreground'}`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isPrimaryBrand ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                          {competitor.name}
                        </div>
                      </td>
                      {keywords.map((keyword, idx) => {
                        const score = row ? row[idx + 1] as number : 0;
                        const heatColor = getHeatIntensity(score, maxScores[idx]);
                        const textColor = getTextColor(score, maxScores[idx]);
                        
                        return (
                          <td key={keyword} className="py-2 px-2 border-b border-border/50">
                            <div className={`mx-auto w-full h-10 rounded-md ${heatColor} flex items-center justify-center transition-colors`}>
                              <span className={`text-sm font-bold ${textColor}`}>
                                {score}
                              </span>
                            </div>
                          </td>
                        );
                      })}
                      <td className="py-2 px-2 border-b border-border/50">
                        <div className={`mx-auto w-full h-10 rounded-md flex items-center justify-center font-bold text-sm ${
                          isPrimaryBrand 
                            ? 'bg-primary text-white' 
                            : 'bg-slate-200 dark:bg-slate-700 text-foreground'
                        }`}>
                          {competitor.totalScore}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Keyword Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {keywords.map((keyword, keywordIdx) => (
            <div key={keyword} className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold text-foreground mb-4 text-sm truncate" title={keyword}>
                {keyword}
              </h3>
              <div className="space-y-2">
                {competitorData
                  .map(c => ({ 
                    name: c.name, 
                    score: c.keywordScores[keywordIdx] || 0 
                  }))
                  .sort((a, b) => b.score - a.score)
                  .slice(0, 5)
                  .map((item, idx) => {
                    const isPrimaryBrand = item.name === brandName;
                    return (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs w-5 h-5 rounded-full flex items-center justify-center ${
                            idx === 0 ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className={`text-sm ${isPrimaryBrand ? 'text-primary font-semibold' : 'text-foreground'}`}>
                            {item.name}
                          </span>
                        </div>
                        <span className={`text-sm font-bold px-2 py-0.5 rounded ${
                          isPrimaryBrand ? 'bg-primary/20 text-primary' : 'bg-muted text-foreground'
                        }`}>
                          {item.score}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default CompetitorsTopics;
