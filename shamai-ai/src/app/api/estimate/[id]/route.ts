import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { conditionOverrideSchema } from "@/lib/utils/validators";
import { recalculatePrice } from "@/lib/ai/estimate-price";
import { regenerateAd } from "@/lib/ai/generate-ad";
import { CONDITION_LABELS } from "@/types/estimation";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
    }

    const { id } = await params;
    const estimation = await prisma.estimation.findUnique({
      where: { id, userId: session.user.id },
      include: { photos: true },
    });

    if (!estimation) {
      return NextResponse.json({ error: "הערכה לא נמצאה" }, { status: 404 });
    }

    return NextResponse.json(estimation);
  } catch (error) {
    console.error("Get estimation error:", error);
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = conditionOverrideSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "מצב לא תקין" },
        { status: 400 }
      );
    }

    const estimation = await prisma.estimation.findUnique({
      where: { id, userId: session.user.id },
    });

    if (!estimation) {
      return NextResponse.json({ error: "הערכה לא נמצאה" }, { status: 404 });
    }

    const { condition } = parsed.data;
    const product = estimation.productIdentification as Record<string, unknown>;

    // Recalculate price with new condition
    const newPricing = await recalculatePrice(
      product,
      condition,
      (product?.category as string) || "other",
      (product?.brand as string) || null,
      (product?.model as string) || null
    );

    // Regenerate ad with new condition
    const specs = product?.specs as Record<string, string> || {};
    const newAd = await regenerateAd(
      product,
      condition,
      CONDITION_LABELS[condition],
      specs,
      newPricing.tiers
    );

    const updated = await prisma.estimation.update({
      where: { id },
      data: {
        userConditionOverride: condition,
        priceMin: newPricing.price_range.min,
        priceMax: newPricing.price_range.max,
        priceQuickSale: newPricing.tiers.quick_sale,
        priceRealistic: newPricing.tiers.realistic,
        priceMaximum: newPricing.tiers.maximum,
        confidenceLevel: newPricing.confidence,
        adTitle: newAd.title,
        adDescription: newAd.description,
        adConditionText: newAd.condition_text,
        adSpecs: newAd.specs_text,
        adSearchKeywords: newAd.search_keywords,
        adPickupShipping: newAd.pickup_shipping,
        adCta: newAd.cta,
      },
      include: { photos: true },
    });

    return NextResponse.json({
      estimation: updated,
      pricing: newPricing,
      ad: newAd,
    });
  } catch (error) {
    console.error("Update estimation error:", error);
    return NextResponse.json(
      { error: "שגיאה בעדכון ההערכה" },
      { status: 500 }
    );
  }
}
