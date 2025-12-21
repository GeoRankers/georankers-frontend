import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCompetitorVisibility, getBrandName } from "@/results/data/analyticsData";

export const HeroCard = () => {
  const brandName = getBrandName();
  const competitorVisibility = getCompetitorVisibility();
  const topTwo = competitorVisibility.filter(c => c.name !== brandName).slice(0, 2);
  const brand = competitorVisibility.find(c => c.name === brandName);

  const displayData = [
    ...topTwo.map(c => ({ name: c.name, visibility: c.visibility, isBrand: false, logo: c.logo })),
    { name: brandName, visibility: brand?.visibility || 0, isBrand: true, logo: brand?.logo || '' }
  ];

  return (
    <div className="amplitude-gradient rounded-xl p-4 md:p-6 text-primary-foreground overflow-hidden">
      <p className="text-sm opacity-80 mb-2">Login to Amplitude to customize your prompts</p>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        You're gaining ground in AI visibility
        <Sparkles className="w-6 h-6 text-amber-400" />
      </h2>

      <div className="space-y-4">
        <div className="grid grid-cols-[1fr_2fr_auto] gap-4 text-sm opacity-80 mb-2">
          <span>Brand</span>
          <span>% of AI responses that mention the brand</span>
          <span></span>
        </div>

        {displayData.map((item, index) => (
          <div key={item.name} className="grid grid-cols-[1fr_2fr_auto] gap-4 items-center">
            <div className="flex items-center gap-2">
              {item.logo ? (
                <img 
                  src={item.logo} 
                  alt={item.name} 
                  className="w-6 h-6 rounded-full object-contain bg-white"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  item.isBrand ? "bg-amber-400 text-amber-900" : "bg-white/20"
                }`}>
                  {index === 0 && "🏆"}{index === 1 && "🥈"}{index === 2 && "🔶"}
                </div>
              )}
              <span className={item.isBrand ? "text-amber-400 font-medium" : ""}>{item.name}</span>
            </div>
            <div className="relative h-3 bg-white/20 rounded-full overflow-hidden">
              <div className={`absolute left-0 top-0 h-full rounded-full transition-all duration-700 ${item.isBrand ? "bg-white/40" : "bg-primary"}`} style={{ width: `${item.visibility}%` }} />
            </div>
            <span className="text-sm font-medium w-16 text-right">{item.visibility}%</span>
          </div>
        ))}
      </div>

      <Button className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground">Share Your Progress</Button>
      <p className="text-center text-sm mt-4 opacity-80">Explore your trends in Amplitude — <a href="#" className="underline">sign up free</a> today</p>
    </div>
  );
};
