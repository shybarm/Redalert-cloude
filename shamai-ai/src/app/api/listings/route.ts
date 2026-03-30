import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createListingSchema } from "@/lib/utils/validators";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createListingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "נתונים לא תקינים" },
        { status: 400 }
      );
    }

    const { estimationId, selectedPrice, city, area, selfPickup, courierAvailable, shippingAvailable } =
      parsed.data;

    const estimation = await prisma.estimation.findUnique({
      where: { id: estimationId, userId: session.user.id },
      include: { photos: true },
    });

    if (!estimation) {
      return NextResponse.json({ error: "הערכה לא נמצאה" }, { status: 404 });
    }

    if (!estimation.adTitle || !estimation.adDescription) {
      return NextResponse.json(
        { error: "ההערכה לא הושלמה עדיין" },
        { status: 400 }
      );
    }

    const product = estimation.productIdentification as Record<string, unknown>;
    const condition = estimation.userConditionOverride || estimation.aiConditionAssessment || "GOOD";

    // Find or create category
    let categoryId: string | undefined;
    if (product?.category) {
      const category = await prisma.category.findUnique({
        where: { slug: product.category as string },
      });
      categoryId = category?.id;
    }

    const listing = await prisma.listing.create({
      data: {
        userId: session.user.id,
        estimationId,
        categoryId,
        title: estimation.adTitle,
        description: estimation.adDescription,
        condition: condition as never,
        specs: product?.specs as never || undefined,
        keywords: estimation.adSearchKeywords,
        brand: (product?.brand as string) || null,
        model: (product?.model as string) || null,
        priceQuickSale: estimation.priceQuickSale || 0,
        priceRealistic: estimation.priceRealistic || 0,
        priceMaximum: estimation.priceMaximum || 0,
        selectedPrice,
        city: city || null,
        area: area || null,
        selfPickup: selfPickup ?? true,
        courierAvailable: courierAvailable ?? false,
        shippingAvailable: shippingAvailable ?? false,
        photos: {
          create: estimation.photos.map((photo, i) => ({
            cloudinaryId: photo.cloudinaryId,
            cloudinaryUrl: photo.cloudinaryUrl,
            sortOrder: i,
            isPrimary: i === 0,
          })),
        },
      },
      include: { photos: true },
    });

    return NextResponse.json(listing);
  } catch (error) {
    console.error("Create listing error:", error);
    return NextResponse.json(
      { error: "שגיאה ביצירת המודעה" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
    }

    const listings = await prisma.listing.findMany({
      where: { userId: session.user.id },
      include: { photos: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(listings);
  } catch (error) {
    console.error("Get listings error:", error);
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
}
