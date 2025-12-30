import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { getBrandInfoWithLogos, getBrandName } from "@/results/data/analyticsData";
import { TrendingUp } from "lucide-react";
import { useState, useMemo } from "react";

type ViewMode = "geo_score" | "mentions";

// Unique competitor colors
const competitorColors = [
  "hsl(142, 40%, 60%)",  // soft green
  "hsl(45, 70%, 65%)",   // soft yellow
  "hsl(258, 55%, 70%)",  // soft purple
  "hsl(0, 65%, 70%)",    // soft red
  "hsl(28, 65%, 65%)"    // soft amber
];

export const CompetitorComparisonChart = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("geo_score");
  const brandInfo = getBrandInfoWithLogos();
  const brandName = getBrandName();

  // Assign colors
  const brandColors = useMemo(() => {
    const map: Record<string, string> = {};
    let colorIndex = 0;
    brandInfo.forEach((b) => {
      map[b.brand] =
        b.brand === brandName
          ? "hsl(var(--primary))"
          : competitorColors[colorIndex++ % competitorColors.length];
    });
    return map;
  }, [brandInfo, brandName]);

  // Keep brand at top, REVERSE competitors to show them in ascending order (lowest first)
  const sortedBrands = useMemo(() => {
    const myBrand = brandInfo.find(b => b.brand === brandName);
    const competitors = brandInfo.filter(b => b.brand !== brandName);
    
    // FIXED: Reverse competitors so lowest scores appear at bottom
    return myBrand ? [myBrand, ...competitors.reverse()] : competitors.reverse();
  }, [brandInfo, brandName]);

  const chartData = useMemo(() => {
    return sortedBrands.map((brand) => ({
      name: brand.brand,
      value:
        viewMode === "geo_score"
          ? brand.geo_score
          : brand.mention_count,
      geoScore: brand.geo_score,
      mentionCount: brand.mention_count,
      mentionScore: brand.mention_score,
      logo: brand.logo,
      isBrand: brand.brand === brandName,
      color: brandColors[brand.brand],
    }));
  }, [sortedBrands, viewMode, brandName, brandColors]);

  const maxValue = useMemo(
    () => Math.max(...chartData.map((d) => d.value), 1),
    [chartData]
  );

  return (
    <div className="bg-card rounded-xl border border-border p-4 md:p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            Competitive Landscape
          </h3>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {(["geo_score", "mentions"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                viewMode === mode
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {mode === "geo_score" ? "AI Visibility Score" : "Mentions"}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-6">
        {viewMode === "geo_score"
          ? "How you stack up against competitors in AI search results"
          : "Who gets mentioned most across AI platforms"}
      </p>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              type="number"
              stroke="hsl(var(--muted-foreground))"
              axisLine={false}
              tickLine={false}
              domain={[0, maxValue]}
              fontSize={12}
            />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              width={150}
              tick={({ x, y, payload }) => {
                const brand = chartData.find((b) => b.name === payload.value);
                return (
                  <g transform={`translate(${x},${y})`}>
                    <foreignObject x={-120} y={-12} width={120} height={24}>
                      <div className="flex items-center gap-2 justify-end">
                        {brand?.logo && (
                          <img
                            src={brand.logo}
                            alt={payload.value}
                            className="w-5 h-5 rounded-full bg-white object-contain"
                          />
                        )}
                        <span
                          className={`text-xs truncate ${
                            brand?.isBrand
                              ? "text-primary font-semibold"
                              : "text-muted-foreground"
                          }`}
                        >
                          {payload.value}
                        </span>
                      </div>
                    </foreignObject>
                  </g>
                );
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
              }}
              formatter={(value, name, props) => {
                const data = props.payload;
                return [
                  <div className="space-y-1 text-sm">
                    <div>
                      AI Visibility Score: <strong>{data.geoScore}</strong>
                    </div>
                    <div>
                      Mentions: <strong>{data.mentionCount}</strong>
                    </div>
                  </div>,
                  null,
                ];
              }}
              labelFormatter={(label) => (
                <span className="font-semibold">{label}</span>
              )}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-4 pt-4 border-t border-border">
        {chartData.map((brand, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: brand.color }}
            />
            <span className="text-xs font-medium">{brand.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};