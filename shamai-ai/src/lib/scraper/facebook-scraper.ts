/**
 * Facebook Marketplace scraper.
 */

import { scrapeUrl } from "./scraping-client";
import { prisma } from "@/lib/prisma";

interface FacebookListing {
  title: string;
  price: number;
  location: string | null;
  url: string;
  category: string;
}

export async function scrapeFacebookMarketplace(
  query: string,
  categorySlug: string
): Promise<FacebookListing[]> {
  const listings: FacebookListing[] = [];

  try {
    const url = `https://www.facebook.com/marketplace/israel/search/?query=${encodeURIComponent(query)}`;
    const result = await scrapeUrl({
      url,
      renderJs: true,
      premiumProxy: true,
    });

    const pricePattern = /\u20AA\s?(\d[\d,]*)/g;
    let match;

    while ((match = pricePattern.exec(result.body)) !== null) {
      const price = parseInt(match[1].replace(/,/g, "")) * 100;
      if (price > 0 && price < 100000000) {
        listings.push({
          title: `Facebook listing`,
          price,
          location: null,
          url: "https://www.facebook.com/marketplace/israel",
          category: categorySlug,
        });
      }
    }
  } catch (error) {
    console.error("Facebook scrape error:", error);
  }

  return listings;
}

export async function saveFacebookListings(
  listings: FacebookListing[]
): Promise<number> {
  let saved = 0;
  for (const listing of listings) {
    try {
      const category = await prisma.category.findUnique({
        where: { slug: listing.category },
      });
      await prisma.priceReference.create({
        data: {
          source: "facebook",
          sourceUrl: listing.url,
          productName: listing.title,
          price: listing.price,
          categoryId: category?.id || null,
          currency: "ILS",
        },
      });
      saved++;
    } catch (error) {
      console.error("Save Facebook listing error:", error);
    }
  }
  return saved;
}
