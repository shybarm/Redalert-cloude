import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reportSchema = z.object({
  listingId: z.string(),
  flagType: z.enum(["COUNTERFEIT", "PROHIBITED", "FRAUD", "SPAM", "OTHER"]),
  reason: z.string().min(10, "נא לפרט את הסיבה (לפחות 10 תווים)"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = reportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message },
        { status: 400 }
      );
    }

    const { listingId, flagType, reason } = parsed.data;

    const flag = await prisma.safetyFlag.create({
      data: {
        listingId,
        reporterId: session.user.id,
        flagType,
        reason,
      },
    });

    // Auto-flag listing if multiple reports
    const flagCount = await prisma.safetyFlag.count({
      where: { listingId, isResolved: false },
    });

    if (flagCount >= 3) {
      await prisma.listing.update({
        where: { id: listingId },
        data: { status: "FLAGGED" },
      });
    }

    return NextResponse.json({ success: true, flagId: flag.id });
  } catch (error) {
    console.error("Report error:", error);
    return NextResponse.json({ error: "שגיאה בשליחת הדיווח" }, { status: 500 });
  }
}
