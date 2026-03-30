"use client";

import { ShieldX } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ProhibitedItemBlockProps {
  reason: string;
}

export function ProhibitedItemBlock({ reason }: ProhibitedItemBlockProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 p-6">
      <Card className="border-destructive/50 bg-destructive/10 p-6 max-w-md text-center">
        <ShieldX className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-lg font-bold mb-2">פריט אסור למכירה</h2>
        <p className="text-sm text-muted-foreground mb-4">{reason}</p>
        <p className="text-xs text-muted-foreground">
          פריטים אסורים אינם ניתנים לפרסום בפלטפורמה. אם אתה חושב שזו טעות,
          ניתן לנסות שוב עם תמונות אחרות.
        </p>
      </Card>
      <Link href="/estimate">
        <Button>נסה פריט אחר</Button>
      </Link>
    </div>
  );
}
