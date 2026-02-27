"use client";

import * as React from "react";

import { SignIn } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "../ui/dialog";
import { genieOpen, modalBackdrop } from "../motion/Presets";


export function AuthModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
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
                className="relative w-[92vw] max-w-md glass rounded-md p-4"
                style={{ transformOrigin: "top right" }}
              >
                <div className="mb-3">
                  <h2 className="text-lg font-semibold tracking-tight">Sign in</h2>
                  <p className="text-sm text-muted-foreground">Use your phone number OTP to continue.</p>
                </div>

                <SignIn
                  routing="hash"
                  appearance={{
                    elements: {
                      card: "bg-transparent shadow-none p-0",
                      footer: "hidden",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                      socialButtonsBlockButton: "hidden",
                      formButtonPrimary: "rounded-md",
                    },
                  }}
                />
              </motion.div>
            </motion.div>
          </DialogContent>
        ) : null}
      </AnimatePresence>
    </Dialog>
  );
}