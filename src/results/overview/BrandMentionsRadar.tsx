import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { getKeywords, getBrandName, getCompetitorData } from "@/results/data/analyticsData";
import { Target, ChevronDown } from "lucide-react";
import { useState, useMemo } from "react";

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
  const competitorData = getCompetitorData();
  const [selectedKeyword, setSelectedKeyword] = useState<string>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Get all brands dynamically
  const allBrands = useMemo(() => competitorData.map(c => c.name), [competitorData]);
  
  // Chart data: brands on the edges
  const chartData = useMemo(() => {
    return allBrands.map((brand) => {
      const competitor = competitorData.find(c => c.name === brand);
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
  }, [allBrands, competitorData, selectedKeyword, keywords]);

  const maxScore = Math.max(...chartData.map(d => d.score), 1);

  return (
    <div className="bg-card rounded-xl border border-border p-4 md:p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Keyword Coverage</h3>
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
              {keywords.map((keyword) => (
                <button
                  key={keyword}
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
          ? 'Total visibility scores across all keywords' 
          : `Visibility for "${selectedKeyword}"`}
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
              formatter={(value: number) => [value, 'Score']}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Brand indicator */}
      <div className="flex items-center justify-center gap-6 mt-2 pt-2 border-t border-border">
        <span className="text-xs text-primary font-medium">{brandName} highlighted</span>
      </div>
    </div>
  );
};
