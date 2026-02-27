"use client";

import * as React from "react";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AnimatePresence, motion } from "framer-motion";
import { Dialog, DialogContent } from "../ui/dialog";
import { genieOpen, modalBackdrop } from "../motion/Presets";
import { Button } from "../ui/button";
import { Input } from "../ui/input";




const STATUSES = ["pending", "paid", "failed", "fulfilled"] as const;

export function AdminOrderModal({
  open,
  onOpenChange,
  orderId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orderId: string | null;
}) {
  const data = useQuery(
    api.orders.adminOrderById,
    open && orderId ? { orderId: orderId as any } : ("skip" as any),
  );
  const setStatus = useMutation(api.orders.adminSetStatus);
  const addNote = useMutation(api.orders.adminAddTrackingNote);
  const [note, setNote] = React.useState("");
  const [statusLabel, setStatusLabel] = React.useState("");

  const order = data?.order;
  const payment = data?.payment;
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
                className="relative w-[94vw] max-w-2xl glass rounded-md p-4"
                style={{ transformOrigin: "top center" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold tracking-tight">
                      Order
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Admin drill-down + status controls.
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
                  <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="glass rounded-md p-4 space-y-3">
                      <div className="text-sm font-medium">Summary</div>

                      <div className="text-sm space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Order ID
                          </span>
                          <span className="font-medium">{order._id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">User</span>
                          <span className="font-medium">
                            {user?.clerkId ?? "-"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status</span>
                          <span className="font-medium">{order.status}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total</span>
                          <span className="text-base font-semibold">
                            GHS {order.totalGhs.toFixed(0)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        {STATUSES.map((s) => (
                          <Button
                            key={s}
                            size="sm"
                            variant={order.status === s ? "default" : "outline"}
                            className="rounded-md"
                            onClick={() =>
                              setStatus({ orderId: order._id, status: s })
                            }
                          >
                            {s}
                          </Button>
                        ))}
                      </div>

                      {payment ? (
                        <div className="pt-3 border-t border-border/60 text-sm space-y-2">
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

                    <div className="glass rounded-md p-4">
                      <div className="text-sm font-medium">Items</div>
                      <div className="mt-3 space-y-2 text-sm">
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
                    </div>
                    <div className="glass rounded-md p-4">
                      <div className="text-sm font-medium">
                        Fulfillment / tracking notes
                      </div>

                      <div className="mt-3 space-y-2">
                        <Input
                          className="h-10 rounded-md glass"
                          placeholder="Optional status label (e.g. packed, shipped)"
                          value={statusLabel}
                          onChange={(e) => setStatusLabel(e.target.value)}
                        />
                        <Input
                          className="h-10 rounded-md glass"
                          placeholder="Add a note for the customer…"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                        />
                        <Button
                          className="rounded-md w-full"
                          onClick={async () => {
                            if (!order?._id || !note.trim()) return;
                            await addNote({
                              orderId: order._id,
                              note: note.trim(),
                              status: statusLabel.trim() || undefined,
                            });
                            setNote("");
                            setStatusLabel("");
                          }}
                          disabled={!note.trim()}
                        >
                          Add note
                        </Button>
                      </div>

                      <div className="mt-4 space-y-2 text-sm">
                        {(order?.trackingNotes ?? []).length ? (
                          (order.trackingNotes ?? [])
                            .slice()
                            .reverse()
                            .map((n: any, idx: number) => (
                              <div key={idx} className="glass rounded-md p-3">
                                <div className="text-xs text-muted-foreground">
                                  {new Date(n.at).toLocaleString()}
                                  {n.status ? ` • ${n.status}` : ""}
                                </div>
                                <div className="mt-1">{n.note}</div>
                              </div>
                            ))
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            No notes yet.
                          </div>
                        )}
                      </div>
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
