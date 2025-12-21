import { Layout } from "@/results/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ExternalLink } from "lucide-react";

const AnalyzePage = () => {
  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">Analyze Page</h1>
            <p className="text-muted-foreground">
              Enter a URL to analyze how well it performs in AI search results.
            </p>
          </div>

          <div className="bg-card rounded-xl border border-border p-8">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Enter a URL to analyze (e.g., https://kommunicate.io/blog/...)"
                  className="pl-10 h-12"
                />
              </div>
              <Button className="h-12 px-6">
                Analyze
              </Button>
            </div>

            <div className="mt-6 p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                Data not available for this feature. Enter a URL from your website to see AI visibility analysis.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="font-semibold text-foreground mb-4">Recent Analyses</h3>
            <div className="bg-card rounded-xl border border-border p-6">
              <p className="text-muted-foreground text-center">No recent analyses available</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AnalyzePage;
