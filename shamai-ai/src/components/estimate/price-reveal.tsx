"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils/format-currency";
import { cn } from "@/lib/utils";

interface PriceRevealProps {
  minPrice: number; // in agorot
  maxPrice: number; // in agorot
  onRevealComplete?: () => void;
}

export function PriceReveal({
  minPrice,
  maxPrice,
  onRevealComplete,
}: PriceRevealProps) {
  const [phase, setPhase] = useState<"spinning" | "revealing" | "done">(
    "spinning"
  );
  const [displayMin, setDisplayMin] = useState(0);
  const [displayMax, setDisplayMax] = useState(0);

  useEffect(() => {
    // Phase 1: Spinning random numbers
    const spinInterval = setInterval(() => {
      setDisplayMin(Math.floor(Math.random() * 999900) + 100);
      setDisplayMax(Math.floor(Math.random() * 999900) + 100);
    }, 50);

    // Phase 2: Slow down and reveal
    const revealTimeout = setTimeout(() => {
      clearInterval(spinInterval);
      setPhase("revealing");

      // Animate to actual values
      const steps = 20;
      let step = 0;
      const animInterval = setInterval(() => {
        step++;
        const progress = step / steps;
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

        setDisplayMin(Math.round(eased * minPrice));
        setDisplayMax(Math.round(eased * maxPrice));

        if (step >= steps) {
          clearInterval(animInterval);
          setDisplayMin(minPrice);
          setDisplayMax(maxPrice);
          setPhase("done");
          onRevealComplete?.();
        }
      }, 50);
    }, 1500);

    return () => {
      clearInterval(spinInterval);
      clearTimeout(revealTimeout);
    };
  }, [minPrice, maxPrice, onRevealComplete]);

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="text-sm text-muted-foreground font-medium">
        הערכת שווי
      </div>

      <div
        className={cn(
          "flex items-center gap-3 text-4xl md:text-5xl font-bold transition-all duration-500",
          phase === "spinning" && "text-muted-foreground/50",
          phase === "revealing" && "text-primary/70",
          phase === "done" && "text-primary"
        )}
      >
        <span className="font-mono tabular-nums">
          {formatCurrency(displayMin)}
        </span>
        <span className="text-2xl text-muted-foreground">-</span>
        <span className="font-mono tabular-nums">
          {formatCurrency(displayMax)}
        </span>
      </div>

      {phase === "spinning" && (
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      )}

      {phase === "done" && (
        <p className="text-sm text-muted-foreground animate-fade-in">
          על סמך ניתוח AI ומחירי שוק
        </p>
      )}
    </div>
  );
}
