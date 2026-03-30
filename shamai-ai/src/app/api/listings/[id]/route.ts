import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const listing = await prisma.listing.findUnique({
      where: { id, status: "ACTIVE" },
      include: {
        photos: { orderBy: { sortOrder: "asc" } },
        user: { select: { id: true, name: true, image: true, city: true } },
        category: true,
      },
    });

    if (!listing) {
      return NextResponse.json({ error: "מודעה לא נמצאה" }, { status: 404 });
    }

    return NextResponse.json(listing);
  } catch (error) {
    console.error("Get listing error:", error);
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

    const listing = await prisma.listing.findUnique({
      where: { id, userId: session.user.id },
    });

    if (!listing) {
      return NextResponse.json({ error: "מודעה לא נמצאה" }, { status: 404 });
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: body,
      include: { photos: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update listing error:", error);
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.listing.update({
      where: { id, userId: session.user.id },
      data: { status: "REMOVED" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete listing error:", error);
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
}
