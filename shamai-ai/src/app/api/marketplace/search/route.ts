import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchListingsSchema } from "@/lib/utils/validators";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const searchParams = Object.fromEntries(req.nextUrl.searchParams);
    const parsed = searchListingsSchema.safeParse(searchParams);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "פרמטרי חיפוש לא תקינים" },
        { status: 400 }
      );
    }

    const { q, category, priceMin, priceMax, condition, city, sort, page, limit } =
      parsed.data;

    const where: Prisma.ListingWhereInput = {
      status: "ACTIVE",
    };

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
        { model: { contains: q, mode: "insensitive" } },
        { keywords: { has: q } },
      ];
    }

    if (category) {
      const cat = await prisma.category.findUnique({ where: { slug: category } });
      if (cat) where.categoryId = cat.id;
    }

    if (priceMin !== undefined || priceMax !== undefined) {
      where.selectedPrice = {};
      if (priceMin !== undefined)
        (where.selectedPrice as Prisma.IntFilter).gte = priceMin;
      if (priceMax !== undefined)
        (where.selectedPrice as Prisma.IntFilter).lte = priceMax;
    }

    if (condition) where.condition = condition;
    if (city) where.city = { contains: city, mode: "insensitive" };

    const orderBy: Prisma.ListingOrderByWithRelationInput = (() => {
      switch (sort) {
        case "oldest": return { createdAt: "asc" as const };
        case "price_asc": return { selectedPrice: "asc" as const };
        case "price_desc": return { selectedPrice: "desc" as const };
        default: return { createdAt: "desc" as const };
      }
    })();

    const skip = (page - 1) * limit;

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          photos: { where: { isPrimary: true }, take: 1 },
          category: true,
        },
      }),
      prisma.listing.count({ where }),
    ]);

    return NextResponse.json({
      listings,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "שגיאה בחיפוש" }, { status: 500 });
  }
}
