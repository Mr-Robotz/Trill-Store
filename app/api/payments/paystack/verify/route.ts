import { NextResponse } from "next/server";
import { getPaymentProvider } from "../../../../../lib/payments/provider";


export async function POST(req: Request) {
  const body = await req.json();
  const { reference } = body as { reference: string };
  if (!reference) return NextResponse.json({ error: "Missing reference" }, { status: 400 });

  const provider = getPaymentProvider("paystack");
  const verified = await provider.verify(reference);

  return NextResponse.json({
    reference,
    status: verified.status, // success | failed | pending
  });
}