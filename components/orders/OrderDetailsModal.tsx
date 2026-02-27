"use client";

import * as React from "react";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Dialog, DialogContent } from "../ui/dialog";
import { AnimatePresence, motion } from "framer-motion";
import { genieOpen, modalBackdrop } from "../motion/Presets";
import { Button } from "../ui/button";


export function OrderDetailsModal({
  open,
  onOpenChange,
  orderId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orderId: string | null;
}) {
  const data = useQuery(
    api.orders.myOrderById,
    open && orderId ? { orderId: orderId as any } : ("skip" as any),
  );

  const order = data?.order;
  const payment = data?.payment;

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
                className="relative w-[94vw] max-w-lg glass rounded-md p-4"
                style={{ transformOrigin: "center" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold tracking-tight">
                      Order details
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Receipt-style summary and status.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="rounded-md"
                    onClick={() => onOpenChange(false)}
                  >
                    Close
                  </Button>
                </div>

                {!order ? (
                  <div className="mt-4 glass rounded-md p-4 text-sm text-muted-foreground">
                    Loading…
                  </div>
                ) : (
                  <>
                    <div className="mt-4 glass rounded-md p-3 text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Order</span>
                        <span className="font-medium">{order._id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <span className="font-medium">
                          {order.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created</span>
                        <span className="font-medium">
                          {new Date(order.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 mt-2 border-t border-border/60">
                        <span className="text-muted-foreground">Total</span>
                        <span className="text-base font-semibold">
                          GHS {order.totalGhs.toFixed(0)}
                        </span>
                      </div>
                      {payment ? (
                        <div className="pt-2 mt-2 border-t border-border/60 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Provider
                            </span>
                            <span className="font-medium">
                              {payment.provider}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Reference
                            </span>
                            <span className="font-medium">
                              {payment.reference}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Payment status
                            </span>
                            <span className="font-medium">
                              {payment.status}
                            </span>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-4 glass rounded-md p-3">
                      <div className="text-sm font-medium">Items</div>
                      <div className="mt-2 space-y-2 text-sm">
                        {order.items.map((it: any, idx: number) => (
                          <div key={idx} className="flex justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-medium truncate">
                                {it.title}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {it.variantLabel} • x{it.qty}
                              </div>
                            </div>
                            <div className="font-semibold whitespace-nowrap">
                              GHS {(it.unitPriceGhs * it.qty).toFixed(0)}
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Tracking notes */}
                      <div className="mt-4 glass rounded-md p-3">
                        <div className="text-sm font-medium">
                          Tracking notes
                        </div>
                        <div className="mt-2 space-y-2 text-sm">
                          {(order.trackingNotes ?? []).length ? (
                            (order.trackingNotes ?? [])
                              .slice()
                              .reverse()
                              .map((n: any, idx: number) => (
                                <div key={idx} className="glass rounded-md p-3">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="text-xs text-muted-foreground">
                                      {new Date(n.at).toLocaleString()}
                                      {n.status ? ` • ${n.status}` : ""}
                                    </div>
                                  </div>
                                  <div className="mt-1 text-sm">{n.note}</div>
                                </div>
                              ))
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              No updates yet.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button
                        className="rounded-md flex-1"
                        onClick={() => window.print()}
                      >
                        Print
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-md flex-1"
                        onClick={() => onOpenChange(false)}
                      >
                        Done
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          </DialogContent>
        ) : null}
      </AnimatePresence>
    </Dialog>
  );
}
