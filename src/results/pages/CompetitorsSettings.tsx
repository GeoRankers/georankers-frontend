import { Layout } from "@/results/layout/Layout";
import { competitorData, competitorSentiment, getCompetitorVisibility, getBrandName, getModelName } from "@/results/data/analyticsData";
import { TierBadge } from "@/results/ui/TierBadge";
import { Settings, Users, Trash2 } from "lucide-react";
import { useState } from "react";

const CompetitorsSettings = () => {
  const brandName = getBrandName();
  const modelName = getModelName();
  const competitorVisibility = getCompetitorVisibility();
  const [competitors, setCompetitors] = useState(competitorVisibility.filter(c => c.name !== brandName));

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Competitor Settings</h1>
        </div>

        <p className="text-muted-foreground">
          Manage the competitors being tracked in your AI visibility analysis.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Tracked Competitors</span>
            </div>
            <span className="text-3xl font-bold text-foreground">{competitors.length}</span>
          </div>
          
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Analysis Model</span>
            </div>
            <span className="text-xl font-bold text-foreground capitalize">{modelName || 'OpenAI + Gemini'}</span>
          </div>
        </div>

        {/* Competitors Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30">
            <h3 className="font-semibold text-foreground">Competitor List</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Competitor</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Score</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Visibility %</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sentiment</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {competitors.map(competitor => {
                const sentiment = competitorSentiment.find(s => s.brand === competitor.name);
                
                return (
                  <tr key={competitor.name} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground font-bold">
                          {competitor.name[0]}
                        </div>
                        <span className="font-medium text-foreground">{competitor.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-3 py-1.5 bg-muted rounded font-semibold text-foreground">{competitor.totalScore}</span>
                    </td>
                    <td className="py-3 px-4 text-center text-foreground font-semibold">{competitor.visibility}%</td>
                    <td className="py-3 px-4 text-center">
                      <TierBadge tier={sentiment?.outlook || 'N/A'} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button 
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                        onClick={() => setCompetitors(competitors.filter(c => c.name !== competitor.name))}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Info Card */}
        <div className="bg-muted/30 rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-2">About Competitor Tracking</h3>
          <p className="text-muted-foreground text-sm">
            Competitors are automatically detected based on the keywords analyzed. The system identifies brands 
            that appear in AI-generated responses for your target keywords and tracks their visibility scores 
            across different AI platforms ({modelName || 'OpenAI, Gemini'}).
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default CompetitorsSettings;
