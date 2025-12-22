import { ChevronDown, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useResults, TabType } from "@/results/context/ResultsContext";

const navItems: Array<{
  label: string;
  tab: TabType;
  dropdown?: Array<{ label: string; tab: TabType; disabled?: boolean }>;
  comingSoon?: boolean;
}> = [
  { label: "Overview", tab: "overview" },
  { label: "Executive Summary", tab: "executive-summary" },
  {
    label: "Performance Insights",
    tab: "prompts",
    dropdown: [
      { label: "Prompts", tab: "prompts" },
      { label: "Sources", tab: "sources-all" },
      { label: "Competitor Analysis", tab: "competitors-comparisons" },
      { label: "Content Impact Analysis", tab: "competitors-comparisons", disabled: true},
    ],
  },
  {
    label: "Action Center",
    tab: "recommendations",
    dropdown: [
      { label: "Recommendations", tab: "recommendations"},
    ],
  },
];

export const Navigation = () => {
  const { activeTab, setActiveTab } = useResults();

  const isActive = (tab: TabType, dropdown?: { tab: TabType }[]) => {
    if (dropdown) {
      return dropdown.some((item) => activeTab === item.tab);
    }
    return activeTab === tab;
  };

  const handleTabClick = (tab: TabType, disabled?: boolean) => {
    if (disabled) return;
    setActiveTab(tab);
  };

  return (
    <nav className="pt-[12px] border-b border-border bg-card hidden md:block">
      <div className="flex items-center gap-1 px-6 overflow-x-auto">
        {navItems.map((item) =>
          item.dropdown ? (
            <DropdownMenu key={item.label}>
              <DropdownMenuTrigger
                className={cn(
                  "nav-tab flex items-center gap-1 outline-none whitespace-nowrap",
                  isActive(item.tab, item.dropdown) && "nav-tab-active",
                  item.comingSoon && "opacity-60"
                )}
              >
                {item.label}
                {item.comingSoon && <Lock className="w-3 h-3 ml-1" />}
                <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-card border-border z-50">
                {item.comingSoon && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground border-b border-border mb-1">
                    Coming Soon
                  </div>
                )}
                {item.dropdown.map((subItem) => (
                  <DropdownMenuItem 
                    key={subItem.tab} 
                    disabled={subItem.disabled}
                    onClick={() => handleTabClick(subItem.tab, subItem.disabled)}
                    className={cn(
                      "w-full cursor-pointer",
                      activeTab === subItem.tab && "bg-muted",
                      subItem.disabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {subItem.label}
                    {subItem.disabled && <Lock className="w-3 h-3 ml-auto" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button
              key={item.tab}
              onClick={() => handleTabClick(item.tab)}
              className={cn(
                "nav-tab whitespace-nowrap",
                activeTab === item.tab && "nav-tab-active"
              )}
            >
              {item.label}
            </button>
          )
        )}
      </div>
    </nav>
  );
};
