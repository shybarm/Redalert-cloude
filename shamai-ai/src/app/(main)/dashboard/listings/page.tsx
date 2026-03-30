"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pencil, Trash2, Eye } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format-currency";
import { CONDITION_LABELS } from "@/types/estimation";
import { LISTING_STATUS_LABELS } from "@/types/listing";
import type { ListingStatus } from "@/types/listing";
import type { ItemCondition } from "@/types/estimation";
import { toast } from "sonner";

interface ListingItem {
  id: string;
  title: string;
  selectedPrice: number;
  condition: ItemCondition;
  status: ListingStatus;
  city: string | null;
  createdAt: string;
  photos: { cloudinaryUrl: string }[];
}

export default function MyListingsPage() {
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/listings");
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setListings(data);
      } catch {
        console.error("Failed");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("בטוח שברצונך להסיר את המודעה?")) return;
    try {
      const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setListings((prev) => prev.filter((l) => l.id !== id));
      toast.success("המודעה הוסרה");
    } catch {
      toast.error("שגיאה בהסרת המודעה");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">המודעות שלי</h1>

      {listings.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">אין מודעות עדיין</p>
        </Card>
      ) : (
        listings.map((listing) => (
          <Card key={listing.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                {listing.photos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={listing.photos[0].cloudinaryUrl}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                ) : null}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <h3 className="font-medium text-sm">{listing.title}</h3>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-primary">
                    {formatCurrency(listing.selectedPrice)}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {LISTING_STATUS_LABELS[listing.status]}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">
                    {CONDITION_LABELS[listing.condition]}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(listing.createdAt).toLocaleDateString("he-IL")}
                  {listing.city && ` | ${listing.city}`}
                </p>
              </div>
              <div className="flex gap-1">
                <Link href={`/marketplace/listing/${listing.id}`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/dashboard/listings/${listing.id}/edit`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => handleDelete(listing.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
