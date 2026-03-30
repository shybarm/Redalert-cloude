"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhotoCapture } from "@/components/estimate/photo-capture";
import { useEstimationStore } from "@/stores/estimation-store";
import { toast } from "sonner";

export default function EstimatePage() {
  const router = useRouter();
  const { photos, addPhoto, removePhoto, setLoading, isLoading } =
    useEstimationStore();
  const [localPhotos, setLocalPhotos] = useState<
    { file: File; preview: string }[]
  >([]);

  const handleAddPhoto = useCallback(
    (file: File, preview: string) => {
      if (localPhotos.length >= 2) return;
      setLocalPhotos((prev) => [...prev, { file, preview }]);
      addPhoto(file, preview);
    },
    [localPhotos.length, addPhoto]
  );

  const handleRemovePhoto = useCallback(
    (index: number) => {
      setLocalPhotos((prev) => prev.filter((_, i) => i !== index));
      removePhoto(index);
    },
    [removePhoto]
  );

  const handleAnalyze = async () => {
    if (localPhotos.length < 2) {
      toast.error("נדרשות לפחות 2 תמונות");
      return;
    }

    setLoading(true);

    try {
      // Upload photos to Cloudinary
      const uploadedPhotos = await Promise.all(
        localPhotos.map(async (photo) => {
          // Get signed upload params
          const paramsRes = await fetch("/api/upload", { method: "POST" });
          const params = await paramsRes.json();

          // Upload to Cloudinary
          const formData = new FormData();
          formData.append("file", photo.file);
          formData.append("timestamp", params.timestamp.toString());
          formData.append("signature", params.signature);
          formData.append("api_key", params.apiKey);
          formData.append("folder", "shamai-ai");

          const uploadRes = await fetch(
            `https://api.cloudinary.com/v1_1/${params.cloudName}/image/upload`,
            { method: "POST", body: formData }
          );
          const uploadData = await uploadRes.json();
          return {
            url: uploadData.secure_url as string,
            id: uploadData.public_id as string,
          };
        })
      );

      // Send to estimation API
      const estimateRes = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoUrls: uploadedPhotos.map((p) => p.url),
          photoIds: uploadedPhotos.map((p) => p.id),
          photoTypes: ["front", "detail"],
        }),
      });

      if (!estimateRes.ok) {
        const errorData = await estimateRes.json();
        if (estimateRes.status === 403 && errorData.isProhibited) {
          toast.error(errorData.prohibitedReason || "פריט אסור למכירה");
          return;
        }
        throw new Error(errorData.error || "שגיאה בהערכה");
      }

      const result = await estimateRes.json();
      router.push(`/estimate/${result.id}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "שגיאה לא צפויה";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold">שמאי AI</h1>
        <p className="text-muted-foreground">
          צלם את הפריט וקבל הערכת שווי ומודעה מוכנה
        </p>
      </div>

      <PhotoCapture
        photos={localPhotos}
        onAddPhoto={handleAddPhoto}
        onRemovePhoto={handleRemovePhoto}
      />

      <Button
        className="w-full gap-2 h-12 text-base"
        size="lg"
        disabled={localPhotos.length < 2 || isLoading}
        onClick={handleAnalyze}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            מנתח את הפריט...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            שמאי את זה!
          </>
        )}
      </Button>

      {localPhotos.length > 0 && localPhotos.length < 2 && (
        <p className="text-center text-sm text-muted-foreground">
          נדרשת עוד תמונה אחת להתחלת ההערכה
        </p>
      )}
    </div>
  );
}
