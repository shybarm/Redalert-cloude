"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format-currency";
import { CONDITION_LABELS } from "@/types/estimation";
import type { ItemCondition } from "@/types/estimation";

interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  condition: ItemCondition;
  city: string | null;
  photoUrl: string | null;
}

export function ListingCard({
  id,
  title,
  price,
  condition,
  city,
  photoUrl,
}: ListingCardProps) {
  return (
    <Link href={`/marketplace/listing/${id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
        <div className="aspect-square bg-muted relative overflow-hidden">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              אין תמונה
            </div>
          )}
          <Badge
            variant="secondary"
            className="absolute top-2 start-2 text-[10px]"
          >
            {CONDITION_LABELS[condition]}
          </Badge>
        </div>
        <div className="p-3 space-y-1.5">
          <h3 className="font-medium text-sm line-clamp-2 leading-tight">
            {title}
          </h3>
          <div className="flex items-center justify-between">
            <span className="font-bold text-primary">
              {formatCurrency(price)}
            </span>
            {city && (
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {city}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
