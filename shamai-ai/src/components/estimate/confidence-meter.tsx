"use client";

import { cn } from "@/lib/utils";
import type { ConfidenceLevel } from "@/types/estimation";
import { CONFIDENCE_LABELS } from "@/types/estimation";
import { ShieldCheck, ShieldAlert, Shield } from "lucide-react";

interface ConfidenceMeterProps {
  level: ConfidenceLevel;
  photoCount: number;
}

const CONFIDENCE_CONFIG: Record<
  ConfidenceLevel,
  { color: string; bg: string; icon: typeof ShieldCheck; bars: number }
> = {
  LOW: { color: "text-orange-500", bg: "bg-orange-500", icon: ShieldAlert, bars: 1 },
  MEDIUM: { color: "text-yellow-500", bg: "bg-yellow-500", icon: Shield, bars: 2 },
  HIGH: { color: "text-green-500", bg: "bg-green-500", icon: ShieldCheck, bars: 3 },
  VERY_HIGH: { color: "text-emerald-500", bg: "bg-emerald-500", icon: ShieldCheck, bars: 4 },
};

export function ConfidenceMeter({ level, photoCount }: ConfidenceMeterProps) {
  const config = CONFIDENCE_CONFIG[level];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <Icon className={cn("h-5 w-5", config.color)} />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-medium", config.color)}>
            ביטחון {CONFIDENCE_LABELS[level]}
          </span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4].map((bar) => (
              <div
                key={bar}
                className={cn(
                  "h-3 w-1.5 rounded-sm transition-colors",
                  bar <= config.bars ? config.bg : "bg-muted-foreground/20"
                )}
              />
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          על סמך {photoCount} תמונות
        </p>
      </div>
    </div>
  );
}
