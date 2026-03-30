"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { AdGenerationResult } from "@/types/estimation";

interface AdPreviewProps {
  ad: AdGenerationResult;
  onEdit?: () => void;
}

export function AdPreview({ ad, onEdit }: AdPreviewProps) {
  const [copied, setCopied] = useState(false);

  const fullAdText = `${ad.title}\n\n${ad.description}\n\n${ad.condition_text}\n\n${ad.specs_text}\n\n${ad.pickup_shipping}\n\n${ad.cta}\n\n${ad.search_keywords.join(", ")}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullAdText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">מודעה מוכנה</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1.5">
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                הועתק
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                העתק
              </>
            )}
          </Button>
          {onEdit && (
            <Button size="sm" variant="outline" onClick={onEdit}>
              ערוך
            </Button>
          )}
        </div>
      </div>

      <div className="bg-card border rounded-lg p-4 space-y-3">
        {/* Title */}
        <h4 className="font-bold text-base">{ad.title}</h4>

        <Separator />

        {/* Description */}
        <p className="text-sm whitespace-pre-line">{ad.description}</p>

        {/* Condition */}
        <div className="text-sm">
          <span className="font-medium">מצב: </span>
          {ad.condition_text}
        </div>

        {/* Specs */}
        {ad.specs_text && (
          <div className="text-sm">
            <span className="font-medium">מפרט: </span>
            {ad.specs_text}
          </div>
        )}

        {/* Pickup/Shipping */}
        <div className="text-sm text-muted-foreground">
          {ad.pickup_shipping}
        </div>

        {/* CTA */}
        <div className="text-sm font-medium text-primary">{ad.cta}</div>

        <Separator />

        {/* Keywords */}
        <div className="flex flex-wrap gap-1.5">
          {ad.search_keywords.map((keyword) => (
            <Badge key={keyword} variant="secondary" className="text-xs">
              {keyword}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
