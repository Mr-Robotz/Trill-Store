"use client";

import * as React from "react";

import { AnimatePresence, motion } from "framer-motion";


import { useQuery, useMutation } from "convex/react";

import { Heart } from "lucide-react";

import { useUser } from "@clerk/nextjs";
import { ProductCard } from "./ProductCard";
import { api } from "../../convex/_generated/api";
import { loadGuestCart, saveGuestCart } from "../../lib/storage/guestCart";
import { Dialog, DialogContent } from "../ui/dialog";
import { genieOpen, modalBackdrop } from "../motion/Presets";
import { Button } from "../ui/button";

export function ProductDetailsModal({
  productId,
  open,
  onOpenChange,
}: {
  productId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const product = useQuery(api.products.getById, open ? { productId: productId as any } : ("skip" as any));
  const variants = useQuery(api.products.variantsByProduct, product ? { productId: product._id } : ("skip" as any));
  const related = useQuery(
    api.products.related,
    product ? { productId: product._id, category: product.category, limit: 6 } : ("skip" as any)
  );

  const toggleWishlist = useMutation(api.wishlist.toggle);
  const upsertItem = useMutation(api.cart.upsertItem);
  const { isSignedIn } = useUser();

  const [variantId, setVariantId] = React.useState<string | null>(null);
  const chosen = (variants ?? []).find((v: any) => v._id === variantId) ?? (variants?.[0] ?? null);

  React.useEffect(() => {
    if (variants?.[0]?._id) setVariantId(variants[0]._id);
  }, [variants?.[0]?._id]);

  if (!product) return null;

  const price = chosen?.priceGhs ?? 0;
  const inStock = (chosen?.stock ?? 0) > 0;

  const addToCart = async () => {
    if (!chosen) return;
    if (!inStock) return;

    if (!isSignedIn) {
      const guest = loadGuestCart();
      const idx = guest.findIndex((i) => i.variantId === chosen._id);
      if (idx >= 0) guest[idx] = { ...guest[idx], qty: guest[idx].qty + 1 };
      else guest.push({ productId: product._id, variantId: chosen._id, qty: 1 });
      saveGuestCart(guest);
      onOpenChange(false);
      return;
    }

    await upsertItem({ productId: product._id, variantId: chosen._id, qtyDelta: 1 });
    onOpenChange(false);
  };

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="aspect-[4/3] rounded-md overflow-hidden bg-muted/40">
                      <img src={product.images?.[0]} alt={product.title} className="h-full w-full object-cover" />
                    </div>

                    <div className="glass rounded-md p-3 text-sm flex items-center justify-between">
                      <span className="text-muted-foreground">Availability</span>
                      <span className="font-medium">{inStock ? `In stock (${chosen?.stock ?? 0})` : "Out of stock"}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <h2 className="text-lg sm:text-xl font-semibold tracking-tight">{product.title}</h2>
                      <p className="text-sm text-muted-foreground">{product.subtitle ?? ""}</p>
                    </div>

                    <div className="text-base sm:text-lg font-semibold">GHS {price.toFixed(0)}</div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Variants</div>
                      <div className="flex flex-wrap gap-2">
                        {(variants ?? []).map((v: any) => {
                          const label = [v.attrs?.color, v.attrs?.storage].filter(Boolean).join(" • ") || v.sku;
                          const active = v._id === chosen?._id;
                          const disabled = v.stock <= 0;

                          return (
                            <button
                              key={v._id}
                              onClick={() => !disabled && setVariantId(v._id)}
                              className={`text-xs rounded-md px-3 h-8 glass ${
                                active ? "ring-2 ring-ring" : ""
                              } ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-accent/40"}`}
                              aria-disabled={disabled}
                              title={disabled ? "Out of stock" : "Select variant"}
                            >
                              {label}{disabled ? " • OOS" : ""}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button className="rounded-md" onClick={addToCart} disabled={!inStock}>
                        {inStock ? "Add to cart" : "Out of stock"}
                      </Button>

                      <Button
                        variant="outline"
                        className="rounded-md"
                        onClick={() => toggleWishlist({ productId: product._id })}
                        aria-label="Toggle wishlist"
                      >
                        <Heart className="h-4 w-4 mr-2" />
                        Wishlist
                      </Button>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Premium UI, compact spacing. Full specs editable in Admin.
                    </p>
                  </div>
                </div>

                {/* Related products */}
                <div className="mt-5">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Related</div>
                    <div className="text-xs text-muted-foreground">{product.category}</div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
                    {(related ?? []).map((p: any) => (
                      <ProductCard key={p._id} product={p} />
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </DialogContent>
        ) : null}
      </AnimatePresence>
    </Dialog>
  );
}