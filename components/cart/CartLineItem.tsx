"use client";


import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "../ui/button";

export function CartLineItem({
  item,
  onInc,
  onDec,
  onRemove,
}: {
  item: {
    title: string;
    subtitle: string | null;
    image: string | null;
    variantLabel: string;
    qty: number;
    unitPriceGhs: number;
    lineTotalGhs: number;
    stock: number;
  };
  onInc: () => void;
  onDec: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex gap-3">
      <div className="h-14 w-14 rounded-md overflow-hidden bg-muted/40 shrink-0">
        {item.image ? <img src={item.image} alt={item.title} className="h-full w-full object-cover" /> : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-medium leading-tight truncate">{item.title}</div>
            <div className="text-xs text-muted-foreground truncate">{item.variantLabel}</div>
          </div>

          <div className="text-sm font-semibold whitespace-nowrap">GHS {item.lineTotalGhs.toFixed(0)}</div>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1 glass rounded-md px-1 h-9">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={onDec} aria-label="Decrease">
              <Minus className="h-4 w-4" />
            </Button>
            <div className="w-8 text-center text-sm">{item.qty}</div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-md"
              onClick={onInc}
              aria-label="Increase"
              disabled={item.qty >= item.stock}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="ghost" size="icon" className="rounded-md" onClick={onRemove} aria-label="Remove">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}