import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";

function toHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacSha512Hex(secret: string, message: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return toHex(sig);
}

async function verifySignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const hash = await hmacSha512Hex(secret, rawBody);
  return hash === signature;
}

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
  if (!webhookSecret) return new Response("Missing PAYSTACK_WEBHOOK_SECRET", { status: 500 });

  const signature = req.headers.get("x-paystack-signature");
  const rawBody = await req.text();

  const ok = await verifySignature(rawBody, signature, webhookSecret);
  if (!ok) return new Response("Invalid signature", { status: 400 });

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const reference = event?.data?.reference;
  if (!reference) return new Response("OK", { status: 200 });

  const verified = await verifyWithPaystack(reference);

  if (!verified.ok) {
    await ctx.runMutation(internal.webhookInternal.markPaymentFailedInternal, {
      reference,
      raw: { event, verify: verified.data },
    });
    return new Response("OK", { status: 200 });
  }

  const status = verified.data?.data?.status; // success | failed | abandoned | ...
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
  }

  return new Response("OK", { status: 200 });
});