"use client";

import * as React from "react";

import { AnimatePresence, motion } from "framer-motion";

import { useUser } from "@clerk/nextjs";

import { useMutation, useQuery } from "convex/react";

import { CartLineItem } from "./CartLineItem";
import { CheckoutModal } from "./CheckoutModal";
import { api } from "../../convex/_generated/api";
import { loadGuestCart, saveGuestCart } from "../../lib/storage/guestCart";
import { Sheet, SheetContent } from "../ui/sheet";
import { sheetRight } from "../motion/Presets";
import { Button } from "../ui/button";

export function CartSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { isSignedIn } = useUser();

  // Signed-in cart
  const cart = useQuery(api.cart.getHydrated, isSignedIn ? {} : ("skip" as any));
  const upsert = useMutation(api.cart.upsertItem);
  const remove = useMutation(api.cart.removeItem);

  // Guest cart local state
  const [guestItems, setGuestItems] = React.useState(() => loadGuestCart());
  React.useEffect(() => {
    if (!isSignedIn) setGuestItems(loadGuestCart());
  }, [isSignedIn, open]);

  // Hydrate guest cart from Convex (public)
  const guestHydrated = useQuery(
    api.publicCart.hydrateGuest,
    !isSignedIn && open && guestItems.length
      ? {
          items: guestItems.map((i) => ({
            productId: i.productId as any,
            variantId: i.variantId as any,
            qty: i.qty,
          })),
        }
      : ("skip" as any)
  );

  const [checkoutOpen, setCheckoutOpen] = React.useState(false);

  const signedCount = cart?.items?.reduce((a: number, i: any) => a + i.qty, 0) ?? 0;
  const guestCount = guestItems.reduce((a, i) => a + i.qty, 0);
  const count = isSignedIn ? signedCount : guestCount;

  const subtotal = isSignedIn ? (cart?.subtotalGhs ?? 0) : (guestHydrated?.subtotalGhs ?? 0);

  const incGuest = (variantId: string) => {
    const next = [...guestItems];
    const idx = next.findIndex((x) => x.variantId === variantId);
    if (idx >= 0) next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
    saveGuestCart(next);
    setGuestItems(next);
  };

  const decGuest = (variantId: string) => {
    const next = [...guestItems];
    const idx = next.findIndex((x) => x.variantId === variantId);
    if (idx >= 0) {
      const q = next[idx].qty - 1;
      if (q <= 0) next.splice(idx, 1);
      else next[idx] = { ...next[idx], qty: q };
    }
    saveGuestCart(next);
    setGuestItems(next);
  };

  const delGuest = (variantId: string) => {
    const next = guestItems.filter((x) => x.variantId !== variantId);
    saveGuestCart(next);
    setGuestItems(next);
  };

  const inc = async (row: any) => upsert({ productId: row.productId, variantId: row.variantId, qtyDelta: 1 });
  const dec = async (row: any) => upsert({ productId: row.productId, variantId: row.variantId, qtyDelta: -1 });
  const del = async (row: any) => remove({ variantId: row.variantId });

  const signedRows = cart?.items ?? [];
  const guestRows = guestHydrated?.items ?? [];

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="p-0 border-0 bg-transparent shadow-none">
          <AnimatePresence>
            {open ? (
              <motion.div
                variants={sheetRight}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="h-dvh w-[92vw] max-w-md ml-auto glass"
                style={{ transformOrigin: "right center" }}
              >
                <div className="p-4 h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-semibold tracking-tight">Cart</div>
                    <div className="text-sm text-muted-foreground">{count} items</div>
                  </div>

                  <div className="mt-4 flex-1 overflow-auto space-y-4 pr-1">
                    {isSignedIn ? (
                      signedRows.length ? (
                        signedRows.map((row: any) => (
                          <CartLineItem
                            key={row.variantId}
                            item={row}
                            onInc={() => inc(row)}
                            onDec={() => dec(row)}
                            onRemove={() => del(row)}
                          />
                        ))
                      ) : (
                        <div className="glass rounded-md p-4 text-sm text-muted-foreground">Your cart is empty.</div>
                      )
                    ) : guestRows.length ? (
                      guestRows.map((row: any) => (
                        <CartLineItem
                          key={row.variantId}
                          item={row}
                          onInc={() => incGuest(row.variantId)}
                          onDec={() => decGuest(row.variantId)}
                          onRemove={() => delGuest(row.variantId)}
                        />
                      ))
                    ) : (
                      <div className="glass rounded-md p-4 text-sm text-muted-foreground">
                        Guest cart is empty. Add items from a product modal.
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-border/60 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-semibold">GHS {subtotal.toFixed(0)}</span>
                    </div>

                    <Button
                      className="w-full rounded-md"
                      disabled={!isSignedIn || !(signedRows.length)}
                      onClick={() => setCheckoutOpen(true)}
                    >
                      Checkout
                    </Button>

                    {!isSignedIn ? (
                      <div className="text-xs text-muted-foreground">
                        Sign in to checkout. Your guest cart merges automatically after login.
                      </div>
                    ) : null}

                    <Button variant="outline" className="w-full rounded-md" onClick={() => onOpenChange(false)}>
                      Continue shopping
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </SheetContent>
      </Sheet>

      <CheckoutModal open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </>
  );
}