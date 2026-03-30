"use client";

import { Card } from "@/components/ui/card";
import { ArrowLeftRight } from "lucide-react";

export default function TransactionsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">עסקאות</h1>

      <Card className="p-8 text-center">
        <ArrowLeftRight className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">אין עסקאות עדיין</p>
        <p className="text-sm text-muted-foreground mt-1">
          עסקאות שלך יופיעו כאן כאשר תמכור או תקנה פריטים
        </p>
      </Card>
    </div>
  );
}
