import { openai } from "./openai-client";
import {
  PRICE_ESTIMATION_SYSTEM_PROMPT,
  buildPriceEstimationUserPrompt,
} from "./prompts/price-estimation";
import { prisma } from "@/lib/prisma";
import type { PriceEstimationResult } from "@/types/estimation";

export async function estimatePrice(
  product: Record<string, unknown>,
  condition: string,
  category: string,
  brand: string | null,
  model: string | null
): Promise<PriceEstimationResult> {
  // Fetch comparable listings from the database
  const comparables = await fetchComparables(category, brand, model);

  const userPrompt = buildPriceEstimationUserPrompt(
    product,
    condition,
    comparables.map((c) => ({
      productName: c.productName,
      price: c.price,
      condition: c.condition ?? undefined,
      source: c.source,
    }))
  );

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: PRICE_ESTIMATION_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    max_tokens: 1000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from price estimation AI");
  }

  return JSON.parse(content) as PriceEstimationResult;
}

async function fetchComparables(
  category: string,
  brand: string | null,
  model: string | null
) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const where: Record<string, unknown> = {
    isActive: true,
    scrapedAt: { gte: thirtyDaysAgo },
  };

  if (brand && model) {
    where.OR = [
      { brand: { equals: brand, mode: "insensitive" } },
      { model: { contains: model, mode: "insensitive" } },
      {
        productName: {
          contains: brand,
          mode: "insensitive",
        },
      },
    ];
  } else if (brand) {
    where.brand = { equals: brand, mode: "insensitive" };
  }

  // Also try to find by category
  const categoryRecord = await prisma.category.findFirst({
    where: { slug: category },
  });
  if (categoryRecord) {
    where.categoryId = categoryRecord.id;
  }

  try {
    const results = await prisma.priceReference.findMany({
      where: where as never,
      orderBy: { scrapedAt: "desc" },
      take: 20,
    });
    return results;
  } catch {
    // If database isn't set up yet, return empty
    return [];
  }
}

export async function recalculatePrice(
  product: Record<string, unknown>,
  newCondition: string,
  category: string,
  brand: string | null,
  model: string | null
): Promise<PriceEstimationResult> {
  return estimatePrice(product, newCondition, category, brand, model);
}
