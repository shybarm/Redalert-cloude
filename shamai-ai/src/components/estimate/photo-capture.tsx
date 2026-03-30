"use client";

import { useCallback, useRef } from "react";
import { Camera, Upload, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PhotoCaptureProps {
  photos: { file: File; preview: string }[];
  onAddPhoto: (file: File, preview: string) => void;
  onRemovePhoto: (index: number) => void;
  maxPhotos?: number;
}

const PHOTO_SLOTS = [
  { label: "צילום חזיתי", description: "צלם את הפריט מלפנים" },
  { label: "צילום פרטים/תווית", description: "צלם תווית, מספר דגם, או פרט מזהה" },
];

export function PhotoCapture({
  photos,
  onAddPhoto,
  onRemovePhoto,
  maxPhotos = 2,
}: PhotoCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const activeSlotRef = useRef(0);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const preview = URL.createObjectURL(file);
        onAddPhoto(file, preview);
      }
      e.target.value = "";
    },
    [onAddPhoto]
  );

  const openCamera = (slotIndex: number) => {
    activeSlotRef.current = slotIndex;
    cameraInputRef.current?.click();
  };

  const openGallery = (slotIndex: number) => {
    activeSlotRef.current = slotIndex;
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold">צלם 2 תמונות</h2>
        <p className="text-muted-foreground text-sm">
          (1) חזית (2) תקריב של סימון/פינה/חיבור
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {PHOTO_SLOTS.slice(0, maxPhotos).map((slot, index) => {
          const photo = photos[index];

          return (
            <Card
              key={index}
              className={cn(
                "relative aspect-square overflow-hidden border-2 border-dashed transition-colors",
                photo
                  ? "border-primary/50 bg-primary/5"
                  : "border-muted-foreground/30 hover:border-primary/50"
              )}
            >
              {photo ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.preview}
                    alt={slot.label}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 start-2 flex gap-1">
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-7 w-7"
                      onClick={() => onRemovePhoto(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-7 w-7"
                      onClick={() => openCamera(index)}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="absolute bottom-0 start-0 end-0 bg-black/60 text-white text-xs p-1.5 text-center">
                    {slot.label}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-3 text-center gap-3">
                  <div className="text-muted-foreground text-sm font-medium">
                    {slot.label}
                  </div>
                  <p className="text-xs text-muted-foreground/70">
                    {slot.description}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs"
                      onClick={() => openCamera(index)}
                    >
                      <Camera className="h-3.5 w-3.5" />
                      צלם
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs"
                      onClick={() => openGallery(index)}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      העלה
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Hidden inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
