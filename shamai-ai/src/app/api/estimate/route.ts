import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeProduct, ProhibitedItemError } from "@/lib/ai/analyze-product";
import { createEstimationSchema } from "@/lib/utils/validators";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createEstimationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "נתונים לא תקינים" },
        { status: 400 }
      );
    }

    const { photoUrls, photoIds, photoTypes } = parsed.data;

    // Create estimation record first
    const estimation = await prisma.estimation.create({
      data: {
        userId: session.user.id,
        photos: {
          create: photoUrls.map((url, i) => ({
            cloudinaryUrl: url,
            cloudinaryId: photoIds[i],
            photoType: photoTypes[i],
            purpose: i === 0 ? "חזית" : "פרטים/תווית",
          })),
        },
      },
      include: { photos: true },
    });

    try {
      // Run full AI analysis pipeline
      const analysis = await analyzeProduct(photoUrls);

      // Update estimation with results
      const updated = await prisma.estimation.update({
        where: { id: estimation.id },
        data: {
          productIdentification: analysis.product.product as never,
          aiConditionAssessment: analysis.product.condition.assessment,
          confidenceLevel: analysis.pricing.confidence,
          priceMin: analysis.pricing.price_range.min,
          priceMax: analysis.pricing.price_range.max,
          priceQuickSale: analysis.pricing.tiers.quick_sale,
          priceRealistic: analysis.pricing.tiers.realistic,
          priceMaximum: analysis.pricing.tiers.maximum,
          adTitle: analysis.ad.title,
          adDescription: analysis.ad.description,
          adConditionText: analysis.ad.condition_text,
          adSpecs: analysis.ad.specs_text,
          adSearchKeywords: analysis.ad.search_keywords,
          adPickupShipping: analysis.ad.pickup_shipping,
          adCta: analysis.ad.cta,
          isProhibited: analysis.safety.isProhibited,
          prohibitedReason: analysis.safety.prohibitedReason,
          isSuspectedCounterfeit: analysis.safety.isSuspectedCounterfeit,
          counterfeitDetails: analysis.safety.counterfeitDetails,
        },
        include: { photos: true },
      });

      return NextResponse.json({
        id: updated.id,
        product: analysis.product,
        pricing: analysis.pricing,
        ad: analysis.ad,
        safety: analysis.safety,
        photoSuggestion: analysis.photoSuggestion,
        photos: updated.photos.map((p) => ({
          id: p.id,
          url: p.cloudinaryUrl,
          type: p.photoType,
        })),
      });
    } catch (error) {
      if (error instanceof ProhibitedItemError) {
        await prisma.estimation.update({
          where: { id: estimation.id },
          data: {
            isProhibited: true,
            prohibitedReason: error.message,
          },
        });

        return NextResponse.json(
          {
            id: estimation.id,
            isProhibited: true,
            prohibitedReason: error.message,
            prohibitedCategory: error.category,
          },
          { status: 403 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Estimation error:", error);
    return NextResponse.json(
      { error: "שגיאה בהערכת הפריט. נסו שוב." },
      { status: 500 }
    );
  }
}
