import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { getKeywords, getBrandName, getCompetitorData } from "@/results/data/analyticsData";
import { Target, ChevronDown } from "lucide-react";
import { useState, useMemo } from "react";
import { toOrdinal } from "@/results/data/formulas";

const COLORS = [
  'hsl(217, 91%, 60%)', // primary blue
  'hsl(0, 84%, 60%)',   // red
  'hsl(142, 71%, 45%)', // green
  'hsl(45, 93%, 47%)',  // yellow
  'hsl(258, 90%, 66%)', // purple
  'hsl(180, 70%, 45%)', // cyan
];

export const BrandMentionsRadar = () => {
  const keywords = getKeywords();
  const brandName = getBrandName();
  const competitorDataList = getCompetitorData();
  const [selectedKeyword, setSelectedKeyword] = useState<string>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Get all brands dynamically
  const allBrands = useMemo(() => competitorDataList.map(c => c.name), [competitorDataList]);
  
  // Chart data: brands on the edges
  const chartData = useMemo(() => {
    return allBrands.map((brand) => {
      const competitor = competitorDataList.find(c => c.name === brand);
      if (!competitor) return { brand, score: 0 };
      
      if (selectedKeyword === 'all') {
        // Sum all keyword scores for this brand
        const totalScore = competitor.keywordScores.reduce((sum, score) => sum + score, 0);
        return { brand, score: totalScore };
      } else {
        // Get score for specific keyword
        const keywordIdx = keywords.indexOf(selectedKeyword);
        return { brand, score: keywordIdx >= 0 ? competitor.keywordScores[keywordIdx] || 0 : 0 };
      }
    });
  }, [allBrands, competitorDataList, selectedKeyword, keywords]);

  const maxScore = Math.max(...chartData.map(d => d.score), 1);
  
  // Generate dynamic insight
  const insight = useMemo(() => {
    const brandData = chartData.find(d => d.brand === brandName);
    if (!brandData) return `${brandName} performance overview`;
    
    const brandScore = brandData.score;
    const sortedData = [...chartData].sort((a, b) => b.score - a.score);
    const brandRank = sortedData.findIndex(d => d.brand === brandName) + 1;
    const topCompetitor = sortedData[0];
    
    if (selectedKeyword === 'all') {
      // All keywords insight
      if (brandRank === 1) {
        return `${brandName} leads with ${brandScore} total mentions across all keywords`;
      } else {
        const gap = topCompetitor.score - brandScore;
        return `${brandName} ranks ${toOrdinal(brandRank)} with ${brandScore} mentions, ${gap} behind ${topCompetitor.brand}`;
      }
    } else {
      // Specific keyword insight
      if (brandRank === 1) {
        return `${brandName} dominates "${selectedKeyword}" with ${brandScore} mentions`;
      } else if (brandScore === 0) {
        return `${brandName} has no mentions for "${selectedKeyword}" - opportunity to improve`;
      } else {
        return `${brandName} ranks ${toOrdinal(brandRank)} for "${selectedKeyword}" with ${brandScore} mentions`;
      }
    }
  }, [chartData, brandName, selectedKeyword]);

  return (
    <div className="bg-card rounded-xl border border-border p-4 md:p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Mention Distribution</h3>
        </div>
        {/* Keyword Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm font-medium text-foreground hover:bg-muted/80 transition-colors"
          >
            <span className="max-w-[120px] truncate">
              {selectedKeyword === 'all' ? 'All Keywords' : selectedKeyword}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-card border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
              <button
                onClick={() => { setSelectedKeyword('all'); setIsDropdownOpen(false); }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors ${
                  selectedKeyword === 'all' ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'
                }`}
              >
                All Keywords
              </button>
              {keywords.map((keyword, idx) => (
                <button
                  key={`keyword-${idx}`}
                  onClick={() => { setSelectedKeyword(keyword); setIsDropdownOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors ${
                    selectedKeyword === keyword ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'
                  }`}
                >
                  {keyword}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        {selectedKeyword === 'all' 
          ? 'Who dominates mentions across the keywords' 
          : `Brand mention for "${selectedKeyword}"`}
      </p>
      
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <PolarGrid stroke="hsl(220, 13%, 91%)" />
            <PolarAngleAxis 
              dataKey="brand" 
              tick={({ x, y, payload }) => {
                const isBrand = payload.value === brandName;
                return (
                  <text
                    x={x}
                    y={y}
                    fill={isBrand ? 'hsl(217, 91%, 60%)' : 'hsl(220, 9%, 46%)'}
                    fontSize={11}
                    fontWeight={isBrand ? 600 : 400}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {payload.value.length > 12 ? payload.value.substring(0, 12) + '...' : payload.value}
                  </text>
                );
              }}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, maxScore]}
              tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 10 }}
            />
            <Radar
              name="Score"
              dataKey="score"
              stroke="hsl(217, 91%, 60%)"
              fill="hsl(217, 91%, 60%)"
              fillOpacity={0.4}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(0, 0%, 100%)',
                border: '1px solid hsl(220, 13%, 91%)',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [value, 'Mentions']}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Dynamic insight - bold and meaningful */}
      <div className="flex items-center justify-center mt-2 pt-2 border-t border-border">
        <p className="text-sm text-center text-foreground px-4">
          {insight}
        </p>
      </div>
    </div>
  );
};