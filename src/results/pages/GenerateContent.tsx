import { Layout } from "@/results/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Wand2 } from "lucide-react";

const GenerateContent = () => {
  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
              Generate Content
              <Sparkles className="w-6 h-6 text-amplitude-yellow" />
            </h1>
            <p className="text-muted-foreground">
              Use AI to generate optimized content that improves your visibility in AI search results.
            </p>
          </div>

          <div className="bg-card rounded-xl border border-border p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wand2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Content Generator</h3>
                <p className="text-sm text-muted-foreground">AI-powered content optimization</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Target Keyword
                </label>
                <Input placeholder="e.g., no-code chatbot builder" />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Content Type
                </label>
                <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground">
                  <option>Blog Post</option>
                  <option>Landing Page</option>
                  <option>FAQ Section</option>
                  <option>Product Description</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Additional Context (optional)
                </label>
                <Textarea
                  placeholder="Add any specific requirements or context..."
                  className="min-h-[100px]"
                />
              </div>

              <Button className="w-full gap-2">
                <Sparkles className="w-4 h-4" />
                Generate Content
              </Button>
            </div>

            <div className="mt-6 p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                Data not available for this feature. Generated content will appear here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GenerateContent;
