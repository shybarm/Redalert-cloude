import { z } from "zod";

export const conditionSchema = z.enum([
  "NEW",
  "LIKE_NEW",
  "GOOD",
  "FAIR",
  "FOR_PARTS",
]);

export const createEstimationSchema = z.object({
  photoUrls: z
    .array(z.string().url())
    .min(2, "נדרשות לפחות 2 תמונות")
    .max(5, "מקסימום 5 תמונות"),
  photoIds: z.array(z.string()).min(2).max(5),
  photoTypes: z.array(z.string()).min(2).max(5),
});

export const conditionOverrideSchema = z.object({
  condition: conditionSchema,
});

export const createListingSchema = z.object({
  estimationId: z.string(),
  selectedPrice: z.number().positive("המחיר חייב להיות חיובי"),
  city: z.string().optional(),
  area: z.string().optional(),
  selfPickup: z.boolean().optional(),
  courierAvailable: z.boolean().optional(),
  shippingAvailable: z.boolean().optional(),
});

export const publishListingSchema = z.object({
  platforms: z.array(z.enum(["INTERNAL", "YAD2", "FACEBOOK"])).min(1),
});

export const searchListingsSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  priceMin: z.coerce.number().optional(),
  priceMax: z.coerce.number().optional(),
  condition: conditionSchema.optional(),
  city: z.string().optional(),
  sort: z.enum(["newest", "oldest", "price_asc", "price_desc"]).optional(),
  page: z.coerce.number().positive().optional().default(1),
  limit: z.coerce.number().positive().max(50).optional().default(20),
});
