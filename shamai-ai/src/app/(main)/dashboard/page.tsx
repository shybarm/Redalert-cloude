"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  List,
  TrendingUp,
  Eye,
  Loader2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/format-currency";
import { LISTING_STATUS_LABELS } from "@/types/listing";
import type { ListingStatus } from "@/types/listing";

interface DashboardData {
  listings: {
    id: string;
    title: string;
    selectedPrice: number;
    status: ListingStatus;
    createdAt: string;
    photos: { cloudinaryUrl: string }[];
  }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/listings");
        if (!res.ok) throw new Error("Failed");
        const listings = await res.json();
        setData({ listings });
      } catch {
        console.error("Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeListings =
    data?.listings.filter((l) => l.status === "ACTIVE").length || 0;
  const totalListings = data?.listings.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">לוח שלי</h1>
        <Link href="/estimate">
          <Button className="gap-2">
            <Camera className="h-4 w-4" />
            שמאי פריט חדש
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <List className="h-4 w-4" />
            מודעות פעילות
          </div>
          <div className="text-2xl font-bold mt-1">{activeListings}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Eye className="h-4 w-4" />
            סה&quot;כ מודעות
          </div>
          <div className="text-2xl font-bold mt-1">{totalListings}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <TrendingUp className="h-4 w-4" />
            נמכרו
          </div>
          <div className="text-2xl font-bold mt-1">
            {data?.listings.filter((l) => l.status === "SOLD").length || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <TrendingUp className="h-4 w-4" />
            סך מכירות
          </div>
          <div className="text-2xl font-bold mt-1">
            {formatCurrency(
              data?.listings
                .filter((l) => l.status === "SOLD")
                .reduce((sum, l) => sum + l.selectedPrice, 0) || 0
            )}
          </div>
        </Card>
      </div>

      {/* Recent Listings */}
      <div className="space-y-3">
        <h2 className="font-semibold">מודעות אחרונות</h2>
        {data?.listings.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              עדיין אין לך מודעות
            </p>
            <Link href="/estimate">
              <Button className="gap-2">
                <Camera className="h-4 w-4" />
                שמאי את הפריט הראשון שלך
              </Button>
            </Link>
          </Card>
        ) : (
          data?.listings.slice(0, 5).map((listing) => (
            <Card key={listing.id} className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
                  {listing.photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={listing.photos[0].cloudinaryUrl}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {listing.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm text-primary font-medium">
                      {formatCurrency(listing.selectedPrice)}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {LISTING_STATUS_LABELS[listing.status]}
                    </Badge>
                  </div>
                </div>
                <Link href={`/dashboard/listings/${listing.id}/edit`}>
                  <Button variant="ghost" size="sm">
                    ערוך
                  </Button>
                </Link>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
