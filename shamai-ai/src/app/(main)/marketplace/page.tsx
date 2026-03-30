"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { ListingCard } from "@/components/marketplace/listing-card";
import { SearchBar, type SearchFilters } from "@/components/marketplace/search-bar";
import { CategoryNav } from "@/components/marketplace/category-nav";
import { Button } from "@/components/ui/button";

interface ListingItem {
  id: string;
  title: string;
  selectedPrice: number;
  condition: "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "FOR_PARTS";
  city: string | null;
  photos: { cloudinaryUrl: string }[];
}

export default function MarketplacePage() {
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<SearchFilters>({
    q: "",
    category: "",
    city: "",
    sort: "newest",
  });

  const fetchListings = useCallback(
    async (currentFilters: SearchFilters, currentPage: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (currentFilters.q) params.set("q", currentFilters.q);
        if (currentFilters.category && currentFilters.category !== "all")
          params.set("category", currentFilters.category);
        if (currentFilters.city && currentFilters.city !== "all")
          params.set("city", currentFilters.city);
        if (currentFilters.sort) params.set("sort", currentFilters.sort);
        params.set("page", currentPage.toString());

        const res = await fetch(`/api/marketplace/search?${params}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setListings(data.listings);
        setTotalPages(data.pages);
      } catch {
        console.error("Failed to fetch listings");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchListings(filters, page);
  }, [filters, page, fetchListings]);

  const handleSearch = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">שוק שמאי</h1>
        <p className="text-muted-foreground text-sm">
          מצא פריטים יד שנייה במחירים הוגנים
        </p>
      </div>

      <SearchBar onSearch={handleSearch} />
      <CategoryNav />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">לא נמצאו פריטים</p>
          <p className="text-sm text-muted-foreground mt-1">
            נסה לשנות את החיפוש או הסינון
          </p>
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

          {/* Pagination */}
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
