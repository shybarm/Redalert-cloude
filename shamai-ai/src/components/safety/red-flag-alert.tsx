"use client";

import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface RedFlagAlertProps {
  details: string;
}

export function RedFlagAlert({ details }: RedFlagAlertProps) {
  return (
    <Card className="border-orange-500/50 bg-orange-500/10 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-medium text-sm text-orange-700 dark:text-orange-400">
            חשד לזיוף
          </p>
          <p className="text-sm text-muted-foreground">{details}</p>
          <p className="text-xs text-muted-foreground">
            מומלץ לבדוק את האותנטיות לפני המכירה. ניתן להוסיף תמונות נוספות
            לשיפור הזיהוי.
          </p>
        </div>
      </div>
    </Card>
  );
}
