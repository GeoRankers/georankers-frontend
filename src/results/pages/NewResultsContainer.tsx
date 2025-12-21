import { ResultsProvider, useResults } from "@/results/context/ResultsContext";
import { Layout } from "@/results/layout/Layout";
import OverviewContent from "./OverviewContent";
import PromptsContent from "./PromptsContent";
import SourcesAllContent from "./SourcesAllContent";
import CompetitorsComparisonsContent from "./CompetitorsComparisonsContent";
import BrandSentimentContent from "./BrandSentimentContent";
import RecommendationsContent from "./RecommendationsContent";
import ExecutiveSummaryContent from "./ExecutiveSummaryContent";
import { Search } from "lucide-react";

const ResultsContent = () => {
  const { activeTab, dataReady, isLoading } = useResults();

  // Loading state
  if (isLoading && !dataReady) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
              <Search className="w-8 h-8 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Loading Analysis
            </h2>
            <p className="text-muted-foreground">
              Please wait while we fetch your data...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // Render active tab content
  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewContent />;
      case "executive-summary":
        return <ExecutiveSummaryContent />;
      case "prompts":
        return <PromptsContent />;
      case "sources-all":
        return <SourcesAllContent />;
      case "competitors-comparisons":
        return <CompetitorsComparisonsContent />;
      case "brand-sentiment":
        return <BrandSentimentContent />;
      case "recommendations":
        return <RecommendationsContent />;
      default:
        return <OverviewContent />;
    }
  };

  return <Layout>{renderContent()}</Layout>;
};

const NewResultsContainer = () => {
  return (
    <ResultsProvider>
      <ResultsContent />
    </ResultsProvider>
  );
};

export default NewResultsContainer;
