import { Layout } from "@/results/layout/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FlaskConical } from "lucide-react";

const SimulateChanges = () => {
  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">Simulate Changes</h1>
            <p className="text-muted-foreground">
              Test how content changes might affect your AI visibility before publishing.
            </p>
          </div>

          <div className="bg-card rounded-xl border border-border p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Content Simulator</h3>
                <p className="text-sm text-muted-foreground">Enter your proposed content changes</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Current Content
                </label>
                <Textarea
                  placeholder="Paste your current page content here..."
                  className="min-h-[120px]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Proposed Changes
                </label>
                <Textarea
                  placeholder="Paste your proposed new content here..."
                  className="min-h-[120px]"
                />
              </div>

              <Button className="w-full">
                Simulate Impact
              </Button>
            </div>

            <div className="mt-6 p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                Data not available for this feature. Simulation results will appear here after analysis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SimulateChanges;
