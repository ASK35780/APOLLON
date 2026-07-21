import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

// Creates a Stripe Checkout session unlocking a single paywalled live show.
// The purchase row is only ever written by the webhook (app/api/stripe/webhook),
// once Stripe confirms payment — never here, to avoid trusting the client.
export async function POST(request: Request) {
  const { liveShowId } = (await request.json()) as { liveShowId?: string };
  if (!liveShowId) {
    return NextResponse.json({ error: "liveShowId is required" }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: liveShow, error } = await supabase
    .from("live_shows")
    .select("id, title, price_cents, artist:artists(name)")
    .eq("id", liveShowId)
    .single();

  if (error || !liveShow) {
    return NextResponse.json({ error: "Live show not found" }, { status: 404 });
  }

  const { data: existingPurchase } = await supabase
    .from("live_show_purchases")
    .select("id")
    .eq("live_show_id", liveShowId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingPurchase) {
    return NextResponse.json({ error: "Already unlocked" }, { status: 409 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  const artistName = Array.isArray(liveShow.artist) ? liveShow.artist[0]?.name : (liveShow.artist as { name: string } | null)?.name;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: user.email ?? undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: liveShow.price_cents,
          product_data: {
            name: liveShow.title,
            description: artistName ? `Live — ${artistName}` : "Accès au live",
          },
        },
      },
    ],
    metadata: {
      user_id: user.id,
      live_show_id: liveShow.id,
    },
    success_url: `${siteUrl}/live?unlocked=${liveShow.id}`,
    cancel_url: `${siteUrl}/live`,
  });

  return NextResponse.json({ url: session.url });
}
