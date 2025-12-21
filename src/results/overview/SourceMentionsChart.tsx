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
import {
  getAnalytics,
  getCompetitorNames,
  getBrandName,
  getBrandInfoWithLogos,
} from "@/results/data/analyticsData";
import { Layers, ChevronDown } from "lucide-react";
import { useState, useMemo } from "react";

type ViewMode = "count" | "score";

const competitorColors = [
  "hsl(142, 40%, 60%)", // soft green
  "hsl(45, 70%, 65%)", // soft yellow
  "hsl(258, 55%, 70%)", // soft purple
  "hsl(0, 65%, 70%)", // soft red
  "hsl(28, 65%, 65%)", // soft amber
];

export const SourceMentionsChart = () => {
  const analytics = getAnalytics();
  const brandName = getBrandName();
  const competitorNames = getCompetitorNames();
  const brandInfo = getBrandInfoWithLogos();

  const [viewMode, setViewMode] = useState<ViewMode>("count");

  // Assign color to each brand
  const brandColors = useMemo(() => {
    const map: Record<string, string> = {};
    let index = 0;
    competitorNames.forEach((brand) => {
      map[brand] =
        brand === brandName
          ? "hsl(var(--primary))"
          : competitorColors[index++ % competitorColors.length];
    });
    return map;
  }, [competitorNames, brandName]);

  // Extract sources data from the new object structure
  const sourcesData = analytics?.sources_and_content_impact;

  const sources = useMemo(() => {
    if (!sourcesData || typeof sourcesData !== "object") return [];
    return Object.keys(sourcesData);
  }, [sourcesData]);

  const [selectedSource, setSelectedSource] = useState("All Sources");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Build chart data from new object structure
  const chartData = useMemo(() => {
    if (!sourcesData || typeof sourcesData !== "object") return [];

    let allBrands: Array<{
      brand: string;
      count: number;
      score: number;
      logo: string;
      isBrand: boolean;
      color: string;
    }> = [];

    // ALL SOURCES → sum mentions across all sources
    if (selectedSource === "All Sources") {
      const countTotals: Record<string, number> = {};
      const scoreTotals: Record<string, number> = {};
      const sourceCount: Record<string, number> = {};

      competitorNames.forEach((brand) => {
        countTotals[brand] = 0;
        scoreTotals[brand] = 0;
        sourceCount[brand] = 0;
      });

      Object.values(sourcesData).forEach((sourceData: any) => {
        const mentions = sourceData.mentions || {};
        competitorNames.forEach((brand) => {
          if (mentions[brand]) {
            countTotals[brand] += mentions[brand].count || 0;
            scoreTotals[brand] += mentions[brand].score || 0;
            sourceCount[brand] += 1;
          }
        });
      });

      allBrands = competitorNames.map((brand) => ({
        brand,
        count: countTotals[brand],
        score: Math.round(
          (scoreTotals[brand] / Math.max(sourceCount[brand], 1)) * 100
        ),
        logo: brandInfo.find((b) => b.brand === brand)?.logo || "",
        isBrand: brand === brandName,
        color: brandColors[brand],
      }));
    } else {
      // SPECIFIC SOURCE → get mentions from that source
      const sourceData = sourcesData[selectedSource];
      if (!sourceData) return [];

      const mentions = sourceData.mentions || {};

      allBrands = competitorNames.map((brand) => ({
        brand,
        count: mentions[brand]?.count || 0,
        score: Math.round((mentions[brand]?.score || 0) * 100),
        logo: brandInfo.find((b) => b.brand === brand)?.logo || "",
        isBrand: brand === brandName,
        color: brandColors[brand],
      }));
    }

    // Keep brand at top, maintain original order for others
    const myBrand = allBrands.find((b) => b.brand === brandName);
    const competitors = allBrands.filter((b) => b.brand !== brandName);

    return myBrand ? [myBrand, ...competitors] : competitors;
  }, [
    selectedSource,
    sourcesData,
    competitorNames,
    brandName,
    brandInfo,
    brandColors,
  ]);

  const allSources = ["All Sources", ...sources];

  const getValue = (item: (typeof chartData)[0]) => {
    return viewMode === "count" ? item.count : item.score;
  };

  const maxValue = useMemo(() => {
    if (viewMode === "score") return 100;
    return Math.max(...chartData.map((d) => d.count), 1);
  }, [chartData, viewMode]);

  return (
    <div className="bg-card rounded-xl border border-border p-4 md:p-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-1 gap-3">
        {/* Left: Title */}
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            Source Mentions
          </h3>
        </div>

        {/* Right: Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          {/* Count / Score Toggle */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1 self-start">
            {(["count", "score"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  viewMode === mode
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {mode === "count" ? "Count" : "Score %"}
              </button>
            ))}
          </div>

          {/* Source Dropdown */}
          <div className="relative w-full sm:w-[220px]">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between gap-2 px-3 py-2 bg-muted/50 hover:bg-muted rounded-lg text-sm font-medium text-foreground transition-colors w-full"
            >
              <span className="truncate">{selectedSource}</span>
              <ChevronDown
                className={`w-4 h-4 shrink-0 transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsDropdownOpen(false)}
                />

                <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-50 w-full max-h-[280px] overflow-y-auto py-1">
                  {allSources.map((source) => (
                    <button
                      key={source}
                      onClick={() => {
                        setSelectedSource(source);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors ${
                        selectedSource === source
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-foreground"
                      }`}
                    >
                      {source}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-6">
        {viewMode === "count"
          ? "Total mention count by source category"
          : "Mention score percentage by source category"}
      </p>

      {/* Chart */}
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              horizontal
              vertical={false}
            />

            <XAxis
              type="number"
              stroke="hsl(var(--muted-foreground))"
              tickLine={false}
              axisLine={false}
              fontSize={12}
              domain={[0, maxValue]}
              tickFormatter={(val) =>
                viewMode === "score" ? `${val}%` : String(val)
              }
            />

            <YAxis
              type="category"
              dataKey="brand"
              stroke="hsl(var(--muted-foreground))"
              tickLine={false}
              axisLine={false}
              width={150}
              fontSize={12}
              tick={({ x, y, payload }) => {
                const item = chartData.find((d) => d.brand === payload.value);
                return (
                  <g transform={`translate(${x},${y})`}>
                    <foreignObject x={-130} y={-12} width={130} height={24}>
                      <div className="flex items-center gap-2 justify-end">
                        {item?.logo && (
                          <img
                            src={item.logo}
                            alt={item.brand}
                            className="w-5 h-5 rounded-full bg-white object-contain"
                          />
                        )}
                        <span
                          className={`text-xs truncate ${
                            item?.isBrand
                              ? "text-primary font-semibold"
                              : "text-muted-foreground"
                          }`}
                        >
                          {item?.brand}
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
                      Count: <strong>{data.count}</strong>
                    </div>
                    <div>
                      Score: <strong>{data.score}%</strong>
                    </div>
                  </div>,
                  null,
                ];
              }}
              labelFormatter={(label) => (
                <span className="font-semibold">{label}</span>
              )}
            />

            <Bar
              dataKey={viewMode === "count" ? "count" : "score"}
              barSize={28}
              radius={[0, 6, 6, 0]}
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-4 pt-4 border-t border-border">
        {chartData.map((item) => (
          <div key={item.brand} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: item.color }}
            />
            <span
              className={`text-xs ${
                item.isBrand
                  ? "text-primary font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              {item.brand}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
