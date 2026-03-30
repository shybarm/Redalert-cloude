"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ListingCard } from "@/components/marketplace/listing-card";
import { CategoryNav } from "@/components/marketplace/category-nav";
import { CATEGORIES } from "@/lib/utils/constants";
import { Button } from "@/components/ui/button";

interface ListingItem {
  id: string;
  title: string;
  selectedPrice: number;
  condition: "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "FOR_PARTS";
  city: string | null;
  photos: { cloudinaryUrl: string }[];
}

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const categoryInfo = CATEGORIES.find((c) => c.slug === category);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        category,
        page: page.toString(),
        sort: "newest",
      });
      const res = await fetch(`/api/marketplace/search?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setListings(data.listings);
      setTotalPages(data.pages);
    } catch {
      console.error("Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, [category, page]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">
          {categoryInfo?.nameHe || category}
        </h1>
        <p className="text-muted-foreground text-sm">
          פריטים יד שנייה בקטגוריית {categoryInfo?.nameHe || category}
        </p>
      </div>

      <CategoryNav />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">אין פריטים בקטגוריה זו</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                id={listing.id}
                title={listing.title}
                price={listing.selectedPrice}
                condition={listing.condition}
                city={listing.city}
                photoUrl={listing.photos[0]?.cloudinaryUrl || null}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                הקודם
              </Button>
              <span className="flex items-center px-3 text-sm text-muted-foreground">
                עמוד {page} מתוך {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                הבא
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
