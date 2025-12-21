import { competitorData, getSearchKeywords, getBrandName } from "@/results/data/analyticsData";
import { Link, useNavigate } from "react-router-dom";

export const TopTopics = () => {
  const keywords = getSearchKeywords();
  const brandName = getBrandName();
  const brand = competitorData.find(c => c.name === brandName);
  const navigate = useNavigate();

  const topicsData = keywords.map((keyword, idx) => {
    const score = brand?.keywordScores?.[idx] || 0;
    const maxScore = Math.max(...competitorData.map(c => c.keywordScores?.[idx] || 0));
    const visibility = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    return { name: keyword, mentions: score, responses: 4, visibility };
  });

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Keyword Visibility</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Click on any keyword to view prompt level performance.
          </p>
        </div>
        <Link to="/prompts" className="text-primary text-sm font-medium hover:underline">View All</Link>
      </div>
      <div className="space-y-4">
        {topicsData.map((topic, index) => (
          <div
            key={index}
            className="space-y-2 cursor-pointer"
            onClick={() => navigate(`/prompts?keyword=${encodeURIComponent(topic.name)}`)}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">{topic.name}</span>
              <span className="text-sm text-muted-foreground">{topic.visibility}%</span>
            </div>
            <p className="text-xs text-muted-foreground">{topic.mentions} mentions in {topic.responses} responses</p>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${topic.visibility}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
