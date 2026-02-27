import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./auth";

const KEY = "global";

export const getPublic = query({
  args: {},
  handler: async (ctx) => {
    const s = await ctx.db.query("settings").withIndex("by_key", (q) => q.eq("key", KEY)).unique();
    if (!s) {
      // default if not initialized
      return { deliveryFeeGhs: 30 };
    }
    return { deliveryFeeGhs: s.deliveryFeeGhs };
  },
});

export const adminGet = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const s = await ctx.db.query("settings").withIndex("by_key", (q) => q.eq("key", KEY)).unique();
    if (!s) return { key: KEY, deliveryFeeGhs: 30 };
    return s;
  },
});

export const adminSetDeliveryFee = mutation({
  args: { deliveryFeeGhs: v.number() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const now = Date.now();
    const s = await ctx.db.query("settings").withIndex("by_key", (q) => q.eq("key", KEY)).unique();
    if (!s) {
      await ctx.db.insert("settings", { key: KEY, deliveryFeeGhs: args.deliveryFeeGhs, updatedAt: now });
      return;
    }
    await ctx.db.patch(s._id, { deliveryFeeGhs: args.deliveryFeeGhs, updatedAt: now });
  },
});