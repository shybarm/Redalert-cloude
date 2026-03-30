/**
 * Aggregates and normalizes price data from scraped sources.
 */

import { prisma } from "@/lib/prisma";

export interface AggregatedPrice {
  category: string;
  averagePrice: number;
  medianPrice: number;
  minPrice: number;
  maxPrice: number;
  count: number;
  sources: string[];
}

export async function getAggregatedPrices(
  categorySlug: string,
  brand?: string,
  model?: string,
  daysBack: number = 30
): Promise<AggregatedPrice | null> {
  const since = new Date();
  since.setDate(since.getDate() - daysBack);

  const category = await prisma.category.findUnique({
    where: { slug: categorySlug },
  });

  if (!category) return null;

  const where: Record<string, unknown> = {
    categoryId: category.id,
    isActive: true,
    scrapedAt: { gte: since },
  };

  if (brand) where.brand = { equals: brand, mode: "insensitive" };
  if (model) where.model = { contains: model, mode: "insensitive" };

  const references = await prisma.priceReference.findMany({
    where: where as never,
    orderBy: { price: "asc" },
  });

  if (references.length === 0) return null;

  const prices = references.map((r) => r.price);
  const sources = [...new Set(references.map((r) => r.source))];

  return {
    category: categorySlug,
    averagePrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
    medianPrice: prices[Math.floor(prices.length / 2)],
    minPrice: prices[0],
    maxPrice: prices[prices.length - 1],
    count: prices.length,
    sources,
  };
}

export async function deactivateOldReferences(daysOld: number = 30): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);
  const result = await prisma.priceReference.updateMany({
    where: { isActive: true, scrapedAt: { lt: cutoff } },
    data: { isActive: false },
  });
  return result.count;
}
