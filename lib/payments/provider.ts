import type { InitiatePaymentInput, InitiatePaymentResult, PaymentProviderKey, VerifyPaymentResult } from "./types";
import { paystackInitiateMomo, paystackVerify } from "./paystack";

export function getPaymentProvider(key: PaymentProviderKey) {
  if (key === "paystack") {
    return {
      initiateMomo: (input: InitiatePaymentInput) => paystackInitiateMomo(input),
      verify: (reference: string) => paystackVerify(reference),
    };
  }
  // Hubtel stub (later)
  return {
    initiateMomo: async () => {
      throw new Error("Hubtel not implemented yet");
    },
    verify: async () => {
      throw new Error("Hubtel not implemented yet");
    },
  };
}