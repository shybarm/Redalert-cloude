import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publishListingSchema } from "@/lib/utils/validators";

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
    const parsed = publishListingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "פלטפורמות לא תקינות" },
        { status: 400 }
      );
    }

    const listing = await prisma.listing.findUnique({
      where: { id, userId: session.user.id },
    });

    if (!listing) {
      return NextResponse.json({ error: "מודעה לא נמצאה" }, { status: 404 });
    }

    const { platforms } = parsed.data;

    // Activate listing
    await prisma.listing.update({
      where: { id },
      data: {
        status: "ACTIVE",
        publishedAt: new Date(),
      },
    });

    // Create publication records
    const publications = await Promise.all(
      platforms.map((platform) =>
        prisma.publication.upsert({
          where: {
            listingId_platform: { listingId: id, platform },
          },
          update: {
            status: platform === "INTERNAL" ? "PUBLISHED" : "PENDING",
            publishedAt: platform === "INTERNAL" ? new Date() : null,
            fee: platform === "INTERNAL" ? 0 : 75, // 75 agorot = ₪0.75
          },
          create: {
            listingId: id,
            platform,
            status: platform === "INTERNAL" ? "PUBLISHED" : "PENDING",
            publishedAt: platform === "INTERNAL" ? new Date() : null,
            fee: platform === "INTERNAL" ? 0 : 75,
            feePaid: platform === "INTERNAL",
          },
        })
      )
    );

    return NextResponse.json({
      listing: { id, status: "ACTIVE" },
      publications,
    });
  } catch (error) {
    console.error("Publish error:", error);
    return NextResponse.json(
      { error: "שגיאה בפרסום המודעה" },
      { status: 500 }
    );
  }
}
