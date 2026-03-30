"use client";

import { Camera, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface AdditionalPhotoRequestProps {
  type: string | null;
  reason: string;
  confidenceImprovement: string;
  onAddPhoto: () => void;
}

export function AdditionalPhotoRequest({
  reason,
  confidenceImprovement,
  onAddPhoto,
}: AdditionalPhotoRequestProps) {
  return (
    <Card className="p-4 border-primary/30 bg-primary/5">
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 p-2 rounded-lg shrink-0">
          <Camera className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium">תמונה נוספת תשפר את ההערכה</p>
          <p className="text-sm text-muted-foreground">{reason}</p>
          {confidenceImprovement && (
            <div className="flex items-center gap-1.5 text-xs text-primary">
              <ArrowUp className="h-3 w-3" />
              <span>ביטחון: {confidenceImprovement}</span>
            </div>
          )}
          <Button size="sm" onClick={onAddPhoto} className="gap-1.5 mt-1">
            <Camera className="h-3.5 w-3.5" />
            הוסף תמונה
          </Button>
        </div>
      </div>
    </Card>
  );
}
