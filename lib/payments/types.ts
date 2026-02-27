export type PaymentProviderKey = "paystack" | "hubtel";

export type InitiatePaymentInput = {
  amountGhs: number;
  customerEmail: string; // Paystack needs email (can be synthetic if phone-only)
  customerPhone: string; // MTN MoMo number
  reference: string;
  metadata?: Record<string, any>;
};

export type InitiatePaymentResult = {
  provider: PaymentProviderKey;
  reference: string;
  status: "initiated";
  next: {
    type: "poll" | "redirect" | "ussd";
    authorizationUrl?: string;
    displayText?: string;
  };
  raw?: any;
};

export type VerifyPaymentResult = {
  provider: PaymentProviderKey;
  reference: string;
  status: "success" | "failed" | "pending";
  raw?: any;
};