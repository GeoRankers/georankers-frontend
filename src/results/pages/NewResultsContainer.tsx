import { ResultsProvider, useResults } from "@/results/context/ResultsContext";
import { Layout } from "@/results/layout/Layout";
import OverviewContent from "./OverviewContent";
import PromptsContent from "./PromptsContent";
import SourcesAllContent from "./SourcesAllContent";
import CompetitorsComparisonsContent from "./CompetitorsComparisonsContent";
import ExecutiveSummaryContent from "./ExecutiveSummaryContent";
import RecommendationsContent from "./RecommendationsContent";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

// Loading component to show while initializing
const LoadingScreen = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
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
);

const ResultsContent = () => {
  const { activeTab, dataReady, isLoading } = useResults();
  const [mounted, setMounted] = useState(false);

  // Track mount state to ensure we always show something
  useEffect(() => {
    console.log("🎬 [ResultsContent] Mounted, isLoading:", isLoading, "dataReady:", dataReady);
    setMounted(true);
  }, []);

  // Always show loading if not mounted yet or if loading without data
  if (!mounted || (isLoading && !dataReady)) {
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
      case "recommendations":
        return <RecommendationsContent />;
      default:
        return <OverviewContent />;
    }
  };

  return <Layout>{renderContent()}<div className="md:w-full md:h-[100px]"></div></Layout>;
};

const NewResultsContainer = () => {
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    console.log("🎬 [NewResultsContainer] Mount - checking auth");
    // Check auth immediately on mount
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      console.log("🔒 [NewResultsContainer] No token - will redirect in context");
    }
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      setInitializing(false);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Show loading screen during initialization
  if (initializing) {
    return <LoadingScreen />;
  }

  return (
    <ResultsProvider>
      <ResultsContent />
    </ResultsProvider>
  );
};

export default NewResultsContainer;
