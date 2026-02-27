import { mutation, query } from "convex/server";
import { v } from "convex/values";
import { requireDbUser } from "./auth";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireDbUser(ctx);
    return await ctx.db.query("wishlists").withIndex("by_userId", (q) => q.eq("userId", user._id)).unique();
  },
});

export const getHydrated = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireDbUser(ctx);
    const wl = await ctx.db.query("wishlists").withIndex("by_userId", (q) => q.eq("userId", user._id)).unique();
    const ids = wl?.productIds ?? [];
    const products = [];
    for (const id of ids) {
      const p = await ctx.db.get(id);
      if (p && p.active) products.push(p);
    }
    return { products };
  },
});

export const toggle = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const user = await requireDbUser(ctx);
    const existing = await ctx.db.query("wishlists").withIndex("by_userId", (q) => q.eq("userId", user._id)).unique();
    const now = Date.now();
    if (!existing) {
      return await ctx.db.insert("wishlists", { userId: user._id, productIds: [args.productId], updatedAt: now });
    }
    const set = new Set(existing.productIds.map((id) => id));
    if (set.has(args.productId)) set.delete(args.productId);
    else set.add(args.productId);
    await ctx.db.patch(existing._id, { productIds: Array.from(set), updatedAt: now });
    return existing._id;
  },
});