import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireDbUser, requireAdmin } from "./auth";

export const myOrders = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireDbUser(ctx);
    return await ctx.db.query("orders").withIndex("by_userId", (q) => q.eq("userId", user._id)).order("desc").take(50);
  },
});

export const createPending = mutation({
  args: {
    items: v.array(
      v.object({
        productId: v.id("products"),
        variantId: v.id("variants"),
        qty: v.number(),
      })
    ),
    customerPhone: v.string(),
    deliveryFeeGhs: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireDbUser(ctx);

    const hydrated = [];
    let subtotal = 0;

    // 1) Validate + price + STOCK GUARDRAIL
    for (const it of args.items) {
      const product = await ctx.db.get(it.productId);
      const variant = await ctx.db.get(it.variantId);

      if (!product || !variant || !variant.active || !product.active) throw new Error("Invalid item");
      if (it.qty <= 0) throw new Error("Invalid quantity");

      // Guardrail: must have stock NOW
      if (variant.stock < it.qty) {
        const label = [variant.attrs?.color, variant.attrs?.storage].filter(Boolean).join(" • ") || variant.sku;
        throw new Error(`Out of stock: ${product.title} (${label})`);
      }

      const variantLabel = [variant.attrs?.color, variant.attrs?.storage].filter(Boolean).join(" • ") || "Default";
      subtotal += variant.priceGhs * it.qty;

      hydrated.push({
        productId: it.productId,
        variantId: it.variantId,
        title: product.title,
        variantLabel,
        qty: it.qty,
        unitPriceGhs: variant.priceGhs,
      });
    }

    // 2) Reserve stock immediately (decrement now)
    for (const it of args.items) {
      const variant = await ctx.db.get(it.variantId);
      if (!variant) continue;
      const nextStock = variant.stock - it.qty;
      // second guard in case of race
      if (nextStock < 0) throw new Error("Stock changed. Please refresh cart and try again.");
      await ctx.db.patch(variant._id, { stock: nextStock });
    }

    const total = subtotal + args.deliveryFeeGhs;
    const now = Date.now();

    const orderId = await ctx.db.insert("orders", {
      userId: user._id,
      status: "pending",
      currency: "GHS",
      subtotalGhs: subtotal,
      deliveryFeeGhs: args.deliveryFeeGhs,
      totalGhs: total,
      items: hydrated,
      customerPhone: args.customerPhone,
      paymentId: undefined,
      stockReserved: true,
      createdAt: now,
      updatedAt: now,
    });

    return { orderId, amountGhs: total };
  },
});

export const adminSetStatus = mutation({
  args: { orderId: v.id("orders"), status: v.union(v.literal("pending"), v.literal("paid"), v.literal("failed"), v.literal("fulfilled")) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.orderId, { status: args.status, updatedAt: Date.now() });
  },
});

export const myOrderById = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const user = await requireDbUser(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order || order.userId !== user._id) return null;

    const payment = order.paymentId ? await ctx.db.get(order.paymentId) : null;
    return { order, payment };
  },
});

export const adminOrderById = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order) return null;
    const payment = order.paymentId ? await ctx.db.get(order.paymentId) : null;
    const user = await ctx.db.get(order.userId);
    return { order, payment, user };
  },
});

export const adminAddTrackingNote = mutation({
  args: {
    orderId: v.id("orders"),
    note: v.string(),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    const next = [
      ...(order.trackingNotes ?? []),
      { at: Date.now(), note: args.note, status: args.status },
    ];

    await ctx.db.patch(args.orderId, { trackingNotes: next, updatedAt: Date.now() });
  },
});

export const adminCancelOrder = mutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    // Only cancel if not paid
    if (order.status === "paid" || order.status === "fulfilled") throw new Error("Cannot cancel paid/fulfilled order");

    // Restore reserved stock
    if (order.stockReserved) {
      for (const it of order.items) {
        const variant = await ctx.db.get(it.variantId);
        if (!variant) continue;
        await ctx.db.patch(variant._id, { stock: variant.stock + it.qty });
      }
    }

    await ctx.db.patch(order._id, { status: "failed", stockReserved: false, updatedAt: Date.now() });
  },
});