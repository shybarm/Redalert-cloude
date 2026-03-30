import { NextResponse } from "next/server";
import { generateSignedUploadParams } from "@/lib/utils/cloudinary";

export async function POST() {
  try {
    const params = await generateSignedUploadParams();
    return NextResponse.json(params);
  } catch (error) {
    console.error("Upload params error:", error);
    return NextResponse.json(
      { error: "שגיאה ביצירת פרמטרי העלאה" },
      { status: 500 }
    );
  }
}
