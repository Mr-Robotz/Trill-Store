import { NextResponse } from "next/server";
import crypto from "crypto";
// import { convexServer } from "@/convex/server";
import { api } from "../../../../../convex/_generated/api";
import { getPaymentProvider } from "../../../../../lib/payments/provider";

// Verify Paystack signature using secret you set in env
function verifyPaystackSignature(rawBody: string, signature: string | null) {
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET;
  if (!secret) return false;
  if (!signature) return false;
  const hash = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  return hash === signature;
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!verifyPaystackSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);

  // We care about successful charge/transaction
  const reference = event?.data?.reference;
  if (!reference) return NextResponse.json({ ok: true });

  const provider = getPaymentProvider("paystack");
  const verified = await provider.verify(reference);

  // NOTE: In a hardened setup, you'd use a Convex HTTP action for webhook writes.
  // Here we keep it simple: you’ll create a dedicated admin user and call an admin-only mutation
  // via a server-side service token pattern if needed.
  //
  // For now: return success and rely on polling verification in client flow.
  // (Phase 8 client flow includes polling fallback)

  return NextResponse.json({ ok: true, verified });
}