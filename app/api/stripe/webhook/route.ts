import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Stripe requires the raw request body to verify the signature, so this
// route cannot use the App Router's automatic JSON body parsing.
export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const liveShowId = session.metadata?.live_show_id;

    if (!userId || !liveShowId) {
      console.error("Checkout session completed without expected metadata", session.id);
      return NextResponse.json({ received: true });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("live_show_purchases").insert({
      user_id: userId,
      live_show_id: liveShowId,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id:
        typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null,
      amount_cents: session.amount_total ?? 0,
    });

    // Unique constraint on (user_id, live_show_id) makes this idempotent —
    // Stripe may redeliver the same event, and that's fine to ignore.
    if (error && error.code !== "23505") {
      console.error("Failed to record live show purchase", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
