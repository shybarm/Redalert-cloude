import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: {
          orderBy: { sortOrder: "asc" },
        },
        _count: {
          select: {
            listings: { where: { status: "ACTIVE" } },
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Categories error:", error);
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
}
