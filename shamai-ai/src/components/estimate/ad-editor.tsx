"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { AdGenerationResult } from "@/types/estimation";

interface AdEditorProps {
  ad: AdGenerationResult;
  onSave: (ad: AdGenerationResult) => void;
  onCancel: () => void;
}

export function AdEditor({ ad, onSave, onCancel }: AdEditorProps) {
  const [editedAd, setEditedAd] = useState(ad);

  const updateField = (field: keyof AdGenerationResult, value: string | string[]) => {
    setEditedAd((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg">עריכת מודעה</h3>

      <div className="space-y-3">
        <div>
          <Label htmlFor="title">כותרת</Label>
          <Input
            id="title"
            value={editedAd.title}
            onChange={(e) => updateField("title", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="description">תיאור</Label>
          <Textarea
            id="description"
            rows={5}
            value={editedAd.description}
            onChange={(e) => updateField("description", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="condition_text">מצב</Label>
          <Input
            id="condition_text"
            value={editedAd.condition_text}
            onChange={(e) => updateField("condition_text", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="specs_text">מפרט</Label>
          <Textarea
            id="specs_text"
            rows={3}
            value={editedAd.specs_text}
            onChange={(e) => updateField("specs_text", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="pickup_shipping">איסוף/משלוח</Label>
          <Input
            id="pickup_shipping"
            value={editedAd.pickup_shipping}
            onChange={(e) => updateField("pickup_shipping", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="cta">קריאה לפעולה</Label>
          <Input
            id="cta"
            value={editedAd.cta}
            onChange={(e) => updateField("cta", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="keywords">מילות חיפוש (מופרדות בפסיק)</Label>
          <Input
            id="keywords"
            value={editedAd.search_keywords.join(", ")}
            onChange={(e) =>
              updateField(
                "search_keywords",
                e.target.value.split(",").map((k) => k.trim()).filter(Boolean)
              )
            }
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          ביטול
        </Button>
        <Button onClick={() => onSave(editedAd)}>שמור שינויים</Button>
      </div>
    </div>
  );
}
