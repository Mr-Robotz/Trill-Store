import { httpAction } from "convex/server";
import { internal } from "../_generated/api";
import crypto from "crypto";

// Verify Paystack signature (x-paystack-signature = HMAC SHA512 over raw body)
function verifySignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const hash = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  return hash === signature;
}

// Optional: verify reference against Paystack verify endpoint too (extra safety)
async function verifyWithPaystack(reference: string) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) throw new Error("Missing PAYSTACK_SECRET_KEY in Convex env");

  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.status !== true) return { ok: false, data };
  return { ok: true, data };
}

export const paystackWebhook = httpAction(async (ctx, req) => {
  const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new Response("Missing PAYSTACK_WEBHOOK_SECRET", { status: 500 });
  }

  const signature = req.headers.get("x-paystack-signature");
  const rawBody = await req.text();

  if (!verifySignature(rawBody, signature, webhookSecret)) {
    return new Response("Invalid signature", { status: 400 });
  }

  let event: any = null;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const reference = event?.data?.reference;
  const eventType = event?.event;

  // We only act on known payment success events (Paystack may send various)
  if (!reference || !eventType) return new Response("OK", { status: 200 });

  // Extra safety: verify with Paystack
  const verified = await verifyWithPaystack(reference);

  // If verify fails, do not mark paid
  if (!verified.ok) {
    await ctx.runMutation(internal.webhookInternal.markPaymentFailedInternal, {
      reference,
      raw: { event, verify: verified.data },
    });
    return new Response("OK", { status: 200 });
  }

  const status = verified.data?.data?.status; // "success" | "failed" | "abandoned" | ...
  if (status === "success") {
    await ctx.runMutation(internal.webhookInternal.markPaymentSuccessInternal, {
      reference,
      raw: { event, verify: verified.data },
    });
  } else if (status === "failed" || status === "abandoned") {
    await ctx.runMutation(internal.webhookInternal.markPaymentFailedInternal, {
      reference,
      raw: { event, verify: verified.data },
    });
  } else {
    // pending -> do nothing
  }

  return new Response("OK", { status: 200 });
});