"use client";

import { useEffect } from "react";
import { useUiStore } from "@/store/ui-store";

// The live experience is rendered as a full-screen overlay (see
// components/LiveOverlay.tsx, mounted in the (app) layout) so it can slide
// over any tab. This route exists so /live is a valid destination — e.g.
// the Stripe Checkout success_url in app/api/stripe/checkout/route.ts.
export default function LivePage() {
  const openLive = useUiStore((s) => s.openLive);

  useEffect(() => {
    openLive();
  }, [openLive]);

  return <div className="view" />;
}
