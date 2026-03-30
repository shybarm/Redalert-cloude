"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Loader2,
  MapPin,
  Phone,
  MessageCircle,
  Flag,
  Package,
  Truck,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/utils/format-currency";
import { CONDITION_LABELS } from "@/types/estimation";
import type { ItemCondition } from "@/types/estimation";
import { toast } from "sonner";

interface ListingDetail {
  id: string;
  title: string;
  description: string;
  condition: ItemCondition;
  specs: Record<string, string> | null;
  keywords: string[];
  brand: string | null;
  model: string | null;
  selectedPrice: number;
  city: string | null;
  selfPickup: boolean;
  courierAvailable: boolean;
  shippingAvailable: boolean;
  shippingCost: number | null;
  photos: { id: string; cloudinaryUrl: string; isPrimary: boolean }[];
  user: { id: string; name: string | null; image: string | null; city: string | null };
  createdAt: string;
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPhoto, setCurrentPhoto] = useState(0);

  useEffect(() => {
    async function fetchListing() {
      try {
        const res = await fetch(`/api/listings/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setListing(data);
      } catch {
        toast.error("מודעה לא נמצאה");
      } finally {
        setLoading(false);
      }
    }
    fetchListing();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">מודעה לא נמצאה</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Photo Gallery */}
      <div className="relative aspect-video md:aspect-[16/9] rounded-xl overflow-hidden bg-muted">
        {listing.photos.length > 0 ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={listing.photos[currentPhoto]?.cloudinaryUrl}
              alt={listing.title}
              className="w-full h-full object-contain"
            />
            {listing.photos.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute start-2 top-1/2 -translate-y-1/2 rounded-full opacity-80"
                  onClick={() =>
                    setCurrentPhoto((p) =>
                      p > 0 ? p - 1 : listing.photos.length - 1
                    )
                  }
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute end-2 top-1/2 -translate-y-1/2 rounded-full opacity-80"
                  onClick={() =>
                    setCurrentPhoto((p) =>
                      p < listing.photos.length - 1 ? p + 1 : 0
                    )
                  }
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="absolute bottom-2 start-1/2 -translate-x-1/2 flex gap-1">
                  {listing.photos.map((_, i) => (
                    <button
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i === currentPhoto ? "bg-white" : "bg-white/40"
                      }`}
                      onClick={() => setCurrentPhoto(i)}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            אין תמונה
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-4">
          <div>
            <h1 className="text-xl font-bold">{listing.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">
                {CONDITION_LABELS[listing.condition]}
              </Badge>
              {listing.brand && (
                <Badge variant="outline">{listing.brand}</Badge>
              )}
            </div>
          </div>

          <div className="text-2xl font-bold text-primary">
            {formatCurrency(listing.selectedPrice)}
          </div>

          <Separator />

          <div className="space-y-2">
            <h2 className="font-semibold">תיאור</h2>
            <p className="text-sm whitespace-pre-line text-muted-foreground">
              {listing.description}
            </p>
          </div>

          {listing.specs && Object.keys(listing.specs).length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h2 className="font-semibold">מפרט</h2>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(listing.specs).map(([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <span className="text-muted-foreground">{key}:</span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Shipping info */}
          <Separator />
          <div className="space-y-2">
            <h2 className="font-semibold">איסוף ומשלוח</h2>
            <div className="flex flex-wrap gap-2">
              {listing.selfPickup && (
                <Badge variant="outline" className="gap-1">
                  <Package className="h-3 w-3" />
                  איסוף עצמי
                </Badge>
              )}
              {listing.courierAvailable && (
                <Badge variant="outline" className="gap-1">
                  <Truck className="h-3 w-3" />
                  שליח
                </Badge>
              )}
              {listing.city && (
                <Badge variant="outline" className="gap-1">
                  <MapPin className="h-3 w-3" />
                  {listing.city}
                </Badge>
              )}
            </div>
          </div>

          {/* Keywords */}
          {listing.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2">
              {listing.keywords.map((keyword) => (
                <Badge key={keyword} variant="secondary" className="text-[10px]">
                  {keyword}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Seller Card */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={listing.user.image || undefined} />
                <AvatarFallback>
                  {listing.user.name?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-sm">
                  {listing.user.name || "משתמש"}
                </div>
                {listing.user.city && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {listing.user.city}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Button className="w-full gap-2">
                <Phone className="h-4 w-4" />
                צור קשר
              </Button>
              <Button variant="outline" className="w-full gap-2">
                <MessageCircle className="h-4 w-4" />
                שלח הודעה
              </Button>
            </div>
          </Card>

          {/* Report */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full gap-1.5 text-muted-foreground"
            onClick={() => toast.info("דיווח נשלח")}
          >
            <Flag className="h-3.5 w-3.5" />
            דווח על מודעה
          </Button>
        </div>
      </div>
    </div>
  );
}
