"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ItemCondition } from "@/types/estimation";
import { CONDITION_LABELS } from "@/types/estimation";

interface ConditionSelectorProps {
  selected: ItemCondition;
  aiSuggested: ItemCondition;
  onSelect: (condition: ItemCondition) => void;
  disabled?: boolean;
}

const CONDITIONS: ItemCondition[] = [
  "NEW",
  "LIKE_NEW",
  "GOOD",
  "FAIR",
  "FOR_PARTS",
];

export function ConditionSelector({
  selected,
  aiSuggested,
  onSelect,
  disabled,
}: ConditionSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">מצב הפריט</span>
        {selected !== aiSuggested && (
          <button
            onClick={() => onSelect(aiSuggested)}
            className="text-xs text-primary hover:underline"
          >
            חזור להערכת AI
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {CONDITIONS.map((condition) => (
          <Button
            key={condition}
            size="sm"
            variant={selected === condition ? "default" : "outline"}
            className={cn(
              "text-xs",
              condition === aiSuggested &&
                selected !== condition &&
                "border-primary/50"
            )}
            onClick={() => onSelect(condition)}
            disabled={disabled}
          >
            {CONDITION_LABELS[condition]}
            {condition === aiSuggested && selected !== condition && (
              <span className="ms-1 text-[10px] opacity-60">AI</span>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}
