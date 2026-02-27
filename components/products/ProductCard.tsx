"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ProductDetailsModal } from "./ProductDetailsModal";
import { cn } from "../../lib/utils";

export function ProductCard({ product }: { product: any }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <motion.button
        layout
        onClick={() => setOpen(true)}
        className={cn("text-left glass rounded-md p-3 hover:shadow-sm transition-shadow")}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        style={{ transformOrigin: "center" }}
      >
        <div className="aspect-[4/3] rounded-md overflow-hidden bg-muted/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.images?.[0]} alt={product.title} className="h-full w-full object-cover" />
        </div>

        <div className="mt-3 space-y-1">
          <div className="text-sm font-medium leading-tight">{product.title}</div>
          <div className="text-xs text-muted-foreground line-clamp-1">{product.subtitle ?? " "}</div>
        </div>
      </motion.button>

      <ProductDetailsModal productId={product._id} open={open} onOpenChange={setOpen} />
    </>
  );
}