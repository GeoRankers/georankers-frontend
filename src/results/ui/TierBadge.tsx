import React from 'react';
import { getTierBadgeClasses } from '@/results/data/formulas';
import { cn } from '@/lib/utils';

interface TierBadgeProps {
  tier: string;
  className?: string;
}

export const TierBadge: React.FC<TierBadgeProps> = ({ tier, className }) => {
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium",
      getTierBadgeClasses(tier),
      className
    )}>
      {tier}
    </span>
  );
};
