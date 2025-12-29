import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { getKeywords, getBrandName, getCompetitorData, getBrandInfoWithLogos } from "@/results/data/analyticsData";
import { Target } from "lucide-react";

const COLORS = [
  'hsl(217, 91%, 60%)', // primary blue
  'hsl(142, 71%, 45%)', // green
  'hsl(45, 93%, 47%)',  // yellow
  'hsl(258, 90%, 66%)', // purple
  'hsl(0, 84%, 60%)',   // red
  'hsl(180, 70%, 45%)', // cyan
];

export const KeywordPerformanceChart = () => {
  const keywords = getKeywords();
  const brandName = getBrandName();
  const brandInfoWithLogos = getBrandInfoWithLogos();
  const competitorDataList = getCompetitorData();
  
  // Build chart data: for each keyword, show all competitors' scores
  const chartData = keywords.map((keyword, keywordIdx) => {
    const dataPoint: any = { keyword: keyword.length > 25 ? keyword.substring(0, 25) + '...' : keyword };
    
    competitorDataList.forEach((competitor) => {
      dataPoint[competitor.name] = competitor.keywordScores[keywordIdx] || 0;
    });
    
    return dataPoint;
  });

  // Get unique competitor names for the bars
  const competitorNames = competitorDataList.map(c => c.name);

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center gap-2 mb-1">
        <Target className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Keyword Performance</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-6">Visibility scores by keyword across competitors</p>
      
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" vertical={false} />
            <XAxis 
              dataKey="keyword" 
              stroke="hsl(220, 9%, 46%)" 
              fontSize={11}
              angle={-20}
              textAnchor="end"
              height={60}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              stroke="hsl(220, 9%, 46%)" 
              fontSize={12}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(0, 0%, 100%)',
                border: '1px solid hsl(220, 13%, 91%)',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: 20 }}
              iconType="circle"
              iconSize={8}
            />
            {competitorNames.map((name, index) => (
              <Bar 
                key={name}
                dataKey={name} 
                fill={name === brandName ? COLORS[0] : COLORS[(index + 1) % COLORS.length]}
                radius={[2, 2, 0, 0]}
                opacity={name === brandName ? 1 : 0.7}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
