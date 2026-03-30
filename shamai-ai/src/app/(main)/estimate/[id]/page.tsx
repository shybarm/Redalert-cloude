"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Send, Pencil, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PriceReveal } from "@/components/estimate/price-reveal";
import { ConfidenceMeter } from "@/components/estimate/confidence-meter";
import { ConditionSelector } from "@/components/estimate/condition-selector";
import { PriceTiers } from "@/components/estimate/price-tiers";
import { AdPreview } from "@/components/estimate/ad-preview";
import { AdEditor } from "@/components/estimate/ad-editor";
import { AdditionalPhotoRequest } from "@/components/estimate/additional-photo-request";
import { RedFlagAlert } from "@/components/safety/red-flag-alert";
import { ProhibitedItemBlock } from "@/components/safety/prohibited-item-block";
import { PriceDisclaimer } from "@/components/safety/price-disclaimer";
import { toast } from "sonner";
import type {
  ItemCondition,
  ConfidenceLevel,
  AdGenerationResult,
} from "@/types/estimation";

interface EstimationData {
  id: string;
  productIdentification: Record<string, unknown>;
  aiConditionAssessment: ItemCondition;
  userConditionOverride: ItemCondition | null;
  confidenceLevel: ConfidenceLevel;
  priceMin: number;
  priceMax: number;
  priceQuickSale: number;
  priceRealistic: number;
  priceMaximum: number;
  adTitle: string;
  adDescription: string;
  adConditionText: string;
  adSpecs: string;
  adSearchKeywords: string[];
  adPickupShipping: string;
  adCta: string;
  isProhibited: boolean;
  prohibitedReason: string | null;
  isSuspectedCounterfeit: boolean;
  counterfeitDetails: string | null;
  photos: { id: string; cloudinaryUrl: string; photoType: string }[];
}

export default function EstimationResultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<EstimationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReveal, setShowReveal] = useState(true);
  const [editing, setEditing] = useState(false);
  const [updatingCondition, setUpdatingCondition] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/estimate/${id}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const result = await res.json();
        setData(result);
      } catch {
        toast.error("שגיאה בטעינת ההערכה");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleConditionChange = useCallback(
    async (condition: ItemCondition) => {
      if (!data) return;
      setUpdatingCondition(true);
      try {
        const res = await fetch(`/api/estimate/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ condition }),
        });
        if (!res.ok) throw new Error("Failed to update");
        const result = await res.json();
        setData((prev) =>
          prev
            ? {
                ...prev,
                userConditionOverride: condition,
                priceMin: result.estimation.priceMin,
                priceMax: result.estimation.priceMax,
                priceQuickSale: result.estimation.priceQuickSale,
                priceRealistic: result.estimation.priceRealistic,
                priceMaximum: result.estimation.priceMaximum,
                confidenceLevel: result.estimation.confidenceLevel,
                adTitle: result.estimation.adTitle,
                adDescription: result.estimation.adDescription,
                adConditionText: result.estimation.adConditionText,
                adSpecs: result.estimation.adSpecs,
                adSearchKeywords: result.estimation.adSearchKeywords,
                adPickupShipping: result.estimation.adPickupShipping,
                adCta: result.estimation.adCta,
              }
            : null
        );
        toast.success("ההערכה עודכנה");
      } catch {
        toast.error("שגיאה בעדכון");
      } finally {
        setUpdatingCondition(false);
      }
    },
    [data, id]
  );

  const handleAdSave = useCallback(
    (ad: AdGenerationResult) => {
      if (!data) return;
      setData((prev) =>
        prev
          ? {
              ...prev,
              adTitle: ad.title,
              adDescription: ad.description,
              adConditionText: ad.condition_text,
              adSpecs: ad.specs_text,
              adSearchKeywords: ad.search_keywords,
              adPickupShipping: ad.pickup_shipping,
              adCta: ad.cta,
            }
          : null
      );
      setEditing(false);
      toast.success("המודעה עודכנה");
    },
    [data]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">הערכה לא נמצאה</p>
      </div>
    );
  }

  if (data.isProhibited) {
    return (
      <ProhibitedItemBlock
        reason={data.prohibitedReason || "פריט אסור למכירה"}
      />
    );
  }

  const currentCondition =
    data.userConditionOverride || data.aiConditionAssessment;

  const ad: AdGenerationResult = {
    title: data.adTitle,
    description: data.adDescription,
    condition_text: data.adConditionText,
    specs_text: data.adSpecs,
    search_keywords: data.adSearchKeywords,
    pickup_shipping: data.adPickupShipping,
    cta: data.adCta,
    selling_reason: "",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Price Reveal Animation */}
      {showReveal && data.priceMin && data.priceMax && (
        <PriceReveal
          minPrice={data.priceMin}
          maxPrice={data.priceMax}
          onRevealComplete={() =>
            setTimeout(() => setShowReveal(false), 1500)
          }
        />
      )}

      {/* Counterfeit Warning */}
      {data.isSuspectedCounterfeit && data.counterfeitDetails && (
        <RedFlagAlert details={data.counterfeitDetails} />
      )}

      {/* Split View: Valuation | Ad */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Valuation Panel */}
        <div className="space-y-4">
          {/* Product photos */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {data.photos.map((photo) => (
              <div
                key={photo.id}
                className="shrink-0 w-32 h-32 rounded-lg overflow-hidden border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.cloudinaryUrl}
                  alt="תמונת פריט"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>

          {/* Product Identification */}
          {data.productIdentification && (
            <Card className="p-4 space-y-2">
              <h3 className="font-bold">
                {(data.productIdentification as Record<string, unknown>)
                  .brand as string}{" "}
                {(data.productIdentification as Record<string, unknown>)
                  .model as string}
              </h3>
              <p className="text-sm text-muted-foreground">
                {(data.productIdentification as Record<string, unknown>)
                  .category as string}
              </p>
            </Card>
          )}

          {/* Confidence */}
          <ConfidenceMeter
            level={data.confidenceLevel}
            photoCount={data.photos.length}
          />

          {/* Price Tiers */}
          <PriceTiers
            quickSale={data.priceQuickSale}
            realistic={data.priceRealistic}
            maximum={data.priceMaximum}
          />

          {/* Condition Selector */}
          <ConditionSelector
            selected={currentCondition}
            aiSuggested={data.aiConditionAssessment}
            onSelect={handleConditionChange}
            disabled={updatingCondition}
          />

          {/* Disclaimer */}
          <PriceDisclaimer />
        </div>

        {/* Ad Panel */}
        <div className="space-y-4">
          {editing ? (
            <AdEditor
              ad={ad}
              onSave={handleAdSave}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <AdPreview ad={ad} onEdit={() => setEditing(true)} />
          )}

          {/* Additional Photo Request - placeholder */}
          {data.confidenceLevel !== "VERY_HIGH" &&
            data.photos.length < 5 && (
              <AdditionalPhotoRequest
                type={null}
                reason="תמונה נוספת יכולה לשפר את דיוק ההערכה"
                confidenceImprovement={`${data.confidenceLevel} -> HIGH`}
                onAddPhoto={() => toast.info("העלאת תמונה נוספת")}
              />
            )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          size="lg"
          className="flex-1 gap-2"
          onClick={() => router.push(`/estimate/${id}/publish`)}
        >
          <Send className="h-5 w-5" />
          פרסם עכשיו
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="gap-2"
          onClick={() => setEditing(true)}
        >
          <Pencil className="h-5 w-5" />
          ערוך מודעה
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="gap-2"
          onClick={() => toast.info("הוסף תמונה לשיפור ההערכה")}
        >
          <Camera className="h-5 w-5" />
          שפר הערכה
        </Button>
      </div>
    </div>
  );
}
