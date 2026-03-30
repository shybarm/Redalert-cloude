import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeProduct } from "@/lib/ai/analyze-product";

export async function POST(
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
    const { photoUrl, photoId, purpose } = body;

    if (!photoUrl || !photoId) {
      return NextResponse.json(
        { error: "חסרים פרטי תמונה" },
        { status: 400 }
      );
    }

    const estimation = await prisma.estimation.findUnique({
      where: { id, userId: session.user.id },
      include: { photos: true },
    });

    if (!estimation) {
      return NextResponse.json({ error: "הערכה לא נמצאה" }, { status: 404 });
    }

    if (estimation.photos.length >= 5) {
      return NextResponse.json(
        { error: "מקסימום 5 תמונות להערכה" },
        { status: 400 }
      );
    }

    // Add the new photo
    await prisma.estimationPhoto.create({
      data: {
        estimationId: id,
        cloudinaryUrl: photoUrl,
        cloudinaryId: photoId,
        photoType: "additional",
        purpose: purpose || "תמונה נוספת",
      },
    });

    // Re-run analysis with all photos
    const allPhotos = [
      ...estimation.photos.map((p) => p.cloudinaryUrl),
      photoUrl,
    ];

    const analysis = await analyzeProduct(allPhotos);

    // Update estimation
    const updated = await prisma.estimation.update({
      where: { id },
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
        isSuspectedCounterfeit: analysis.safety.isSuspectedCounterfeit,
        counterfeitDetails: analysis.safety.counterfeitDetails,
      },
      include: { photos: true },
    });

    return NextResponse.json({
      estimation: updated,
      pricing: analysis.pricing,
      ad: analysis.ad,
      photoSuggestion: analysis.photoSuggestion,
    });
  } catch (error) {
    console.error("Additional photo error:", error);
    return NextResponse.json(
      { error: "שגיאה בעיבוד התמונה הנוספת" },
      { status: 500 }
    );
  }
}
