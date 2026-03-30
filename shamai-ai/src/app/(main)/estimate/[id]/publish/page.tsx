"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Send,
  Check,
  ExternalLink,
  Copy,
  Loader2,
  Store,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ISRAELI_CITIES, MICRO_FEE_AGOROT } from "@/lib/utils/constants";
import { formatCurrency } from "@/lib/utils/format-currency";

interface Platform {
  id: "INTERNAL" | "YAD2" | "FACEBOOK";
  name: string;
  icon: typeof Store;
  description: string;
  fee: number;
  selected: boolean;
}

export default function PublishPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const success = searchParams.get("success");

  const [platforms, setPlatforms] = useState<Platform[]>([
    {
      id: "INTERNAL",
      name: "שוק שמאי",
      icon: Store,
      description: "פרסום חינם בשוק שמאי AI",
      fee: 0,
      selected: true,
    },
    {
      id: "YAD2",
      name: "יד2",
      icon: Globe,
      description: "העתקת מודעה מוכנה + קישור ליד2",
      fee: MICRO_FEE_AGOROT,
      selected: false,
    },
    {
      id: "FACEBOOK",
      name: "פייסבוק מרקטפלייס",
      icon: Globe,
      description: "שיתוף מודעה בפייסבוק מרקטפלייס",
      fee: MICRO_FEE_AGOROT,
      selected: false,
    },
  ]);

  const [city, setCity] = useState("");
  const [selfPickup, setSelfPickup] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  useEffect(() => {
    if (success === "true") {
      toast.success("התשלום התקבל! המודעה מתפרסמת...");
    }
  }, [success]);

  const togglePlatform = (platformId: string) => {
    setPlatforms((prev) =>
      prev.map((p) =>
        p.id === platformId ? { ...p, selected: !p.selected } : p
      )
    );
  };

  const selectedPlatforms = platforms.filter((p) => p.selected);
  const totalFee = selectedPlatforms.reduce((sum, p) => sum + p.fee, 0);
  const hasExternalPlatforms = selectedPlatforms.some(
    (p) => p.id !== "INTERNAL"
  );

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      toast.error("בחר לפחות פלטפורמה אחת");
      return;
    }

    setPublishing(true);

    try {
      // First create the listing
      const listingRes = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estimationId: id,
          selectedPrice: 0, // Will be set from estimation
          city,
          selfPickup,
        }),
      });

      if (!listingRes.ok) {
        const err = await listingRes.json();
        throw new Error(err.error || "שגיאה ביצירת מודעה");
      }

      const listing = await listingRes.json();

      // If external platforms selected and have fee, redirect to payment
      if (hasExternalPlatforms && totalFee > 0) {
        const checkoutRes = await fetch("/api/payments/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listingId: listing.id,
            type: "micro-fee",
          }),
        });

        if (!checkoutRes.ok) throw new Error("שגיאה ביצירת תשלום");
        const { sessionUrl } = await checkoutRes.json();

        if (sessionUrl) {
          window.location.href = sessionUrl;
          return;
        }
      }

      // Publish to selected platforms
      const publishRes = await fetch(`/api/listings/${listing.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platforms: selectedPlatforms.map((p) => p.id),
        }),
      });

      if (!publishRes.ok) throw new Error("שגיאה בפרסום");

      setPublished(true);
      toast.success("המודעה פורסמה בהצלחה!");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "שגיאה לא צפויה";
      toast.error(message);
    } finally {
      setPublishing(false);
    }
  };

  if (published) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6 py-12">
        <div className="bg-green-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
          <Check className="h-10 w-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold">המודעה פורסמה!</h1>
        <p className="text-muted-foreground">
          המודעה שלך פעילה ומוכנה לקונים
        </p>
        <div className="flex flex-col gap-3">
          <Button onClick={() => (window.location.href = "/marketplace")}>
            צפה בשוק
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/dashboard")}
          >
            לוח שלי
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/estimate")}
          >
            שמאי פריט נוסף
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-xl font-bold">פרסום המודעה</h1>
        <p className="text-muted-foreground text-sm">
          בחר היכן לפרסם את המודעה שלך
        </p>
      </div>

      {/* Platform Selection */}
      <div className="space-y-3">
        <Label className="text-base font-medium">פלטפורמות</Label>
        {platforms.map((platform) => {
          const Icon = platform.icon;
          return (
            <Card
              key={platform.id}
              className={cn(
                "p-4 cursor-pointer transition-colors border-2",
                platform.selected
                  ? "border-primary bg-primary/5"
                  : "border-transparent hover:border-muted-foreground/20"
              )}
              onClick={() => togglePlatform(platform.id)}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    platform.selected ? "bg-primary/10" : "bg-muted"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      platform.selected
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{platform.name}</span>
                    {platform.fee === 0 ? (
                      <Badge variant="secondary" className="text-[10px]">
                        חינם
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">
                        {formatCurrency(platform.fee)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {platform.description}
                  </p>
                </div>
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                    platform.selected
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/30"
                  )}
                >
                  {platform.selected && (
                    <Check className="h-3 w-3 text-primary-foreground" />
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Separator />

      {/* Location & Shipping */}
      <div className="space-y-4">
        <Label className="text-base font-medium">פרטי איסוף</Label>

        <div className="space-y-2">
          <Label htmlFor="city">עיר</Label>
          <Input
            id="city"
            placeholder="בחר עיר..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            list="cities"
          />
          <datalist id="cities">
            {ISRAELI_CITIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="selfPickup"
            checked={selfPickup}
            onChange={(e) => setSelfPickup(e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="selfPickup" className="text-sm cursor-pointer">
            זמין לאיסוף עצמי
          </Label>
        </div>
      </div>

      {/* External platform hints */}
      {hasExternalPlatforms && (
        <Card className="p-4 bg-muted/50 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ExternalLink className="h-4 w-4" />
            פרסום חיצוני
          </div>
          <p className="text-xs text-muted-foreground">
            עבור פלטפורמות חיצוניות, המודעה תועתק ללוח שלך ותוכל להדביק אותה
            ישירות. עמלה קטנה של {formatCurrency(MICRO_FEE_AGOROT)} לכל
            פלטפורמה חיצונית.
          </p>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Copy className="h-3.5 w-3.5" />
            העתק מודעה
          </Button>
        </Card>
      )}

      {/* Total & Publish */}
      <div className="space-y-3 pt-2">
        {totalFee > 0 && (
          <div className="flex justify-between text-sm">
            <span>עמלת פרסום חיצוני</span>
            <span className="font-medium">{formatCurrency(totalFee)}</span>
          </div>
        )}

        <Button
          className="w-full h-12 text-base gap-2"
          size="lg"
          disabled={selectedPlatforms.length === 0 || publishing}
          onClick={handlePublish}
        >
          {publishing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              מפרסם...
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              פרסם!
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
