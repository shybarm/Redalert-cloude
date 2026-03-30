"use client";

import { formatCurrency } from "@/lib/utils/format-currency";
import { cn } from "@/lib/utils";
import { Zap, Target, TrendingUp } from "lucide-react";

interface PriceTiersProps {
  quickSale: number;
  realistic: number;
  maximum: number;
}

const tiers = [
  {
    key: "quickSale" as const,
    label: "מכירה מהירה",
    description: "נמכר תוך 1-3 ימים",
    icon: Zap,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    key: "realistic" as const,
    label: "מחיר ריאלי",
    description: "נמכר תוך 1-2 שבועות",
    icon: Target,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    key: "maximum" as const,
    label: "מחיר מקסימום",
    description: "נמכר תוך 3-4 שבועות",
    icon: TrendingUp,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
];

export function PriceTiers({ quickSale, realistic, maximum }: PriceTiersProps) {
  const prices = { quickSale, realistic, maximum };

  return (
    <div className="space-y-2">
      {tiers.map((tier) => {
        const Icon = tier.icon;
        return (
          <div
            key={tier.key}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg",
              tier.bg
            )}
          >
            <Icon className={cn("h-5 w-5 shrink-0", tier.color)} />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{tier.label}</div>
              <div className="text-xs text-muted-foreground">
                {tier.description}
              </div>
            </div>
            <div className={cn("font-bold text-lg tabular-nums", tier.color)}>
              {formatCurrency(prices[tier.key])}
            </div>
          </div>
        );
      })}
    </div>
  );
}
