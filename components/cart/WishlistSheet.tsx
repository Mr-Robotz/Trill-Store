"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sheet, SheetContent } from "../ui/sheet";
import { sheetLeft } from "../motion/Presets";
import { ProductCard } from "../products/ProductCard";
import { Button } from "../ui/button";


export function WishlistSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { isSignedIn } = useUser();
  const hydrated = useQuery(api.wishlist.getHydrated, isSignedIn ? {} : ("skip" as any));
  const products = hydrated?.products ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="p-0 border-0 bg-transparent shadow-none">
        <AnimatePresence>
          {open ? (
            <motion.div
              variants={sheetLeft}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="h-dvh w-[92vw] max-w-md mr-auto glass"
              style={{ transformOrigin: "left center" }}
            >
              <div className="p-4 h-full flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold tracking-tight">Wishlist</div>
                  <div className="text-sm text-muted-foreground">{products.length} saved</div>
                </div>

                <div className="mt-4 flex-1 overflow-auto space-y-3 pr-1">
                  {!isSignedIn ? (
                    <div className="glass rounded-md p-4 text-sm text-muted-foreground">Sign in to use wishlist.</div>
                  ) : products.length ? (
                    <div className="grid grid-cols-2 gap-3">
                      {products.map((p: any) => (
                        <ProductCard key={p._id} product={p} />
                      ))}
                    </div>
                  ) : (
                    <div className="glass rounded-md p-4 text-sm text-muted-foreground">No saved products yet.</div>
                  )}
                </div>

                <div className="pt-4 border-t border-border/60">
                  <Button variant="outline" className="w-full rounded-md" onClick={() => onOpenChange(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  );
}