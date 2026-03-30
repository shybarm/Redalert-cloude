/**
 * Yad2 scraper - extracts product listings and prices.
 */

import { scrapeUrl } from "./scraping-client";
import { prisma } from "@/lib/prisma";

interface Yad2Listing {
  title: string;
  price: number;
  condition: string | null;
  url: string;
  category: string;
}

export async function scrapeYad2Category(
  categorySlug: string,
  maxPages: number = 5
): Promise<Yad2Listing[]> {
  const listings: Yad2Listing[] = [];

  for (let page = 1; page <= maxPages; page++) {
    try {
      const url = `https://market.yad2.co.il/products?category=${categorySlug}&page=${page}`;
      const result = await scrapeUrl({
        url,
        renderJs: true,
        premiumProxy: true,
      });

      const parsed = parseYad2Html(result.body, categorySlug);
      listings.push(...parsed);

      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Yad2 scrape error (page ${page}):`, error);
      break;
    }
  }

  return listings;
}

function parseYad2Html(html: string, category: string): Yad2Listing[] {
  const listings: Yad2Listing[] = [];

  // Basic regex parsing - in production use cheerio
  const pricePattern = /\u20AA\s?(\d[\d,]*)/g;
  let match;

  while ((match = pricePattern.exec(html)) !== null) {
    const price = parseInt(match[1].replace(/,/g, "")) * 100;
    if (price > 0 && price < 100000000) {
      listings.push({
        title: `Yad2 listing`,
        price,
        condition: null,
        url: `https://market.yad2.co.il/products/${category}`,
        category,
      });
    }
  }

  return listings;
}

export async function saveYad2Listings(listings: Yad2Listing[]): Promise<number> {
  let saved = 0;
  for (const listing of listings) {
    try {
      const category = await prisma.category.findUnique({
        where: { slug: listing.category },
      });
      await prisma.priceReference.create({
        data: {
          source: "yad2",
          sourceUrl: listing.url,
          productName: listing.title,
          price: listing.price,
          categoryId: category?.id || null,
          currency: "ILS",
        },
      });
      saved++;
    } catch (error) {
      console.error("Save listing error:", error);
    }
  }
  return saved;
}
