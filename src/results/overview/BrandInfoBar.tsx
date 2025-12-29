import { getBrandName, getBrandWebsite, getModelName, getAnalysisKeywords, getBrandLogo, getAnalysisDate } from "@/results/data/analyticsData";
import { LLMIcon } from "@/results/ui/LLMIcon";
import { ExternalLink, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const BrandInfoBar = () => {
  const brandName = getBrandName();
  const brandWebsite = getBrandWebsite();
  const modelName = getModelName();
  const keywords = getAnalysisKeywords();
  const brandLogo = getBrandLogo();
  const analysisDate = getAnalysisDate();
  
  const models = modelName?.split(",").map((m) => m.trim()).filter(m => m === 'openai' || m === 'gemini') || [];
  
  if (!brandName) return null;
  
  return (
    <div className="bg-card rounded-xl border border-border p-4 md:p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Brand logo, name, website and keywords */}
        <div className="flex items-start gap-4">
          {brandLogo ? (
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-black/5 flex items-center justify-center p-2 flex-shrink-0">
              <img 
                src={brandLogo} 
                alt={brandName} 
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-primary">
                {brandName.substring(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl md:text-2xl font-bold text-foreground">{brandName}</h2>
            {brandWebsite && (
              <a 
                href={brandWebsite} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
              >
                <span className="truncate">{brandWebsite}</span>
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            )}
            {/* Keywords below website */}
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {keywords.map((keyword, idx) => (
                  <Badge 
                    key={idx} 
                    className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
                  >
                    {keyword}
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Analysis date and models - shown on mobile below keywords */}
            <div className="flex flex-col gap-2 mt-3 md:hidden">
              {/* Analysis Date */}
              {analysisDate && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Analyzed: {analysisDate}</span>
                </div>
              )}
              
              {/* LLM models */}
              {models.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Analyzed by:</span>
                  <div className="flex items-center gap-2">
                    {models.map((model) => (
                      <LLMIcon key={model} platform={model} size="lg" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right on desktop: Analysis date and LLM models (hidden on mobile) */}
        <div className="hidden md:flex md:flex-col md:items-end gap-2">
          {/* Analysis Date */}
          {analysisDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Analyzed: {analysisDate}</span>
            </div>
          )}
          
          {/* LLM models */}
          {models.length > 0 && (
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-muted-foreground">Analyzed by</span>
              <div className="flex items-center gap-2">
                {models.map((model) => (
                  <LLMIcon key={model} platform={model} size="lg" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrandInfoBar;