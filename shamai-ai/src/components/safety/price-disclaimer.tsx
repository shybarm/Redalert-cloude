import { Info } from "lucide-react";
import { PRICE_DISCLAIMER_HE } from "@/lib/utils/constants";

export function PriceDisclaimer() {
  return (
    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
      <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
      <p>{PRICE_DISCLAIMER_HE}</p>
    </div>
  );
}
