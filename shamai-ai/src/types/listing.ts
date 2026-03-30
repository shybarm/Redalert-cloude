import type { ItemCondition } from "./estimation";

export type ListingStatus =
  | "DRAFT"
  | "ACTIVE"
  | "SOLD"
  | "EXPIRED"
  | "REMOVED"
  | "FLAGGED";

export type PublishPlatform = "INTERNAL" | "YAD2" | "FACEBOOK";
export type PublishStatus = "PENDING" | "PUBLISHED" | "FAILED" | "REMOVED";
export type ShippingMethod = "SELF_PICKUP" | "COURIER" | "INSURED_SHIPPING";

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  DRAFT: "טיוטה",
  ACTIVE: "פעיל",
  SOLD: "נמכר",
  EXPIRED: "פג תוקף",
  REMOVED: "הוסר",
  FLAGGED: "מסומן",
};

export const PLATFORM_LABELS: Record<PublishPlatform, string> = {
  INTERNAL: "שוק שמאי",
  YAD2: "יד2",
  FACEBOOK: "פייסבוק מרקטפלייס",
};

export const SHIPPING_LABELS: Record<ShippingMethod, string> = {
  SELF_PICKUP: "איסוף עצמי",
  COURIER: "שליח",
  INSURED_SHIPPING: "משלוח מבוטח",
};

export interface ListingData {
  id: string;
  title: string;
  description: string;
  condition: ItemCondition;
  specs: Record<string, string> | null;
  keywords: string[];
  brand: string | null;
  model: string | null;
  priceQuickSale: number;
  priceRealistic: number;
  priceMaximum: number;
  selectedPrice: number;
  city: string | null;
  area: string | null;
  selfPickup: boolean;
  courierAvailable: boolean;
  shippingAvailable: boolean;
  shippingCost: number | null;
  status: ListingStatus;
  photos: {
    id: string;
    url: string;
    isPrimary: boolean;
  }[];
  createdAt: string;
  publishedAt: string | null;
}

export interface CreateListingInput {
  estimationId: string;
  selectedPrice: number;
  city?: string;
  area?: string;
  selfPickup?: boolean;
  courierAvailable?: boolean;
  shippingAvailable?: boolean;
}
