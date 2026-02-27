"use client";

import * as React from "react";

import { AnimatePresence, motion } from "framer-motion";


import { useQuery } from "convex/react";
import { Dialog, DialogContent } from "../ui/dialog";
import { genieOpen, modalBackdrop } from "../motion/Presets";
import { Button } from "../ui/button";


function pretty(obj: any) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

export function AdminPaymentModal({
  open,
  onOpenChange,
  paymentId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  paymentId: string | null;
}) {
  const data = useQuery(
    api.admin.paymentById,
    open && paymentId ? { paymentId: paymentId as any } : ("skip" as any)
  );

  const payment = data?.payment;
  const order = data?.order;
  const user = data?.user;

  return (
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
                className="relative w-[94vw] max-w-3xl glass rounded-md p-4"
                style={{ transformOrigin: "top center" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold tracking-tight">Payment details</h2>
                    <p className="text-sm text-muted-foreground">Reference + status + raw payload.</p>
                  </div>
                  <Button variant="outline" className="rounded-md" onClick={() => onOpenChange(false)}>
                    Close
                  </Button>
                </div>

                {!payment ? (
                  <div className="mt-4 glass rounded-md p-4 text-sm text-muted-foreground">Loading…</div>
                ) : (
                  <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="glass rounded-md p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Provider</span>
                        <span className="font-medium">{payment.provider}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Reference</span>
                        <span className="font-medium">{payment.reference}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <span className="font-medium">{payment.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount</span>
                        <span className="font-semibold">GHS {payment.amountGhs.toFixed(0)}</span>
                      </div>

                      <div className="pt-3 mt-3 border-t border-border/60 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Order</span>
                          <span className="font-medium">{order?._id ?? "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Order status</span>
                          <span className="font-medium">{order?.status ?? "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">User</span>
                          <span className="font-medium">{user?.clerkId ?? "-"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="glass rounded-md p-4">
                      <div className="text-sm font-medium">Raw payload</div>
                      <pre className="mt-3 text-xs overflow-auto max-h-[420px] glass rounded-md p-3">
                        {pretty(payment.raw)}
                      </pre>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          </DialogContent>
        ) : null}
      </AnimatePresence>
    </Dialog>
  );
}