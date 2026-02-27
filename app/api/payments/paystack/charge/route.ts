import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { api } from "../../../../../convex/_generated/api";
import { convexServer } from "../../../../../convex/server";
import { getPaymentProvider } from "../../../../../lib/payments/provider";

function makeReference(orderId: string) {
  return `ord_${orderId}_${Date.now()}`;
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { items, customerPhone, deliveryFeeGhs } = body as {
    items: { productId: string; variantId: string; qty: number }[];
    customerPhone: string;
    deliveryFeeGhs: number;
  };

  // 1) Create pending order in Convex
  const { orderId, amountGhs } = await convexServer.mutation(api.orders.createPending, {
    items,
    customerPhone,
    deliveryFeeGhs,
  });

  // 2) Initiate Paystack charge
  const providerKey = "paystack";
  const provider = getPaymentProvider(providerKey);
  const reference = makeReference(orderId);

  // Paystack requires email: if phone-only, use a synthetic placeholder tied to clerk id
  const customerEmail = `${userId}@phone.local`;

  const initiated = await provider.initiateMomo({
    amountGhs,
    customerEmail,
    customerPhone,
    reference,
    metadata: { orderId },
  });

  // 3) Record initiated payment in Convex
  await convexServer.mutation(api.payments.recordInitiated, {
    orderId,
    provider: initiated.provider,
    reference: initiated.reference,
    amountGhs,
    raw: initiated.raw,
  });

  return NextResponse.json({
    orderId,
    reference,
    amountGhs,
    next: initiated.next,
  });
}