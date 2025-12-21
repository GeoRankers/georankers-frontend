import { getDepthNotes, getBrandName } from "@/results/data/analyticsData";
import { FileText, Lightbulb, Link } from "lucide-react";

export const SourceInsights = () => {
  const depthNotes = getDepthNotes();
  const brandName = getBrandName();
  
  const sources = Object.entries(depthNotes).map(([source, data]: [string, any]) => ({
    source,
    insight: data.insight,
    pagesUsed: data.pages_used || []
  }));

  if (sources.length === 0) {
    return null;
  }

  return (
    <div className="bg-card rounded-xl border border-border p-4 md:p-6 overflow-hidden">
      <div className="flex items-center gap-2 mb-1">
        <Lightbulb className="w-5 h-5 text-amber-500" />
        <h3 className="text-lg font-semibold text-foreground">Source Insights for {brandName}</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Key insights from different source categories</p>
      
      <div className="space-y-4">
        {sources.map((item, index) => (
          <div 
            key={item.source}
            className="p-4 rounded-lg bg-muted/30 border border-border hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-foreground">{item.source}</h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.insight}</p>
              </div>
            </div>
            
            {item.pagesUsed.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Link className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pages Used</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.pagesUsed.map((page: string, pageIdx: number) => (
                    <span 
                      key={pageIdx}
                      className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium"
                    >
                      {page}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
