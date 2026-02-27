"use client";

import * as React from "react";
import { useUser } from "@clerk/nextjs";

import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { clearGuestCart, loadGuestCart } from "../../lib/storage/guestCart";


export function CartGuestMerge() {
  const { isSignedIn } = useUser();
  const merge = useMutation(api.cart.mergeGuestCart);
  const [did, setDid] = React.useState(false);

  React.useEffect(() => {
    if (!isSignedIn) {
      setDid(false);
      return;
    }
    if (did) return;

    const guest = loadGuestCart();
    if (!guest.length) {
      setDid(true);
      return;
    }

    (async () => {
      await merge({
        items: guest.map((i) => ({
          // Convex expects ids typed; these are strings but match ids
          productId: i.productId as any,
          variantId: i.variantId as any,
          qty: i.qty,
        })),
      });
      clearGuestCart();
      setDid(true);
    })();
  }, [isSignedIn, did, merge]);

  return null;
}