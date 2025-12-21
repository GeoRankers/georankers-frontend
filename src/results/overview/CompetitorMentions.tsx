import { Info } from "lucide-react";
import { getCompetitorVisibility, getBrandName } from "@/results/data/analyticsData";
import { useNavigate } from "react-router-dom";

export const CompetitorMentions = () => {
  const navigate = useNavigate();
  const competitorVisibility = getCompetitorVisibility();
  const brandName = getBrandName();

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">
            Competitor Mentions by Keyword
          </h3>
          <Info className="w-4 h-4 text-muted-foreground" />
        </div>
        <button 
          onClick={() => navigate('/competitors-comparisons')}
          className="text-primary text-sm font-medium hover:underline"
        >
          View All
        </button>
      </div>

      <div className="space-y-3">
        {competitorVisibility.map((competitor) => {
          const isPrimaryBrand = competitor.name === brandName;
          const barColor = isPrimaryBrand ? "bg-primary" : "bg-slate-400";
          
          return (
            <div key={competitor.name} className="flex items-center gap-3">
              <div className="flex items-center gap-2 w-40 flex-shrink-0">
                {competitor.logo ? (
                  <img 
                    src={competitor.logo} 
                    alt={competitor.name} 
                    className="w-5 h-5 rounded-full object-contain bg-white"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    isPrimaryBrand ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {competitor.name[0]}
                  </div>
                )}
                <span className={`text-sm truncate ${isPrimaryBrand ? "text-primary font-semibold" : "text-foreground"}`}>
                  {competitor.name}
                </span>
              </div>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${competitor.visibility}%` }}
                />
              </div>
              <span className={`text-sm font-semibold w-12 text-right ${isPrimaryBrand ? "text-primary" : "text-foreground"}`}>
                {competitor.totalScore}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
