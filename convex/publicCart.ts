import { query } from "convex/server";
import { v } from "convex/values";

export const hydrateGuest = query({
  args: {
    items: v.array(
      v.object({
        productId: v.id("products"),
        variantId: v.id("variants"),
        qty: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const rows = [];
    let subtotal = 0;

    for (const it of args.items) {
      const product = await ctx.db.get(it.productId);
      const variant = await ctx.db.get(it.variantId);
      if (!product || !variant || !product.active || !variant.active) continue;

      const label = [variant.attrs?.color, variant.attrs?.storage].filter(Boolean).join(" • ") || "Default";
      const lineTotal = variant.priceGhs * it.qty;
      subtotal += lineTotal;

      rows.push({
        productId: it.productId,
        variantId: it.variantId,
        qty: it.qty,
        title: product.title,
        subtitle: product.subtitle ?? null,
        image: product.images?.[0] ?? null,
        variantLabel: label,
        unitPriceGhs: variant.priceGhs,
        lineTotalGhs: lineTotal,
        stock: variant.stock,
      });
    }

    return { items: rows, subtotalGhs: subtotal };
  },
});