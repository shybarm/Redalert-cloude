import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-01-28.clover",
  });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { listingId, type } = session.metadata || {};

    if (type === "micro-fee" && listingId) {
      // Mark external publications as paid
      await prisma.publication.updateMany({
        where: {
          listingId,
          platform: { not: "INTERNAL" },
          feePaid: false,
        },
        data: {
          feePaid: true,
          status: "PUBLISHED",
          publishedAt: new Date(),
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
