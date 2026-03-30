import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Stripe from "stripe";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-01-28.clover",
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
    }

    const { listingId, type } = await req.json();

    if (type === "micro-fee") {
      const checkoutSession = await getStripe().checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "ils",
              product_data: {
                name: "פרסום חיצוני",
                description: "פרסום המודעה בפלטפורמה חיצונית",
              },
              unit_amount: 75, // 75 agorot = ₪0.75
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/estimate/${listingId}/publish?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/estimate/${listingId}/publish?cancelled=true`,
        metadata: {
          listingId,
          userId: session.user.id,
          type: "micro-fee",
        },
      });

      return NextResponse.json({ sessionUrl: checkoutSession.url });
    }

    return NextResponse.json({ error: "סוג תשלום לא נתמך" }, { status: 400 });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "שגיאה ביצירת תשלום" },
      { status: 500 }
    );
  }
}
