import type { InitiatePaymentInput, InitiatePaymentResult, VerifyPaymentResult } from "./types";

const PAYSTACK_BASE = "https://api.paystack.co";

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function paystackInitiateMomo(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
  const secret = requireEnv("PAYSTACK_SECRET_KEY");

  // Paystack amount is in kobo/pesewas? For GHS, Paystack uses the smallest unit.
  // If you store whole GHS in DB, convert to pesewas by * 100.
  const amount = Math.round(input.amountGhs * 100);

  const res = await fetch(`${PAYSTACK_BASE}/charge`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount,
      email: input.customerEmail,
      currency: "GHS",
      reference: input.reference,
      mobile_money: {
        phone: input.customerPhone,
        provider: "MTN",
      },
      metadata: input.metadata ?? {},
    }),
  });

  const data = await res.json();
  if (!res.ok || data.status !== true) {
    throw new Error(data?.message ?? "Paystack charge failed");
  }

  return {
    provider: "paystack",
    reference: input.reference,
    status: "initiated",
    next: {
      type: "poll",
      displayText: "Approve the MoMo prompt on your phone. We’ll confirm automatically.",
    },
    raw: data,
  };
}

export async function paystackVerify(reference: string): Promise<VerifyPaymentResult> {
  const secret = requireEnv("PAYSTACK_SECRET_KEY");

  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const data = await res.json();
  if (!res.ok || data.status !== true) {
    return { provider: "paystack", reference, status: "failed", raw: data };
  }

  const status = data?.data?.status; // "success" | "failed" | "abandoned" | ...
  if (status === "success") return { provider: "paystack", reference, status: "success", raw: data };
  if (status === "failed" || status === "abandoned") return { provider: "paystack", reference, status: "failed", raw: data };
  return { provider: "paystack", reference, status: "pending", raw: data };
}