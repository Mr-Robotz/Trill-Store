import { internalMutation } from "convex/server";
import { v } from "convex/values";

export const markPaymentSuccessInternal = internalMutation({
  args: { reference: v.string(), raw: v.optional(v.any()) },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_reference", (q) => q.eq("reference", args.reference))
      .unique();
    if (!payment) return;

    // Idempotent: if already success, nothing to do
    if (payment.status === "success") return;

    const order = await ctx.db.get(payment.orderId);
    if (!order) return;

    const now = Date.now();

    // Mark payment success
    await ctx.db.patch(payment._id, { status: "success", raw: args.raw, updatedAt: now });

    // Mark order paid
    if (order.status !== "paid") {
      await ctx.db.patch(order._id, { status: "paid", updatedAt: now });
    }

    // STOCK: already reserved at order creation. Do NOT decrement here.
    // If you ever turn off reservation, you can add a conditional decrement.

    // Clear cart (optional UX)
    const cart = await ctx.db.query("carts").withIndex("by_userId", (q) => q.eq("userId", order.userId)).unique();
    if (cart) await ctx.db.patch(cart._id, { items: [], updatedAt: now });
  },
});

export const markPaymentFailedInternal = internalMutation({
  args: { reference: v.string(), raw: v.optional(v.any()) },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_reference", (q) => q.eq("reference", args.reference))
      .unique();
    if (!payment) return;

    // Idempotent
    if (payment.status === "failed") return;

    const order = await ctx.db.get(payment.orderId);
    const now = Date.now();

    await ctx.db.patch(payment._id, { status: "failed", raw: args.raw, updatedAt: now });

    if (order && order.status !== "failed") {
      await ctx.db.patch(order._id, { status: "failed", updatedAt: now });
    }

    // Restore stock if we reserved it
    if (order?.stockReserved) {
      for (const it of order.items) {
        const variant = await ctx.db.get(it.variantId);
        if (!variant) continue;
        await ctx.db.patch(variant._id, { stock: variant.stock + it.qty });
      }
      await ctx.db.patch(order._id, { stockReserved: false, updatedAt: now });
    }
  },
});