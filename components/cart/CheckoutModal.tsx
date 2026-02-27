"use client";

import * as React from "react";

import { AnimatePresence, motion } from "framer-motion";


import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "convex/react";

import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { Dialog, DialogContent } from "../ui/dialog";
import { genieOpen, modalBackdrop } from "../motion/Presets";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { SuccessModal } from "./SuccessModal";


const schema = z.object({
  phone: z.string().min(9, "Enter a valid MoMo number").max(15, "Enter a valid MoMo number"),
});

type FormValues = z.infer<typeof schema>;

export function CheckoutModal({
  open,
  onOpenChange,
  deliveryFeeGhsDefault = 30,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  deliveryFeeGhsDefault?: number;
}) {
  const cart = useQuery(api.cart.getHydrated, open ? {} : ("skip" as any));
  const clearCart = useMutation(api.cart.clear);

  const [loading, setLoading] = React.useState(false);
  const [successOpen, setSuccessOpen] = React.useState(false);
  const [receipt, setReceipt] = React.useState<any>(null);

  const settings = useQuery(api.settings.getPublic, {});
  

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { phone: "" },
  });

  const subtotal = cart?.subtotalGhs ?? 0;
  const deliveryFeeGhs = settings?.deliveryFeeGhs ?? 30;
  const total = subtotal + deliveryFeeGhs;

  async function pollVerify(reference: string, timeoutMs = 65000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const res = await fetch("/api/payments/paystack/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });
      const data = await res.json();
      if (data.status === "success") return { ok: true, data };
      if (data.status === "failed") return { ok: false, data };
      await new Promise((r) => setTimeout(r, 2000));
    }
    return { ok: false, data: { status: "pending" } };
  }

  const onSubmit = form.handleSubmit(async (values) => {
    if (!cart?.items?.length) return;

    setLoading(true);
    try {
      // Initiate Paystack charge
      const res = await fetch("/api/payments/paystack/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.items.map((i: any) => ({ productId: i.productId, variantId: i.variantId, qty: i.qty })),
          customerPhone: values.phone,
          deliveryFeeGhs,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "Failed to initiate payment");
      }

      const init = await res.json(); // { orderId, reference, amountGhs, next }
      // Poll verify
      const verified = await pollVerify(init.reference);

      if (!verified.ok) {
        throw new Error(
          verified.data?.status === "pending"
            ? "Payment pending. If you approved on phone, wait a bit and try again."
            : "Payment failed. Please try again."
        );
      }

      // Success UX: clear cart, show receipt
      await clearCart();
      setReceipt({
        orderId: init.orderId,
        reference: init.reference,
        amountGhs: init.amountGhs,
        phone: values.phone,
        deliveryFeeGhs,
        subtotalGhs: subtotal,
      });
      setSuccessOpen(true);
      onOpenChange(false);
      toast.success("Payment confirmed. Order placed.");
    } catch (e: any) {
      // form.setError("phone", { message: e?.message ?? "Checkout error" });
      toast.error(e?.message ?? "Checkout error");
    } finally {
      setLoading(false);
    }
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <AnimatePresence>
          {open ? (
            <DialogContent className="p-0 border-0 bg-transparent shadow-none">
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center"
                variants={modalBackdrop}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <div className="absolute inset-0 bg-black/30" />
                <motion.div
                  variants={genieOpen}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="relative w-[94vw] max-w-lg glass rounded-md p-4"
                  style={{ transformOrigin: "bottom right" }}
                >
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold tracking-tight">Checkout</h2>
                    <p className="text-sm text-muted-foreground">Pay with MTN MoMo (Paystack). Approve the prompt on your phone.</p>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="glass rounded-md p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium">GHS {subtotal.toFixed(0)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-muted-foreground">Delivery</span>
                        <span className="font-medium">GHS {deliveryFeeGhs.toFixed(0)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
                        <span className="text-muted-foreground">Total</span>
                        <span className="text-base font-semibold">GHS {total.toFixed(0)}</span>
                      </div>
                    </div>

                    <form onSubmit={onSubmit} className="space-y-2">
                      <label className="text-sm font-medium">MTN MoMo number</label>
                      <Input className="h-10 rounded-md glass" placeholder="e.g. 024xxxxxxx" {...form.register("phone")} />
                      {form.formState.errors.phone?.message ? (
                        <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Enter the number that will receive the MoMo prompt.</p>
                      )}

                      <Button type="submit" className="w-full rounded-md" disabled={loading || !cart?.items?.length}>
                        {loading ? "Processing..." : "Pay with MTN MoMo"}
                      </Button>
                    </form>

                    <Button variant="outline" className="w-full rounded-md" onClick={() => onOpenChange(false)} disabled={loading}>
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            </DialogContent>
          ) : null}
        </AnimatePresence>
      </Dialog>

      <SuccessModal open={successOpen} onOpenChange={setSuccessOpen} receipt={receipt} />
    </>
  );
}