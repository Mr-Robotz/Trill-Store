"use client";

import * as React from "react";

import { AnimatePresence, motion } from "framer-motion";
import { Dialog, DialogContent } from "../ui/dialog";
import { genieOpen, modalBackdrop } from "../motion/Presets";
import { Button } from "../ui/button";


export function SuccessModal({
  open,
  onOpenChange,
  receipt,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  receipt: any;
}) {
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
                className="relative w-[94vw] max-w-md glass rounded-md p-4"
                style={{ transformOrigin: "center" }}
              >
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold tracking-tight">Payment successful</h2>
                  <p className="text-sm text-muted-foreground">Receipt summary</p>
                </div>

                <div className="mt-4 glass rounded-md p-3 text-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Order</span>
                    <span className="font-medium">{receipt?.orderId ?? "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Reference</span>
                    <span className="font-medium">{receipt?.reference ?? "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium">{receipt?.phone ?? "-"}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-border/60">
                    <span className="text-muted-foreground">Total</span>
                    <span className="text-base font-semibold">GHS {Number(receipt?.amountGhs ?? 0).toFixed(0)}</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button className="flex-1 rounded-md" onClick={() => onOpenChange(false)}>
                    Done
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 rounded-md"
                    onClick={() => {
                      // basic print
                      window.print();
                    }}
                  >
                    Print
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          </DialogContent>
        ) : null}
      </AnimatePresence>
    </Dialog>
  );
}