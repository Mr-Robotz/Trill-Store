import { mutation, query } from "convex/server";
import { v } from "convex/values";
import { requireDbUser } from "./auth";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireDbUser(ctx);
    return await ctx.db.query("carts").withIndex("by_userId", (q) => q.eq("userId", user._id)).unique();
  },
});

// Hydrate cart for UI (product + variant info)
export const getHydrated = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireDbUser(ctx);
    const cart = await ctx.db.query("carts").withIndex("by_userId", (q) => q.eq("userId", user._id)).unique();
    if (!cart) return { items: [], subtotalGhs: 0 };

    const rows = [];
    let subtotal = 0;

    for (const it of cart.items) {
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

// Set exact items (used by merge + some flows)
export const setItems = mutation({
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
    const user = await requireDbUser(ctx);
    const existing = await ctx.db.query("carts").withIndex("by_userId", (q) => q.eq("userId", user._id)).unique();
    if (!existing) {
      return await ctx.db.insert("carts", { userId: user._id, items: args.items, updatedAt: Date.now() });
    }
    await ctx.db.patch(existing._id, { items: args.items, updatedAt: Date.now() });
    return existing._id;
  },
});

export const upsertItem = mutation({
  args: {
    productId: v.id("products"),
    variantId: v.id("variants"),
    qtyDelta: v.number(), // can be + or -
  },
  handler: async (ctx, args) => {
    const user = await requireDbUser(ctx);
    const cart = await ctx.db.query("carts").withIndex("by_userId", (q) => q.eq("userId", user._id)).unique();

    const items = cart?.items ? [...cart.items] : [];
    const idx = items.findIndex((i) => i.variantId === args.variantId);

    if (idx >= 0) {
      const nextQty = items[idx].qty + args.qtyDelta;
      if (nextQty <= 0) items.splice(idx, 1);
      else items[idx] = { ...items[idx], qty: nextQty };
    } else if (args.qtyDelta > 0) {
      items.push({ productId: args.productId, variantId: args.variantId, qty: args.qtyDelta });
    }

    if (!cart) {
      await ctx.db.insert("carts", { userId: user._id, items, updatedAt: Date.now() });
      return;
    }
    await ctx.db.patch(cart._id, { items, updatedAt: Date.now() });
  },
});

export const removeItem = mutation({
  args: { variantId: v.id("variants") },
  handler: async (ctx, args) => {
    const user = await requireDbUser(ctx);
    const cart = await ctx.db.query("carts").withIndex("by_userId", (q) => q.eq("userId", user._id)).unique();
    if (!cart) return;
    const items = cart.items.filter((i) => i.variantId !== args.variantId);
    await ctx.db.patch(cart._id, { items, updatedAt: Date.now() });
  },
});

export const clear = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireDbUser(ctx);
    const cart = await ctx.db.query("carts").withIndex("by_userId", (q) => q.eq("userId", user._id)).unique();
    if (!cart) return;
    await ctx.db.patch(cart._id, { items: [], updatedAt: Date.now() });
  },
});

export const mergeGuestCart = mutation({
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
    const user = await requireDbUser(ctx);
    const cart = await ctx.db.query("carts").withIndex("by_userId", (q) => q.eq("userId", user._id)).unique();
    const existing = cart?.items ? [...cart.items] : [];

    const map = new Map<string, { productId: any; variantId: any; qty: number }>();
    for (const it of existing) map.set(it.variantId, { ...it });

    for (const g of args.items) {
      const cur = map.get(g.variantId);
      if (!cur) map.set(g.variantId, { ...g });
      else map.set(g.variantId, { ...cur, qty: cur.qty + g.qty });
    }

    const merged = Array.from(map.values()).filter((i) => i.qty > 0);

    if (!cart) {
      await ctx.db.insert("carts", { userId: user._id, items: merged, updatedAt: Date.now() });
      return;
    }
    await ctx.db.patch(cart._id, { items: merged, updatedAt: Date.now() });
  },
});