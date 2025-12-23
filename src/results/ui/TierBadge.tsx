import React from "react";
import { getTierColorVar } from "@/results/data/formulas";
import { cn } from "@/lib/utils";

interface TierBadgeProps {
  tier: string;
  className?: string;
}

export const TierBadge: React.FC<TierBadgeProps> = ({ tier, className }) => {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded font-medium",
        "bg-[var(--tier-color)] text-white",
        "px-2.5 py-0.5 text-xs",
        getTierColorVar(tier),
        className
      )}
    >
      {tier}
    </span>
  );
};
