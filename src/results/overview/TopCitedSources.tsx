import { FileText } from "lucide-react";
import { getSourcesData, getBrandName } from "@/results/data/analyticsData";
import { Link } from "react-router-dom";

export const TopCitedSources = () => {
  const sourcesData = getSourcesData();
  const brandName = getBrandName();
  
  // Filter sources that are cited by LLMs and have brand mentions
  const brandMentionsKey = `${brandName}Mentions`;
  const citedSources = sourcesData
    .filter(s => s.citedByLLMs === 'Yes' && (s[brandMentionsKey] || 0) > 0)
    .map(s => ({
      name: s.name,
      mentions: s[brandMentionsKey] || 0,
      pagesUsed: s.pagesUsed?.filter((p: string) => p !== 'Absent') || []
    }))
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 5);

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Top Cited Sources</h3>
        <Link to="/sources-all" className="text-primary text-sm font-medium hover:underline">
          View All
        </Link>
      </div>

      <div className="space-y-3">
        {citedSources.length > 0 ? (
          citedSources.map((source) => (
            <div key={source.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-muted flex items-center justify-center">
                  <FileText className="w-3 h-3 text-muted-foreground" />
                </div>
                <span className="text-foreground">{source.name}</span>
              </div>
              <span className="text-muted-foreground text-sm">{source.mentions} mentions</span>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground text-sm">No cited sources with brand mentions found.</p>
        )}
      </div>
    </div>
  );
};